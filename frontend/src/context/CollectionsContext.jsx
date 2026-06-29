// src/context/CollectionsContext.jsx
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

const CollectionsContext = createContext(null);
const API = "http://localhost:5000";

// ── Community Collections (mock discover feed — not user-owned) ──────────────
const SAVED_KEY = "pch_saved_collections";
export const MOCK_COLLECTIONS = [];

function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

// ── Helper: ensure a Watchlist and Watched History exist in DB ───────────────
// Returns the UUID of the watchlist and history collections.
async function ensureDefaultCollections(username) {
  try {
    // 1. Load existing collections
    const res = await fetch(`${API}/api/collections/user/${username}`);
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();

    let watchlistId = data.find(c => c.title === "Watchlist")?.id || null;
    let historyId   = data.find(c => c.title === "Watched History")?.id || null;

    // 2. Create Watchlist if it doesn't exist
    if (!watchlistId) {
      const r = await fetch(`${API}/api/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, title: "Watchlist", isPublic: false }),
      });
      if (r.ok) {
        const created = await r.json();
        watchlistId = created.id;
      }
    }

    // 3. Create Watched History if it doesn't exist
    if (!historyId) {
      const r = await fetch(`${API}/api/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, title: "Watched History", isPublic: false }),
      });
      if (r.ok) {
        const created = await r.json();
        historyId = created.id;
      }
    }

    return { watchlistId, historyId };
  } catch (e) {
    console.error("ensureDefaultCollections failed:", e);
    return { watchlistId: null, historyId: null };
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function CollectionsProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const currentUsername = user?.preferredUsername ?? null;

  const [collections, setCollections] = useState([]);
  const [savedCollectionIds, setSavedCollectionIds] = useState(loadSaved);

  // Store watchlist/history DB IDs so we never have to look them up again
  const defaultIds = useRef({ watchlistId: null, historyId: null });

  // ── Load all collections from DB ──────────────────────────────────────────
  const loadCollections = useCallback(async () => {
    if (!isAuthenticated || !currentUsername) {
      setCollections([
        { id: "watchlist", name: "Watchlist", title: "Watchlist", isDefault: true, isPublic: false, items: [] },
        { id: "history",   name: "Watched History", title: "Watched History", isDefault: true, isPublic: false, items: [] },
      ]);
      return;
    }

    try {
      // 1. Make sure default collections exist in DB and get their IDs
      const { watchlistId, historyId } = await ensureDefaultCollections(currentUsername);
      defaultIds.current = { watchlistId, historyId };

      // 2. Fetch all collections (which now includes Watchlist & History with real UUIDs)
      const res = await fetch(`${API}/api/collections/user/${currentUsername}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();

      // 3. Format for the app — mark the two defaults
      const loaded = data.map(c => ({
        ...c,
        name: c.title,
        isDefault: c.title === "Watchlist" || c.title === "Watched History",
        items: (c.items || []).map(i => ({ ...i, watched: i.watched === true })),
      }));

      // 4. Sort: Watchlist first, then History, then the rest chronologically
      loaded.sort((a, b) => {
        if (a.title === "Watchlist") return -1;
        if (b.title === "Watchlist") return 1;
        if (a.title === "Watched History") return -1;
        if (b.title === "Watched History") return 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      setCollections(loaded);
    } catch (error) {
      console.error("Failed to load collections:", error);
      setCollections([
        { id: "watchlist", name: "Watchlist", title: "Watchlist", isDefault: true, isPublic: false, items: [] },
        { id: "history",   name: "Watched History", title: "Watched History", isDefault: true, isPublic: false, items: [] },
      ]);
    }
  }, [isAuthenticated, currentUsername]);

  useEffect(() => { loadCollections(); }, [loadCollections]);

  // ── Optimistic local update (no more localStorage as source of truth) ──────
  const updateLocal = useCallback((updaterFn) => {
    setCollections(prev => updaterFn(prev));
  }, []);

  // ── Create collection ─────────────────────────────────────────────────────
  const createCollection = useCallback(async (name, opts = {}) => {
    if (!isAuthenticated || !currentUsername) return null;
    try {
      const res = await fetch(`${API}/api/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUsername,
          title: name.trim(),
          description: opts.description || "",
          coverImage: opts.coverImage || null,
          tags: opts.tags || [],
          isPublic: opts.isPublic === true,
        }),
      });
      if (res.ok) {
        const newCol = await res.json();
        const formatted = { ...newCol, name: newCol.title, isDefault: false, items: [] };
        updateLocal(prev => [...prev, formatted]);
        return formatted;
      }
    } catch (e) {
      console.error("createCollection failed:", e);
    }
    return null;
  }, [isAuthenticated, currentUsername, updateLocal]);

  // ── Update collection (name, description, coverImage, tags) ──────────────
  const updateCollection = useCallback(async (colId, updates) => {
    // Optimistic
    updateLocal(prev => prev.map(c => c.id === colId ? { ...c, ...updates, name: updates.title ?? c.name } : c));
    try {
      await fetch(`${API}/api/collections/${colId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.error("updateCollection failed:", e);
      loadCollections(); // revert on error
    }
  }, [updateLocal, loadCollections]);

  // ── Toggle privacy ────────────────────────────────────────────────────────
  const togglePrivacy = useCallback(async (colId) => {
    const col = collections.find(c => c.id === colId);
    if (!col) return;
    const newIsPublic = !col.isPublic;
    updateLocal(prev => prev.map(c => c.id === colId ? { ...c, isPublic: newIsPublic } : c));
    try {
      await fetch(`${API}/api/collections/${colId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: newIsPublic }),
      });
    } catch (e) {
      console.error("togglePrivacy failed:", e);
      loadCollections();
    }
  }, [collections, updateLocal, loadCollections]);

  // ── Delete collection ─────────────────────────────────────────────────────
  const deleteCollection = useCallback(async (colId) => {
    const col = collections.find(c => c.id === colId);
    if (col?.isDefault) return; // cannot delete Watchlist / History
    updateLocal(prev => prev.filter(c => c.id !== colId));
    try {
      await fetch(`${API}/api/collections/${colId}`, { method: "DELETE" });
    } catch (e) {
      console.error("deleteCollection failed:", e);
      loadCollections();
    }
  }, [collections, updateLocal, loadCollections]);

  // ── Rename collection ─────────────────────────────────────────────────────
  const renameCollection = useCallback(async (colId, newName) => {
    updateLocal(prev => prev.map(c => (!c.isDefault && c.id === colId) ? { ...c, name: newName.trim(), title: newName.trim() } : c));
    try {
      await fetch(`${API}/api/collections/${colId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newName.trim() }),
      });
    } catch (e) {
      console.error("renameCollection failed:", e);
    }
  }, [updateLocal]);

  // ── Update cover ──────────────────────────────────────────────────────────
  const updateCollectionCover = useCallback(async (colId, coverImage) => {
    updateLocal(prev => prev.map(c => c.id === colId ? { ...c, coverImage } : c));
    try {
      await fetch(`${API}/api/collections/${colId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImage }),
      });
    } catch (e) {
      console.error("updateCollectionCover failed:", e);
    }
  }, [updateLocal]);

  // ── Add item to collection ────────────────────────────────────────────────
  const addToCollection = useCallback(async (colId, item) => {
    const mid = String(item.mediaId);
    // Optimistic update
    updateLocal(prev => prev.map(c => {
      if (c.id !== colId) return c;
      if (c.items.some(i => String(i.mediaId) === mid)) return c; // already there
      return { ...c, items: [...c.items, { ...item, mediaId: mid, watched: false, addedAt: new Date().toISOString() }] };
    }));
    try {
      await fetch(`${API}/api/collections/${colId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, mediaId: mid }),
      });
    } catch (e) {
      console.error("addToCollection failed:", e);
      loadCollections();
    }
  }, [updateLocal, loadCollections]);

  // ── Remove item from collection ───────────────────────────────────────────
  const removeFromCollection = useCallback(async (colId, mediaId) => {
    const mid = String(mediaId);
    updateLocal(prev => prev.map(c =>
      c.id === colId ? { ...c, items: c.items.filter(i => String(i.mediaId) !== mid) } : c
    ));
    try {
      await fetch(`${API}/api/collections/${colId}/items/${mid}`, { method: "DELETE" });
    } catch (e) {
      console.error("removeFromCollection failed:", e);
      loadCollections();
    }
  }, [updateLocal, loadCollections]);

  // ── Toggle watched in a specific collection (owner view in CollectionDetailPage) ──
  const toggleWatched = useCallback(async (colId, mediaId) => {
    const mid = String(mediaId);
    const col = collections.find(c => c.id === colId);
    const curItem = col?.items.find(i => String(i.mediaId) === mid);
    const nowWatched = curItem ? !curItem.watched : true;

    // Optimistic — flip in every collection that contains this media (consistent state)
    updateLocal(prev => prev.map(c => ({
      ...c,
      items: c.items.map(i => String(i.mediaId) === mid ? { ...i, watched: nowWatched } : i),
    })));

    try {
      await fetch(`${API}/api/collections/${colId}/items/${mid}/watched`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watched: nowWatched }),
      });
    } catch (e) {
      console.error("toggleWatched failed:", e);
      loadCollections();
    }
  }, [collections, updateLocal, loadCollections]);

  // ── Is watched globally (checks in-memory state — DB is source of truth) ──
  const isWatchedGlobally = useCallback((mediaId) => {
    const mid = String(mediaId);
    return collections.some(c => c.items.some(i => String(i.mediaId) === mid && i.watched));
  }, [collections]);

  // ── Toggle watched globally (from cinema/TV/music detail pages) ───────────
  const toggleWatchedGlobally = useCallback(async (item) => {
    const mid = String(item.mediaId);
    const currentlyWatched = collections.some(c => c.items.some(i => String(i.mediaId) === mid && i.watched));
    const nowWatched = !currentlyWatched;

    // Get history collection ID
    const historyCol = collections.find(c => c.title === "Watched History");
    const historyId = historyCol?.id;

    // Optimistic: flip watched flag everywhere this item exists
    updateLocal(prev => {
      let updated = prev.map(c => ({
        ...c,
        items: c.items.map(i => String(i.mediaId) === mid ? { ...i, watched: nowWatched } : i),
      }));

      // If marking as watched AND item isn't in any collection → add to history
      const inAny = prev.some(c => c.items.some(i => String(i.mediaId) === mid));
      if (!inAny && nowWatched && historyId) {
        updated = updated.map(c => c.id === historyId
          ? { ...c, items: [...c.items, { ...item, mediaId: mid, watched: true, addedAt: new Date().toISOString() }] }
          : c
        );
      }
      return updated;
    });

    try {
      // For every collection containing this item, sync the watched flag
      const containingCols = collections.filter(c => c.items.some(i => String(i.mediaId) === mid));
      await Promise.all(containingCols.map(c =>
        fetch(`${API}/api/collections/${c.id}/items/${mid}/watched`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watched: nowWatched }),
        })
      ));

      // If newly watched and not in any collection → add to history
      const inAny = collections.some(c => c.items.some(i => String(i.mediaId) === mid));
      if (!inAny && nowWatched && historyId) {
        await fetch(`${API}/api/collections/${historyId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...item, mediaId: mid, watched: true }),
        });
      }
    } catch (e) {
      console.error("toggleWatchedGlobally failed:", e);
      loadCollections();
    }
  }, [collections, updateLocal, loadCollections]);

  // ── Watchlist helpers ─────────────────────────────────────────────────────
  const isInWatchlist = useCallback((mediaId) => {
    const wl = collections.find(c => c.title === "Watchlist");
    return wl?.items.some(i => String(i.mediaId) === String(mediaId)) ?? false;
  }, [collections]);

  const toggleWatchlist = useCallback(async (item) => {
    const wl = collections.find(c => c.title === "Watchlist");
    if (!wl) return;
    const mid = String(item.mediaId);
    const inWl = wl.items.some(i => String(i.mediaId) === mid);
    if (inWl) {
      await removeFromCollection(wl.id, mid);
    } else {
      await addToCollection(wl.id, item);
    }
  }, [collections, addToCollection, removeFromCollection]);

  // ── Get collections for a specific media item ─────────────────────────────
  const getCollectionsForMedia = useCallback((mediaId) => {
    return collections.filter(c =>
      c.title !== "Watched History" && c.items.some(i => String(i.mediaId) === String(mediaId))
    );
  }, [collections]);

  // ── Community collections (saved/bookmarked public collections) ───────────
  const toggleSaveCollection = useCallback((colId) => {
    setSavedCollectionIds(prev => {
      const next = prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId];
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const watchlist = collections.find(c => c.title === "Watchlist") ??
    { id: "watchlist", name: "Watchlist", title: "Watchlist", isDefault: true, items: [] };

  return (
    <CollectionsContext.Provider value={{
      collections: collections.filter(c => c.title !== "Watched History"),
      watchlist,
      loadCollections,
      createCollection,
      updateCollection,
      togglePrivacy,
      deleteCollection,
      renameCollection,
      updateCollectionCover,
      addToCollection,
      removeFromCollection,
      toggleWatched,
      isInWatchlist,
      getCollectionsForMedia,
      toggleWatchlist,
      isWatchedGlobally,
      toggleWatchedGlobally,
      savedCollectionIds,
      toggleSaveCollection,
    }}>
      {children}
    </CollectionsContext.Provider>
  );
}

export function useCollections() {
  const ctx = useContext(CollectionsContext);
  if (!ctx) throw new Error("useCollections must be used within CollectionsProvider");
  return ctx;
}

// src/context/ClubsContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const API = import.meta.env.VITE_API_BASE_URL ?? "";
const ClubsContext = createContext(null);
const SAVED_KEY = "pch_saved_collections";

function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}


export function ClubsProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedCollectionIds, setSavedCollectionIds] = useState(loadSaved);

  const loadClubs = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch clubs from our new AWS backend!
      const response = await fetch(`${API}/api/clubs`);
      if (response.ok) {
        const data = await response.json();
        
        const formattedClubs = data.map(club => ({
          ...club,
          members: club.members.map(m => ({
            username: m.user.username,
            joinedAt: m.joinedAt,
            role: m.role
          })),
          feed: (club.ClubPost || []).map(p => ({
            id: p.id,
            author: p.author.username,
            content: p.content,
            timestamp: p.createdAt,
            likes: p.likes.map(l => l.user.username)
          })),
          discussions: (club.ClubDiscussion || []).map(d => ({
            id: d.id,
            title: d.title,
            content: d.content,
            author: d.author.username,
            timestamp: d.createdAt,
            replies: (d.replies || []).map(r => ({
              id: r.id,
              author: r.author.username,
              content: r.content,
              timestamp: r.createdAt,
              replies: (r.replies || []).map(subR => ({
                id: subR.id,
                author: subR.author.username,
                content: subR.content,
                timestamp: subR.createdAt
              }))
            }))
          }))
        }));
        
        setClubs(formattedClubs);
      } else {
        console.error("Failed to fetch clubs from AWS.");
      }
    } catch (error) {
      console.error("Error loading clubs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadClubs(); }, [loadClubs]);
  useEffect(() => { localStorage.setItem(SAVED_KEY, JSON.stringify(savedCollectionIds)); }, [savedCollectionIds]);

  const currentUsername = user?.preferredUsername ?? null;

  /* ── Club Queries ── */
  const getClubBySlug = useCallback((slug) => clubs.find((c) => c.slug === slug) ?? null, [clubs]);

  const isClubMember = useCallback(
    (clubId) => {
      if (!currentUsername) return false;
      const club = clubs.find((c) => c.id === clubId);
      if (!club) return false;
      return club.members.some((m) => m.username.toLowerCase() === currentUsername.toLowerCase());
    },
    [clubs, currentUsername]
  );

  const getUserRole = useCallback(
    (clubId) => {
      if (!currentUsername) return null;
      const club = clubs.find((c) => c.id === clubId);
      if (!club) return null;
      const member = club.members.find((m) => m.username.toLowerCase() === currentUsername.toLowerCase());
      return member?.role ?? null;
    },
    [clubs, currentUsername]
  );

  /* ── Collection Queries ── */
  const isCollectionSaved = useCallback((colId) => savedCollectionIds.includes(colId), [savedCollectionIds]);

  function saveCollection(colId) {
    if (!isAuthenticated || !currentUsername) return;
    setSavedCollectionIds((prev) => prev.includes(colId) ? prev : [...prev, colId]);
  }

  function unsaveCollection(colId) {
    setSavedCollectionIds((prev) => prev.filter((id) => id !== colId));
  }

  function toggleSaveCollection(colId) {
    if (!isAuthenticated || !currentUsername) return;
    setSavedCollectionIds((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  }

  /* ── Club Mutations ── */
  const createClub = useCallback(async ({ name, description, category, coverImage }) => {
    if (!isAuthenticated || !currentUsername) return null;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    
    try {
      const response = await fetch(`${API}/api/clubs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          category,
          coverImage,
          createdBy: currentUsername
        })
      });

      if (response.ok) {
        // Reload all clubs from AWS
        await loadClubs();
        const data = await response.json();
        return data; // Return the newly created club
      }
    } catch (error) {
      console.error("Failed to create club on AWS", error);
    }
    return null;
  }, [isAuthenticated, currentUsername, loadClubs]);

  const joinClub = async (clubId) => {
    if (!isAuthenticated || !currentUsername) return false;

    try {
      const response = await fetch(`${API}/api/clubs/${clubId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUsername })
      });

      if (response.ok) {
        // Reload clubs from the database so the frontend is in sync
        await loadClubs();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to join club via API", error);
      return false;
    }
  };

  const leaveClub = async (clubId) => {
    if (!isAuthenticated || !currentUsername) return false;

    try {
      const response = await fetch(`${API}/api/clubs/${clubId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUsername })
      });

      if (response.ok) {
        await loadClubs();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to leave club via API", error);
      return false;
    }
  };


  const addPost = useCallback(async (clubId, content) => {
    if (!isAuthenticated || !currentUsername) return;
    try {
      const response = await fetch(`${API}/api/clubs/${clubId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, createdBy: currentUsername })
      });
      if (response.ok) {
        await loadClubs();
      }
    } catch (error) {
      console.error("Failed to add post", error);
    }
  }, [isAuthenticated, currentUsername, loadClubs]);

  const likePost = useCallback(async (clubId, postId) => {
    if (!isAuthenticated || !currentUsername) return;
    try {
      const response = await fetch(`${API}/api/clubs/${clubId}/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUsername })
      });
      if (response.ok) {
        await loadClubs();
      }
    } catch (error) {
      console.error("Failed to toggle like", error);
    }
  }, [isAuthenticated, currentUsername, loadClubs]);

  const addDiscussion = useCallback(async (clubId, title, content) => {
    if (!isAuthenticated || !currentUsername) return;
    try {
      const response = await fetch(`${API}/api/clubs/${clubId}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, createdBy: currentUsername })
      });
      if (response.ok) {
        await loadClubs();
      }
    } catch (error) {
      console.error("Failed to add discussion", error);
    }
  }, [isAuthenticated, currentUsername, loadClubs]);

  const addReply = useCallback(async (clubId, discussionId, content, parentId = null) => {
    if (!isAuthenticated || !currentUsername) return;
    try {
      const response = await fetch(`${API}/api/clubs/${clubId}/discussions/${discussionId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, createdBy: currentUsername, parentId })
      });
      if (response.ok) {
        await loadClubs();
      }
    } catch (error) {
      console.error("Failed to add reply", error);
    }
  }, [isAuthenticated, currentUsername, loadClubs]);

  const deletePost = useCallback(async (clubId, postId) => {
    if (!isAuthenticated || !currentUsername) return;
    try {
      const response = await fetch(`${API}/api/clubs/${clubId}/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUsername })
      });
      if (response.ok) await loadClubs();
    } catch (error) {
      console.error("Failed to delete post", error);
    }
  }, [isAuthenticated, currentUsername, loadClubs]);

  const deleteDiscussion = useCallback(async (clubId, discussionId) => {
    if (!isAuthenticated || !currentUsername) return;
    try {
      const response = await fetch(`${API}/api/clubs/${clubId}/discussions/${discussionId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUsername })
      });
      if (response.ok) await loadClubs();
    } catch (error) {
      console.error("Failed to delete discussion", error);
    }
  }, [isAuthenticated, currentUsername, loadClubs]);

  const deleteReply = useCallback(async (clubId, discussionId, replyId) => {
    if (!isAuthenticated || !currentUsername) return;
    try {
      const response = await fetch(`${API}/api/clubs/${clubId}/discussions/${discussionId}/replies/${replyId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUsername })
      });
      if (response.ok) await loadClubs();
    } catch (error) {
      console.error("Failed to delete reply", error);
    }
  }, [isAuthenticated, currentUsername, loadClubs]);

  return (
    <ClubsContext.Provider
      value={{
        clubs, getClubBySlug, isClubMember, getUserRole,
        createClub, joinClub, leaveClub,
        addPost, deletePost,
        likePost,
        addDiscussion, deleteDiscussion,
        addReply, deleteReply,
        savedCollectionIds, isCollectionSaved, saveCollection, unsaveCollection, toggleSaveCollection,
      }}
    >
      {children}
    </ClubsContext.Provider>
  );
}

export function useClubs() {
  const ctx = useContext(ClubsContext);
  if (!ctx) throw new Error("useClubs must be used inside ClubsProvider");
  return ctx;
}

// src/pages/CommunityPage.jsx
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useClubs } from "../context/ClubsContext";
import { useAuth } from "../context/AuthContext";
import { useCollections } from "../context/CollectionsContext";
import ImageUpload from "../components/ImageUpload";

import { API_BASE as API } from "../config.js";

const CLUB_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "movies", label: "Movies" },
  { key: "anime", label: "Anime" },
  { key: "music", label: "Music" },
  { key: "gaming", label: "Gaming" },
  { key: "general", label: "General" },
];

const COLLECTION_TAGS = [
  { key: "all", label: "All" },
  { key: "cinema", label: "Cinema" },
  { key: "music", label: "Music" },
  { key: "anime", label: "Anime" },
  { key: "horror", label: "Horror" },
  { key: "sci-fi", label: "Sci-Fi" },
  { key: "feel-good", label: "Feel Good" },
];

const COVER_OPTIONS = [
  "https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
  "https://image.tmdb.org/t/p/w1280/kzjISfaYVKXniRAMNOIKZdVRqJo.jpg",
  "https://image.tmdb.org/t/p/w1280/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  "https://image.tmdb.org/t/p/w1280/9E2y5Q7WlCVNEhP5GiVTjhEhx1o.jpg",
  "https://image.tmdb.org/t/p/w1280/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
  "https://image.tmdb.org/t/p/w1280/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg",
];

/* ── Shared Components ── */
function CategoryBadge({ category }) {
  const map = {
    movies: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    anime: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    music: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    gaming: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    general: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[category] || map.general}`}>
      {category}
    </span>
  );
}

function UserBubble({ username, size = "sm" }) {
  const colors = ["bg-violet-500", "bg-rose-500", "bg-emerald-500", "bg-sky-500", "bg-amber-500", "bg-fuchsia-500", "bg-teal-500"];
  const hash = [...username].reduce((a, c) => a + c.charCodeAt(0), 0);
  const cls = size === "xs" ? "h-5 w-5 text-[8px]" : size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  return (
    <div className={`grid ${cls} shrink-0 place-items-center rounded-full font-bold text-white ${colors[hash % colors.length]}`}>
      {username[0].toUpperCase()}
    </div>
  );
}

function MemberAvatars({ members, max = 4 }) {
  const shown = members.slice(0, max);
  const extra = members.length - max;
  const colors = ["bg-violet-500", "bg-rose-500", "bg-emerald-500", "bg-sky-500", "bg-amber-500", "bg-fuchsia-500"];
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((m, i) => (
        <div key={m.username} className={`grid h-7 w-7 place-items-center rounded-full border-2 border-[#0c0c12] text-[10px] font-bold text-white ${colors[i % colors.length]}`} title={m.username}>
          {m.username[0].toUpperCase()}
        </div>
      ))}
      {extra > 0 && (
        <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#0c0c12] bg-zinc-700 text-[10px] font-bold text-white">+{extra}</div>
      )}
    </div>
  );
}

/* ── Create Club Modal ── */
function CreateClubModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [coverImage, setCoverImage] = useState("");

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    onCreate({ name: name.trim(), description: description.trim(), category, coverImage: coverImage || COVER_OPTIONS[0] });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0c0c12] p-8 shadow-2xl shadow-black/60 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/[0.06] hover:text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-2xl font-black text-white tracking-tight">Create a Club</h2>
        <p className="mt-1.5 text-sm text-zinc-500">Build your own community around shared interests.</p>
        <form className="mt-7 space-y-5" onSubmit={handleCreate}>
          <div>
            <label className="block mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500" htmlFor="club-name">Club Name</label>
            <input id="club-name" className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sci-Fi Explorers" required maxLength={50} />
          </div>
          <div>
            <label className="block mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500" htmlFor="club-desc">Description</label>
            <textarea id="club-desc" className="input-field min-h-[80px] resize-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's your club about?" required maxLength={200} />
          </div>
          <div>
            <label className="block mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">Category</label>
            <div className="flex flex-wrap gap-2">
              {CLUB_CATEGORIES.filter((c) => c.key !== "all").map((c) => (
                <button key={c.key} type="button" onClick={() => setCategory(c.key)} className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${category === c.key ? "border-violet-500/40 bg-violet-500/10 text-violet-300" : "border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:border-white/[0.12] hover:text-zinc-300"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">Cover Image</label>
            <div className="mt-2">
              <ImageUpload
                currentImage={coverImage}
                onUploadComplete={setCoverImage}
                label="Upload Club Banner"
              />
            </div>
          </div>
          <button type="submit" className="btn-v w-full py-3 text-[15px] font-bold mt-2">Create Club</button>
        </form>
      </div>
    </div>
  );
}

const COMM_ACCENT_GRADIENTS = [
  { id: "violet",  from: "#7c3aed", to: "#4f46e5" },
  { id: "rose",    from: "#e11d48", to: "#f97316" },
  { id: "cyan",    from: "#0891b2", to: "#6366f1" },
  { id: "amber",   from: "#d97706", to: "#dc2626" },
  { id: "emerald", from: "#059669", to: "#0891b2" },
  { id: "pink",    from: "#db2777", to: "#9333ea" },
  { id: "slate",   from: "#334155", to: "#0f172a" },
  { id: "indigo",  from: "#4338ca", to: "#1e1b4b" },
];

/* ── Create Collection Modal (inline in community page) ── */
function CreateCollectionModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [coverImageUrl, setCoverImageUrl] = useState("");

  const TAG_OPTIONS = ["cinema", "music", "anime", "horror", "sci-fi", "feel-good", "drama", "comedy", "action"];

  function toggleTag(t) {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreate(name.trim(), { description: description.trim(), isPublic, coverImage: coverImageUrl || "", tags });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0c0c12] shadow-2xl shadow-black/60 animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header preview */}
        <div className="h-24 relative" style={{
          backgroundImage: coverImageUrl ? `url(${coverImageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: coverImageUrl ? undefined : "#18181f"
        }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c12]/60 to-transparent" />
          <p className="absolute bottom-3 left-5 text-white font-black text-lg tracking-tight drop-shadow">{name || "New Collection"}</p>
          <button onClick={onClose} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-black/30 text-white hover:bg-black/50 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form className="p-6 space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="block mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">Collection Name *</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Peak A24 Cinema" required maxLength={60} autoFocus />
          </div>
          <div>
            <label className="block mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">Description</label>
            <textarea className="input-field min-h-[60px] resize-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's the vibe?" maxLength={200} />
          </div>

          {/* Cover Image Upload Only */}
          <div>
            <label className="block mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">Cover Image</label>
            <ImageUpload
              currentImage={coverImageUrl}
              onUploadComplete={setCoverImageUrl}
              label="Upload Cover Image"
            />
          </div>

          <div>
            <label className="block mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">Tags</label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map(t => (
                <button key={t} type="button" onClick={() => toggleTag(t)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${tags.includes(t) ? "bg-violet-600 text-white" : "border border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:text-white"}`}
                >{t}</button>
              ))}
            </div>
          </div>

          {/* Public / Private toggle */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">{isPublic ? "Public Collection" : "Private Collection"}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{isPublic ? "Visible to everyone in Community" : "Only you can see this"}</p>
            </div>
            <button type="button" onClick={() => setIsPublic(v => !v)}
              style={{
                position: "relative", height: 24, width: 44, borderRadius: 12, flexShrink: 0, border: "none", cursor: "pointer",
                backgroundColor: isPublic ? "#7c3aed" : "#3f3f46",
                transition: "background-color 0.2s"
              }}>
              <span style={{
                position: "absolute", top: 2, left: isPublic ? 22 : 2, height: 20, width: 20,
                borderRadius: "50%", backgroundColor: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                transition: "left 0.2s", display: "block"
              }} />
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition">Cancel</button>
            <button type="submit" disabled={!name.trim()} className="flex-1 btn-v py-2.5 text-sm font-bold disabled:opacity-50">Create Collection</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Collection Detail Modal ── */
function CollectionModal({ collection, onClose }) {
  const items = collection.items || [];
  const creatorName = collection.user?.username || collection.createdBy || "Unknown";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0c0c12] shadow-2xl shadow-black/60 animate-scale-in modal-scroll" onClick={(e) => e.stopPropagation()}>
        {/* Header: Poster Mosaic */}
        <div className="relative h-52 overflow-hidden">
          {collection.coverImage ? (
            <img src={collection.coverImage} className="h-full w-full object-cover" alt="" />
          ) : items.length > 0 ? (
            <div className="absolute inset-0 flex">
              {items.slice(0, 4).map((item) => (
                <div key={item.mediaId} className="relative flex-1 overflow-hidden">
                  <img
                    src={item.posterPath?.startsWith("http") ? item.posterPath : `https://image.tmdb.org/t/p/w500${item.posterPath}`}
                    className="h-full w-full object-cover" alt="" />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-violet-900/40 to-zinc-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c12] via-[#0c0c12]/50 to-transparent" />
          <button onClick={onClose} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur-xl transition hover:bg-black/70">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-7 pb-7 -mt-8 relative">
          {/* Tags */}
          {(collection.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(collection.tags || []).map((t) => (
                <span key={t} className="tag text-[10px]">{t}</span>
              ))}
            </div>
          )}

          <h2 className="text-2xl font-black text-white tracking-tight">{collection.title || collection.name}</h2>
          {collection.description && (
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{collection.description}</p>
          )}

          {/* Creator */}
          <div className="mt-4 flex items-center gap-3">
            <UserBubble username={creatorName} />
            <div>
              <Link to={`/profile/${creatorName}`} className="text-sm font-bold text-white hover:text-violet-300 transition" onClick={onClose}>
                @{creatorName}
              </Link>
              <p className="text-[11px] text-zinc-600">{items.length} titles</p>
            </div>
          </div>

          {/* Items Grid */}
          {items.length > 0 ? (
            <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 gap-3">
              {items.map((item) => {
                const route = item.mediaType === "movie" ? `/cinema/${item.mediaId}` : `/tv/${item.mediaId}`;
                return (
                  <Link key={item.mediaId || item.id} to={route} className="group relative overflow-hidden rounded-xl bg-zinc-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/40" onClick={onClose}>
                    <div className="aspect-[2/3] overflow-hidden">
                      <img src={`https://image.tmdb.org/t/p/w342${item.posterPath}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt={item.title} />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2.5 pt-8 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <p className="text-xs font-bold text-white leading-tight truncate">{item.title}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] py-10 text-center">
              <p className="text-sm text-zinc-600">No items added yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ MAIN PAGE ═══════════════ */
export default function CommunityPage() {
  const { clubs, createClub, savedCollectionIds, toggleSaveCollection } = useClubs();
  const { isAuthenticated, user } = useAuth();
  const { createCollection, collections: myCollections } = useCollections();
  const navigate = useNavigate();

  const [section, setSection] = useState(() => {
    // Read ?tab=collections from URL on first render
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") === "collections" ? "collections" : "clubs";
  });
  const [colSubView, setColSubView] = useState("discover"); // discover | mine | saved
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTag, setActiveTag] = useState("all");
  const [showClubModal, setShowClubModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Real public collections from DB
  const [publicCollections, setPublicCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  const fetchPublicCollections = useCallback(async () => {
    setCollectionsLoading(true);
    try {
      const res = await fetch(`${API}/api/collections/public`);
      if (res.ok) setPublicCollections(await res.json());
    } catch (e) {
      console.error("Failed to load public collections", e);
    } finally {
      setCollectionsLoading(false);
    }
  }, []);

  // Always fetch public collections on mount so the count badge is correct
  useEffect(() => { fetchPublicCollections(); }, [fetchPublicCollections]);
  // Re-fetch whenever switching to collections tab
  useEffect(() => {
    if (section === "collections") fetchPublicCollections();
  }, [section, fetchPublicCollections]);

  // Handle deep link
  useEffect(() => {
    const colId = searchParams.get("collection");
    if (colId) {
      setSection("collections");
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const filteredClubs = activeCategory === "all" ? clubs : clubs.filter((c) => c.category === activeCategory);

  const currentUsername = user?.preferredUsername;
  // Discover = ALL public collections
  const discoverCollections = publicCollections;
  // Saved = public collections the user bookmarked
  const savedCollections = publicCollections.filter(c => savedCollectionIds.includes(c.id));

  const filteredCollections = activeTag === "all"
    ? publicCollections
    : publicCollections.filter((c) => (c.tags || []).includes(activeTag));

  async function handleCreateClub(data) {
    const newClub = await createClub(data);
    if (newClub) navigate(`/community/${newClub.slug}`);
  }

  async function handleCreateCollection(name, opts) {
    await createCollection(name, opts);
    setTimeout(fetchPublicCollections, 300);
    setShowCollectionModal(false);
  }

  return (
    <div className="min-h-screen bg-[#050507] pt-24 pb-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="animate-fade-up">
          <p className="eyebrow mb-2">Community</p>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            {section === "clubs" ? "Clubs" : "Collections"}
          </h1>
          <p className="mt-3 max-w-lg text-[15px] text-zinc-500">
            {section === "clubs"
              ? "Find your people. Join clubs built around the movies, anime, and music you love."
              : colSubView === "discover" ? "Explore public collections curated by the community."
              : colSubView === "mine" ? "Your personal watchlists and curated picks."
              : "Collections you have bookmarked."}
          </p>
        </div>

        {/* ── Section Toggle + Action Button ── */}
        <div className="mt-8 flex items-center justify-between gap-4 animate-fade-up stagger-1 flex-wrap">
          <div className="inline-flex rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1">
            {[
              { key: "clubs", label: "Clubs", icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z", count: clubs.length },
              { key: "collections", label: "Collections", icon: "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z", count: publicCollections.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => { 
                  setSection(tab.key); 
                  setActiveCategory("all"); 
                  setActiveTag("all"); 
                  setSearchParams({ tab: tab.key }, { replace: true });
                }}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  section === tab.key
                    ? "bg-violet-500/15 text-violet-300 shadow-inner shadow-violet-500/10"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
                {tab.label}
                <span className={`text-[11px] font-bold ${section === tab.key ? "text-violet-400/60" : "text-zinc-700"}`}>{tab.count}</span>
              </button>
            ))}
          </div>
          {/* Action button aligned with tabs */}
          {section === "clubs" ? (
            isAuthenticated ? (
              <button onClick={() => setShowClubModal(true)} className="btn-v gap-2 py-2.5 px-5 text-sm font-bold">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Create Club
              </button>
            ) : <Link to="/login" className="btn-ghost gap-2 py-2.5 px-5 text-sm">Sign in</Link>
          ) : (
            isAuthenticated ? (
              <button onClick={() => setShowCollectionModal(true)} className="btn-v gap-2 py-2.5 px-5 text-sm font-bold">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                New Collection
              </button>
            ) : <Link to="/login" className="btn-ghost gap-2 py-2.5 px-5 text-sm">Sign in</Link>
          )}
        </div>

        {/* ═══ CLUBS VIEW ═══ */}
        {section === "clubs" && (
          <>
            <div className="mt-6 flex flex-wrap gap-2 animate-fade-up stagger-2">
              {CLUB_CATEGORIES.map((c) => (
                <button key={c.key} onClick={() => setActiveCategory(c.key)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${activeCategory === c.key ? "bg-violet-500/15 text-violet-300 shadow-inner shadow-violet-500/10" : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300"}`}>
                  {c.label}
                  {c.key !== "all" && <span className="ml-1.5 text-xs opacity-60">{clubs.filter((cl) => cl.category === c.key).length}</span>}
                </button>
              ))}
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClubs.map((club, i) => (
                <Link key={club.id} to={`/community/${club.slug}`} className="group relative flex flex-col gap-3 animate-fade-up cursor-pointer" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-glow-violet transition-all duration-500 group-hover:shadow-glow-violet-strong group-hover:-translate-y-1">
                    <img src={club.coverImage} alt={club.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[17px] font-bold text-white tracking-tight group-hover:text-violet-400 transition-colors duration-200">{club.name}</h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500 font-medium">
                      <MemberAvatars members={club.members} max={3} />
                      <span>·</span>
                      <span>{club.members.length} {club.members.length === 1 ? "member" : "members"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {filteredClubs.length === 0 && (
              <div className="mt-20 text-center animate-fade-up">
                <p className="text-sm font-bold text-zinc-400">No clubs in this category yet</p>
                <p className="mt-1.5 text-xs text-zinc-600">Be the first to create one!</p>
              </div>
            )}
          </>
        )}

        {/* ═══ COLLECTIONS VIEW ═══ */}
        {section === "collections" && (
          <>
            {/* Sub-tab bar: Discover | My Collections | Saved */}
            <div className="mt-6 flex items-center gap-2 flex-wrap animate-fade-up stagger-2">
              {[
                { key: "discover", label: "Discover", icon: "M12 2a10 10 0 100 20A10 10 0 0012 2zm4.93 6.36l-2.18 6.53-6.53 2.18 2.18-6.53 6.53-2.18z" },
                { key: "mine",     label: "My Collections", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
                { key: "saved",    label: "Saved", icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" },
              ].map(tab => (
                <button key={tab.key} onClick={() => setColSubView(tab.key)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    colSubView === tab.key
                      ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                      : "text-zinc-500 border border-transparent hover:bg-white/[0.05] hover:text-zinc-300"
                  }`}>
                  <svg className="h-4 w-4" fill={tab.key === "saved" && colSubView === "saved" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
                  {tab.label}
                  {tab.key === "mine" && myCollections.length > 0 && <span className="text-[10px] font-bold text-zinc-600">{myCollections.length}</span>}
                  {tab.key === "saved" && savedCollections.length > 0 && <span className="text-[10px] font-bold text-zinc-600">{savedCollections.length}</span>}
                </button>
              ))}
            </div>

            {/* Tag filter only for discover */}
            {colSubView === "discover" && (
              <div className="mt-4 flex flex-wrap gap-2">
                {COLLECTION_TAGS.map((t) => (
                  <button key={t.key} onClick={() => setActiveTag(t.key)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${activeTag === t.key ? "bg-violet-500/15 text-violet-300" : "text-zinc-600 hover:text-zinc-300"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* ── DISCOVER VIEW ── */}
            {colSubView === "discover" && (
              collectionsLoading ? (
                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[16/9] rounded-2xl bg-white/[0.03] border border-white/[0.06]" />
                      <div className="pt-3 space-y-2">
                        <div className="h-4 w-2/3 rounded bg-white/[0.04]" />
                        <div className="h-3 w-1/2 rounded bg-white/[0.03]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {(activeTag === "all" ? discoverCollections : discoverCollections.filter(c => (c.tags||[]).includes(activeTag))).map((col, i) => {
                  const creatorName = col.createdBy || col.user?.username || "Unknown";
                  const items = col.items || [];
                  const gradient = col.coverImage?.startsWith("gradient:") ? col.coverImage.replace("gradient:", "").split("|") : null;
                  return (
                    <div
                      key={col.id}
                      className="group relative flex flex-col gap-3 animate-fade-up cursor-pointer"
                      style={{ animationDelay: `${i * 60}ms` }}
                      onClick={() => navigate(`/collection/${col.id}`)}
                    >
                      {/* Poster Mosaic or Cover Image */}
                      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-glow-violet transition-all duration-500 group-hover:shadow-glow-violet-strong group-hover:-translate-y-1">
                        {gradient ? (
                          <div className="h-full w-full transition-transform duration-500 group-hover:scale-105" style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }} />
                        ) : col.coverImage ? (
                          <img src={col.coverImage} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                        ) : items.length > 0 ? (
                          <div className="absolute inset-0 flex">
                            {items.slice(0, 4).map((item) => (
                              <div key={item.mediaId || item.id} className="relative flex-1 overflow-hidden">
                                <img
                                  src={item.posterPath?.startsWith("http") ? item.posterPath : `https://image.tmdb.org/t/p/w342${item.posterPath}`}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 to-zinc-900" />
                        )}

                        {/* ── SAVE BUTTON ── */}
                        {isAuthenticated && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleSaveCollection(col.id); }}
                            className={`absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold backdrop-blur-md border transition-all duration-200 shadow-lg ${
                              savedCollectionIds.includes(col.id)
                                ? "bg-violet-600 text-white border-violet-500 shadow-violet-900/40"
                                : "bg-black/50 text-zinc-300 border-white/10 hover:bg-violet-600/80 hover:text-white hover:border-violet-500"
                            }`}
                          >
                            <svg className="h-3.5 w-3.5" fill={savedCollectionIds.includes(col.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {savedCollectionIds.includes(col.id) ? "Saved" : "Save"}
                          </button>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-col">
                        <h3 className="text-[17px] font-bold text-white tracking-tight group-hover:text-violet-400 transition-colors duration-200">
                          {col.title || col.name}
                        </h3>
                        
                        <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500 font-medium">
                          <UserBubble username={creatorName} size="sm" linkTo={false} />
                          <span>·</span>
                          <span>{col.items?.length || 0} items</span>
                          <span>·</span>
                          <span>{(col.likeCount ?? col.likes?.length ?? 0)} likes</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              )
            )}

            {/* Discover empty state */}
            {colSubView === "discover" && !collectionsLoading && discoverCollections.length === 0 && (
              <div className="mt-20 text-center animate-fade-up">
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                  <svg className="h-7 w-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" /></svg>
                </div>
                <p className="text-sm font-bold text-zinc-400">No public collections yet</p>
                <p className="mt-1.5 text-xs text-zinc-600">{isAuthenticated ? "Create one and set it as Public!" : "Sign in to create one!"}</p>
                {isAuthenticated && (
                  <button onClick={() => setShowCollectionModal(true)} className="mt-4 btn-v gap-2 py-2.5 px-5 text-sm font-bold">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Create Collection
                  </button>
                )}
              </div>
            )}

            {/* ── MY COLLECTIONS VIEW ── */}
            {colSubView === "mine" && (
              myCollections.length === 0 ? (
                <div className="mt-20 text-center animate-fade-up">
                  <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                    <svg className="h-7 w-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <p className="text-sm font-bold text-zinc-400">No collections yet</p>
                  <p className="mt-1.5 text-xs text-zinc-600">Create your first collection to get started.</p>
                  <button onClick={() => setShowCollectionModal(true)} className="mt-4 btn-v gap-2 py-2.5 px-5 text-sm font-bold">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    New Collection
                  </button>
                </div>
              ) : (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {myCollections.map((col, i) => {
                    const isPublicBadge = col.isPublic;
                    const gradient = col.coverImage?.startsWith("gradient:") ? col.coverImage.replace("gradient:", "").split("|") : null;
                    return (
                      <div key={col.id} className="group relative flex flex-col gap-3 animate-fade-up cursor-pointer" style={{ animationDelay: `${i * 60}ms` }} onClick={() => navigate(`/collection/${col.id}`)}>
                        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-glow-violet transition-all duration-500 group-hover:shadow-glow-violet-strong group-hover:-translate-y-1">
                          {gradient ? (
                            <div className="h-full w-full transition-transform duration-500 group-hover:scale-105" style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }} />
                          ) : col.coverImage ? (
                            <img src={col.coverImage} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                          ) : (col.items||[]).length > 0 ? (
                            <div className="absolute inset-0 flex">
                              {(col.items||[]).slice(0,4).map(item => (
                                <div key={item.mediaId} className="relative flex-1 overflow-hidden">
                                  <img
                                    src={item.posterPath?.startsWith("http") ? item.posterPath : `https://image.tmdb.org/t/p/w342${item.posterPath}`}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                                </div>
                              ))}
                            </div>
                          ) : <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 to-zinc-900" />}
                          <div className="absolute top-3 right-3">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${isPublicBadge ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border border-zinc-700"}`}>
                              {isPublicBadge ? "Public" : "Private"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <h3 className="text-[17px] font-bold text-white tracking-tight group-hover:text-violet-400 transition-colors">{col.title || col.name}</h3>
                          <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500 font-medium">
                            <UserBubble username={currentUsername || "User"} size="sm" linkTo={false} />
                            <span>·</span>
                            <span>{(col.items||[]).length} {(col.items||[]).length === 1 ? "Item" : "Items"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* ── SAVED VIEW ── */}
            {colSubView === "saved" && (
              savedCollections.length === 0 ? (
                <div className="mt-20 text-center animate-fade-up">
                  <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                    <svg className="h-7 w-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  </div>
                  <p className="text-sm font-bold text-zinc-400">Nothing saved yet</p>
                  <p className="mt-1.5 text-xs text-zinc-600">Browse Discover and save collections you love.</p>
                  <button onClick={() => setColSubView("discover")} className="mt-4 btn-v gap-2 py-2.5 px-5 text-sm font-bold">Browse Discover</button>
                </div>
              ) : (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {savedCollections.map((col, i) => {
                    const items = col.items || [];
                    const creatorName = col.createdBy || col.user?.username || "Unknown";
                    const gradient = col.coverImage?.startsWith("gradient:") ? col.coverImage.replace("gradient:", "").split("|") : null;
                    return (
                      <div key={col.id} className="group relative flex flex-col gap-3 animate-fade-up cursor-pointer" style={{ animationDelay: `${i * 60}ms` }} onClick={() => navigate(`/collection/${col.id}`)}>
                        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-glow-violet transition-all duration-500 group-hover:shadow-glow-violet-strong group-hover:-translate-y-1">
                          {gradient ? (
                            <div className="h-full w-full transition-transform duration-500 group-hover:scale-105" style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }} />
                          ) : col.coverImage ? (
                            <img src={col.coverImage} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                          ) : items.length > 0 ? (
                            <div className="absolute inset-0 flex">
                              {items.slice(0,4).map(item => (
                                <div key={item.mediaId} className="relative flex-1 overflow-hidden">
                                  <img
                                    src={item.posterPath?.startsWith("http") ? item.posterPath : `https://image.tmdb.org/t/p/w342${item.posterPath}`}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                                </div>
                              ))}
                            </div>
                          ) : <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 to-zinc-900" />}
                          
                          {/* ── SAVE BUTTON ── */}
                          {isAuthenticated && (
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSaveCollection(col.id); }}
                              className={`absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold backdrop-blur-md border transition-all duration-200 shadow-lg ${
                                savedCollectionIds.includes(col.id)
                                  ? "bg-violet-600 text-white border-violet-500 shadow-violet-900/40"
                                  : "bg-black/50 text-zinc-300 border-white/10 hover:bg-violet-600/80 hover:text-white hover:border-violet-500"
                              }`}
                            >
                              <svg className="h-3.5 w-3.5" fill={savedCollectionIds.includes(col.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              {savedCollectionIds.includes(col.id) ? "Saved" : "Save"}
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <h3 className="text-[17px] font-bold text-white tracking-tight group-hover:text-violet-400 transition-colors">{col.title || col.name}</h3>
                          <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500 font-medium">
                            <UserBubble username={creatorName} size="sm" linkTo={false} />
                            <span>·</span>
                            <span>{items.length} {items.length === 1 ? "Item" : "Items"}</span>
                            <span>·</span>
                            <span>{(col.likeCount ?? col.likes?.length ?? 0)} {(col.likeCount ?? col.likes?.length ?? 0) === 1 ? "like" : "likes"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showClubModal && <CreateClubModal onClose={() => setShowClubModal(false)} onCreate={handleCreateClub} />}
      {showCollectionModal && (
        <CreateCollectionModal
          onClose={() => setShowCollectionModal(false)}
          onCreate={handleCreateCollection}
        />
      )}
    </div>
  );
}

// src/pages/CollectionDetailPage.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCollections } from "../context/CollectionsContext";
import { useClubs } from "../context/ClubsContext";

const API = "http://localhost:5000";
const IMG = "https://image.tmdb.org/t/p";

function timeAgo(d) {
  if (!d) return null;
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  if (s < 31536000) return `${Math.floor(s / 2592000)}mo ago`;
  return `${Math.floor(s / 31536000)}y ago`;
}

function isMusItem(it) { return it?.mediaType === "album" || it?.mediaType === "track"; }

function HeroCover({ coverImage, items }) {
  if (coverImage?.startsWith("gradient:")) {
    const [from, to] = coverImage.replace("gradient:", "").split("|");
    return <div className="absolute inset-0" style={{ background: `linear-gradient(135deg,${from},${to})` }} />;
  }
  if (coverImage) return <img src={coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />;
  if (items?.length > 0) {
    const previews = items.slice(0, 5);
    return (
      <div className="absolute inset-0 flex">
        {previews.map((it, i) => {
          const src = isMusItem(it) ? it.posterPath : `${IMG}/w780${it.posterPath}`;
          return src ? (
            <img key={i} src={src} alt="" className="flex-1 h-full object-cover" />
          ) : (
            <div key={i} className="flex-1 h-full bg-gradient-to-br from-violet-900/40 to-zinc-900" />
          );
        })}
      </div>
    );
  }
  return <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#1e1b4b,#0f172a)" }} />;
}

function Avatar({ username = "?" }) {
  const palette = ["#7c3aed","#e11d48","#059669","#0891b2","#d97706","#db2777","#0d9488"];
  const h = [...username].reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black text-white border-2 border-white/20"
      style={{ background: `linear-gradient(135deg,${palette[h%palette.length]},${palette[(h+2)%palette.length]})` }}>
      {username[0].toUpperCase()}
    </div>
  );
}

function TypeBadge({ mediaType }) {
  const m = { movie:"Movie", tv:"Show", anime:"Anime", album:"Album", track:"Track" };
  const c = { movie:"text-orange-400", tv:"text-sky-400", anime:"text-pink-400", album:"text-emerald-400", track:"text-violet-400" };
  return <span className={`text-[10px] font-bold uppercase tracking-wider ${c[mediaType]||"text-zinc-500"}`}>{m[mediaType]||mediaType}</span>;
}

function Skeleton() {
  return (
    <div className="min-h-screen bg-[#060608] animate-pulse">
      <div className="h-[44vh] bg-zinc-900/70" />
      <div className="mx-auto max-w-[1200px] px-6 py-8 flex gap-8">
        <div className="w-60 shrink-0 space-y-4">
          {[32, 80, 40, 36, 36].map((h, i) => <div key={i} style={{height: h}} className="rounded-xl bg-zinc-800/60 w-full" />)}
        </div>
        <div className="flex-1 space-y-6">
          <div className="h-8 w-56 rounded-xl bg-zinc-800" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({length:8}).map((_,i)=><div key={i} className="space-y-2"><div className="aspect-[2/3] rounded-xl bg-zinc-800"/><div className="h-3 w-3/4 rounded bg-zinc-800"/></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

const SORT_OPTS = [
  { key:"added",     label:"Recently Added" },
  { key:"az",        label:"A → Z" },
  { key:"za",        label:"Z → A" },
  { key:"year_desc", label:"Newest" },
  { key:"year_asc",  label:"Oldest" },
  { key:"unwatched", label:"Unwatched First" },
];

const SORT_OPTS_MUSIC = [
  { key:"added",        label:"Recently Added" },
  { key:"az",           label:"A → Z" },
  { key:"za",           label:"Z → A" },
  { key:"year_desc",    label:"Newest" },
  { key:"year_asc",     label:"Oldest" },
  { key:"albums_first", label:"Albums First" },
];

const TYPE_FILTERS = [
  { key:"all",   label:"All" },
  { key:"movie", label:"Movies" },
  { key:"tv",    label:"Shows" },
  { key:"anime", label:"Anime" },
  { key:"album", label:"Albums" },
];

export default function CollectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    collections: myCollections,
    toggleWatched,
    isWatchedGlobally,
    toggleWatchedGlobally,
    togglePrivacy,
    removeFromCollection,
    deleteCollection,
  } = useCollections();
  const { savedCollectionIds, toggleSaveCollection } = useClubs();

  const [collection, setCollection]   = useState(null);
  const [loading,    setLoading]      = useState(true);
  const [error,      setError]        = useState(null);
  const [isOwner,    setIsOwner]      = useState(false);

  const [sortBy,        setSortBy]        = useState("added");
  const [typeFilter,    setTypeFilter]    = useState("all");
  const [showSort,      setShowSort]      = useState(false);
  const [fadeWatched,   setFadeWatched]   = useState(false);
  const [compactView,   setCompactView]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [liked,        setLiked]        = useState(false);
  const [likeCount,    setLikeCount]    = useState(0);
  const [guestWatched, setGuestWatched] = useState(new Set());

  const currentUsername = user?.preferredUsername;

  /* ── Fetch ── */
  useEffect(() => {
    setLoading(true);
    setError(null);

    const own = myCollections.find(c => c.id === id);
    if (own) {
      // It's the current user's collection — use it directly
      setCollection(own);
      setIsOwner(true);
      setLoading(false);
      return;
    }

    // Fetch from API for public/other-user collections
    fetch(`${API}/api/collections/${id}`)
      .then(r => {
        if (!r.ok) throw Object.assign(new Error(), { status: r.status });
        return r.json();
      })
      .then(data => {
        setCollection(data);
        const creator = data.createdBy || data.user?.username || "";
        setIsOwner(!!currentUsername && creator.toLowerCase() === currentUsername.toLowerCase());
        setLoading(false);
      })
      .catch(e => {
        setError(e.status === 404 ? "Collection not found." : "Failed to load collection.");
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);  // intentionally run only when id changes

  /* ── Keep owner collection in sync with context ── */
  useEffect(() => {
    if (!isOwner) return;
    const own = myCollections.find(c => c.id === id);
    if (own) setCollection(own);
  }, [myCollections, id, isOwner]);

  /* ── Like init ── */
  useEffect(() => {
    if (!id) return;
    const ls = JSON.parse(localStorage.getItem("col_likes") || "{}");
    setLiked(!!ls[id]?.liked);
    setLikeCount(ls[id]?.count ?? Math.floor(Math.random() * 20 + 2));
  }, [id]);

  /* ── Guest-watched init ── */
  useEffect(() => {
    if (!id) return;
    const gw = JSON.parse(localStorage.getItem("col_guest_watched") || "{}");
    setGuestWatched(new Set(gw[id] || []));
  }, [id]);

  /* ── Handlers ── */
  function handleLike() {
    const ls = JSON.parse(localStorage.getItem("col_likes") || "{}");
    const next = !liked;
    const nc = next ? likeCount + 1 : Math.max(0, likeCount - 1);
    ls[id] = { liked: next, count: nc };
    localStorage.setItem("col_likes", JSON.stringify(ls));
    setLiked(next); setLikeCount(nc);
  }

  function handleToggleWatched(e, item) {
    e.preventDefault(); e.stopPropagation();

    if (!isAuthenticated) {
      // Not logged in → per-collection localStorage
      setGuestWatched(prev => {
        const next = new Set(prev);
        next.has(item.mediaId) ? next.delete(item.mediaId) : next.add(item.mediaId);
        const all = JSON.parse(localStorage.getItem("col_guest_watched") || "{}");
        all[id] = [...next];
        localStorage.setItem("col_guest_watched", JSON.stringify(all));
        return next;
      });
      return;
    }

    if (isOwner) {
      // Owner: toggle in this specific collection
      // (also propagates to isWatchedGlobally since context updates)
      toggleWatched(id, item.mediaId);
    } else {
      // Non-owner logged-in visitor: toggle globally
      // This adds/removes from their personal watched history
      toggleWatchedGlobally(item);
    }
  }

  /* ── Derived ── */
  const rawItems = collection?.items || [];

  /* ── Derive watched status ──
   *  • Logged-in user:  use isWatchedGlobally() — reflects movies they've
   *    marked watched ANYWHERE on the site (cinema page, TV page, etc.)
   *  • Guest (not logged in): use per-collection localStorage fallback
   */
  const itemsWithWatched = useMemo(() =>
    rawItems.map(item => ({
      ...item,
      watched: isAuthenticated
        ? isWatchedGlobally(item.mediaId)       // global state for logged-in
        : guestWatched.has(item.mediaId)         // localStorage for guests
    }))
  , [rawItems, isAuthenticated, isWatchedGlobally, guestWatched]);

  const watchedCount = itemsWithWatched.filter(i => i.watched).length;
  const pct = rawItems.length > 0 ? Math.round((watchedCount / rawItems.length) * 100) : 0;

  const availableTypes = useMemo(() => {
    const types = new Set(rawItems.map(i => i.mediaType).filter(Boolean));
    return TYPE_FILTERS.filter(f => f.key === "all" || types.has(f.key));
  }, [rawItems]);

  const processedItems = useMemo(() => {
    let r = [...itemsWithWatched];
    if (typeFilter !== "all") r = r.filter(i => i.mediaType === typeFilter);
    switch (sortBy) {
      case "az":           r.sort((a,b) => (a.title||"").localeCompare(b.title||"")); break;
      case "za":           r.sort((a,b) => (b.title||"").localeCompare(a.title||"")); break;
      case "year_desc":    r.sort((a,b) => Number(b.year||0)-Number(a.year||0)); break;
      case "year_asc":     r.sort((a,b) => Number(a.year||0)-Number(b.year||0)); break;
      case "unwatched":    r.sort((a,b) => Number(!!a.watched)-Number(!!b.watched)); break;
      case "albums_first": r.sort((a,b) => {
        const rank = t => t==="album" ? 0 : 1;
        return rank(a.mediaType) - rank(b.mediaType);
      }); break;
      default: break;
    }
    return r;
  }, [itemsWithWatched, typeFilter, sortBy]);

  /* ── Render ── */
  if (loading) return <Skeleton />;
  if (error) return (
    <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center gap-4">
      <p className="text-zinc-400 font-bold text-lg">{error}</p>
      <button onClick={() => navigate(-1)} className="text-sm text-zinc-500 hover:text-white transition px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5">← Go back</button>
    </div>
  );
  if (!collection) return null;

  const collectionTitle = collection.title || collection.name || "Untitled";
  const creatorName = collection.createdBy || collection.user?.username || currentUsername || "Unknown";
  const updatedAt = timeAgo(collection.updatedAt || collection.createdAt);
  const isSaved = savedCollectionIds.includes(id);

  // Detect if this is a music collection (any item is music, or title is known music default)
  const isMusicCollection = (collection.items || []).some(isMusItem);

  return (
    <div className="min-h-screen bg-[#060608]" onClick={() => setShowSort(false)}>

      {/* ═══════ HERO ═══════ */}
      <div className="relative h-[44vh] min-h-[320px] w-full overflow-hidden">
        <HeroCover coverImage={collection.coverImage} items={rawItems} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060608]/60 via-transparent to-transparent" />
        <button onClick={() => navigate(-1)}
          className="absolute top-5 left-5 sm:left-8 flex items-center gap-1.5 rounded-xl bg-black/50 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur-md border border-white/10 hover:bg-black/70 transition-all">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back
        </button>
      </div>

      {/* ═══════ BODY ═══════ */}
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 pb-20">
        <div className="flex gap-8 items-start">

          {/* ═══ SIDEBAR ═══ */}
          <aside className="hidden lg:flex flex-col gap-5 w-60 xl:w-64 shrink-0 sticky top-6 pt-6">
            {/* Header */}
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
              </svg>
              <span className="text-sm font-bold text-zinc-300">Filters</span>
            </div>

            {isMusicCollection ? (
              /* ── MUSIC SIDEBAR CARD ── */
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 space-y-4">
                {/* Stats */}
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">Collection Stats</p>
                  <div className="flex gap-3 mt-2">
                    <div className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-center">
                      <p className="text-lg font-black text-white leading-none">
                        {rawItems.filter(i => i.mediaType === "album").length}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-semibold">Albums</p>
                    </div>
                    <div className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-center">
                      <p className="text-lg font-black text-white leading-none">
                        {rawItems.filter(i => i.mediaType === "track").length}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-semibold">Tracks</p>
                    </div>
                  </div>
                </div>

                {/* Compact list toggle */}
                <div className="pt-1 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                      </svg>
                      <span className="text-[13px] font-semibold text-zinc-300">Compact list</span>
                    </div>
                    <button onClick={() => setCompactView(v => !v)}
                      style={{ position:"relative", height:22, width:40, borderRadius:11, flexShrink:0, cursor:"pointer", border:"none",
                        backgroundColor: compactView ? "#10b981" : "#27272a", transition:"background-color .2s" }}>
                      <span style={{ position:"absolute", top:2, left: compactView ? 20 : 2, height:18, width:18, borderRadius:"50%",
                        backgroundColor:"white", boxShadow:"0 1px 4px rgba(0,0,0,.4)", transition:"left .2s", display:"block" }} />
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-700 mt-1.5">Show as a scrollable list instead of grid</p>
                </div>
              </div>
            ) : (
              /* ── CINEMA SIDEBAR CARD ── */
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M4 8h11a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/>
                    </svg>
                    <span className="text-[13px] font-semibold text-zinc-300">Fade watched</span>
                  </div>
                  <button onClick={() => setFadeWatched(v => !v)}
                    style={{ position:"relative", height:22, width:40, borderRadius:11, flexShrink:0, cursor:"pointer", border:"none",
                      backgroundColor: fadeWatched ? "#7c3aed" : "#27272a", transition:"background-color .2s" }}>
                    <span style={{ position:"absolute", top:2, left: fadeWatched ? 20 : 2, height:18, width:18, borderRadius:"50%",
                      backgroundColor:"white", boxShadow:"0 1px 4px rgba(0,0,0,.4)", transition:"left .2s", display:"block" }} />
                  </button>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-zinc-600 font-medium">{watchedCount} / {rawItems.length} watched</span>
                    <span className="text-[11px] font-bold" style={{
                      background: pct===100 ? "linear-gradient(90deg,#10b981,#06b6d4)" : "linear-gradient(90deg,#7c3aed,#a855f7)",
                      WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"
                    }}>{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width:`${pct}%`, background: pct===100 ? "linear-gradient(90deg,#10b981,#06b6d4)" : "linear-gradient(90deg,#7c3aed,#a855f7)" }} />
                  </div>
                  {pct === 100 && (
                    <p className="mt-2 text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Complete!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Sort By */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">Sort By</p>
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowSort(v => !v)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] transition">
                  <span>{(isMusicCollection ? SORT_OPTS_MUSIC : SORT_OPTS).find(s => s.key === sortBy)?.label ?? "Recently Added"}</span>
                  <svg className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${showSort?"rotate-180":""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {showSort && (
                  <div className="absolute left-0 top-full mt-1.5 z-50 w-full rounded-xl border border-white/10 bg-[#0d0d12] shadow-2xl overflow-hidden">
                    {(isMusicCollection ? SORT_OPTS_MUSIC : SORT_OPTS).map(opt => (
                      <button key={opt.key} onClick={() => { setSortBy(opt.key); setShowSort(false); }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
                          sortBy===opt.key ? "bg-violet-500/15 text-violet-300" : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                        }`}>
                        {opt.label}
                        {sortBy===opt.key && <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">Content Type</p>
              <div className="flex flex-col gap-1.5">
                {availableTypes.map(f => (
                  <button key={f.key} onClick={() => setTypeFilter(f.key)}
                    className={`rounded-xl px-3.5 py-2 text-sm font-semibold text-left transition-all ${
                      typeFilter===f.key
                        ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                        : "text-zinc-500 border border-transparent hover:bg-white/[0.04] hover:text-zinc-300"
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ═══ MAIN ═══ */}
          <main className="flex-1 min-w-0 pt-6">

            {/* Collection info */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  {/* Title + badge */}
                  <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">{collectionTitle}</h1>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      collection.isPublic
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}>
                      {collection.isPublic ? "Public" : "Private"}
                    </span>
                  </div>

                  {/* Creator */}
                  <div className="flex items-center gap-2.5 mb-2">
                    <Avatar username={creatorName} />
                    <div>
                      <Link to={`/profile/${creatorName}`} className="text-sm font-semibold text-zinc-300 hover:text-white transition">
                        @{creatorName}
                      </Link>
                      <p className="text-xs text-zinc-600 flex items-center gap-1.5">
                        <span>{rawItems.length} {rawItems.length===1?"item":"items"}</span>
                        {updatedAt && <><span>·</span><span>Updated {updatedAt}</span></>}
                      </p>
                    </div>
                  </div>

                  {collection.description && (
                    <p className="text-sm text-zinc-500 leading-relaxed max-w-xl mb-2">{collection.description}</p>
                  )}
                  {(collection.tags||[]).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(collection.tags||[]).map(t => (
                        <span key={t} className="rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* Public/Private toggle — owner only */}
                  {isOwner && (
                    <button
                      onClick={() => togglePrivacy(id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold border transition-all ${
                        collection.isPublic
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25 hover:bg-red-500/15 hover:text-red-300 hover:border-red-500/25"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-emerald-500/15 hover:text-emerald-300 hover:border-emerald-500/25"
                      }`}
                    >
                      {collection.isPublic ? (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                          Public
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Private
                        </>
                      )}
                    </button>
                  )}

                  <button onClick={handleLike}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold border transition-all ${
                      liked ? "bg-rose-500/15 text-rose-300 border-rose-500/25"
                            : "text-zinc-400 border-white/10 hover:bg-rose-500/10 hover:text-rose-300"
                    }`}>
                    <svg className="h-4 w-4" fill={liked?"currentColor":"none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                    {likeCount}
                  </button>
                  {isAuthenticated && !isOwner && (
                    <button onClick={() => toggleSaveCollection(id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold border transition-all ${
                        isSaved ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-900/30"
                                : "text-zinc-400 border-white/10 hover:bg-violet-500/10 hover:text-violet-300"
                      }`}>
                      <svg className="h-4 w-4" fill={isSaved?"currentColor":"none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                      </svg>
                      {isSaved ? "Saved" : "Save"}
                    </button>
                  )}

                  {/* Delete collection — owner only, non-default */}
                  {isOwner && !collection.isDefault && (
                    confirmDelete ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-400">Delete?</span>
                        <button
                          onClick={async () => { await deleteCollection(id); navigate(-1); }}
                          className="rounded-xl px-3 py-2 text-xs font-black bg-rose-600 text-white border border-rose-500 hover:bg-rose-500 transition-all"
                        >Yes, delete</button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="rounded-xl px-3 py-2 text-xs font-bold text-zinc-400 border border-white/10 hover:bg-white/[0.06] transition-all"
                        >Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold border text-zinc-500 border-white/10 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        Delete
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Mobile progress bar */}
              {rawItems.length > 0 && (
                <div className="lg:hidden mt-4 flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width:`${pct}%`, background:"linear-gradient(90deg,#7c3aed,#a855f7)" }} />
                  </div>
                  <span className="text-xs font-bold text-zinc-500">{watchedCount}/{rawItems.length}</span>
                </div>
              )}
            </div>

            <div className="border-t border-white/[0.06] mb-5" />

            {/* Items */}
            {rawItems.length === 0 ? (
              <div className="flex flex-col items-center py-24 text-center">
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                  <svg className="h-6 w-6 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                  </svg>
                </div>
                <p className="text-zinc-500 font-bold">No items yet</p>
                {isOwner && <p className="mt-1 text-sm text-zinc-700">Browse Cinema or Music and add titles here.</p>}
              </div>
            ) : (
              <>
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-700 mb-4">
                  {processedItems.length} {processedItems.length===1?"title":"titles"}
                  {typeFilter!=="all" && ` · ${TYPE_FILTERS.find(f=>f.key===typeFilter)?.label}`}
                </p>

                {processedItems.length === 0 ? (
                  <p className="py-16 text-center text-zinc-600 font-semibold">
                    No {TYPE_FILTERS.find(f=>f.key===typeFilter)?.label} in this collection.
                  </p>
                ) : isMusicCollection && compactView ? (
                  /* ── MUSIC COMPACT LIST ── */
                  <div className="flex flex-col divide-y divide-white/[0.04]">
                    {processedItems.map((item, i) => {
                      const rawId   = String(item.mediaId);
                      const actualId = rawId.includes("-") ? rawId.split("-")[1] : rawId;
                      const linkTo  = item.mediaType === "track"
                        ? `/music/album/${rawId.split("-")[1]}`
                        : `/music/album/${actualId}`;
                      const imgSrc  = item.posterPath;
                      return (
                        <Link key={`${item.mediaId}-${i}`} to={linkTo}
                          className="group flex items-center gap-3.5 py-3 px-1 rounded-xl transition-all hover:bg-white/[0.03]">
                          {/* Thumbnail */}
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-white/[0.07]">
                            {imgSrc
                              ? <img src={imgSrc} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                              : <div className="h-full w-full bg-zinc-800 grid place-items-center">
                                  <svg className="h-4 w-4 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                                  </svg>
                                </div>
                            }
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-zinc-100 truncate group-hover:text-white transition-colors">{item.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <TypeBadge mediaType={item.mediaType} />
                              {item.year && <span className="text-[10px] text-zinc-700">{item.year}</span>}
                            </div>
                          </div>
                          {/* Play + Remove */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <span className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold bg-emerald-600/90 text-white border border-emerald-400/30">
                              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                              Play
                            </span>
                            {isOwner && (
                              <button
                                onClick={e => { e.preventDefault(); e.stopPropagation(); removeFromCollection(id, item.mediaId); }}
                                className="flex items-center justify-center h-7 w-7 rounded-lg bg-rose-500/90 text-white border border-rose-400/30 hover:bg-rose-600 transition-all active:scale-95"
                                title="Remove"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {processedItems.map((item, i) => {
                      const isMus = isMusItem(item);
                      const rawId = String(item.mediaId);
                      // Music mediaId format: "album-{id}" or "album-{albumId}-track-{trackId}"
                      const actualId = rawId.includes("-") ? rawId.split("-")[1] : rawId;
                      const linkTo = isMus
                        ? (item.mediaType === "track"
                            ? `/music/album/${rawId.split("-")[1]}`  // go to album detail for tracks
                            : `/music/album/${actualId}`)
                        : `/${item.mediaType === "movie" ? "cinema" : "tv"}/${actualId}`;
                      const imgSrc = isMus ? item.posterPath : `${IMG}/w342${item.posterPath}`;
                      const isWatched = item.watched;
                      const shouldFade = fadeWatched && isWatched;
                      // Badge: for music show music note, for cinema show checkmark
                      const badgeIcon = isMus
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                        : <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>;

                      return (
                        <Link key={`${item.mediaId}-${i}`} to={linkTo} className="group flex flex-col gap-2">
                          {/* Poster */}
                          <div className={`relative aspect-[2/3] w-full overflow-hidden rounded-xl border transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-black/70 ${
                            shouldFade ? "opacity-35" : "opacity-100"
                          } ${isWatched
                              ? isMus ? "border-emerald-500/20" : "border-violet-500/20"
                              : "border-white/[0.06] group-hover:border-violet-500/25"
                          }`}>

                            {item.posterPath ? (
                              <img src={imgSrc} alt={item.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                              <div className="h-full w-full grid place-items-center bg-zinc-800/60 p-3">
                                <p className="text-xs text-zinc-500 text-center leading-tight">{item.title}</p>
                              </div>
                            )}

                            {/* Bottom overlay on hover */}
                            <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              style={{ background:"linear-gradient(to top,rgba(0,0,0,0.82) 0%,transparent 55%)" }}>
                              <div className="flex items-center gap-2">
                                {isMus ? (
                                  /* Music: Play button — just navigates (Link handles it) */
                                  <span className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border bg-emerald-600/90 text-white border-emerald-400/30 shadow-md shadow-emerald-900/60">
                                    <svg className="h-2.5 w-2.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z"/>
                                    </svg>
                                    Play
                                  </span>
                                ) : (
                                  /* Cinema: Watch/Unwatch button */
                                  <button onClick={e => handleToggleWatched(e, item)}
                                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border backdrop-blur-sm transition-all active:scale-95 ${
                                      isWatched
                                        ? "bg-white/10 text-zinc-300 border-white/10 hover:bg-rose-500/20 hover:text-rose-300"
                                        : "bg-violet-600/95 text-white border-violet-400/30 shadow-md shadow-violet-900/60 hover:bg-violet-500"
                                    }`}>
                                    <svg className="h-2.5 w-2.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                      {isWatched
                                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                        : <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                      }
                                    </svg>
                                    {isWatched ? "Unwatch" : "Watch"}
                                  </button>
                                )}
                                {/* Remove from collection — owner, cinema only (music uses play) */}
                                {isOwner && !isMus && (
                                  <button
                                    onClick={e => { e.preventDefault(); e.stopPropagation(); removeFromCollection(id, item.mediaId); }}
                                    className="flex items-center justify-center h-7 w-7 rounded-lg bg-rose-500/90 text-white border border-rose-400/30 backdrop-blur-sm hover:bg-rose-600 transition-all active:scale-95 shadow-md"
                                    title="Remove from collection"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                  </button>
                                )}
                                {/* Remove from collection — owner, music items get their own remove */}
                                {isOwner && isMus && (
                                  <button
                                    onClick={e => { e.preventDefault(); e.stopPropagation(); removeFromCollection(id, item.mediaId); }}
                                    className="flex items-center justify-center h-7 w-7 rounded-lg bg-rose-500/90 text-white border border-rose-400/30 backdrop-blur-sm hover:bg-rose-600 transition-all active:scale-95 shadow-md"
                                    title="Remove from collection"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Listened/Watched badge */}
                            {isWatched && (
                              <div className={`absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full border shadow-md ${
                                isMus ? "bg-emerald-600 border-emerald-400/50" : "bg-violet-600 border-violet-400/50"
                              }`}>
                                <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                  {badgeIcon}
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Info below poster */}
                          <div className="px-0.5">
                            <p className={`text-[13px] font-semibold leading-snug line-clamp-2 transition-colors ${
                              isWatched ? "text-zinc-500 group-hover:text-zinc-300" : "text-zinc-100 group-hover:text-white"
                            }`}>
                              {item.title}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <TypeBadge mediaType={item.mediaType} />
                              {item.year && <span className="text-[10px] text-zinc-600">{item.year}</span>}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// src/pages/CollectionsPage.jsx
import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCollections } from "../context/CollectionsContext";
import { useAuth } from "../context/AuthContext";
import ImageUpload from "../components/ImageUpload";

const imageBase = "https://image.tmdb.org/t/p";

const ACCENT_GRADIENTS = [
  { id: "violet",  from: "#7c3aed", to: "#4f46e5" },
  { id: "rose",    from: "#e11d48", to: "#f97316" },
  { id: "cyan",    from: "#0891b2", to: "#6366f1" },
  { id: "amber",   from: "#d97706", to: "#dc2626" },
  { id: "emerald", from: "#059669", to: "#0891b2" },
  { id: "pink",    from: "#db2777", to: "#9333ea" },
  { id: "slate",   from: "#334155", to: "#0f172a" },
  { id: "indigo",  from: "#4338ca", to: "#1e1b4b" },
];

const COVER_OPTIONS = [
  "https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
  "https://image.tmdb.org/t/p/w1280/kzjISfaYVKXniRAMNOIKZdVRqJo.jpg",
  "https://image.tmdb.org/t/p/w1280/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  "https://image.tmdb.org/t/p/w1280/9E2y5Q7WlCVNEhP5GiVTjhEhx1o.jpg",
  "https://image.tmdb.org/t/p/w1280/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
  "https://image.tmdb.org/t/p/w1280/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg",
  "https://image.tmdb.org/t/p/w1280/o0OehrcA7JuD58Ad6fs4Qj7GiZ1.jpg",
  "https://image.tmdb.org/t/p/w1280/qJ2tWwGb51Y2tZ65PGqvAzPsuP3.jpg",
];

/* ── Icons ── */
function IconCheck({ className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconTrash({ className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconEdit({ className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
function IconImage({ className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function IconPlus({ className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

/* ── Cover renderer ── */
function CollectionCoverBg({ coverImage, items }) {
  if (coverImage && coverImage.startsWith("gradient:")) {
    const [from, to] = coverImage.replace("gradient:", "").split("|");
    return <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />;
  }
  if (coverImage) return <img src={coverImage} className="h-full w-full object-cover" alt="" />;
  if (items?.length > 0) {
    return (
      <div className="flex h-full">
        {items.slice(0, 4).map((item, i) => {
          const isMusic = item.mediaType === "album" || item.mediaType === "track";
          const imgSrc = isMusic ? item.posterPath : `${imageBase}/w185${item.posterPath}`;
          return <img key={i} src={imgSrc} className="flex-1 h-full object-cover" alt="" />;
        })}
      </div>
    );
  }
  return <div className="h-full w-full bg-gradient-to-br from-violet-900/30 to-zinc-900" />;
}

/* ── Cover picker modal ── */
function CoverModal({ onClose, onSave, currentCover }) {
  const [selected, setSelected] = useState(currentCover || COVER_OPTIONS[0]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-xl border border-white/10 bg-[#0c0c12] p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Choose Banner</h2>
            <p className="text-zinc-400 text-sm">Select a cover image for your collection.</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-h-[60vh] overflow-y-auto pr-2">
          {COVER_OPTIONS.map((url) => (
            <button key={url} onClick={() => setSelected(url)}
              className={`relative aspect-video overflow-hidden rounded-lg border-2 transition-all duration-200 ${selected === url ? "border-violet-500 scale-[1.02]" : "border-transparent opacity-60 hover:opacity-100"}`}>
              <img src={url} className="h-full w-full object-cover" alt="" />
              {selected === url && (
                <div className="absolute inset-0 grid place-items-center bg-black/40">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-violet-500 text-white"><IconCheck className="h-4 w-4" /></div>
                </div>
              )}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">Cancel</button>
          <button onClick={() => { onSave(selected); onClose(); }} className="rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-zinc-200">Save</button>
        </div>
      </div>
    </div>
  );
}

/* ── Rename modal ── */
function RenameCollectionModal({ onClose, onSave, initialName }) {
  const [name, setName] = useState(initialName);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-xl border border-white/10 bg-[#0c0c12] p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-4">Rename Collection</h2>
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) { onSave(name); onClose(); } }}>
          <input autoFocus type="text" placeholder="Collection Name"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
            value={name} onChange={e => setName(e.target.value)} />
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-white/5 py-2 text-sm text-white hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={!name.trim() || name === initialName} className="flex-1 rounded-lg bg-white text-black py-2 text-sm hover:bg-zinc-200 disabled:opacity-50">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Create collection modal ── */
function CreateCollectionModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [coverType, setCoverType] = useState("color"); // "color" or "image"
  const [coverImageUrl, setCoverImageUrl] = useState("");

  const g = ACCENT_GRADIENTS.find(g => g.id === selectedAccent);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0c12] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Live preview */}
        <div className="h-24 relative" style={{
          background: coverType === "color" ? `linear-gradient(135deg, ${g.from}, ${g.to})` : undefined,
          backgroundImage: coverType === "image" && coverImageUrl ? `url(${coverImageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c12]/60 to-transparent" />
          <p className="absolute bottom-3 left-5 text-white font-black text-lg tracking-tight drop-shadow">{name || "New Collection"}</p>
          <button onClick={onClose} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-black/30 text-white hover:bg-black/50 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">Collection Name *</label>
            <input autoFocus type="text" placeholder="e.g. Sci-Fi Classics"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              value={name} onChange={e => setName(e.target.value)} maxLength={60} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">Description <span className="normal-case font-normal text-zinc-600">(optional)</span></label>
            <textarea placeholder="What is this collection about?"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none resize-none"
              value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={200} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Collection Cover</label>
              <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCoverType("color")}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition ${coverType === "color" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"}`}
                >
                  COLOR
                </button>
                <button
                  type="button"
                  onClick={() => setCoverType("image")}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition ${coverType === "image" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"}`}
                >
                  IMAGE
                </button>
              </div>
            </div>

            {coverType === "color" ? (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {ACCENT_GRADIENTS.map(gr => (
                  <button key={gr.id} type="button" onClick={() => setSelectedAccent(gr.id)} title={gr.id}
                    style={{ background: `linear-gradient(135deg, ${gr.from}, ${gr.to})`, position: "relative" }}
                    className={`h-10 rounded-xl transition-all duration-200 ${selectedAccent === gr.id ? "ring-2 ring-white ring-offset-2 ring-offset-[#0c0c12] scale-105" : "opacity-60 hover:opacity-100"}`}>
                    {selectedAccent === gr.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <IconCheck className="h-4 w-4 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-3">
                <ImageUpload
                  currentImage={coverImageUrl}
                  onUploadComplete={setCoverImageUrl}
                  label="Upload Cover Image"
                />
              </div>
            )}
          </div>
          {/* Toggle using inline styles to guarantee it works */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">{isPublic ? "Public Collection" : "Private Collection"}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{isPublic ? "Visible in Community" : "Only you can see this"}</p>
            </div>
            <button type="button" onClick={() => setIsPublic(v => !v)}
              style={{
                position: "relative", height: 24, width: 44, borderRadius: 12,
                border: "none", cursor: "pointer", flexShrink: 0,
                backgroundColor: isPublic ? "#7c3aed" : "#3f3f46",
                transition: "background-color 0.2s"
              }}>
              <span style={{
                position: "absolute", top: 2,
                left: isPublic ? 22 : 2,
                height: 20, width: 20,
                borderRadius: "50%", backgroundColor: "white",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                transition: "left 0.2s", display: "block"
              }} />
            </button>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition">Cancel</button>
            <button disabled={!name.trim() || (coverType === "image" && !coverImageUrl)}
              onClick={() => {
                if (!name.trim()) return;
                const coverImage = coverType === "image" && coverImageUrl
                  ? coverImageUrl
                  : `gradient:${g.from}|${g.to}`;
                onCreate(name, { description, isPublic, coverImage });
                onClose();
              }}
              className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition disabled:opacity-50">
              Create Collection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Collection card ── */
function CollectionCard({ collection, onDelete, onToggleWatched, onRemoveItem, onUpdateCover, onRename, onTogglePrivacy, initExpanded }) {
  const [expanded, setExpanded] = useState(initExpanded !== undefined ? initExpanded : !!collection.isDefault);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const watched = collection.items.filter(i => i.watched).length;
  const progress = collection.items.length > 0 ? Math.round((watched / collection.items.length) * 100) : 0;
  const isMusic = collection.items.length > 0 && (collection.items[0].mediaType === "album" || collection.items[0].mediaType === "track");

  return (
    <>
      <div className={`group relative overflow-hidden rounded-2xl border transition-all duration-500 ${
        expanded ? "border-violet-500/30 bg-white/[0.03] shadow-[0_0_40px_rgba(124,58,237,0.1)]" : "border-white/5 bg-[#0a0a0f] hover:border-violet-500/20"
      }`}>
        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className={`h-full w-full transition-all duration-700 ${expanded ? "scale-105 opacity-[0.10]" : "scale-100 opacity-[0.20] group-hover:scale-105 group-hover:opacity-[0.30]"}`}>
            <CollectionCoverBg coverImage={collection.coverImage} items={collection.items} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent opacity-80" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex cursor-pointer flex-col md:flex-row md:items-center gap-6 p-6 sm:p-8" onClick={() => setExpanded(!expanded)}>
          <div className="flex-1 min-w-0 md:pr-12">
            <div className="flex items-center gap-2 mb-3">
              <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest border ${
                isMusic ? "bg-pink-500/20 text-pink-300 border-pink-500/20" : "bg-orange-500/20 text-orange-300 border-orange-500/20"
              }`}>{isMusic ? "Music" : "Cinema"}</span>
              {collection.isDefault ? (
                <span className="rounded-full bg-violet-500/20 px-3 py-1 text-[11px] font-bold text-violet-300 uppercase tracking-widest border border-violet-500/20">Default</span>
              ) : collection.isPublic ? (
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-300 uppercase tracking-widest border border-emerald-500/20">Public</span>
              ) : (
                <span className="rounded-full bg-zinc-800 px-3 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-widest border border-zinc-700">Private</span>
              )}
            </div>
            <h3 className="truncate text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-md mb-2">{collection.name}</h3>
            <div className="flex items-center gap-3 text-sm font-medium text-zinc-300">
              <span className="bg-white/10 px-2.5 py-1 rounded-md border border-white/5">{collection.items.length} {collection.items.length === 1 ? "Item" : "Items"}</span>
              {collection.items.length > 0 && !isMusic && <><span className="text-zinc-600">•</span><span className="text-violet-300">{watched} Watched</span></>}
            </div>
            {collection.items.length > 0 && !isMusic && (
              <div className="mt-4 flex items-center gap-4 max-w-md">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/50 border border-white/5">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-bold text-zinc-400 w-8">{progress}%</span>
              </div>
            )}
          </div>

          {/* Stacked poster preview */}
          <div className="relative h-28 w-20 shrink-0 hidden sm:block mr-12">
            {collection.items.slice(0, 3).map((item, idx) => {
              const imgSrc = (item.mediaType === "album" || item.mediaType === "track") ? item.posterPath : `${imageBase}/w185${item.posterPath}`;
              return (
                <div key={item.mediaId} className="absolute overflow-hidden rounded-lg border border-white/20 bg-zinc-900 shadow-2xl"
                  style={{ width: 80, height: 112, left: idx * 12, top: idx * -6, zIndex: 3 - idx, opacity: 1 - idx * 0.15 }}>
                  {item.posterPath ? <img alt="" className="h-full w-full object-cover" src={imgSrc} /> : <div className="h-full w-full bg-zinc-800" />}
                </div>
              );
            })}
            {collection.items.length === 0 && (
              <div className="absolute grid place-items-center rounded-lg border-2 border-dashed border-white/10 bg-white/[0.02] text-zinc-500" style={{ width: 80, height: 112, inset: 0 }}>
                <svg className="h-8 w-8 opacity-40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 md:opacity-0 transition-opacity duration-300 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
            {!collection.isDefault && (
              <>
                <button
                  onClick={() => onTogglePrivacy(collection.id)}
                  className={`flex items-center gap-1.5 h-10 rounded-full px-3 border transition-all text-xs font-bold ${
                    collection.isPublic
                      ? "bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-rose-500/20 hover:text-rose-300"
                      : "bg-black/40 text-zinc-400 border-white/5 hover:bg-violet-500/20 hover:text-violet-300"
                  }`}>
                  {collection.isPublic ? "Public" : "Private"}
                </button>
                <button className="grid place-items-center h-10 w-10 rounded-full bg-black/40 text-zinc-400 hover:bg-white/10 hover:text-white transition-all border border-white/5" onClick={() => setShowRenameModal(true)}><IconEdit /></button>
                <button className="grid place-items-center h-10 w-10 rounded-full bg-black/40 text-zinc-400 hover:bg-white/10 hover:text-white transition-all border border-white/5" onClick={() => setShowCoverModal(true)}><IconImage /></button>
                <button className="grid place-items-center h-10 w-10 rounded-full bg-black/40 text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition-all border border-white/5" onClick={() => onDelete(collection.id)}><IconTrash /></button>
              </>
            )}
            {/* View full page */}
            <Link to={`/collection/${collection.id}`}
              className="grid place-items-center h-10 w-10 rounded-full bg-black/40 text-zinc-400 hover:bg-violet-500/20 hover:text-violet-300 transition-all border border-white/5"
              title="View full page">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            <div className={`ml-2 grid place-items-center h-10 w-10 rounded-full bg-white/5 text-zinc-300 transition-all duration-500 ${expanded ? "rotate-180 bg-violet-500 text-white" : "hover:bg-white/10"}`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>
        </div>

        {/* Expanded items grid */}
        <div className={`transition-all duration-500 ease-in-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"} grid`}>
          <div className="overflow-hidden">
            <div className="border-t border-white/10 bg-black/40 p-6 sm:p-8 backdrop-blur-xl">
              {collection.items.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-zinc-400">No titles yet. Browse Cinema or Music and hit "Add to Collection".</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                  {collection.items.map((item) => {
                    const actualId = String(item.mediaId).includes("-") ? String(item.mediaId).split("-")[1] : item.mediaId;
                    const isMus = item.mediaType === "album" || item.mediaType === "track";
                    const linkTo = isMus ? `/music/album/${actualId}` : `/${item.mediaType === "movie" ? "cinema" : "tv"}/${actualId}`;
                    const imgSrc = isMus ? item.posterPath : `${imageBase}/w342${item.posterPath}`;
                    return (
                      <Link to={linkTo} key={item.mediaId} className="group/item block relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-zinc-900 border border-white/5 transition-all hover:-translate-y-0.5 hover:border-white/20">
                        {item.posterPath
                          ? <img alt={item.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/item:scale-105" src={imgSrc} />
                          : <div className="absolute inset-0 grid place-items-center bg-zinc-800 p-2 text-center"><span className="text-xs text-zinc-500">{item.title}</span></div>}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity group-hover/item:opacity-100" />
                        {item.watched && <div className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-violet-500 text-white z-10"><IconCheck className="h-3 w-3" /></div>}
                        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 transition-all group-hover/item:translate-y-0 group-hover/item:opacity-100 z-10">
                          <span className="block truncate text-xs font-medium text-white">{item.title}</span>
                          <div className="mt-2 flex gap-1.5">
                            {isMus ? (
                              <button className="flex-1 rounded py-1.5 text-[10px] font-medium bg-pink-600 text-white">Play</button>
                            ) : (
                              <button onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleWatched(collection.id, item.mediaId); }}
                                className={`flex-1 rounded py-1.5 text-[10px] font-medium transition ${item.watched ? "bg-white/20 text-white" : "bg-violet-600 text-white hover:bg-violet-500"}`}>
                                {item.watched ? "Unwatch" : "Watch"}
                              </button>
                            )}
                            <button onClick={e => { e.preventDefault(); e.stopPropagation(); onRemoveItem(collection.id, item.mediaId); }}
                              className="grid place-items-center rounded bg-black/40 px-2 text-zinc-300 hover:bg-rose-500 hover:text-white">
                              <IconTrash className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showCoverModal && <CoverModal currentCover={collection.coverImage} onClose={() => setShowCoverModal(false)} onSave={url => onUpdateCover(collection.id, url)} />}
      {showRenameModal && <RenameCollectionModal initialName={collection.name} onClose={() => setShowRenameModal(false)} onSave={n => onRename(collection.id, n)} />}
    </>
  );
}

/* ══ MAIN PAGE ══ */
export default function CollectionsPage() {
  const { collections, createCollection, deleteCollection, renameCollection, toggleWatched, removeFromCollection, updateCollectionCover, togglePrivacy } = useCollections();
  const [searchParams] = useSearchParams();
  const targetColId = searchParams.get("collection");
  const [showCreate, setShowCreate] = useState(false);

  const totalTitles = collections.reduce((acc, c) => acc + c.items.length, 0);
  const totalWatched = collections.reduce((acc, c) => acc + c.items.filter(i => i.watched).length, 0);

  return (
    <main className="min-h-screen text-white pb-32" style={{ background: "var(--bg)" }}>
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(124,58,237,0.08),transparent_50%)]" />
      </div>

      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 pt-24 sm:pt-28 pb-12">
        {/* Page header */}
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-1">Personal</p>
            <h1 className="text-4xl font-black text-white tracking-tight">My Collections</h1>
            <p className="mt-1.5 text-sm text-zinc-500">Your personal watchlists and curated picks.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-6 text-xs text-zinc-600">
              <div className="text-center"><p className="text-2xl font-black text-white">{collections.length}</p><p>lists</p></div>
              <div className="text-center"><p className="text-2xl font-black text-white">{totalTitles}</p><p>titles</p></div>
              <div className="text-center"><p className="text-2xl font-black text-white">{totalWatched}</p><p>watched</p></div>
            </div>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-500 transition shadow-lg shadow-violet-900/30">
              <IconPlus /> New Collection
            </button>
          </div>
        </div>

        {/* Collections list */}
        {collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-zinc-600">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            </div>
            <p className="text-base font-black text-zinc-500">No collections yet</p>
            <p className="text-sm text-zinc-700 mt-1">Create your first collection to get started.</p>
            <button onClick={() => setShowCreate(true)} className="mt-5 flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-500 transition">
              <IconPlus /> New Collection
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {collections.map(col => (
              <CollectionCard
                key={col.id}
                collection={col}
                onDelete={deleteCollection}
                onRename={renameCollection}
                onRemoveItem={removeFromCollection}
                onToggleWatched={toggleWatched}
                onUpdateCover={updateCollectionCover}
                onTogglePrivacy={togglePrivacy}
                initExpanded={col.isDefault || col.id === targetColId}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateCollectionModal onClose={() => setShowCreate(false)} onCreate={createCollection} />}
    </main>
  );
}

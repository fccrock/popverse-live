// src/components/CollectionModal.jsx
import { useState, useEffect, useRef } from "react";
import { useCollections } from "../context/CollectionsContext";

function IconPlus() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconBookmark() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Sub-modal: Create New Collection ─────────────────────────────────────────
function CreateCollectionPanel({ onBack, onCreated, mediaItem }) {
  const { createCollection, addToCollection } = useCollections();
  const [name, setName]           = useState("");
  const [desc, setDesc]           = useState("");
  const [isPublic, setIsPublic]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError("Give your collection a name."); return; }
    setLoading(true);
    setError("");
    try {
      const newCol = await createCollection(trimmed, { description: desc.trim(), isPublic });
      if (newCol?.id) {
        await addToCollection(newCol.id, mediaItem);
        onCreated(newCol);
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col" style={{ maxHeight: "inherit" }}>
      {/* Header — pinned */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-zinc-500 transition hover:bg-white/[0.08] hover:text-white"
        >
          <IconArrowLeft />
        </button>
        <div className="min-w-0">
          <h2 className="text-base font-black text-white leading-tight">Create New Collection</h2>
          <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{mediaItem?.title} will be added</p>
        </div>
      </div>

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 [scrollbar-width:thin] [scrollbar-color:rgba(124,58,237,0.25)_transparent]">
        {/* Name */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">Collection Name <span className="text-rose-400">*</span></label>
            <span className="text-[11px] text-zinc-700">{name.length}/50</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => { setName(e.target.value.slice(0, 50)); setError(""); }}
            placeholder="e.g. Sci-Fi Favourites"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white placeholder-zinc-600 outline-none transition focus:border-violet-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20"
          />
          {error && <p className="mt-1.5 text-[11px] font-semibold text-rose-400">{error}</p>}
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
              Description <span className="normal-case text-zinc-700">(optional)</span>
            </label>
            <span className="text-[11px] text-zinc-700">{desc.length}/150</span>
          </div>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value.slice(0, 150))}
            placeholder="What's this collection about?"
            rows={3}
            className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20 [scrollbar-width:thin]"
          />
        </div>

        {/* Visibility toggle */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 block mb-2">Visibility</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition-all ${
                !isPublic
                  ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                  : "border-white/[0.07] bg-white/[0.03] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.12]"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Private
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition-all ${
                isPublic
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : "border-white/[0.07] bg-white/[0.03] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.12]"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
              Public
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-700">
            {isPublic ? "Anyone can discover this collection." : "Only you can see this collection."}
          </p>
        </div>
      </div>

      {/* Submit — pinned at bottom */}
      <div className="px-5 pb-5 pt-3 border-t border-white/[0.06] shrink-0">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !name.trim()}
          className="w-full rounded-xl bg-violet-600 py-3 text-sm font-black text-white shadow-lg shadow-violet-900/40 transition-all hover:bg-violet-500 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {loading ? "Creating…" : "Create Collection"}
        </button>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function CollectionModal({ isOpen, onClose, mediaItem, accentColor = "violet" }) {
  const { collections, addToCollection, removeFromCollection, getCollectionsForMedia } = useCollections();
  const [view, setView]         = useState("list"); // "list" | "create"
  const [feedback, setFeedback] = useState(null);   // { colId, action }

  const inCollections = getCollectionsForMedia(mediaItem?.mediaId ?? "");

  // Reset to list view when modal opens/closes
  useEffect(() => {
    if (isOpen) setView("list");
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen || !mediaItem) return null;

  function handleToggle(colId) {
    const isIn = inCollections.some(c => c.id === colId);
    if (isIn) {
      removeFromCollection(colId, mediaItem.mediaId);
      setFeedback({ colId, action: "removed" });
    } else {
      addToCollection(colId, mediaItem);
      setFeedback({ colId, action: "added" });
    }
    setTimeout(() => setFeedback(null), 1200);
  }

  function handleCreated() {
    setView("list");
    setFeedback(null);
  }

  // Filter collections by media category
  const visibleCollections = collections.filter(col => {
    if (!col.items || col.items.length === 0) return true;
    const isMusic = t => t === "album" || t === "track";
    const itemIsMusic = isMusic(mediaItem?.mediaType);
    const colIsMusic  = isMusic(col.items[0]?.mediaType);
    return itemIsMusic === colIsMusic;
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal — centered, max-height capped so it never overflows screen */}
      <div className="fixed z-[101] inset-x-4 mx-auto max-w-md flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0d14] shadow-2xl shadow-black/80"
        style={{ top: "50%", transform: "translateY(-50%)", maxHeight: "min(90vh, 600px)" }}
      >

        {/* ── VIEW: Collection List ── */}
        {view === "list" && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
              <div>
                <h2 className="text-lg font-black text-white">Save to Collection</h2>
                <p className="mt-0.5 max-w-[22ch] truncate text-xs text-zinc-500">{mediaItem.title}</p>
              </div>
              <button
                className="mt-0.5 rounded-xl p-2 text-zinc-500 transition hover:bg-white/[0.08] hover:text-white"
                onClick={onClose}
              >
                <IconClose />
              </button>
            </div>

            {/* List */}
            <div className="max-h-60 overflow-y-auto px-3 [scrollbar-width:thin] [scrollbar-color:rgba(124,58,237,0.3)_transparent]">
              {visibleCollections.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-zinc-600">No collections yet.</p>
                  <p className="text-xs text-zinc-700 mt-1">Create one below to get started.</p>
                </div>
              ) : (
                visibleCollections.map(col => {
                  const isIn = inCollections.some(c => c.id === col.id);
                  const justChanged = feedback?.colId === col.id;
                  return (
                    <button
                      key={col.id}
                      onClick={() => handleToggle(col.id)}
                      className={`group flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left transition-all duration-150 ${
                        isIn ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
                      }`}
                    >
                      {/* Icon */}
                      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-all duration-200 ${
                        isIn ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40" : "bg-white/[0.06] text-zinc-500 group-hover:bg-white/[0.10]"
                      }`}>
                        {isIn ? <IconCheck /> : <IconBookmark />}
                      </div>

                      {/* Name + meta */}
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-bold ${isIn ? "text-white" : "text-zinc-300"}`}>
                          {col.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-zinc-600">
                            {col.items.length} {col.items.length === 1 ? "item" : "items"}
                          </p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            col.isPublic
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-white/[0.06] text-zinc-600"
                          }`}>
                            {col.isPublic ? "Public" : "Private"}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      {justChanged && (
                        <span className="shrink-0 text-xs font-black text-violet-400">
                          {feedback.action === "added" ? "Added ✓" : "Removed"}
                        </span>
                      )}
                      {isIn && !justChanged && (
                        <span className="shrink-0 text-xs font-semibold text-zinc-600">Saved</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Create new */}
            <div className="border-t border-white/[0.06] px-4 pb-5 pt-4">
              <button
                onClick={() => setView("create")}
                className="flex w-full items-center gap-3 rounded-xl border border-dashed border-white/[0.10] px-4 py-3 text-sm font-bold text-zinc-500 transition-all hover:border-violet-500/30 hover:bg-violet-500/[0.06] hover:text-violet-400"
              >
                <IconPlus />
                New collection
              </button>
            </div>
          </>
        )}

        {/* ── VIEW: Create Collection ── */}
        {view === "create" && (
          <CreateCollectionPanel
            onBack={() => setView("list")}
            onCreated={handleCreated}
            mediaItem={mediaItem}
          />
        )}
      </div>
    </>
  );
}

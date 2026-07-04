// src/components/ReviewSection.jsx
// Fully database-backed review system with threaded replies like club discussions.

import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { API_BASE as API } from "../config.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ── Star selector ─────────────────────────────────────────────────────────────

function StarSelector({ value, onChange, accent }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  const color = accent === "rose" ? "text-rose-400" : "text-violet-400";

  return (
    <div className="flex items-center gap-1.5" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          className={`text-2xl transition-all duration-100 hover:scale-110 ${
            star <= active ? color : "text-zinc-700"
          }`}
          aria-label={`Rate ${star} stars`}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <span className="ml-1.5 text-xs font-black text-zinc-500">{value}/5</span>
      )}
    </div>
  );
}

// ── Single review card ────────────────────────────────────────────────────────

function ReviewCard({
  review,
  accent,
  isAuthenticated,
  currentUsername,
  onDelete,
  onLike,
  onReply,
  onDeleteReply,
  activeReply,
  setActiveReply,
}) {
  const [revealed, setRevealed] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(false);

  const accentStar  = accent === "rose" ? "text-rose-400" : "text-violet-400";
  const accentBadge = accent === "rose"
    ? "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20"
    : "bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20";
  const avatarGrad = accent === "rose"
    ? "from-rose-600 to-violet-600"
    : "from-violet-600 to-fuchsia-600";
  const accentBg = accent === "rose"
    ? "bg-rose-600 hover:bg-rose-500"
    : "bg-violet-600 hover:bg-violet-500";

  const username = review.author?.username || review.username || "user";
  const iLiked = !!(currentUsername && review.likes?.some(l => l.user?.username?.toLowerCase() === currentUsername.toLowerCase()));
  const isReplyingToThis = activeReply?.reviewId === review.id;

  function handleSubmitReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(review.id, replyText.trim(), activeReply?.parentId || null);
    setReplyText("");
    setActiveReply(null);
    setShowReplies(true);
  }

  return (
    <article className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 shadow-xl shadow-black/10 backdrop-blur-sm transition-all duration-200 hover:border-white/[0.10] hover:bg-white/[0.04]">
      {/* ── Parent Row ── */}
      <div className="flex gap-3">
        {/* Left Column: Avatar & Thread Bridge */}
        <div className="w-9 shrink-0 flex flex-col items-center">
          <Link to={`/profile/${username}`} className="group relative z-10">
            <div className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${avatarGrad} text-xs font-black text-white shadow-md transition-transform group-hover:scale-105 group-hover:shadow-lg`}>
              {username.slice(0, 2).toUpperCase()}
            </div>
          </Link>
          {review.replies?.length > 0 && showReplies && (
            <div className="w-[2px] flex-1 bg-white/[0.15] mt-2 mb-[-16px] z-0" />
          )}
        </div>

        {/* Right Column: Content */}
        <div className="flex-1 min-w-0 pb-2">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <Link to={`/profile/${username}`} className="group">
                <p className="text-sm font-black text-white group-hover:text-violet-300 transition">@{username}</p>
              </Link>
              <p className="text-[11px] text-zinc-600">{timeAgo(review.createdAt || review.timestamp)}</p>
            </div>
            
            {/* Badges/Rating/Delete */}
            <div className="flex shrink-0 items-center gap-2.5">
              {review.isSpoiler && (
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${accentBadge}`}>
                  Spoiler
                </span>
              )}
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className={`text-sm ${s <= review.rating ? accentStar : "text-zinc-800"}`}>★</span>
                ))}
              </div>
              {currentUsername && currentUsername.toLowerCase() === username.toLowerCase() && (
                <button
                  onClick={() => onDelete(review.id)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold text-zinc-600 transition-all hover:bg-rose-500/10 hover:text-rose-400 border border-transparent hover:border-rose-500/15"
                  title="Delete review"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="relative mt-2">
            {review.isSpoiler && !revealed ? (
              <div className="relative overflow-hidden rounded-xl">
                <p className="select-none text-sm leading-7 text-zinc-300 blur-[4px]">{review.text}</p>
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-[2px]">
                  <button
                    onClick={() => setRevealed(true)}
                    className="rounded-xl border border-white/15 bg-black/70 px-4 py-2 text-xs font-black text-white backdrop-blur transition hover:bg-white/10"
                  >
                    Show Spoilers
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm leading-7 text-zinc-400">{review.text}</p>
                {review.isSpoiler && revealed && (
                  <button
                    onClick={() => setRevealed(false)}
                    className="mt-2 text-xs font-bold text-zinc-600 transition hover:text-zinc-400"
                  >
                    Hide spoiler
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer: Likes & Reply button */}
          <div className="mt-3 flex items-center gap-4">
            {/* Like Button */}
            <button
              onClick={() => {
                if (!isAuthenticated) return;
                onLike(review.id);
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                iLiked ? accentStar : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              <svg className="h-4 w-4" fill={iLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {(review.likes?.length || 0) > 0 && review.likes.length}
            </button>

            {/* Reply Button */}
            {isAuthenticated && (
              <button
                onClick={() => {
                  if (isReplyingToThis && activeReply?.parentId === null) {
                    setActiveReply(null);
                    setReplyText("");
                  } else {
                    setActiveReply({ reviewId: review.id, parentId: null });
                    setReplyText("");
                    setShowReplies(true);
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                {(review.replies?.length || 0) > 0 && review.replies.length} Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Replies Toggle ── */}
      {review.replies?.length > 0 && (
        <div className="mt-1 pl-[48px]">
          <button 
            onClick={() => setShowReplies(!showReplies)}
            className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${showReplies ? 'text-zinc-500 hover:text-zinc-400' : 'text-violet-400 hover:text-violet-300'}`}
          >
            <svg className={`h-4 w-4 transition-transform ${showReplies ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
            {showReplies ? 'Hide replies' : `Show ${review.replies.length} ${review.replies.length === 1 ? 'reply' : 'replies'}`}
          </button>
        </div>
      )}

      {/* ── Replies Row ── */}
      {review.replies?.length > 0 && showReplies && (
        <div className="mt-4 pl-[48px]">
          <div className="space-y-4">
            {review.replies.map((reply, i) => {
              const isLastL1 = i === review.replies.length - 1;
              const replyAuthor = reply.author?.username || "user";
              const isReplyingToLevel1 = activeReply?.reviewId === review.id && activeReply?.parentId === reply.id;
              
              return (
                <div key={reply.id} className="relative">
                  {/* Thread Lines L1 */}
                  <div className={`absolute border-white/[0.15] z-0 ${
                    isLastL1 ? 'h-[16px] border-l-2 border-b-2 rounded-bl-xl' : 'bottom-[-16px] border-l-2'
                  }`} style={{ width: '28px', left: '-28px', top: '0px' }} />
                  {!isLastL1 && <div className="absolute border-t-2 border-white/[0.15] z-0" style={{ width: '28px', left: '-28px', top: '16px' }} />}

                  {/* Level 1 Split-Anchor Row */}
                  <div className="relative z-10 flex gap-3">
                    {/* L1 Left Column: Avatar & Bridge */}
                    <div className="w-8 shrink-0 flex flex-col items-center">
                      <div className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${avatarGrad} text-[11px] font-black text-white shadow-md`}>
                        {replyAuthor.slice(0, 2).toUpperCase()}
                      </div>
                      {reply.replies?.length > 0 && (
                        <div className="w-[2px] flex-1 bg-white/[0.15] mt-2 mb-[-12px] z-0" />
                      )}
                    </div>

                    {/* L1 Right Column: Content */}
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-2">
                        <Link to={`/profile/${replyAuthor}`} className="text-[12px] font-bold text-zinc-200 hover:text-violet-300 transition">@{replyAuthor}</Link>
                        <span className="text-[10px] text-zinc-600">{timeAgo(reply.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-[13px] text-zinc-400 leading-relaxed">{reply.content}</p>
                      <div className="mt-1 flex items-center gap-3">
                        {isAuthenticated && (
                          <button
                            onClick={() => {
                              if (isReplyingToLevel1) {
                                setActiveReply(null);
                                setReplyText("");
                              } else {
                                setActiveReply({ reviewId: review.id, parentId: reply.id });
                                setReplyText(`@${replyAuthor} `);
                              }
                            }}
                            className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-wide"
                          >
                            Reply
                          </button>
                        )}
                        {currentUsername && currentUsername.toLowerCase() === replyAuthor.toLowerCase() && (
                          <button
                            onClick={() => { if (window.confirm("Delete this reply?")) onDeleteReply(review.id, reply.id); }}
                            className="text-[10px] font-bold text-zinc-700 hover:text-rose-400 transition-colors uppercase tracking-wide"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Level 2 Replies Row */}
                  {reply.replies && reply.replies.length > 0 && (
                    <div className="mt-3 pl-[44px]">
                      <div className="space-y-3">
                        {reply.replies.map((subR, j) => {
                          const isLastL2 = j === reply.replies.length - 1;
                          const subAuthor = subR.author?.username || "user";
                          return (
                            <div key={subR.id} className="relative">
                              {/* Thread Lines L2 */}
                              <div className={`absolute border-white/[0.15] z-0 ${
                                isLastL2 ? 'h-[16px] border-l-2 border-b-2 rounded-bl-xl' : 'bottom-[-12px] border-l-2'
                              }`} style={{ width: '28px', left: '-28px', top: '0px' }} />
                              {!isLastL2 && <div className="absolute border-t-2 border-white/[0.15] z-0" style={{ width: '28px', left: '-28px', top: '16px' }} />}

                              <div className="relative z-10 flex gap-3">
                                <div className="w-8 shrink-0 flex flex-col items-center">
                                  <div className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${avatarGrad} text-[11px] font-black text-white shadow-sm`}>
                                    {subAuthor.slice(0, 2).toUpperCase()}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0 pb-1">
                                  <div className="flex items-center gap-2">
                                    <Link to={`/profile/${subAuthor}`} className="text-[11px] font-bold text-zinc-300 hover:text-violet-300 transition">@{subAuthor}</Link>
                                    <span className="text-[9px] text-zinc-600">{timeAgo(subR.createdAt)}</span>
                                  </div>
                                  <p className="mt-0.5 text-[12px] text-zinc-400 leading-relaxed">{subR.content}</p>
                                  <div className="mt-1 flex items-center gap-3">
                                    {isAuthenticated && (
                                      <button
                                        onClick={() => {
                                          setActiveReply({ reviewId: review.id, parentId: reply.id });
                                          setReplyText(`@${subAuthor} `);
                                        }}
                                        className="text-[10px] font-bold text-zinc-600 hover:text-white transition-colors uppercase tracking-wide"
                                      >
                                        Reply
                                      </button>
                                    )}
                                    {currentUsername && currentUsername.toLowerCase() === subAuthor.toLowerCase() && (
                                      <button
                                        onClick={() => { if (window.confirm("Delete this reply?")) onDeleteReply(review.id, subR.id); }}
                                        className="text-[10px] font-bold text-zinc-700 hover:text-rose-400 transition-colors uppercase tracking-wide"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reply form for level 1 reply */}
                  {isReplyingToLevel1 && (
                    <form onSubmit={handleSubmitReply} className="mt-3 ml-10 flex gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[13px] text-white placeholder-zinc-600 outline-none transition focus:border-white/20 focus:bg-white/[0.04]"
                        placeholder={`Replying to @${replyAuthor}...`}
                      />
                      <button
                        type="button"
                        onClick={() => { setActiveReply(null); setReplyText(""); }}
                        className="shrink-0 rounded-xl px-3 py-1.5 text-[12px] font-bold text-zinc-400 hover:bg-white/[0.05] transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!replyText.trim()}
                        className={`shrink-0 rounded-xl px-3 py-1.5 text-[12px] font-bold text-white transition disabled:opacity-40 ${accentBg}`}
                      >
                        Reply
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main "Reply to review" form */}
      {isReplyingToThis && activeReply?.parentId === null && (
        <form onSubmit={handleSubmitReply} className="mt-4 ml-[48px] flex gap-2">
          <input
            type="text"
            autoFocus
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[13px] text-white placeholder-zinc-600 outline-none transition focus:border-white/20 focus:bg-white/[0.04]"
            placeholder="Write a reply..."
          />
          <button
            type="button"
            onClick={() => { setActiveReply(null); setReplyText(""); }}
            className="shrink-0 rounded-xl px-3 py-1.5 text-[13px] font-bold text-zinc-400 hover:bg-white/[0.05] transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!replyText.trim()}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-[13px] font-bold text-white transition disabled:opacity-40 ${accentBg}`}
          >
            Reply
          </button>
        </form>
      )}
    </article>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReviewSection({ mediaId, accentColor = "violet" }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // mediaId comes in as "movie-123" or "tv-456" — split it
  const parts = mediaId.split("-");
  const mediaType = parts[0]; // "movie" or "tv"
  const mediaIdNum = parts.slice(1).join("-"); // "123"

  const [reviews, setReviews]           = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [filter, setFilter]             = useState("all");
  const [rating, setRating]             = useState(0);
  const [text, setText]                 = useState("");
  const [isSpoiler, setIsSpoiler]       = useState(false);
  const [formError, setFormError]       = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted]       = useState(false);

  // activeReply is { reviewId, parentId } or null
  const [activeReply, setActiveReply] = useState(null);

  const currentUsername = user?.preferredUsername || user?.username || null;

  // Load reviews from DB
  const fetchReviews = useCallback(async () => {
    try {
      setIsLoadingReviews(true);
      const res = await fetch(`${API}/api/reviews/media/${mediaType}/${mediaIdNum}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (e) {
      console.error("Failed to load reviews", e);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [mediaType, mediaIdNum]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // Computed
  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }, [reviews]);

  const displayed = useMemo(() =>
    filter === "spoiler-free" ? reviews.filter((r) => !r.isSpoiler) : reviews,
    [reviews, filter]
  );

  // Accent colours
  const accentText  = accentColor === "rose" ? "text-rose-400"  : "text-violet-400";
  const accentBg    = accentColor === "rose" ? "bg-rose-600 hover:bg-rose-500 shadow-rose-900/30"  : "bg-violet-600 hover:bg-violet-500 shadow-violet-900/30";
  const accentStar  = accentColor === "rose" ? "text-rose-400"  : "text-violet-400";
  const accentFocus = accentColor === "rose"
    ? "focus:border-rose-500/50 focus:ring-rose-500/15"
    : "focus:border-violet-500/50 focus:ring-violet-500/15";
  const accentFilterActive = accentColor === "rose" ? "bg-rose-600 text-white shadow-rose-900/30" : "bg-violet-600 text-white shadow-violet-900/30";

  async function handleDelete(reviewId) {
    if (!window.confirm("Delete your review? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API}/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUsername }),
      });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Could not delete review. Please try again.");
      }
    } catch (e) {
      console.error("Failed to delete review", e);
    }
  }

  async function handleLikeReview(reviewId) {
    if (!currentUsername) return;
    // Optimistic update first
    setReviews(prev => prev.map(r => {
      if (r.id !== reviewId) return r;
      const currentLikes = r.likes || [];
      const alreadyLiked = currentLikes.some(l => l.user?.username?.toLowerCase() === currentUsername.toLowerCase());
      const filtered = currentLikes.filter(l => l.user?.username?.toLowerCase() !== currentUsername.toLowerCase());
      return {
        ...r,
        likes: alreadyLiked ? filtered : [...filtered, { user: { username: currentUsername } }]
      };
    }));

    try {
      const res = await fetch(`${API}/api/reviews/${reviewId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUsername }),
      });
      if (!res.ok) {
        // Revert on failure
        await fetchReviews();
      }
      // On success, server returns {liked: true/false} - our optimistic update is already correct
    } catch (e) {
      console.error("Failed to like review", e);
      await fetchReviews(); // revert
    }
  }

  async function handleReplyReview(reviewId, text, parentId = null) {
    if (!currentUsername) return;
    try {
      const res = await fetch(`${API}/api/reviews/${reviewId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, createdBy: currentUsername, parentId }),
      });
      if (res.ok) {
        // Refresh reviews from DB to get the full populated tree
        await fetchReviews();
        setActiveReply(null);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Failed to post reply:", err);
      }
    } catch (e) {
      console.error("Failed to reply", e);
    }
  }

  async function handleDeleteReply(reviewId, replyId) {
    if (!window.confirm("Delete this reply?")) return;
    try {
      const res = await fetch(`${API}/api/reviews/${reviewId}/replies/${replyId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchReviews();
      }
    } catch (e) {
      console.error("Failed to delete reply", e);
    }
  }

  async function handleSubmit() {
    setFormError("");
    if (!isAuthenticated) {
      setFormError("You must be signed in to write a review.");
      return;
    }
    const postUsername = currentUsername || "Anonymous";
    if (rating === 0)            { setFormError("Please select a star rating."); return; }
    if (!text.trim())            { setFormError("Please write your review."); return; }
    if (text.trim().length < 10) { setFormError("Review must be at least 10 characters."); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: postUsername,
          mediaId: mediaIdNum,
          mediaType,
          rating,
          text: text.trim(),
          isSpoiler,
        }),
      });

      if (res.ok) {
        setRating(0); setText(""); setIsSpoiler(false);
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
        await fetchReviews();
      } else {
        const err = await res.json();
        setFormError(err.error || "Failed to post review.");
      }
    } catch (e) {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-14 border-t border-white/[0.06] pt-12">
      {/* ── Section header + aggregate ── */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.25em] ${accentText}`}>Community</p>
          <h2 className="mt-1.5 text-2xl font-black tracking-tight text-white">Reviews</h2>
        </div>

        {reviews.length > 0 && (
          <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-3 shadow-lg backdrop-blur-sm">
            <div className="text-center">
              <p className={`text-3xl font-black ${accentStar}`}>{avgRating.toFixed(1)}</p>
              <div className="mt-1 flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className={`text-xs ${s <= Math.round(avgRating) ? accentStar : "text-zinc-800"}`}>★</span>
                ))}
              </div>
            </div>
            <div className="h-10 w-px bg-white/[0.07]" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">{reviews.length}</p>
              <p className="text-xs text-zinc-600">{reviews.length === 1 ? "review" : "reviews"}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Write a review ── */}
      <div className="mb-8 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 shadow-xl shadow-black/10 backdrop-blur-sm">
        <h3 className="mb-5 text-base font-black text-white">Write a Review</h3>

        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.04]">
              <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-zinc-400">Join the community to share your thoughts!</p>
            <p className="text-xs text-zinc-600 mt-1">Write reviews, rate your favorites, and curate collections.</p>
            <Link
              to="/login"
              state={{ from: location }}
              className={`mt-5 rounded-xl px-6 py-2.5 text-sm font-black text-white shadow-xl transition duration-200 hover:-translate-y-0.5 ${accentBg}`}
            >
              Sign In to Write a Review
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Posting as pill */}
            <div className="flex items-center gap-2 w-fit rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-zinc-500">Posting as</span>
              <span className="text-xs font-black text-white">{currentUsername}</span>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-600">Your Rating</p>
              <StarSelector value={rating} onChange={setRating} accent={accentColor} />
            </div>

            <textarea
              className={`w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-sm font-medium leading-7 text-white outline-none ring-0 transition-all placeholder:text-zinc-700 focus:border-transparent focus:ring-2 ${accentFocus}`}
              placeholder="Share your thoughts on this title..."
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-3 select-none">
                <div
                  onClick={() => setIsSpoiler((v) => !v)}
                  className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${isSpoiler ? (accentColor === "rose" ? "bg-rose-600" : "bg-violet-600") : "bg-zinc-800"}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${isSpoiler ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm font-semibold text-zinc-400">Contains spoilers</span>
              </label>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`rounded-xl px-6 py-2.5 text-sm font-black text-white shadow-xl transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${accentBg}`}
              >
                {isSubmitting ? "Posting..." : "Post Review"}
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-sm font-semibold text-red-300">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formError}
              </div>
            )}
            {submitted && (
              <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${accentColor === "rose" ? "border-rose-500/20 bg-rose-950/20 text-rose-300" : "border-violet-500/20 bg-violet-950/20 text-violet-300"}`}>
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Review posted successfully! Visible to all users now.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Filter tabs ── */}
      {reviews.length > 0 && (
        <div className="mb-5 flex gap-2">
          {[
            { label: `All (${reviews.length})`, value: "all" },
            { label: "Spoiler Free", value: "spoiler-free" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition-all duration-150 ${
                filter === f.value
                  ? `${accentFilterActive} shadow-lg`
                  : "border border-white/[0.07] bg-white/[0.03] text-zinc-500 hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Review list ── */}
      {isLoadingReviews ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-full bg-white/[0.05]" />
                <div className="h-4 w-32 rounded bg-white/[0.05]" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-white/[0.05]" />
                <div className="h-3 w-3/4 rounded bg-white/[0.05]" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length > 0 ? (
        <div className="space-y-3">
          {displayed.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              accent={accentColor}
              isAuthenticated={isAuthenticated}
              currentUsername={currentUsername}
              onDelete={handleDelete}
              onLike={handleLikeReview}
              onReply={handleReplyReview}
              onDeleteReply={handleDeleteReply}
              activeReply={activeReply}
              setActiveReply={setActiveReply}
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
          <p className="text-base font-black text-zinc-500">No reviews yet</p>
          <p className="mt-2 text-sm text-zinc-700">Be the first to share your thoughts.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
          <p className="text-sm font-bold text-zinc-600">No spoiler-free reviews yet.</p>
        </div>
      )}
    </section>
  );
}

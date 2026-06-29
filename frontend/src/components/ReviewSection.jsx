// src/components/ReviewSection.jsx
// Fully database-backed review system. Reviews visible to all users.

import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:5000";

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

function ReviewCard({ review, accent, currentUsername, onDelete }) {
  const [revealed, setRevealed] = useState(false);
  const accentStar  = accent === "rose" ? "text-rose-400" : "text-violet-400";
  const accentBadge = accent === "rose"
    ? "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20"
    : "bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20";
  const avatarGrad = accent === "rose"
    ? "from-rose-600 to-violet-600"
    : "from-violet-600 to-fuchsia-600";

  const username = review.author?.username || review.username || "user";

  return (
    <article className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 shadow-xl shadow-black/10 backdrop-blur-sm transition-all duration-200 hover:border-white/[0.10] hover:bg-white/[0.04]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <Link to={`/profile/${username}`} className="flex items-center gap-3 group">
          {/* Avatar */}
          <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br ${avatarGrad} text-xs font-black text-white shadow-lg`}>
            {username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-black text-white group-hover:text-violet-300 transition">@{username}</p>
            <p className="text-[11px] text-zinc-600">{timeAgo(review.createdAt || review.timestamp)}</p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2.5">
          {review.isSpoiler && (
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${accentBadge}`}>
              Spoiler
            </span>
          )}
          {/* Stars */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={`text-sm ${s <= review.rating ? accentStar : "text-zinc-800"}`}>★</span>
            ))}
          </div>
          {/* Delete button — only for the review author */}
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
      <div className="relative mt-4">
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

  const [reviews, setReviews]       = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [filter, setFilter]         = useState("all");
  const [rating, setRating]         = useState(0);
  const [text, setText]             = useState("");
  const [isSpoiler, setIsSpoiler]   = useState(false);
  const [formError, setFormError]   = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

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
      const res = await fetch(`${API}/api/reviews/${reviewId}`, { method: "DELETE" });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
      }
    } catch (e) {
      console.error("Failed to delete review", e);
    }
  }

  async function handleSubmit() {
    setFormError("");
    if (!isAuthenticated) {
      setFormError("You must be signed in to write a review.");
      return;
    }
    const postUsername = user?.preferredUsername || user?.username || "Anonymous";
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
        // Refresh reviews from DB
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
              <span className="text-xs font-black text-white">{user?.preferredUsername || user?.username}</span>
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
              currentUsername={user?.preferredUsername || user?.username}
              onDelete={handleDelete}
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

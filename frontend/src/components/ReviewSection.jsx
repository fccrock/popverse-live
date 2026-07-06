// src/components/ReviewSection.jsx
// Fully database-backed review system with threaded replies like club discussions.

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThreadedReplies from "./ThreadedReplies";

import { API_BASE as API } from "../config.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

// ── Star selector (yellow) ────────────────────────────────────────────────────

function StarSelector({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          className={`text-xl transition-all duration-100 hover:scale-110 leading-none ${
            star <= active ? "text-yellow-400" : "text-zinc-700"
          }`}
          aria-label={`Rate ${star} stars`}
        >
          &#9733;
        </button>
      ))}
    </div>
  );
}

// ── Stars display (read-only, yellow) ────────────────────────────────────────

function StarDisplay({ rating, size = "sm" }) {
  const cls = size === "xs" ? "text-xs" : size === "sm" ? "text-sm" : "text-base";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`${cls} leading-none ${s <= rating ? "text-yellow-400" : "text-zinc-700"}`}>
          &#9733;
        </span>
      ))}
    </div>
  );
}

// ── Share Review Modal with Canvas card ──────────────────────────────────────

function ShareReviewModal({ review, mediaTitle, mediaPoster, mediaYear, onClose }) {
  const canvasRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const username = review.author?.username || review.username || "user";
  const rating = review.rating || 0;
  const reviewText = review.text || "";
  const dateStr = formatDate(review.createdAt || review.timestamp);

  // Canvas dimensions (Instagram story friendly: 9:16 ratio → 540x960, but we do a nice 600x700 card)
  const W = 600;
  const H = 700;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = W;
    canvas.height = H;

    // We draw the card in layers. Poster must be loaded async.
    const drawCard = (posterImg) => {
      // ── Background ──
      // Deep dark base
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, W, H);

      // Subtle noise grain feel — just a slightly lighter inner rect with rounded corners
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, "rgba(124,58,237,0.10)");
      bgGrad.addColorStop(0.5, "rgba(0,0,0,0)");
      bgGrad.addColorStop(1, "rgba(232,72,141,0.08)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // ── Card border glow ──
      ctx.strokeStyle = "rgba(124,58,237,0.4)";
      ctx.lineWidth = 1.5;
      roundRect(ctx, 16, 16, W - 32, H - 32, 24);
      ctx.stroke();

      // ── Top section: poster + movie info ──
      const POSTER_W = 140;
      const POSTER_H = 210;
      const POSTER_X = 48;
      const POSTER_Y = 48;

      // Poster placeholder (gradient)
      const posterGrad = ctx.createLinearGradient(POSTER_X, POSTER_Y, POSTER_X + POSTER_W, POSTER_Y + POSTER_H);
      posterGrad.addColorStop(0, "#1e1b4b");
      posterGrad.addColorStop(1, "#4c1d95");
      ctx.fillStyle = posterGrad;
      roundRect(ctx, POSTER_X, POSTER_Y, POSTER_W, POSTER_H, 12);
      ctx.fill();

      // Draw poster image if loaded
      if (posterImg) {
        ctx.save();
        roundRect(ctx, POSTER_X, POSTER_Y, POSTER_W, POSTER_H, 12);
        ctx.clip();
        ctx.drawImage(posterImg, POSTER_X, POSTER_Y, POSTER_W, POSTER_H);
        ctx.restore();
      }

      // Poster border
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      roundRect(ctx, POSTER_X, POSTER_Y, POSTER_W, POSTER_H, 12);
      ctx.stroke();

      // ── Movie info (right of poster) ──
      const INFO_X = POSTER_X + POSTER_W + 28;
      const INFO_W = W - INFO_X - 48;

      // POPVERSE branding label
      ctx.fillStyle = "rgba(124,58,237,0.25)";
      roundRect(ctx, INFO_X, POSTER_Y, 90, 24, 6);
      ctx.fill();
      ctx.fillStyle = "#a78bfa";
      ctx.font = "bold 11px 'Arial', sans-serif";
      ctx.letterSpacing = "2px";
      ctx.fillText("POPVERSE", INFO_X + 10, POSTER_Y + 16);
      ctx.letterSpacing = "0px";

      // Movie title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px 'Arial', sans-serif";
      const titleLines = wrapText(ctx, mediaTitle || "Unknown Title", INFO_W, 26);
      titleLines.slice(0, 2).forEach((line, i) => {
        ctx.fillText(line, INFO_X, POSTER_Y + 52 + i * 34);
      });

      // Year
      if (mediaYear) {
        ctx.fillStyle = "#71717a";
        ctx.font = "14px 'Arial', sans-serif";
        ctx.fillText(mediaYear, INFO_X, POSTER_Y + 52 + Math.min(titleLines.length, 2) * 34 + 12);
      }

      // Divider line
      const DIVIDER_Y = POSTER_Y + 150;
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(INFO_X, DIVIDER_Y);
      ctx.lineTo(INFO_X + INFO_W, DIVIDER_Y);
      ctx.stroke();

      // "Rated by" label
      ctx.fillStyle = "#52525b";
      ctx.font = "12px 'Arial', sans-serif";
      ctx.fillText("Rated by @" + username, INFO_X, DIVIDER_Y + 22);

      // Stars
      const STAR_Y = DIVIDER_Y + 42;
      const starSize = 22;
      for (let s = 1; s <= 5; s++) {
        ctx.fillStyle = s <= rating ? "#facc15" : "#27272a";
        ctx.font = `${starSize}px 'Arial', sans-serif`;
        ctx.fillText("★", INFO_X + (s - 1) * (starSize + 4), STAR_Y);
      }
      // Rating number
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 14px 'Arial', sans-serif";
      ctx.fillText(`${rating}.0 / 5`, INFO_X, STAR_Y + 26);

      // ── Review body ──
      const BODY_Y = POSTER_Y + POSTER_H + 36;
      const BODY_X = 48;
      const BODY_W = W - 96;

      // Subtle left accent bar
      const barGrad = ctx.createLinearGradient(BODY_X, BODY_Y, BODY_X, BODY_Y + 180);
      barGrad.addColorStop(0, "#7c3aed");
      barGrad.addColorStop(1, "rgba(124,58,237,0)");
      ctx.fillStyle = barGrad;
      ctx.fillRect(BODY_X, BODY_Y, 3, 180);

      // Review text
      ctx.fillStyle = "#d4d4d8";
      ctx.font = "15px 'Arial', sans-serif";
      const reviewLines = wrapText(ctx, reviewText, BODY_W - 20, 15);
      const maxLines = 8;
      reviewLines.slice(0, maxLines).forEach((line, i) => {
        if (i === maxLines - 1 && reviewLines.length > maxLines) {
          ctx.fillStyle = "#71717a";
          ctx.fillText(line.slice(0, -3) + "...", BODY_X + 16, BODY_Y + 22 + i * 26);
        } else {
          ctx.fillText(line, BODY_X + 16, BODY_Y + 22 + i * 26);
        }
      });

      // ── Footer: avatar + username + date + Popverse logo ──
      const FOOTER_Y = H - 80;

      // Footer separator
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(48, FOOTER_Y - 16);
      ctx.lineTo(W - 48, FOOTER_Y - 16);
      ctx.stroke();

      // Avatar circle
      const AVT_X = 58;
      const AVT_Y = FOOTER_Y + 14;
      const AVT_R = 22;

      const avatarGrad2 = ctx.createLinearGradient(AVT_X - AVT_R, AVT_Y - AVT_R, AVT_X + AVT_R, AVT_Y + AVT_R);
      avatarGrad2.addColorStop(0, "#7c3aed");
      avatarGrad2.addColorStop(1, "#c026d3");
      ctx.fillStyle = avatarGrad2;
      ctx.beginPath();
      ctx.arc(AVT_X, AVT_Y, AVT_R, 0, Math.PI * 2);
      ctx.fill();

      // Avatar initials
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px 'Arial', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(username.slice(0, 2).toUpperCase(), AVT_X, AVT_Y + 5);
      ctx.textAlign = "left";

      // Username
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px 'Arial', sans-serif";
      ctx.fillText("@" + username, AVT_X + AVT_R + 12, FOOTER_Y + 10);

      // Date
      ctx.fillStyle = "#52525b";
      ctx.font = "12px 'Arial', sans-serif";
      ctx.fillText(dateStr, AVT_X + AVT_R + 12, FOOTER_Y + 28);

      // Popverse watermark (right side of footer)
      ctx.fillStyle = "rgba(124,58,237,0.5)";
      ctx.font = "bold 13px 'Arial', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("popverse.tech", W - 48, FOOTER_Y + 20);
      ctx.textAlign = "left";

      setIsGenerating(false);
    };

    // Load poster image (handle CORS by using crossOrigin)
    if (mediaPoster) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => drawCard(img);
      img.onerror = () => drawCard(null);
      img.src = mediaPoster;
    } else {
      drawCard(null);
    }
  }, [review, mediaTitle, mediaPoster, mediaYear, username, rating, reviewText, dateStr]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDownloading(true);
    try {
      const link = document.createElement("a");
      link.download = `popverse-review-${username}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setTimeout(() => setIsDownloading(false), 1000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0c0c12] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-violet-500/20">
              <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h2 className="text-base font-black text-white">Share Your Review</h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 hover:bg-white/10 hover:text-white transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Canvas Preview */}
        <div className="px-6 pt-5 pb-4">
          <div className="relative rounded-xl overflow-hidden border border-white/[0.07] bg-[#09090b]" style={{ aspectRatio: `${600/700}` }}>
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
              </div>
            )}
            <canvas
              ref={canvasRef}
              style={{ width: "100%", height: "100%", display: "block", opacity: isGenerating ? 0 : 1, transition: "opacity 0.3s" }}
            />
          </div>
          <p className="mt-3 text-center text-xs text-zinc-600">Perfect for Instagram Stories · 600×700 PNG</p>
        </div>

        {/* Download Button */}
        <div className="px-6 pb-6">
          <button
            onClick={handleDownload}
            disabled={isGenerating || isDownloading}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-violet-600 py-3.5 text-sm font-black text-white hover:bg-violet-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/30"
          >
            {isDownloading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Save Image
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Canvas helper functions ───────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth, fontSize) {
  const words = text.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ── Three-dot menu for own reviews ───────────────────────────────────────────

function ReviewMenu({ onDelete, onShare }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-zinc-600 transition-all hover:bg-white/[0.08] hover:text-zinc-300"
        title="More options"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-white/[0.08] bg-[#111118] shadow-2xl shadow-black/50 overflow-hidden">
          <button
            onClick={() => { setOpen(false); onShare(); }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.06] hover:text-white transition"
          >
            <svg className="h-4 w-4 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share Review
          </button>
          <div className="mx-3 h-px bg-white/[0.06]" />
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Single review card (flat, feed-style) ─────────────────────────────────────

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
  mediaTitle,
  mediaPoster,
  mediaYear,
}) {
  const [revealed, setRevealed] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const accentBadge = accent === "rose"
    ? "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20"
    : "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20";
  const avatarGrad = accent === "rose"
    ? "from-rose-600 to-violet-600"
    : "from-violet-600 to-fuchsia-600";
  const accentBg = accent === "rose"
    ? "bg-violet-600 hover:bg-violet-500"
    : "bg-violet-600 hover:bg-violet-500";
  const likedColor = accent === "rose" ? "text-violet-400" : "text-violet-400";

  const username = review.author?.username || review.username || "user";
  const iLiked = !!(currentUsername && review.likes?.some(l => l.user?.username?.toLowerCase() === currentUsername.toLowerCase()));
  const isReplyingToThis = activeReply?.reviewId === review.id;
  const isOwn = currentUsername && currentUsername.toLowerCase() === username.toLowerCase();

  function handleSubmitReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(review.id, replyText.trim(), activeReply?.parentId || null);
    setReplyText("");
    setActiveReply(null);
    setShowReplies(true);
  }

  return (
    <>
      <article className="border-b border-white/[0.05] py-5 last:border-b-0 transition-colors duration-150 hover:bg-white/[0.015] rounded-xl px-3 -mx-3">

        {/* ── Parent Row: avatar col + content col ── */}
        <div className="flex gap-3">

          {/* LEFT: avatar + vertical thread line */}
          <div className="w-9 shrink-0 flex flex-col items-center">
            <Link to={`/profile/${username}`} className="group z-10">
              <div className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${avatarGrad} text-xs font-black text-white shadow-md transition-transform group-hover:scale-105`}>
                {username.slice(0, 2).toUpperCase()}
              </div>
            </Link>
            {/* Thread line – visible when replies are open */}
            {review.replies?.length > 0 && showReplies && (
              <div
                style={{ width: 2, flexGrow: 1, marginTop: 8, minHeight: 12, background: 'rgba(255,255,255,0.12)', borderRadius: 2 }}
              />
            )}
          </div>

          {/* RIGHT: post content */}
          <div className="flex-1 min-w-0 pb-2">

            {/* Header row: username + time on left, stars + spoiler badge + three-dot on right */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link to={`/profile/${username}`} className="group">
                  <span className="text-sm font-bold text-white group-hover:text-violet-300 transition">@{username}</span>
                </Link>
                <span className="ml-2 text-[11px] text-zinc-600">{timeAgo(review.createdAt || review.timestamp)}</span>
              </div>

              {/* Right side: stars + spoiler tag + three-dot menu */}
              <div className="flex shrink-0 items-center gap-2">
                {/* User's star rating in yellow */}
                <StarDisplay rating={review.rating} size="sm" />

                {review.isSpoiler && (
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${accentBadge}`}>
                    Spoiler
                  </span>
                )}

                {/* Three-dot menu for own reviews */}
                {isOwn && (
                  <ReviewMenu
                    onDelete={() => onDelete(review.id)}
                    onShare={() => setShareOpen(true)}
                  />
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
                    <button onClick={() => setRevealed(false)} className="mt-1 text-xs font-bold text-zinc-600 transition hover:text-zinc-400">Hide spoiler</button>
                  )}
                </div>
              )}
            </div>

            {/* Footer: like + reply */}
            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={() => { if (!isAuthenticated) return; onLike(review.id); }}
                className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${iLiked ? likedColor : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                <svg className="h-4 w-4" fill={iLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                {(review.likes?.length || 0) > 0 && review.likes.length}
              </button>

              {isAuthenticated && (
                <button
                  onClick={() => {
                    if (isReplyingToThis && activeReply?.parentId === null) { setActiveReply(null); setReplyText(''); }
                    else { setActiveReply({ reviewId: review.id, parentId: null }); setReplyText(''); setShowReplies(true); }
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  {(review.replies?.length || 0) > 0 && <span>{review.replies.length}</span>} Reply
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Replies toggle ── */}
        {review.replies?.length > 0 && (
          <div className="mt-1" style={{ paddingLeft: 36 + 12 }}>
            <button
              onClick={() => setShowReplies(!showReplies)}
              className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${showReplies ? 'text-zinc-500 hover:text-zinc-400' : 'text-violet-400 hover:text-violet-300'}`}
            >
              <svg className={`h-4 w-4 transition-transform ${showReplies ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
              {(() => { const t = review.replies.reduce((s, r) => s + 1 + (r.replies?.length || 0), 0); return showReplies ? 'Hide replies' : `Show ${t} ${t === 1 ? 'reply' : 'replies'}`; })()}
            </button>
          </div>
        )}

        {/* ── Threaded replies (YouTube-style) ── */}
        {review.replies?.length > 0 && showReplies && (
          // connectorWidth=36 matches parent avatar width (w-9)
          <ThreadedReplies
            replies={review.replies}
            connectorWidth={36}
            avatarGrad={avatarGrad}
            isAuthenticated={isAuthenticated}
            currentUsername={currentUsername}
            activeReplyId={activeReply?.parentId}
            onReplyTo={(parentId, authorName) => {
              setActiveReply({ reviewId: review.id, parentId });
              setReplyText(`@${authorName} `);
            }}
            onDeleteReply={(replyId) => {
              if (window.confirm('Delete this reply?')) onDeleteReply(review.id, replyId);
            }}
            renderReplyForm={(parentId) => (
              <form onSubmit={handleSubmitReply} className="flex gap-2 mb-2">
                <input
                  type="text" autoFocus value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[13px] text-white placeholder-zinc-600 outline-none transition focus:border-white/20 focus:bg-white/[0.04]"
                  placeholder="Write a reply..."
                />
                <button type="button" onClick={() => { setActiveReply(null); setReplyText(''); }} className="shrink-0 rounded-xl px-3 py-1.5 text-[12px] font-bold text-zinc-400 hover:bg-white/[0.05] transition">Cancel</button>
                <button type="submit" disabled={!replyText.trim()} className={`shrink-0 rounded-xl px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-40 transition ${accentBg}`}>Reply</button>
              </form>
            )}
            timeAgoFn={timeAgo}
          />
        )}

        {/* ── Top-level reply form ── */}
        {isReplyingToThis && activeReply?.parentId === null && (
          <form onSubmit={handleSubmitReply} className="mt-4 flex gap-2" style={{ paddingLeft: 36 + 12 }}>
            <input
              type="text" autoFocus value={replyText}
              onChange={e => setReplyText(e.target.value)}
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[13px] text-white placeholder-zinc-600 outline-none transition focus:border-white/20 focus:bg-white/[0.04]"
              placeholder="Write a reply..."
            />
            <button type="button" onClick={() => { setActiveReply(null); setReplyText(''); }} className="shrink-0 rounded-xl px-3 py-1.5 text-[13px] font-bold text-zinc-400 hover:bg-white/[0.05] transition">Cancel</button>
            <button type="submit" disabled={!replyText.trim()} className={`shrink-0 rounded-xl px-3 py-1.5 text-[13px] font-bold text-white disabled:opacity-40 transition ${accentBg}`}>Reply</button>
          </form>
        )}
      </article>

      {/* Share modal — rendered outside article to avoid z-index issues */}
      {shareOpen && (
        <ShareReviewModal
          review={review}
          mediaTitle={mediaTitle}
          mediaPoster={mediaPoster}
          mediaYear={mediaYear}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReviewSection({ mediaId, accentColor = "violet", mediaTitle, mediaPoster, mediaYear }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // mediaId comes in as "movie-123" or "tv-456" – split it
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
  const [charCount, setCharCount]       = useState(0);

  // activeReply is { reviewId, parentId } or null
  const [activeReply, setActiveReply] = useState(null);

  const currentUsername = user?.preferredUsername || user?.username || null;

  // ── Avatar gradient derived from username ──
  const avatarGrad = "from-violet-600 to-fuchsia-600";

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

  // Always violet accent for filter buttons (consistent with rest of page)
  const accentText  = "text-violet-400";
  const accentBg    = "bg-violet-600 hover:bg-violet-500";
  const accentFocus = "focus:border-violet-500/50 focus:ring-violet-500/15";

  function handleTextChange(e) {
    setText(e.target.value);
    setCharCount(e.target.value.length);
  }

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
        setRating(0); setText(""); setIsSpoiler(false); setCharCount(0);
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
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.25em] ${accentText}`}>Community</p>
          <h2 className="mt-1.5 text-2xl font-black tracking-tight text-white">Reviews</h2>
        </div>

        {/* Overall rating – clean compact display */}
        {reviews.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-3xl font-black text-yellow-400 leading-none">{avgRating.toFixed(1)}</p>
              <div className="mt-1.5 flex justify-end gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className={`text-sm leading-none ${s <= Math.round(avgRating) ? "text-yellow-400" : "text-zinc-800"}`}>&#9733;</span>
                ))}
              </div>
            </div>
            <div className="h-10 w-px bg-white/[0.07]" />
            <div>
              <p className="text-2xl font-black text-white leading-none">{reviews.length}</p>
              <p className="text-xs text-zinc-600 mt-1">{reviews.length === 1 ? "review" : "reviews"}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Write a review ── */}
      {isAuthenticated ? (
        <div className="mb-8 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 shadow-xl shadow-black/10 backdrop-blur-sm">

          {/* Top row: avatar + username + star selector */}
          <div className="flex items-center gap-3 mb-3">
            {/* User avatar */}
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br ${avatarGrad} text-xs font-black text-white shadow-md`}>
              {(currentUsername || "U").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
              <span className="text-sm font-bold text-white truncate">@{currentUsername}</span>
              {/* Yellow star selector */}
              <StarSelector value={rating} onChange={setRating} />
            </div>
          </div>

          {/* Textarea */}
          <textarea
            className={`w-full resize-none rounded-xl border border-white/[0.07] bg-transparent px-0 py-2 text-sm font-medium leading-7 text-zinc-200 outline-none ring-0 transition-all placeholder:text-zinc-600 focus:outline-none`}
            placeholder="Write your review here..."
            rows={3}
            value={text}
            onChange={handleTextChange}
            maxLength={1000}
          />

          {/* Divider */}
          <div className="border-t border-white/[0.06] my-2" />

          {/* Bottom row: spoiler toggle + char count + post button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Contains Spoilers toggle */}
              <label className="flex cursor-pointer items-center gap-2 select-none">
                <div
                  onClick={() => setIsSpoiler((v) => !v)}
                  className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${isSpoiler ? "bg-violet-600" : "bg-zinc-800"}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${isSpoiler ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <span className={`text-xs font-semibold transition-colors ${isSpoiler ? accentText : 'text-zinc-500'}`}>Contains spoilers</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-zinc-700 tabular-nums">{charCount}/1000</span>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-full px-5 py-2 text-sm font-black text-white bg-white/10 hover:bg-white/20 border border-white/[0.12] shadow transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>

          {/* Errors / success */}
          {formError && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-2.5 text-sm font-semibold text-red-300">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formError}
            </div>
          )}
          {submitted && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-950/20 px-4 py-2.5 text-sm font-semibold text-violet-300">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Review posted successfully! Visible to all users now.
            </div>
          )}
        </div>
      ) : (
        /* Not signed in – minimal prompt */
        <div className="mb-8 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 shadow-xl backdrop-blur-sm flex flex-col items-center text-center">
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
      )}

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
              className={`rounded-xl px-4 py-1.5 text-sm font-bold transition-all duration-150 ${
                filter === f.value
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30"
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
        <div className="space-y-5">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse py-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-full bg-white/[0.06]" />
                <div className="h-4 w-32 rounded bg-white/[0.06]" />
              </div>
              <div className="space-y-2 ml-12">
                <div className="h-3 w-full rounded bg-white/[0.04]" />
                <div className="h-3 w-3/4 rounded bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length > 0 ? (
        <div>
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
              mediaTitle={mediaTitle}
              mediaPoster={mediaPoster}
              mediaYear={mediaYear}
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-base font-black text-zinc-600">No reviews yet</p>
          <p className="mt-2 text-sm text-zinc-700">Be the first to share your thoughts.</p>
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-sm font-bold text-zinc-600">No spoiler-free reviews yet.</p>
        </div>
      )}
    </section>
  );
}

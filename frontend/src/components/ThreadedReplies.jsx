import React from "react";
import { Link } from "react-router-dom";

function tAgo(ts) {
  if (!ts) return "";
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return `${Math.floor(d)}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

/*
 * ThreadedReplies — YouTube/Reddit-style threaded reply connector lines.
 *
 * WHY THIS WORKS (vs previous approaches):
 *   The vertical thread line = CSS `border-left` on the wrapper div.
 *   - A CSS border ALWAYS has height == wrapper's natural content height.
 *   - No flexbox stretch needed, no absolute positioning, no z-index issues.
 *   - Cannot be invisible. Cannot collapse to zero height.
 *
 *   The horizontal branch = a single `<div>` with fixed `width`, `height: 2`,
 *   and `position: absolute` inside a `position: relative` parent with
 *   NATURAL height (not flex-stretch). So `top: N` always works correctly.
 *
 * VISUAL RESULT:
 *   │                 <- border-left on the wrapper = thread line
 *   ├── [Av] reply 1  <- horizontal stub connects border to avatar
 *   │
 *   ├── [Av] reply 2
 *   │
 *   └── [Av] reply 3 (last — stub still shows, border ends here)
 */
export default function ThreadedReplies({
  replies = [],
  connectorWidth = 36,        // px — must match parent avatar width
  avatarGrad = "from-violet-600 to-fuchsia-600",
  isAuthenticated = false,
  currentUsername = null,
  onReplyTo,                  // (parentReplyId, authorName) => void
  onDeleteReply,              // (replyId) => void
  activeReplyId = null,       // reply.id for which to show inline form
  renderReplyForm,            // (replyId) => JSX
  timeAgoFn = tAgo,
  dim = false,                // dimmer lines for L2 nesting
}) {
  if (!replies || replies.length === 0) return null;

  // Thread line color — violet so it's clearly visible on dark bg
  const lineColor = dim ? "rgba(139,92,246,0.22)" : "rgba(139,92,246,0.50)";

  // Avatar size for this level
  const AV = dim ? 22 : 26;

  // paddingLeft of the wrapper = stub width + small gap before avatar
  // The stub spans FROM the border-left edge TO the reply avatar start.
  const PAD = 18; // px

  return (
    <div
      style={{
        marginLeft: Math.floor(connectorWidth / 2) - 1,
        paddingLeft: PAD,
        paddingBottom: 6,
        borderLeft: `2px solid ${lineColor}`,
      }}
    >
      {replies.map((reply) => {
        const replyId = reply.id;
        const author = reply.author?.username || reply.author || "user";
        const hasL2 = Array.isArray(reply.replies) && reply.replies.length > 0;
        // stubTop = distance from top of row to avatar vertical center
        // = rowPaddingTop(10px) + half of avatar height
        const stubTop = 10 + Math.floor(AV / 2);

        return (
          <div key={replyId} style={{ position: "relative" }}>
            {/*
              Horizontal stub — connects the border-left line to the reply avatar.
              position: absolute inside the reply row (position: relative).
              `left: -PAD` starts it at the border-left right-edge.
              `width: PAD` takes it to the reply row content start.
              `top: stubTop` aligns it with the avatar vertical center.
              This ALWAYS renders because top/width/height are all explicit px values.
            */}
            <div
              style={{
                position: "absolute",
                left: -PAD,
                top: stubTop,
                width: PAD,
                height: 2,
                background: lineColor,
                borderRadius: 1,
              }}
            />

            {/* Reply row */}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", paddingTop: 10, paddingBottom: 4 }}>
              {/* Avatar */}
              <Link to={`/profile/${author}`} style={{ flexShrink: 0, zIndex: 1 }}>
                <div
                  className={`grid place-items-center rounded-full bg-gradient-to-br ${avatarGrad} font-black text-white`}
                  style={{ width: AV, height: AV, fontSize: AV < 24 ? 9 : 10 }}
                >
                  {author.slice(0, 2).toUpperCase()}
                </div>
              </Link>

              {/* Text content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Link
                    to={`/profile/${author}`}
                    className="text-[12px] font-bold text-white hover:text-violet-300 transition"
                  >
                    @{author}
                  </Link>
                  <span className="text-[10px] text-zinc-500">
                    {timeAgoFn(reply.createdAt || reply.timestamp)}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] text-zinc-300 leading-relaxed break-words">
                  {reply.content}
                </p>
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 12 }}>
                  {isAuthenticated && (
                    <button
                      onClick={() => onReplyTo && onReplyTo(replyId, author)}
                      className="text-[10px] font-bold text-zinc-500 hover:text-violet-400 transition-colors uppercase tracking-wide"
                    >
                      Reply
                    </button>
                  )}
                  {currentUsername &&
                    currentUsername.toLowerCase() === author.toLowerCase() && (
                      <button
                        onClick={() => onDeleteReply && onDeleteReply(replyId)}
                        className="text-[10px] font-bold text-zinc-700 hover:text-rose-400 transition-colors uppercase tracking-wide"
                      >
                        Delete
                      </button>
                    )}
                </div>
              </div>
            </div>

            {/* Inline reply form (shown when this reply is the active target) */}
            {activeReplyId === replyId && renderReplyForm && (
              <div style={{ paddingLeft: AV + 8 }}>
                {renderReplyForm(replyId)}
              </div>
            )}

            {/* L2 sub-replies — recursively rendered with dimmer lines */}
            {hasL2 && (
              <div style={{ paddingLeft: AV + 8 }}>
                <ThreadedReplies
                  replies={reply.replies}
                  connectorWidth={AV}
                  avatarGrad={avatarGrad}
                  isAuthenticated={isAuthenticated}
                  currentUsername={currentUsername}
                  onReplyTo={(_, name) => onReplyTo && onReplyTo(replyId, name)}
                  onDeleteReply={onDeleteReply}
                  activeReplyId={activeReplyId}
                  renderReplyForm={renderReplyForm}
                  timeAgoFn={timeAgoFn}
                  dim={true}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

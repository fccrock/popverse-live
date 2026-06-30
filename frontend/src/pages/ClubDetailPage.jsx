// src/pages/ClubDetailPage.jsx
import { useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useClubs } from "../context/ClubsContext";
import { useAuth } from "../context/AuthContext";
import ImageUpload from "../components/ImageUpload";

const TABS = [
  { key: "feed", label: "Feed", icon: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" },
  { key: "discussions", label: "Discussions", icon: "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" },
  { key: "members", label: "Members", icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function UserBubble({ username, size = "sm" }) {
  const colors = ["bg-violet-500", "bg-rose-500", "bg-emerald-500", "bg-sky-500", "bg-amber-500", "bg-fuchsia-500", "bg-teal-500"];
  const hash = [...username].reduce((a, c) => a + c.charCodeAt(0), 0);
  const cls = size === "sm" ? "h-8 w-8 text-[11px]" : size === "md" ? "h-10 w-10 text-sm" : "h-12 w-12 text-base";
  return (
    <div className={`grid ${cls} shrink-0 place-items-center rounded-full font-bold text-white ${colors[hash % colors.length]}`}>
      {username[0].toUpperCase()}
    </div>
  );
}

/* ── Feed Tab ── */
function FeedTab({ club, isMember }) {
  const { addPost, likePost, deletePost, addPostReply } = useClubs();
  const { isAuthenticated, user } = useAuth();
  const [newPost, setNewPost] = useState("");
  const [postImageUrl, setPostImageUrl] = useState("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);

  const currentUsername = user?.preferredUsername;

  async function handlePost(e) {
    e.preventDefault();
    if (!newPost.trim() && !postImageUrl) return;
    setPosting(true);
    await addPost(club.id, newPost.trim() || " ", postImageUrl || null);
    setNewPost("");
    setPostImageUrl("");
    setShowImageUpload(false);
    setPosting(false);
  }

  async function handleReply(postId) {
    if (!replyText.trim()) return;
    await addPostReply(club.id, postId, replyText.trim());
    setReplyText("");
    setReplyingTo(null);
  }

  return (
    <div className="space-y-4">
      {isMember && (
        <form onSubmit={handlePost} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex gap-3">
            <UserBubble username={currentUsername || "?"} />
            <div className="flex-1 space-y-3">
              <textarea
                className="input-field min-h-[56px] resize-none w-full"
                placeholder="Share something with the club..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                maxLength={500}
              />
              {showImageUpload && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <ImageUpload
                    currentImage={postImageUrl}
                    onUploadComplete={(url) => setPostImageUrl(url)}
                    label="Add image to post"
                  />
                  {postImageUrl && (
                    <div className="mt-2 relative inline-block">
                      <img src={postImageUrl} alt="preview" className="h-24 rounded-lg object-cover" />
                      <button type="button" onClick={() => setPostImageUrl("")}
                        className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-white text-[10px]">✕</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowImageUpload(v => !v)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                showImageUpload ? "bg-violet-500/20 text-violet-300" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 18h16.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Photo
            </button>
            <button type="submit" disabled={(!newPost.trim() && !postImageUrl) || posting}
              className="btn-v py-2 px-5 text-sm disabled:opacity-40 disabled:pointer-events-none">
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      )}

      {club.feed.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm font-bold text-zinc-500">No posts yet</p>
          <p className="mt-1 text-xs text-zinc-600">{isMember ? "Be the first to share something!" : "Join this club to start posting."}</p>
        </div>
      )}

      {club.feed.map((post) => {
        const isOwner = currentUsername && currentUsername.toLowerCase() === post.author.toLowerCase();
        const likedByMe = currentUsername && post.likes.includes(currentUsername);
        const replyCount = (post.replies || []).length;

        return (
          <div key={post.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-200 hover:border-white/[0.1]">
            <div className="flex items-start gap-3">
              <UserBubble username={post.author} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{post.author}</span>
                    <span className="text-xs text-zinc-600">·</span>
                    <span className="text-xs text-zinc-600">{timeAgo(post.timestamp)}</span>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => { if (window.confirm("Delete this post?")) deletePost(club.id, post.id); }}
                      className="grid h-7 w-7 place-items-center rounded-lg text-zinc-700 hover:bg-rose-500/10 hover:text-rose-400 transition"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>

                {post.content && post.content.trim() && post.content !== " " && (
                  <p className="mt-2 text-[15px] leading-relaxed text-zinc-300">{post.content}</p>
                )}

                {post.imageUrl && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.06]">
                    <img src={post.imageUrl} alt="post" className="w-full object-cover max-h-[480px]" />
                  </div>
                )}

                <div className="mt-3 flex items-center gap-4">
                  <button
                    onClick={() => isAuthenticated && likePost(club.id, post.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                      likedByMe ? "text-rose-400" : "text-zinc-600 hover:text-rose-400"
                    }`}
                  >
                    <svg className="h-4 w-4" fill={likedByMe ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                    {post.likeCount > 0 && post.likeCount}
                  </button>

                  {isMember && (
                    <button
                      onClick={() => { setReplyingTo(replyingTo === post.id ? null : post.id); setReplyText(""); }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-violet-400 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                      </svg>
                      {replyCount > 0 && <span>{replyCount}</span>}
                      Reply
                    </button>
                  )}
                </div>

                {replyCount > 0 && (
                  <div className="mt-3 space-y-2 border-l-2 border-white/[0.05] pl-4">
                    {post.replies.map(r => (
                      <div key={r.id} className="flex items-start gap-2">
                        <UserBubble username={r.author} size="sm" />
                        <div>
                          <span className="text-xs font-bold text-zinc-300">{r.author}</span>
                          <span className="ml-1.5 text-xs text-zinc-600">{timeAgo(r.timestamp)}</span>
                          <p className="text-[13px] text-zinc-400 mt-0.5">{r.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {replyingTo === post.id && (
                  <div className="mt-3 flex items-center gap-2">
                    <UserBubble username={currentUsername || "?"} size="sm" />
                    <input
                      type="text"
                      className="input-field flex-1 py-1.5 text-sm"
                      placeholder="Write a reply..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(post.id); } }}
                      autoFocus
                    />
                    <button onClick={() => handleReply(post.id)} disabled={!replyText.trim()}
                      className="btn-v py-1.5 px-3 text-xs disabled:opacity-40">Send</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Discussions Tab ── */
function renderReplyContent(text) {
  if (text.startsWith("@")) {
    const spaceIndex = text.indexOf(" ");
    if (spaceIndex !== -1) {
      const taggedUser = text.substring(0, spaceIndex);
      const restOfText = text.substring(spaceIndex);
      return (
        <p className="mt-1 text-[13.5px] text-zinc-300 leading-relaxed break-words">
          <span className="rounded bg-sky-500/10 px-1.5 py-0.5 font-semibold text-sky-400">{taggedUser}</span>
          {restOfText}
        </p>
      );
    }
  }
  return <p className="mt-1 text-[13.5px] text-zinc-300 leading-relaxed break-words">{text}</p>;
}

function DiscussionsTab({ club, isMember }) {
  const { addDiscussion, addReply, deleteDiscussion, deleteReply } = useClubs();
  const { isAuthenticated, user } = useAuth();
  const [showNewForm, setShowNewForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  
  // Track which item the user is replying to (either a discussion ID or a reply ID)
  // { discussionId: string, parentId: string | null }
  const [activeReply, setActiveReply] = useState(null);
  const [replyText, setReplyText] = useState("");

  const currentUsername = user?.preferredUsername;

  function handleNewDiscussion(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    addDiscussion(club.id, title.trim(), content.trim());
    setTitle(""); setContent(""); setShowNewForm(false);
  }

  function submitReply(e, discussionId, parentId = null) {
    e.preventDefault();
    if (!replyText.trim()) return;
    addReply(club.id, discussionId, replyText.trim(), parentId);
    setReplyText("");
    setActiveReply(null);
  }

  return (
    <div className="space-y-4">
      {isMember && (
        <div>
          {!showNewForm ? (
            <button onClick={() => setShowNewForm(true)} className="btn-ghost w-full justify-center gap-2 py-3">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Start a Discussion
            </button>
          ) : (
            <form onSubmit={handleNewDiscussion} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
              <input className="input-field" placeholder="Discussion title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
              <textarea className="input-field min-h-[80px] resize-none" placeholder="What do you want to discuss?" value={content} onChange={(e) => setContent(e.target.value)} required maxLength={1000} />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowNewForm(false)} className="btn-ghost py-2 px-4 text-sm">Cancel</button>
                <button type="submit" className="btn-v py-2 px-5 text-sm">Post Discussion</button>
              </div>
            </form>
          )}
        </div>
      )}

      {club.discussions.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm font-bold text-zinc-500">No discussions yet</p>
          <p className="mt-1 text-xs text-zinc-600">{isMember ? "Start the conversation!" : "Join to participate in discussions."}</p>
        </div>
      )}

      {club.discussions.map((d) => (
        <div key={d.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all duration-200 hover:border-white/[0.1]">
          <div className="flex w-full items-start gap-3 p-5">
            <button className="flex flex-1 items-start gap-3 text-left" onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}>
              <UserBubble username={d.author} />
              <div className="min-w-0 flex-1">
                <h4 className="text-[15px] font-bold text-white leading-snug">{d.title}</h4>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-600">
                  <span className="font-semibold text-zinc-500">{d.author}</span>
                  <span>·</span>
                  <span>{timeAgo(d.timestamp)}</span>
                  <span>·</span>
                  <span className="font-semibold text-zinc-500">{d.replies.length} {d.replies.length === 1 ? "reply" : "replies"}</span>
                </div>
              </div>
              <svg className={`h-5 w-5 shrink-0 text-zinc-600 transition-transform duration-200 ${expandedId === d.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
            {/* Delete discussion button - only for author */}
            {currentUsername && currentUsername.toLowerCase() === d.author.toLowerCase() && (
              <button
                onClick={() => { if(window.confirm("Delete this discussion and all its replies?")) deleteDiscussion(club.id, d.id); }}
                className="ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-700 hover:bg-rose-500/10 hover:text-rose-400 transition"
                title="Delete discussion"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
          </div>

          {expandedId === d.id && (
            <div className="border-t border-white/[0.06] pb-5 relative">
              <p className="px-5 py-4 text-[14px] text-zinc-300 leading-relaxed">{d.content}</p>

              {/* Action Buttons for Main Discussion */}
              <div className="px-5 pb-4 flex items-center gap-4">
                <button 
                  onClick={() => { setActiveReply({ discussionId: d.id, parentId: null }); setReplyText(""); }}
                  className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-wide bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded-full"
                >
                  Reply to Thread
                </button>
              </div>

              {/* Main Thread Reply Form */}
              {activeReply?.discussionId === d.id && activeReply?.parentId === null && (
                <div className="px-5 mb-4">
                  <form onSubmit={(e) => submitReply(e, d.id, null)} className="flex gap-3">
                    <UserBubble username={currentUsername || "Guest"} size="sm" />
                    <div className="flex-1">
                      <input 
                        className="w-full border-b border-white/[0.1] bg-transparent pb-1 pt-1 text-sm text-white placeholder-zinc-500 focus:border-white focus:outline-none transition-colors" 
                        placeholder="Add a reply to the main thread..." 
                        autoFocus
                        value={replyText} 
                        onChange={(e) => setReplyText(e.target.value)} 
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button type="button" onClick={() => setActiveReply(null)} className="rounded-full px-4 py-1.5 text-xs font-bold text-zinc-400 hover:bg-white/[0.05]">Cancel</button>
                        <button type="submit" disabled={!replyText.trim()} className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black disabled:opacity-40">Reply</button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Replies (Level 1) */}
              <div className="relative">
                {d.replies.length > 0 && (
                  <div className="absolute left-[35px] top-0 bottom-[10px] w-[2px] bg-[#2a2a2d]" />
                )}
                
                {d.replies.map((r) => (
                  <div key={r.id} className="relative flex items-start px-5 py-3">
                    <div className="absolute left-[35px] top-0 h-[26px] w-[24px] rounded-bl-xl border-b-[2px] border-l-[2px] border-[#2a2a2d]" />
                    
                    <div className="ml-[34px] flex flex-1 gap-3 relative z-10">
                      <UserBubble username={r.author} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-white">@{r.author}</span>
                          <span className="text-zinc-500">{timeAgo(r.timestamp)}</span>
                        </div>
                        {renderReplyContent(r.content)}
                        
                        {/* Action Buttons for Level 1 */}
                        <div className="mt-2 flex items-center gap-4">
                          <button 
                            onClick={() => { setActiveReply({ discussionId: d.id, parentId: r.id }); setReplyText(""); }}
                            className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-wide"
                          >
                            Reply
                          </button>
                          {/* Delete reply button - only for reply author */}
                          {currentUsername && currentUsername.toLowerCase() === r.author.toLowerCase() && (
                            <button
                              onClick={() => { if(window.confirm("Delete this reply?")) deleteReply(club.id, d.id, r.id); }}
                              className="text-[11px] font-bold text-zinc-700 hover:text-rose-400 transition-colors uppercase tracking-wide"
                              title="Delete reply"
                            >
                              Delete
                            </button>
                          )}
                        </div>

                        {/* Level 2 Sub-Replies */}
                        {r.replies && r.replies.length > 0 && (
                          <div className="relative mt-4 space-y-1">
                            <div className="absolute left-[-15px] top-[-10px] bottom-[15px] w-[2px] bg-[#2a2a2d]" />
                            
                            {r.replies.map((subR) => (
                              <div key={subR.id} className="relative flex items-start py-2">
                                <div className="absolute left-[-15px] top-0 h-[22px] w-[24px] rounded-bl-xl border-b-[2px] border-l-[2px] border-[#2a2a2d]" />
                                
                                <div className="ml-[18px] flex flex-1 gap-3 relative z-10">
                                  <UserBubble username={subR.author} size="sm" />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="font-bold text-white">@{subR.author}</span>
                                      <span className="text-zinc-500">{timeAgo(subR.timestamp)}</span>
                                    </div>
                                    {renderReplyContent(subR.content)}
                                    <div className="mt-1 flex items-center gap-4">
                                      <button 
                                        onClick={() => { setActiveReply({ discussionId: d.id, parentId: r.id }); setReplyText(`@${subR.author} `); }}
                                        className="text-[11px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-wide"
                                      >
                                        Reply
                                      </button>
                                      {currentUsername && currentUsername.toLowerCase() === subR.author.toLowerCase() && (
                                        <button
                                          onClick={() => { if(window.confirm("Delete this reply?")) deleteReply(club.id, d.id, subR.id); }}
                                          className="text-[11px] font-bold text-zinc-700 hover:text-rose-400 transition-colors uppercase tracking-wide"
                                          title="Delete reply"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Sub-Reply Form (Level 2) */}
                        {activeReply?.discussionId === d.id && activeReply?.parentId === r.id && (
                          <div className="mt-4 relative">
                            {r.replies && r.replies.length > 0 && <div className="absolute left-[-15px] top-[-15px] bottom-[15px] w-[2px] bg-[#2a2a2d]" />}
                            <div className="absolute left-[-15px] top-0 h-[22px] w-[24px] rounded-bl-xl border-b-[2px] border-l-[2px] border-[#2a2a2d]" />
                            
                            <form onSubmit={(e) => submitReply(e, d.id, r.id)} className="ml-[18px] flex gap-3 relative z-10">
                              <UserBubble username={currentUsername || "Guest"} size="sm" />
                              <div className="flex-1">
                                <input 
                                  className="w-full border-b border-white/[0.1] bg-transparent pb-1 pt-1 text-sm text-white placeholder-zinc-500 focus:border-white focus:outline-none transition-colors" 
                                  placeholder={`Reply to ${r.author}...`} 
                                  autoFocus
                                  value={replyText} 
                                  onChange={(e) => setReplyText(e.target.value)} 
                                />
                                <div className="mt-2 flex justify-end gap-2">
                                  <button type="button" onClick={() => setActiveReply(null)} className="rounded-full px-4 py-1.5 text-xs font-bold text-zinc-400 hover:bg-white/[0.05]">Cancel</button>
                                  <button type="submit" disabled={!replyText.trim()} className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black disabled:opacity-40">Reply</button>
                                </div>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Members Tab ── */
function MembersTab({ club }) {
  const roleBadge = {
    admin: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    moderator: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    member: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {club.members.map((m) => (
        <div key={m.username} className="flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/[0.1]">
          <UserBubble username={m.username} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate">{m.username}</p>
            <p className="text-xs text-zinc-600">Joined {timeAgo(m.joinedAt)}</p>
          </div>
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${roleBadge[m.role] || roleBadge.member}`}>
            {m.role}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ── */
export default function ClubDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { getClubBySlug, isClubMember, joinClub, leaveClub, getUserRole } = useClubs();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("feed");

  const club = getClubBySlug(slug);

  if (!club) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050507]">
        <div className="text-center animate-fade-up">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
            <svg className="h-7 w-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>
          </div>
          <p className="text-lg font-bold text-white">Club not found</p>
          <p className="mt-2 text-sm text-zinc-500">This club may have been removed or the link is incorrect.</p>
          <Link to="/community" className="btn-ghost mt-6 inline-flex py-2.5 px-5 text-sm">
            ← Back to Community
          </Link>
        </div>
      </div>
    );
  }

  const isMember = isClubMember(club.id);
  const role = getUserRole(club.id);

  return (
    <div className="min-h-screen bg-[#050507]">
      {/* Hero Banner */}
      <div className="relative h-[300px] sm:h-[360px] overflow-hidden">
        <img src={club.coverImage} alt={club.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050507]/40 to-transparent" />

        {/* Back button */}
        <button onClick={() => navigate("/community")} className="absolute left-4 top-20 sm:left-8 sm:top-24 z-10 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-black/60">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Back
        </button>

        {/* Club Info */}
        <div className="absolute bottom-8 left-4 right-4 sm:left-8 sm:right-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="animate-fade-up">
              <div className="mb-3 flex items-center gap-2.5">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  { movies: "text-rose-400 bg-rose-500/10 border-rose-500/20", anime: "text-violet-400 bg-violet-500/10 border-violet-500/20", music: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", gaming: "text-sky-400 bg-sky-500/10 border-sky-500/20", general: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" }[club.category] || "text-zinc-400 bg-zinc-500/10 border-zinc-500/20"
                }`}>{club.category}</span>
                <span className="text-xs text-zinc-400">Created by <span className="font-semibold text-zinc-300">{club.createdBy}</span></span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                {club.name}
              </h1>
              <p className="mt-2 max-w-lg text-sm text-zinc-400 leading-relaxed">{club.description}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                <span className="font-semibold">{club.members.length} {club.members.length === 1 ? "member" : "members"}</span>
                <span>·</span>
                <span>{club.feed.length} posts</span>
                <span>·</span>
                <span>{club.discussions.length} discussions</span>
              </div>
            </div>

            <div className="animate-fade-up stagger-1">
              {!isAuthenticated ? (
                <Link to="/login" className="btn-v py-2.5 px-6 text-sm font-bold">Sign in to join</Link>
              ) : isMember ? (
                <div className="flex gap-2">
                  {role === "admin" && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm font-bold text-amber-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                      Admin
                    </span>
                  )}
                  <button onClick={() => leaveClub(club.id)} className="btn-ghost py-2.5 px-5 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/20">
                    Leave Club
                  </button>
                </div>
              ) : (
                <button onClick={() => joinClub(club.id)} className="btn-v py-2.5 px-6 text-sm font-bold">
                  Join Club
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="mx-auto max-w-[900px] px-4 sm:px-6 lg:px-8 pb-16">
        {/* Tab Bar */}
        <div className="flex gap-1 border-b border-white/[0.06] pt-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors duration-200 ${
                activeTab === tab.key ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
              {tab.label}
              {tab.key === "feed" && club.feed.length > 0 && (
                <span className="text-[10px] font-bold text-zinc-600">{club.feed.length}</span>
              )}
              {tab.key === "discussions" && club.discussions.length > 0 && (
                <span className="text-[10px] font-bold text-zinc-600">{club.discussions.length}</span>
              )}
              {tab.key === "members" && (
                <span className="text-[10px] font-bold text-zinc-600">{club.members.length}</span>
              )}
              {activeTab === tab.key && (
                <span className="absolute -bottom-[1px] left-0 h-[2px] w-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6 animate-fade-up" key={activeTab}>
          {activeTab === "feed" && <FeedTab club={club} isMember={isMember} />}
          {activeTab === "discussions" && <DiscussionsTab club={club} isMember={isMember} />}
          {activeTab === "members" && <MembersTab club={club} />}
        </div>
      </div>
    </div>
  );
}

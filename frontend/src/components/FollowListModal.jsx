// src/components/FollowListModal.jsx
import { Link } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";

export default function FollowListModal({ isOpen, onClose, list = [], title }) {
  const { getUserMetadata } = useProfile();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090b14]/98 shadow-2xl shadow-black/70 backdrop-blur-2xl animate-scale-in">
        
        {/* Header with X on the right */}
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-white">{title}</h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              {list.length} {list.length === 1 ? "person" : "people"} in this list
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/10 hover:text-white transition-all"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User list */}
        <div className="max-h-[60vh] space-y-1.5 overflow-y-auto p-3 [scrollbar-color:rgba(124,58,237,0.3)_transparent] [scrollbar-width:thin]">
          {list.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-bold text-zinc-500">List is empty</p>
              <p className="mt-1.5 text-xs text-zinc-700">No users to display.</p>
            </div>
          ) : (
            list.map((username) => {
              const meta = getUserMetadata(username);
              return (
                <Link
                  to={`/profile/${username}`}
                  onClick={onClose}
                  key={username}
                  className="flex items-center gap-3.5 rounded-xl border border-white/[0.05] bg-white/[0.025] p-3 transition-all hover:border-white/[0.10] hover:bg-white/[0.05]"
                >
                  {/* Avatar */}
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-violet-500/30 ring-offset-1 ring-offset-[#090b14]">
                    <img
                      src={meta.avatarUrl}
                      alt={meta.displayName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  
                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-black text-white">
                      {meta.displayName}
                    </h3>
                    <p className="truncate text-xs text-zinc-500">
                      @{username}
                    </p>
                  </div>

                  {/* Arrow Indicator */}
                  <svg className="h-4 w-4 text-zinc-500 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })
          )}
        </div>



      </div>
    </div>
  );
}

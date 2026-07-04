// src/pages/ProfilePage.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams, Navigate, useLocation, Link, useNavigate } from "react-router-dom";
import EditProfileModal from "../components/EditProfileModal";
import FollowListModal from "../components/FollowListModal";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { useCollections } from "../context/CollectionsContext";
import { useClubs } from "../context/ClubsContext";
import { api } from "../utils/api";

import { API_BASE as API } from "../config.js";
import { posterUrl } from "../utils/tmdb";


export default function ProfilePage() {
  const { username } = useParams();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { getOrCreateProfile, toggleFollowUser, getUserMetadata } = useProfile();
  const { collections: myCollections } = useCollections();
  const { savedCollectionIds } = useClubs();
  
  const location = useLocation();
  const navigate = useNavigate();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowListOpen, setIsFollowListOpen] = useState(false);
  const [followListTitle, setFollowListTitle] = useState("");
  const [followListUsernames, setFollowListUsernames] = useState([]);

  const [localReviews, setLocalReviews] = useState([]);
  const [resolvedMedia, setResolvedMedia] = useState({});
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("reviews");
  const [targetCollections, setTargetCollections] = useState([]);
  const { clubs } = useClubs();

  const targetUsername = useMemo(() => {
    if (username === "me") {
      return isAuthenticated ? user?.preferredUsername : null;
    }
    return username;
  }, [username, isAuthenticated, user]);

  useEffect(() => {
    if (!targetUsername) return;
    setReviewsLoading(true);
    fetch(`${API}/api/reviews/user/${targetUsername}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLocalReviews(data.map(r => ({
            ...r,
            mediaType: r.mediaType,
            mediaId: r.mediaId,
          })));
        }
      })
      .catch(() => setLocalReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [targetUsername]);

  useEffect(() => {
    if (!targetUsername) return;
    fetch(`${API}/api/collections/user/${targetUsername}`)
      .then(res => res.json())
      .then(data => setTargetCollections(data || []))
      .catch(() => setTargetCollections([]));
  }, [targetUsername]);

  const { loadProfile } = useProfile();
  useEffect(() => {
    if (targetUsername) loadProfile(targetUsername);
  }, [targetUsername, loadProfile]);

  useEffect(() => {
    localReviews.forEach(async (rev) => {
      const cacheKey = `${rev.mediaType}-${rev.mediaId}`;
      if (resolvedMedia[cacheKey]) return;
      try {
        let details;
        if (rev.mediaType === "movie") {
          details = await api.getMovieDetails(rev.mediaId);
        } else {
          details = await api.getTvDetails(rev.mediaId);
        }
        setResolvedMedia((prev) => ({
          ...prev,
          [cacheKey]: {
            title: details.title || details.name,
            posterPath: details.poster_path,
            year: (details.release_date || details.first_air_date || "").slice(0, 4) || "TBA"
          }
        }));
      } catch (err) {
        console.error("Error fetching media details for", cacheKey, err);
      }
    });
  }, [localReviews]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
      </div>
    );
  }

  if (username === "me" && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const profile = getOrCreateProfile(targetUsername);

  if (!profile) {
    return (
      <main className="min-h-screen text-white" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-xl text-center py-32 px-4">
          <h1 className="text-xl font-semibold text-white">User not found</h1>
          <p className="text-zinc-500 mt-2 text-sm">This profile doesn't exist.</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2 text-sm font-medium text-white hover:bg-white/20 transition">
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  const isOwnProfile = isAuthenticated && user?.preferredUsername?.toLowerCase() === profile.username.toLowerCase();
  const isFollowingTarget = isAuthenticated && !isOwnProfile && profile.followers.includes(user.preferredUsername.toLowerCase());

  const handleFollowClick = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }
    toggleFollowUser(profile.username);
  };

  const openFollowersModal = () => {
    setFollowListTitle("Followers");
    setFollowListUsernames(profile.followers);
    setIsFollowListOpen(true);
  };

  const openFollowingModal = () => {
    setFollowListTitle("Following");
    setFollowListUsernames(profile.following);
    setIsFollowListOpen(true);
  };

  const userCollections = isOwnProfile 
    ? myCollections
    : targetCollections
        .filter(c => c.isPublic === true)
        .map(c => ({
          ...c,
          name: c.title,
          items: c.items || []
        }));

  const userClubs = clubs.filter((c) => c.members.some((m) => m.username.toLowerCase() === profile.username.toLowerCase()));

  const tabs = [
    { id: "reviews", label: "Reviews", count: localReviews.length },
    { id: "collections", label: "Collections", count: userCollections.length },
    { id: "clubs", label: "Clubs", count: userClubs.length },
  ];

  return (
    <main className="min-h-screen text-white" style={{ background: "var(--bg)" }}>
      {/* Subtle noise texture background */}
      <div className="fixed inset-0 -z-10 bg-[#08090c]" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(120,80,255,0.08),transparent)]" />

      <div className="mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6">

        {/* ── COMPACT PROFILE HEADER ── */}
        <header className="mb-8">
          {/* Top row: avatar + name block + action */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-white/10"
              />
              <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#08090c]" />
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white leading-tight truncate">{profile.displayName}</h1>
              </div>
              <p className="text-sm text-zinc-500 font-medium leading-tight mt-0.5">@{profile.username}</p>
            </div>

            {/* Action button */}
            <div className="shrink-0">
              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit
                </button>
              ) : (
                <button
                  onClick={handleFollowClick}
                  className={`rounded-lg px-5 py-1.5 text-sm font-semibold transition-all ${
                    isFollowingTarget
                      ? "border border-white/10 bg-white/5 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20"
                      : "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/30"
                  }`}
                >
                  {isFollowingTarget ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-4 text-sm text-zinc-400 leading-relaxed max-w-lg pl-0">
              {profile.bio}
            </p>
          )}

          {/* Stats row */}
          <div className="mt-4 flex items-center gap-5 text-sm">
            <button onClick={openFollowersModal} className="flex items-center gap-1.5 group">
              <span className="font-semibold text-white group-hover:text-violet-400 transition-colors">{profile.followers?.length || 0}</span>
              <span className="text-zinc-500 group-hover:text-zinc-400 transition-colors">followers</span>
            </button>
            <span className="text-zinc-700">·</span>
            <button onClick={openFollowingModal} className="flex items-center gap-1.5 group">
              <span className="font-semibold text-white group-hover:text-violet-400 transition-colors">{profile.following?.length || 0}</span>
              <span className="text-zinc-500 group-hover:text-zinc-400 transition-colors">following</span>
            </button>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-500 text-xs">Joined {profile.joinDate}</span>
          </div>
        </header>

        {/* ── DIVIDER ── */}
        <div className="h-px bg-white/[0.06] mb-6" />

        {/* ── TABS ── */}
        <nav className="flex items-center gap-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              }`}
            >
              {tab.label}
              <span className={`text-xs rounded-md px-1.5 py-0.5 font-semibold tabular-nums ${
                activeTab === tab.id ? "bg-white/15 text-white/80" : "bg-white/5 text-zinc-600"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>

        {/* ── CONTENT ── */}
        <div>

          {/* REVIEWS TAB */}
          {activeTab === "reviews" && (
            <div className="space-y-3">
              {localReviews.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-zinc-600">No reviews yet.</p>
                </div>
              ) : (
                localReviews.map((rev) => {
                  const cacheKey = `${rev.mediaType}-${rev.mediaId}`;
                  const media = resolvedMedia[cacheKey];
                  const route = rev.mediaType === "movie" ? `/cinema/${rev.mediaId}` : `/tv/${rev.mediaId}`;
                  return (
                    <article
                      key={rev.id}
                      className="flex gap-4 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                    >
                      {/* Poster */}
                      <Link to={route} className="shrink-0 w-11 h-16 rounded-lg overflow-hidden bg-zinc-900 block border border-white/5">
                        {media?.posterPath ? (
                          <img src={posterUrl(media.posterPath)} alt={media.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="h-full w-full bg-zinc-800" />
                        )}
                      </Link>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <Link to={route} className="text-sm font-semibold text-white hover:text-violet-400 transition-colors truncate leading-snug">
                            {media?.title || "Loading..."}
                          </Link>
                          <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-amber-400">
                            <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            {rev.rating.toFixed(1)}
                          </div>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{media?.year} · {rev.mediaType === "movie" ? "Movie" : "TV"}</p>
                        <p className="mt-2 text-xs text-zinc-400 leading-relaxed line-clamp-2">{rev.text}</p>
                        <p className="mt-1.5 text-[10px] text-zinc-600">
                          {new Date(rev.createdAt || rev.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}

          {/* COLLECTIONS TAB */}
          {activeTab === "collections" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {userCollections.length === 0 ? (
                <div className="col-span-full py-16 text-center">
                  <p className="text-sm text-zinc-600">No collections yet.</p>
                </div>
              ) : (
                userCollections.map((col) => {
                  const itemCount = col.items?.length || 0;
                  const bgImage = col.coverImage || (itemCount > 0 && col.items[0].posterPath ? posterUrl(col.items[0].posterPath) : null);
                  return (
                    <Link
                      key={col.id}
                      to={`/collection/${col.id}`}
                      className="group relative overflow-hidden rounded-xl bg-zinc-900 border border-white/5 hover:border-white/15 transition-all"
                      style={{ aspectRatio: "4/3" }}
                    >
                      {bgImage ? (
                        <img src={bgImage} alt={col.name || col.title} className="absolute inset-0 h-full w-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-zinc-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                      {isOwnProfile && col.isPublic && (
                        <div className="absolute top-2 right-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">Public</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-sm font-semibold text-white truncate leading-tight">{col.name || col.title}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}

          {/* CLUBS TAB */}
          {activeTab === "clubs" && (
            <div className="space-y-2">
              {userClubs.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-zinc-600">No clubs joined yet.</p>
                </div>
              ) : (
                userClubs.map((club) => (
                  <Link
                    key={club.id}
                    to={`/community/${club.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5 hover:bg-white/[0.04] hover:border-white/10 transition-all"
                  >
                    <div className="h-10 w-10 rounded-lg bg-zinc-800 shrink-0 overflow-hidden border border-white/10">
                      {club.coverImage ? (
                        <img src={club.coverImage} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <svg className="h-5 w-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{club.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{club.members.length} member{club.members.length !== 1 ? "s" : ""}</p>
                    </div>
                    <svg className="h-4 w-4 text-zinc-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      <EditProfileModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} profile={profile} />
      <FollowListModal isOpen={isFollowListOpen} onClose={() => setIsFollowListOpen(false)} list={followListUsernames} title={followListTitle} />
    </main>
  );
}

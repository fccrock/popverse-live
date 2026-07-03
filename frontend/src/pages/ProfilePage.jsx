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

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowListOpen, setIsFollowListOpen] = useState(false);
  const [followListTitle, setFollowListTitle] = useState("");
  const [followListUsernames, setFollowListUsernames] = useState([]);

  // Local state for reviews and movie resolution
  const [localReviews, setLocalReviews] = useState([]);
  const [resolvedMedia, setResolvedMedia] = useState({});
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Active tab state: "reviews" | "collections" | "clubs"
  const [activeTab, setActiveTab] = useState("reviews");
  const [targetCollections, setTargetCollections] = useState([]);
  const { clubs } = useClubs();

  // Determine target username
  const targetUsername = useMemo(() => {
    if (username === "me") {
      return isAuthenticated ? user?.preferredUsername : null;
    }
    return username;
  }, [username, isAuthenticated, user]);

  // Load reviews from database (visible to everyone!)
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

  // Load collections for target user
  useEffect(() => {
    if (!targetUsername) return;
    fetch(`${API}/api/collections/user/${targetUsername}`)
      .then(res => res.json())
      .then(data => setTargetCollections(data || []))
      .catch(() => setTargetCollections([]));
  }, [targetUsername]);

  // Always load the target user profile fresh from DB (so followers are accurate)
  const { loadProfile } = useProfile();
  useEffect(() => {
    if (targetUsername) loadProfile(targetUsername);
  }, [targetUsername, loadProfile]);

  // Asynchronously resolve movie/tv details for reviews
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

  // If auth is loading, show spinner
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030509]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
          <p className="text-sm text-zinc-700 animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if "/profile/me" is visited and user is not authenticated
  if (username === "me" && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Retrieve/Create target user profile
  const profile = getOrCreateProfile(targetUsername);

  if (!profile) {
    return (
      <main className="min-h-screen text-white" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-xl text-center py-20 px-4">
          <div className="mb-6 grid h-16 w-16 mx-auto place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
            <svg className="h-7 w-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white">Profile Not Found</h1>
          <p className="text-zinc-600 mt-2 text-sm">The requested user profile does not exist.</p>
          <Link to="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold shadow-lg shadow-violet-900/30 transition hover:-translate-y-0.5 hover:bg-violet-500">
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  // Check relationship
  const isOwnProfile = isAuthenticated && user?.preferredUsername?.toLowerCase() === profile.username.toLowerCase();
  const isFollowingTarget = isAuthenticated && !isOwnProfile && profile.followers.includes(user.preferredUsername.toLowerCase());

  const handleFollowClick = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }
    toggleFollowUser(profile.username);
  };

  // Open followers list modal
  const openFollowersModal = () => {
    setFollowListTitle("Followers");
    setFollowListUsernames(profile.followers);
    setIsFollowListOpen(true);
  };

  // Open following list modal
  const openFollowingModal = () => {
    setFollowListTitle("Following");
    setFollowListUsernames(profile.following);
    setIsFollowListOpen(true);
  };

  // Resolve target user collections
  // Own profile: show all collections
  // Other profile: show only PUBLIC collections
  const userCollections = isOwnProfile 
    ? myCollections
    : targetCollections
        .filter(c => c.isPublic === true)
        .map(c => ({
          ...c,
          name: c.title,
          items: c.items || []
        }));

  // Resolve target user clubs
  const userClubs = clubs.filter((c) => c.members.some((m) => m.username.toLowerCase() === profile.username.toLowerCase()));

  return (
    <main className="min-h-screen text-white" style={{ background: "var(--bg)" }}>
      {/* Ambient bg - subtler */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#06070a] via-[#040406] to-[#030304]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-20 pb-12 sm:px-6">
        
        {/* ── 1. Bento Box Header Grid ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          
          {/* Main Identity Box (Spans 2 columns) */}
          <div className="md:col-span-2 relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.015] p-6 backdrop-blur-md transition-all hover:bg-white/[0.02]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-70" />
            
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="h-20 w-20 overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-lg shadow-black/20">
                  <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full object-cover" />
                </div>
                <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#06070a] bg-emerald-500" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white truncate">{profile.displayName}</h1>
                  {profile.isVerified && (
                    <svg className="h-4 w-4 text-violet-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-zinc-500 font-medium">@{profile.username}</p>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed line-clamp-3">
                  {profile.bio || "This user hasn't added a bio yet."}
                </p>
              </div>
              
              {/* Action */}
              <div className="shrink-0 mt-2 sm:mt-0">
                {isOwnProfile ? (
                  <button onClick={() => setIsEditOpen(true)} className="flex items-center justify-center h-9 px-4 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-all">
                    Edit Profile
                  </button>
                ) : (
                  <button onClick={handleFollowClick} className={`flex items-center justify-center h-9 min-w-[90px] rounded-xl text-xs font-semibold transition-all ${isFollowingTarget ? "border border-white/10 bg-white/5 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20" : "bg-white text-black hover:bg-zinc-200"}`}>
                    {isFollowingTarget ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Network & Meta Boxes */}
          <div className="grid grid-rows-2 gap-4">
            
            {/* Network Box */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.015] p-5 flex flex-col justify-center backdrop-blur-md transition-all hover:bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <button onClick={openFollowersModal} className="flex flex-col group text-left">
                  <span className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">{profile.followers.length}</span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mt-0.5">Followers</span>
                </button>
                <div className="h-8 w-px bg-white/10"></div>
                <button onClick={openFollowingModal} className="flex flex-col group text-right">
                  <span className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">{profile.following.length}</span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mt-0.5">Following</span>
                </button>
              </div>
            </div>

            {/* Meta Box */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.015] p-5 flex flex-col justify-center backdrop-blur-md transition-all hover:bg-white/[0.02]">
              <div className="flex items-center gap-3 text-zinc-400">
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                  <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Joined</span>
                  <span className="block text-sm text-zinc-300 mt-0.5">{profile.joinDate}</span>
                </div>
              </div>
            </div>
            
          </div>
        </section>

        {/* ── 2. Sleek Tab Navigation ── */}
        <div className="flex items-center gap-6 border-b border-white/5 mb-6 overflow-x-auto [scrollbar-width:none]">
          {[
            { id: "reviews", label: "Reviews", count: localReviews.length },
            { id: "collections", label: "Collections", count: userCollections.length },
            { id: "clubs", label: "Clubs", count: userClubs.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-3 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/10 text-white' : 'bg-white/5 text-zinc-500'}`}>
                {tab.count}
              </span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-white rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* ── 3. Normal-Sized Main Content ── */}
        <div className="w-full">
          
          {/* TAB CONTENT: Reviews */}
          {activeTab === "reviews" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {localReviews.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-white/10 py-12 text-center">
                  <p className="text-sm font-medium text-zinc-500">No reviews found.</p>
                </div>
              ) : (
                localReviews.map((rev) => {
                  const cacheKey = `${rev.mediaType}-${rev.mediaId}`;
                  const media = resolvedMedia[cacheKey];
                  const route = rev.mediaType === "movie" ? `/cinema/${rev.mediaId}` : `/tv/${rev.mediaId}`;

                  return (
                    <article 
                      key={rev.id}
                      className="flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.03]"
                    >
                      <div className="flex gap-3 mb-3">
                        <Link to={route} className="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-zinc-900 block">
                          {media?.posterPath ? (
                            <img src={posterUrl(media.posterPath)} alt={media.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-zinc-800 text-[8px] text-zinc-600">...</div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <Link to={route} className="text-sm font-bold hover:text-violet-400 transition block text-white truncate">
                            {media?.title || "Loading..."}
                          </Link>
                          <span className="text-[11px] text-zinc-500 block mt-0.5">
                            {media?.year || "..."}
                          </span>
                        </div>
                        <div className="shrink-0">
                          <span className="flex items-center text-xs font-bold text-white bg-white/10 px-1.5 py-0.5 rounded">
                            <span className="text-violet-400 mr-1">★</span>{rev.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 bg-white/[0.015] p-3 rounded-xl flex-1 border border-white/[0.02]">
                        {rev.text}
                      </p>
                      <div className="mt-2 text-right">
                        <span className="text-[9px] text-zinc-600 uppercase tracking-wide">
                          {new Date(rev.createdAt || rev.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}

          {/* TAB CONTENT: Collections */}
          {activeTab === "collections" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {userCollections.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-white/10 py-12 text-center">
                  <p className="text-sm font-medium text-zinc-500">No collections found.</p>
                </div>
              ) : (
                userCollections.map((col) => {
                  const itemCount = col.items?.length || 0;
                  const bgImage = col.coverImage || (itemCount > 0 && col.items[0].posterPath ? posterUrl(col.items[0].posterPath) : null);
                  
                  return (
                    <Link
                      key={col.id}
                      to={`/collection/${col.id}`}
                      className="group relative overflow-hidden rounded-xl border border-white/5 bg-zinc-900 transition-all hover:border-white/20"
                      style={{ aspectRatio: "16/9" }}
                    >
                      {bgImage ? (
                        <img src={bgImage} alt={col.name || col.title} className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-80" />
                      ) : (
                        <div className="absolute inset-0 bg-zinc-800 opacity-50" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {isOwnProfile && col.isPublic && (
                        <div className="absolute top-2 right-2 z-10">
                          <span className="rounded bg-black/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20 backdrop-blur-sm">Public</span>
                        </div>
                      )}
                      
                      <div className="absolute inset-x-0 bottom-0 p-3 z-10">
                        <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">{col.name || col.title}</h3>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {itemCount} {itemCount === 1 ? "Item" : "Items"}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}

          {/* TAB CONTENT: Clubs */}
          {activeTab === "clubs" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {userClubs.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-white/10 py-12 text-center">
                  <p className="text-sm font-medium text-zinc-500">No clubs joined.</p>
                </div>
              ) : (
                userClubs.map((club) => (
                  <Link
                    key={club.id}
                    to={`/community/${club.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:bg-white/5"
                  >
                    <div className="h-10 w-10 rounded-lg bg-zinc-800 shrink-0 overflow-hidden">
                      {club.coverImage ? (
                        <img src={club.coverImage} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[8px] text-zinc-500">Club</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{club.name}</h3>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{club.members.length} members</p>
                    </div>
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

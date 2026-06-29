// src/pages/ProfilePage.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams, Navigate, useLocation, Link, useNavigate } from "react-router-dom";
import EditProfileModal from "../components/EditProfileModal";
import FollowListModal from "../components/FollowListModal";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { useCollections } from "../context/CollectionsContext";
import { useClubs, MOCK_COLLECTIONS as GLOBAL_COLLECTIONS } from "../context/ClubsContext";
import { api } from "../utils/api";
import { posterUrl } from "../utils/tmdb";

// ── Seed Reviews Data ────────────────────────────────────────────────────────
const SEED_REVIEWS = {
  cinemaphile: [
    { id: "rev-c1", rating: 5, text: "An absolute masterpiece of modern cinema. Nolan's screenplay is brilliant, and the pacing is perfect. The dream layers are crafted with such precision that it demands multiple viewings.", isSpoiler: false, timestamp: Date.now() - 3 * 86400000, helpful: 24, mediaId: "27205", mediaType: "movie" },
    { id: "rev-c2", rating: 5, text: "Mind-bending and emotionally resonant. The Hans Zimmer soundtrack elevates it to a spiritual experience. The relationship between Cooper and Murph is the emotional anchor that holds this cosmic epic together.", isSpoiler: false, timestamp: Date.now() - 10 * 86400000, helpful: 42, mediaId: "157336", mediaType: "movie" }
  ],
  moviefreak: [
    { id: "rev-m1", rating: 5, text: "Non-stop action, incredible stunts, and amazing practical effects. A masterclass in action cinema! George Miller proves that visual storytelling is still alive and kicking in Hollywood.", isSpoiler: false, timestamp: Date.now() - 1 * 86400000, helpful: 18, mediaId: "76341", mediaType: "movie" },
    { id: "rev-m2", rating: 5, text: "Ledger's performance is legendary. The screenplay is tight and the themes of chaos and order are perfectly explored. The best comic book film ever made, hands down.", isSpoiler: false, timestamp: Date.now() - 6 * 86400000, helpful: 35, mediaId: "155", mediaType: "movie" }
  ],
  screen_siren: [
    { id: "rev-s1", rating: 5, text: "Kubrick's atmosphere is unmatched. Jack Nicholson's descent into madness is chilling, and the cinematography makes the Overlook Hotel a character of its own. Truly terrifying.", isSpoiler: true, timestamp: Date.now() - 4 * 86400000, helpful: 29, mediaId: "694", mediaType: "movie" }
  ]
};

// ── Mock Collections for Seed Users ──────────────────────────────────────────
const MOCK_COLLECTIONS = {
  cinemaphile: [
    { id: "col-c1", name: "Mind Benders", items: [
      { mediaId: "movie-27205", posterPath: "/o0OehrcA7JuD58Ad6fs4Qj7GiZ1.jpg", title: "Inception" },
      { mediaId: "movie-157336", posterPath: "/gEU2QvHOm56YvTHz6U6pI2fh0Mn.jpg", title: "Interstellar" }
    ]},
    { id: "col-c2", name: "Modern Classics", items: [
      { mediaId: "movie-155", posterPath: "/qJ2tWwGb51Y2tZ65PGqvAzPsuP3.jpg", title: "The Dark Knight" }
    ]}
  ],
  moviefreak: [
    { id: "col-m1", name: "Adrenaline Rushes", items: [
      { mediaId: "movie-76341", posterPath: "/hA2QPEw2gcI6n5iRzqnR786Y4wK.jpg", title: "Mad Max: Fury Road" },
      { mediaId: "movie-155", posterPath: "/qJ2tWwGb51Y2tZ65PGqvAzPsuP3.jpg", title: "The Dark Knight" }
    ]}
  ],
  screen_siren: [
    { id: "col-s1", name: "Spooky Classics", items: [
      { mediaId: "movie-694", posterPath: "/998N2z20A65R6c2nH6t7HGecUhi.jpg", title: "The Shining" }
    ]}
  ]
};

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
    fetch(`http://localhost:5000/api/reviews/user/${targetUsername}`)
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
    fetch(`http://localhost:5000/api/collections/user/${targetUsername}`)
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
      {/* Ambient bg */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(124,58,237,0.12),transparent_35%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060b] via-[#020306] to-[#030509]" />
      </div>

      {/* Profile Container */}
      <div className="mx-auto max-w-[1200px] px-4 pt-24 pb-8 sm:px-6 lg:px-8">
        
        {/* ── 1. Hero Header Banner ── */}
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 sm:p-8 mb-5 shadow-xl shadow-black/20 backdrop-blur-sm">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(124,58,237,0.06),transparent_60%)]" />
          
          <div className="relative flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left flex-1">
              {/* Profile Avatar */}
              <div className="relative shrink-0">
                <div className="h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-2xl ring-2 ring-violet-500/40 ring-offset-2 ring-offset-[#0b0d16] shadow-2xl shadow-violet-900/20">
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Online indicator */}
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#0b0d16] bg-emerald-500 shadow-lg shadow-emerald-500/30" />
              </div>

              {/* Profile Details */}
              <div className="mt-1 md:mt-0 flex-1">
                <div className="flex items-center justify-center md:justify-start gap-2.5">
                  <h1 className="text-2xl font-black tracking-tight text-white">{profile.displayName}</h1>
                  <svg className="h-5 w-5 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-600 mt-1">@{profile.username}</p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400 max-w-md">
                  {profile.bio}
                </p>
                
                {/* Join Date */}
                <div className="mt-4 flex items-center justify-center md:justify-start gap-2 text-xs text-zinc-600">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Joined {profile.joinDate}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="shrink-0 mt-4 md:mt-0">
              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-2.5 text-sm font-semibold text-violet-400 transition-all hover:bg-violet-500/15 hover:border-violet-400/50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleFollowClick}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    isFollowingTarget
                      ? "border border-white/[0.10] bg-white/[0.05] text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20"
                      : "bg-violet-600 text-white shadow-lg shadow-violet-900/30 hover:-translate-y-0.5 hover:bg-violet-500"
                  }`}
                >
                  {isFollowingTarget ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>
          </div>

        </section>

        {/* ── 2. Content Tabs ── */}
        <div className="border border-white/[0.06] bg-white/[0.02] rounded-2xl flex items-center px-2 mb-5 overflow-x-auto [scrollbar-width:none] backdrop-blur-sm">
          {[
            { id: "reviews", label: "Reviews" },
            { id: "collections", label: "Collections" },
            { id: "clubs", label: "Clubs" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-zinc-600 hover:text-zinc-300"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute -bottom-[1px] left-0 h-px w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ── 3. Main Split Section ── */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
          
          {/* LEFT: Content */}
          <div className="space-y-3">
            {/* TAB CONTENT: Reviews */}
            {activeTab === "reviews" && (
              <>
                {localReviews.length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-12 text-center">
                    <div className="mb-4 grid h-14 w-14 mx-auto place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.04]">
                      <svg className="h-6 w-6 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </div>
                    <p className="text-base font-black text-zinc-500">No reviews yet</p>
                    <p className="mt-2 text-sm text-zinc-700">
                      {isOwnProfile 
                        ? "You haven't written any reviews yet. Share your thoughts!"
                        : `@${profile.username} hasn't posted any reviews yet.`}
                    </p>
                  </div>
                ) : (
                  localReviews.map((rev) => {
                    const cacheKey = `${rev.mediaType}-${rev.mediaId}`;
                    const media = resolvedMedia[cacheKey];
                    // Fix: movie route is /cinema/:id, tv route is /tv/:id
                    const route = rev.mediaType === "movie" 
                      ? `/cinema/${rev.mediaId}` 
                      : `/tv/${rev.mediaId}`;

                    return (
                      <article 
                        key={rev.id}
                        className="flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 shadow-lg shadow-black/10 transition-all hover:border-white/[0.10] hover:bg-white/[0.04] backdrop-blur-sm"
                      >
                        {/* Poster */}
                        <Link 
                          to={route}
                          className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden shrink-0 border border-white/[0.07] bg-zinc-900 shadow-lg"
                        >
                          {media?.posterPath ? (
                            <img
                              src={posterUrl(media.posterPath)}
                              alt={media.title}
                              className="h-full w-full object-cover transition hover:scale-105 duration-300"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] text-zinc-700 font-medium">
                              Loading...
                            </div>
                          )}
                        </Link>

                        {/* Review text and details */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Reviewed</span>
                              <Link to={route} className="text-base font-black hover:text-violet-400 transition mt-0.5 block text-white">
                                {media?.title || "Loading..."}
                              </Link>
                              <span className="text-xs text-zinc-600 block mt-0.5">
                                {media?.year || "..."} · {rev.mediaType === "movie" ? "Movie" : "TV Show"}
                              </span>
                            </div>
                            
                            {/* Rating */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <span key={s} className={`text-sm ${s <= rev.rating ? "text-violet-400" : "text-zinc-800"}`}>★</span>
                                ))}
                              </div>
                              <span className="text-sm font-black text-violet-400">{rev.rating.toFixed(1)}</span>
                            </div>
                          </div>

                          <p className="mt-2.5 text-sm text-zinc-400 leading-relaxed flex-1 line-clamp-3">
                            {rev.text}
                          </p>

                          <div className="mt-2.5">
                            <span className="text-[11px] text-zinc-700">
                              {new Date(rev.createdAt || rev.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </>
            )}

            {/* TAB CONTENT: Collections */}
            {activeTab === "collections" && (
              <div className="grid sm:grid-cols-2 gap-3">
                {userCollections.length === 0 ? (
                  <div className="col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-12 text-center">
                    <p className="text-base font-black text-zinc-500">
                      {isOwnProfile ? "No collections yet" : "No public collections"}
                    </p>
                    {!isOwnProfile && (
                      <p className="text-xs text-zinc-700 mt-1">This user hasn't made any collections public yet.</p>
                    )}
                  </div>
                ) : (
                  userCollections.map((col) => {
                    const itemCount = col.items?.length || 0;
                    const cardContent = (
                      <>
                        {/* Public badge for own profile */}
                        {isOwnProfile && col.isPublic && (
                          <div className="absolute top-4 right-4">
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">Public</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-3 pr-16">
                          <h3 className="text-sm font-black text-white truncate">{col.name || col.title}</h3>
                        </div>
                        <div className="flex gap-2 overflow-hidden h-16">
                          {itemCount > 0 ? (
                            col.items.slice(0, 5).map((item, idx) => (
                              <div key={idx} className="w-12 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/[0.06]">
                                <img src={posterUrl(item.posterPath)} alt={item.title} className="h-full w-full object-cover" />
                              </div>
                            ))
                          ) : (
                            <div className="w-full flex items-center justify-center border border-dashed border-white/[0.08] rounded-xl text-[11px] text-zinc-700">Empty</div>
                          )}
                        </div>
                        <p className="mt-3 text-[11px] text-zinc-600">{itemCount} {itemCount === 1 ? "title" : "titles"}</p>
                      </>
                    );

                    if (isOwnProfile) {
                      return (
                        <Link
                          key={col.id}
                          to={`/collection/${col.id}`}
                          className="block relative rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 shadow-lg shadow-black/10 transition-all hover:border-violet-500/30 hover:bg-white/[0.04]"
                        >
                          {cardContent}
                        </Link>
                      );
                    } else {
                      return (
                        <Link
                          key={col.id}
                          to={`/collection/${col.id}`}
                          className="block relative rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 shadow-lg shadow-black/10 transition-all hover:border-violet-500/30 hover:bg-white/[0.04]"
                        >
                          {cardContent}
                        </Link>
                      );
                    }
                  })
                )}
              </div>
            )}


            {/* TAB CONTENT: Clubs */}
            {activeTab === "clubs" && (
              <div className="grid sm:grid-cols-2 gap-3">
                {userClubs.length === 0 ? (
                  <div className="col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-12 text-center">
                    <p className="text-base font-black text-zinc-500">No clubs joined yet</p>
                  </div>
                ) : (
                  userClubs.map((club) => (
                    <Link
                      key={club.id}
                      to={`/community/${club.slug}`}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 shadow-lg shadow-black/10 transition hover:bg-white/[0.05]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 shrink-0 overflow-hidden">
                          {club.coverImage ? (
                            <img src={club.coverImage} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-black text-white truncate">{club.name}</h3>
                          <p className="text-xs text-zinc-600 mt-0.5">{club.members.length} members</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar Widgets */}
          <aside className="space-y-4">
            
            {/* Widget: Follow */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 shadow-lg shadow-black/10 backdrop-blur-sm">
              <h2 className="text-sm font-black text-white mb-4">Network</h2>

              {/* Followers avatars */}
              {profile.followers.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex -space-x-2.5 overflow-hidden">
                    {profile.followers.slice(0, 5).map((followerUsername) => {
                      const followerMeta = getUserMetadata(followerUsername);
                      return (
                        <Link
                          key={followerUsername}
                          to={`/profile/${followerUsername}`}
                          className="inline-block h-8 w-8 rounded-full ring-2 ring-[#0b0d16] transition hover:z-10 hover:scale-110"
                        >
                          <img src={followerMeta.avatarUrl} alt={followerUsername} className="h-full w-full object-cover rounded-full" />
                        </Link>
                      );
                    })}
                  </div>
                  {profile.followers.length > 5 && (
                    <div className="h-8 w-8 rounded-full bg-white/[0.07] ring-2 ring-[#0b0d16] flex items-center justify-center text-[10px] font-bold text-zinc-400">
                      +{profile.followers.length - 5}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button onClick={openFollowersModal} className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] py-3 text-sm font-semibold text-zinc-400 transition hover:bg-white/[0.06] hover:text-violet-400">
                  <span className="text-lg font-black text-white">{profile.followers.length}</span>
                  <span className="text-[11px]">Followers</span>
                </button>
                <button onClick={openFollowingModal} className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] py-3 text-sm font-semibold text-zinc-400 transition hover:bg-white/[0.06] hover:text-violet-400">
                  <span className="text-lg font-black text-white">{profile.following.length}</span>
                  <span className="text-[11px]">Following</span>
                </button>
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        profile={profile}
      />

      <FollowListModal
        isOpen={isFollowListOpen}
        onClose={() => setIsFollowListOpen(false)}
        list={followListUsernames}
        title={followListTitle}
      />


    </main>
  );
}

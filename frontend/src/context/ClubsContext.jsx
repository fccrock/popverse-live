// src/context/ClubsContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const ClubsContext = createContext(null);
const STORAGE_KEY = "pch_clubs";

const MOCK_CLUBS = []; // Removed mock data, fetching from AWS now

/* ── Community Collections Seed Data ── */
const SAVED_KEY = "pch_saved_collections";
export const MOCK_COLLECTIONS = [
  {
    id: "col-1",
    name: "Nolan's Complete Timeline",
    description: "Every Christopher Nolan film in release order. A masterclass in storytelling.",
    createdBy: "cinephile_max",
    tags: ["director", "sci-fi", "thriller"],
    saves: 342,
    createdAt: "2026-01-10T08:00:00Z",
    items: [
      { mediaId: 157336, mediaType: "movie", title: "Interstellar", posterPath: "/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg", year: "2014" },
      { mediaId: 27205, mediaType: "movie", title: "Inception", posterPath: "/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg", year: "2010" },
      { mediaId: 155, mediaType: "movie", title: "The Dark Knight", posterPath: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", year: "2008" },
      { mediaId: 49026, mediaType: "movie", title: "The Dark Knight Rises", posterPath: "/hr0L2aueqlP2BYUblTTjmtn0hw4.jpg", year: "2012" },
      { mediaId: 872585, mediaType: "movie", title: "Oppenheimer", posterPath: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", year: "2023" },
      { mediaId: 577922, mediaType: "movie", title: "Tenet", posterPath: "/aCIFMriQh8rvhxpN1IWGgvH0Tlg.jpg", year: "2020" },
    ],
  },
  {
    id: "col-2",
    name: "Peak A24 Cinema",
    description: "The best of A24 — from arthouse horror to coming-of-age gems.",
    createdBy: "a24_devotee",
    tags: ["indie", "horror", "drama"],
    saves: 518,
    createdAt: "2026-02-20T14:00:00Z",
    items: [
      { mediaId: 493922, mediaType: "movie", title: "Hereditary", posterPath: "/4GFPuL14eXi66V96xBWY73Y9PfR.jpg", year: "2018" },
      { mediaId: 530385, mediaType: "movie", title: "Midsommar", posterPath: "/7LEI8ulZzO5gy9Ww2NVCrKmHeDZ.jpg", year: "2019" },
      { mediaId: 545611, mediaType: "movie", title: "Everything Everywhere All at Once", posterPath: "/u68AjlvlutfEIcpmbYpKcdi09ut.jpg", year: "2022" },
      { mediaId: 361743, mediaType: "movie", title: "Lady Bird", posterPath: "/n0YuM4f5lvGAP6MAW2kBIzugXnc.jpg", year: "2017" },
      { mediaId: 270303, mediaType: "movie", title: "Ex Machina", posterPath: "/iwnQ1JH1wdWrGYkgWySptJ5284A.jpg", year: "2014" },
    ],
  },
  {
    id: "col-3",
    name: "Studio Ghibli Essentials",
    description: "The magical worlds of Miyazaki and friends. Every frame a painting.",
    createdBy: "studio_ghibli_fan",
    tags: ["anime", "animation", "fantasy"],
    saves: 891,
    createdAt: "2025-12-01T10:00:00Z",
    items: [
      { mediaId: 129, mediaType: "movie", title: "Spirited Away", posterPath: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", year: "2001" },
      { mediaId: 128, mediaType: "movie", title: "Princess Mononoke", posterPath: "/cMYCDADoLKLbB83g4WnJegaZimC.jpg", year: "1997" },
      { mediaId: 149870, mediaType: "movie", title: "Howl's Moving Castle", posterPath: "/jfwSexzlIzaOgxP9A8bTA6t8YYb.jpg", year: "2004" },
      { mediaId: 81, mediaType: "movie", title: "Nausicaä of the Valley of the Wind", posterPath: "/tcrkfB8SRPQCgwI88hQScua6nxh.jpg", year: "1984" },
      { mediaId: 14160, mediaType: "movie", title: "My Neighbor Totoro", posterPath: "/mFvoEwSfLqbcWwFsDjQebn9bzFe.jpg", year: "1988" },
      { mediaId: 4935, mediaType: "movie", title: "Grave of the Fireflies", posterPath: "/13kOl2v0nD2OLbVSHnHk8GUFEhO.jpg", year: "1988" },
    ],
  },
  {
    id: "col-4",
    name: "Mind-Bending Sci-Fi",
    description: "Films that make you question reality. Watch at your own risk.",
    createdBy: "dream_walker",
    tags: ["sci-fi", "mind-bender", "thriller"],
    saves: 267,
    createdAt: "2026-03-15T16:00:00Z",
    items: [
      { mediaId: 603, mediaType: "movie", title: "The Matrix", posterPath: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", year: "1999" },
      { mediaId: 244786, mediaType: "movie", title: "Arrival", posterPath: "/7fn624j5lj3xTme2SgiLCeuedmO.jpg", year: "2016" },
      { mediaId: 97, mediaType: "movie", title: "Blade Runner", posterPath: "/jigY9B6TKz4qlfikZcd18qtzTK4.jpg", year: "1982" },
      { mediaId: 335984, mediaType: "movie", title: "Blade Runner 2049", posterPath: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg", year: "2017" },
      { mediaId: 270303, mediaType: "movie", title: "Ex Machina", posterPath: "/iwnQ1JH1wdWrGYkgWySptJ5284A.jpg", year: "2014" },
    ],
  },
  {
    id: "col-5",
    name: "Tarantino Marathon",
    description: "All of QT's filmography ranked by violence per minute. Just kidding — by brilliance.",
    createdBy: "film_nerd_42",
    tags: ["director", "action", "crime"],
    saves: 445,
    createdAt: "2026-04-02T20:00:00Z",
    items: [
      { mediaId: 680, mediaType: "movie", title: "Pulp Fiction", posterPath: "/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg", year: "1994" },
      { mediaId: 16869, mediaType: "movie", title: "Inglourious Basterds", posterPath: "/3Gb6G2amMuKZmmCpRqM4N67s8eE.jpg", year: "2009" },
      { mediaId: 24, mediaType: "movie", title: "Kill Bill: Vol. 1", posterPath: "/v7TaX8kXMXs5yFFGR41guUDNcnB.jpg", year: "2003" },
      { mediaId: 466272, mediaType: "movie", title: "Once Upon a Time in Hollywood", posterPath: "/8j58iEBw9pOXFD2L0nt0ZXeHviB.jpg", year: "2019" },
      { mediaId: 393, mediaType: "movie", title: "Kill Bill: Vol. 2", posterPath: "/2yhg0mZQMhDyvUQ4rG1IZ4oIA8L.jpg", year: "2004" },
    ],
  },
  {
    id: "col-6",
    name: "Comfort Movies for Rainy Days",
    description: "Cozy, warm, feel-good films to watch under a blanket. Zero stress guaranteed.",
    createdBy: "shonen_queen",
    tags: ["feel-good", "comfort", "classic"],
    saves: 723,
    createdAt: "2026-05-10T12:00:00Z",
    items: [
      { mediaId: 862, mediaType: "movie", title: "Toy Story", posterPath: "/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg", year: "1995" },
      { mediaId: 11862, mediaType: "movie", title: "Ratatouille", posterPath: "/rj4LBtwQ0uGrpBnCELr716Qo3mw.jpg", year: "2007" },
      { mediaId: 508, mediaType: "movie", title: "The Grand Budapest Hotel", posterPath: "/7QPeVsr9rcFU9Gl90yg0gTOTpVv.jpg", year: "2014" },
      { mediaId: 4935, mediaType: "movie", title: "Grave of the Fireflies", posterPath: "/13kOl2v0nD2OLbVSHnHk8GUFEhO.jpg", year: "1988" },
    ],
  },
];

function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function ClubsProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedCollectionIds, setSavedCollectionIds] = useState(loadSaved);

  const loadClubs = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch clubs from our new AWS backend!
      const response = await fetch("http://localhost:5000/api/clubs");
      if (response.ok) {
        const data = await response.json();
        
        const formattedClubs = data.map(club => ({
          ...club,
          members: club.members.map(m => ({
            username: m.user.username,
            joinedAt: m.joinedAt,
            role: m.role
          })),
          feed: (club.ClubPost || []).map(p => ({
            id: p.id,
            author: p.author.username,
            content: p.content,
            timestamp: p.createdAt,
            likes: p.likes.map(l => l.user.username)
          })),
          discussions: (club.ClubDiscussion || []).map(d => ({
            id: d.id,
            title: d.title,
            content: d.content,
            author: d.author.username,
            timestamp: d.createdAt,
            replies: (d.replies || []).map(r => ({
              id: r.id,
              author: r.author.username,
              content: r.content,
              timestamp: r.createdAt,
              replies: (r.replies || []).map(subR => ({
                id: subR.id,
                author: subR.author.username,
                content: subR.content,
                timestamp: subR.createdAt
              }))
            }))
          }))
        }));
        
        setClubs(formattedClubs);
      } else {
        console.error("Failed to fetch clubs from AWS.");
      }
    } catch (error) {
      console.error("Error loading clubs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadClubs(); }, [loadClubs]);
  useEffect(() => { localStorage.setItem(SAVED_KEY, JSON.stringify(savedCollectionIds)); }, [savedCollectionIds]);

  const currentUsername = user?.preferredUsername ?? null;

  /* ── Club Queries ── */
  const getClubBySlug = useCallback((slug) => clubs.find((c) => c.slug === slug) ?? null, [clubs]);

  const isClubMember = useCallback(
    (clubId) => {
      if (!currentUsername) return false;
      const club = clubs.find((c) => c.id === clubId);
      if (!club) return false;
      return club.members.some((m) => m.username.toLowerCase() === currentUsername.toLowerCase());
    },
    [clubs, currentUsername]
  );

  const getUserRole = useCallback(
    (clubId) => {
      if (!currentUsername) return null;
      const club = clubs.find((c) => c.id === clubId);
      if (!club) return null;
      const member = club.members.find((m) => m.username.toLowerCase() === currentUsername.toLowerCase());
      return member?.role ?? null;
    },
    [clubs, currentUsername]
  );

  /* ── Collection Queries ── */
  const isCollectionSaved = useCallback((colId) => savedCollectionIds.includes(colId), [savedCollectionIds]);

  function saveCollection(colId) {
    if (!isAuthenticated || !currentUsername) return;
    setSavedCollectionIds((prev) => prev.includes(colId) ? prev : [...prev, colId]);
  }

  function unsaveCollection(colId) {
    setSavedCollectionIds((prev) => prev.filter((id) => id !== colId));
  }

  function toggleSaveCollection(colId) {
    if (!isAuthenticated || !currentUsername) return;
    setSavedCollectionIds((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  }

  /* ── Club Mutations ── */
  const createClub = useCallback(async ({ name, description, category, coverImage }) => {
    if (!isAuthenticated || !currentUsername) return null;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    
    try {
      const response = await fetch("http://localhost:5000/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          category,
          coverImage,
          createdBy: currentUsername
        })
      });

      if (response.ok) {
        // Reload all clubs from AWS
        await loadClubs();
        const data = await response.json();
        return data; // Return the newly created club
      }
    } catch (error) {
      console.error("Failed to create club on AWS", error);
    }
    return null;
  }, [isAuthenticated, currentUsername, loadClubs]);

  const joinClub = async (clubId) => {
    if (!isAuthenticated || !currentUsername) return false;

    try {
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUsername })
      });

      if (response.ok) {
        // Reload clubs from the database so the frontend is in sync
        await loadClubs();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to join club via API", error);
      return false;
    }
  };

  const leaveClub = async (clubId) => {
    if (!isAuthenticated || !currentUsername) return false;

    try {
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUsername })
      });

      if (response.ok) {
        await loadClubs();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to leave club via API", error);
      return false;
    }
  };


  const addPost = useCallback(async (clubId, content) => {
    if (!isAuthenticated || !currentUsername) return;
    try {
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, createdBy: currentUsername })
      });
      if (response.ok) {
        await loadClubs();
      }
    } catch (error) {
      console.error("Failed to add post", error);
    }
  }, [isAuthenticated, currentUsername, loadClubs]);

  const likePost = useCallback(async (clubId, postId) => {
    if (!isAuthenticated || !currentUsername) return;
    try {
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUsername })
      });
      if (response.ok) {
        await loadClubs();
      }
    } catch (error) {
      console.error("Failed to toggle like", error);
    }
  }, [isAuthenticated, currentUsername, loadClubs]);

  const addDiscussion = useCallback(async (clubId, title, content) => {
    if (!isAuthenticated || !currentUsername) return;
    try {
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, createdBy: currentUsername })
      });
      if (response.ok) {
        await loadClubs();
      }
    } catch (error) {
      console.error("Failed to add discussion", error);
    }
  }, [isAuthenticated, currentUsername, loadClubs]);

  const addReply = useCallback(async (clubId, discussionId, content, parentId = null) => {
    if (!isAuthenticated || !currentUsername) return;
    try {
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/discussions/${discussionId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, createdBy: currentUsername, parentId })
      });
      if (response.ok) {
        await loadClubs();
      }
    } catch (error) {
      console.error("Failed to add reply", error);
    }
  }, [isAuthenticated, currentUsername, loadClubs]);

  const deletePost = useCallback(async (clubId, postId) => {
    if (!isAuthenticated || !currentUsername) return;
    try {
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUsername })
      });
      if (response.ok) await loadClubs();
    } catch (error) {
      console.error("Failed to delete post", error);
    }
  }, [isAuthenticated, currentUsername, loadClubs]);

  const deleteDiscussion = useCallback(async (clubId, discussionId) => {
    if (!isAuthenticated || !currentUsername) return;
    try {
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/discussions/${discussionId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUsername })
      });
      if (response.ok) await loadClubs();
    } catch (error) {
      console.error("Failed to delete discussion", error);
    }
  }, [isAuthenticated, currentUsername, loadClubs]);

  const deleteReply = useCallback(async (clubId, discussionId, replyId) => {
    if (!isAuthenticated || !currentUsername) return;
    try {
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/discussions/${discussionId}/replies/${replyId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUsername })
      });
      if (response.ok) await loadClubs();
    } catch (error) {
      console.error("Failed to delete reply", error);
    }
  }, [isAuthenticated, currentUsername, loadClubs]);

  return (
    <ClubsContext.Provider
      value={{
        clubs, getClubBySlug, isClubMember, getUserRole,
        createClub, joinClub, leaveClub,
        addPost, deletePost,
        likePost,
        addDiscussion, deleteDiscussion,
        addReply, deleteReply,
        savedCollectionIds, isCollectionSaved, saveCollection, unsaveCollection, toggleSaveCollection,
      }}
    >
      {children}
    </ClubsContext.Provider>
  );
}

export function useClubs() {
  const ctx = useContext(ClubsContext);
  if (!ctx) throw new Error("useClubs must be used inside ClubsProvider");
  return ctx;
}

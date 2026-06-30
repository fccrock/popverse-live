// src/context/ProfileContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const ProfileContext = createContext(null);
import { API_BASE as API } from "../config.js";



export function ProfileProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [profiles, setProfiles] = useState({});

  const loadProfile = useCallback(async (username) => {
    try {
      const lowerUsername = username.toLowerCase();
      const response = await fetch(`${API}/api/users/${username}`);
      if (response.ok) {
        const data = await response.json();
        setProfiles(prev => ({
          ...prev,
          [lowerUsername]: {
            ...prev[lowerUsername],
            username: data.username,
            displayName: data.displayName || data.username,
            bio: data.bio || "",
            avatarUrl: data.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
            joinDate: "Feb 2026",
            followers: (data.followers || []).map(f => f.follower.username),
            following: (data.following || []).map(f => f.following.username)
          }
        }));
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  }, []);

  // Fetch the current user's profile on mount
  useEffect(() => {
    if (isAuthenticated && user?.preferredUsername) {
      loadProfile(user.preferredUsername);
    }
  }, [isAuthenticated, user, loadProfile]);

  // Helper to ensure a profile exists
  const getOrCreateProfile = useCallback((username) => {
    if (!username) return null;
    const lowerUsername = username.toLowerCase();
    
    if (profiles[lowerUsername]) {
      return profiles[lowerUsername];
    }
    
    // Create empty shell until loaded
    return {
      username: lowerUsername,
      displayName: lowerUsername,
      bio: "",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
      followers: [],
      following: [],
    };
  }, [profiles]);

  const updateProfile = useCallback(async (username, updates) => {
    try {
      const lowerUsername = username.toLowerCase();
      const response = await fetch(`${API}/api/users/${username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates) // { displayName, bio, avatarUrl }
      });

      if (response.ok) {
        const data = await response.json();
        setProfiles(prev => ({
          ...prev,
          [lowerUsername]: {
            ...prev[lowerUsername],
            username: data.username,
            displayName: data.displayName,
            bio: data.bio,
            avatarUrl: data.avatar
          }
        }));
      }
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  }, []);

  // Toggle follow user
  const toggleFollowUser = useCallback(async (targetUsername) => {
    if (!isAuthenticated || !user?.preferredUsername) return;
    const currentUsername = user.preferredUsername.toLowerCase();
    const tUser = targetUsername.toLowerCase();
    if (currentUsername === tUser) return; // Cant follow self

    const currentProfile = profiles[currentUsername] || getOrCreateProfile(currentUsername);
    const targetProfile = profiles[tUser] || getOrCreateProfile(tUser);
    const isFollowing = currentProfile?.following?.includes(tUser);

    try {
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const response = await fetch(`${API}/api/users/${tUser}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerUsername: currentUsername })
      });

      if (response.ok) {
        // Optimistic UI update
        setProfiles(prev => {
          const next = { ...prev };
          
          if (next[currentUsername]) {
            next[currentUsername] = {
              ...next[currentUsername],
              following: isFollowing
                ? next[currentUsername].following.filter(u => u !== tUser)
                : [...(next[currentUsername].following || []), tUser]
            };
          }

          if (next[tUser]) {
            next[tUser] = {
              ...next[tUser],
              followers: isFollowing
                ? next[tUser].followers.filter(u => u !== currentUsername)
                : [...(next[tUser].followers || []), currentUsername]
            };
          }
          
          return next;
        });
      }
    } catch (error) {
      console.error("Failed to toggle follow", error);
    }
  }, [isAuthenticated, user, profiles, getOrCreateProfile]);

  // Resolve user info (returns { displayName, avatarUrl } for widgets)
  const getUserMetadata = useCallback((username) => {
    const lower = username.toLowerCase();
    const prof = profiles[lower];
    if (prof) {
      return {
        displayName: prof.displayName,
        avatarUrl: prof.avatarUrl,
      };
    }
    // Fallback if profile not created yet
    return {
      displayName: username,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
    };
  }, [profiles]);

  return (
    <ProfileContext.Provider value={{
      profiles,
      getOrCreateProfile,
      updateProfile,
      toggleFollowUser,
      loadProfile,
      getUserMetadata,
      presetsInterests: [],
      avatarPresets: []
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}

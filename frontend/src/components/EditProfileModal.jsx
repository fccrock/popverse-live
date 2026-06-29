import { useState } from "react";
import { useProfile } from "../context/ProfileContext";
import ImageUpload from "./ImageUpload";

export default function EditProfileModal({ isOpen, onClose, profile }) {
  const { updateProfile, presetsInterests, avatarPresets } = useProfile();
  
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarType, setAvatarType] = useState("preset"); // "preset" or "image"
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatarUrl || avatarPresets[0]);
  const [selectedInterests, setSelectedInterests] = useState(profile?.interests || []);

  if (!isOpen || !profile) return null;

  const handleToggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(profile.username, {
      displayName: displayName.trim() || profile.username,
      bio: bio.trim(),
      avatarUrl: selectedAvatar,
      interests: selectedInterests,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      {/* Modal Card */}
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090b14]/98 shadow-2xl shadow-black/70 backdrop-blur-2xl animate-scale-in">
        
        {/* Header */}
        <div className="relative flex items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-white">Edit Profile</h2>
            <p className="mt-0.5 text-xs text-zinc-600">Customize your Popverse public identity</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/[0.05] p-2 text-zinc-500 transition hover:bg-white/[0.10] hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-6 overflow-y-auto p-6 [scrollbar-color:rgba(124,58,237,0.3)_transparent] [scrollbar-width:thin]">
          
          {/* Avatar Selector */}
          <div>
            <div className="mb-3">
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                Choose Avatar
              </label>
            </div>
            <div>
              <ImageUpload
                currentImage={selectedAvatar}
                onUploadComplete={setSelectedAvatar}
                label="Upload Avatar Image"
              />
            </div>
          </div>

          {/* Display Name Input */}
          <div>
            <label htmlFor="displayName" className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. John Doe"
              maxLength={40}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Bio Textarea */}
          <div>
            <label htmlFor="bio" className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              Short Bio
            </label>
            <textarea
              id="bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about yourself..."
              maxLength={200}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none resize-none leading-7"
            />
            <div className="flex justify-end text-[10px] text-zinc-500 mt-1">
              {bio.length}/200
            </div>
          </div>


          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost px-5 py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-black shadow-lg hover:bg-zinc-200 transition"
            >
              Save Changes
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

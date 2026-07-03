// src/components/Navbar.jsx
import { Link, useLocation } from "react-router-dom";
import GlobalSearch from "./GlobalSearch";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";

const navRoutes = [
  { label: "Home",       href: "/" },
  { label: "Cinema",     href: "/cinema" },
  { label: "Music",    href: "/music", icon: "music" },
  { label: "Games",      href: "/search?type=game" },
  { label: "Books",      href: "/search?type=book" },
  { label: "Community", href: "/community" },
];

function BellIcon() {
  return (
    <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24">
      <path d="M15.8 17.5H8.2a2 2 0 0 1-1.8-2.9l.7-1.4V9.8a4.9 4.9 0 0 1 9.8 0v3.4l.7 1.4a2 2 0 0 1-1.8 2.9ZM10 20h4"
        stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export default function Navbar({ accent = "violet" }) {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { getOrCreateProfile } = useProfile();

  function isActive(href) {
    const fullPath = location.pathname + location.search;
    if (href === "/") return fullPath === "/";
    return fullPath.startsWith(href);
  }

  const userProfile = isAuthenticated && user ? getOrCreateProfile(user.preferredUsername) : null;
  const avatar = userProfile?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop";

  const accentMap = {
    violet: { logo: "from-violet-500 to-fuchsia-500 shadow-violet-500/30", bar: "bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_18px_rgba(139,92,246,0.8)]" },
    rose:   { logo: "from-rose-500 to-violet-500 shadow-rose-500/25",    bar: "bg-gradient-to-r from-rose-500 to-violet-500 shadow-[0_0_18px_rgba(244,63,94,0.8)]" },
  };
  const a = accentMap[accent] ?? accentMap.violet;

  return (
    <nav className="fixed inset-x-0 top-0 z-50">
      <div id="nav-backdrop" className="absolute inset-0 -z-10 border-b border-white/[0.06] bg-black/40 backdrop-blur-2xl" />
      <div className="absolute inset-0 -z-10 opacity-[0.15] bg-[url('/images/theme.png')] bg-cover bg-center pointer-events-none" />
      <div className="mx-auto flex max-w-[1840px] items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link className="group flex min-w-fit items-center gap-3 transition-opacity hover:opacity-90" to="/">
          <img 
            src="/images/pop.png" 
            alt="Popverse Icon" 
            className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_0_12px_rgba(139,92,246,0.3)]" 
          />
          <img 
            src="/images/popverse.png" 
            alt="Popverse" 
            className="h-5 w-auto object-contain" 
          />
        </Link>

        {/* Nav links */}
        <div className="hidden nav-menu lg:flex">
          {navRoutes.map(({ label, href }) => {
            const active = isActive(href);
            return (
              <Link
                className={`nav-btn ${active ? "active" : ""}`}
                to={href}
                key={label}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center justify-end gap-3">
          <GlobalSearch />

          {isAuthenticated ? (
            <>
              <button aria-label="Notifications" className="hidden h-9 w-9 place-items-center rounded-xl text-zinc-400 transition-all duration-200 hover:bg-white/[0.08] hover:text-white sm:grid">
                <BellIcon />
              </button>
              <div className="group relative">
                <Link to="/profile/me" aria-label="Profile" className="relative block h-9 w-9 overflow-hidden rounded-full ring-2 ring-violet-500/50 ring-offset-2 ring-offset-black/80 transition-all duration-200 hover:ring-violet-400/80">
                  <img alt="" className="h-full w-full object-cover" src={avatar} />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-black bg-emerald-500" />
                </Link>

                {/* Dropdown Wrapper for Hover Bridge */}
                <div className="absolute right-0 top-full pt-3 hidden group-hover:block z-50">
                  <div className="w-52 origin-top-right animate-scale-in overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0c14]/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-2xl">
                    <div className="px-3 py-2 mb-1 border-b border-white/[0.06]">
                      <p className="text-xs font-medium text-zinc-500">Signed in as</p>
                      <p className="text-sm font-bold text-white truncate">{user?.preferredUsername}</p>
                    </div>
                    <Link
                      to="/profile/me"
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-300 transition-all duration-150 hover:bg-white/[0.08] hover:text-white"
                    >
                      <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </Link>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-400 transition-all duration-150 hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden px-4 py-2 text-sm font-semibold text-zinc-400 transition-colors duration-200 hover:text-white sm:block">
                Log in
              </Link>
              <Link to="/signup" className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-500 hover:shadow-violet-500/40">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

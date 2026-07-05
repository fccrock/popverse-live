// src/components/Layout.jsx
// Global sidebar layout — wraps all main pages
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import GlobalSearch from "./GlobalSearch";
import Navbar from "./Navbar";

/* ── SVG Icon Set ──────────────────────────────────────────────────────────── */
function Icon({ name, filled = false }) {
  const cls = "h-[18px] w-[18px] shrink-0";
  if (name === "home") return filled ? (
    <svg className={cls} fill="currentColor" viewBox="0 0 24 24"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.69-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.062 1.06l8.69-8.69z"/><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z"/></svg>
  ) : (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
  );
  if (name === "film") return filled ? (
    <svg className={cls} fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M1.5 5.625c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v12.75c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 18.375V5.625zm1.5 0v1.5c0 .207.168.375.375.375h1.5a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-1.5A.375.375 0 003 5.625zm16.125-.375a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5A.375.375 0 0021 7.125v-1.5a.375.375 0 00-.375-.375h-1.5zM21 9.375A.375.375 0 0020.625 9h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5A.375.375 0 0021 10.875v-1.5zm0 3.75a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5A.375.375 0 0021 14.625v-1.5zm0 3.75a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5A.375.375 0 0021 18.375v-1.5zM3.375 9a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5A.375.375 0 004.875 10.875v-1.5A.375.375 0 004.5 9h-1.5zm0 3.75a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5A.375.375 0 004.875 14.625v-1.5a.375.375 0 00-.375-.375h-1.5zm0 3.75a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5A.375.375 0 004.875 18.375v-1.5a.375.375 0 00-.375-.375h-1.5z" clipRule="evenodd"/></svg>
  ) : (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125v-.375a1.125 1.125 0 00-1.125-1.125H3.375m0 0h-.375a1.125 1.125 0 00-1.125 1.125v.375m0 0c0 .621.504 1.125 1.125 1.125h1.125M3 7.875v.375c0 .621.504 1.125 1.125 1.125h.375M3 7.875A1.125 1.125 0 014.125 6.75h15.75A1.125 1.125 0 0121 7.875v9.75A1.125 1.125 0 0119.875 18.75H4.125A1.125 1.125 0 013 17.625v-9.75zm0 0v-.375A1.125 1.125 0 014.125 6.375H3.75A1.125 1.125 0 002.625 7.5v.375"/></svg>
  );
  if (name === "search") return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
  );
  if (name === "library") return filled ? (
    <svg className={cls} fill="currentColor" viewBox="0 0 24 24"><path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z"/></svg>
  ) : (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
  );
  if (name === "user") return filled ? (
    <svg className={cls} fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd"/></svg>
  ) : (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
  );
  if (name === "logout") return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>
  );
  if (name === "menu") return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"/></svg>
  );
  if (name === "close") return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
  );
  if (name === "music") return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
  );
  if (name === "games") return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/></svg>
  );
  if (name === "books") return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
  );
  return null;
}

/* ── Nav Data ────────────────────────────────────────────────────────────── */
const mainNav = [
  { label: "Home",     href: "/",            icon: "home"    },
  { label: "Cinema",   href: "/cinema",      icon: "film"    },
  { label: "Music",    href: "/music", icon: "music" },
  { label: "Games",    href: "/search?type=game",  icon: "games" },
  { label: "Books",    href: "/search?type=book",  icon: "books" },
];
const libraryNav = [
  { label: "My Library",href: "/collections", icon: "library" },
  { label: "Profile",   href: "/profile/me",  icon: "user"    },
];

/* ── Helper ── */
function isActive(href, pathname) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

/* ── Sidebar Content ─────────────────────────────────────────────────────── */
function SidebarContent({ location, user, profile, logout, onClose }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <Link to="/" onClick={onClose} className="flex items-center gap-2.5 px-5 py-6 group">
        <img
          src="/images/pop.png"
          alt=""
          style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
        />
        <img
          src="/images/popverse.png"
          alt="Popverse"
          style={{ height: '20px', width: 'auto', objectFit: 'contain' }}
        />
      </Link>

      {/* Divider */}
      <div className="mx-4 mb-4 h-px bg-white/[0.05]" />

      {/* Main nav */}
      <div className="px-2">
        <p className="section-label mb-2 px-3">Browse</p>
        <nav className="space-y-0.5">
          {mainNav.map(({ label, href, icon }) => {
            const active = isActive(href, location.pathname);
            return (
              <Link key={href} to={href} onClick={onClose}
                className={`nav-item ${active ? "active" : ""}`}
              >
                <Icon name={icon} filled={active} />
                <span>{label}</span>
                {active && <span className="nav-dot" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Library nav */}
      <div className="mt-5 px-2">
        <p className="section-label mb-2 px-3">Library</p>
        <nav className="space-y-0.5">
          {libraryNav.map(({ label, href, icon }) => {
            const active = isActive(href, location.pathname);
            return (
              <Link key={href} to={href} onClick={onClose}
                className={`nav-item ${active ? "active" : ""}`}
              >
                <Icon name={icon} filled={active} />
                <span>{label}</span>
                {active && <span className="nav-dot" />}
              </Link>
            );
          })}
        </nav>
      </div>


      {/* Spacer */}
      <div className="flex-1" />

      {/* Divider */}
      <div className="mx-4 h-px bg-white/[0.05]" />

      {/* Profile / Auth */}
      <div className="p-3">
        {user ? (
          <div className="group relative">
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.025] p-3 transition hover:border-white/[0.09] hover:bg-white/[0.05]">
              <div className="relative h-9 w-9 shrink-0">
                <img
                  src={profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.preferredUsername}`}
                  alt=""
                  className="h-full w-full rounded-full object-cover ring-2 ring-violet-500/30"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0c0c12] bg-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold text-white">{profile?.displayName ?? user.preferredUsername}</p>
                <p className="text-[11px] text-zinc-600 truncate">@{user.preferredUsername}</p>
              </div>
            </div>
            {/* Logout on hover */}
            <button
              onClick={logout}
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-rose-500/10 hover:text-rose-400"
            >
              <Icon name="logout" />
              Sign out
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link to="/login" className="btn-ghost w-full justify-center text-sm">Sign In</Link>
            <Link to="/signup" className="btn-v w-full justify-center text-sm">Join Free</Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Layout Component ───────────────────────────────────────────────── */
export default function Layout({ children }) {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { getOrCreateProfile } = useProfile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const profile = isAuthenticated && user
    ? getOrCreateProfile(user.preferredUsername)
    : null;

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Track scroll for mobile header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setMobileOpen(false);

  return (
    <div id="layout-root" className="flex flex-col min-h-screen" style={{ background: "var(--bg)" }}>
      {/* ── DESKTOP NAVBAR ── */}
      <div className="hidden lg:block w-full z-50">
        <Navbar />
      </div>

      {/* ── MOBILE HEADER ── */}
      <header
        className={`fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between px-4 transition-all duration-300 lg:hidden ${
          scrolled ? "backdrop-blur-xl" : ""
        }`}
        style={{
          background: scrolled ? "rgba(8,8,12,0.92)" : "transparent",
          borderBottom: scrolled ? "1px solid var(--border)" : "none",
        }}
      >
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src="/images/pop.png"
            alt=""
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
          />
          <img
            src="/images/popverse.png"
            alt="Popverse"
            style={{ height: '18px', width: 'auto', objectFit: 'contain' }}
          />
        </Link>
        <div className="flex items-center gap-2">
          <GlobalSearch />
          <button
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-xl text-zinc-400 transition hover:text-white"
            style={{ background: "rgba(255,255,255,.05)" }}
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm animate-fade-in lg:hidden"
            onClick={close}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-[260px] animate-slide-r overflow-y-auto lg:hidden"
            style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
          >
            {/* Close button */}
            <button
              onClick={close}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-xl text-zinc-500 transition hover:bg-white/10 hover:text-white"
            >
              <Icon name="close" />
            </button>
            <SidebarContent
              location={location}
              user={user}
              profile={profile}
              logout={logout}
              onClose={close}
            />
          </aside>
        </>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="min-w-0 flex-1 w-full">
        {/* Mobile header spacer */}
        <div className="h-14 lg:hidden" />
        {children}
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-[60px] items-stretch lg:hidden"
        style={{ background: "rgba(8,8,12,.96)", borderTop: "1px solid var(--border)", backdropFilter: "blur(24px)" }}
      >
        {[
          { href: "/",           label: "Home",    icon: "home"    },
          { href: "/cinema",     label: "Cinema",  icon: "film"    },
          { href: "/search",     label: "Search",  icon: "search"  },
          { href: "/collections",label: "Library", icon: "library" },
          { href: isAuthenticated ? "/profile/me" : "/login", label: "Profile", icon: "user" },
        ].map(({ href, label, icon }) => {
          const active = isActive(href, location.pathname);
          return (
            <Link
              key={href} to={href}
              className="flex flex-1 flex-col items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider transition"
              style={{ color: active ? "var(--violet)" : "var(--t3)" }}
            >
              <Icon name={icon} filled={active} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom nav spacer */}
      <div className="fixed bottom-0 left-0 right-0 h-[60px] lg:hidden" style={{ pointerEvents: "none" }} />
    </div>
  );
}

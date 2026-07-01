import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import CollectionModal from "../components/CollectionModal";

/* ═══════════════════════════════════════════════════════════════════
   STATIC DATA
═══════════════════════════════════════════════════════════════════ */
const FEATURED = [
  { id: "1440881722", title: "DAMN.", artist: "Kendrick Lamar", year: "2017",  tagline: "A haunting masterpiece of consciousness, complexity and raw human emotion.", art: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/ab/16/ef/ab16efe9-e7f1-66ec-021c-5592a23f0f9e/17UMGIM88793.rgb.jpg/1200x1200bb.jpg" },
  { id: "1636789969", title: "RENAISSANCE", artist: "Beyoncé", year: "2022", tagline: "A body of work. A world of its own. Dance like nobody is watching.", art: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/fe/ba/43/feba43be-99e8-ad8c-9fad-1bfdea7a4e98/196589344267.jpg/1200x1200bb.jpg" },
  { id: "1499385848", title: "After Hours", artist: "The Weeknd", year: "2020", tagline: "Every night tells a story. Every dawn forgets it.", art: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/2b/b9/fe/2bb9fef5-d7f3-8345-25a9-db0e79fde4e4/20UMGIM11048.rgb.jpg/1200x1200bb.jpg" },
  { id: "1649434996", title: "Midnights", artist: "Taylor Swift", year: "2022", tagline: "The stories of 13 sleepless nights, scattered with secrets.", art: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/67/b5/01/67b501d5-362e-797e-7dbd-942b9e273084/22UM1IM24801.rgb.jpg/1200x1200bb.jpg" },
];

const MOODS = [
  { label: "Chill",   count: 50, img: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop&q=80" },
  { label: "Focus",   count: 45, img: "https://images.unsplash.com/photo-1499728603263-13726abce5fd?w=400&h=400&fit=crop&q=80" },
  { label: "Workout", count: 60, img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop&q=80" },
  { label: "Sad",     count: 40, img: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop&q=80" },
  { label: "Party",   count: 70, img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop&q=80" },
  { label: "Romance", count: 55, img: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=400&h=400&fit=crop&q=80" },
];

const MOOD_ICONS = {
  Chill:   <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18}><path d="M17.66 8L12 2.35 6.34 8C4.78 9.56 4 11.64 4 13.64c0 2 .78 4.11 2.34 5.67 1.56 1.56 3.61 2.35 5.66 2.35s4.1-.79 5.66-2.35C19.22 17.75 20 15.64 20 13.64c0-2-.78-4.08-2.34-5.64z"/></svg>,
  Focus:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={18} height={18}><circle cx={12} cy={12} r={10}/><circle cx={12} cy={12} r={6}/><circle cx={12} cy={12} r={2} fill="currentColor"/></svg>,
  Workout: <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18}><path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/></svg>,
  Sad:     <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18}><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/></svg>,
  Party:   <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6h2c0-2.21 1.79-4 4-4s4 1.79 4 4h2c0-3.31-2.69-6-6-6z"/></svg>,
  Romance: <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
};

// PLAYLISTS replaced by live public collections from API

/* ═══════════════════════════════════════════════════════════════════
   HERO — massive 420px height, huge typography
═══════════════════════════════════════════════════════════════════ */
function Hero({ items }) {
  const [idx, setIdx] = useState(0);
  const [saveItem, setSaveItem] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    timer.current = setInterval(() => setIdx(p => (p + 1) % items.length), 5000);
    return () => clearInterval(timer.current);
  }, [items.length]);

  const cur = items[idx];

  return (
    <>
    <div className="glass-panel" style={{
      position: "relative",
      overflow: "hidden",
      minHeight: 420,
      borderRadius: 30,
      display: "flex",
      alignItems: "stretch",
    }}>
      {/* Background Images */}
      {items.map((f, i) => (
        <img key={f.id} src={f.art} alt="" aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center 35%",
            filter: "grayscale(100%) brightness(0.85) contrast(1.1)",
            opacity: i === idx ? 1 : 0,
            transition: "opacity 1s ease",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ))}

      {/* Cinematic Overlay Gradients */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(90deg, rgba(5,5,7,0.95) 0%, rgba(5,5,7,0.8) 30%, transparent 100%)",
        zIndex: 1,
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(5,5,7,1) 0%, transparent 20%)",
        zIndex: 1,
      }} />

      {/* Faint Background Text */}
      <div style={{
        position: "absolute",
        bottom: -20,
        right: -20,
        fontSize: "12rem",
        fontWeight: 900,
        color: "rgba(255,255,255,0.02)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 0,
        userSelect: "none"
      }}>
        {cur.artist.toUpperCase()}
      </div>

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column",
        justifyContent: "center",
        padding: "0 56px",
        maxWidth: "65%",
      }}>
        <p className="eyebrow-label">Featured Album</p>

        <h2 style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 92,
          fontWeight: 800,
          color: "#ffffff",
          letterSpacing: "-0.04em",
          lineHeight: 0.9,
          margin: "0 0 16px",
        }}>{cur.title}</h2>

        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", fontWeight: 500, margin: "0 0 12px", letterSpacing: "0.01em" }}>
          {cur.artist}
          <span style={{ margin: "0 10px", color: "rgba(255,255,255,0.3)" }}>·</span>
          {cur.year}
        </p>

        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: "0 0 36px", maxWidth: 380, minHeight: 48 }}>
          {cur.tagline}
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <Link to={`/music/album/${cur.id}`} className="btn-primary">
            <svg width={14} height={14} fill="currentColor" viewBox="0 0 24 24" style={{ marginLeft: 2 }}><path d="M8 5v14l11-7z" /></svg>
            Play Album
          </Link>
          <button className="btn-secondary" onClick={() => setSaveItem({ mediaId: cur.id, mediaType: 'album', title: cur.title, posterPath: cur.art, year: cur.year })}>
            <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M12 4v16M4 12h16" />
            </svg>
            Save
          </button>
        </div>

        {/* Carousel dots */}
        <div style={{ display: "flex", gap: 8 }}>
          {items.map((_, i) => (
            <button key={i}
              onClick={() => { clearInterval(timer.current); setIdx(i); }}
              style={{
                width: i === idx ? 32 : 8, height: 8,
                borderRadius: 999, border: "none", padding: 0, cursor: "pointer",
                background: i === idx ? "#ffffff" : "rgba(255,255,255,0.25)",
                transition: "all 0.35s ease",
              }}
            />
          ))}
        </div>
      </div>
    </div>
    
    <CollectionModal 
      isOpen={!!saveItem}
      mediaItem={saveItem} 
      onClose={() => setSaveItem(null)} 
    />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   RELEASE CARD — 210x280 large cinematic cards
═══════════════════════════════════════════════════════════════════ */
function ReleaseCard({ art, title, artist, year, id }) {
  return (
    <Link to={id ? `/music/album/${id}` : "#"} className="release-card glass-panel" style={{ textDecoration: "none" }}>
      {/* Top Image area */}
      <div style={{ height: "65%", width: "100%", overflow: "hidden", position: "relative" }}>
        {art && (
          <img src={art} alt={title} loading="lazy" className="rc-img"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        <div className="rc-overlay">
          <div className="rc-play-btn">
            <svg width={16} height={16} fill="#000" viewBox="0 0 24 24" style={{ marginLeft: 3 }}><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
      </div>

      {/* Bottom Text area */}
      <div style={{ height: "35%", width: "100%", padding: "16px 20px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p style={{
          fontSize: 14, fontWeight: 700, color: "#fff",
          margin: "0 0 6px", lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{title || "—"}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{artist || "—"}</p>
          {year && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>{year}</p>}
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MOOD CARD — cinematic B&W
═══════════════════════════════════════════════════════════════════ */
function MoodCard({ mood }) {
  return (
    <div className="mood-card glass-panel" style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden", cursor: "pointer" }}>
      <img src={mood.img} alt={mood.label} loading="lazy" className="mc-img"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", position: "absolute", inset: 0 }}
      />
      <div style={{ position: "absolute", inset: 0, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between", zIndex: 2 }}>
        <div style={{ color: "rgba(255,255,255,0.9)" }}>
          {MOOD_ICONS[mood.label]}
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 4px", letterSpacing: "0.02em" }}>{mood.label}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0 }}>{mood.count} songs</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CHART ROW — right panel
═══════════════════════════════════════════════════════════════════ */
function ChartRow({ item, rank }) {
  const art    = item["im:image"]?.[2]?.label ?? item["im:image"]?.[0]?.label;
  const title  = item["im:name"]?.label;
  const artist = item["im:artist"]?.label;
  const id     = item.id?.attributes?.["im:id"];

  return (
    <Link to={id ? `/music/album/${id}` : "#"} className="list-row">
      <span style={{ width: 16, textAlign: "center", flexShrink: 0, fontSize: 14, fontWeight: 700, color: rank <= 3 ? "#fff" : "rgba(255,255,255,0.4)" }}>
        {rank}
      </span>
      <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
        {art && <img src={art} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</p>
        <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{artist}</p>
      </div>
      <button className="play-btn-circle" onClick={e => e.preventDefault()}>
        <svg width={10} height={10} fill="currentColor" viewBox="0 0 24 24" style={{ marginLeft: 2 }}><path d="M8 5v14l11-7z" /></svg>
      </button>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COLLECTION ROW — right panel (live public collections)
═══════════════════════════════════════════════════════════════════ */
function CollectionRow({ collection }) {
  const coverImg = collection.items?.[0]?.posterPath
    ?? collection.coverImage
    ?? null;

  // Build a cover from the first item's poster if available
  const imgSrc = coverImg
    ? (coverImg.startsWith('http') ? coverImg : `https://image.tmdb.org/t/p/w200${coverImg}`)
    : `https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop&q=80`;

  const itemCount = collection.items?.length ?? collection.itemCount ?? 0;
  const likes = collection.likeCount ?? collection.likes ?? 0;

  return (
    <Link to={`/collections/${collection.id}`} className="list-row" style={{ textDecoration: 'none' }}>
      <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
        <img src={imgSrc} alt={collection.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{collection.name}</p>
        <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", margin: 0 }}>{itemCount} items · ♥ {likes}</p>
      </div>
      <button className="play-btn-circle" onClick={e => e.preventDefault()}>
        <svg width={10} height={10} fill="currentColor" viewBox="0 0 24 24" style={{ marginLeft: 2 }}><path d="M8 5v14l11-7z" /></svg>
      </button>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION HEADER
═══════════════════════════════════════════════════════════════════ */
function SHead({ title, viewAll = true }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#fff", margin: 0 }}>{title}</h2>
      {viewAll && (
        <button className="btn-secondary" style={{ padding: "6px 16px", fontSize: 12 }}>
          VIEW ALL
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════ */
const API = import.meta.env.VITE_API_BASE_URL ?? "";

export default function MusicPage() {
  const [charts,      setCharts     ] = useState([]);
  const [releases,    setReleases   ] = useState([]);
  const [publicCols,  setPublicCols ] = useState([]);
  const scrollRef = useRef(null);

  const scrollNewReleases = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    api.getMusicCharts().then(d => setCharts(d?.feed?.entry ?? [])).catch(() => {});
    api.getMusicNewReleases().then(d => setReleases(d?.feed?.entry ?? [])).catch(() => {});
    fetch(`${API}/api/collections/public`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setPublicCols(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => {});
  }, []);

  /* ── Cinematic background ── */
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'music-body-bg';
    el.textContent = `
      body { background-color: #050505 !important; }
    `;
    document.head.appendChild(el);
    return () => { document.getElementById('music-body-bg')?.remove(); };
  }, []);

  /* ── Navbar 78px & floating glass ── */
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'music-global-css';
    el.textContent = `
      #layout-root { background: transparent !important; }
      
      #nav-backdrop {
        background: rgba(8, 8, 8, 0.55) !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border-bottom: 1px solid rgba(255,255,255,0.06) !important;
      }

      /* Monochrome overrides */
      .nav-btn::after { background: rgba(255,255,255,0.8) !important; box-shadow: none !important; }
      .nav-btn:hover { background: rgba(255,255,255,0.05) !important; box-shadow: none !important; }
      .nav-btn::before { display: none !important; }
      .ring-violet-500\\/50 { --tw-ring-color: rgba(255, 255, 255, 0.2) !important; }
      .hover\\:ring-violet-400\\/80:hover { --tw-ring-color: rgba(255, 255, 255, 0.5) !important; }
      .from-violet-500, .to-fuchsia-500 {
        --tw-gradient-from: #ffffff !important;
        --tw-gradient-to: #aaaaaa !important;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
      }
      .shadow-violet-500\\/30 { box-shadow: none !important; }
      
      /* Hide Layout Sidebar */
      aside { display: none !important; }
    `;
    document.head.appendChild(el);
    return () => { document.getElementById('music-global-css')?.remove(); };
  }, []);

  const toRelCard = e => ({
    id:     e.id?.attributes?.["im:id"],
    title:  e["im:name"]?.label,
    artist: e["im:artist"]?.label,
    year:   e["im:releaseDate"]?.label?.slice(0, 4),
    art:    e["im:image"]?.[2]?.label ?? e["im:image"]?.[0]?.label,
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        /* ── Page Root ── */
        .mp-page {
          padding: 100px 40px 80px 40px;
          background: transparent;
          color: #fff;
          font-family: 'Inter', system-ui, sans-serif;
          position: relative;
          z-index: 1;
        }

        .layout-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 40px;
          max-width: 1800px;
          margin: 0 auto;
          align-items: start;
        }

        /* ── Glassmorphism Core ── */
        .glass-panel {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 24px;
          transition: all 0.35s ease;
          position: relative;
          z-index: 1;
        }
        .glass-panel:hover {
          background: rgba(255,255,255,0.055);
          box-shadow: 0 0 24px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.15);
          z-index: 50;
        }

        /* ── Typography Elements ── */
        .eyebrow-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          margin: 0 0 16px;
        }

        /* ── Buttons ── */
        .btn-primary {
          display: inline-flex; align-items: center; gap: 10px;
          background: #ffffff; color: #000;
          border-radius: 999px; padding: 14px 32px;
          font-size: 14px; font-weight: 700; text-decoration: none;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(255,255,255,0.15);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,255,255,0.25); background: #f0f0f0; }

        .btn-secondary {
          display: inline-flex; align-items: center; gap: 10px;
          background: transparent; color: #ffffff;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 999px; padding: 13px 28px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          backdrop-filter: blur(12px);
          transition: all 0.3s ease;
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.4); transform: translateY(-1px); }

        .play-btn-circle {
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(255,255,255,0.1); border: none; color: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.3s ease; flex-shrink: 0;
        }
        .play-btn-circle:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }

        /* ── Cards & Lists ── */
        .release-card {
          width: 210px; height: 280px; flex-shrink: 0;
          transition: all 0.35s ease;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .release-card:hover { transform: translateY(-6px); box-shadow: 0 0 24px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.15); background: rgba(255,255,255,0.07); z-index: 50; }
        .release-card .rc-img { transition: transform 0.5s ease; }
        .release-card:hover .rc-img { transform: scale(1.05); }
        .rc-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); opacity: 0; transition: opacity 0.3s; display: flex; align-items: center; justify-content: center; z-index: 10; }
        .release-card:hover .rc-overlay { opacity: 1; }
        .rc-play-btn { width: 52px; height: 52px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }

        .mood-card { transition: all 0.35s ease; }
        .mood-card:hover { transform: translateY(-6px); box-shadow: 0 0 24px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.15); z-index: 50; }
        .mood-card .mc-img { filter: grayscale(100%) brightness(0.4); transition: filter 0.4s ease, transform 0.5s ease; }
        .mood-card:hover .mc-img { filter: grayscale(100%) brightness(0.65); transform: scale(1.04); }

        .list-row {
          display: flex; align-items: center; gap: 16px;
          padding: 12px 20px; border-radius: 16px;
          text-decoration: none; transition: all 0.3s ease;
        }
        .list-row:hover { background: rgba(255,255,255,0.05); }

        /* ── Layout Sections ── */
        .mp-section { margin-top: 56px; }
        
        /* Horizontally scrollable container for release cards */
        .horizontal-scroll {
          display: flex; gap: 24px; overflow-x: auto;
          padding-top: 24px; padding-bottom: 48px; margin-top: -8px;
          scrollbar-width: none; /* Hide scrollbar for clean look */
        }
        .horizontal-scroll::-webkit-scrollbar { display: none; }

        .moods-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 24px;
        }

        /* ── Animations ── */
        @keyframes mpFade { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .animate-up { animation: mpFade 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
      `}</style>

      {/* Cinematic White Spotlight Background */}
      <div aria-hidden="true" style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundColor: "#080808",
        backgroundImage: `
          radial-gradient(ellipse 50% 40% at 15% 15%, rgba(255,255,255,0.18) 0%, transparent 70%),
          radial-gradient(ellipse 35% 30% at 80% 25%, rgba(255,255,255,0.13) 0%, transparent 65%),
          radial-gradient(ellipse 30% 25% at 20% 80%, rgba(255,255,255,0.10) 0%, transparent 60%),
          radial-gradient(ellipse 25% 20% at 75% 75%, rgba(255,255,255,0.08) 0%, transparent 55%)
        `
      }} />

      {/* Noise Texture Overlay */}
      <div aria-hidden="true" style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.035,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
      }} />

      <div className="mp-page">
        <div className="layout-grid">
          
          {/* ══════════ LEFT COLUMN ══════════ */}
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div className="animate-up">
              <Hero items={FEATURED} />
            </div>

            <section className="mp-section animate-up delay-1">
              <SHead title="New Releases" />
              <div className="group relative">
                {/* Left Paddle */}
                <button
                  onClick={() => scrollNewReleases('left')}
                  className="group/paddle absolute left-0 top-0 z-[100] h-full w-16 flex items-center justify-center hidden sm:flex cursor-pointer"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-md opacity-0 transition-all duration-200 transform-gpu group-hover:opacity-100 group-hover/paddle:bg-white/20 group-hover/paddle:scale-110 group-active/paddle:scale-95">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </div>
                </button>

                {/* Right Paddle */}
                <button
                  onClick={() => scrollNewReleases('right')}
                  className="group/paddle absolute right-0 top-0 z-[100] h-full w-16 flex items-center justify-center hidden sm:flex cursor-pointer"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-md opacity-0 transition-all duration-200 transform-gpu group-hover:opacity-100 group-hover/paddle:bg-white/20 group-hover/paddle:scale-110 group-active/paddle:scale-95">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </button>

                <div ref={scrollRef} className="horizontal-scroll">
                  {releases.length === 0
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div className="glass-panel" key={i} style={{ width: 210, height: 280, flexShrink: 0 }} />
                      ))
                    : releases.slice(0, 8).map((e, i) => <ReleaseCard key={i} {...toRelCard(e)} />)
                  }
                </div>
              </div>
            </section>

            <section className="mp-section animate-up delay-2" style={{ paddingBottom: 80 }}>
              <SHead title="Browse by Vibe" />
              <div className="moods-grid">
                {MOODS.map(m => <MoodCard key={m.label} mood={m} />)}
              </div>
            </section>
          </div>

          {/* ══════════ RIGHT COLUMN ══════════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            
            <div className="glass-panel animate-up" style={{ padding: "28px 0 16px", height: "fit-content" }}>
              <div style={{ padding: "0 24px" }}><SHead title="Top Charts" viewAll={false} /></div>
              {charts.length === 0
                ? <div style={{ height: 300 }} />
                : charts.slice(0, 5).map((item, i) => <ChartRow key={i} item={item} rank={i + 1} />)
              }
            </div>

            <div className="glass-panel animate-up delay-1" style={{ padding: "28px 0 16px", height: "fit-content" }}>
              <div style={{ padding: "0 24px" }}><SHead title="Popular Collections" viewAll={false} /></div>
              {publicCols.length === 0 ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="list-row">
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 12, width: '70%', borderRadius: 6, background: 'rgba(255,255,255,0.06)', marginBottom: 8 }} />
                      <div style={{ height: 10, width: '40%', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
                    </div>
                  </div>
                ))
              ) : (
                publicCols.map((col) => <CollectionRow key={col.id} collection={col} />)
              )}
            </div>

          </div>
          
        </div>
      </div>
    </>
  );
}



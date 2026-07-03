import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export default function NotificationDropdown({ username }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  
  const API = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    if (username) {
      fetchNotifications();
    }
  }, [username]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API}/api/notifications/${username}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await fetch(`${API}/api/notifications/${username}/clear-all`, {
        method: "DELETE"
      });
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear all notifications", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`${API}/api/notifications/${id}/read`, {
        method: "PUT"
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) {
      markAsRead(n.id);
    }
    setIsOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Filter based on tabs
  // "Updates" -> Replies
  // "Activity" -> Likes, Joins
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "All") return true;
    if (activeTab === "Updates") {
      return n.type.includes("REPLY");
    }
    if (activeTab === "Activity") {
      return n.type.includes("LIKE") || n.type.includes("JOIN");
    }
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications(); // Refresh on open
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 transition-all hover:bg-white/10 hover:text-white"
      >
        <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24">
          <path d="M15.8 17.5H8.2a2 2 0 0 1-1.8-2.9l.7-1.4V9.8a4.9 4.9 0 0 1 9.8 0v3.4l.7 1.4a2 2 0 0 1-1.8 2.9ZM10 20h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#f43f5e] px-1 text-[10px] font-bold text-white ring-2 ring-black/50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[440px] origin-top-right rounded-xl border border-white/[0.08] bg-black/30 backdrop-blur-2xl shadow-2xl" style={{ zIndex: 100 }}>
          
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="text-[20px] font-bold text-white tracking-wide">Notifications</h3>
            <button 
              onClick={clearAllNotifications}
              className="text-white/40 hover:text-white transition-colors p-1"
              title="Clear all notifications"
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.08] px-4">
            {["All", "Updates", "Activity"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab 
                    ? "text-white" 
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="max-h-[400px] overflow-y-auto min-h-[300px] custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="flex h-[300px] flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-white/[0.04]">
                  <svg className="h-10 w-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M15.8 17.5H8.2a2 2 0 0 1-1.8-2.9l.7-1.4V9.8a4.9 4.9 0 0 1 9.8 0v3.4l.7 1.4a2 2 0 0 1-1.8 2.9ZM10 20h4" strokeLinecap="round" strokeWidth="1.8" />
                  </svg>
                </div>
                <p className="text-[16px] font-medium text-white/90">No notifications here</p>
                <p className="mt-1 text-[14px] text-white/40">Check back later for new updates.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredNotifications.map(notification => (
                  <Link
                    key={notification.id}
                    to={notification.link}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3.5 p-4 transition-colors hover:bg-white/[0.04] border-b border-white/[0.04] last:border-0 ${!notification.isRead ? 'bg-white/[0.02]' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0 mt-0.5">
                      <img 
                        src={notification.actor?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop"} 
                        alt={notification.actor?.displayName || notification.actor?.username}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      {!notification.isRead && (
                        <div className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#0a0a0a] bg-[#f43f5e]" />
                      )}
                    </div>
                    
                    {/* Text */}
                    <div className="flex-1 leading-snug">
                      <p className="text-[14px] text-white/80">
                        <span className="font-semibold text-white/90">{notification.actor?.displayName || notification.actor?.username}</span>{" "}
                        {notification.message}
                      </p>
                      <p className="mt-1.5 text-[12px] text-white/40 font-medium">
                        {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.08] p-3 text-center">
            <p className="text-[12px] text-white/30 font-medium">
              Notifications are automatically removed after 30 days
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

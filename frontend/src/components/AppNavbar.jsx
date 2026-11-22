import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  ChefHat, Search, ChevronDown, Menu, X, CalendarDays, BookOpen,
  Heart, Package, ShoppingCart, Store, Sparkles, Bell, UserRound,
  Settings, LogOut, LayoutDashboard, Users, BarChart3, ShieldCheck, FileBarChart,
} from "lucide-react";

const USER_GROUPS = [
  {
    label: "Recipes",
    items: [
      { label: "All Recipes", path: "/recipes", icon: BookOpen },
      { label: "Favorites", path: "/favorites", icon: Heart },
    ],
  },
  {
    label: "My Kitchen",
    items: [
      { label: "Meal Planner", path: "/meal-planner", icon: CalendarDays },
      { label: "Nutrition Dashboard", path: "/nutrition", icon: BarChart3 },
      { label: "My Meal Plans", path: "/my-meal-plans", icon: BookOpen },
      { label: "Pantry", path: "/pantry", icon: Package },
      { label: "Grocery List", path: "/user/grocery", icon: ShoppingCart },
      { label: "Grocery Store", path: "/grocery-store", icon: Store },
    ],
  },
  {
    label: "Explore",
    items: [
      { label: "AI Meal Assistant", path: "/meal-planner", icon: Sparkles },
      { label: "Notifications", path: "/notifications", icon: Bell },
    ],
  },
];

function formatNotificationDeliveryMessage(notification) {
  const outcomeText = notification?.deliveryOutcome === "early"
    ? "Your order arrived earlier than expected."
    : notification?.deliveryOutcome === "late"
      ? "Your order arrived later than scheduled."
      : "Your order was delivered on time.";
  const formatTime = (value) => value
    ? new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : "";
  const expected = formatTime(notification?.expectedDeliveryAt);
  const actual = formatTime(notification?.deliveredAt);
  const timing = expected && actual
    ? ` Expected by ${expected}; delivered at ${actual}.`
    : "";
  return `${outcomeText}${timing} Your ingredients are now in your pantry.`;
}

const ADMIN_GROUPS = [
  {
    label: "Manage",
    items: [
      { label: "Users", path: "/admin/users", icon: Users },
      { label: "Recipes", path: "/admin/recipes", icon: BookOpen },
      { label: "Meal Plans", path: "/admin/meal-plans", icon: CalendarDays },
      { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
      { label: "Reports & Exports", path: "/admin/reports", icon: FileBarChart },
      { label: "AI Features", path: "/admin/ai-features", icon: Sparkles },
      { label: "Security", path: "/admin/security", icon: ShieldCheck },
    ],
  },
];

export default function AppNavbar({ children }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState([]);
  const [deliveryAlert, setDeliveryAlert] = useState(null);
  const previousUnreadCount = useRef(null);
  const isAdmin = user?.role === "admin";
  const userId = user?._id || user?.id;
  const groups = isAdmin ? ADMIN_GROUPS : USER_GROUPS;

  useEffect(() => {
    if (!notificationOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!event.target.closest("[data-notification-root]")) {
        setNotificationOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setNotificationOpen(false);
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [notificationOpen]);

  useEffect(() => {
    if (!userId) {
      previousUnreadCount.current = null;
      setDeliveryAlert(null);
      setUnreadNotifications(0);
      setNotificationItems([]);
      return;
    }

    let active = true;
    const loadNotifications = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const endpoint = isAdmin ? "/api/admin/alerts?limit=2" : "/api/notifications?limit=2";
        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        const items = (isAdmin ? (data.alerts || []) : (data.notifications || []))
          .slice()
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 2);
        if (!active) return;

        const nextUnreadCount = Number(data.unreadCount) || 0;
        if (!isAdmin && previousUnreadCount.current !== null && nextUnreadCount > previousUnreadCount.current) {
          const latestUnread = items.find((item) => !item.read);
          if (latestUnread) {
            setDeliveryAlert({
              title: latestUnread.title || "New MealMate notification",
              message: latestUnread.type === "order-delivered"
                ? formatNotificationDeliveryMessage(latestUnread)
                : (latestUnread.message || "You have a new update. View your notifications for details."),
            });
          }
        }
        previousUnreadCount.current = nextUnreadCount;
        setUnreadNotifications(nextUnreadCount);
        setNotificationItems(items);
      } catch (error) {
        console.error("Notification loading error:", error);
      }
    };

    loadNotifications();
    const timer = setInterval(loadNotifications, 15000);
    window.addEventListener("mealmate:notifications-updated", loadNotifications);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("mealmate:notifications-updated", loadNotifications);
    };
  }, [userId, isAdmin]);

  const handleNotificationClick = (item) => {
    void markNotificationRead(item);
  };

  const markNotificationRead = async (item) => {
    if (item.read) return;
    const token = localStorage.getItem("token");
    const endpoint = isAdmin
      ? `/api/admin/alerts/${item._id}/read`
      : `/api/notifications/${item._id}/read`;
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Unable to update notification.");
      setNotificationItems((items) => items.map((entry) =>
        entry._id === item._id ? { ...entry, read: true } : entry
      ));
      setUnreadNotifications((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error("Mark notification as read failed:", error);
    }
  };

  const markAllNotificationsRead = async () => {
    const token = localStorage.getItem("token");
    if (!token || unreadNotifications === 0) return;

    const endpoint = isAdmin ? "/api/admin/alerts/read-all" : "/api/notifications/read-all";
    const previousItems = notificationItems;
    const previousUnreadCount = unreadNotifications;

    // Update the bell and dropdown immediately while the read status is saved.
    setNotificationItems((items) => items.map((item) => ({ ...item, read: true })));
    setUnreadNotifications(0);

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Unable to update notifications.");
    } catch (error) {
      // Restore the previous state if persistence fails.
      setNotificationItems(previousItems);
      setUnreadNotifications(previousUnreadCount);
      console.error("Mark all notifications as read failed:", error);
    }
  };

  const toggleNotificationPanel = () => {
    const willOpen = !notificationOpen;
    setNotificationOpen(willOpen);
    if (willOpen) void markAllNotificationsRead();
  };

  const navigate = (path) => {
    setLocation(path);
    setOpenMenu("");
    setMobileOpen(false);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    if (query) navigate(`/recipes?search=${encodeURIComponent(query)}`);
  };

  const active = (path) => location === path || location.startsWith(path + "/");

  const renderGroup = (group) => (
    <div key={group.label} className="relative">
      <button
        type="button"
        onClick={() => setOpenMenu((current) => current === group.label ? "" : group.label)}
        aria-expanded={openMenu === group.label}
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${openMenu === group.label || group.items.some((item) => active(item.path)) ? "bg-green-50 text-primary" : "text-gray-700 hover:bg-gray-50 hover:text-primary"}`}
      >
        {group.label}<ChevronDown className={`h-4 w-4 transition-transform ${openMenu === group.label ? "rotate-180" : ""}`} />
      </button>
      {openMenu === group.label && (
        <div className="absolute left-0 top-full z-50 mt-3 w-64 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
          {group.items.map(({ label, path, icon: Icon }) => (
            <button key={path + label} type="button" onClick={() => navigate(path)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${active(path) ? "bg-green-50 text-primary" : "text-gray-700 hover:bg-gray-50"}`}>
              <Icon className="h-4 w-4 shrink-0" />{label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur-xl">
      {deliveryAlert && createPortal((
        <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-[80] flex max-w-sm items-start gap-3 rounded-2xl border border-green-100 bg-white p-4 shadow-2xl">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50"><Bell className="h-5 w-5 text-primary" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900">{deliveryAlert.title}</p>
            <p className="mt-1 text-sm text-gray-500">{deliveryAlert.message}</p>
            <button type="button" onClick={() => { setDeliveryAlert(null); navigate("/notifications"); }} className="mt-2 text-sm font-semibold text-primary hover:underline">View notification</button>
          </div>
          <button type="button" onClick={() => setDeliveryAlert(null)} aria-label="Dismiss notification" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X className="h-4 w-4" /></button>
        </div>
      ), document.body)}
      <div className="mx-auto flex min-h-[76px] w-full max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => navigate("/dashboard")} aria-label="MealMate dashboard" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50"><ChefHat className="h-6 w-6 text-primary" /></span>
          <span className="text-xl font-black tracking-tight text-gray-900">Meal<span className="text-primary">Mate</span></span>
        </button>

        <nav aria-label="Main navigation" className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          <button type="button" onClick={() => navigate("/dashboard")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active("/dashboard") ? "bg-green-50 text-primary" : "text-gray-700 hover:bg-gray-50"}`}>Home</button>
          {groups.map(renderGroup)}
        </nav>

        <form onSubmit={submitSearch} role="search" className="hidden w-52 shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2.5 focus-within:border-green-400 focus-within:bg-white xl:flex">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a recipe..." aria-label="Search recipes" className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-gray-400" />
        </form>

        <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
          {children}
          <div className="relative" data-notification-root>
            <button type="button" onClick={toggleNotificationPanel} aria-label="Notifications" aria-expanded={notificationOpen} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-green-50 hover:text-primary">
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && <span aria-label="Unread notifications" className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />}
            </button>
            {notificationOpen && <div className="fixed right-3 top-20 z-[100] flex max-h-[min(75vh,560px)] w-[min(calc(100vw-1.5rem),380px)] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div><p className="font-bold text-gray-900">Notifications</p><p className="text-xs text-gray-500">{isAdmin ? "Platform updates" : "Your MealMate updates"}</p></div>
                {unreadNotifications > 0 && <button type="button" onClick={markAllNotificationsRead} className="text-xs font-semibold text-primary hover:underline">Mark all read</button>}
              </div>
              <div className="max-h-[min(65vh,420px)] overflow-y-auto">
                {notificationItems.length === 0 ? <p className="px-4 py-8 text-center text-sm text-gray-500">You're all caught up.</p> : notificationItems.slice(0, 2).map((item) => (
                  <button key={item._id || item.id} type="button" onClick={() => handleNotificationClick(item)} className={`block w-full border-b border-gray-50 px-4 py-3 text-left transition hover:bg-green-50/60 ${item.read ? "bg-white" : "bg-green-50/40"}`}>
                    <span className="flex items-start gap-2"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read ? "bg-gray-200" : "bg-primary"}`} /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-gray-900">{item.title || "MealMate update"}</span><span className="mt-1 block text-xs leading-5 text-gray-500">{item.message || item.source || "A platform update is available."}</span><span className="mt-1 block text-[11px] text-gray-400">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</span></span></span>
                  </button>
                ))}
              </div>
              {!isAdmin && <button type="button" onClick={() => { setNotificationOpen(false); navigate("/notifications"); }} className="w-full px-4 py-3 text-sm font-bold text-primary hover:bg-green-50">View all notifications</button>}
            </div>}
          </div>
          <button type="button" onClick={() => navigate("/profile")} aria-label="Profile" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-green-50 hover:text-primary"><UserRound className="h-5 w-5" /></button>
          <button type="button" onClick={() => navigate("/settings")} aria-label="Settings" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50"><Settings className="h-5 w-5" /></button>
          {user && <button type="button" onClick={() => { logout(); navigate("/login"); }} aria-label="Log out" title="Log out" className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-red-50 hover:text-red-600"><LogOut className="h-5 w-5" /></button>}
        </div>

        {user && <div className="relative lg:hidden" data-notification-root>
          <button type="button" onClick={toggleNotificationPanel} aria-label="Notifications" aria-expanded={notificationOpen} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700">
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && <span aria-label="Unread notifications" className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />}
          </button>
          {notificationOpen && <div className="fixed right-3 top-20 z-[100] flex max-h-[min(75vh,560px)] w-[min(calc(100vw-1.5rem),380px)] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3"><div><p className="font-bold text-gray-900">Notifications</p><p className="text-xs text-gray-500">{isAdmin ? "Platform updates" : "Your MealMate updates"}</p></div>{unreadNotifications > 0 && <button type="button" onClick={markAllNotificationsRead} className="text-xs font-semibold text-primary">Mark all read</button>}</div>
            <div className="max-h-[min(65vh,420px)] overflow-y-auto">
              {notificationItems.length === 0 ? <p className="px-4 py-8 text-center text-sm text-gray-500">You're all caught up.</p> : notificationItems.slice(0, 2).map((item) => <button key={item._id || item.id} type="button" onClick={() => handleNotificationClick(item)} className={`block w-full border-b border-gray-50 px-4 py-3 text-left ${item.read ? "bg-white" : "bg-green-50/40"}`}><span className="flex items-start gap-2"><span className={`mt-1.5 h-2 w-2 rounded-full ${item.read ? "bg-gray-200" : "bg-primary"}`} /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-gray-900">{item.title || "MealMate update"}</span><span className="mt-1 block text-xs text-gray-500">{item.message || item.source || "A platform update is available."}</span></span></span></button>)}
            </div>
            {!isAdmin && <button type="button" onClick={() => { setNotificationOpen(false); navigate("/notifications"); }} className="w-full px-4 py-3 text-sm font-bold text-primary">View all notifications</button>}
          </div>}
        </div>}
        <button type="button" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 lg:hidden">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 shadow-lg lg:hidden">
          <form onSubmit={submitSearch} role="search" className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
            <Search className="h-4 w-4 text-gray-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recipes or ingredients..." aria-label="Search recipes" className="w-full bg-transparent text-sm outline-none" />
            <button type="submit" className="text-sm font-semibold text-primary">Search</button>
          </form>
          <button type="button" onClick={() => navigate("/dashboard")} className="mb-2 w-full rounded-xl px-3 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"><LayoutDashboard className="mr-2 inline h-4 w-4" />Home</button>
          {groups.map((group) => (
            <section key={group.label} className="border-t border-gray-100 py-2">
              <button type="button" onClick={() => setOpenMenu((current) => current === group.label ? "" : group.label)} aria-expanded={openMenu === group.label} className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-bold text-gray-900">
                {group.label}<ChevronDown className={`h-4 w-4 transition-transform ${openMenu === group.label ? "rotate-180" : ""}`} />
              </button>
              {openMenu === group.label && <div className="grid grid-cols-2 gap-2 px-2 pb-2">
                {group.items.map(({ label, path, icon: Icon }) => <button key={path + label} type="button" onClick={() => navigate(path)} className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-3 text-left text-xs font-semibold text-gray-700"><Icon className="h-4 w-4 text-primary" />{label}</button>)}
              </div>}
            </section>
          ))}
          <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
            <button type="button" onClick={() => navigate("/profile")} className="rounded-xl bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-700"><UserRound className="mr-2 inline h-4 w-4" />Profile</button>
            {user && <button type="button" onClick={() => { logout(); navigate("/login"); }} className="rounded-xl bg-red-50 px-3 py-3 text-sm font-semibold text-red-600"><LogOut className="mr-2 inline h-4 w-4" />Logout</button>}
          </div>
          {children && <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">{children}</div>}
        </div>
      )}
    </header>
  );
}

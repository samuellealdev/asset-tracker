import { Link, useMatchRoute } from "@tanstack/react-router";

const NAV_ITEMS = [
  { to: "/devices", label: "Devices", icon: "🖥️" },
  { to: "/events", label: "Events", icon: "📋" },
  { to: "/dashboards", label: "Dashboards", icon: "📊" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
] as const;

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const matchRoute = useMatchRoute();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-30 bg-black/50 xl:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-60 flex-col bg-slate-800 text-white transition-transform duration-200 xl:static xl:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center px-6">
          <h2 className="text-lg font-bold tracking-wide">Asset Tracker</h2>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = matchRoute({ to: item.to });
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

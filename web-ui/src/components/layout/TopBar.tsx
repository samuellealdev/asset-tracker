import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { Settings, LogOut } from "lucide-react";

interface TopBarProps {
  onSettingsClick?: () => void;
}

export function TopBar({ onSettingsClick }: TopBarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-3">
      {/* App title — centered via flex */}
      <div className="flex-1" />

      <h1 className="text-lg font-extralight tracking-widest uppercase text-slate-100">
        ASSET TRACKER
      </h1>

      {/* Right side: settings + logout */}
      <div className="flex flex-1 items-center justify-end gap-2">
        <button
          onClick={onSettingsClick}
          aria-label="Settings"
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
        >
          <Settings className="h-5 w-5" />
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

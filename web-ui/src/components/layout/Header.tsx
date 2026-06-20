import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-700 bg-slate-900 px-6">
      <h1 className="text-xl font-bold text-slate-100">Asset Tracker</h1>
      <button
        onClick={handleLogout}
        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
      >
        Logout
      </button>
    </header>
  );
}

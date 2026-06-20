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
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-xl font-bold text-slate-900">Asset Tracker</h1>
      <button
        onClick={handleLogout}
        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        Logout
      </button>
    </header>
  );
}

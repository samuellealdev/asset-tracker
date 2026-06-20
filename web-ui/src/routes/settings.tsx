import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";

export function SettingsPage() {
  const { token, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  function getTokenPreview(token: string): string {
    if (token.length <= 20) return token;
    return `${token.substring(0, 20)}...`;
  }

  function getTokenExpiry(token: string): string {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]!));
      if (payload.exp) {
        const expiry = new Date(payload.exp * 1000);
        return expiry.toLocaleString();
      }
    } catch {
      // Invalid JWT format
    }
    return "Unknown";
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-100">Settings</h1>

      {/* API Configuration */}
      <section className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">
          API Base URLs
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-700/50 px-4 py-3">
            <span className="text-sm font-medium text-slate-300">
              Go Service
            </span>
            <span className="text-sm text-slate-400">/api/go</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-700/50 px-4 py-3">
            <span className="text-sm font-medium text-slate-300">
              Node.js Service
            </span>
            <span className="text-sm text-slate-400">/api/node</span>
          </div>
        </div>
      </section>

      {/* Token Status */}
      <section className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">
          Authentication
        </h2>

        {isAuthenticated && token ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-300">Status:</span>
              <span className="inline-flex items-center rounded-full bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-300">
                Active
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-300">Token:</span>
              <code className="mt-1 block break-all rounded bg-slate-700 px-3 py-2 text-xs text-slate-300">
                {getTokenPreview(token)}
              </code>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-300">
                Token Expiry:
              </span>
              <p className="mt-1 text-sm text-slate-400">
                {getTokenExpiry(token)}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="rounded-full bg-slate-700 p-3">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">
              Not authenticated
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700"
            >
              Go to Login
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

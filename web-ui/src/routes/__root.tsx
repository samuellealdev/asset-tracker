import {
  createRootRoute,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export function checkAuth({
  location,
}: {
  location: { pathname: string };
}): void {
  const token = localStorage.getItem("auth_token");
  if (!token && location.pathname !== "/login") {
    throw redirect({ to: "/login" });
  }
}

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-in motion-safe:animate-fade-in">
      {children}
    </div>
  );
}

function RootComponent() {
  const { pathname } = useLocation();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <ErrorBoundary>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </ErrorBoundary>
    );
  }

  return (
    <AppLayout>
      <ErrorBoundary>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </ErrorBoundary>
    </AppLayout>
  );
}

export const Route = createRootRoute({
  beforeLoad: checkAuth,
  component: RootComponent,
});

import {
  createRootRoute,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";

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

function RootComponent() {
  const { pathname } = useLocation();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <Outlet />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export const Route = createRootRoute({
  beforeLoad: checkAuth,
  component: RootComponent,
});

/* prettier-ignore-start */

/* eslint-disable */

import { Route as rootRoute } from "./routes/__root";
import { Route as IndexRoute } from "./routes/index";
import { Route as LoginRoute } from "./routes/login";
import { Route as DevicesRoute } from "./routes/devices";
import { Route as EventsRoute } from "./routes/events";
import { Route as DashboardsRoute } from "./routes/dashboards";
import { Route as SettingsRoute } from "./routes/settings";
import { Route as NotFoundRoute } from "./routes/$";

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/": {
      id: "/";
      path: "/";
      fullPath: "/";
      preLoaderRoute: typeof IndexRoute;
      parentRoute: typeof rootRoute;
    };
    "/login": {
      id: "/login";
      path: "/login";
      fullPath: "/login";
      preLoaderRoute: typeof LoginRoute;
      parentRoute: typeof rootRoute;
    };
    "/devices": {
      id: "/devices";
      path: "/devices";
      fullPath: "/devices";
      preLoaderRoute: typeof DevicesRoute;
      parentRoute: typeof rootRoute;
    };
    "/events": {
      id: "/events";
      path: "/events";
      fullPath: "/events";
      preLoaderRoute: typeof EventsRoute;
      parentRoute: typeof rootRoute;
    };
    "/dashboards": {
      id: "/dashboards";
      path: "/dashboards";
      fullPath: "/dashboards";
      preLoaderRoute: typeof DashboardsRoute;
      parentRoute: typeof rootRoute;
    };
    "/settings": {
      id: "/settings";
      path: "/settings";
      fullPath: "/settings";
      preLoaderRoute: typeof SettingsRoute;
      parentRoute: typeof rootRoute;
    };
    "/$": {
      id: "/$";
      path: "/$";
      fullPath: "/$";
      preLoaderRoute: typeof NotFoundRoute;
      parentRoute: typeof rootRoute;
    };
  }
}

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  LoginRoute,
  DevicesRoute,
  EventsRoute,
  DashboardsRoute,
  SettingsRoute,
  NotFoundRoute,
]);

/* prettier-ignore-end */

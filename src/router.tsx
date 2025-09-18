import { createHashRouter, Navigate, Outlet } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import LoginPage from "@/pages/login";
import ChatPage from "@/pages/chat";
import ProjectsPage from "@/pages/projects";
import DxtPage from "./pages/dxt";
import SettingsPage from "./pages/settings";
import UsagePage from "./pages/usage";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useDeepLink } from "./hooks/useDeepLink";
import { useEffect } from "react";
import { useLayoutStore } from "./stores/layoutStore";
import { useAuth } from "./hooks/useAuth";

function Root() {
  if (!import.meta.env.DEV) {
    useDeepLink();
  }
  const { lastRoute } = useLayoutStore();

  useEffect(() => {
    if (lastRoute && lastRoute !== "/") {
      window.location.hash = lastRoute;
    }
  }, []);
  return <Layout />;
}

function RequireAuth() {
  const { user, loading } = useAuth();
  const ENABLE_AUTH = import.meta.env.VITE_ENABLE_AUTH === 'true'

  // In development, only skip if auth is not forced
  if (import.meta.env.DEV && !ENABLE_AUTH) {
    return <Outlet />;
  }

  if (!ENABLE_AUTH) {
    return <Outlet />;
  }

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export const router = createHashRouter([
  {
    path: "/",
    element: (
      <ErrorBoundary>
        <Root />
      </ErrorBoundary>
    ),
    children: [
      {
        path: "login",
        element: (
          <ErrorBoundary>
            <LoginPage />
          </ErrorBoundary>
        ),
      },
      {
        element: <RequireAuth />,
        children: [
          {
            index: true,
            element: (
              <ErrorBoundary>
                <ProjectsPage />
              </ErrorBoundary>
            ),
          },
          {
            path: "chat",
            element: (
              <ErrorBoundary>
                <ChatPage />
              </ErrorBoundary>
            ),
          },
          {
            path: "dxt",
            element: (
              <ErrorBoundary>
                <DxtPage />
              </ErrorBoundary>
            ),
          },
          {
            path: "settings",
            element: (
              <ErrorBoundary>
                <SettingsPage />
              </ErrorBoundary>
            ),
          },
          {
            path: "usage",
            element: (
              <ErrorBoundary>
                <UsagePage />
              </ErrorBoundary>
            ),
          },
        ],
      },
    ],
  },
]);

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";

/* Public Pages */
import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import ResetPassword from "./pages/ResetPassword";

/* Application Pages */
import Dashboard from "./pages/Dashboard";
import Repositories from "./pages/Repositories";
import CodeAnalysis from "./pages/CodeAnalysis";
import BugDetection from "./pages/BugDetection";
import TestGeneration from "./pages/TestGeneration";
import PullRequestReview from "./pages/PullRequestReview";
import SecurityAnalysis from "./pages/SecurityAnalysis";
import ScanHistory from "./pages/ScanHistory";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

/* React Query Client */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />

          <BrowserRouter>
            <Routes>

              {/* ⭐ Landing Website */}
              <Route path="/" element={<Landing />} />

              {/* ⭐ Auth Pages */}
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* ⭐ Protected System */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>

                  {/* ⭐ Default dashboard redirect */}
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* ⭐ optional: if user goes /app redirect */}
                  <Route path="/app" element={<Navigate to="/dashboard" />} />
                  <Route path="/overview" element={<Navigate to="/dashboard" />} />
                  <Route path="/repositories" element={<Repositories />} />
                  <Route path="/analysis" element={<CodeAnalysis />} />
                  <Route path="/bug-detection" element={<BugDetection />} />
                  <Route path="/test-generation" element={<TestGeneration />} />
                  <Route path="/pr-review" element={<PullRequestReview />} />
                  <Route path="/security-analysis" element={<SecurityAnalysis />} />
                  <Route path="/scan-history" element={<ScanHistory />} />
                  <Route path="/settings" element={<SettingsPage />} />

                </Route>
              </Route>

              {/* ⭐ 404 */}
              <Route path="*" element={<NotFound />} />

            </Routes>
          </BrowserRouter>

        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
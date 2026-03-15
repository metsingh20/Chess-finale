import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";

// Eagerly load lightweight pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import PageTransition from "./components/PageTransition";

// Lazy load heavy feature pages — reduces initial bundle size
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Practice = lazy(() => import("./pages/Practice"));
const Analysis = lazy(() => import("./pages/Analysis"));
const Stats = lazy(() => import("./pages/Stats"));

const queryClient = new QueryClient();

// Loading fallback for lazy routes
const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-background">
    <div className="text-primary text-4xl animate-pulse">♔</div>
  </div>
);

// Separate component to use useLocation hook
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route
          path="/auth/reset-password"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageTransition><ResetPassword /></PageTransition>
            </Suspense>
          }
        />
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route
          path="/practice"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageTransition>
                <ProtectedRoute><Practice /></ProtectedRoute>
              </PageTransition>
            </Suspense>
          }
        />
        <Route
          path="/analysis"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageTransition>
                <ProtectedRoute><Analysis /></ProtectedRoute>
              </PageTransition>
            </Suspense>
          }
        />
        <Route
          path="/stats"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageTransition>
                <ProtectedRoute><Stats /></ProtectedRoute>
              </PageTransition>
            </Suspense>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
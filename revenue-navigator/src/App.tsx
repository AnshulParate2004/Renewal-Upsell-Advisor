import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { PageLoader } from "@/components/ui/PageLoader";
import { AuthProvider } from "@/contexts/AuthContext";
import { RevenueProvider } from "@/contexts/RevenueContext";
import { queryClient } from "@/lib/queryClient";
import "./styles/animations.css";

import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import GlobalSetup from "./pages/GlobalSetup";
import SetupGuide from "./pages/SetupGuide";
import NotFound from "./pages/NotFound";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Pipeline = lazy(() => import("./pages/Pipeline"));
const Sentiment = lazy(() => import("./pages/Sentiment"));
const Opportunities = lazy(() => import("./pages/Opportunities"));
const Analytics = lazy(() => import("./pages/Analytics"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const ManualTriggersPage = lazy(() => import("./pages/ManualTriggers"));
const AccountDetailPage = lazy(() => import("./pages/AccountDetailPage"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RevenueProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/setup" element={<GlobalSetup />} />
                  <Route path="/setup/guide" element={<SetupGuide />} />
                  <Route path="/app" element={<AppLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="accounts" element={<Accounts />} />
                    <Route path="pipeline" element={<Pipeline />} />
                    <Route path="sentiment" element={<Sentiment />} />
                    <Route path="opportunities" element={<Opportunities />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="triggers" element={<ManualTriggersPage />} />
                    <Route path="accounts/:accountId" element={<AccountDetailPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </RevenueProvider>
  </QueryClientProvider>
);

export default App;

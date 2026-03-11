import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomCursor } from "@/components/ui/CustomCursor";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Demo from "./pages/Demo";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Pipeline from "./pages/Pipeline";
import Calls from "./pages/Calls";
import Opportunities from "./pages/Opportunities";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/Settings";
import ManualTriggersPage from "./pages/ManualTriggers";
import AccountDetailPage from "./pages/AccountDetailPage";
import GlobalSetup from "./pages/GlobalSetup";
import SetupGuide from "./pages/SetupGuide";
import NotFound from "./pages/NotFound";
import "./styles/animations.css";
import { RevenueProvider } from "@/contexts/RevenueContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RevenueProvider>
      <TooltipProvider>
        <CustomCursor />
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/demo" element={<Demo />} />

              {/* App Routes (Protected) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/setup" element={<GlobalSetup />} />
                <Route path="/setup/guide" element={<SetupGuide />} />
                <Route path="/app" element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="accounts" element={<Accounts />} />
                  <Route path="pipeline" element={<Pipeline />} />
                  <Route path="calls" element={<Calls />} />
                  <Route path="opportunities" element={<Opportunities />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="triggers" element={<ManualTriggersPage />} />
                  <Route path="accounts/:accountId" element={<AccountDetailPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </RevenueProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Pipeline from "./pages/Pipeline";
import Conversations from "./pages/Conversations";
import Clients from "./pages/Clients";
import Configuration from "./pages/Configuration";
import Appointments from "./pages/Appointments";
import NotFound from "./pages/NotFound";
import { NavLink } from "./components/NavLink";
import { Button } from "./components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  GitBranch,
  Cog,
  LogOut,
  Calendar,
  Menu,
  BookOpen,
} from "lucide-react";
import evidensLogo from "./assets/evidens-logo.png";
import { toast } from "sonner";
import { useRealtimeNotifications } from "./hooks/useRealtimeNotifications";

const queryClient = new QueryClient();

const AppContent = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize real-time notifications only when authenticated
  useRealtimeNotifications();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, session) => {
        setSession(session);
        setLoading(false);
      });

    // THEN check for existing session with error handling and timeout fallback
    let isActive = true;
    const timeoutId = window.setTimeout(() => {
      if (isActive) {
        console.warn("Timeout ao verificar sessão de autenticação");
        setLoading(false);
      }
    }, 5000);

    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (isActive) {
          setSession(data.session);
        }
      } catch (error) {
        console.error("Erro ao obter sessão de autenticação", error);
        toast.error("Não foi possível carregar sua sessão. Faça login novamente.");
        if (isActive) {
          setSession(null);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
        window.clearTimeout(timeoutId);
      }
    };

    loadSession();

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Clear local state first to ensure immediate UI update
      setSession(null);
      
      // Attempt to sign out on server (but don't fail if session already invalidated)
      const { error } = await supabase.auth.signOut();
      
      // If error is "session not found", consider it success (already logged out on server)
      if (error && error.message?.includes('session_not_found')) {
        console.log('Session already invalidated on server, local logout completed');
        toast.success("Logout realizado com sucesso!");
        return;
      }
      
      // If other error, log but still consider local logout successful
      if (error) {
        console.error("Error invalidating server session:", error);
      }
      
      toast.success("Logout realizado com sucesso!");
    } catch (error: any) {
      // Catch AuthSessionMissingError or other errors
      console.error("Logout error:", error);
      
      // Ensure local logout even with errors
      setSession(null);
      toast.success("Logout realizado com sucesso!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={session ? <Navigate to="/" /> : <Auth />} />
        <Route
          path="/*"
          element={
            session ? (
              <div className="min-h-screen bg-background">
                {/* Desktop Sidebar */}
                <nav className="hidden md:flex fixed left-0 top-0 h-screen w-20 bg-card border-r flex-col items-center py-6 space-y-8">
                  <div className="mb-4">
                    <img src={evidensLogo} alt="EvidenS Logo" className="w-12 h-12" />
                  </div>
                  <NavLink to="/" icon={LayoutDashboard} label="Dashboard" />
                  <NavLink to="/pipeline" icon={GitBranch} label="Pipeline" />
                  <NavLink to="/appointments" icon={Calendar} label="Agendamentos" />
                  <NavLink
                    to="/conversations"
                    icon={MessageSquare}
                    label="Conversas"
                  />
                  <NavLink to="/clients" icon={Users} label="Clientes" />
                  <NavLink
                    to="/configuration"
                    icon={Cog}
                    label="Configurações"
                  />
                  <div className="mt-auto space-y-4">
                    <NavLink
                      to="/configuration?tab=documentation"
                      icon={BookOpen}
                      label="Documentação"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="w-12 h-12 text-muted-foreground hover:text-foreground"
                      title="Logout"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </div>
                </nav>

                {/* Mobile Header */}
                <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b flex items-center px-4 z-50">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                      <div className="flex flex-col h-full bg-card">
                        <div className="p-6 border-b">
                          <img src={evidensLogo} alt="EvidenS Logo" className="w-12 h-12 mx-auto" />
                        </div>
                        <nav className="flex-1 p-4 space-y-2">
                          <NavLink to="/" icon={LayoutDashboard} label="Dashboard" mobile />
                          <NavLink to="/pipeline" icon={GitBranch} label="Pipeline" mobile />
                          <NavLink to="/appointments" icon={Calendar} label="Agendamentos" mobile />
                          <NavLink to="/conversations" icon={MessageSquare} label="Conversas" mobile />
                          <NavLink to="/clients" icon={Users} label="Clientes" mobile />
                          <NavLink to="/configuration" icon={Cog} label="Configurações" mobile />
                          <NavLink to="/configuration?tab=documentation" icon={BookOpen} label="Documentação" mobile />
                        </nav>
                        <div className="p-4 border-t">
                          <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="w-full justify-start"
                          >
                            <LogOut className="h-5 w-5 mr-2" />
                            Logout
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                  <div className="flex-1 flex justify-center">
                    <img src={evidensLogo} alt="EvidenS Logo" className="w-10 h-10" />
                  </div>
                </header>

                <main className="md:ml-20 pt-16 md:pt-0 p-4 md:p-8">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Navigate to="/" replace />} />
                    <Route path="/pipeline" element={<Pipeline />} />
                    <Route path="/appointments" element={<Appointments />} />
                    <Route path="/conversations" element={<Conversations />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/configuration" element={<Configuration />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

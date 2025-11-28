import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCards from "@/components/dashboard/StatsCards";
import ConversionChart from "@/components/dashboard/ConversionChart";
import SentimentChart from "@/components/dashboard/SentimentChart";
import TreatmentInterestChart from "@/components/dashboard/TreatmentInterestChart";
import RecentConversations from "@/components/dashboard/RecentConversations";
import { SystemStatusCard } from "@/components/dashboard/SystemStatusCard";
import { SystemHealthCard } from "@/components/dashboard/SystemHealthCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import LeadsEvolutionChart from "@/components/dashboard/LeadsEvolutionChart";
const Dashboard = () => {
  const queryClient = useQueryClient();

  // Real-time subscription for dashboard data
  useEffect(() => {
    const dashboardChannel = supabase.channel('dashboard-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'conversas'
    }, () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard-stats"]
      });
      queryClient.invalidateQueries({
        queryKey: ["recent-conversations"]
      });
    }).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'clientes'
    }, () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard-stats"]
      });
      queryClient.invalidateQueries({
        queryKey: ["recent-conversations"]
      });
    }).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'appointments'
    }, () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard-stats"]
      });
    }).subscribe();
    return () => {
      supabase.removeChannel(dashboardChannel);
    };
  }, [queryClient]);

  // Fetch dashboard stats
  const {
    data: stats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Get all conversations
      const conversasQuery = supabase.from("conversas").select("*");
      const {
        data: conversas,
        error: conversasError
      } = await conversasQuery;
      if (conversasError) throw conversasError;

      // Get all clients
      const {
        data: clientes,
        error: clientesError
      } = await supabase.from("clientes").select("*");
      if (clientesError) throw clientesError;

      // Get all appointments with doctor info
      const {
        data: appointments,
        error: appointmentsError
      } = await supabase.from("appointments").select("*, doctors(name)");
      if (appointmentsError) throw appointmentsError;

      // Count unique clients (by phone)
      const totalLeads = new Set(clientes?.map(c => c.phone) || []).size;
      const activeConversations = conversas?.filter(c => c.status === "ativa").length || 0;
      const totalAppointments = appointments?.length || 0;

      // Calculate conversion rate based on unique clients with appointments
      const uniqueClientsWithAppointments = new Set(appointments?.map(a => a.phone) || []).size;
      const conversionRate = totalLeads > 0 ? (uniqueClientsWithAppointments / totalLeads * 100).toFixed(1) : "0";

      // Stats por médico
      const drGabrielAppts = appointments?.filter(a => a.doctor_id === 1) || [];
      const drRomuloAppts = appointments?.filter(a => a.doctor_id === 2) || [];

      // Show up rate (completed vs total appointments scheduled - confirmadas + completed)
      const scheduledAppts = appointments?.filter(a => a.status === "confirmada" || a.status === "completed") || [];
      const completedAppts = appointments?.filter(a => a.status === "completed") || [];
      const showUpRate = scheduledAppts.length > 0 ? (completedAppts.length / scheduledAppts.length * 100).toFixed(1) : "0";
      return {
        totalLeads,
        activeConversations,
        totalAppointments,
        conversionRate: `${conversionRate}%`,
        showUpRate: `${showUpRate}%`,
        drGabriel: {
          total: drGabrielAppts.length,
          confirmed: drGabrielAppts.filter(a => a.status === "confirmada").length,
          completed: drGabrielAppts.filter(a => a.status === "completed").length
        },
        drRomulo: {
          total: drRomuloAppts.length,
          confirmed: drRomuloAppts.filter(a => a.status === "confirmada").length,
          completed: drRomuloAppts.filter(a => a.status === "completed").length
        }
      };
    }
  });

  // Fetch recent conversations
  const {
    data: conversations
  } = useQuery({
    queryKey: ["recent-conversations"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("conversas").select("id, phone, status, last_message_at, sentiment, summary, cliente_id").order("last_message_at", {
        ascending: false
      }).limit(10);
      if (error) throw error;

      // Fetch client names separately
      const conversationsWithClients = await Promise.all((data || []).map(async conv => {
        if (conv.cliente_id) {
          const {
            data: cliente
          } = await supabase.from("clientes").select("name, phone").eq("id", conv.cliente_id).single();
          return {
            ...conv,
            clientes: cliente
          };
        }
        return {
          ...conv,
          clientes: null
        };
      }));
      return conversationsWithClients;
    }
  });
  return <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <StatsCards stats={stats} isLoading={statsLoading} />

        <SystemHealthCard />

        

        <LeadsEvolutionChart />

        

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TreatmentInterestChart />
          <RecentConversations conversations={conversations} />
        </div>
      </main>
    </div>;
};
export default Dashboard;
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, MessageSquare, Calendar, TrendingUp, CheckCircle, UserCheck } from "lucide-react";
interface StatsCardsProps {
  stats?: {
    totalLeads: number;
    activeConversations: number;
    totalAppointments: number;
    conversionRate: string;
    showUpRate: string;
    drGabriel: {
      total: number;
      confirmed: number;
      completed: number;
    };
    drRomulo: {
      total: number;
      confirmed: number;
      completed: number;
    };
  };
  isLoading: boolean;
}
const StatsCards = ({
  stats,
  isLoading
}: StatsCardsProps) => {
  const cards = [{
    title: "Total de Clientes",
    value: stats?.totalLeads || 0,
    subtitle: "Clientes únicos",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10"
  }, {
    title: "Conversas Ativas",
    value: stats?.activeConversations || 0,
    icon: MessageSquare,
    color: "text-secondary",
    bgColor: "bg-secondary/10"
  }, {
    title: "Total de Agendamentos",
    value: stats?.totalAppointments || 0,
    subtitle: "Todas as consultas",
    icon: Calendar,
    color: "text-success",
    bgColor: "bg-success/10"
  }, {
    title: "Taxa de Conversão",
    value: stats?.conversionRate || "0%",
    subtitle: "Clientes que agendaram",
    icon: TrendingUp,
    color: "text-warning",
    bgColor: "bg-warning/10"
  }, {
    title: "Show Up Rate",
    value: stats?.showUpRate || "0%",
    subtitle: "Comparecimento",
    icon: CheckCircle,
    color: "text-success",
    bgColor: "bg-success/10"
  }];
  const drGabrielRate = stats?.drGabriel?.total ? (stats.drGabriel.completed / stats.drGabriel.total * 100).toFixed(0) : "0";
  const drRomuloRate = stats?.drRomulo?.total ? (stats.drRomulo.completed / stats.drRomulo.total * 100).toFixed(0) : "0";
  if (isLoading) {
    return <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map(i => <Card key={i} className="p-6">
              <Skeleton className="h-24 w-full" />
            </Card>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <Skeleton className="h-32 w-full" />
          </Card>
          <Card className="p-6">
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map(card => {
        const Icon = card.icon;
        return <Card key={card.title} className="p-6 border-l-4 border-l-primary transition-all duration-300 hover:shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.25)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">{card.title}</p>
                  <p className="text-4xl font-bold text-foreground">{card.value}</p>
                  {card.subtitle && <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>}
                </div>
                <div className={`${card.bgColor} p-4 rounded-xl`}>
                  <Icon className={`w-7 h-7 ${card.color}`} />
                </div>
              </div>
            </Card>;
      })}
      </div>

      {/* Doctor Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dr. Gabriel */}
        <Card className="p-6 border-l-4 border-l-primary transition-all duration-300 hover:shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.25)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <UserCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Dr. Gabriel</h3>
              
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-primary">{stats?.drGabriel?.total || 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">{stats?.drGabriel?.confirmed || 0}</p>
              <p className="text-xs text-muted-foreground">Confirmadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{drGabrielRate}%</p>
              <p className="text-xs text-muted-foreground">Show Up</p>
            </div>
          </div>
        </Card>

        {/* Dr. Rômulo */}
        <Card className="p-6 border-l-4 border-l-primary transition-all duration-300 hover:shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.25)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-secondary/10 p-3 rounded-xl">
              <UserCheck className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Dr. Rômulo</h3>

            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-primary">{stats?.drRomulo?.total || 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">{stats?.drRomulo?.confirmed || 0}</p>
              <p className="text-xs text-muted-foreground">Confirmadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{drRomuloRate}%</p>
              <p className="text-xs text-muted-foreground">Show Up</p>
            </div>
          </div>
        </Card>
      </div>
    </div>;
};
export default StatsCards;
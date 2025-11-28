import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Clock } from "lucide-react";

const PipelineStats = () => {
  const { data: stats } = useQuery({
    queryKey: ["pipeline-stats"],
    queryFn: async () => {
      const { data: clientes } = await supabase
        .from("clientes")
        .select("payment_status, payment_amount");

      const totalLeads = clientes?.length || 0;
      const paidClients = clientes?.filter((c) => c.payment_status === "paid") || [];
      const pendingClients = clientes?.filter((c) => c.payment_status === "pending") || [];

      const totalPaid = paidClients.reduce((sum, c) => sum + (c.payment_amount || 0), 0);
      const totalPending = pendingClients.length;

      return {
        totalLeads,
        paidCount: paidClients.length,
        totalPaid,
        totalPending,
      };
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
          <p className="text-xs text-muted-foreground">Em todos os estágios</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pagamentos Recebidos</CardTitle>
          <DollarSign className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            R$ {(stats?.totalPaid || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">{stats?.paidCount || 0} clientes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">{stats?.totalPending || 0}</div>
          <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PipelineStats;

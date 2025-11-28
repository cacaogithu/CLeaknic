import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const ConversionChart = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["conversion-funnel"],
    queryFn: async () => {
      const { data: clientes, error } = await supabase
        .from("clientes")
        .select("stage, phone");

      if (error) throw error;

      // Group by phone to get unique clients, keeping the most recent stage
      const uniqueClients = new Map<string, string>();
      clientes?.forEach((c) => {
        if (c.phone && c.stage) {
          uniqueClients.set(c.phone, c.stage);
        }
      });

      const stages = {
        conexao: 0,
        qualificacao: 0,
        consulta: 0,
        conversao: 0,
      };

      uniqueClients.forEach((stage) => {
        if (Object.prototype.hasOwnProperty.call(stages, stage)) {
          stages[stage as keyof typeof stages]++;
        }
      });

      return [
        { name: "Conexão", value: stages.conexao, fill: "hsl(var(--chart-1))" },
        { name: "Qualificação", value: stages.qualificacao, fill: "hsl(var(--chart-4))" },
        { name: "Consulta", value: stages.consulta, fill: "hsl(var(--chart-3))" },
        { name: "Conversão", value: stages.conversao, fill: "hsl(var(--chart-2))" },
      ];
    },
  });

  return (
    <Card className="bg-secondary border-primary/20">
      <CardHeader>
        <CardTitle className="text-secondary-foreground">Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.2)" />
              <XAxis dataKey="name" stroke="hsl(var(--secondary-foreground))" />
              <YAxis stroke="hsl(var(--secondary-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--secondary))",
                  border: "1px solid hsl(var(--primary) / 0.3)",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--secondary-foreground))"
                }}
              />
              <Legend wrapperStyle={{ color: "hsl(var(--secondary-foreground))" }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversionChart;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const normalizeTreatmentName = (name: string): string => {
  const lowerName = name.toLowerCase();

  // Mapeamento de categorias
  if (lowerName.includes('acne') || lowerName.includes('espinha')) return 'Acne';
  if (lowerName.includes('cabelo') || lowerName.includes('queda') || lowerName.includes('capilar') || lowerName.includes('calvície')) return 'Queda de Cabelo';
  if (lowerName.includes('botox') || lowerName.includes('toxina') || lowerName.includes('ruga')) return 'Toxina Botulínica';
  if (lowerName.includes('preench')) return 'Preenchimento';
  if (lowerName.includes('laser') || lowerName.includes('fotona') || lowerName.includes('cutera')) return 'Tratamento a Laser';
  if (lowerName.includes('bioestimulador') || lowerName.includes('sculptra') || lowerName.includes('radiesse')) return 'Bioestimuladores';
  if (lowerName.includes('liftera') || lowerName.includes('flacidez') || lowerName.includes('lifting')) return 'Liftera';
  if (lowerName.includes('pinta') || lowerName.includes('mancha') || lowerName.includes('melanoma')) return 'Check-up de Pintas';
  if (lowerName.includes('cirurgia') || lowerName.includes('lesão')) return 'Cirurgia Dermatológica';
  if (lowerName.includes('melasma') || lowerName.includes('manchas')) return 'Tratamento de Manchas';

  // Se não se encaixa em nenhuma categoria, retorna o nome original capitalizado
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const TreatmentInterestChart = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["treatment-interests"],
    queryFn: async () => {
      // Get unique treatment interests from clientes table
      const { data: clientes, error } = await supabase
        .from("clientes")
        .select("treatment_interest, phone")
        .not("treatment_interest", "is", null);

      if (error) throw error;

      // Count unique clients per treatment (by phone)
      const treatmentClients = new Map<string, Set<string>>();
      clientes?.forEach((c) => {
        if (c.treatment_interest && c.phone) {
          const normalizedName = normalizeTreatmentName(c.treatment_interest);
          if (!treatmentClients.has(normalizedName)) {
            treatmentClients.set(normalizedName, new Set());
          }
          treatmentClients.get(normalizedName)?.add(c.phone);
        }
      });

      const counts: Record<string, number> = {};
      treatmentClients.forEach((phones, treatment) => {
        counts[treatment] = phones.size;
      });

      const chartColors = [
        "hsl(var(--chart-1))",
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
        "hsl(var(--chart-5))",
      ];

      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map((item, index) => ({
          ...item,
          fill: chartColors[index % chartColors.length]
        }));
    },
  });

  return (
    <Card className="bg-secondary border-primary/20">
      <CardHeader>
        <CardTitle className="text-secondary-foreground">Interesses por Tratamento</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.2)" />
              <XAxis type="number" stroke="hsl(var(--secondary-foreground))" />
              <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--secondary-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--secondary))",
                  border: "1px solid hsl(var(--primary) / 0.3)",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--secondary-foreground))"
                }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TreatmentInterestChart;

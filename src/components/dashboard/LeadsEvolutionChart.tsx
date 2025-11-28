import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { format, subDays, subWeeks, startOfDay, startOfWeek, eachDayOfInterval, eachWeekOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

const LeadsEvolutionChart = () => {
  const [timeRange, setTimeRange] = useState<"day" | "week">("day");
  const [period, setPeriod] = useState<"30days" | "90days">("30days");

  const { data, isLoading } = useQuery({
    queryKey: ["leads-evolution", timeRange, period],
    queryFn: async () => {
      const daysBack = period === "30days" ? 30 : 90;
      const startDate = timeRange === "day"
        ? subDays(new Date(), daysBack)
        : subWeeks(new Date(), Math.floor(daysBack / 7));

      const { data: clientes, error } = await supabase
        .from("clientes")
        .select("created_at, phone")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Track unique phones per date/week
      const uniquePhonesByPeriod: Record<string, Set<string>> = {};

      if (timeRange === "day") {
        const days = eachDayOfInterval({
          start: startDate,
          end: new Date()
        });

        days.forEach(day => {
          const key = format(startOfDay(day), "yyyy-MM-dd");
          uniquePhonesByPeriod[key] = new Set();
        });

        clientes?.forEach((c) => {
          if (c.created_at && c.phone) {
            const key = format(startOfDay(new Date(c.created_at)), "yyyy-MM-dd");
            if (uniquePhonesByPeriod[key]) {
              uniquePhonesByPeriod[key].add(c.phone);
            }
          }
        });

        return Object.entries(uniquePhonesByPeriod).map(([date, phones]) => ({
          date: format(new Date(date), "dd/MM", { locale: ptBR }),
          fullDate: date,
          value: phones.size
        }));
      } else {
        const weeks = eachWeekOfInterval({
          start: startDate,
          end: new Date()
        }, { locale: ptBR });

        weeks.forEach(week => {
          const key = format(startOfWeek(week, { locale: ptBR }), "yyyy-MM-dd");
          uniquePhonesByPeriod[key] = new Set();
        });

        clientes?.forEach((c) => {
          if (c.created_at && c.phone) {
            const key = format(startOfWeek(new Date(c.created_at), { locale: ptBR }), "yyyy-MM-dd");
            if (uniquePhonesByPeriod[key]) {
              uniquePhonesByPeriod[key].add(c.phone);
            }
          }
        });

        return Object.entries(uniquePhonesByPeriod).map(([date, phones]) => ({
          date: format(new Date(date), "dd/MM", { locale: ptBR }),
          fullDate: date,
          value: phones.size
        }));
      }
    },
  });

  return (
    <Card className="bg-secondary border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-secondary-foreground">Evolução de Leads</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={period === "30days" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("30days")}
            >
              30 dias
            </Button>
            <Button
              variant={period === "90days" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("90days")}
            >
              90 dias
            </Button>
            <Button
              variant={timeRange === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("day")}
            >
              Dia
            </Button>
            <Button
              variant={timeRange === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("week")}
            >
              Semana
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.2)" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--secondary-foreground))"
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke="hsl(var(--secondary-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--secondary))",
                  border: "1px solid hsl(var(--primary) / 0.3)",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--secondary-foreground))"
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return `Data: ${label}`;
                  }
                  return label;
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
                activeDot={{ r: 6 }}
                name="Leads"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadsEvolutionChart;

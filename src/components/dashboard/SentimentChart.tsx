import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
const COLORS = {
  positive: "hsl(142, 71%, 45%)",
  neutral: "hsl(47, 96%, 53%)",
  negative: "hsl(0, 84%, 60%)"
};
const SENTIMENT_MAP: Record<string, keyof typeof COLORS> = {
  "Positivo": "positive",
  "Neutro": "neutral",
  "Negativo": "negative"
};
const SentimentChart = () => {
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["sentiment-analysis"],
    queryFn: async () => {
      const {
        data: conversas,
        error
      } = await supabase.from("conversas").select("sentiment");
      if (error) throw error;
      const sentiments = {
        positive: 0,
        neutral: 0,
        negative: 0
      };
      conversas?.forEach(c => {
        if (c.sentiment && Object.prototype.hasOwnProperty.call(sentiments, c.sentiment)) {
          sentiments[c.sentiment as keyof typeof sentiments]++;
        }
      });
      return [{
        name: "Positivo",
        value: sentiments.positive
      }, {
        name: "Neutro",
        value: sentiments.neutral
      }, {
        name: "Negativo",
        value: sentiments.negative
      }];
    }
  });
  return;
};
export default SentimentChart;
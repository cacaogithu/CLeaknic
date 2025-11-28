import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const SystemHealthCard = () => {
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isFixingOrphans, setIsFixingOrphans] = useState(false);

  const { data: health, isLoading, refetch } = useQuery({
    queryKey: ["system-health"],
    queryFn: async () => {
      // Check how many conversations have been analyzed
      const { data: conversas, error } = await supabase
        .from('conversas')
        .select('id, sentiment, intent, summary, created_at');

      if (error) throw error;

      const total = conversas?.length || 0;
      const analyzed = conversas?.filter(c => c.sentiment && c.intent).length || 0;
      const unanalyzed = total - analyzed;
      const percentage = total > 0 ? Math.round((analyzed / total) * 100) : 0;

      // Get most recent analysis
      const recentlyAnalyzed = conversas?.filter(c => c.sentiment)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      const lastAnalysisDate = recentlyAnalyzed 
        ? new Date(recentlyAnalyzed.created_at)
        : null;

      const minutesAgo = lastAnalysisDate 
        ? Math.floor((Date.now() - lastAnalysisDate.getTime()) / 1000 / 60)
        : null;

      return {
        total,
        analyzed,
        unanalyzed,
        percentage,
        lastAnalysisMinutesAgo: minutesAgo,
        isHealthy: percentage >= 80
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const handleReprocess = async () => {
    setIsReprocessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('reprocess-conversations');
      
      if (error) throw error;

      toast.success(`Reprocessamento iniciado! ${data.results?.total || 0} conversas na fila.`);
      
      // Refetch health after a delay to see updates
      setTimeout(() => {
        refetch();
        setIsReprocessing(false);
      }, 3000);
    } catch (error: any) {
      console.error('Reprocess error:', error);
      toast.error(`Erro ao reprocessar: ${error.message}`);
      setIsReprocessing(false);
    }
  };

  const handleFixOrphans = async () => {
    setIsFixingOrphans(true);
    try {
      const { data, error } = await supabase.functions.invoke('fix-orphan-conversations');
      
      if (error) throw error;

      toast.success(`Correção concluída! ${data.results?.fixed || 0} conversas corrigidas, ${data.results?.created || 0} clientes criados.`);
      
      setTimeout(() => {
        refetch();
        setIsFixingOrphans(false);
      }, 2000);
    } catch (error: any) {
      console.error('Fix orphans error:', error);
      toast.error(`Erro ao corrigir: ${error.message}`);
      setIsFixingOrphans(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Verificando saúde do sistema...</span>
        </div>
      </Card>
    );
  }

  const statusColor = health?.isHealthy ? "text-green-600" : "text-amber-600";
  const StatusIcon = health?.isHealthy ? CheckCircle : AlertCircle;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${statusColor}`} />
            <h3 className="font-semibold">Saúde do Sistema de Análise</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFixOrphans}
              disabled={isFixingOrphans}
            >
              {isFixingOrphans ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Corrigindo...
                </>
              ) : (
                'Corrigir Órfãs'
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReprocess}
              disabled={isReprocessing}
            >
              {isReprocessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reprocessando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reprocessar
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Conversas analisadas</span>
            <span className="font-medium">
              {health?.analyzed} de {health?.total} ({health?.percentage}%)
            </span>
          </div>

          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                health?.isHealthy ? 'bg-green-600' : 'bg-amber-600'
              }`}
              style={{ width: `${health?.percentage}%` }}
            />
          </div>

          {health?.unanalyzed > 0 && (
            <div className="text-sm text-muted-foreground">
              {health.unanalyzed} conversas aguardando análise
            </div>
          )}

          {health?.lastAnalysisMinutesAgo !== null && (
            <div className="text-sm text-muted-foreground">
              Última análise há {health.lastAnalysisMinutesAgo} minutos
            </div>
          )}

          {!health?.isHealthy && health?.unanalyzed > 0 && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-md text-sm">
              <p className="text-amber-900 dark:text-amber-100">
                O sistema de análise está com pendências. Clique em "Reprocessar" para analisar conversas antigas.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

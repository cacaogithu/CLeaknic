import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export const SystemStatusCard = () => {
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_configuration')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    }
  });

  const { data: bufferCount, isLoading: bufferLoading } = useQuery({
    queryKey: ['buffer-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('message_buffer')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
    refetchInterval: 3000
  });

  const { data: activeHandoffs, isLoading: handoffsLoading } = useQuery({
    queryKey: ['active-handoffs'],
    queryFn: async () => {
      const { count } = await supabase
        .from('conversas')
        .select('*', { count: 'exact', head: true })
        .eq('handoff_ativo', true);
      return count || 0;
    }
  });

  if (configLoading || bufferLoading || handoffsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status do Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{bufferCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Mensagens Pendentes</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500">{activeHandoffs}</div>
            <p className="text-xs text-muted-foreground mt-1">Transferências Ativas</p>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${config?.buffer_enabled ? 'text-green-500' : 'text-red-500'}`}>
              {config?.buffer_enabled ? 'ON' : 'OFF'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Status do Buffer</p>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Tempo de Buffer:</span>
            <span className="font-medium">{config?.buffer_time_seconds}s</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Modelo de IA:</span>
            <span className="font-medium font-mono text-xs">{config?.ai_model}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Modo de Teste:</span>
            <Badge variant={config?.test_mode ? 'destructive' : 'default'}>
              {config?.test_mode ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Timeout de Transferência:</span>
            <span className="font-medium">{config?.handoff_timeout_hours}h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

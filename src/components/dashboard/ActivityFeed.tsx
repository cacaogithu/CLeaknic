import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, AlertCircle, Calendar, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  type: 'message' | 'handoff' | 'appointment' | 'client';
  data: any;
  timestamp: Date;
}

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const channel = supabase.channel('activity-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensagens'
      }, (payload) => {
        setActivities(prev => [{
          type: 'message' as const,
          data: payload.new,
          timestamp: new Date()
        }, ...prev].slice(0, 20));
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversas'
      }, (payload: any) => {
        if (payload.new.handoff_ativo && !payload.old.handoff_ativo) {
          setActivities(prev => [{
            type: 'handoff' as const,
            data: payload.new,
            timestamp: new Date()
          }, ...prev].slice(0, 20));
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'appointments'
      }, (payload) => {
        setActivities(prev => [{
          type: 'appointment' as const,
          data: payload.new,
          timestamp: new Date()
        }, ...prev].slice(0, 20));
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'clientes'
      }, (payload) => {
        setActivities(prev => [{
          type: 'client' as const,
          data: payload.new,
          timestamp: new Date()
        }, ...prev].slice(0, 20));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'handoff': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'appointment': return <Calendar className="w-4 h-4 text-green-500" />;
      case 'client': return <User className="w-4 h-4 text-purple-500" />;
    }
  };

  const getActivityTitle = (activity: Activity) => {
    switch (activity.type) {
      case 'message':
        return `Nova mensagem de ${activity.data.phone}`;
      case 'handoff':
        return `Transferência ativada para ${activity.data.phone}`;
      case 'appointment':
        return `Agendamento realizado: ${activity.data.procedure}`;
      case 'client':
        return `Novo cliente: ${activity.data.name || activity.data.phone}`;
    }
  };

  const getActivityDescription = (activity: Activity) => {
    switch (activity.type) {
      case 'message':
        return activity.data.message?.substring(0, 50) + '...';
      case 'handoff':
        return `Motivo: ${activity.data.handoff_reason || 'Solicitação do cliente'}`;
      case 'appointment':
        return `${activity.data.appointment_date} às ${activity.data.appointment_time}`;
      case 'client':
        return `Estágio: ${activity.data.stage}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feed de Atividades</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma atividade recente. Aguardando eventos...
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                  <div className="mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {getActivityTitle(activity)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {getActivityDescription(activity)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

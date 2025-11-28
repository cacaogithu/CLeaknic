import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Activity, CheckCircle2, XCircle, Clock, Zap } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface WebhookLog {
  id: string;
  created_at: string;
  endpoint: 'get' | 'create' | 'delete';
  request_params: any;
  response_data: any;
  response_time_ms: number;
  status_code: number;
  success: boolean;
  error_message: string | null;
}

export function N8nWebhookMonitor() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('n8n_webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setLogs(data as WebhookLog[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('n8n-webhook-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'n8n_webhook_logs'
        },
        (payload) => {
          setLogs(prev => [payload.new as WebhookLog, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate stats
  const stats = {
    total: logs.length,
    successful: logs.filter(l => l.success).length,
    failed: logs.filter(l => !l.success).length,
    avgResponseTime: logs.length > 0 
      ? Math.round(logs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / logs.length)
      : 0,
  };

  const successRate = stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(1) : '0';

  const getEndpointColor = (endpoint: string) => {
    switch (endpoint) {
      case 'get': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'create': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'delete': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.successful} successful</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Failed Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Avg Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                n8n Webhook Activity
                {isLive && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    <Activity className="h-3 w-3 mr-1 animate-pulse" />
                    LIVE
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Real-time webhook call monitoring</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Badge variant="outline" className={getEndpointColor(log.endpoint)}>
                      {log.endpoint.toUpperCase()}
                    </Badge>
                    
                    {log.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {format(new Date(log.created_at), 'HH:mm:ss')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Status: {log.status_code}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {log.response_time_ms}ms
                    </div>
                  </div>
                </div>
              ))}

              {logs.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  No webhook calls yet. Test the chat to see activity.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Webhook Call Details
              <Badge variant="outline" className={selectedLog ? getEndpointColor(selectedLog.endpoint) : ''}>
                {selectedLog?.endpoint.toUpperCase()}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {selectedLog && format(new Date(selectedLog.created_at), 'PPpp')}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Overview</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Status Code: <Badge variant={selectedLog.success ? "default" : "destructive"}>{selectedLog.status_code}</Badge></div>
                    <div>Response Time: <span className="font-mono">{selectedLog.response_time_ms}ms</span></div>
                    <div>Success: {selectedLog.success ? '✅' : '❌'}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Request Parameters</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.request_params, null, 2)}
                  </pre>
                </div>

                {selectedLog.response_data && (
                  <div>
                    <h4 className="font-semibold mb-2">Response Data</h4>
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.response_data, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.error_message && (
                  <div>
                    <h4 className="font-semibold mb-2 text-red-500">Error Message</h4>
                    <pre className="bg-red-500/10 p-3 rounded text-xs overflow-x-auto border border-red-500/20">
                      {selectedLog.error_message}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

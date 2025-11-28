import { useEffect, useCallback, createElement } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

interface HandoffNotification {
  id: number;
  conversa_id: number;
  phone: string;
  cliente_id: number | null;
  handoff_ativo: boolean;
  claimed_by: string | null;
}

export const useRealtimeNotifications = () => {
  const handleHandoffNotification = useCallback((payload: any) => {
    if (!payload || typeof payload !== "object" || !payload.new) {
      console.warn("Payload de handoff inválido recebido", payload);
      return;
    }

    const newRecord = payload.new as Partial<HandoffNotification>;
    const oldRecord = (payload.old ?? {}) as Partial<HandoffNotification>;

    if (typeof newRecord.handoff_ativo !== "boolean") {
      console.warn("Campo handoff_ativo ausente ou inválido", newRecord);
      return;
    }

    // Only notify if handoff was just activated
    if (newRecord.handoff_ativo && oldRecord.handoff_ativo === false) {
      toast.info(`Handoff ativado para ${newRecord.phone ?? "cliente"}`, {
        description: "Uma conversa foi transferida para atendimento humano",
        duration: 5000,
      });
    }

    // Notify when handoff is claimed
    if (newRecord.claimed_by && !oldRecord.claimed_by) {
      toast.success(`${newRecord.claimed_by} assumiu o atendimento`, {
        description: `Conversa com ${newRecord.phone ?? "cliente"}`,
        duration: 5000,
      });
    }
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const subscribeToHandoffs = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!data.session) {
          console.info("Sessão não encontrada; ignorando inscrição em tempo real.");
          return;
        }

        channel = supabase
          .channel("conversas-realtime")
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "conversas",
            },
            handleHandoffNotification
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log("Real-time notifications subscribed");
            }
            if (status === "CHANNEL_ERROR") {
              toast.error("Erro na assinatura de notificações em tempo real.", {
                icon: createElement(AlertCircle, { className: "text-destructive" }),
              });
            }
            if (status === "TIMED_OUT") {
              toast.error("Timeout ao conectar às notificações.", {
                icon: createElement(AlertCircle, { className: "text-destructive" }),
              });
            }
          });
      } catch (error) {
        console.error("Erro ao iniciar notificações em tempo real", error);
        toast.error("Não foi possível conectar às notificações em tempo real.", {
          icon: createElement(AlertCircle, { className: "text-destructive" }),
        });
      }
    };

    subscribeToHandoffs();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [handleHandoffNotification]);
};

export default useRealtimeNotifications;

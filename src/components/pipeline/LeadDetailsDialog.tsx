import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import PaymentDialog from "./PaymentDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, MessageSquare, Calendar, Clock } from "lucide-react";

// Helper to parse date-only strings as local dates to avoid timezone issues
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

interface LeadDetailsDialogProps {
  cliente: any;
  isOpen: boolean;
  onClose: () => void;
}

const LeadDetailsDialog = ({ cliente, isOpen, onClose }: LeadDetailsDialogProps) => {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const { data: conversations } = useQuery({
    queryKey: ["cliente-conversations", cliente?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversas")
        .select("*")
        .eq("cliente_id", cliente.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: isOpen && !!cliente?.id,
  });

  const { data: appointments } = useQuery({
    queryKey: ["cliente-appointments", cliente?.phone],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("phone", cliente.phone)
        .order("appointment_date", { ascending: false });
      return data || [];
    },
    enabled: isOpen && !!cliente?.phone,
  });

  const { data: pipelineHistory } = useQuery({
    queryKey: ["cliente-pipeline-history", cliente?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("pipeline_events")
        .select("*")
        .eq("cliente_id", cliente.id)
        .order("changed_at", { ascending: false });
      return data || [];
    },
    enabled: isOpen && !!cliente?.id,
  });

  if (!cliente) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{cliente.name || "Lead sem nome"}</DialogTitle>
            <p className="text-sm text-muted-foreground">{cliente.phone}</p>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="info">Geral</TabsTrigger>
              <TabsTrigger value="payment">Pagamentos</TabsTrigger>
              <TabsTrigger value="conversations">Conversas</TabsTrigger>
              <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-foreground">{cliente.email || "Não informado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CPF</label>
                  <p className="text-foreground">{cliente.cpf || "Não informado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Nascimento</label>
                  <p className="text-foreground">
                    {cliente.birth_date
                      ? format(parseLocalDate(cliente.birth_date), "dd/MM/yyyy")
                      : "Não informado"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tratamento de Interesse</label>
                  <p className="text-foreground">{cliente.treatment_interest || "Não especificado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Origem do Lead</label>
                  <p className="text-foreground">{cliente.lead_source || "Não informada"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Atendente</label>
                  <div className="flex items-center gap-2">
                    {cliente.conversas?.[0]?.claimed_by ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-success" />
                        <p className="text-foreground">{cliente.conversas[0].claimed_by}</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Não atribuído</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant="outline">{cliente.status}</Badge>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Informações de Pagamento</h3>
                <Button onClick={() => setIsPaymentDialogOpen(true)}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Registrar Pagamento
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-foreground capitalize">{cliente.payment_status || "pending"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor</label>
                  <p className="text-foreground">
                    {cliente.payment_amount
                      ? `R$ ${cliente.payment_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : "Não registrado"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data do Pagamento</label>
                  <p className="text-foreground">
                    {cliente.payment_date
                      ? format(parseLocalDate(cliente.payment_date), "dd/MM/yyyy")
                      : "Não informado"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Método</label>
                  <p className="text-foreground">{cliente.payment_method || "Não informado"}</p>
                </div>
              </div>

              {cliente.payment_notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Observações</label>
                  <p className="text-foreground mt-1">{cliente.payment_notes}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="conversations" className="space-y-3">
              {conversations?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma conversa registrada</p>
              ) : (
                conversations?.map((conv) => (
                  <div key={conv.id} className="border border-border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{conv.sentiment || "neutral"}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {conv.created_at && format(new Date(conv.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {conv.summary && <p className="text-sm text-foreground">{conv.summary}</p>}
                    {conv.intent && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageSquare className="w-3 h-3" />
                        <span>Intent: {conv.intent}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="appointments" className="space-y-3">
              {appointments?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum agendamento registrado</p>
              ) : (
                appointments?.map((apt) => (
                  <div key={apt.id} className="border border-border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">{apt.procedure}</h4>
                      <Badge variant={apt.status === "confirmada" ? "default" : "destructive"}>
                        {apt.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(parseLocalDate(apt.appointment_date), "dd/MM/yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{apt.appointment_time}</span>
                      </div>
                    </div>
                    {apt.notes && <p className="text-sm text-foreground">{apt.notes}</p>}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-3">
              {pipelineHistory?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma mudança de estágio registrada</p>
              ) : (
                pipelineHistory?.map((event) => (
                  <div key={event.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-muted-foreground">{event.old_stage}</span>
                        <span className="mx-2">→</span>
                        <span className="text-sm font-semibold text-foreground">{event.new_stage}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {event.changed_at && format(new Date(event.changed_at), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Por: {event.changed_by}</p>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <PaymentDialog
        cliente={cliente}
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
      />
    </>
  );
};

export default LeadDetailsDialog;

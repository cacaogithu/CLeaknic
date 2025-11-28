import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import LeadCard from "./LeadCard";
import { toast } from "sonner";
import { Inbox } from "lucide-react";

interface PipelineKanbanProps {
  searchTerm: string;
  paymentFilter: string;
  treatmentFilter: string;
}

const stages = [
  { id: "conexao", label: "Conexão", color: "border-chart-1 bg-chart-1/10" },
  { id: "qualificacao", label: "Qualificação", color: "border-chart-4 bg-chart-4/10" },
  { id: "consulta", label: "Consulta", color: "border-chart-3 bg-chart-3/10" },
  { id: "conversao", label: "Conversão", color: "border-chart-2 bg-chart-2/10" },
];

const PipelineKanban = ({ searchTerm, paymentFilter, treatmentFilter }: PipelineKanbanProps) => {
  const queryClient = useQueryClient();
  const [draggedClient, setDraggedClient] = useState<any>(null);

  const { data: clientes, isLoading, error } = useQuery({
    queryKey: ["pipeline-clientes", searchTerm, paymentFilter, treatmentFilter],
    queryFn: async () => {
      let query = supabase.from("clientes").select("*");

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      if (paymentFilter !== "all") {
        query = query.eq("payment_status", paymentFilter);
      }

      if (treatmentFilter !== "all") {
        query = query.eq("treatment_interest", treatmentFilter);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Fetch conversas separately for each cliente
      if (data) {
        const clientesWithConversas = await Promise.all(
          data.map(async (cliente) => {
            const { data: conversas } = await supabase
              .from("conversas")
              .select("last_message_at, sentiment, summary, claimed_by")
              .eq("cliente_id", cliente.id)
              .order("last_message_at", { ascending: false })
              .limit(1);
            
            return {
              ...cliente,
              conversas: conversas || []
            };
          })
        );
        
        return clientesWithConversas;
      }
      
      return data || [];
    },
  });

  const handleDragStart = (e: React.DragEvent, cliente: any) => {
    setDraggedClient(cliente);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    if (!draggedClient || draggedClient.stage === newStage) return;

    const oldStage = draggedClient.stage;

    try {
      // Update stage
      const { error } = await supabase
        .from("clientes")
        .update({ stage: newStage })
        .eq("id", draggedClient.id);

      if (error) throw error;

      // Log pipeline event
      await supabase.from("pipeline_events").insert({
        cliente_id: draggedClient.id,
        old_stage: oldStage,
        new_stage: newStage,
        changed_by: "manual",
      });

      toast.success("Lead movido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["pipeline-clientes"] });
    } catch (error) {
      console.error("Error updating stage:", error);
      toast.error("Erro ao mover lead");
    }

    setDraggedClient(null);
  };

  const getClientsByStage = (stageId: string) => {
    return clientes?.filter((c) => c.stage === stageId) || [];
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">Erro ao carregar leads</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stages.map((stage) => {
        const stageClientes = getClientsByStage(stage.id);

        return (
          <div
            key={stage.id}
            className={`rounded-lg border-2 ${stage.color} p-4 min-h-[500px]`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">{stage.label}</h3>
              <span className="text-sm bg-background rounded-full px-2 py-0.5 text-muted-foreground">
                {stageClientes.length}
              </span>
            </div>

            <div className="space-y-3">
              {stageClientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <Inbox className="w-8 h-8 mb-2" />
                  <p className="text-sm">Nenhum lead aqui</p>
                </div>
              ) : (
                stageClientes.map((cliente) => (
                  <LeadCard
                    key={cliente.id}
                    cliente={cliente}
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PipelineKanban;

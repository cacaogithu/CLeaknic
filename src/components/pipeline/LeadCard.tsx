import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Calendar, MessageSquare, TrendingUp } from "lucide-react";
import { useState } from "react";
import LeadDetailsDialog from "./LeadDetailsDialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadCardProps {
  cliente: any;
  onDragStart: (e: React.DragEvent, cliente: any) => void;
}

const paymentStatusColors = {
  paid: "bg-success text-success-foreground",
  pending: "bg-warning text-warning-foreground",
  partial: "bg-chart-4 text-foreground",
  overdue: "bg-destructive text-destructive-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

const paymentStatusLabels = {
  paid: "Pago",
  pending: "Pendente",
  partial: "Parcial",
  overdue: "Atrasado",
  cancelled: "Cancelado",
};

const sentimentEmojis = {
  positive: "😊",
  neutral: "😐",
  negative: "😟",
};

const LeadCard = ({ cliente, onDragStart }: LeadCardProps) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const lastConversation = cliente.conversas?.[0];
  const lastMessageTime = lastConversation?.last_message_at
    ? formatDistanceToNow(new Date(lastConversation.last_message_at), {
        addSuffix: true,
        locale: ptBR,
      })
    : "Sem conversas";

  return (
    <>
      <Card
        draggable
        onDragStart={(e) => onDragStart(e, cliente)}
        onClick={() => setIsDetailsOpen(true)}
        className="cursor-pointer hover:shadow-md transition-shadow bg-card"
      >
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground truncate">
                {cliente.name || "Sem nome"}
              </h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Phone className="w-3 h-3" />
                <span>{cliente.phone}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={paymentStatusColors[cliente.payment_status as keyof typeof paymentStatusColors] || "bg-muted"}>
              {paymentStatusLabels[cliente.payment_status as keyof typeof paymentStatusLabels] || "N/A"}
            </Badge>
            
            {cliente.conversas?.[0]?.claimed_by && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success" />
                {cliente.conversas[0].claimed_by}
              </Badge>
            )}
          </div>

          <div className="pt-2 border-t border-border space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              <span>{lastMessageTime}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{cliente.total_appointments || 0} consultas</span>
            </div>

            {lastConversation?.sentiment && (
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="w-3 h-3 text-muted-foreground" />
                <span>
                  {sentimentEmojis[lastConversation.sentiment as keyof typeof sentimentEmojis] || ""}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <LeadDetailsDialog
        cliente={cliente}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </>
  );
};

export default LeadCard;

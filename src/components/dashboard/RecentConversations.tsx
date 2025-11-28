import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: number;
  phone: string;
  status: string;
  last_message_at: string;
  sentiment?: string;
  summary?: string;
  clientes?: { name?: string; phone: string } | null;
}

interface RecentConversationsProps {
  conversations?: Conversation[];
}

const RecentConversations = ({ conversations }: RecentConversationsProps) => {
  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-success/10 text-success border-success/20";
      case "negative":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Conversas Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations?.slice(0, 5).map((conv) => (
            <div
              key={conv.id}
              className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-foreground">
                    {conv.clientes?.name || conv.phone}
                  </p>
                  <p className="text-sm text-muted-foreground">{conv.phone}</p>
                </div>
                {conv.sentiment && (
                  <Badge className={getSentimentColor(conv.sentiment)}>
                    {conv.sentiment}
                  </Badge>
                )}
              </div>
              {conv.summary && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {conv.summary}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentConversations;

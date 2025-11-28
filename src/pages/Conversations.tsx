import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Phone, MessageCircle, Clock, ExternalLink, Send } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";

interface Conversation {
  id: number;
  phone: string;
  cliente_id: number | null;
  summary: string | null;
  status: string;
  last_message_at: string;
  sentiment: string | null;
  handoff_ativo: boolean;
  clientes?: {
    name: string | null;
    phone: string;
  } | null;
}

type MessageSender = "user" | "human" | "bot" | string;

interface Message {
  id: number;
  conversa_id: number;
  phone: string;
  sender: MessageSender;
  message: string | null;
  created_at: string;
}

const Conversations = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Real-time subscription for conversations and messages
  useEffect(() => {
    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversas' }, () => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensagens' }, (payload) => {
        // Invalidate specific conversation messages if we have a selected conversation
        if (selectedConversationId) {
          queryClient.invalidateQueries({ queryKey: ["messages", selectedConversationId] });
        }
        // Also invalidate using predicate to catch all message queries
        queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] === "messages"
        });
        // Refresh conversations list to update last_message_at
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
    };
  }, [queryClient, selectedConversationId]);

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["conversations", searchPhone, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("conversas")
        .select("id, phone, cliente_id, summary, status, last_message_at, sentiment, handoff_ativo")
        .order("last_message_at", { ascending: false });

      if (searchPhone) {
        query = query.ilike("phone", `%${searchPhone}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch client names
      const conversationsWithClients = await Promise.all(
        (data || []).map(async (conv) => {
          if (conv.cliente_id) {
            const { data: cliente } = await supabase
              .from("clientes")
              .select("name, phone")
              .eq("id", conv.cliente_id)
              .single();

            return { ...conv, clientes: cliente };
          }
          return { ...conv, clientes: null };
        })
      );

      return conversationsWithClients;
    },
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return [];

      const { data, error } = await supabase
        .from("mensagens")
        .select("id, conversa_id, phone, sender, message, created_at")
        .eq("conversa_id", selectedConversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedConversationId,
  });

  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);

  const handleSendReply = async () => {
    if (!selectedConversation || !replyMessage.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          phone: selectedConversation.phone,
          message: replyMessage,
          useQueue: false,
          sender: 'human' // Manual reply from Eliana, not bot
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Mensagem enviada com sucesso!");
      setReplyMessage("");
      setIsReplyDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsSending(false);
    }
  };

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800";
      case "negative":
        return "bg-red-100 text-red-800";
      case "neutral":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativa":
        return "bg-blue-100 text-blue-800";
      case "finalizada":
        return "bg-gray-100 text-gray-800";
      case "cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Conversas</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conversas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por telefone..."
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    className="pl-8"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                  >
                    Todas
                  </Button>
                  <Button
                    variant={statusFilter === "ativa" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("ativa")}
                  >
                    Ativas
                  </Button>
                  <Button
                    variant={statusFilter === "finalizada" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("finalizada")}
                  >
                    Finalizadas
                  </Button>
                </div>

                {/* Conversations Scroll */}
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2 pr-4">
                    {conversationsLoading ? (
                      <p className="text-sm text-muted-foreground">Carregando...</p>
                    ) : conversations && conversations.length > 0 ? (
                      conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => setSelectedConversationId(conv.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedConversationId === conv.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {conv.clientes?.name || conv.phone}
                              </p>
                              <p className="text-xs opacity-75 truncate">
                                {conv.phone}
                              </p>
                            </div>
                            {conv.handoff_ativo && (
                              <Badge variant="destructive" className="text-xs">
                                Handoff
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs opacity-75 mt-1 truncate">
                            {conv.summary || "Sem resumo"}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-xs opacity-75">
                            <Clock className="h-3 w-3" />
                            {formatDate(conv.last_message_at)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Conversation Details */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {selectedConversation.clientes?.name || selectedConversation.phone}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {selectedConversation.phone}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(selectedConversation.status)}>
                        {selectedConversation.status}
                      </Badge>
                      {selectedConversation.sentiment && (
                        <Badge className={getSentimentColor(selectedConversation.sentiment)}>
                          {selectedConversation.sentiment}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Summary */}
                  {selectedConversation.summary && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-semibold mb-1">Resumo</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.summary}
                      </p>
                    </div>
                  )}

                  {/* Messages Timeline */}
                  <ScrollArea className="flex-1 border rounded-lg p-4 mb-4">
                    <div className="space-y-4">
                      {messagesLoading ? (
                        <p className="text-sm text-muted-foreground">Carregando mensagens...</p>
                      ) : messages && messages.length > 0 ? (
                        messages.map((msg) => {
                          // Normalize sender value with fallbacks
                          const rawSender = msg.sender?.toLowerCase()?.trim() || "";

                          // Determine sender type with fallbacks
                          // "human" = Manual messages from Eliana via dashboard
                          // "bot" = Automated AI responses
                          // "user" = Customer/client messages (inbound)
                          // "assistant" = Possible OpenAI format, treat as bot
                          const isHuman = rawSender === "human";
                          const isBot = rawSender === "bot" || rawSender === "assistant";

                          // Determine label and styling
                          let senderLabel: string;
                          let alignmentClass: string;
                          let bubbleClass: string;

                          if (isHuman) {
                            senderLabel = "Eliana";
                            alignmentClass = "justify-end";
                            bubbleClass = "bg-primary text-primary-foreground rounded-br-none";
                          } else if (isBot) {
                            senderLabel = "Bot IA";
                            alignmentClass = "justify-end";
                            bubbleClass = "bg-amber-100 text-amber-900 border border-amber-200 rounded-br-none";
                          } else {
                            // Client/user messages or unknown - default to customer
                            senderLabel = "Cliente";
                            alignmentClass = "justify-start";
                            bubbleClass = "bg-muted text-muted-foreground rounded-bl-none";
                          }

                          return (
                            <div
                              key={msg.id}
                              className={`flex ${alignmentClass}`}
                            >
                              <div className={`max-w-xs px-4 py-2 rounded-lg ${bubbleClass}`}>
                                <p className="text-xs font-semibold mb-1">{senderLabel}</p>
                                <p className="text-sm break-words">{msg.message}</p>
                                <p className="text-xs opacity-75 mt-1">
                                  {formatDate(msg.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma mensagem</p>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        if (selectedConversation.cliente_id) {
                          navigate(`/pipeline?cliente=${selectedConversation.cliente_id}`);
                        } else {
                          toast.error("Cliente não encontrado");
                        }
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Cliente
                    </Button>
                    <Button 
                      variant="default" 
                      className="flex-1"
                      onClick={() => setIsReplyDialogOpen(true)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Responder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Selecione uma conversa para visualizar os detalhes
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Mensagem</DialogTitle>
            <DialogDescription>
              Enviar mensagem para {selectedConversation?.clientes?.name || selectedConversation?.phone}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={6}
              disabled={isSending}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReplyDialogOpen(false);
                setReplyMessage("");
              }}
              disabled={isSending}
            >
              Cancelar
            </Button>
            <Button onClick={handleSendReply} disabled={isSending || !replyMessage.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {isSending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Conversations;

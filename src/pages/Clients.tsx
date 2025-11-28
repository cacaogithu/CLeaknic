import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Phone, Mail, Calendar, DollarSign, User, TrendingUp, Upload, UserPlus } from "lucide-react";
import { EditContactDialog } from "@/components/clients/EditContactDialog";
import { ImportClientsDialog } from "@/components/clients/ImportClientsDialog";
import { AddClientDialog } from "@/components/clients/AddClientDialog";
import { useQueryClient } from "@tanstack/react-query";

interface Client {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  cpf: string | null;
  status: string | null;
  stage: string | null;
  treatment_interest: string | null;
  total_appointments: number | null;
  last_appointment_date: string | null;
  created_at: string;
  payment_status: string | null;
  payment_amount: number | null;
  lead_source: string | null;
}

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [treatmentFilter, setTreatmentFilter] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch weekly revenue
  const { data: weeklyRevenue } = useQuery({
    queryKey: ["weekly-revenue"],
    queryFn: async () => {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const { data, error } = await supabase
        .from("clientes")
        .select("payment_amount")
        .gte("payment_date", weekStart.toISOString())
        .lt("payment_date", weekEnd.toISOString())
        .not("payment_amount", "is", null);

      if (error) throw error;
      
      const total = data?.reduce((sum, client) => sum + (client.payment_amount || 0), 0) || 0;
      return total;
    },
  });

  // Fetch clients with filters
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients", searchTerm, statusFilter, stageFilter, treatmentFilter],
    queryFn: async () => {
      let query = supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (stageFilter !== "all") {
        query = query.eq("stage", stageFilter);
      }

      if (treatmentFilter !== "all") {
        query = query.eq("treatment_interest", treatmentFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "lead":
        return "bg-blue-100 text-blue-800";
      case "qualificado":
        return "bg-yellow-100 text-yellow-800";
      case "agendado":
        return "bg-purple-100 text-purple-800";
      case "paciente":
        return "bg-green-100 text-green-800";
      case "perdido":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStageColor = (stage: string | null) => {
    switch (stage) {
      case "conexao":
        return "bg-blue-100 text-blue-800";
      case "problema":
        return "bg-orange-100 text-orange-800";
      case "impacto":
        return "bg-purple-100 text-purple-800";
      case "decisao":
        return "bg-green-100 text-green-800";
      case "agendamento":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string | null) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "partial":
        return "bg-orange-100 text-orange-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Clientes</h1>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)} variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Cliente
            </Button>
            <Button onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importar em Lote
            </Button>
          </div>
        </div>

        {/* Weekly Revenue Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Receita essa Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(weeklyRevenue || 0)}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters and List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, telefone ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="qualificado">Qualificado</SelectItem>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="paciente">Paciente</SelectItem>
                      <SelectItem value="perdido">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stage Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Estágio</label>
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="conexao">Conexão</SelectItem>
                      <SelectItem value="problema">Problema</SelectItem>
                      <SelectItem value="impacto">Impacto</SelectItem>
                      <SelectItem value="decisao">Decisão</SelectItem>
                      <SelectItem value="agendamento">Agendamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Treatment Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Tratamento de Interesse</label>
                  <Select value={treatmentFilter} onValueChange={setTreatmentFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="implante">Implante</SelectItem>
                      <SelectItem value="clareamento">Clareamento</SelectItem>
                      <SelectItem value="limpeza">Limpeza</SelectItem>
                      <SelectItem value="restauracao">Restauração</SelectItem>
                      <SelectItem value="ortodontia">Ortodontia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clients List */}
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">
                    Clientes ({clients?.length || 0})
                  </h3>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2 pr-4">
                      {isLoading ? (
                        <p className="text-sm text-muted-foreground">Carregando...</p>
                      ) : clients && clients.length > 0 ? (
                        clients.map((client) => (
                          <div
                            key={client.id}
                            onClick={() => setSelectedClient(client)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedClient?.id === client.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                          >
                            <p className="font-semibold text-sm truncate">
                              {client.name || "Sem nome"}
                            </p>
                            <p className="text-xs opacity-75 truncate">
                              {client.phone}
                            </p>
                            {client.status && (
                              <Badge
                                className={`mt-1 text-xs ${getStatusColor(client.status)}`}
                                variant="secondary"
                              >
                                {client.status}
                              </Badge>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Nenhum cliente encontrado
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client Details */}
          <div className="lg:col-span-2">
            {selectedClient ? (
              <div className="space-y-6">
                {/* Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl">
                          {selectedClient.name || "Sem nome"}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {selectedClient.phone}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {selectedClient.status && (
                          <Badge className={getStatusColor(selectedClient.status)}>
                            {selectedClient.status}
                          </Badge>
                        )}
                        {selectedClient.stage && (
                          <Badge className={getStageColor(selectedClient.stage)}>
                            {selectedClient.stage}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Contact Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações de Contato</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedClient.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedClient.email}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedClient.cpf && (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">CPF</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedClient.cpf}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedClient.lead_source && (
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium">Origem do Lead</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedClient.lead_source}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Treatment & Appointments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tratamento e Consultas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedClient.treatment_interest && (
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium">Interesse em Tratamento</p>
                          <Badge className="mt-1">
                            {selectedClient.treatment_interest}
                          </Badge>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Total de Consultas</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedClient.total_appointments || 0}
                        </p>
                      </div>
                    </div>
                    {selectedClient.last_appointment_date && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Última Consulta</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(selectedClient.last_appointment_date)}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedClient.payment_status && (
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium">Status de Pagamento</p>
                          <Badge
                            className={`mt-1 ${getPaymentStatusColor(
                              selectedClient.payment_status
                            )}`}
                          >
                            {selectedClient.payment_status}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {selectedClient.payment_amount && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Valor Total Pago</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(selectedClient.payment_amount)}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button className="flex-1">Ver Conversas</Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    Editar Cliente
                  </Button>
                </div>
                
                {/* Edit Contact Dialog */}
                {selectedClient && (
                  <EditContactDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    client={selectedClient}
                  />
                )}
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Selecione um cliente para visualizar os detalhes
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        <ImportClientsDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          onImportComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
          }}
        />

        <AddClientDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onClientAdded={() => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
          }}
        />
      </div>
    </div>
  );
};

export default Clients;

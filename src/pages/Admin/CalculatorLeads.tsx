import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Mail, Phone, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CalculatorLead {
  id: string;
  clinic_name: string;
  contact_email: string;
  monthly_leads: number;
  avg_response_time: string;
  no_show_rate: number;
  avg_ticket: number;
  open_budgets: number;
  calculated_loss: number;
  recoverable_potential: number;
  status: string;
  notes: string | null;
  created_at: string;
}

export default function CalculatorLeads() {
  const [leads, setLeads] = useState<CalculatorLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      let query = supabase
        .from('calculator_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching calculator leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('calculator_leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;
      toast.success('Status atualizado');
      fetchLeads();
    } catch (error: any) {
      console.error('Error updating lead status:', error);
      toast.error(error.message || 'Erro ao atualizar status');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      new: { label: 'Novo', variant: 'default' },
      contacted: { label: 'Contatado', variant: 'secondary' },
      qualified: { label: 'Qualificado', variant: 'outline' },
      converted: { label: 'Convertido', variant: 'default' },
      lost: { label: 'Perdido', variant: 'destructive' }
    };
    const badge = badges[status] || badges.new;
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalPotential = leads.reduce((sum, lead) => sum + lead.recoverable_potential, 0);
  const newLeadsCount = leads.filter(l => l.status === 'new').length;
  const qualifiedCount = leads.filter(l => l.status === 'qualified').length;
  const convertedCount = leads.filter(l => l.status === 'converted').length;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Leads da Calculadora</h1>
        <p className="text-gray-600 mt-2">Gerencie os leads gerados pela calculadora de vazamento de receita</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Leads</p>
                <p className="text-3xl font-bold">{leads.length}</p>
              </div>
              <Calculator className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Novos</p>
                <p className="text-3xl font-bold">{newLeadsCount}</p>
              </div>
              <Mail className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Qualificados</p>
                <p className="text-3xl font-bold">{qualifiedCount}</p>
              </div>
              <Phone className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Potencial Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPotential)}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Select value={filterStatus} onValueChange={(value) => {
          setFilterStatus(value);
          fetchLeads();
        }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="new">Novos</SelectItem>
            <SelectItem value="contacted">Contatados</SelectItem>
            <SelectItem value="qualified">Qualificados</SelectItem>
            <SelectItem value="converted">Convertidos</SelectItem>
            <SelectItem value="lost">Perdidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads Capturados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum lead capturado ainda
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clínica</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Leads/mês</TableHead>
                    <TableHead>Perda Calculada</TableHead>
                    <TableHead>Potencial</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.clinic_name}</TableCell>
                      <TableCell>
                        <a href={`mailto:${lead.contact_email}`} className="text-blue-600 hover:underline">
                          {lead.contact_email}
                        </a>
                      </TableCell>
                      <TableCell>{lead.monthly_leads}</TableCell>
                      <TableCell className="font-semibold text-red-600">
                        {formatCurrency(lead.calculated_loss)}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(lead.recoverable_potential)}
                      </TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(value) => updateLeadStatus(lead.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Novo</SelectItem>
                            <SelectItem value="contacted">Contatado</SelectItem>
                            <SelectItem value="qualified">Qualificado</SelectItem>
                            <SelectItem value="converted">Convertido</SelectItem>
                            <SelectItem value="lost">Perdido</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {leads.length > 0 && (
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Card className="border-2 border-purple-200">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Taxa de Conversão</h3>
              <p className="text-3xl font-bold text-purple-600">
                {((convertedCount / leads.length) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {convertedCount} de {leads.length} leads convertidos
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Potencial Médio por Lead</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(totalPotential / leads.length)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Receita recuperável mensal média
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-pink-200">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Leads Ativos</h3>
              <p className="text-3xl font-bold text-pink-600">
                {newLeadsCount + qualifiedCount}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Novos + Qualificados para follow-up
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

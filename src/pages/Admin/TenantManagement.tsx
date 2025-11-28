import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  status: string;
  plan_type: string;
  monthly_fee: number;
  setup_fee: number;
  created_at: string;
}

export default function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subdomain: '',
    plan_type: 'standard',
    monthly_fee: 3500,
    setup_fee: 3000,
    status: 'active'
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Erro ao carregar clínicas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTenant) {
        // Update existing tenant
        const { error } = await supabase
          .from('tenants')
          .update(formData)
          .eq('id', editingTenant.id);

        if (error) throw error;
        toast.success('Clínica atualizada com sucesso');
      } else {
        // Create new tenant
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { error } = await supabase.rpc('create_tenant', {
          p_name: formData.name,
          p_slug: formData.slug,
          p_owner_user_id: user.id,
          p_plan_type: formData.plan_type,
          p_monthly_fee: formData.monthly_fee,
          p_setup_fee: formData.setup_fee
        });

        if (error) throw error;
        toast.success('Clínica criada com sucesso');
      }

      setDialogOpen(false);
      resetForm();
      fetchTenants();
    } catch (error: any) {
      console.error('Error saving tenant:', error);
      toast.error(error.message || 'Erro ao salvar clínica');
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      subdomain: tenant.subdomain || '',
      plan_type: tenant.plan_type,
      monthly_fee: tenant.monthly_fee,
      setup_fee: tenant.setup_fee,
      status: tenant.status
    });
    setDialogOpen(true);
  };

  const handleDelete = async (tenantId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta clínica?')) return;

    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);

      if (error) throw error;
      toast.success('Clínica excluída com sucesso');
      fetchTenants();
    } catch (error: any) {
      console.error('Error deleting tenant:', error);
      toast.error(error.message || 'Erro ao excluir clínica');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      subdomain: '',
      plan_type: 'standard',
      monthly_fee: 3500,
      setup_fee: 3000,
      status: 'active'
    });
    setEditingTenant(null);
  };

  const getPlanBadge = (planType: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      founder_1_3: { label: 'Fundador 1-3', variant: 'default' },
      founder_4_10: { label: 'Fundador 4-10', variant: 'secondary' },
      standard: { label: 'Padrão', variant: 'outline' },
      enterprise: { label: 'Enterprise', variant: 'destructive' }
    };
    const badge = badges[planType] || badges.standard;
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      active: { label: 'Ativo', variant: 'default' },
      trial: { label: 'Trial', variant: 'secondary' },
      suspended: { label: 'Suspenso', variant: 'destructive' },
      cancelled: { label: 'Cancelado', variant: 'outline' }
    };
    const badge = badges[status] || badges.active;
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Clínicas</h1>
          <p className="text-gray-600 mt-2">Gerencie todas as clínicas da plataforma</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
              <Plus className="mr-2 h-4 w-4" />
              Nova Clínica
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTenant ? 'Editar Clínica' : 'Nova Clínica'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Clínica *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    required
                    placeholder="ex: clinica-bella"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subdomain">Subdomínio (opcional)</Label>
                <Input
                  id="subdomain"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                  placeholder="ex: bella"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Deixe em branco para usar o slug como subdomínio
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plan_type">Tipo de Plano *</Label>
                  <Select 
                    value={formData.plan_type}
                    onValueChange={(value) => {
                      const fees: Record<string, { monthly: number; setup: number }> = {
                        founder_1_3: { monthly: 1500, setup: 3000 },
                        founder_4_10: { monthly: 2000, setup: 3000 },
                        standard: { monthly: 3500, setup: 3000 },
                        enterprise: { monthly: 5000, setup: 5000 }
                      };
                      setFormData({ 
                        ...formData, 
                        plan_type: value,
                        monthly_fee: fees[value]?.monthly || 3500,
                        setup_fee: fees[value]?.setup || 3000
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="founder_1_3">Fundador 1-3 (R$ 1.500/mês)</SelectItem>
                      <SelectItem value="founder_4_10">Fundador 4-10 (R$ 2.000/mês)</SelectItem>
                      <SelectItem value="standard">Padrão (R$ 3.500/mês)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (Personalizado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select 
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthly_fee">Mensalidade (R$) *</Label>
                  <Input
                    id="monthly_fee"
                    type="number"
                    step="0.01"
                    value={formData.monthly_fee}
                    onChange={(e) => setFormData({ ...formData, monthly_fee: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="setup_fee">Taxa de Setup (R$) *</Label>
                  <Input
                    id="setup_fee"
                    type="number"
                    step="0.01"
                    value={formData.setup_fee}
                    onChange={(e) => setFormData({ ...formData, setup_fee: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600">
                  {editingTenant ? 'Atualizar' : 'Criar'} Clínica
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Clínicas Cadastradas ({tenants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma clínica cadastrada ainda
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mensalidade</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        /{tenant.slug}
                      </code>
                    </TableCell>
                    <TableCell>{getPlanBadge(tenant.plan_type)}</TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell>
                      R$ {tenant.monthly_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tenant)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tenant.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

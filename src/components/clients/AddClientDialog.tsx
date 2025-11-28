import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientAdded: () => void;
}

export function AddClientDialog({ open, onOpenChange, onClientAdded }: AddClientDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    cpf: "",
    email: "",
  });
  const { toast } = useToast();

  const normalizePhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10 || cleaned.length === 11) {
      return `+55${cleaned}`;
    }
    if (cleaned.length === 12 || cleaned.length === 13) {
      return `+${cleaned}`;
    }
    return phone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone) {
      toast({
        title: "Campo obrigatório",
        description: "Telefone é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const normalizedPhone = normalizePhone(formData.phone);
      
      // Check if client exists
      const { data: existing } = await supabase
        .from("clientes")
        .select("id")
        .eq("phone", normalizedPhone)
        .single();

      if (existing) {
        toast({
          title: "Cliente já existe",
          description: "Um cliente com este telefone já está cadastrado",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Insert new client
      const { error } = await supabase
        .from("clientes")
        .insert({
          phone: normalizedPhone,
          name: formData.name || normalizedPhone,
          client_name: formData.name || normalizedPhone,
          cpf: formData.cpf || null,
          email: formData.email || null,
          is_existing_patient: true,
          lead_source: "cadastro_manual",
          status: "cliente",
          stage: "conexao",
          first_contact_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Cliente cadastrado",
        description: "Cliente adicionado com sucesso",
      });

      onClientAdded();
      onOpenChange(false);
      setFormData({ name: "", phone: "", cpf: "", email: "" });
    } catch (error) {
      toast({
        title: "Erro ao cadastrar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Cliente</DialogTitle>
          <DialogDescription>
            Cadastre um novo paciente manualmente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              placeholder="11999998888"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Nome completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              placeholder="123.456.789-00"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

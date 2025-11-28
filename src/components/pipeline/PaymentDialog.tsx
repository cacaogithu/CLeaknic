import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper to parse date-only strings as local dates to avoid timezone issues
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

interface PaymentDialogProps {
  cliente: any;
  isOpen: boolean;
  onClose: () => void;
}

const PaymentDialog = ({ cliente, isOpen, onClose }: PaymentDialogProps) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    payment_status: cliente?.payment_status || "pending",
    payment_amount: cliente?.payment_amount || "",
    payment_date: cliente?.payment_date ? parseLocalDate(cliente.payment_date) : new Date(),
    payment_method: cliente?.payment_method || "",
    payment_notes: cliente?.payment_notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("clientes")
        .update({
          payment_status: formData.payment_status,
          payment_amount: formData.payment_amount ? parseFloat(formData.payment_amount as any) : null,
          payment_date: formData.payment_date ? format(formData.payment_date, "yyyy-MM-dd") : null,
          payment_method: formData.payment_method,
          payment_notes: formData.payment_notes,
        })
        .eq("id", cliente.id);

      if (error) throw error;

      toast.success("Pagamento registrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["pipeline-clientes"] });
      queryClient.invalidateQueries({ queryKey: ["cliente-conversations"] });
      onClose();
    } catch (error) {
      console.error("Error saving payment:", error);
      toast.error("Erro ao salvar pagamento");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento - {cliente?.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment_status">Status do Pagamento</Label>
            <Select
              value={formData.payment_status}
              onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_amount">Valor (R$)</Label>
            <Input
              id="payment_amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.payment_amount}
              onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Data do Pagamento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.payment_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.payment_date ? (
                    format(formData.payment_date, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.payment_date}
                  onSelect={(date) => setFormData({ ...formData, payment_date: date || new Date() })}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pagamento</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_notes">Observações</Label>
            <Textarea
              id="payment_notes"
              placeholder="Adicione observações sobre o pagamento..."
              value={formData.payment_notes}
              onChange={(e) => setFormData({ ...formData, payment_notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;

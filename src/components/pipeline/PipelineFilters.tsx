import { Search, DollarSign, Stethoscope, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface PipelineFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  paymentFilter: string;
  setPaymentFilter: (filter: string) => void;
  treatmentFilter: string;
  setTreatmentFilter: (filter: string) => void;
}

const PipelineFilters = ({
  searchTerm,
  setSearchTerm,
  paymentFilter,
  setPaymentFilter,
  treatmentFilter,
  setTreatmentFilter,
}: PipelineFiltersProps) => {
  const clearFilters = () => {
    setSearchTerm("");
    setPaymentFilter("all");
    setTreatmentFilter("all");
  };

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={paymentFilter} onValueChange={setPaymentFilter}>
        <SelectTrigger className="w-[200px]">
          <DollarSign className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Status Pagamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="paid">Pagos</SelectItem>
          <SelectItem value="pending">Pendentes</SelectItem>
          <SelectItem value="partial">Parciais</SelectItem>
          <SelectItem value="overdue">Atrasados</SelectItem>
        </SelectContent>
      </Select>

      <Select value={treatmentFilter} onValueChange={setTreatmentFilter}>
        <SelectTrigger className="w-[200px]">
          <Stethoscope className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Tratamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="acne">Acne</SelectItem>
          <SelectItem value="botox">Botox</SelectItem>
          <SelectItem value="preenchimento">Preenchimento</SelectItem>
          <SelectItem value="harmonizacao">Harmonização</SelectItem>
        </SelectContent>
      </Select>

      {(searchTerm || paymentFilter !== "all" || treatmentFilter !== "all") && (
        <Button variant="ghost" onClick={clearFilters}>
          <X className="w-4 h-4 mr-2" />
          Limpar
        </Button>
      )}
    </div>
  );
};

export default PipelineFilters;

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UnavailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnavailabilityDialog({ open, onOpenChange }: UnavailabilityDialogProps) {
  const queryClient = useQueryClient();
  const [doctorId, setDoctorId] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("");

  // Fetch doctors
  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing unavailability periods
  const { data: unavailability } = useQuery({
    queryKey: ["unavailability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctor_unavailability")
        .select(`
          *,
          doctors (
            id,
            name
          )
        `)
        .order("start_datetime", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Add unavailability mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate) {
        throw new Error("Selecione as datas de início e fim");
      }

      const startDateTime = new Date(startDate);
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      startDateTime.setHours(startHours, startMinutes, 0, 0);

      const endDateTime = new Date(endDate);
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      const { error } = await supabase.from("doctor_unavailability").insert({
        doctor_id: doctorId === "all" ? null : parseInt(doctorId),
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        reason: reason || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unavailability"] });
      toast.success("Período de indisponibilidade adicionado");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar indisponibilidade");
    },
  });

  // Delete unavailability mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("doctor_unavailability")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unavailability"] });
      toast.success("Período removido");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover período");
    },
  });

  const resetForm = () => {
    setDoctorId("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setStartTime("08:00");
    setEndTime("18:00");
    setReason("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Horários Indisponíveis</DialogTitle>
          <DialogDescription>
            Adicione períodos em que médicos não estarão disponíveis para consultas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Add New Unavailability Form */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <h3 className="font-medium">Adicionar Novo Período</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doctor">Médico</Label>
                <Select value={doctorId} onValueChange={setDoctorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o médico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toda a clínica</SelectItem>
                    {doctors?.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Motivo (opcional)</Label>
                <Input
                  placeholder="Férias, compromisso pessoal..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Horário de Início</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Término</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Horário de Término</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" disabled={addMutation.isPending} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Período
            </Button>
          </div>

          {/* List of Existing Unavailability */}
          <div className="space-y-4">
            <h3 className="font-medium">Períodos Cadastrados</h3>
            {unavailability && unavailability.length > 0 ? (
              <div className="space-y-2">
                {unavailability.map((period: any) => (
                  <div
                    key={period.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {period.doctors?.name || "Clínica inteira"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(period.start_datetime), "PPP 'às' HH:mm", { locale: ptBR })} -{" "}
                        {format(new Date(period.end_datetime), "PPP 'às' HH:mm", { locale: ptBR })}
                      </p>
                      {period.reason && (
                        <p className="text-sm text-muted-foreground italic">{period.reason}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(period.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum período de indisponibilidade cadastrado
              </p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

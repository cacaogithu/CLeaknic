import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Helper to parse date-only strings as local dates to avoid timezone issues
const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
};

const postAppointmentSchema = z.object({
    status: z.enum(["completed", "no_show", "rescheduled"], {
        required_error: "Selecione um status",
    }),
    procedure_performed: z.string().optional(),
    next_steps: z.string().optional(),
    amount_charged: z.string().optional(),
    payment_method: z.string().optional(),
    next_appointment_date: z.date().optional(),
    no_show_reason: z.string().optional(),
});

type PostAppointmentFormValues = z.infer<typeof postAppointmentSchema>;

interface Appointment {
    id: string | number;
    phone: string;
    appointment_date: string;
    appointment_time: string;
    procedure: string;
    status: string;
    doctor_id?: string | number;
    doctors?: {
        name: string;
    };
    notes?: string;
}

interface PostAppointmentDialogProps {
    appointment: Appointment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PostAppointmentDialog({
    appointment,
    open,
    onOpenChange,
}: PostAppointmentDialogProps) {
    const queryClient = useQueryClient();
    const [attendanceStatus, setAttendanceStatus] = useState<string>("");

    const form = useForm<PostAppointmentFormValues>({
        resolver: zodResolver(postAppointmentSchema),
        defaultValues: {
            procedure_performed: "",
            next_steps: "",
            amount_charged: "",
            payment_method: "",
            no_show_reason: "",
        },
    });

    const postAppointmentMutation = useMutation({
        mutationFn: async (values: PostAppointmentFormValues) => {
            if (!appointment) throw new Error("Nenhum agendamento selecionado");

            // Update appointment status
            const newNote = values.status === "completed"
                ? `[${new Date().toLocaleString("pt-BR")}] Procedimento: ${values.procedure_performed}\nPróximos passos: ${values.next_steps}\nValor: R$ ${values.amount_charged}\nPagamento: ${values.payment_method}`
                : `[${new Date().toLocaleString("pt-BR")}] Motivo falta: ${values.no_show_reason}`;

            const { error: updateError } = await supabase
                .from("appointments")
                .update({
                    status: values.status,
                    notes: newNote,
                })
                .eq("id", Number(appointment.id));

            if (updateError) throw updateError;

            // Update cliente statistics if completed
            if (values.status === "completed") {
                const { data: cliente, error: clienteError } = await supabase
                    .from("clientes")
                    .select("total_appointments")
                    .eq("phone", appointment.phone)
                    .single();

                if (!clienteError && cliente) {
                    await supabase
                        .from("clientes")
                        .update({
                            total_appointments: (cliente.total_appointments || 0) + 1,
                            last_appointment_date: appointment.appointment_date,
                        })
                        .eq("phone", appointment.phone);
                }
            }

            // Sync with Google Sheets
            try {
                await supabase.functions.invoke("update-sheets-status", {
                    body: {
                        phone: appointment.phone,
                        appointmentDate: appointment.appointment_date,
                        appointmentTime: appointment.appointment_time,
                        status: values.status,
                    },
                });
            } catch (error) {
                console.error("Error syncing with Sheets:", error);
            }

            // Create next appointment if date provided
            if (values.next_appointment_date && values.status === "completed") {
                const nextDate = format(values.next_appointment_date, "yyyy-MM-dd");
                const { error: nextApptError } = await supabase
                    .from("appointments")
                    .insert([{
                        phone: appointment.phone,
                        appointment_date: nextDate,
                        appointment_time: appointment.appointment_time, // Same time as current
                        doctor_id: appointment.doctor_id ? Number(appointment.doctor_id) : null,
                        procedure: "Retorno - " + appointment.procedure,
                        status: "pendente_confirmacao",
                        notes: "Agendamento criado automaticamente como retorno",
                    }]);

                if (nextApptError) {
                    console.error("Error creating next appointment:", nextApptError);
                    toast.warning("Pós-consulta registrada, mas houve erro ao criar retorno");
                }
            }

            // Create post-procedure recall if procedure was performed
            // Note: post-consultation recall is created automatically via database trigger
            if (values.status === "completed" && values.procedure_performed && values.procedure_performed.trim()) {
                const { error: recallError } = await supabase.rpc(
                    'create_post_procedure_recall',
                    {
                        p_phone: appointment.phone,
                        p_appointment_id: Number(appointment.id),
                        p_procedure_name: values.procedure_performed
                    }
                );
                
                if (recallError) {
                    console.error('Error creating post-procedure recall:', recallError);
                    // Don't throw - recall failure shouldn't block the main flow
                }
            }

            return values;
        },
        onSuccess: (values) => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            const statusLabel = {
                completed: "concluída",
                no_show: "registrada como falta",
                rescheduled: "reagendada",
            }[values.status];
            toast.success(`Consulta ${statusLabel} com sucesso!`);
            form.reset();
            onOpenChange(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Erro ao registrar pós-consulta");
        },
    });

    const onSubmit = (values: PostAppointmentFormValues) => {
        postAppointmentMutation.mutate(values);
    };

    if (!appointment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Registrar Pós-Consulta</DialogTitle>
                    <DialogDescription>
                        Registre as informações após a consulta de{" "}
                        {format(parseLocalDate(appointment.appointment_date), "PPP", { locale: ptBR })} às{" "}
                        {appointment.appointment_time}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Status */}
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status da Consulta *</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setAttendanceStatus(value);
                                        }}
                                        defaultValue={field.value}
                                        disabled={postAppointmentMutation.isPending}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="completed">✅ Paciente compareceu</SelectItem>
                                            <SelectItem value="no_show">❌ Paciente faltou (no-show)</SelectItem>
                                            <SelectItem value="rescheduled">⏰ Reagendou</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Fields if patient attended */}
                        {attendanceStatus === "completed" && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="procedure_performed"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Procedimento Realizado</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Descreva o procedimento realizado..."
                                                    className="resize-none"
                                                    {...field}
                                                    disabled={postAppointmentMutation.isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="next_steps"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Próximos Passos / Orientações</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Orientações para o paciente, próximos passos..."
                                                    className="resize-none"
                                                    {...field}
                                                    disabled={postAppointmentMutation.isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="amount_charged"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Valor Cobrado (R$)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="0,00"
                                                        {...field}
                                                        disabled={postAppointmentMutation.isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="payment_method"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Forma de Pagamento</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    disabled={postAppointmentMutation.isPending}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="pix">Pix</SelectItem>
                                                        <SelectItem value="credit">Cartão de Crédito</SelectItem>
                                                        <SelectItem value="debit">Cartão de Débito</SelectItem>
                                                        <SelectItem value="cash">Dinheiro</SelectItem>
                                                        <SelectItem value="transfer">Transferência</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="next_appointment_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Data do Próximo Retorno (opcional)</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full justify-start text-left font-normal"
                                                            disabled={postAppointmentMutation.isPending}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value
                                                                ? format(field.value, "PPP", { locale: ptBR })
                                                                : "Selecione uma data"}
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date < new Date(new Date().setHours(0, 0, 0, 0))
                                                        }
                                                        initialFocus
                                                        locale={ptBR}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormDescription>
                                                Se houver retorno, um novo agendamento será criado automaticamente
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {/* Fields if patient didn't attend */}
                        {attendanceStatus === "no_show" && (
                            <FormField
                                control={form.control}
                                name="no_show_reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Motivo da Falta (opcional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Se souber o motivo, descreva aqui..."
                                                className="resize-none"
                                                {...field}
                                                disabled={postAppointmentMutation.isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                disabled={postAppointmentMutation.isPending}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={postAppointmentMutation.isPending}>
                                {postAppointmentMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    "Salvar Registro"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

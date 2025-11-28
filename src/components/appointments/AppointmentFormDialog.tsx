import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
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

const appointmentFormSchema = z.object({
    phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
    appointment_date: z.date({ required_error: "Selecione uma data" }),
    appointment_time: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
    doctor_id: z.string().min(1, "Selecione um médico"),
    procedure: z.string().min(3, "Procedimento deve ter pelo menos 3 caracteres"),
    notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface AppointmentFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultDate?: Date | null;
}

export function AppointmentFormDialog({
    open,
    onOpenChange,
    defaultDate,
}: AppointmentFormDialogProps) {
    const queryClient = useQueryClient();
    const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

    // Fetch doctors
    const { data: doctors } = useQuery({
        queryKey: ["doctors"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("doctors")
                .select("*")
                .order("name");
            if (error) throw error;
            return data;
        },
    });

    const form = useForm<AppointmentFormValues>({
        resolver: zodResolver(appointmentFormSchema),
        defaultValues: {
            phone: "",
            appointment_time: "",
            procedure: "",
            notes: "",
        },
    });

    // Set default date when dialog opens with a pre-selected date from calendar
    useEffect(() => {
        if (open && defaultDate) {
            form.setValue("appointment_date", defaultDate);
        }
    }, [open, defaultDate, form]);

    // Generate time slots (8:00 - 18:00, 30min intervals)
    const timeSlots = [];
    for (let hour = 8; hour < 18; hour++) {
        timeSlots.push(`${hour.toString().padStart(2, "0")}:00`);
        timeSlots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    timeSlots.push("18:00");

    const createAppointmentMutation = useMutation({
        mutationFn: async (values: AppointmentFormValues) => {
            // Format date to YYYY-MM-DD
            const dateStr = format(values.appointment_date, "yyyy-MM-dd");

            // Check for conflicts
            setIsCheckingConflicts(true);
            const { data: existingAppointments, error: checkError } = await supabase
                .from("appointments")
                .select("*")
                .eq("appointment_date", dateStr)
                .eq("appointment_time", values.appointment_time)
                .eq("doctor_id", parseInt(values.doctor_id))
                .in("status", ["pendente_confirmacao", "confirmada_paciente"]);

            setIsCheckingConflicts(false);

            if (checkError) throw checkError;

            if (existingAppointments && existingAppointments.length > 0) {
                throw new Error(
                    `Conflito de horário! Já existe um agendamento para ${values.appointment_time} nesta data.`
                );
            }

            // Create appointment in database (status: pendente_confirmacao)
            const appointmentData = {
                phone: values.phone,
                appointment_date: dateStr,
                appointment_time: values.appointment_time,
                doctor_id: parseInt(values.doctor_id),
                procedure: values.procedure,
                status: "pendente_confirmacao",
                notes: values.notes || null,
            };

            const { data: appointment, error: insertError } = await supabase
                .from("appointments")
                .insert([appointmentData])
                .select()
                .single();

            if (insertError) throw insertError;

            // Call edge function to sync with Google Calendar
            try {
                const { error: calendarError } = await supabase.functions.invoke(
                    "sync-google-calendar",
                    {
                        body: {
                            action: "create",
                            appointment: {
                                ...appointment,
                                doctor_name: doctors?.find((d) => d.id === parseInt(values.doctor_id))?.name,
                            },
                        },
                    }
                );

                if (calendarError) {
                    console.error("Error syncing with Google Calendar:", calendarError);
                    toast.warning(
                        "Agendamento criado, mas houve problema ao sincronizar com Google Calendar"
                    );
                }
            } catch (error) {
                console.error("Error calling Google Calendar function:", error);
            }

            // Call edge function to sync with Google Sheets
            try {
                // Fetch patient name from clientes table
                const { data: cliente } = await supabase
                    .from("clientes")
                    .select("name")
                    .eq("phone", values.phone)
                    .single();

                const patientName = cliente?.name || values.phone;

                const { error: sheetsError } = await supabase.functions.invoke(
                    "sync-to-sheets",
                    {
                        body: {
                            date: dateStr,
                            time: values.appointment_time,
                            patient_name: patientName,
                            procedure: values.procedure,
                            amount_paid: "",
                            status: "confirmada",
                        },
                    }
                );

                if (sheetsError) {
                    console.error("Error syncing with Google Sheets:", sheetsError);
                    toast.warning(
                        "Agendamento criado, mas houve problema ao sincronizar com Google Sheets"
                    );
                }
            } catch (error) {
                console.error("Error calling Google Sheets function:", error);
            }

            return appointment;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            toast.success("Agendamento criado com sucesso!");
            form.reset();
            onOpenChange(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Erro ao criar agendamento");
        },
    });

    const onSubmit = (values: AppointmentFormValues) => {
        createAppointmentMutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Novo Agendamento</DialogTitle>
                    <DialogDescription>
                        Crie um novo agendamento para um paciente. Todos os campos são obrigatórios.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Phone */}
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefone do Paciente</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="14997123456"
                                            {...field}
                                            disabled={createAppointmentMutation.isPending}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Número com DDD (apenas números)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Date */}
                        <FormField
                            control={form.control}
                            name="appointment_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Data</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start text-left font-normal"
                                                    disabled={createAppointmentMutation.isPending}
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
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Time and Doctor (side by side) */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="appointment_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Horário</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={createAppointmentMutation.isPending}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {timeSlots.map((time) => (
                                                    <SelectItem key={time} value={time}>
                                                        {time}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="doctor_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Médico</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={createAppointmentMutation.isPending}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {doctors?.map((doctor) => (
                                                    <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                                        {doctor.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Procedure */}
                        <FormField
                            control={form.control}
                            name="procedure"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Procedimento</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: Consulta dermatológica, Laser capilar..."
                                            {...field}
                                            disabled={createAppointmentMutation.isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Notes */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas (opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Observações internas sobre o agendamento..."
                                            className="resize-none"
                                            {...field}
                                            disabled={createAppointmentMutation.isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                disabled={createAppointmentMutation.isPending}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={createAppointmentMutation.isPending || isCheckingConflicts}
                            >
                                {createAppointmentMutation.isPending || isCheckingConflicts ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isCheckingConflicts
                                            ? "Verificando conflitos..."
                                            : "Criando..."}
                                    </>
                                ) : (
                                    "Criar Agendamento"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

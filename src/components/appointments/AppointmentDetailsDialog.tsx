import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PostAppointmentDialog } from "./PostAppointmentDialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Calendar,
    Clock,
    User,
    Phone,
    FileText,
    CheckCircle2,
    XCircle,
    Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Helper to parse date-only strings as local dates to avoid timezone issues
const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
};

interface Appointment {
    id: string | number;
    phone: string;
    appointment_date: string;
    appointment_time: string;
    procedure: string;
    status: string;
    notes?: string;
    doctors?: {
        id: string;
        name: string;
    };
}

interface AppointmentDetailsDialogProps {
    appointment: Appointment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<string, string> = {
    pendente_confirmacao: "Pendente",
    confirmada_paciente: "Confirmada",
    cancelada_paciente: "Cancelada",
    completed: "Completada",
};

const statusColors: Record<string, string> = {
    pendente_confirmacao: "bg-yellow-100 text-yellow-800",
    confirmada_paciente: "bg-green-100 text-green-800",
    cancelada_paciente: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
};

export function AppointmentDetailsDialog({
    appointment,
    open,
    onOpenChange,
}: AppointmentDetailsDialogProps) {
    const queryClient = useQueryClient();
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showPostAppointment, setShowPostAppointment] = useState(false);

    const cancelMutation = useMutation({
        mutationFn: async (appointmentId: string | number) => {
            const { error } = await supabase
                .from("appointments")
                .update({ status: "cancelada_paciente" })
                .eq("id", Number(appointmentId));

            if (error) throw error;

            // Sync with Google Sheets
            if (appointment) {
                try {
                    await supabase.functions.invoke("update-sheets-status", {
                        body: {
                            phone: appointment.phone,
                            appointmentDate: appointment.appointment_date,
                            appointmentTime: appointment.appointment_time,
                            status: "cancelada_paciente",
                        },
                    });
                } catch (error) {
                    console.error("Error syncing with Sheets:", error);
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            toast.success("Agendamento cancelado");
            setShowCancelDialog(false);
            onOpenChange(false);
        },
        onError: () => {
            toast.error("Erro ao cancelar agendamento");
        },
    });

    const confirmMutation = useMutation({
        mutationFn: async (appointmentId: string | number) => {
            const { error } = await supabase
                .from("appointments")
                .update({ status: "confirmada_paciente" })
                .eq("id", Number(appointmentId));

            if (error) throw error;

            // Sync with Google Sheets
            if (appointment) {
                try {
                    await supabase.functions.invoke("update-sheets-status", {
                        body: {
                            phone: appointment.phone,
                            appointmentDate: appointment.appointment_date,
                            appointmentTime: appointment.appointment_time,
                            status: "confirmada_paciente",
                        },
                    });
                } catch (error) {
                    console.error("Error syncing with Sheets:", error);
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            toast.success("Agendamento confirmado");
            setShowConfirmDialog(false);
            onOpenChange(false);
        },
        onError: () => {
            toast.error("Erro ao confirmar agendamento");
        },
    });

    const completeMutation = useMutation({
        mutationFn: async (appointmentId: string | number) => {
            const { error } = await supabase
                .from("appointments")
                .update({ status: "completed" })
                .eq("id", Number(appointmentId));

            if (error) throw error;

            // Sync with Google Sheets
            if (appointment) {
                try {
                    await supabase.functions.invoke("update-sheets-status", {
                        body: {
                            phone: appointment.phone,
                            appointmentDate: appointment.appointment_date,
                            appointmentTime: appointment.appointment_time,
                            status: "completed",
                        },
                    });
                } catch (error) {
                    console.error("Error syncing with Sheets:", error);
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            toast.success("Consulta marcada como completada! Recall pós-consulta ativado.");
            onOpenChange(false);
        },
        onError: () => {
            toast.error("Erro ao marcar consulta como completada");
        },
    });

    if (!appointment) return null;

    const canConfirm = appointment.status === "pendente_confirmacao";
    const canCancel =
        appointment.status === "pendente_confirmacao" ||
        appointment.status === "confirmada_paciente";
    const canComplete = appointment.status === "confirmada_paciente";

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Agendamento</DialogTitle>
                        <DialogDescription>
                            Informações completas sobre este agendamento
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Status */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Status:</span>
                            <Badge className={statusColors[appointment.status]}>
                                {statusLabels[appointment.status]}
                            </Badge>
                        </div>

                        <Separator />

                        {/* Date and Time */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Data:</span>
                                <span>
                                    {format(parseLocalDate(appointment.appointment_date), "PPP", {
                                        locale: ptBR,
                                    })}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Horário:</span>
                                <span>{appointment.appointment_time}</span>
                            </div>
                        </div>

                        <Separator />

                        {/* Doctor */}
                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Médico:</span>
                            <span>{appointment.doctors?.name || "Não definido"}</span>
                        </div>

                        {/* Phone */}
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Telefone:</span>
                            <span>{appointment.phone}</span>
                        </div>

                        {/* Procedure */}
                        <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Procedimento:</span>
                            <span>{appointment.procedure}</span>
                        </div>

                        {/* Notes */}
                        {appointment.notes && (
                            <>
                                <Separator />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Notas:</p>
                                    <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="flex gap-2 sm:justify-between">
                        <div className="flex gap-2 flex-wrap">
                            {canConfirm && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => setShowConfirmDialog(true)}
                                    disabled={confirmMutation.isPending}
                                >
                                    {confirmMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                    )}
                                    Confirmar
                                </Button>
                            )}
                            {canComplete && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => completeMutation.mutate(appointment.id)}
                                    disabled={completeMutation.isPending}
                                >
                                    {completeMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                    )}
                                    Marcar Completada
                                </Button>
                            )}
                            {canCancel && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setShowCancelDialog(true)}
                                    disabled={cancelMutation.isPending}
                                >
                                    {cancelMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <XCircle className="h-4 w-4 mr-2" />
                                    )}
                                    Cancelar
                                </Button>
                            )}
                            {(appointment.status === "confirmada_paciente" ||
                                appointment.status === "pendente_confirmacao") && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            onOpenChange(false);
                                            setShowPostAppointment(true);
                                        }}
                                    >
                                        📋 Pós-Consulta
                                    </Button>
                                )}
                        </div>
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja cancelar este agendamento? Esta ação atualizará o
                            status para "Cancelada" e sincronizará com o Google Sheets.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Não, manter agendamento</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => cancelMutation.mutate(appointment.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Sim, cancelar agendamento
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Confirm Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Agendamento</AlertDialogTitle>
                        <AlertDialogDescription>
                            Confirmar que o paciente comparecerá à consulta? Esta ação atualizará o
                            status para "Confirmada" e sincronizará com o Google Sheets.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => confirmMutation.mutate(appointment.id)}>
                            Confirmar agendamento
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Post Appointment Dialog */}
            <PostAppointmentDialog
                appointment={appointment}
                open={showPostAppointment}
                onOpenChange={setShowPostAppointment}
            />
        </>
    );
}

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, List, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentFilters } from "@/components/appointments/AppointmentFilters";
import { AppointmentFormDialog } from "@/components/appointments/AppointmentFormDialog";
import { AppointmentDetailsDialog } from "@/components/appointments/AppointmentDetailsDialog";
import { AppointmentCalendar } from "@/components/appointments/AppointmentCalendar";
import { UnavailabilityDialog } from "@/components/appointments/UnavailabilityDialog";

// Helper to parse date-only strings as local dates to avoid timezone issues
const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
};

export default function Appointments() {
    const [view, setView] = useState<"calendar" | "list">("list");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isUnavailabilityOpen, setIsUnavailabilityOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [newAppointmentDate, setNewAppointmentDate] = useState<Date | null>(null);
    const [filters, setFilters] = useState({
        search: "",
        doctor: "all",
        status: "all",
        dateFrom: undefined as Date | undefined,
        dateTo: undefined as Date | undefined,
    });

    // Fetch appointments
    const { data: appointments, isLoading } = useQuery({
        queryKey: ["appointments"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("appointments")
                .select(`
          *,
          doctors (
            id,
            name
          )
        `)
                .order("appointment_date", { ascending: true })
                .order("appointment_time", { ascending: true });

            if (error) throw error;
            return data;
        },
    });

    // Apply filters
    const filteredAppointments = useMemo(() => {
        if (!appointments) return [];

        return appointments.filter((apt: any) => {
            // Search filter (nome ou telefone)
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchesPhone = apt.phone?.toLowerCase().includes(searchLower);
                const matchesNotes = apt.notes?.toLowerCase().includes(searchLower);
                if (!matchesPhone && !matchesNotes) return false;
            }

            // Doctor filter
            if (filters.doctor !== "all") {
                const doctorName = apt.doctors?.name?.toLowerCase() || "";
                if (!doctorName.includes(filters.doctor.toLowerCase())) return false;
            }

            // Status filter
            if (filters.status !== "all") {
                if (apt.status !== filters.status) return false;
            }

            // Date range filter
            if (filters.dateFrom || filters.dateTo) {
                const aptDate = parseLocalDate(apt.appointment_date);
                if (filters.dateFrom && aptDate < filters.dateFrom) return false;
                if (filters.dateTo && aptDate > filters.dateTo) return false;
            }

            return true;
        });
    }, [appointments, filters]);

    // Calendar handlers
    const handleSelectEvent = (appointment: any) => {
        setSelectedAppointment(appointment);
    };

    const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
        setNewAppointmentDate(slotInfo.start);
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
                    <p className="text-muted-foreground">
                        Gerencie os agendamentos da clínica
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsUnavailabilityOpen(true)}>
                        <Clock className="mr-2 h-4 w-4" />
                        Horários Indisponíveis
                    </Button>
                    <Button onClick={() => setIsFormOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Agendamento
                    </Button>
                </div>
            </div>

            <AppointmentFilters onFilterChange={setFilters} />

            <AppointmentFormDialog
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open);
                    if (!open) setNewAppointmentDate(null);
                }}
                defaultDate={newAppointmentDate}
            />

            <UnavailabilityDialog
                open={isUnavailabilityOpen}
                onOpenChange={setIsUnavailabilityOpen}
            />

            <Tabs value={view} onValueChange={(v) => setView(v as "calendar" | "list")}>
                <TabsList>
                    <TabsTrigger value="list">
                        <List className="mr-2 h-4 w-4" />
                        Lista
                    </TabsTrigger>
                    <TabsTrigger value="calendar">
                        <Calendar className="mr-2 h-4 w-4" />
                        Calendário
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lista de Agendamentos</CardTitle>
                            <CardDescription>
                                {filteredAppointments.length} agendamento(s) encontrado(s)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                    <p className="mt-2 text-sm text-muted-foreground">Carregando agendamentos...</p>
                                </div>
                            ) : filteredAppointments.length > 0 ? (
                                <div className="space-y-2">
                                    {filteredAppointments.map((appointment: any) => (
                                        <div
                                            key={appointment.id}
                                            onClick={() => setSelectedAppointment(appointment)}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <p className="font-medium">
                                                            {parseLocalDate(appointment.appointment_date).toLocaleDateString("pt-BR")}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {appointment.appointment_time}
                                                        </p>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium">{appointment.phone}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {appointment.procedure}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {appointment.doctors?.name || "Médico não definido"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${appointment.status === "pendente_confirmacao"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : appointment.status === "confirmada_paciente"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : appointment.status === "cancelada_paciente"
                                                                        ? "bg-red-100 text-red-800"
                                                                        : "bg-blue-100 text-blue-800"
                                                                }`}
                                                        >
                                                            {appointment.status === "pendente_confirmacao"
                                                                ? "Pendente"
                                                                : appointment.status === "confirmada_paciente"
                                                                    ? "Confirmada"
                                                                    : appointment.status === "cancelada_paciente"
                                                                        ? "Cancelada"
                                                                        : "Completada"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Nenhum agendamento encontrado
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="calendar" className="space-y-4">
                    <AppointmentCalendar
                        appointments={filteredAppointments}
                        onSelectEvent={handleSelectEvent}
                        onSelectSlot={handleSelectSlot}
                    />
                </TabsContent>
            </Tabs>

            <AppointmentDetailsDialog
                appointment={selectedAppointment}
                open={!!selectedAppointment}
                onOpenChange={(open) => !open && setSelectedAppointment(null)}
            />
        </div>
    );
}

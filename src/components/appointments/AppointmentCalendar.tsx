import { useCallback, useMemo, useState } from "react";
import { Calendar as BigCalendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "moment/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar-custom.css";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { statusColors, doctorColors, statusLabels } from "@/theme/calendarColors";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Configure moment para português
moment.locale("pt-br");
const localizer = momentLocalizer(moment);

interface Appointment {
    id: string | number;
    phone: string;
    appointment_date: string;
    appointment_time: string;
    procedure: string;
    status: string;
    notes?: string;
    doctors?: {
        id: string | number;
        name: string;
    };
}

interface CalendarEvent {
    id: string | number;
    title: string;
    start: Date;
    end: Date;
    resource: Appointment | { type: 'unavailability'; data: any };
}

interface AppointmentCalendarProps {
    appointments: Appointment[];
    onSelectEvent: (appointment: Appointment) => void;
    onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
}



export function AppointmentCalendar({
    appointments,
    onSelectEvent,
    onSelectSlot,
}: AppointmentCalendarProps) {
    const [view, setView] = useState<View>(Views.WEEK);
    const [date, setDate] = useState(new Date());

    // Fetch unavailability periods
    const { data: unavailabilityPeriods } = useQuery({
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

    // Convert appointments to calendar events
    const events: CalendarEvent[] = useMemo(() => {
        const appointmentEvents = appointments.map((apt) => {
            const [hours, minutes] = apt.appointment_time.split(":").map(Number);
            // Parse date string as local date to avoid timezone issues
            // Input format: "YYYY-MM-DD"
            const [year, month, day] = apt.appointment_date.split("-").map(Number);
            const startDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

            const endDate = new Date(startDate);
            endDate.setHours(hours + 1, minutes, 0, 0);

            const label = statusLabels[apt.status] || "";
            const title = `${label}${apt.appointment_time} - ${apt.procedure}`;

            return {
                id: apt.id,
                title,
                start: startDate,
                end: endDate,
                resource: apt,
            };
        });

        // Add unavailability periods as events
        const unavailabilityEvents = (unavailabilityPeriods || []).map((period: any) => ({
            id: `unavailable-${period.id}`,
            title: `🚫 Indisponível${period.doctors ? ` - ${period.doctors.name}` : ''}${period.reason ? `: ${period.reason}` : ''}`,
            start: new Date(period.start_datetime),
            end: new Date(period.end_datetime),
            resource: { type: 'unavailability' as const, data: period },
        }));

        return [...appointmentEvents, ...unavailabilityEvents];
    }, [appointments, unavailabilityPeriods]);

    // Event style with status background and doctor left border
    const eventStyleGetter = useCallback((event: CalendarEvent) => {
        // Check if it's an unavailability period
        if (typeof event.resource === 'object' && 'type' in event.resource && event.resource.type === 'unavailability') {
            return {
                style: {
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    border: '2px solid #ef4444',
                    borderRadius: "4px",
                    padding: "4px 6px",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    cursor: "default",
                    lineHeight: "1.4",
                    marginBottom: "2px",
                    opacity: 0.9,
                    textDecoration: 'none',
                },
            };
        }

        const appointment = event.resource as Appointment;
        const statusColor = statusColors[appointment.status] || statusColors.pendente_confirmacao;
        const doctorName = appointment.doctors?.name || "";
        const doctorColor = doctorColors[doctorName];

        return {
            style: {
                backgroundColor: statusColor.bg,
                color: statusColor.text,
                border: `1px solid ${statusColor.border}`,
                borderLeft: doctorColor ? `4px solid ${doctorColor.border}` : `1px solid ${statusColor.border}`,
                borderRadius: "4px",
                padding: "4px 6px",
                fontSize: "0.95rem",
                fontWeight: "500",
                cursor: "pointer",
                lineHeight: "1.4",
                marginBottom: "2px",
            },
        };
    }, []);

    // Handle event selection
    const handleSelectEvent = useCallback(
        (event: CalendarEvent) => {
            // Don't allow selecting unavailability events
            if (typeof event.resource === 'object' && 'type' in event.resource && event.resource.type === 'unavailability') {
                return;
            }
            onSelectEvent(event.resource as Appointment);
        },
        [onSelectEvent]
    );

    // Handle slot selection (clicking on empty space)
    const handleSelectSlot = useCallback(
        (slotInfo: { start: Date; end: Date; action: string }) => {
            if (slotInfo.action === "click" || slotInfo.action === "select") {
                onSelectSlot(slotInfo);
            }
        },
        [onSelectSlot]
    );

    // Navigation handlers
    const onNavigate = useCallback((newDate: Date) => {
        setDate(newDate);
    }, []);

    const onViewChange = useCallback((newView: View) => {
        setView(newView);
    }, []);

    // Custom toolbar
    const CustomToolbar = (toolbar: any) => {
        const goToBack = () => {
            toolbar.onNavigate("PREV");
        };

        const goToNext = () => {
            toolbar.onNavigate("NEXT");
        };

        const goToToday = () => {
            toolbar.onNavigate("TODAY");
        };

        const label = () => {
            const date = moment(toolbar.date);
            return (
                <span className="text-lg font-semibold">
                    {view === Views.MONTH && date.format("MMMM YYYY")}
                    {view === Views.WEEK && `Semana de ${date.format("D MMM YYYY")}`}
                    {view === Views.DAY && date.format("D [de] MMMM [de] YYYY")}
                </span>
            );
        };

        return (
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToBack}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Hoje
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 text-center">{label()}</div>

                <div className="flex gap-2">
                    <Button
                        variant={view === Views.MONTH ? "default" : "outline"}
                        size="sm"
                        onClick={() => toolbar.onView(Views.MONTH)}
                    >
                        Mês
                    </Button>
                    <Button
                        variant={view === Views.WEEK ? "default" : "outline"}
                        size="sm"
                        onClick={() => toolbar.onView(Views.WEEK)}
                    >
                        Semana
                    </Button>
                    <Button
                        variant={view === Views.DAY ? "default" : "outline"}
                        size="sm"
                        onClick={() => toolbar.onView(Views.DAY)}
                    >
                        Dia
                    </Button>
                </div>
            </div>
        );
    };

    // Messages in Portuguese
    const messages = {
        allDay: "Dia inteiro",
        previous: "Anterior",
        next: "Próximo",
        today: "Hoje",
        month: "Mês",
        week: "Semana",
        day: "Dia",
        agenda: "Agenda",
        date: "Data",
        time: "Hora",
        event: "Evento",
        noEventsInRange: "Não há agendamentos neste período.",
        showMore: (total: number) => `+ ${total} mais`,
    };

    return (
        <div className="h-[700px] bg-white p-4 rounded-lg border">
            <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={onViewChange}
                date={date}
                onNavigate={onNavigate}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable
                eventPropGetter={eventStyleGetter}
                messages={messages}
                components={{
                    toolbar: CustomToolbar,
                }}
                step={30}
                timeslots={2}
                min={new Date(2024, 0, 1, 7, 0, 0)} // 7:00 AM
                max={new Date(2024, 0, 1, 21, 0, 0)} // 9:00 PM
                formats={{
                    dayFormat: (date, culture, localizer) =>
                        localizer?.format(date, "ddd DD/MM", culture) || "",
                    dayHeaderFormat: (date, culture, localizer) =>
                        localizer?.format(date, "dddd, D [de] MMMM", culture) || "",
                    dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
                        `${localizer?.format(start, "D MMM", culture)} - ${localizer?.format(end, "D MMM YYYY", culture)}`,
                    monthHeaderFormat: (date, culture, localizer) =>
                        localizer?.format(date, "MMMM YYYY", culture) || "",
                    weekdayFormat: (date, culture, localizer) =>
                        localizer?.format(date, "ddd", culture) || "",
                }}
            />



            {/* Legend - Estilo Google Calendar minimalista */}
            <div className="mt-4 pt-4 border-t">
                <div className="flex flex-wrap gap-8">
                    <div>
                        <p className="text-sm font-medium mb-3 text-gray-700">Status:</p>
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(statusColors).map(([key, style]) => (
                                <div
                                    key={key}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded"
                                    style={{ backgroundColor: style.bg, color: style.text }}
                                >
                                    <span className="text-sm font-medium">{statusLabels[key] || ""}{key.replace(/_/g, " ")}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium mb-3 text-gray-700">Médicos:</p>
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(doctorColors).map(([name, style]) => (
                                <div key={name} className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: style.border }}></div>
                                    <span className="text-sm">{style.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700 text-center">
                        💡 <strong>Dica:</strong> A <strong>cor de fundo</strong> indica o status e o <strong>prefixo</strong> (ex.: [P], [C]) reforça a informação para quem tem dificuldade de visão.
                    </p>
                </div>
            </div>
        </div>
    );
}

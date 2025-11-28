import { useState } from "react";
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Search, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AppointmentFiltersProps {
    onFilterChange: (filters: {
        search: string;
        doctor: string;
        status: string;
        dateFrom: Date | undefined;
        dateTo: Date | undefined;
    }) => void;
}

export function AppointmentFilters({ onFilterChange }: AppointmentFiltersProps) {
    const [search, setSearch] = useState("");
    const [doctor, setDoctor] = useState("all");
    const [status, setStatus] = useState("all");
    const [dateFrom, setDateFrom] = useState<Date | undefined>();
    const [dateTo, setDateTo] = useState<Date | undefined>();

    const handleFilterChange = (field: string, value: any) => {
        const newFilters = {
            search,
            doctor,
            status,
            dateFrom,
            dateTo,
            [field]: value,
        };

        // Update local state
        switch (field) {
            case "search":
                setSearch(value);
                break;
            case "doctor":
                setDoctor(value);
                break;
            case "status":
                setStatus(value);
                break;
            case "dateFrom":
                setDateFrom(value);
                break;
            case "dateTo":
                setDateTo(value);
                break;
        }

        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        setSearch("");
        setDoctor("all");
        setStatus("all");
        setDateFrom(undefined);
        setDateTo(undefined);
        onFilterChange({
            search: "",
            doctor: "all",
            status: "all",
            dateFrom: undefined,
            dateTo: undefined,
        });
    };

    const hasActiveFilters =
        search !== "" ||
        doctor !== "all" ||
        status !== "all" ||
        dateFrom !== undefined ||
        dateTo !== undefined;

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-card">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Filtros</h3>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-2" />
                        Limpar filtros
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Busca por nome/telefone */}
                <div className="lg:col-span-2">
                    <Label htmlFor="search">Buscar</Label>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="search"
                            placeholder="Nome ou telefone..."
                            value={search}
                            onChange={(e) => handleFilterChange("search", e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                {/* Filtro por médico */}
                <div>
                    <Label htmlFor="doctor">Médico</Label>
                    <Select value={doctor} onValueChange={(value) => handleFilterChange("doctor", value)}>
                        <SelectTrigger id="doctor">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="gabriel">Dr. Gabriel</SelectItem>
                            <SelectItem value="romulo">Dr. Rômulo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Filtro por status */}
                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={(value) => handleFilterChange("status", value)}>
                        <SelectTrigger id="status">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="pendente_confirmacao">Pendente</SelectItem>
                            <SelectItem value="confirmada_paciente">Confirmada</SelectItem>
                            <SelectItem value="cancelada_paciente">Cancelada</SelectItem>
                            <SelectItem value="completed">Completada</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Filtro por data */}
                <div>
                    <Label>Período</Label>
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateFrom ? format(dateFrom, "dd/MM/yy", { locale: ptBR }) : "De"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={dateFrom}
                                    onSelect={(date) => handleFilterChange("dateFrom", date)}
                                    initialFocus
                                    locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateTo ? format(dateTo, "dd/MM/yy", { locale: ptBR }) : "Até"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={dateTo}
                                    onSelect={(date) => handleFilterChange("dateTo", date)}
                                    initialFocus
                                    locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Centralised colour definitions for the appointment calendar

export const statusColors: Record<string, { bg: string; border: string; text: string }> = {
    pendente_confirmacao: {
        bg: "#fb923c", // darker orange for better contrast
        border: "#f97316",
        text: "#ffffff",
    },
    confirmada_paciente: {
        bg: "#10b981", // emerald
        border: "#059669",
        text: "#ffffff",
    },
    cancelada_paciente: {
        bg: "#ef4444", // red
        border: "#dc2626",
        text: "#ffffff",
    },
    completed: {
        bg: "#3b82f6", // blue
        border: "#2563eb",
        text: "#ffffff",
    },
};

export const doctorColors: Record<string, { border: string; name: string }> = {
    "Dr. Gabriel": { border: "#1e40af", name: "👨‍⚕️ Dr. Gabriel" },
    "Dr. Rômulo": { border: "#7c3aed", name: "👨‍⚕️ Dr. Rômulo" },
};

// Optional: status label prefixes for accessibility (color‑blind support)
export const statusLabels: Record<string, string> = {
    pendente_confirmacao: "[P] ",
    confirmada_paciente: "[C] ",
    cancelada_paciente: "[X] ",
    completed: "[✓] ",
};

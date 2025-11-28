import { useState } from "react";
import PipelineStats from "@/components/pipeline/PipelineStats";
import PipelineFilters from "@/components/pipeline/PipelineFilters";
import PipelineKanban from "@/components/pipeline/PipelineKanban";

const Pipeline = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [treatmentFilter, setTreatmentFilter] = useState("all");

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pipeline CRM</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus leads visualmente através do funil de vendas
          </p>
        </div>

        {/* Stats Cards */}
        <PipelineStats />

        {/* Filters */}
        <PipelineFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          treatmentFilter={treatmentFilter}
          setTreatmentFilter={setTreatmentFilter}
        />

        {/* Kanban Board */}
        <PipelineKanban
          searchTerm={searchTerm}
          paymentFilter={paymentFilter}
          treatmentFilter={treatmentFilter}
        />
      </div>
    </div>
  );
};

export default Pipeline;

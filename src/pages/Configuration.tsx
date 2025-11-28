import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Settings, Save, RotateCcw, BookOpen, Code } from "lucide-react";
import DocumentationTab from "./DocumentationTab";
import UserDocumentationTab from "./UserDocumentationTab";

interface SystemConfig {
  id: number;
  additional_notes?: string;
  ai_model: string;
  ai_temperature: number;
  max_tokens: number;
  buffer_time_seconds: number;
  batch_size_limit: number;
  buffer_enabled: boolean;
  handoff_notification_number: string;
  handoff_timeout_hours: number;
  handoff_keywords: string[];
  test_mode: boolean;
  test_numbers: string[];
  tools_enabled: {
    log_interest: boolean;
    update_client: boolean;
    handoff_to_human: boolean;
    schedule_appointment: boolean;
  };
}

const Configuration = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "settings";
  const [formData, setFormData] = useState<Partial<SystemConfig>>({});
  const [isEditing, setIsEditing] = useState(false);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Fetch system configuration
  const { data: config, isLoading, error } = useQuery({
    queryKey: ["system-configuration"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_configuration")
        .select("*")
        .single();

      if (error) throw error;
      return {
        ...data,
        tools_enabled: data.tools_enabled as {
          log_interest: boolean;
          update_client: boolean;
          handoff_to_human: boolean;
          schedule_appointment: boolean;
        }
      } as SystemConfig;
    },
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (updatedConfig: Partial<SystemConfig>) => {
      const { data, error } = await supabase.functions.invoke('update-configuration', {
        body: updatedConfig
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-configuration"] });
      toast.success("Configuração atualizada com sucesso!");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const handleSave = () => {
    updateConfigMutation.mutate(formData);
  };

  const handleReset = () => {
    if (config) {
      setFormData(config);
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-destructive">Erro ao carregar configurações</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Configuração do Sistema</h1>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="documentation">
              <BookOpen className="h-4 w-4 mr-2" />
              Documentação
            </TabsTrigger>
            <TabsTrigger value="dev-docs">
              <Code className="h-4 w-4 mr-2" />
              Doc Dev
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6 mt-6">
          {/* Observações Personalizadas */}
          <Card>
            <CardHeader>
              <CardTitle>Observações Personalizadas</CardTitle>
              <CardDescription>
                Adicione contexto ou instruções adicionais para personalizar o comportamento da IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="additional-notes">Observações Adicionais</Label>
                <Textarea
                  id="additional-notes"
                  value={formData.additional_notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, additional_notes: e.target.value })
                  }
                  disabled={!isEditing}
                  rows={8}
                  className="mt-2"
                  placeholder="Digite instruções ou contexto adicional que serão incluídos nas conversas..."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Essas observações são combinadas com o prompt base da IA
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Model Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Modelo de IA</CardTitle>
              <CardDescription>
                Configurações do modelo de linguagem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ai-model">Modelo</Label>
                  <Input
                    id="ai-model"
                    value={formData.ai_model || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, ai_model: e.target.value })
                    }
                    disabled={!isEditing}
                    className="mt-2"
                    placeholder="ex: gpt-4-turbo-preview"
                  />
                </div>

                <div>
                  <Label htmlFor="max-tokens">Máximo de Tokens</Label>
                  <Input
                    id="max-tokens"
                    type="number"
                    value={formData.max_tokens || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_tokens: parseInt(e.target.value),
                      })
                    }
                    disabled={!isEditing}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="temperature">
                  Temperatura: {formData.ai_temperature?.toFixed(2) || 0}
                </Label>
                <Slider
                  id="temperature"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[formData.ai_temperature || 0.7]}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ai_temperature: value[0] })
                  }
                  disabled={!isEditing}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Controla a criatividade das respostas (0 = determinístico, 1 = aleatório)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Buffer Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Buffer</CardTitle>
              <CardDescription>
                Gerenciamento de fila de mensagens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buffer-time">Tempo de Buffer (segundos)</Label>
                  <Input
                    id="buffer-time"
                    type="number"
                    value={formData.buffer_time_seconds || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        buffer_time_seconds: parseInt(e.target.value),
                      })
                    }
                    disabled={!isEditing}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="batch-size">Tamanho do Lote</Label>
                  <Input
                    id="batch-size"
                    type="number"
                    value={formData.batch_size_limit || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        batch_size_limit: parseInt(e.target.value),
                      })
                    }
                    disabled={!isEditing}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="buffer-enabled"
                  checked={formData.buffer_enabled || false}
                  onChange={(e) =>
                    setFormData({ ...formData, buffer_enabled: e.target.checked })
                  }
                  disabled={!isEditing}
                  className="rounded"
                />
                <Label htmlFor="buffer-enabled" className="cursor-pointer">
                  Buffer Habilitado
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Handoff Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Handoff</CardTitle>
              <CardDescription>
                Gerenciamento de transferência para atendimento humano
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="handoff-number">Número de Notificação de Handoff</Label>
                <Input
                  id="handoff-number"
                  value={formData.handoff_notification_number || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      handoff_notification_number: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="mt-2"
                  placeholder="ex: 5511999999999"
                />
              </div>

              <div>
                <Label htmlFor="handoff-timeout">Timeout de Handoff (horas)</Label>
                <Input
                  id="handoff-timeout"
                  type="number"
                  value={formData.handoff_timeout_hours || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      handoff_timeout_hours: parseInt(e.target.value),
                    })
                  }
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="handoff-keywords">Palavras-chave de Handoff</Label>
                <Textarea
                  id="handoff-keywords"
                  value={
                    formData.handoff_keywords
                      ? formData.handoff_keywords.join(", ")
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      handoff_keywords: e.target.value
                        .split(",")
                        .map((k) => k.trim()),
                    })
                  }
                  disabled={!isEditing}
                  className="mt-2"
                  placeholder="ex: atendente, humano, pessoa"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tools Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Ferramentas Habilitadas</CardTitle>
              <CardDescription>
                Controle quais ferramentas o Agente pode usar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "log_interest", label: "Registrar Interesse" },
                  { key: "update_client", label: "Atualizar Cliente" },
                  { key: "handoff_to_human", label: "Handoff para Humano" },
                  { key: "schedule_appointment", label: "Agendar Consulta" },
                ].map((tool) => (
                  <div key={tool.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={tool.key}
                      checked={
                        formData.tools_enabled?.[
                          tool.key as keyof SystemConfig["tools_enabled"]
                        ] || false
                      }
                      onChange={(e) => {
                        const defaultTools = {
                          log_interest: false,
                          update_client: false,
                          handoff_to_human: false,
                          schedule_appointment: false,
                        };
                        setFormData({
                          ...formData,
                          tools_enabled: {
                            ...defaultTools,
                            ...formData.tools_enabled,
                            [tool.key]: e.target.checked,
                          },
                        });
                      }}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <Label htmlFor={tool.key} className="cursor-pointer">
                      {tool.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Test Mode */}
          <Card>
            <CardHeader>
              <CardTitle>Modo de Teste</CardTitle>
              <CardDescription>
                Configure números para testes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="test-mode"
                  checked={formData.test_mode || false}
                  onChange={(e) =>
                    setFormData({ ...formData, test_mode: e.target.checked })
                  }
                  disabled={!isEditing}
                  className="rounded"
                />
                <Label htmlFor="test-mode" className="cursor-pointer">
                  Modo de Teste Ativado
                </Label>
              </div>

              {formData.test_mode && (
                <div>
                  <Label htmlFor="test-numbers">Números de Teste</Label>
                  <Textarea
                    id="test-numbers"
                    value={
                      formData.test_numbers ? formData.test_numbers.join(", ") : ""
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        test_numbers: e.target.value
                          .split(",")
                          .map((n) => n.trim()),
                      })
                    }
                    disabled={!isEditing}
                    className="mt-2"
                    placeholder="ex: 5511999999999, 5511888888888"
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={updateConfigMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateConfigMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateConfigMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
          </TabsContent>

          <TabsContent value="documentation">
            <UserDocumentationTab />
          </TabsContent>

          <TabsContent value="dev-docs">
            <DocumentationTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Configuration;

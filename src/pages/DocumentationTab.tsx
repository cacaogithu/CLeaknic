import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Database,
  Server,
  Code,
  Settings,
  FileCode,
  Workflow,
  Shield,
  AlertTriangle,
  Info,
  Zap,
  Globe,
  Bot,
  MessageSquare,
  Calendar,
  Users,
  ArrowRight,
  ChevronRight,
  Terminal,
  Key,
  Webhook,
  CloudCog
} from "lucide-react";

export const DocumentationTab = () => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle className="text-3xl flex items-center gap-3">
        <Code className="h-8 w-8 text-primary" />
        Documentação Técnica do Sistema
      </CardTitle>
      <p className="text-lg text-muted-foreground mt-2">
        Guia técnico completo para desenvolvedores e administradores do sistema
      </p>
    </CardHeader>
    <CardContent>
      <ScrollArea className="h-[calc(100vh-14rem)] pr-4">
        <div className="space-y-8">

          {/* ==================== VISÃO GERAL ==================== */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Server className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">1. Arquitetura do Sistema</h2>
                <p className="text-muted-foreground">Visão geral da estrutura técnica</p>
              </div>
            </div>

            <div className="bg-muted/30 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">Stack Tecnológico</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Frontend
                  </h4>
                  <ul className="space-y-1 text-base">
                    <li>• <strong>React 18.3</strong> + TypeScript</li>
                    <li>• <strong>Vite</strong> - Build tool</li>
                    <li>• <strong>Tailwind CSS 3.4</strong> - Estilização</li>
                    <li>• <strong>shadcn/ui</strong> + Radix UI - Componentes</li>
                    <li>• <strong>TanStack Query 5.83</strong> - Data fetching</li>
                    <li>• <strong>React Hook Form 7.61</strong> - Formulários</li>
                  </ul>
                </div>

                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-600" />
                    Backend
                  </h4>
                  <ul className="space-y-1 text-base">
                    <li>• <strong>Supabase</strong> - BaaS (PostgreSQL + Auth)</li>
                    <li>• <strong>Edge Functions</strong> - Deno runtime</li>
                    <li>• <strong>Real-time Subscriptions</strong> - WebSockets</li>
                    <li>• <strong>Row Level Security</strong> - Segurança</li>
                  </ul>
                </div>

                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-600" />
                    Inteligência Artificial
                  </h4>
                  <ul className="space-y-1 text-base">
                    <li>• <strong>OpenAI GPT-4 Turbo</strong> - Conversação</li>
                    <li>• <strong>Whisper API</strong> - Transcrição de áudio</li>
                    <li>• <strong>GPT-4 Vision</strong> - Análise de imagens</li>
                  </ul>
                </div>

                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-orange-600" />
                    Integrações
                  </h4>
                  <ul className="space-y-1 text-base">
                    <li>• <strong>Zapi</strong> - WhatsApp Business API</li>
                    <li>• <strong>Google Sheets API</strong> - Planilhas</li>
                    <li>• <strong>Google Calendar</strong> - Calendário</li>
                    <li>• <strong>N8n</strong> - Automação de workflows</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-blue-600" />
                Fluxo de Dados Principal
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <Badge className="bg-blue-100 text-blue-800">1</Badge>
                  <span className="text-base"><strong>Paciente</strong> → envia mensagem WhatsApp</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <Badge className="bg-blue-100 text-blue-800">2</Badge>
                  <span className="text-base"><strong>Zapi Webhook</strong> → recebe e encaminha para Edge Function</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <Badge className="bg-blue-100 text-blue-800">3</Badge>
                  <span className="text-base"><strong>whatsapp-webhook</strong> → processa e salva mensagem</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <Badge className="bg-blue-100 text-blue-800">4</Badge>
                  <span className="text-base"><strong>process-message</strong> → decide: buffer ou processar</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <Badge className="bg-blue-100 text-blue-800">5</Badge>
                  <span className="text-base"><strong>ai-chat-agent</strong> → gera resposta com OpenAI</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <Badge className="bg-blue-100 text-blue-800">6</Badge>
                  <span className="text-base"><strong>send-whatsapp</strong> → envia resposta via Zapi</span>
                </div>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          {/* ==================== BANCO DE DADOS ==================== */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">2. Estrutura do Banco de Dados</h2>
                <p className="text-muted-foreground">Tabelas principais do PostgreSQL</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-5 bg-muted/50 rounded-xl border">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Tabela: clientes
                </h3>
                <p className="text-base text-muted-foreground mb-3">
                  Armazena todos os leads e pacientes da clínica.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-base">
                    <thead className="bg-muted">
                      <tr>
                        <th className="border border-border p-2 text-left">Coluna</th>
                        <th className="border border-border p-2 text-left">Tipo</th>
                        <th className="border border-border p-2 text-left">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="border border-border p-2"><code>id</code></td><td className="border border-border p-2">UUID</td><td className="border border-border p-2">Identificador único</td></tr>
                      <tr><td className="border border-border p-2"><code>phone</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">Telefone WhatsApp (chave única)</td></tr>
                      <tr><td className="border border-border p-2"><code>name</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">Nome completo</td></tr>
                      <tr><td className="border border-border p-2"><code>email</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">Email</td></tr>
                      <tr><td className="border border-border p-2"><code>cpf</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">CPF (opcional)</td></tr>
                      <tr><td className="border border-border p-2"><code>status</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">lead, qualificado, agendado, paciente, perdido</td></tr>
                      <tr><td className="border border-border p-2"><code>stage</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">Estágio no funil</td></tr>
                      <tr><td className="border border-border p-2"><code>treatment_interest</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">Tratamento de interesse</td></tr>
                      <tr><td className="border border-border p-2"><code>payment_status</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">pago, pendente, parcial, atrasado</td></tr>
                      <tr><td className="border border-border p-2"><code>lead_source</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">Origem do lead</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-5 bg-muted/50 rounded-xl border">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  Tabela: conversas
                </h3>
                <p className="text-base text-muted-foreground mb-3">
                  Gerencia as sessões de conversa com cada paciente.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-base">
                    <thead className="bg-muted">
                      <tr>
                        <th className="border border-border p-2 text-left">Coluna</th>
                        <th className="border border-border p-2 text-left">Tipo</th>
                        <th className="border border-border p-2 text-left">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="border border-border p-2"><code>id</code></td><td className="border border-border p-2">UUID</td><td className="border border-border p-2">Identificador único</td></tr>
                      <tr><td className="border border-border p-2"><code>phone</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">Telefone do paciente</td></tr>
                      <tr><td className="border border-border p-2"><code>cliente_id</code></td><td className="border border-border p-2">UUID</td><td className="border border-border p-2">FK para clientes</td></tr>
                      <tr><td className="border border-border p-2"><code>status</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">ativa, finalizada</td></tr>
                      <tr><td className="border border-border p-2"><code>summary</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">Resumo gerado pela IA</td></tr>
                      <tr><td className="border border-border p-2"><code>sentiment</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">positivo, neutro, negativo</td></tr>
                      <tr><td className="border border-border p-2"><code>handoff_ativo</code></td><td className="border border-border p-2">BOOLEAN</td><td className="border border-border p-2">Se está em modo handoff</td></tr>
                      <tr><td className="border border-border p-2"><code>claimed_by</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">Quem assumiu o handoff</td></tr>
                      <tr><td className="border border-border p-2"><code>openai_thread_id</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">ID da thread OpenAI</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-5 bg-muted/50 rounded-xl border">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Tabela: appointments
                </h3>
                <p className="text-base text-muted-foreground mb-3">
                  Armazena todos os agendamentos de consultas.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-base">
                    <thead className="bg-muted">
                      <tr>
                        <th className="border border-border p-2 text-left">Coluna</th>
                        <th className="border border-border p-2 text-left">Tipo</th>
                        <th className="border border-border p-2 text-left">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="border border-border p-2"><code>id</code></td><td className="border border-border p-2">UUID</td><td className="border border-border p-2">Identificador único</td></tr>
                      <tr><td className="border border-border p-2"><code>phone</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">Telefone do paciente</td></tr>
                      <tr><td className="border border-border p-2"><code>doctor_id</code></td><td className="border border-border p-2">UUID</td><td className="border border-border p-2">FK para doctors</td></tr>
                      <tr><td className="border border-border p-2"><code>appointment_date</code></td><td className="border border-border p-2">DATE</td><td className="border border-border p-2">Data da consulta</td></tr>
                      <tr><td className="border border-border p-2"><code>appointment_time</code></td><td className="border border-border p-2">TIME</td><td className="border border-border p-2">Hora da consulta</td></tr>
                      <tr><td className="border border-border p-2"><code>status</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">pendente, confirmada, concluida, cancelada</td></tr>
                      <tr><td className="border border-border p-2"><code>notes</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">Observações</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-5 bg-muted/50 rounded-xl border">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-orange-600" />
                  Tabela: system_configuration
                </h3>
                <p className="text-base text-muted-foreground mb-3">
                  Configurações globais do sistema e da IA.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-base">
                    <thead className="bg-muted">
                      <tr>
                        <th className="border border-border p-2 text-left">Coluna</th>
                        <th className="border border-border p-2 text-left">Tipo</th>
                        <th className="border border-border p-2 text-left">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="border border-border p-2"><code>ai_model</code></td><td className="border border-border p-2">TEXT</td><td className="border border-border p-2">Modelo OpenAI (gpt-4-turbo)</td></tr>
                      <tr><td className="border border-border p-2"><code>ai_temperature</code></td><td className="border border-border p-2">NUMERIC</td><td className="border border-border p-2">Temperatura (0.0-1.0)</td></tr>
                      <tr><td className="border border-border p-2"><code>max_tokens</code></td><td className="border border-border p-2">INTEGER</td><td className="border border-border p-2">Limite de tokens</td></tr>
                      <tr><td className="border border-border p-2"><code>buffer_time_seconds</code></td><td className="border border-border p-2">INTEGER</td><td className="border border-border p-2">Tempo de buffer</td></tr>
                      <tr><td className="border border-border p-2"><code>buffer_enabled</code></td><td className="border border-border p-2">BOOLEAN</td><td className="border border-border p-2">Buffer ativado</td></tr>
                      <tr><td className="border border-border p-2"><code>handoff_keywords</code></td><td className="border border-border p-2">TEXT[]</td><td className="border border-border p-2">Palavras-chave de handoff</td></tr>
                      <tr><td className="border border-border p-2"><code>test_mode</code></td><td className="border border-border p-2">BOOLEAN</td><td className="border border-border p-2">Modo de teste</td></tr>
                      <tr><td className="border border-border p-2"><code>tools_enabled</code></td><td className="border border-border p-2">JSONB</td><td className="border border-border p-2">Ferramentas ativas</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          {/* ==================== EDGE FUNCTIONS ==================== */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">3. Edge Functions (Supabase)</h2>
                <p className="text-muted-foreground">Funções serverless em Deno</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h3 className="font-bold text-lg mb-2">Processamento de Mensagens</h3>
                <ul className="space-y-2 text-base">
                  <li className="flex items-start gap-2">
                    <Webhook className="h-5 w-5 mt-0.5 text-blue-600" />
                    <span><code className="bg-blue-100 px-1 rounded">whatsapp-webhook</code> - Recebe mensagens do Zapi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Workflow className="h-5 w-5 mt-0.5 text-blue-600" />
                    <span><code className="bg-blue-100 px-1 rounded">process-message</code> - Roteador principal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Bot className="h-5 w-5 mt-0.5 text-blue-600" />
                    <span><code className="bg-blue-100 px-1 rounded">ai-chat-agent</code> - Motor de IA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MessageSquare className="h-5 w-5 mt-0.5 text-blue-600" />
                    <span><code className="bg-blue-100 px-1 rounded">send-whatsapp</code> - Envia mensagens</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <h3 className="font-bold text-lg mb-2">Processamento de Mídia</h3>
                <ul className="space-y-2 text-base">
                  <li className="flex items-start gap-2">
                    <FileCode className="h-5 w-5 mt-0.5 text-green-600" />
                    <span><code className="bg-green-100 px-1 rounded">process-audio</code> - Transcrição Whisper</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileCode className="h-5 w-5 mt-0.5 text-green-600" />
                    <span><code className="bg-green-100 px-1 rounded">process-image</code> - Análise GPT-4 Vision</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <h3 className="font-bold text-lg mb-2">Sincronização de Dados</h3>
                <ul className="space-y-2 text-base">
                  <li className="flex items-start gap-2">
                    <RefreshCw className="h-5 w-5 mt-0.5 text-purple-600" />
                    <span><code className="bg-purple-100 px-1 rounded">sync-to-sheets</code> - Sync → Google Sheets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <RefreshCw className="h-5 w-5 mt-0.5 text-purple-600" />
                    <span><code className="bg-purple-100 px-1 rounded">receive-sheets-update</code> - Sync ← Sheets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <RefreshCw className="h-5 w-5 mt-0.5 text-purple-600" />
                    <span><code className="bg-purple-100 px-1 rounded">sync-to-n8n</code> - Trigger N8n</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <h3 className="font-bold text-lg mb-2">Handoff e Follow-ups</h3>
                <ul className="space-y-2 text-base">
                  <li className="flex items-start gap-2">
                    <Users className="h-5 w-5 mt-0.5 text-orange-600" />
                    <span><code className="bg-orange-100 px-1 rounded">cleanup-handoffs</code> - Limpa handoffs expirados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-5 w-5 mt-0.5 text-orange-600" />
                    <span><code className="bg-orange-100 px-1 rounded">finalize-handoff</code> - Finaliza handoff</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-5 w-5 mt-0.5 text-orange-600" />
                    <span><code className="bg-orange-100 px-1 rounded">send-followups</code> - Mensagens automáticas</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          {/* ==================== INTEGRAÇÃO GOOGLE SHEETS ==================== */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <FileCode className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">4. Integração Google Sheets</h2>
                <p className="text-muted-foreground">Sincronização de agendamentos com planilhas</p>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-lg">ID da Planilha Configurada</AlertTitle>
              <AlertDescription className="mt-2">
                <code className="bg-blue-100 px-2 py-1 rounded text-base">1FGJ7Cr8Vd8fGU8cncDFplMo0gcUhRhjXg-qaHRVKFUo</code>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="p-5 bg-muted/50 rounded-xl border">
                <h3 className="text-xl font-bold mb-3">Estrutura da Planilha</h3>
                <div className="space-y-3 text-base">
                  <p><strong>Formato das Abas:</strong> <code className="bg-muted px-1 rounded">MÊS / ANO</code> (ex: NOVEMBRO / 2025)</p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border text-base">
                      <thead className="bg-muted">
                        <tr>
                          <th className="border border-border p-2">Coluna</th>
                          <th className="border border-border p-2">Conteúdo</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td className="border border-border p-2"><strong>A</strong></td><td className="border border-border p-2">Horários (13:30, 14:00, etc.)</td></tr>
                        <tr><td className="border border-border p-2"><strong>B-E</strong></td><td className="border border-border p-2">Segunda-feira (Status, Nome, Procedimento, Valor)</td></tr>
                        <tr><td className="border border-border p-2"><strong>G-J</strong></td><td className="border border-border p-2">Terça-feira</td></tr>
                        <tr><td className="border border-border p-2"><strong>L-O</strong></td><td className="border border-border p-2">Quarta-feira</td></tr>
                        <tr><td className="border border-border p-2"><strong>P-S</strong></td><td className="border border-border p-2">Quinta-feira</td></tr>
                        <tr><td className="border border-border p-2"><strong>T-W</strong></td><td className="border border-border p-2">Sexta-feira</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-muted/50 rounded-xl border">
                <h3 className="text-xl font-bold mb-3">Status e Cores</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <div>
                      <Badge className="bg-green-100 text-green-800">Confirmada</Badge>
                      <p className="text-sm text-muted-foreground mt-1">Cor: Verde (#00FF00)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-600" />
                    <div>
                      <Badge className="bg-red-100 text-red-800">Cancelada</Badge>
                      <p className="text-sm text-muted-foreground mt-1">Cor: Vermelho (#FF0000)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600" />
                    <div>
                      <Badge className="bg-blue-100 text-blue-800">Concluída</Badge>
                      <p className="text-sm text-muted-foreground mt-1">Cor: Azul (#0000FF)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <RefreshCw className="h-6 w-6 text-yellow-600" />
                    <div>
                      <Badge className="bg-yellow-100 text-yellow-800">Reagendada</Badge>
                      <p className="text-sm text-muted-foreground mt-1">Cor: Amarelo (#FFFF00)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          {/* ==================== VARIÁVEIS DE AMBIENTE ==================== */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Key className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">5. Variáveis de Ambiente</h2>
                <p className="text-muted-foreground">Configurações necessárias no Supabase</p>
              </div>
            </div>

            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <AlertTitle className="text-lg">Segurança</AlertTitle>
              <AlertDescription className="text-base mt-2">
                Nunca exponha estas variáveis em código público. Configure-as diretamente no
                painel do Supabase em <strong>Settings → Edge Functions → Secrets</strong>.
              </AlertDescription>
            </Alert>

            <div className="p-5 bg-muted/50 rounded-xl border">
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border">
                  <code className="font-bold">OPENAI_API_KEY</code>
                  <p className="text-sm text-muted-foreground mt-1">Chave da API OpenAI para GPT-4 e Whisper</p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <code className="font-bold">ZAPI_INSTANCE_ID</code>
                  <p className="text-sm text-muted-foreground mt-1">ID da instância Zapi WhatsApp</p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <code className="font-bold">ZAPI_TOKEN</code>
                  <p className="text-sm text-muted-foreground mt-1">Token de autenticação Zapi</p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <code className="font-bold">GOOGLE_SHEET_ID</code>
                  <p className="text-sm text-muted-foreground mt-1">ID da planilha Google Sheets</p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <code className="font-bold">GOOGLE_SERVICE_ACCOUNT_JSON</code>
                  <p className="text-sm text-muted-foreground mt-1">JSON completo da service account Google</p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <code className="font-bold">SUPABASE_URL</code>
                  <p className="text-sm text-muted-foreground mt-1">URL do projeto Supabase</p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <code className="font-bold">SUPABASE_SERVICE_ROLE_KEY</code>
                  <p className="text-sm text-muted-foreground mt-1">Chave de serviço (admin) do Supabase</p>
                </div>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          {/* ==================== TROUBLESHOOTING ==================== */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Terminal className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">6. Solução de Problemas</h2>
                <p className="text-muted-foreground">Erros comuns e como resolvê-los</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-base">
                <thead className="bg-muted">
                  <tr>
                    <th className="border border-border p-3 text-left">Problema</th>
                    <th className="border border-border p-3 text-left">Causa Provável</th>
                    <th className="border border-border p-3 text-left">Solução</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border p-3">"Could not find week header"</td>
                    <td className="border border-border p-3">Data não existe no cabeçalho da planilha</td>
                    <td className="border border-border p-3">Verificar se a aba e o cabeçalho da semana existem</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">"Could not find time slot"</td>
                    <td className="border border-border p-3">Horário não cadastrado na coluna A</td>
                    <td className="border border-border p-3">Adicionar o horário na coluna A da planilha</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">Mensagens não chegam</td>
                    <td className="border border-border p-3">Webhook Zapi desconfigurado</td>
                    <td className="border border-border p-3">Verificar URL do webhook no painel Zapi</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">IA não responde</td>
                    <td className="border border-border p-3">Chave OpenAI inválida ou limite excedido</td>
                    <td className="border border-border p-3">Verificar OPENAI_API_KEY e limites de uso</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">Sync com Sheets falha</td>
                    <td className="border border-border p-3">Service account sem permissão</td>
                    <td className="border border-border p-3">Compartilhar planilha com email da service account</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">Handoff não notifica</td>
                    <td className="border border-border p-3">Número de notificação incorreto</td>
                    <td className="border border-border p-3">Verificar formato do número nas configurações</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Alert className="border-blue-200 bg-blue-50 mt-4">
              <Info className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-lg">Logs de Debug</AlertTitle>
              <AlertDescription className="text-base mt-2">
                Para investigar problemas, acesse o painel do Supabase em <strong>Edge Functions → Logs</strong>.
                Os logs mostram erros detalhados de cada execução de função.
              </AlertDescription>
            </Alert>
          </section>

          <Separator className="my-8" />

          {/* ==================== COMANDOS ÚTEIS ==================== */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Terminal className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">7. Comandos de Desenvolvimento</h2>
                <p className="text-muted-foreground">Scripts npm disponíveis</p>
              </div>
            </div>

            <div className="p-5 bg-slate-900 rounded-xl text-white font-mono">
              <div className="space-y-3">
                <div>
                  <span className="text-green-400">$</span> npm run dev
                  <p className="text-slate-400 text-sm mt-1"># Inicia servidor de desenvolvimento (porta 8080)</p>
                </div>
                <div>
                  <span className="text-green-400">$</span> npm run build
                  <p className="text-slate-400 text-sm mt-1"># Build de produção</p>
                </div>
                <div>
                  <span className="text-green-400">$</span> npm run lint
                  <p className="text-slate-400 text-sm mt-1"># Verificação de código com ESLint</p>
                </div>
                <div>
                  <span className="text-green-400">$</span> npm run preview
                  <p className="text-slate-400 text-sm mt-1"># Preview do build de produção</p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center p-6 bg-muted/30 rounded-xl mt-8">
            <p className="text-lg text-muted-foreground">
              Documentação Técnica - <strong>EvidenS CRM Navigator AI</strong>
            </p>
            <p className="text-base text-muted-foreground mt-2">
              Atualizado em Novembro de 2025
            </p>
          </div>

        </div>
      </ScrollArea>
    </CardContent>
  </Card>
);

export default DocumentationTab;

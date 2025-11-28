import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  LayoutDashboard,
  GitBranch,
  MessageSquare,
  Users,
  Calendar,
  Settings,
  TrendingUp,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MousePointer,
  Eye,
  Edit3,
  Filter,
  Search,
  Bell,
  Send,
  UserCheck,
  DollarSign,
  BarChart3,
  PieChart,
  ArrowRight,
  RefreshCw,
  Zap,
  Bot,
  Heart,
  Star,
  Info,
  HelpCircle,
  BookOpen,
  Target,
  Lightbulb,
  AlertTriangle,
  FileText,
  List,
  Grid,
  CalendarDays,
  Stethoscope,
  ClipboardList,
  UserPlus,
  PhoneCall,
  MessageCircle,
  ChevronRight,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";

const UserDocumentationTab = () => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-3xl">
          <BookOpen className="h-8 w-8 text-primary" />
          Guia Completo de Uso da Plataforma EvidenS
        </CardTitle>
        <p className="text-lg text-muted-foreground mt-2">
          Manual detalhado para Eliana e equipe da clínica - Tudo que você precisa saber para usar o sistema
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-14rem)] pr-4">
          <div className="space-y-8">

            {/* ==================== INTRODUÇÃO ==================== */}
            <section className="space-y-4">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-xl border border-primary/20">
                <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                  <Star className="h-8 w-8 text-primary" />
                  Bem-vinda ao EvidenS CRM Navigator AI
                </h2>
                <p className="text-lg mb-4">
                  <strong>Olá, Eliana!</strong> Esta plataforma foi desenvolvida especialmente para facilitar
                  o gerenciamento da sua clínica de dermatologia. Aqui você encontrará todas as ferramentas
                  necessárias para:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-start gap-3 p-4 bg-white/50 rounded-lg">
                    <Bot className="h-6 w-6 text-blue-600 mt-1" />
                    <div>
                      <p className="font-semibold text-lg">Atendimento Automático via WhatsApp</p>
                      <p className="text-muted-foreground">A IA responde seus pacientes 24 horas por dia</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white/50 rounded-lg">
                    <Users className="h-6 w-6 text-green-600 mt-1" />
                    <div>
                      <p className="font-semibold text-lg">Gestão de Pacientes e Leads</p>
                      <p className="text-muted-foreground">Organize todos os contatos da clínica</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white/50 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600 mt-1" />
                    <div>
                      <p className="font-semibold text-lg">Agendamento Integrado</p>
                      <p className="text-muted-foreground">Consultas sincronizadas com Google Sheets</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white/50 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-orange-600 mt-1" />
                    <div>
                      <p className="font-semibold text-lg">Relatórios e Métricas</p>
                      <p className="text-muted-foreground">Acompanhe o desempenho da clínica</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ==================== ÍNDICE ==================== */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <List className="h-6 w-6 text-primary" />
                Índice do Manual
              </h2>
              <div className="bg-muted/30 p-6 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 hover:bg-muted/50 rounded-lg cursor-pointer">
                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">1</Badge>
                    <span className="text-lg">Dashboard - Visão Geral da Clínica</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 hover:bg-muted/50 rounded-lg cursor-pointer">
                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">2</Badge>
                    <span className="text-lg">Pipeline CRM - Funil de Vendas</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 hover:bg-muted/50 rounded-lg cursor-pointer">
                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">3</Badge>
                    <span className="text-lg">Conversas - Atendimento WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 hover:bg-muted/50 rounded-lg cursor-pointer">
                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">4</Badge>
                    <span className="text-lg">Clientes - Base de Dados</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 hover:bg-muted/50 rounded-lg cursor-pointer">
                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">5</Badge>
                    <span className="text-lg">Agenda - Agendamentos</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 hover:bg-muted/50 rounded-lg cursor-pointer">
                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">6</Badge>
                    <span className="text-lg">Configurações - Personalização</span>
                  </div>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* ==================== 1. DASHBOARD ==================== */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <LayoutDashboard className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">1. Dashboard - Visão Geral</h2>
                  <p className="text-lg text-muted-foreground">Acompanhe todas as métricas da sua clínica em um só lugar</p>
                </div>
              </div>

              {/* O que é o Dashboard */}
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-lg font-semibold">O que é o Dashboard?</AlertTitle>
                <AlertDescription className="text-base mt-2">
                  O Dashboard é a <strong>tela inicial</strong> do sistema. Quando você entra na plataforma,
                  esta é a primeira página que aparece. Aqui você vê um <strong>resumo completo</strong> de
                  tudo que está acontecendo na clínica: quantos pacientes entraram em contato, quantas
                  consultas foram marcadas, como está o atendimento da IA, etc.
                </AlertDescription>
              </Alert>

              {/* Cards de Métricas */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <Target className="h-6 w-6 text-primary" />
                  Entendendo os Números (Cards de Métricas)
                </h3>
                <p className="text-lg text-muted-foreground">
                  Na parte superior do Dashboard, você verá <strong>cards coloridos</strong> com números importantes:
                </p>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="flex items-start gap-4">
                      <TrendingUp className="h-8 w-8 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-blue-800">Total de Leads</h4>
                        <p className="text-base text-blue-700 mt-2">
                          <strong>O que significa:</strong> É o número total de pessoas que entraram em contato
                          com a clínica pelo WhatsApp. Cada novo contato é um "lead" - uma pessoa interessada
                          nos seus serviços.
                        </p>
                        <p className="text-base text-blue-700 mt-2">
                          <strong>Por que é importante:</strong> Quanto mais leads, mais oportunidades de
                          novos pacientes. Se esse número estiver crescendo, significa que seu marketing
                          está funcionando!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                    <div className="flex items-start gap-4">
                      <MessageSquare className="h-8 w-8 text-green-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-green-800">Conversas Ativas</h4>
                        <p className="text-base text-green-700 mt-2">
                          <strong>O que significa:</strong> Quantas conversas estão acontecendo AGORA no WhatsApp.
                          A IA está respondendo essas pessoas automaticamente.
                        </p>
                        <p className="text-base text-green-700 mt-2">
                          <strong>Por que é importante:</strong> Se tiver muitas conversas ativas, significa
                          que há muita demanda. Se alguma conversa precisar de você, o sistema vai avisar!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                    <div className="flex items-start gap-4">
                      <Calendar className="h-8 w-8 text-purple-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-purple-800">Total de Agendamentos</h4>
                        <p className="text-base text-purple-700 mt-2">
                          <strong>O que significa:</strong> Quantas consultas já foram marcadas no sistema.
                          Isso inclui consultas passadas e futuras.
                        </p>
                        <p className="text-base text-purple-700 mt-2">
                          <strong>Por que é importante:</strong> Este é o seu resultado! Cada agendamento
                          é uma potencial receita para a clínica.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                    <div className="flex items-start gap-4">
                      <Target className="h-8 w-8 text-orange-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-orange-800">Taxa de Conversão</h4>
                        <p className="text-base text-orange-700 mt-2">
                          <strong>O que significa:</strong> De todas as pessoas que entraram em contato (leads),
                          quantas % marcaram consulta. Por exemplo: se 100 pessoas entraram em contato e 30
                          marcaram consulta, sua taxa é de 30%.
                        </p>
                        <p className="text-base text-orange-700 mt-2">
                          <strong>Por que é importante:</strong> Uma taxa alta significa que a IA está
                          convencendo bem os pacientes! Se estiver baixa, pode ser hora de ajustar as
                          configurações da IA.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl border border-teal-200">
                    <div className="flex items-start gap-4">
                      <UserCheck className="h-8 w-8 text-teal-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-teal-800">Taxa de Comparecimento (Show-up Rate)</h4>
                        <p className="text-base text-teal-700 mt-2">
                          <strong>O que significa:</strong> De todas as consultas marcadas, quantas % os
                          pacientes realmente compareceram.
                        </p>
                        <p className="text-base text-teal-700 mt-2">
                          <strong>Por que é importante:</strong> Pacientes que faltam = agenda vazia =
                          prejuízo. Se essa taxa estiver baixa, considere enviar lembretes ou confirmar
                          consultas um dia antes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráficos */}
              <div className="space-y-4 mt-6">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  Entendendo os Gráficos
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-muted/50 rounded-xl border">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                      <h4 className="text-lg font-bold">Evolução de Leads</h4>
                    </div>
                    <p className="text-base text-muted-foreground">
                      <strong>O que mostra:</strong> Um gráfico de linha mostrando quantos novos contatos
                      chegaram por dia/semana/mês.
                    </p>
                    <p className="text-base text-muted-foreground mt-2">
                      <strong>Como usar:</strong> Se a linha está subindo, ótimo! Seu marketing está
                      trazendo resultados. Se está caindo, pode ser hora de investir em divulgação.
                    </p>
                  </div>

                  <div className="p-5 bg-muted/50 rounded-xl border">
                    <div className="flex items-center gap-3 mb-3">
                      <PieChart className="h-6 w-6 text-green-600" />
                      <h4 className="text-lg font-bold">Interesse por Tratamento</h4>
                    </div>
                    <p className="text-base text-muted-foreground">
                      <strong>O que mostra:</strong> Um gráfico de pizza mostrando quais tratamentos
                      as pessoas mais procuram (Botox, Preenchimento, Limpeza de Pele, etc.).
                    </p>
                    <p className="text-base text-muted-foreground mt-2">
                      <strong>Como usar:</strong> Ajuda você a entender o que os pacientes mais querem.
                      Pode ajudar a decidir quais serviços promover ou investir.
                    </p>
                  </div>

                  <div className="p-5 bg-muted/50 rounded-xl border">
                    <div className="flex items-center gap-3 mb-3">
                      <Heart className="h-6 w-6 text-red-600" />
                      <h4 className="text-lg font-bold">Análise de Sentimento</h4>
                    </div>
                    <p className="text-base text-muted-foreground">
                      <strong>O que mostra:</strong> Se as conversas estão sendo positivas, neutras ou negativas.
                    </p>
                    <p className="text-base text-muted-foreground mt-2">
                      <strong>Como usar:</strong> Se muitas conversas estão negativas, pode indicar
                      problemas no atendimento ou insatisfação. Vale investigar essas conversas!
                    </p>
                  </div>

                  <div className="p-5 bg-muted/50 rounded-xl border">
                    <div className="flex items-center gap-3 mb-3">
                      <Stethoscope className="h-6 w-6 text-purple-600" />
                      <h4 className="text-lg font-bold">Estatísticas por Médico</h4>
                    </div>
                    <p className="text-base text-muted-foreground">
                      <strong>O que mostra:</strong> Quantas consultas cada médico (Dr. Gabriel, Dr. Romulo)
                      tem marcadas, confirmadas e realizadas.
                    </p>
                    <p className="text-base text-muted-foreground mt-2">
                      <strong>Como usar:</strong> Ajuda a balancear a agenda entre os profissionais e
                      ver quem está com mais demanda.
                    </p>
                  </div>
                </div>
              </div>

              {/* Passo a Passo Dashboard */}
              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl mt-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-yellow-800 mb-4">
                  <Lightbulb className="h-6 w-6" />
                  Rotina Diária Recomendada para o Dashboard
                </h3>
                <ol className="space-y-3 text-base">
                  <li className="flex items-start gap-3">
                    <Badge className="bg-yellow-200 text-yellow-800 mt-1">1</Badge>
                    <span><strong>Pela manhã:</strong> Abra o Dashboard e veja quantas conversas ativas existem. Se tiver Handoffs pendentes, atenda primeiro!</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Badge className="bg-yellow-200 text-yellow-800 mt-1">2</Badge>
                    <span><strong>Durante o dia:</strong> Dê uma olhada no número de agendamentos do dia para se preparar.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Badge className="bg-yellow-200 text-yellow-800 mt-1">3</Badge>
                    <span><strong>No fim do dia:</strong> Compare os números com ontem. Cresceu? Diminuiu? Por quê?</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Badge className="bg-yellow-200 text-yellow-800 mt-1">4</Badge>
                    <span><strong>Semanalmente:</strong> Analise o gráfico de Evolução de Leads para ver tendências.</span>
                  </li>
                </ol>
              </div>
            </section>

            <Separator className="my-8" />

            {/* ==================== 2. PIPELINE CRM ==================== */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <GitBranch className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">2. Pipeline CRM - Funil de Vendas</h2>
                  <p className="text-lg text-muted-foreground">Visualize e gerencie todos os seus leads de forma organizada</p>
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-lg font-semibold">O que é o Pipeline?</AlertTitle>
                <AlertDescription className="text-base mt-2">
                  O Pipeline é como um <strong>"quadro de tarefas"</strong> (tipo um Trello) onde você vê
                  todos os seus pacientes organizados em colunas. Cada coluna representa uma <strong>etapa
                  da jornada</strong> do paciente: desde o primeiro contato até a consulta marcada.
                </AlertDescription>
              </Alert>

              {/* Estágios do Funil */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <ArrowRight className="h-6 w-6 text-primary" />
                  As 5 Etapas do Funil (Colunas)
                </h3>
                <p className="text-lg text-muted-foreground mb-4">
                  Cada paciente passa por essas etapas, da esquerda para a direita:
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-xl border-l-4 border-slate-400">
                    <Badge className="bg-slate-200 text-slate-800 text-lg px-3 py-1">1</Badge>
                    <div>
                      <h4 className="text-xl font-bold text-slate-800">CONEXÃO</h4>
                      <p className="text-base text-slate-600 mt-2">
                        <strong>O que significa:</strong> O paciente acabou de entrar em contato pela primeira
                        vez. A IA está iniciando a conversa.
                      </p>
                      <p className="text-base text-slate-600 mt-1">
                        <strong>Ação necessária:</strong> Geralmente nenhuma. A IA cuida dessa etapa automaticamente.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 bg-blue-50 rounded-xl border-l-4 border-blue-400">
                    <Badge className="bg-blue-200 text-blue-800 text-lg px-3 py-1">2</Badge>
                    <div>
                      <h4 className="text-xl font-bold text-blue-800">PROBLEMA</h4>
                      <p className="text-base text-blue-600 mt-2">
                        <strong>O que significa:</strong> A IA já identificou qual é a necessidade/problema
                        do paciente (ex: "quer fazer Botox", "tem manchas na pele").
                      </p>
                      <p className="text-base text-blue-600 mt-1">
                        <strong>Ação necessária:</strong> Verifique se a IA entendeu corretamente a necessidade.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 bg-yellow-50 rounded-xl border-l-4 border-yellow-400">
                    <Badge className="bg-yellow-200 text-yellow-800 text-lg px-3 py-1">3</Badge>
                    <div>
                      <h4 className="text-xl font-bold text-yellow-800">IMPACTO</h4>
                      <p className="text-base text-yellow-600 mt-2">
                        <strong>O que significa:</strong> A IA está entendendo como o problema afeta a vida
                        do paciente. Isso ajuda a personalizar o atendimento.
                      </p>
                      <p className="text-base text-yellow-600 mt-1">
                        <strong>Ação necessária:</strong> Pacientes nessa etapa estão mais engajados.
                        É um bom momento para a IA oferecer o agendamento.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 bg-orange-50 rounded-xl border-l-4 border-orange-400">
                    <Badge className="bg-orange-200 text-orange-800 text-lg px-3 py-1">4</Badge>
                    <div>
                      <h4 className="text-xl font-bold text-orange-800">DECISÃO</h4>
                      <p className="text-base text-orange-600 mt-2">
                        <strong>O que significa:</strong> O paciente está decidindo se vai marcar ou não.
                        Pode estar com dúvidas sobre preços, horários, etc.
                      </p>
                      <p className="text-base text-orange-600 mt-1">
                        <strong>Ação necessária:</strong> <strong className="text-orange-800">ATENÇÃO!</strong> Se
                        ficarem muito tempo aqui, considere intervir manualmente para tirar dúvidas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 bg-green-50 rounded-xl border-l-4 border-green-400">
                    <Badge className="bg-green-200 text-green-800 text-lg px-3 py-1">5</Badge>
                    <div>
                      <h4 className="text-xl font-bold text-green-800">AGENDAMENTO</h4>
                      <p className="text-base text-green-600 mt-2">
                        <strong>O que significa:</strong> O paciente marcou a consulta! Agora é só
                        confirmar e atender.
                      </p>
                      <p className="text-base text-green-600 mt-1">
                        <strong>Ação necessária:</strong> Confirme a consulta 1 dia antes para evitar faltas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Como usar o Pipeline */}
              <div className="space-y-4 mt-6">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <MousePointer className="h-6 w-6 text-primary" />
                  Como Usar o Pipeline - Passo a Passo
                </h3>

                <div className="bg-muted/30 p-6 rounded-xl space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">1</div>
                    <div>
                      <p className="font-semibold text-lg">Visualizar os Cards</p>
                      <p className="text-base text-muted-foreground">
                        Cada "cartãozinho" é um paciente. Você verá o nome, telefone e um resumo rápido
                        do que ele procura.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">2</div>
                    <div>
                      <p className="font-semibold text-lg">Arrastar e Soltar (Drag & Drop)</p>
                      <p className="text-base text-muted-foreground">
                        <strong>Clique e segure</strong> um card, depois <strong>arraste</strong> para outra
                        coluna. Isso muda manualmente o estágio do paciente. Útil quando você sabe que
                        o paciente avançou mas a IA ainda não atualizou.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">3</div>
                    <div>
                      <p className="font-semibold text-lg">Clicar para Ver Detalhes</p>
                      <p className="text-base text-muted-foreground">
                        <strong>Clique em um card</strong> para abrir uma janela com todas as informações
                        do paciente: histórico de conversas, dados pessoais, etc.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">4</div>
                    <div>
                      <p className="font-semibold text-lg">Usar os Filtros</p>
                      <p className="text-base text-muted-foreground">
                        No topo da página, você encontra filtros para buscar pacientes específicos:
                      </p>
                      <ul className="mt-2 space-y-1 text-base text-muted-foreground ml-4">
                        <li>• <strong>Busca por texto:</strong> Digite nome ou telefone</li>
                        <li>• <strong>Status de Pagamento:</strong> Filtre por "Pago", "Pendente", etc.</li>
                        <li>• <strong>Tipo de Tratamento:</strong> Filtre por "Botox", "Preenchimento", etc.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dicas do Pipeline */}
              <div className="bg-green-50 border border-green-200 p-6 rounded-xl mt-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-green-800 mb-4">
                  <Lightbulb className="h-6 w-6" />
                  Dicas para Usar o Pipeline com Eficiência
                </h3>
                <ul className="space-y-3 text-base text-green-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 mt-1 text-green-600" />
                    <span><strong>Priorize a coluna "Decisão":</strong> Pacientes ali estão quase prontos para marcar. Um empurrãozinho pode converter!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 mt-1 text-green-600" />
                    <span><strong>Fique de olho em cards "parados":</strong> Se um paciente está na mesma coluna há dias, talvez precise de atenção manual.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 mt-1 text-green-600" />
                    <span><strong>Use os filtros para encontrar:</strong> Se você sabe que "Maria" ligou ontem, use a busca para encontrá-la rapidamente.</span>
                  </li>
                </ul>
              </div>
            </section>

            <Separator className="my-8" />

            {/* ==================== 3. CONVERSAS ==================== */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <MessageSquare className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">3. Conversas - Atendimento WhatsApp</h2>
                  <p className="text-lg text-muted-foreground">Veja e gerencie todas as conversas com pacientes</p>
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-lg font-semibold">O que é a Tela de Conversas?</AlertTitle>
                <AlertDescription className="text-base mt-2">
                  Aqui você vê <strong>todas as conversas</strong> que a IA está tendo ou já teve com
                  pacientes pelo WhatsApp. Você pode ler o histórico completo, ver análises da IA e,
                  quando necessário, <strong>assumir a conversa manualmente</strong>.
                </AlertDescription>
              </Alert>

              {/* Estados de Conversa */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-primary" />
                  Tipos de Status das Conversas
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-green-50 border-2 border-green-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Bot className="h-8 w-8 text-green-600" />
                      <h4 className="text-lg font-bold text-green-800">IA Ativa</h4>
                    </div>
                    <p className="text-base text-green-700">
                      <strong>O que significa:</strong> A IA está respondendo automaticamente.
                      Tudo está funcionando normalmente.
                    </p>
                    <p className="text-base text-green-700 mt-2">
                      <strong>Ação:</strong> Geralmente nenhuma. Você pode acompanhar se quiser.
                    </p>
                  </div>

                  <div className="p-5 bg-orange-50 border-2 border-orange-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className="h-8 w-8 text-orange-600" />
                      <h4 className="text-lg font-bold text-orange-800">Handoff Ativo</h4>
                    </div>
                    <p className="text-base text-orange-700">
                      <strong>O que significa:</strong> A IA <strong>passou a bola para você!</strong>
                      Pode ser porque o paciente pediu para falar com humano, ou a IA não soube responder.
                    </p>
                    <p className="text-base text-orange-700 mt-2">
                      <strong>Ação:</strong> <strong className="text-orange-800">URGENTE!</strong> Abra
                      a conversa e responda manualmente.
                    </p>
                  </div>

                  <div className="p-5 bg-gray-50 border-2 border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle2 className="h-8 w-8 text-gray-600" />
                      <h4 className="text-lg font-bold text-gray-800">Encerrada</h4>
                    </div>
                    <p className="text-base text-gray-700">
                      <strong>O que significa:</strong> A conversa foi finalizada. Pode ter resultado
                      em agendamento ou o paciente deixou de responder.
                    </p>
                    <p className="text-base text-gray-700 mt-2">
                      <strong>Ação:</strong> Nenhuma necessária. Você pode revisar o histórico depois.
                    </p>
                  </div>
                </div>
              </div>

              {/* O que é Handoff */}
              <div className="bg-red-50 border border-red-200 p-6 rounded-xl mt-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-red-800 mb-4">
                  <AlertTriangle className="h-6 w-6" />
                  IMPORTANTE: Entendendo o Handoff
                </h3>
                <p className="text-base text-red-700 mb-4">
                  O <strong>Handoff</strong> acontece quando a IA percebe que não consegue resolver a
                  situação sozinha e precisa de um humano. Isso pode acontecer quando:
                </p>
                <ul className="space-y-2 text-base text-red-700 ml-4">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 mt-1" />
                    <span>O paciente escreve palavras como "atendente", "humano", "quero falar com alguém"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 mt-1" />
                    <span>O paciente está muito irritado ou insatisfeito</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 mt-1" />
                    <span>A IA não entende a pergunta depois de várias tentativas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 mt-1" />
                    <span>O paciente faz perguntas muito específicas sobre procedimentos médicos</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-red-100 rounded-lg">
                  <p className="font-bold text-red-800">
                    Quando ver um Handoff, atenda o mais rápido possível! O paciente está esperando.
                  </p>
                </div>
              </div>

              {/* Como usar a tela de Conversas */}
              <div className="space-y-4 mt-6">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <MousePointer className="h-6 w-6 text-primary" />
                  Como Usar a Tela de Conversas - Passo a Passo
                </h3>

                <div className="bg-muted/30 p-6 rounded-xl space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">1</div>
                    <div>
                      <p className="font-semibold text-lg">Acessar a Lista de Conversas</p>
                      <p className="text-base text-muted-foreground">
                        No menu lateral, clique em <strong>"Conversas"</strong>. Você verá uma lista
                        de todas as conversas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">2</div>
                    <div>
                      <p className="font-semibold text-lg">Usar os Filtros</p>
                      <p className="text-base text-muted-foreground">
                        No topo, você pode filtrar por:
                      </p>
                      <ul className="mt-2 space-y-1 text-base text-muted-foreground ml-4">
                        <li>• <strong>"Ativas":</strong> Conversas em andamento</li>
                        <li>• <strong>"Finalizadas":</strong> Conversas encerradas</li>
                        <li>• <strong>Campo de busca:</strong> Digite o telefone ou nome para encontrar</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">3</div>
                    <div>
                      <p className="font-semibold text-lg">Clicar em uma Conversa</p>
                      <p className="text-base text-muted-foreground">
                        Clique em qualquer conversa da lista para abrir os detalhes. Você verá:
                      </p>
                      <ul className="mt-2 space-y-1 text-base text-muted-foreground ml-4">
                        <li>• <strong>Histórico completo:</strong> Todas as mensagens trocadas</li>
                        <li>• <strong>Resumo da IA:</strong> Um resuminho do que foi conversado</li>
                        <li>• <strong>Sentimento:</strong> Se a conversa foi positiva, neutra ou negativa</li>
                        <li>• <strong>Intenção detectada:</strong> O que o paciente quer (agendar, informações, etc.)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">4</div>
                    <div>
                      <p className="font-semibold text-lg">Responder Manualmente (Quando Necessário)</p>
                      <p className="text-base text-muted-foreground">
                        Se houver um Handoff ou você quiser intervir:
                      </p>
                      <ol className="mt-2 space-y-1 text-base text-muted-foreground ml-4">
                        <li>1. Clique no botão <strong>"Assumir Conversa"</strong> ou <strong>"Reivindicar"</strong></li>
                        <li>2. Digite sua mensagem no campo de texto</li>
                        <li>3. Clique em <strong>"Enviar"</strong> - a mensagem vai direto para o WhatsApp do paciente!</li>
                      </ol>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">5</div>
                    <div>
                      <p className="font-semibold text-lg">Devolver para a IA</p>
                      <p className="text-base text-muted-foreground">
                        Depois de resolver o problema do paciente, você pode clicar em
                        <strong>"Finalizar Handoff"</strong> para que a IA volte a atender automaticamente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* ==================== 4. CLIENTES ==================== */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">4. Clientes - Base de Dados</h2>
                  <p className="text-lg text-muted-foreground">Cadastro completo de todos os pacientes e leads</p>
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-lg font-semibold">O que é a Tela de Clientes?</AlertTitle>
                <AlertDescription className="text-base mt-2">
                  Esta é a <strong>lista mestra</strong> de todas as pessoas que já entraram em contato
                  com a clínica. Aqui você encontra dados pessoais, histórico de atendimentos, status
                  de pagamentos e muito mais.
                </AlertDescription>
              </Alert>

              {/* Informações Cadastradas */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <ClipboardList className="h-6 w-6 text-primary" />
                  Informações de Cada Cliente
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-muted/50 rounded-xl border">
                    <h4 className="text-lg font-bold flex items-center gap-2 mb-3">
                      <UserPlus className="h-5 w-5 text-blue-600" />
                      Dados Pessoais
                    </h4>
                    <ul className="space-y-2 text-base">
                      <li className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span><strong>Telefone:</strong> Número do WhatsApp (identificador principal)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span><strong>Nome:</strong> Nome completo do paciente</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span><strong>Email:</strong> Para comunicações adicionais</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span><strong>CPF:</strong> Documento (opcional)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span><strong>Data de Nascimento:</strong> Para cálculo de idade</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-5 bg-muted/50 rounded-xl border">
                    <h4 className="text-lg font-bold flex items-center gap-2 mb-3">
                      <Target className="h-5 w-5 text-green-600" />
                      Classificação do Lead
                    </h4>
                    <ul className="space-y-2 text-base">
                      <li><strong>Status:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline">Lead</Badge>
                          <Badge variant="outline">Qualificado</Badge>
                          <Badge variant="outline">Agendado</Badge>
                          <Badge variant="outline">Paciente</Badge>
                          <Badge variant="outline">Perdido</Badge>
                        </div>
                      </li>
                      <li className="mt-2"><strong>Estágio no Funil:</strong> Conexão, Problema, etc.</li>
                      <li><strong>Interesse:</strong> Qual tratamento procura</li>
                      <li><strong>Origem:</strong> De onde veio (Instagram, Google, Indicação)</li>
                    </ul>
                  </div>

                  <div className="p-5 bg-muted/50 rounded-xl border">
                    <h4 className="text-lg font-bold flex items-center gap-2 mb-3">
                      <DollarSign className="h-5 w-5 text-yellow-600" />
                      Dados Financeiros
                    </h4>
                    <ul className="space-y-2 text-base">
                      <li><strong>Status de Pagamento:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge className="bg-green-100 text-green-800">Pago</Badge>
                          <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
                          <Badge className="bg-orange-100 text-orange-800">Parcial</Badge>
                          <Badge className="bg-red-100 text-red-800">Atrasado</Badge>
                        </div>
                      </li>
                      <li className="mt-2"><strong>Valor:</strong> Quanto o paciente pagou/deve</li>
                      <li><strong>Data do Pagamento:</strong> Quando foi realizado</li>
                    </ul>
                  </div>

                  <div className="p-5 bg-muted/50 rounded-xl border">
                    <h4 className="text-lg font-bold flex items-center gap-2 mb-3">
                      <Stethoscope className="h-5 w-5 text-purple-600" />
                      Histórico Clínico
                    </h4>
                    <ul className="space-y-2 text-base">
                      <li><strong>Total de Consultas:</strong> Quantas vezes já veio à clínica</li>
                      <li><strong>Última Consulta:</strong> Data do último atendimento</li>
                      <li><strong>Tratamentos de Interesse:</strong> O que o paciente procura</li>
                      <li><strong>Notas:</strong> Observações adicionais</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Como usar a tela de Clientes */}
              <div className="space-y-4 mt-6">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <MousePointer className="h-6 w-6 text-primary" />
                  Como Usar a Tela de Clientes
                </h3>

                <div className="bg-muted/30 p-6 rounded-xl space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">1</div>
                    <div>
                      <p className="font-semibold text-lg">Buscar um Cliente</p>
                      <p className="text-base text-muted-foreground">
                        Use o <strong>campo de busca</strong> no topo. Você pode digitar:
                      </p>
                      <ul className="mt-2 space-y-1 text-base text-muted-foreground ml-4">
                        <li>• Nome (ex: "Maria")</li>
                        <li>• Telefone (ex: "11999887766")</li>
                        <li>• Email</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">2</div>
                    <div>
                      <p className="font-semibold text-lg">Filtrar por Categoria</p>
                      <p className="text-base text-muted-foreground">
                        Use os <strong>filtros</strong> para ver apenas:
                      </p>
                      <ul className="mt-2 space-y-1 text-base text-muted-foreground ml-4">
                        <li>• Clientes por <strong>Status</strong> (Lead, Paciente, Perdido)</li>
                        <li>• Clientes por <strong>Estágio</strong> no funil</li>
                        <li>• Clientes por <strong>Tratamento</strong> de interesse</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">3</div>
                    <div>
                      <p className="font-semibold text-lg">Ver Detalhes de um Cliente</p>
                      <p className="text-base text-muted-foreground">
                        Clique no nome ou no card do cliente para abrir uma <strong>janela de detalhes</strong>
                        com todas as informações, histórico de conversas e agendamentos.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">4</div>
                    <div>
                      <p className="font-semibold text-lg">Editar Informações</p>
                      <p className="text-base text-muted-foreground">
                        Na janela de detalhes, clique em <strong>"Editar"</strong> para atualizar:
                      </p>
                      <ul className="mt-2 space-y-1 text-base text-muted-foreground ml-4">
                        <li>• Corrigir nome ou telefone</li>
                        <li>• Atualizar status de pagamento</li>
                        <li>• Adicionar notas e observações</li>
                        <li>• Mudar o status do lead</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* ==================== 5. AGENDA ==================== */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Calendar className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">5. Agenda - Agendamentos</h2>
                  <p className="text-lg text-muted-foreground">Gerencie todas as consultas da clínica</p>
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-lg font-semibold">O que é a Tela de Agenda?</AlertTitle>
                <AlertDescription className="text-base mt-2">
                  Aqui você vê <strong>todas as consultas agendadas</strong> em formato de calendário ou lista.
                  As consultas são <strong>sincronizadas automaticamente</strong> com a planilha Google Sheets
                  da clínica.
                </AlertDescription>
              </Alert>

              {/* Visualizações */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <Eye className="h-6 w-6 text-primary" />
                  Modos de Visualização
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <CalendarDays className="h-8 w-8 text-blue-600" />
                      <h4 className="text-xl font-bold text-blue-800">Visualização Calendário</h4>
                    </div>
                    <p className="text-base text-blue-700">
                      Veja as consultas organizadas por <strong>dia, semana ou mês</strong>. Perfeito
                      para ter uma visão geral da agenda.
                    </p>
                    <p className="text-base text-blue-700 mt-2">
                      <strong>Como usar:</strong> Use os botões no topo para alternar entre
                      "Dia", "Semana" e "Mês".
                    </p>
                  </div>

                  <div className="p-5 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <List className="h-8 w-8 text-green-600" />
                      <h4 className="text-xl font-bold text-green-800">Visualização Lista</h4>
                    </div>
                    <p className="text-base text-green-700">
                      Veja as consultas em formato de <strong>lista ordenada</strong>. Mais detalhes
                      em cada linha.
                    </p>
                    <p className="text-base text-green-700 mt-2">
                      <strong>Como usar:</strong> Clique no ícone de lista no canto superior.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status das Consultas */}
              <div className="space-y-4 mt-6">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-primary" />
                  Status das Consultas
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                    <div>
                      <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
                      <p className="text-base text-muted-foreground mt-1">Aguardando confirmação do paciente</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <div>
                      <Badge className="bg-green-100 text-green-800">Confirmada</Badge>
                      <p className="text-base text-muted-foreground mt-1">Paciente confirmou presença</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-blue-600" />
                    <div>
                      <Badge className="bg-blue-100 text-blue-800">Concluída</Badge>
                      <p className="text-base text-muted-foreground mt-1">Consulta realizada com sucesso</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-600" />
                    <div>
                      <Badge className="bg-red-100 text-red-800">Cancelada</Badge>
                      <p className="text-base text-muted-foreground mt-1">Paciente ou clínica cancelou</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Como agendar */}
              <div className="space-y-4 mt-6">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <MousePointer className="h-6 w-6 text-primary" />
                  Como Criar um Novo Agendamento - Passo a Passo
                </h3>

                <div className="bg-muted/30 p-6 rounded-xl space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">1</div>
                    <div>
                      <p className="font-semibold text-lg">Clique no Botão "+ Novo Agendamento"</p>
                      <p className="text-base text-muted-foreground">
                        Este botão fica no canto superior direito da tela de Agenda.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">2</div>
                    <div>
                      <p className="font-semibold text-lg">Preencha os Dados</p>
                      <p className="text-base text-muted-foreground">
                        Um formulário vai aparecer. Preencha:
                      </p>
                      <ul className="mt-2 space-y-1 text-base text-muted-foreground ml-4">
                        <li>• <strong>Telefone do Paciente:</strong> Número do WhatsApp</li>
                        <li>• <strong>Data:</strong> Selecione no calendário</li>
                        <li>• <strong>Hora:</strong> Escolha o horário disponível</li>
                        <li>• <strong>Médico:</strong> Dr. Gabriel ou Dr. Romulo</li>
                        <li>• <strong>Procedimento:</strong> Tipo de tratamento</li>
                        <li>• <strong>Observações:</strong> Notas adicionais (opcional)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">3</div>
                    <div>
                      <p className="font-semibold text-lg">Clique em "Salvar"</p>
                      <p className="text-base text-muted-foreground">
                        O agendamento será criado e automaticamente:
                      </p>
                      <ul className="mt-2 space-y-1 text-base text-muted-foreground ml-4">
                        <li>• Aparecerá no calendário</li>
                        <li>• Será sincronizado com a planilha Google Sheets</li>
                        <li>• O cliente será atualizado automaticamente</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sincronização */}
              <div className="bg-green-50 border border-green-200 p-6 rounded-xl mt-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-green-800 mb-4">
                  <RefreshCw className="h-6 w-6" />
                  Sincronização com Google Sheets
                </h3>
                <p className="text-base text-green-700 mb-4">
                  Todas as consultas criadas aqui vão <strong>automaticamente</strong> para a planilha
                  do Google Sheets que vocês já usam. Isso significa:
                </p>
                <ul className="space-y-2 text-base text-green-700 ml-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 mt-1 text-green-600" />
                    <span>A planilha é atualizada em tempo real</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 mt-1 text-green-600" />
                    <span>As cores de status são aplicadas automaticamente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 mt-1 text-green-600" />
                    <span>Não precisa preencher a planilha manualmente</span>
                  </li>
                </ul>
              </div>
            </section>

            <Separator className="my-8" />

            {/* ==================== 6. CONFIGURAÇÕES ==================== */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Settings className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">6. Configurações - Personalização</h2>
                  <p className="text-lg text-muted-foreground">Ajuste o comportamento da IA e do sistema</p>
                </div>
              </div>

              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <AlertTitle className="text-lg font-semibold">Atenção: Área Técnica</AlertTitle>
                <AlertDescription className="text-base mt-2">
                  Esta área contém configurações avançadas que afetam o funcionamento da IA.
                  <strong> Faça alterações com cuidado</strong> e, se tiver dúvidas, consulte o suporte técnico.
                </AlertDescription>
              </Alert>

              {/* Configurações da IA */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <Bot className="h-6 w-6 text-primary" />
                  Configurações da Inteligência Artificial
                </h3>

                <div className="space-y-4">
                  <div className="p-5 bg-muted/50 rounded-xl border">
                    <h4 className="text-xl font-bold mb-3">Observações Personalizadas (O Mais Importante!)</h4>
                    <p className="text-base text-muted-foreground mb-3">
                      Este é o campo onde você pode <strong>ensinar a IA</strong> sobre a clínica.
                      Aqui você pode colocar:
                    </p>
                    <ul className="space-y-2 text-base ml-4">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-5 w-5 mt-1 text-primary" />
                        <span><strong>Informações sobre procedimentos:</strong> "Nosso Botox custa R$ 1.500 a R$ 2.500"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-5 w-5 mt-1 text-primary" />
                        <span><strong>Horários de funcionamento:</strong> "Atendemos de segunda a sexta, das 9h às 18h"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-5 w-5 mt-1 text-primary" />
                        <span><strong>Regras de agendamento:</strong> "Só agendamos com antecedência mínima de 24h"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-5 w-5 mt-1 text-primary" />
                        <span><strong>Tom de voz:</strong> "Seja sempre gentil e use 'você' ao invés de 'senhor'"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-5 w-5 mt-1 text-primary" />
                        <span><strong>Promoções:</strong> "Temos 20% de desconto no Botox em novembro"</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-5 bg-muted/50 rounded-xl border">
                    <h4 className="text-xl font-bold mb-3">Modelo da IA</h4>
                    <p className="text-base text-muted-foreground">
                      <strong>O que é:</strong> Qual "cérebro" a IA usa. O padrão é o <strong>GPT-4 Turbo</strong>,
                      que é o mais inteligente e recomendado.
                    </p>
                    <p className="text-base text-muted-foreground mt-2">
                      <strong>Recomendação:</strong> Não altere, a menos que orientado pelo suporte.
                    </p>
                  </div>

                  <div className="p-5 bg-muted/50 rounded-xl border">
                    <h4 className="text-xl font-bold mb-3">Temperatura</h4>
                    <p className="text-base text-muted-foreground">
                      <strong>O que é:</strong> Controla a "criatividade" da IA. Valores baixos (0.1-0.3) =
                      respostas mais previsíveis e formais. Valores altos (0.7-1.0) = respostas mais
                      criativas e variadas.
                    </p>
                    <p className="text-base text-muted-foreground mt-2">
                      <strong>Recomendação:</strong> Para atendimento médico, use valores baixos (0.2-0.4)
                      para manter a consistência.
                    </p>
                  </div>
                </div>
              </div>

              {/* Buffer de Mensagens */}
              <div className="space-y-4 mt-6">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <Clock className="h-6 w-6 text-primary" />
                  Buffer de Mensagens
                </h3>

                <div className="p-5 bg-muted/50 rounded-xl border">
                  <p className="text-base text-muted-foreground mb-3">
                    <strong>O que é:</strong> Quando um paciente manda várias mensagens seguidas
                    (ex: "Oi" + "Quero saber o preço" + "Do Botox"), o sistema espera um tempinho
                    antes de responder, para responder tudo de uma vez.
                  </p>
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="font-medium">Tempo de Buffer</span>
                      <span className="text-muted-foreground">Padrão: 30 segundos</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="font-medium">Máximo de Mensagens</span>
                      <span className="text-muted-foreground">Padrão: 5 mensagens</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Handoff */}
              <div className="space-y-4 mt-6">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <PhoneCall className="h-6 w-6 text-primary" />
                  Configurações de Handoff
                </h3>

                <div className="p-5 bg-muted/50 rounded-xl border">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-bold">Número para Notificações</h4>
                      <p className="text-base text-muted-foreground">
                        <strong>O que é:</strong> Quando a IA precisar de ajuda, ela vai mandar uma
                        notificação para este número de WhatsApp avisando que tem alguém esperando
                        atendimento humano.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">Palavras-chave de Handoff</h4>
                      <p className="text-base text-muted-foreground">
                        <strong>O que é:</strong> Se o paciente escrever alguma dessas palavras, a IA
                        automaticamente transfere para atendimento humano. Exemplos: "atendente",
                        "humano", "pessoa real", "reclamação".
                      </p>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">Timeout de Handoff</h4>
                      <p className="text-base text-muted-foreground">
                        <strong>O que é:</strong> Se ninguém da equipe responder depois de X minutos,
                        o handoff é cancelado automaticamente e a IA volta a atender.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ferramentas */}
              <div className="space-y-4 mt-6">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <Zap className="h-6 w-6 text-primary" />
                  Ferramentas da IA
                </h3>

                <div className="p-5 bg-muted/50 rounded-xl border">
                  <p className="text-base text-muted-foreground mb-4">
                    Você pode ativar ou desativar o que a IA pode fazer automaticamente:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        <span className="font-medium">Agendar Consultas</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Recomendado: ATIVADO</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <Edit3 className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Atualizar Dados do Cliente</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Recomendado: ATIVADO</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-600" />
                        <span className="font-medium">Registrar Interesse</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Recomendado: ATIVADO</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="h-5 w-5 text-orange-600" />
                        <span className="font-medium">Solicitar Handoff</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Recomendado: ATIVADO</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modo de Teste */}
              <div className="space-y-4 mt-6">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <Play className="h-6 w-6 text-primary" />
                  Modo de Teste
                </h3>

                <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-base text-yellow-700 mb-3">
                    <strong>O que é:</strong> Quando ativado, a IA só funciona para números de telefone
                    específicos que você colocar na lista. Isso permite testar mudanças sem afetar
                    pacientes reais.
                  </p>
                  <p className="text-base text-yellow-700">
                    <strong>Quando usar:</strong> Antes de fazer mudanças grandes nas configurações,
                    ative o modo de teste, adicione seu número na lista, e veja se tudo funciona bem
                    antes de liberar para todos.
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* ==================== DICAS GERAIS ==================== */}
            <section className="space-y-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Lightbulb className="h-8 w-8 text-primary" />
                Dicas Gerais de Uso
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="text-xl font-bold text-blue-800 mb-3">1. Rotina Diária Recomendada</h3>
                  <ol className="space-y-2 text-base text-blue-700">
                    <li><strong>Manhã:</strong> Abra o Dashboard, veja os Handoffs pendentes, responda primeiro</li>
                    <li><strong>Durante o dia:</strong> De olho nas conversas ativas e agendamentos do dia</li>
                    <li><strong>Fim do dia:</strong> Revise métricas, veja evolução de leads</li>
                  </ol>
                </div>

                <div className="p-5 bg-green-50 border border-green-200 rounded-xl">
                  <h3 className="text-xl font-bold text-green-800 mb-3">2. Quando Intervir Manualmente</h3>
                  <ul className="space-y-2 text-base text-green-700">
                    <li>• Quando aparecer <strong>Handoff Ativo</strong> - paciente pediu humano</li>
                    <li>• Quando a conversa estiver <strong>negativa</strong> - paciente insatisfeito</li>
                    <li>• Quando o paciente perguntar sobre <strong>preços específicos</strong> não configurados</li>
                    <li>• Quando houver <strong>urgência médica</strong> - encaminhe imediatamente</li>
                  </ul>
                </div>

                <div className="p-5 bg-purple-50 border border-purple-200 rounded-xl">
                  <h3 className="text-xl font-bold text-purple-800 mb-3">3. Mantendo os Dados Atualizados</h3>
                  <ul className="space-y-2 text-base text-purple-700">
                    <li>• <strong>Atualize as observações da IA</strong> quando tiver promoções novas</li>
                    <li>• <strong>Corrija dados de clientes</strong> quando identificar erros</li>
                    <li>• <strong>Marque consultas como concluídas</strong> após o atendimento</li>
                    <li>• <strong>Atualize status de pagamento</strong> quando paciente pagar</li>
                  </ul>
                </div>

                <div className="p-5 bg-orange-50 border border-orange-200 rounded-xl">
                  <h3 className="text-xl font-bold text-orange-800 mb-3">4. Evitando Problemas Comuns</h3>
                  <ul className="space-y-2 text-base text-orange-700">
                    <li>• <strong>Não ignore Handoffs</strong> - pacientes estão esperando!</li>
                    <li>• <strong>Não altere configurações sem entender</strong> - pergunte ao suporte</li>
                    <li>• <strong>Confirme consultas 1 dia antes</strong> - reduz faltas</li>
                    <li>• <strong>Mantenha o prompt da IA atualizado</strong> - informações desatualizadas confundem pacientes</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* ==================== SUPORTE ==================== */}
            <section className="space-y-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <HelpCircle className="h-8 w-8 text-primary" />
                Precisa de Ajuda?
              </h2>

              <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                <p className="text-lg mb-4">
                  Se você tiver qualquer dúvida ou problema, não hesite em pedir ajuda:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                    <span className="text-lg"><strong>Documentação Técnica:</strong> Aba "Doc Dev" nas Configurações</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-primary" />
                    <span className="text-lg"><strong>Suporte:</strong> Entre em contato com a equipe técnica</span>
                  </div>
                </div>
              </div>

              <div className="text-center p-6 bg-muted/30 rounded-xl">
                <p className="text-lg text-muted-foreground">
                  Documentação atualizada em <strong>Novembro de 2025</strong>
                </p>
                <p className="text-base text-muted-foreground mt-2">
                  EvidenS CRM Navigator AI - Desenvolvido para facilitar a gestão da sua clínica
                </p>
              </div>
            </section>

          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default UserDocumentationTab;

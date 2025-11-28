import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, ArrowRight, Calculator, TrendingUp, Users, Clock, MessageSquare, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const [showCalculator, setShowCalculator] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            Cacao AI Clinics
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => setShowCalculator(true)} className="hover:bg-emerald-50">
              <Calculator className="mr-2 h-4 w-4" />
              Calculadora
            </Button>
            <Button asChild className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
              <a href="#audit">Agendar Auditoria</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-gray-900">
            Transforme o Caos do WhatsApp em{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Tratamentos de Alto Valor Agendados
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Cacao AI Clinics instala e opera uma recepcionista AI no WhatsApp + motor de follow-up 
            que tampa seus 3 maiores vazamentos de dinheiro: respostas lentas, no-shows e pacientes 
            que dizem "vou pensar".
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all" asChild>
              <a href="#audit">
                Agende sua Auditoria de Receita WhatsApp (30 min)
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50" onClick={() => setShowCalculator(true)}>
              <Calculator className="mr-2 h-5 w-5" />
              Veja Como Funciona
            </Button>
          </div>
        </div>
      </section>

      {/* The Money Leak Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-6">
            Sua Clínica Provavelmente Está Perdendo Milhares Por Mês no WhatsApp
          </h2>
          <p className="text-xl text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            Se você é como a maioria das clínicas de estética / dermatologia:
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="border-2 border-red-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Clock className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Respostas Lentas</h3>
                    <p className="text-gray-600">
                      Novos leads no WhatsApp esperam minutos ou horas por resposta
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Users className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Recepção Sobrecarregada</h3>
                    <p className="text-gray-600">
                      A recepção fica sobrecarregada e esquece de fazer follow-up
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">No-Shows e Cancelamentos</h3>
                    <p className="text-gray-600">
                      Deixam vagas vazias na agenda
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">"Vou Pensar"</h3>
                    <p className="text-gray-600">
                      Pacientes dizem "vou pensar" e nunca mais são contatados
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-red-300">
            <h3 className="text-2xl font-bold mb-4 text-center">Quanto Isso Custa?</h3>
            <p className="text-lg text-gray-600 mb-6 text-center">
              Mesmo uma clínica pequena com:
            </p>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">100-200</div>
                <div className="text-sm text-gray-600">Leads WhatsApp/mês</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">20-30%</div>
                <div className="text-sm text-gray-600">Taxa de no-show</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">R$1.500-3.000</div>
                <div className="text-sm text-gray-600">Ticket médio</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">R$15k-30k+</div>
                <div className="text-sm text-gray-600">Perda mensal</div>
              </div>
            </div>
            <div className="text-center">
              <Button size="lg" onClick={() => setShowCalculator(true)} className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg">
                <Calculator className="mr-2 h-5 w-5" />
                Calcule Sua Perda Exata
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-6">
            Instalamos um Motor de Receita de Pacientes que Funciona no WhatsApp
          </h2>
          <p className="text-xl text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            Cacao AI Clinics é um sistema feito-para-você que:
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-emerald-300 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Transforma mais novos leads em consultas agendadas</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Recepcionista AI WhatsApp 24/7 responde em segundos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Qualifica, responde FAQs e agenda direto na sua agenda</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-emerald-300 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Reduz no-shows e cancelamentos</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Lembretes inteligentes e confirmações</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Fluxos de reagendamento no mesmo dia para preencher lacunas</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-emerald-300 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Fecha mais consultas recentes e orçamentos abertos (0-90 dias)</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Sequências de nutrição e follow-up para pacientes "vou pensar"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Lembretes gentis para agendar, retornar ou finalizar tratamento</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-8">
            <p className="text-xl font-semibold mb-2">Nossa tecnologia parece uma plataforma de software.</p>
            <p className="text-xl font-semibold text-emerald-600">
              Nosso serviço parece contratar uma recepcionista e equipe de follow-up de classe mundial que nunca esquece.
            </p>
          </div>
        </div>
      </section>

      {/* Founding Clinics Program */}
      <section className="py-20 px-4 bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-block bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-2 rounded-full font-semibold mb-4">
              Programa Clínicas Fundadoras (Apenas as Primeiras 10)
            </div>
            <h2 className="text-4xl font-bold mb-4">O Que Você Recebe Como Clínica Fundadora</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Recepcionista AI WhatsApp Instalada',
                description: 'Conectamos seu WhatsApp Business, personalizamos fluxos de conversa e configuramos transferência humana.'
              },
              {
                title: 'CRM e Pipeline da Clínica',
                description: 'Cada lead em um só lugar, com estágios: Novo, Contatado, Consulta Agendada, Compareceu, Fechado, Perdido.'
              },
              {
                title: 'Agenda Multi-Médico & Recalls',
                description: 'Sincronizamos com seus calendários, gerenciamos disponibilidade e configuramos lembretes e regras de recall.'
              },
              {
                title: 'Fluxos de Follow-Up 0-90 Dias',
                description: 'Follow-up automático para consultas recentes e orçamentos abertos, para que nenhum paciente interessado seja esquecido.'
              },
              {
                title: 'Scorecard Mensal de Receita',
                description: 'Relatório simples: consultas extras e tratamentos de alto valor atribuíveis ao Cacao AI Clinics.'
              },
              {
                title: 'Setup e Treinamento White-Glove',
                description: 'Importamos seus leads existentes, personalizamos scripts no seu tom e treinamos sua equipe.'
              }
            ].map((feature, index) => (
              <Card key={index} className="border-2 border-emerald-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Preço Especial Fundador (Bloqueado Para Sempre)</h2>
            <p className="text-xl text-gray-600">Apenas para as primeiras 10 clínicas:</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-emerald-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-1 text-sm font-semibold">
                Clínicas 1-3
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-emerald-600 mb-2">R$ 1.500</div>
                  <div className="text-gray-600">/mês (bloqueado para sempre)</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Implementação única: R$ 3.000</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Todos os recursos incluídos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Preço bloqueado para sempre</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-1 text-sm font-semibold">
                Clínicas 4-10
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-emerald-600 mb-2">R$ 2.000</div>
                  <div className="text-gray-600">/mês (bloqueado para sempre)</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Implementação única: R$ 3.000</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Todos os recursos incluídos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Preço bloqueado para sempre</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-6">Clínicas futuras começarão com preços mais altos.</p>
            <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-green-600 text-lg px-8 py-6" asChild>
              <a href="#audit">
                Candidate-se para Ser uma Clínica Fundadora
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4">
              Nossa Garantia de 90 Dias "Mais Pacientes ou Trabalhamos de Graça"
            </h2>
          </div>

          <Card className="border-2 border-green-300">
            <CardContent className="p-8">
              <p className="text-lg mb-6">Desde que você:</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Conecte as ferramentas acordadas (WhatsApp, calendários, etc.)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Deixe o sistema funcionar sem a equipe quebrar os fluxos</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Compareça às suas chamadas de otimização agendadas</span>
                </li>
              </ul>
              <div className="bg-green-100 border-2 border-green-300 rounded-lg p-6 text-center">
                <p className="text-lg font-semibold mb-2">
                  Se você não vir pelo menos [X consultas extras agendadas OU R$Y em tratamentos adicionais] em 90 dias,
                </p>
                <p className="text-xl font-bold text-green-700">
                  continuamos trabalhando de graça até você ver.
                </p>
              </div>
              <p className="text-center mt-6 text-gray-600 font-semibold">
                Sem letras miúdas. Ganhamos quando você ganha.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            Do Caos ao Controle em 3 Passos
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Auditoria de Receita WhatsApp (30 minutos)',
                description: 'Mapeamos seu fluxo atual de leads, taxa de no-show e vitórias rápidas.'
              },
              {
                step: '2',
                title: 'Sprint de Implementação (2-3 semanas)',
                description: 'Conectamos sistemas, configuramos fluxos e entramos no ar.'
              },
              {
                step: '3',
                title: 'Otimização & Escala (Primeiros 90 dias)',
                description: 'Ajustamos conversas e follow-ups baseados em leads reais, depois reportamos resultados.'
              }
            ].map((item, index) => (
              <Card key={index} className="border-2 hover:border-emerald-300 transition-all">
                <CardContent className="p-6 text-center">
                  <div className="h-16 w-16 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">Para Quem É / Não É</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-green-300">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-green-700">✓ Para clínicas que:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Já recebem leads via WhatsApp / Instagram / Doctoralia</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Odeiam ver vagas vazias na agenda</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Querem mais tratamentos de alto valor sem contratar mais equipe</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-300">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-red-700">✗ Não é para clínicas que:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 text-2xl mt-0.5 flex-shrink-0">✗</span>
                    <span>Não rastreiam leads de forma alguma</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 text-2xl mt-0.5 flex-shrink-0">✗</span>
                    <span>Não vão responder quando escalarmos oportunidades quentes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 text-2xl mt-0.5 flex-shrink-0">✗</span>
                    <span>Só querem "mais um software barato"</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="audit" className="py-20 px-4 bg-gradient-to-br from-emerald-600 to-green-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">
            Quer Ver Quanto de Receita Você Está Deixando no WhatsApp?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Agende uma Auditoria de Receita WhatsApp gratuita e mostraremos exatamente quanto de receita extra 
            o Cacao AI Clinics poderia desbloquear na sua clínica nos próximos 90 dias.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-6">
              <Calendar className="mr-2 h-5 w-5" />
              Agendar Minha Auditoria
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6" onClick={() => setShowCalculator(true)}>
              <Calculator className="mr-2 h-5 w-5" />
              Calcular Minha Perda Agora
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Cacao AI Clinics</h3>
              <p className="text-gray-400">
                Transformando caos do WhatsApp em tratamentos de alto valor agendados
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Calculadora</a></li>
                <li><a href="#audit" className="hover:text-white">Agendar Auditoria</a></li>
                <li><Link to="/login" className="hover:text-white">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-gray-400">
                <li>contato@cacaoai.com</li>
                <li>WhatsApp: +55 (11) 99999-9999</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2024 Cacao AI Clinics. Todos os direitos reservados.</p>
            <p className="mt-2 text-sm">
              Programa Clínicas Fundadoras: Primeiras 10 clínicas com preço especial bloqueado para sempre
            </p>
          </div>
        </div>
      </footer>

      {/* Calculator Modal - Will be implemented separately */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Calculadora de Vazamento de Receita</h3>
                <Button variant="ghost" onClick={() => setShowCalculator(false)}>✕</Button>
              </div>
              <p className="text-gray-600 mb-6">
                A calculadora será implementada na próxima fase. Por enquanto, agende uma auditoria para 
                descobrir quanto você está perdendo.
              </p>
              <Button className="w-full" asChild>
                <a href="#audit">Agendar Auditoria Gratuita</a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

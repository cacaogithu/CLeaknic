import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CalculatorFormData {
  clinicName: string;
  contactEmail: string;
  monthlyLeads: number;
  avgResponseTime: string;
  noShowRate: number;
  avgTicket: number;
  openBudgets: number;
}

interface CalculationResults {
  lostFromSlowResponse: number;
  lostFromNoShows: number;
  lostFromOpenBudgets: number;
  totalMonthlyLoss: number;
  recoverablePotential: number;
  annualLossProjection: number;
}

export default function RevenueCalculator({ onClose }: { onClose?: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [reportHTML, setReportHTML] = useState<string>('');
  
  const [formData, setFormData] = useState<CalculatorFormData>({
    clinicName: '',
    contactEmail: '',
    monthlyLeads: 0,
    avgResponseTime: 'hours',
    noShowRate: 0,
    avgTicket: 0,
    openBudgets: 0
  });

  const updateFormData = (field: keyof CalculatorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateResults = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-revenue-report', {
        body: formData
      });

      if (error) throw error;

      setResults(data.calculations);
      setReportHTML(data.reportHTML);
      setStep(3);
    } catch (error) {
      console.error('Error calculating results:', error);
      alert('Erro ao calcular resultados. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-receita-${formData.clinicName.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) => 
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-2xl mx-auto">
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Calculadora de Vazamento de Receita WhatsApp</CardTitle>
            <p className="text-gray-600">
              Descubra quanto dinheiro sua clínica está perdendo todo mês
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="clinicName">Nome da Clínica</Label>
              <Input
                id="clinicName"
                value={formData.clinicName}
                onChange={(e) => updateFormData('clinicName', e.target.value)}
                placeholder="Ex: Clínica Estética Bella"
              />
            </div>

            <div>
              <Label htmlFor="contactEmail">Email de Contato</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => updateFormData('contactEmail', e.target.value)}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <Label htmlFor="monthlyLeads">Quantos leads WhatsApp você recebe por mês?</Label>
              <Input
                id="monthlyLeads"
                type="number"
                value={formData.monthlyLeads || ''}
                onChange={(e) => updateFormData('monthlyLeads', parseInt(e.target.value) || 0)}
                placeholder="Ex: 150"
              />
            </div>

            <div>
              <Label htmlFor="avgResponseTime">Qual o tempo médio de resposta?</Label>
              <Select 
                value={formData.avgResponseTime}
                onValueChange={(value) => updateFormData('avgResponseTime', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Imediato (segundos)</SelectItem>
                  <SelectItem value="minutes">Minutos</SelectItem>
                  <SelectItem value="hours">Horas</SelectItem>
                  <SelectItem value="next_day">Próximo dia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="noShowRate">Taxa de no-show atual (%)</Label>
              <Input
                id="noShowRate"
                type="number"
                value={formData.noShowRate || ''}
                onChange={(e) => updateFormData('noShowRate', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 25"
                min="0"
                max="100"
              />
            </div>

            <div>
              <Label htmlFor="avgTicket">Ticket médio (R$)</Label>
              <Input
                id="avgTicket"
                type="number"
                value={formData.avgTicket || ''}
                onChange={(e) => updateFormData('avgTicket', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 2500"
              />
            </div>

            <div>
              <Label htmlFor="openBudgets">Quantos orçamentos abertos você tem por mês?</Label>
              <Input
                id="openBudgets"
                type="number"
                value={formData.openBudgets || ''}
                onChange={(e) => updateFormData('openBudgets', parseInt(e.target.value) || 0)}
                placeholder="Ex: 50"
              />
              <p className="text-sm text-gray-500 mt-1">
                Pacientes que receberam orçamento mas ainda não fecharam
              </p>
            </div>

            <div className="flex gap-4">
              {onClose && (
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancelar
                </Button>
              )}
              <Button 
                onClick={() => setStep(2)} 
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                disabled={!formData.clinicName || !formData.contactEmail || formData.monthlyLeads === 0}
              >
                Calcular Minha Perda
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Revisão dos Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Clínica:</span>
                <span className="font-semibold">{formData.clinicName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Leads/mês:</span>
                <span className="font-semibold">{formData.monthlyLeads}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tempo de resposta:</span>
                <span className="font-semibold">
                  {formData.avgResponseTime === 'immediate' ? 'Imediato' :
                   formData.avgResponseTime === 'minutes' ? 'Minutos' :
                   formData.avgResponseTime === 'hours' ? 'Horas' : 'Próximo dia'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxa de no-show:</span>
                <span className="font-semibold">{formData.noShowRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ticket médio:</span>
                <span className="font-semibold">{formatCurrency(formData.avgTicket)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Orçamentos abertos/mês:</span>
                <span className="font-semibold">{formData.openBudgets}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Voltar
              </Button>
              <Button 
                onClick={calculateResults} 
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  'Gerar Relatório'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && results && (
        <Card>
          <CardHeader>
            <CardTitle>Sua Auditoria de Vazamento de Receita</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 rounded-lg text-center">
              <p className="text-lg mb-2">Você está deixando na mesa mensalmente:</p>
              <p className="text-4xl font-bold">{formatCurrency(results.totalMonthlyLoss)}</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-lg">Detalhamento dos Vazamentos:</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Respostas Lentas/Perdidas</p>
                    <p className="text-sm text-gray-600">Leads que desistem por falta de resposta rápida</p>
                  </div>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(results.lostFromSlowResponse)}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">No-Shows Recuperáveis</p>
                    <p className="text-sm text-gray-600">Consultas que poderiam ser remarcadas</p>
                  </div>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(results.lostFromNoShows)}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Orçamentos Não Fechados</p>
                    <p className="text-sm text-gray-600">"Vou pensar" que nunca mais voltam</p>
                  </div>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(results.lostFromOpenBudgets)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-300">
              <h3 className="font-bold text-lg mb-2">💰 Oportunidade de Recuperação</h3>
              <p className="text-gray-600 mb-3">
                Com o Cacao AI Clinics, recuperando apenas 30-40% desses vazamentos, sua clínica pode adicionar:
              </p>
              <p className="text-3xl font-bold text-emerald-600 mb-2">
                {formatCurrency(results.recoverablePotential)}/mês
              </p>
              <p className="font-semibold">
                Isso representa {formatCurrency(results.recoverablePotential * 12)} por ano
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Nota:</strong> Esta análise usa premissas conservadoras baseadas em dados de mercado. 
                Os valores reais podem variar dependendo do seu processo atual e da implementação do sistema.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={downloadReport}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar Relatório Completo
              </Button>
              
              <Button 
                variant="outline"
                className="w-full"
                asChild
              >
                <a href={`mailto:${formData.contactEmail}?subject=Sua Auditoria de Vazamento de Receita WhatsApp&body=Confira o relatório anexo`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar por Email
                </a>
              </Button>

              <Button 
                className="w-full"
                asChild
              >
                <a href="#audit">
                  Agendar Auditoria Gratuita de 30 Minutos
                </a>
              </Button>

              {onClose && (
                <Button variant="ghost" onClick={onClose}>
                  Fechar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

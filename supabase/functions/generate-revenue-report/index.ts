import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface CalculatorInput {
  clinicName: string
  monthlyLeads: number
  avgResponseTime: string // "immediate", "minutes", "hours", "next_day"
  noShowRate: number // percentage
  avgTicket: number
  openBudgets: number
  contactEmail: string
}

interface RevenueCalculation {
  lostFromSlowResponse: number
  lostFromNoShows: number
  lostFromOpenBudgets: number
  totalMonthlyLoss: number
  recoverablePotential: number // 30-40% of total
  annualLossProjection: number
}

serve(async (req) => {
  try {
    const { 
      clinicName, 
      monthlyLeads, 
      avgResponseTime, 
      noShowRate, 
      avgTicket, 
      openBudgets,
      contactEmail 
    }: CalculatorInput = await req.json()

    // Calculate revenue leaks based on conservative assumptions
    const calculations = calculateRevenueLoss({
      monthlyLeads,
      avgResponseTime,
      noShowRate,
      avgTicket,
      openBudgets
    })

    // Generate HTML report
    const htmlReport = generateHTMLReport(clinicName, calculations, {
      monthlyLeads,
      avgResponseTime,
      noShowRate,
      avgTicket,
      openBudgets
    })

    // Store lead in database
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Store calculator lead
    await supabase.from('calculator_leads').insert({
      clinic_name: clinicName,
      contact_email: contactEmail,
      monthly_leads: monthlyLeads,
      avg_response_time: avgResponseTime,
      no_show_rate: noShowRate,
      avg_ticket: avgTicket,
      open_budgets: openBudgets,
      calculated_loss: calculations.totalMonthlyLoss,
      recoverable_potential: calculations.recoverablePotential
    })

    return new Response(
      JSON.stringify({
        success: true,
        calculations,
        reportHTML: htmlReport
      }),
      {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      },
    )
  }
})

function calculateRevenueLoss(input: {
  monthlyLeads: number
  avgResponseTime: string
  noShowRate: number
  avgTicket: number
  openBudgets: number
}): RevenueCalculation {
  const { monthlyLeads, avgResponseTime, noShowRate, avgTicket, openBudgets } = input

  // Conservative loss percentages based on response time
  const responseTimeLossRate = {
    immediate: 0.05,    // 5% loss even with immediate response
    minutes: 0.15,      // 15% loss with minutes delay
    hours: 0.30,        // 30% loss with hours delay
    next_day: 0.50      // 50% loss with next day response
  }

  const lossRate = responseTimeLossRate[avgResponseTime as keyof typeof responseTimeLossRate] || 0.30

  // Calculate losses
  const lostFromSlowResponse = monthlyLeads * lossRate * avgTicket
  
  // No-shows: assume 60% are recoverable with proper system
  const recoverableNoShows = (noShowRate / 100) * monthlyLeads * 0.60
  const lostFromNoShows = recoverableNoShows * avgTicket
  
  // Open budgets: assume 25% are closable with follow-up
  const closeableRate = 0.25
  const lostFromOpenBudgets = openBudgets * closeableRate * avgTicket

  const totalMonthlyLoss = lostFromSlowResponse + lostFromNoShows + lostFromOpenBudgets
  
  // Conservative recovery: 35% of total loss
  const recoverablePotential = totalMonthlyLoss * 0.35
  
  const annualLossProjection = totalMonthlyLoss * 12

  return {
    lostFromSlowResponse: Math.round(lostFromSlowResponse),
    lostFromNoShows: Math.round(lostFromNoShows),
    lostFromOpenBudgets: Math.round(lostFromOpenBudgets),
    totalMonthlyLoss: Math.round(totalMonthlyLoss),
    recoverablePotential: Math.round(recoverablePotential),
    annualLossProjection: Math.round(annualLossProjection)
  }
}

function generateHTMLReport(
  clinicName: string, 
  calculations: RevenueCalculation,
  inputs: any
): string {
  const formatCurrency = (value: number) => 
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auditoria de Vazamento de Receita - ${clinicName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 18px;
            opacity: 0.9;
        }
        .content {
            padding: 40px;
        }
        .clinic-name {
            font-size: 24px;
            color: #667eea;
            margin-bottom: 30px;
            text-align: center;
            font-weight: 600;
        }
        .big-number {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            margin: 30px 0;
        }
        .big-number .label {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 10px;
        }
        .big-number .value {
            font-size: 48px;
            font-weight: bold;
        }
        .breakdown {
            margin: 30px 0;
        }
        .breakdown-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            margin: 15px 0;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        .breakdown-item .label {
            font-size: 16px;
            color: #555;
            flex: 1;
        }
        .breakdown-item .value {
            font-size: 24px;
            font-weight: bold;
            color: #f5576c;
        }
        .opportunity {
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
        }
        .opportunity h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 22px;
        }
        .opportunity p {
            font-size: 16px;
            line-height: 1.6;
            color: #555;
        }
        .opportunity .recovery-value {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            margin: 15px 0;
        }
        .cta {
            background: #667eea;
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin: 30px 0;
        }
        .cta h3 {
            margin-bottom: 10px;
        }
        .cta p {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .cta-button {
            display: inline-block;
            background: white;
            color: #667eea;
            padding: 15px 40px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: bold;
            font-size: 18px;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: scale(1.05);
        }
        .footer {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            color: #666;
            font-size: 14px;
        }
        .inputs-summary {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .inputs-summary h4 {
            margin-bottom: 15px;
            color: #667eea;
        }
        .input-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .input-row:last-child {
            border-bottom: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Auditoria de Vazamento de Receita WhatsApp</h1>
            <p>Análise Personalizada para sua Clínica</p>
        </div>
        
        <div class="content">
            <div class="clinic-name">${clinicName}</div>
            
            <div class="big-number">
                <div class="label">Você está deixando na mesa mensalmente:</div>
                <div class="value">${formatCurrency(calculations.totalMonthlyLoss)}</div>
            </div>

            <div class="inputs-summary">
                <h4>Dados da sua clínica:</h4>
                <div class="input-row">
                    <span>Leads WhatsApp/mês:</span>
                    <strong>${inputs.monthlyLeads}</strong>
                </div>
                <div class="input-row">
                    <span>Tempo de resposta:</span>
                    <strong>${inputs.avgResponseTime === 'immediate' ? 'Imediato' : 
                             inputs.avgResponseTime === 'minutes' ? 'Minutos' :
                             inputs.avgResponseTime === 'hours' ? 'Horas' : 'Próximo dia'}</strong>
                </div>
                <div class="input-row">
                    <span>Taxa de no-show:</span>
                    <strong>${inputs.noShowRate}%</strong>
                </div>
                <div class="input-row">
                    <span>Ticket médio:</span>
                    <strong>${formatCurrency(inputs.avgTicket)}</strong>
                </div>
                <div class="input-row">
                    <span>Orçamentos abertos/mês:</span>
                    <strong>${inputs.openBudgets}</strong>
                </div>
            </div>

            <div class="breakdown">
                <h3 style="margin-bottom: 20px; color: #667eea;">Detalhamento dos Vazamentos:</h3>
                
                <div class="breakdown-item">
                    <div class="label">
                        <strong>Respostas Lentas/Perdidas</strong><br>
                        <small>Leads que desistem por falta de resposta rápida</small>
                    </div>
                    <div class="value">${formatCurrency(calculations.lostFromSlowResponse)}</div>
                </div>

                <div class="breakdown-item">
                    <div class="label">
                        <strong>No-Shows Recuperáveis</strong><br>
                        <small>Consultas que poderiam ser remarcadas</small>
                    </div>
                    <div class="value">${formatCurrency(calculations.lostFromNoShows)}</div>
                </div>

                <div class="breakdown-item">
                    <div class="label">
                        <strong>Orçamentos Não Fechados</strong><br>
                        <small>"Vou pensar" que nunca mais voltam</small>
                    </div>
                    <div class="value">${formatCurrency(calculations.lostFromOpenBudgets)}</div>
                </div>
            </div>

            <div class="opportunity">
                <h3>💰 Oportunidade de Recuperação</h3>
                <p>Com o Cacao AI Clinics, recuperando apenas 30-40% desses vazamentos, sua clínica pode adicionar:</p>
                <div class="recovery-value">${formatCurrency(calculations.recoverablePotential)}/mês</div>
                <p><strong>Isso representa ${formatCurrency(calculations.recoverablePotential * 12)} por ano</strong> em receita adicional, usando os leads que você já tem.</p>
            </div>

            <div style="background: #fff3cd; padding: 20px; border-radius: 10px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <p style="color: #856404; font-size: 14px; line-height: 1.6;">
                    <strong>⚠️ Nota:</strong> Esta análise usa premissas conservadoras baseadas em dados de mercado. 
                    Os valores reais podem variar dependendo do seu processo atual e da implementação do sistema.
                </p>
            </div>

            <div class="cta">
                <h3>Quer tapar esses vazamentos?</h3>
                <p>Agende uma Auditoria de Receita WhatsApp de 30 minutos e vamos mostrar exatamente como o Cacao AI Clinics pode funcionar na sua clínica.</p>
                <a href="https://calendly.com/cacao-ai-clinics/revenue-audit" class="cta-button">AGENDAR AUDITORIA GRATUITA</a>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <p style="color: #666; font-size: 14px; margin-bottom: 10px;">Ou responda este email com "IMPLEMENTAR" para falar com nossa equipe</p>
            </div>
        </div>

        <div class="footer">
            <p><strong>Cacao AI Clinics</strong></p>
            <p>Transformando caos do WhatsApp em tratamentos de alto valor agendados</p>
            <p style="margin-top: 15px; font-size: 12px;">
                Programa Clínicas Fundadoras: Primeiras 10 clínicas com preço especial bloqueado para sempre
            </p>
        </div>
    </div>
</body>
</html>
  `
}

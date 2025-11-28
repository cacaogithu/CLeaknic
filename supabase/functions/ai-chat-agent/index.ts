import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createSupabaseClient } from "../_shared/createSupabaseClient.ts";

// Cache para deduplicação de requisições (em memória, não persistente)
const processedMessages = new Map<string, number>();
const CACHE_TTL = 10000; // 10 segundos de validade para o cache

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// System prompt - backticks inside are escaped with backslash
const BASE_SYSTEM_PROMPT = `# IDENTIDADE E PAPEL

Você representa a **EviDenS Clinic – por Gabriel Lazzeri Cortez & Associados**, uma clínica de dermatologia em São Paulo especializada em tratamentos de pele, cabelo e unhas.

Sua personalidade: amigável, curiosa, empática, profissional e acolhedora. Você NÃO é vendedora - você é parte da equipe clínica que genuinamente quer entender a necessidade do paciente para oferecer o melhor cuidado.

# CONTEXTO DA MARCA (REBRANDING)
"É com muita alegria que compartilho uma novidade: nosso Private Office cresceu e agora passa a se chamar EviDenS Clinic – por Gabriel Lazzeri Cortez & Associados. Essa mudança de marca reflete nossa evolução e abre espaço para a chegada de mais médicos dermatologistas de excelência, ampliando nossa equipe e fortalecendo ainda mais o cuidado personalizado que já oferecemos. Nosso compromisso segue o mesmo: oferecer dermatologia de alto nível, com ciência, tecnologia e humanidade."

Data de hoje: {{CURRENT_DATE}}

---

# REGRAS CRÍTICAS DE COMUNICAÇÃO

## PACIENTES EXISTENTES vs LEADS NOVOS

**Se o paciente já é conhecido (is_existing_patient = true):**
- Cumprimente de forma familiar: "Olá [NOME]! Que bom ter você de volta 😊"
- Vá direto ao ponto: "Como posso te ajudar hoje?"
- NÃO pergunte dados que já temos (nome, CPF, email, data de nascimento)
- Mencione consultas anteriores se relevante: "Vi que você esteve aqui em [data]. Como está se sentindo?"
- Foco: agilidade e continuidade do relacionamento

**Se é um LEAD NOVO (is_existing_patient = false):**
- Cumprimente com boas-vindas: "Olá! Seja bem-vindo(a) à EviDenS Clinic 🌿"
- Siga o fluxo NEPQ completo
- Colete todos os dados necessários antes de agendar
- Construa rapport desde o início

**⚠️ NUNCA invente nomes**.
- Que está "consultando o sistema"
- Que está "salvando dados"
- Que está "atualizando informações"
- Que está "registrando interesse"
- Que está "usando ferramentas"
- Qualquer aspecto técnico do sistema

Essas ações devem ser invisíveis para o cliente. Mantenha a conversa natural e fluida.

1. **NUNCA invente nomes**.
2. **NUNCA mencione dificuldades técnicas**.

---

# REGRAS FUNDAMENTAIS

## SEMPRE:
- Atue como parte da equipe da clínica (use "nós", "a gente", "nossa equipe")
- Faça UMA pergunta por vez
- Mantenha mensagens curtas (máximo 1-3 frases)

## NUNCA:
- SE APRESENTE COMO "ASSISTENTE VIRTUAL" OU "ROBÔ"
- Use markdown (asteriscos, underlines, negrito)
- Ofereça opções numeradas (1, 2, 3)
- Faça múltiplas perguntas na mesma mensagem
- Peça desculpas e transfira imediatamente quando alguém reclamar
- "Palestre" sobre a clínica ou procedimentos
- Responda seco com preço/tabela
- **CRÍTICO:** Mencione que está usando ferramentas, Vector Store, ou que houve erros técnicos.

## Filosofia da Clínica
"Acreditamos em uma dermatologia ética e baseada em estudos científicos capaz de promover bem-estar e melhora da autoestima."

---

# TRATAMENTOS DISPONÍVEIS (Nomes e Categorias)

**CRÍTICO:** Use a ferramenta 'retrieve_knowledge' para obter os detalhes e descrições desses tratamentos. Esta lista é apenas para contexto.

## 🌟 Tricologia (Tratamentos Capilares)
- Laser Fotona Capilar
- Mesoterapia Capilar
- Tricoscopia FOTOFINDER
- Trichoscale AI

## ✨ Cosmiatria (Tratamentos Estéticos)
- Liftera
- Toxina Botulínica (Botox)
- Preenchimento com Ácido Hialurônico
- Bioestimulador de Colágeno

## 🔬 Laser e Tecnologia
- Laser Fotona
- Laser Cutera XEO

## 🏥 Dermatologia Clínica
- Check-up de Pintas
- Cirurgia Dermatológica

---

## COMO USAR ESSAS INFORMAÇÕES

### ✅ FAÇA:
- Mencione os tratamentos quando o paciente perguntar "o que vocês fazem?"
- Use para direcionar a conversa: "Você está buscando algo para cabelo, pele ou procedimento estético?"
- Confirme se o tratamento mencionado pelo paciente está disponível

### ❌ NÃO FAÇA:
- Explicar detalhes técnicos dos procedimentos (use a ferramenta 'retrieve_knowledge' para isso)
- Prometer resultados específicos
- Dar orientações médicas
- Comparar tratamentos
- Recomendar tratamentos específicos sem consulta

### 📝 Exemplos de uso:

**Paciente:** "Vocês fazem botox?"
**Bot:** "Sim! Fazemos aplicação de toxina botulínica (botox). Você está pensando em tratar rugas ou linhas de expressão? Há quanto tempo isso te incomoda?"

**Paciente:** "O que vocês fazem para queda de cabelo?"
**Bot:** "Temos vários tratamentos para queda de cabelo: laser capilar, mesoterapia, e análise avançada com tricoscopia. Você está com queda há quanto tempo?"

---

# ⚠️ REGRA CRÍTICA SOBRE HANDOFF

**QUANDO VOCÊ USAR A FERRAMENTA handoff_to_human:**

1. **SUA MENSAGEM AO CLIENTE DEVE SER SIMPLES E CURTA**
   - ✅ CORRETO: "Vou chamar a Eliana para finalizar os detalhes! Ela já vai te atender!"
   - ❌ ERRADO: Incluir nome, CPF, nascimento, email, e outros dados do cliente na mensagem

2. **OS DADOS DO CLIENTE SÃO ENVIADOS AUTOMATICAMENTE**
   - O sistema AUTOMATICAMENTE envia todos os dados (nome, CPF, nascimento, email, tratamento, médico) para a Eliana
   - Você NÃO precisa e NÃO DEVE incluir esses dados na sua mensagem ao cliente
   - A mensagem formatada com os dados é APENAS para a Eliana, não para o cliente

3. **EXEMPLO DO QUE VOCÊ DEVE FAZER:**
   - Cliente: "Ok, vou agendar"
   - Você chama as ferramentas: schedule_appointment e handoff_to_human
   - Sua resposta ao cliente: "Perfeito! Agendamento confirmado para [data] às [hora]. Vou chamar a Eliana para finalizar os detalhes!"
   - O sistema envia automaticamente para Eliana todos os dados formatados

---

# CONFIRMAÇÃO DE CONSULTAS

Quando um paciente responder a uma mensagem de confirmação automática:
- Identifique se é uma **confirmação** (sim, confirmo, ok, vou sim, confirmar, estarei lá) ou **cancelamento** (não, cancelar, não vou, desmarcar, não posso ir)
- Use a ferramenta confirm_appointment com o tipo correto
- Seja empático e natural:
  - **Se confirmar**: "Ótimo! Sua consulta está confirmada para [data] às [hora]. Te esperamos! 😊"
  - **Se cancelar**: "Entendi, vou cancelar sua consulta. Quando quiser reagendar, é só me avisar!"
- Se a resposta for ambígua, pergunte: "Você está confirmando ou cancelando a consulta?"

**Paciente:** "Quanto custa o preenchimento?"
**Bot:** "O valor do preenchimento varia conforme a área e quantidade de produto. A consulta inicial é R$ 750, onde o Dr. Gabriel avalia seu caso e passa o orçamento detalhado. Faz sentido agendar uma avaliação?"

---

# 💳 FORMAS DE PAGAMENTO E VALORES

**A clínica aceita:**
- Pix
- Cartão de crédito
- Cartão de débito
- Transferência bancária

**Valor da consulta inicial:** R$ 750,00

**Quando mencionar:**
- Cliente pergunta sobre pagamento, pix, formas de pagamento
- Após confirmar agendamento (se o cliente perguntar)

**Script:**
"Aceitamos Pix, cartão de crédito/débito e transferência bancária. Qualquer dúvida sobre pagamento, a Eliana vai te explicar direitinho quando finalizar seu agendamento!"

---

# ⚠️ REGRA CRÍTICA - EVITAR AGENDAMENTOS DUPLICADOS

**NUNCA crie o mesmo agendamento duas vezes!**

Após criar um agendamento com a ferramenta schedule_appointment:
- Se o cliente responder apenas "confirma", "sim", "ok", "perfeito", "pode ser", isso é apenas uma confirmação verbal
- NÃO chame a ferramenta schedule_appointment novamente
- Responda: "Perfeito! Seu agendamento está confirmado. Vou chamar a Eliana."
- Depois chame a ferramenta handoff_to_human (apenas se ainda não chamou)

---

# ⚠️ REGRA CRÍTICA - ORDEM OBRIGATÓRIA DAS FERRAMENTAS

**NUNCA chame schedule_appointment sem ter chamado update_client ANTES!**

A ordem correta é:
1. **FASE 6**: Coletar todos os dados (nome, CPF, data nascimento, email)
2. **Cliente confirma dados**
3. **IMEDIATAMENTE chamar update_client** com todos os dados (OBRIGATÓRIO)
4. **Aguardar confirmação** de que update_client foi bem-sucedido
5. **SÓ ENTÃO** ir para FASE 7 e chamar get_calendar_availability
6. Cliente escolhe horário
7. **SÓ ENTÃO** chamar schedule_appointment

**Se você tentar chamar schedule_appointment sem ter dados do cliente:**
- Você receberá um erro
- Terá que voltar para FASE 6 e coletar os dados
- Isso desperdiça tempo e frustra o cliente

---

# FRAMEWORK NEPQ - 7 FASES

Siga estas fases em ordem.

## FASE 1: CONEXÃO (Tom: amigável/curioso)

**Meta:** Tirar o foco de "preço/convênio" e entender POR QUE a pessoa buscou atendimento AGORA (desejo/problema).

**Script padrão:**
"Olá! Seja bem-vindo à EviDenS Clinic – por Gabriel Lazzeri Cortez & Associados. Para direcionarmos seu atendimento da melhor forma, você está buscando cuidados para pele, cabelo, unhas ou algum procedimento específico?"

**⚠️ FLUXO OBRIGATÓRIO - PERGUNTAR SOBRE MÉDICO LOGO APÓS O PROBLEMA:**

1. Cliente menciona o problema/procedimento (ex: "acne", "queda de cabelo", "manchas")
2. **IMEDIATAMENTE após entender o problema, pergunte sobre o médico:**
   "Perfeito! Você prefere consultar com o Dr. Gabriel ou o Dr. Rômulo?"
3. Cliente escolhe o médico
4. GUARDE o médico escolhido mentalmente e NÃO pergunte novamente
5. Continue para FASE 2 (anamnese)

**⚠️ REGRA CRÍTICA - NUNCA REPITA A PERGUNTA:**
- Se o cliente JÁ mencionou "Dr. Gabriel", "Gabriel", "Dr. Rômulo" ou "Rômulo" em QUALQUER mensagem anterior → USE esse médico e NUNCA pergunte novamente
- Se você já perguntou sobre o médico nesta conversa → NÃO pergunte de novo
- O médico só é perguntado UMA VEZ, logo no início

**⚠️ REGRA CRÍTICA - NUNCA DIGA "AGENDADO" NESTA FASE:**
- Quando o cliente escolhe o médico, você está APENAS coletando preferência
- NUNCA diga "agendado", "agendamento confirmado", "marcado", ou similares
- Responda apenas: "Ótimo! Há quanto tempo [problema] te incomoda?"
- O agendamento SÓ acontece na FASE 7 (após coletar TODOS os dados e chamar schedule_appointment)

**Exemplos:**
- Cliente: "Quero tratar acne" → Você: "Perfeito! Você prefere consultar com o Dr. Gabriel ou o Dr. Rômulo?"
- Cliente: "Gabriel" → Você: "Ótimo! Há quanto tempo a acne te incomoda?" (NÃO diga "agendado")
- Cliente: "Quero marcar consulta capilar com ele" → Você: "Perfeito! Há quanto tempo a questão capilar vem te incomodando?" (NÃO diga "agendado")
- Cliente depois menciona "Gabriel" de novo → Você: NÃO pergunta sobre médico, continua a conversa

---

## FASE 2: ANAMNESE/QUEIXA (Tom: curioso/diagnóstico)

**Meta:** Sair do genérico → entender queixa, duração, tentativas, impacto.

**Perguntas guia (Faca 2 a 3 dessas perguntas, E NÃO MAIS DO QUE ISSO!!!):**

1. "É mais couro cabeludo/queda, manchas, acne, cicatriz, pintas… qual seria o foco?"

2. "Isso começou quando?"

3. "Você já tentou o quê até agora?"

4. "Te atrapalha em quais momentos?" (espelho, trabalho, fotos)

5. "De 0 a 10, o quanto te incomoda hoje?"

**IMPORTANTE:** Quebre em blocos com pausas. NÃO faça interrogatório longo.

**⚠️ SE CLIENTE PERGUNTAR SOBRE AGENDAMENTO ANTES DA HORA:**
Se o cliente perguntar "quando foi agendado?", "já está marcado?", "como funciona?" ANTES da FASE 7:
1. Esclareça rapidamente: "Ainda não agendamos, estou só entendendo seu caso primeiro."
2. **IMEDIATAMENTE volte para a FASE 2** - NÃO diga "vou buscar detalhes" ou desvie
3. Continue com a próxima pergunta de anamnese naturalmente
4. Exemplo: "Ainda não agendamos. Você já tentou algum tratamento até agora?"

---

## FASE 3: PROBLEMAS & IMPACTO (Tom: preocupado/empático)

**Meta:** Fazer o paciente ver o custo de NÃO agir (sem dramatizar demais).

**Perguntas (máximo 2):**

1. "Se nada mudar nos próximos 3-6 meses, o que piora pra você?"

2. "Como isso tem te feito se sentir no dia a dia?"

**⚠️ REGISTRAR INTERESSE EM TRATAMENTO:**
Quando o cliente mencionar interesse específico em algum tratamento (ex: "quero fazer Laser Fotona", "me interessa o preenchimento"), você DEVE:
1. Chamar a ferramenta log_interest com:
   - treatment: nome exato do tratamento mencionado
   - interestLevel: estimativa de 1-10 baseada no engajamento do cliente
2. NÃO mencione que está registrando o interesse
3. Continue a conversa naturalmente

---

## FASE 4: VISÃO e COMPROMISSO (Tom: afirmativo/leve desafio)

**Meta:** Confirmar que o que a EviDenS entrega é o que a pessoa quer (auto-persuasão).

**Perguntas:**

1. "Se a gente resolvesse isso e você voltasse a… [ex.: se sentir confortável sem maquiagem / reduzir queda], o que mudaria pra você?"

2. "Faz sentido te explicar como funciona a primeira consulta e já ver horários?"

---

## FASE 5: PITCH DA CONSULTA (Tom: confiante/sereno)

**Estrutura:** Problema → Entregável → Benefício → Engajamento

**Script:**
"Pelo que entendi, [resumo em 1 linha: ex. 'queda acentuada há 6 meses apesar de tônico'].

Na EviDenS, a 1ª consulta é minuciosa: dermatoscopia/tricoscopia digital quando indicado, análise de histórico e plano de tratamento individualizado. O objetivo é sair com diagnóstico claro e caminho de resultado seguro.

É isso que você está buscando agora?"

---

## FASE 6: COLETA DE DADOS

**Meta:** Coletar informações obrigatórias para o agendamento.

### Pedir todos logo de uma vez. Se não demora muito e fica muito til-taka. pede e espera eles responderem

**Dados obrigatórios:**
1. Nome completo
2. Data de nascimento (DD/MM/AAAA)
3. CPF (XXX.XXX.XXX-XX)
4. Email
5. Procedimento/área de interesse (já coletado nas fases anteriores)
6. Médico de escolha (JÁ COLETADO NA FASE 1 - NÃO PERGUNTE NOVAMENTE)

**Scripts:**
- "Consegue nos passar seu nome completo, CPF, data de nascimento, e email?"

**⚠️ IMPORTANTE:**
- **NÃO pergunte sobre médico aqui** - isso já foi feito na FASE 1
- O médico já foi escolhido no início da conversa
- Use o médico que o cliente já informou anteriormente

**Confirmação:**
"Deixa eu confirmar: [Nome], nascido em [Data], CPF [CPF], email [Email], interessado em [Procedimento] com o Dr. [Gabriel ou Romulo]. Está tudo certo?"

**⚠️ AÇÃO OBRIGATÓRIA APÓS CONFIRMAÇÃO:**
Assim que o cliente confirmar que os dados estão corretos, você DEVE:
1. Chamar a ferramenta update_client com TODOS os dados coletados:
   - name: nome completo do cliente
   - cpf: CPF no formato XXX.XXX.XXX-XX
   - birthDate: data de nascimento no formato DD/MM/AAAA
   - email: email do cliente
   - treatmentInterest: procedimento/área de interesse mencionado

2. NÃO mencione ao cliente que está "salvando dados" ou "atualizando sistema"
3. Apenas continue o fluxo naturalmente para a FASE 7 (agendamento)

---

## FASE 7: AGENDAMENTO E FINALIZAÇÃO

**Quando fazer:**
- Você coletou TODAS as 6 informações obrigatórias (nome, nascimento, CPF, email, área de interesse, médico)
- Cliente confirmou os dados

**⚠️ REGRAS CRÍTICAS:**

1. **NUNCA diga "agendado" antes de REALMENTE agendar:**
   - SÓ use "agendado", "confirmado", "marcado" DEPOIS de:
     * Chamar get_calendar_availability E encontrar horários
     * Cliente escolher horário específico
     * Chamar schedule_appointment E receber sucesso
   - ANTES disso: "Vou verificar horários disponíveis", "Deixa eu consultar a agenda"

2. **SEMPRE chame get_calendar_availability:**
   - NUNCA diga "vou procurar horários" sem CHAMAR a ferramenta
   - Toda menção a "verificar/procurar horários" → CHAME imediatamente
   - Use o médico escolhido na FASE 1

**Fluxo sequencial:**

1. **Verificar disponibilidade:**
   - **⚠️ REGRA CRÍTICA - NUNCA OFEREÇA TODOS OS HORÁRIOS:**
     * NUNCA liste todos os horários disponíveis do dia
     * Máximo 3 horários ESPAÇADOS na semana (ex: segunda, quarta, sexta)
     * OU 1 horário no dia seguinte se o cliente perguntar para "amanhã"
     * Se não houver horários próximos, sugira semana que vem
   
   - **Cliente NÃO mencionou data específica:** 
     * Chame get_calendar_availability(doctorName) - retorna slots dos próximos 60 dias
     * SELECIONE apenas 3 horários diferentes da lista (ex: 1º disponível, meio da semana, fim da semana)
     * "Encontrei horários disponíveis. Você prefere terça (26/11) às 9h, quinta (28/11) às 14h, ou sexta (29/11) às 10h?"
   
   - **Cliente pediu "amanhã" ou dia específico:**
     * Chame get_calendar_availability(date, doctorName) - retorna slots daquele dia
     * Ofereça APENAS 1 horário (o primeiro disponível ou melhor horário do dia)
     * "Para amanhã, tenho às 9h disponível. Funciona pra você?"
   
   - **Se não houver horários nos próximos 2-3 dias:**
     * "Essa semana está bem cheia. Tenho disponibilidade na próxima semana. Posso te mostrar horários para semana que vem?"

2. **Cliente escolhe horário**

3. **Agendar:**
   - schedule_appointment(date, time, procedure, doctor)
   - Aguarde confirmação de sucesso
   - SÓ ENTÃO: "Perfeito! Agendamento confirmado para [data] às [hora] com Dr. [nome]."

4. **Transferir para Eliana:**
   - handoff_to_human
   - "Vou chamar a Eliana para finalizar os detalhes. Ela já vai te atender!"

**Exemplo prático:**
- Cliente: "Quero consulta amanhã"
  1. CHAME get_calendar_availability com data de amanhã
  2. Se disponível: "Para amanhã tenho às 9h. Funciona pra você?"
  3. CHAME schedule_appointment se cliente confirmar
  4. CHAME handoff_to_human

- Cliente: "Tem algum horário disponível?"
  1. CHAME get_calendar_availability (sem data específica)
  2. SELECIONE 3 horários espaçados: "Tenho terça às 9h, quinta às 14h ou sexta às 10h. Qual prefere?"
  3. Cliente escolhe um horário
  4. CHAME schedule_appointment
  5. CHAME handoff_to_human

**Se cliente pedir humano a qualquer momento:**
- handoff_to_human imediatamente
- "Perfeito! Vou chamar a Eliana para te atender agora mesmo!"

---

P: "Bom dia"
Você: "Olá! Seja bem-vindo à EviDenS Clinic. Como podemos cuidar de você hoje? Está buscando atendimento para pele, cabelo, unhas ou algum procedimento específico?"
P: "Cabelo caindo muito"
Você: "Perfeito. Com qual médico você prefere consultar: Dr. Gabriel ou Dr. Rômulo?"
P: "Com o Dr. Gabriel"
Você: "Ótimo. Há quanto tempo essa queda vem acontecendo?"
ANAMNESE / NEPQ
P: "Uns 6 meses"
Você: "Você já tentou algum tratamento nesse período?"
P: "Sim, tônico mas não funcionou"
Você: "De 0 a 10, qual o nível de incômodo pra você hoje?"
P: "8"
Você: "Se nada mudar nos próximos meses, o que você acha que pode piorar?"
P: "Tenho medo de ficar com falhas"
Você: "E se a gente conseguir reduzir essa queda, o que muda pra você?"
SEGUIMENTO
P: "Eu ia ficar mais tranquila"
Você: "Perfeito. Agora só preciso de quatro dados rápidos para seguir com seu agendamento: nome completo, data de nascimento, CPF e e-mail. Pode me enviar?"
P: "Maria Silva"
P: "02/06/1990"
P: "109.473.906-50"
P: "maria@email.com"
Você: "Perfeito, Maria! Você tem alguma preferência de horário? Manhã ou tarde?"
P: "Prefiro de manhã"
Você: (USA FERRAMENTA: get_calendar_availability)
"Temos disponibilidade na terça às 9h, quarta às 10h e sexta às 8h. Qual funciona melhor pra você?"
P: "Terça às 9h"
Você: (USA FERRAMENTA: schedule_appointment para criar o evento no Google Calendar)
"Perfeito! Agendamento confirmado para terça às 9h com Dr. Gabriel."
Você: (USA FERRAMENTA: handoff_to_human)
"Vou chamar a Eliana para finalizar seu agendamento. Ela já vai te atender!"
---

# ✅ **Frase de confirmação FINAL (PERFEITA)**

**Voce:**
"Maravilha, Maria. Então ficou assim: consulta na terça às 8h com o Dr. Gabriel. Vou chamar a Eliana para confirmar o pagamento e te enviar todas as orientações, tudo bem?"

**P:** "Tudo bem"

---

# 💥 **Agora sim você chama as ferramentas (Create Conversas + Handoff)**

E aqui vão **todos os dados exatos** que devem ser enviados.

---

# 🔧 **1. Dados para o HANDOFF (mensagem para Eliana)**

**⚠️ ATENÇÃO: Esta mensagem formatada é enviada AUTOMATICAMENTE pelo sistema para a Eliana via WhatsApp. VOCÊ NÃO DEVE incluir esses dados na sua resposta ao cliente!**

**Sua mensagem ao cliente deve ser simples:** "Vou chamar a Eliana para finalizar os detalhes!"

**O sistema envia automaticamente para a Eliana:**

\\\`\\\`\\\`
👤 Nome: Maria Silva
📅 Nascimento: 02/06/1990
📄 CPF: 109.473.906-50
🏥 Cirurgia ou Área de Interesse: Tratamento capilar (queda de cabelo)
👨‍⚕️ Médico escolhido: Dr. Gabriel
📞 Telefone: [número vindo do webhook]
📧 Email: maria@email.com

✍️ Usuário esperando finalizar agendamento!
\\\`\\\`\\\`

Observações:

* **Área de Interesse:** use o que coletou no NEPQ ("queda de cabelo")
* **Telefone:** SEMPRE vem do webhook
* **Médico escolhido:** "Dr. Gabriel" ou "Dr. Rômulo"
* Não inventa nada, não resume errado
* **IMPORTANTE:** Esses dados são para o sistema, NÃO para sua mensagem ao cliente

---

# 🔧 **2. Dados para o Create Conversas (Supabase)**

Como você configurou o nó:

\\\`\\\`\\\`
phone: [do webhook]
summary: "Paciente Maria Silva relatou queda de cabelo há 6 meses, tentou tônico sem melhora, escolheu consulta com Dr. Gabriel."
appointment_scheduled: true
appointment_date: 2025-11-18T08:00:00-03:00   (exemplo)
handoff_ativo: true
handoff_start_at: now()
doctor_name: "Dr. Gabriel"
\\\`\\\`\\\`

Explicações rápidas:

### ✔ \\\`phone\\\`

Sempre puxar do webhook do Z-API.

### ✔ \\\`summary\\\`

Curto (1–2 frases), factual, nunca opinativo.
Algo como:

> "Paciente relatou queda de cabelo há 6 meses, tentou tônico sem melhora, fechou consulta com Dr. Gabriel."

### ✔ \\\`appointment_scheduled = true\\\`

Porque houve agendamento.

### ✔ \\\`appointment_date\\\`

Use o horário exato que o cliente escolheu e que veio do Google Calendar.

### ✔ \\\`handoff_ativo = true\\\`

Porque a conversa terminou e agora Eliana assume.

### ✔ \\\`handoff_start_at = agora()\\\`

Você pode usar timestamp atual ou deixar o modelo preencher.

### ✔ \\\`doctor_name = "Dr. Gabriel"\\\`

Bate com sua constraint CHECK no Supabase.

---

# 🎯 **Resultado:**

O fluxo fica perfeito, limpo, sem nenhuma inconsistência — e o agente passa:

* para Eliana → todos os dados necessários
* para o Supabase → todos os dados necessários do histórico

Sem duplicar, sem deixar faltando nada.

---

# CONTEXTO E MEMÓRIA

Você tem acesso ao histórico completo da conversa. Use para:
- NÃO repetir perguntas
- Manter contexto
- Ser mais natural
- Personalizar respostas
- Lembrar informações já coletadas
- Usar o nome do cliente naturalmente ao longo da conversa

---

# LEMBRETES FINAIS

1. **Siga o NEPQ** - não pule fases, a não ser que necessário.
2. **Uma pergunta por vez** - não bombardeie
3. **Sem markdown** - texto limpo e natural
4. **Não saia do script** apenas quando reclamarem, abra a exceção e chame a Eliana
5. **Colete TODAS as 5 informações** antes do agendamento, a não ser que o cliente esteja impaciente.
6. **Use o formato EXATO** no handoff (quando aplicável)
7. **Seja empática e curiosa** - não robotizada
8. **Foque no problema/impacto** antes de falar de solução
9. **Mantenha-se no personagem** - você é uma assistente prestativa
10. **Na dúvida, transfira para Eliana** - melhor prevenir que remediar
12. **Sempre confirme dados** antes de agendar
13. **Seja natural ao usar ferramentas** - não mencione que está "consultando o sistema"
14. **Lembre-se do nome do cliente** e use-o ao longo da conversa
15. **Mantenha o tom empático** mesmo em situações de objeção
16. **Use "confirmada" ou "confirmado"** de acordo com o gênero do paciente
17. **Mencione tratamentos disponíveis** quando relevante, mas não detalhe procedimentos
18. **Reforce a filosofia da clínica** quando apropriado: "dermatologia ética baseada em ciência"

## CONFIRMAÇÃO DE CONSULTAS

Quando um paciente responder a uma mensagem de confirmação:
- Identifique se é uma confirmação (sim, confirmo, ok, vou sim) ou cancelamento (não, cancelar, não vou)
- Use a tool \`confirm_appointment\` para processar
- Seja empático: 
  - Se confirmar: "Ótimo! Sua consulta está confirmada. Te esperamos no dia X às Yh! 😊"
  - Se cancelar: "Entendi. Vou cancelar sua consulta. Quando quiser reagendar, é só me avisar!"
`;

const tools = [
  {
    type: "function",
    function: {
      name: "handoff_to_human",
      description: "Transfere o atendimento para um atendente humano",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Motivo da transferência" },
        },
        required: ["reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_appointment",
      description: "Agenda uma consulta",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Data (YYYY-MM-DD)" },
          time: { type: "string", description: "Horário (HH:MM)" },
          procedure: { type: "string", description: "Procedimento" },
          doctorName: { type: "string", description: "Médico preferido" },
        },
        required: ["date", "time", "procedure"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_client",
      description: "Atualiza informações do cliente",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          cpf: { type: "string" },
          birthDate: { type: "string" },
          email: { type: "string" },
          treatmentInterest: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_interest",
      description: "Registra interesse em tratamento",
      parameters: {
        type: "object",
        properties: {
          treatment: { type: "string" },
          interestLevel: { type: "number" },
        },
        required: ["treatment"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "confirm_appointment",
      description: "Confirma ou cancela um agendamento quando o paciente responde ao lembrete de confirmação automática",
      parameters: {
        type: "object",
        properties: {
          appointment_date: {
            type: "string",
            description: "Data do agendamento (formato YYYY-MM-DD)",
          },
          confirmation_type: {
            type: "string",
            enum: ["confirm", "cancel"],
            description: "Se paciente confirmou ('confirm') ou cancelou ('cancel')",
          },
        },
        required: ["appointment_date", "confirmation_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_appointment",
      description: "Cancela um agendamento existente no Google Calendar",
      parameters: {
        type: "object",
        properties: {
          appointment_date: {
            type: "string",
            description: "Data do agendamento a ser cancelado (formato YYYY-MM-DD)",
          },
          appointment_time: {
            type: "string",
            description: "Horário do agendamento (formato HH:MM, opcional se doctor_name for informado)",
          },
          doctor_name: {
            type: "string",
            description: "Nome do médico (opcional se appointment_time for informado)",
          },
          cancellation_reason: {
            type: "string",
            description: "Motivo do cancelamento informado pelo cliente",
          },
        },
        required: ["appointment_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_appointment",
      description: "Atualiza um agendamento existente no Google Calendar (data, horário ou procedimento)",
      parameters: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "ID do evento no Google Calendar (obtido de appointments.google_event_id)",
          },
          newDate: {
            type: "string",
            description: "Nova data do agendamento (formato YYYY-MM-DD), opcional",
          },
          newTime: {
            type: "string",
            description: "Novo horário do agendamento (formato HH:MM), opcional",
          },
          newProcedure: {
            type: "string",
            description: "Novo procedimento, opcional",
          },
        },
        required: ["eventId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_calendar_availability",
      description:
        "Consulta horários disponíveis no Google Calendar. Se fornecer uma data específica, retorna todos os horários livres daquele dia. Se NÃO fornecer data, busca nos próximos 60 dias e retorna os 3 primeiros horários disponíveis com data e hora completas.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Data específica para verificar (YYYY-MM-DD). OPCIONAL: se não informar, busca próximos 60 dias" },
          doctorName: { type: "string", description: "Nome do médico (Dr. Gabriel ou Dr. Rômulo)" },
        },
        required: ["doctorName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "retrieve_knowledge",
      description:
        "Busca informações detalhadas sobre procedimentos, preços, horários e políticas da clínica na Base de Conhecimento (OpenAI Vector Store). Use quando o cliente perguntar sobre algo que não está no prompt principal.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "A pergunta exata do cliente ou o tópico que precisa ser pesquisado na Base de Conhecimento.",
          },
        },
        required: ["query"],
      },
    },
  },
];

// NOTE: Removed duplicate confirm_appointment tool definition (was at lines 679-697)
// The correct definition is at line 565-586 with proper descriptions

// n8n Webhook helper functions
async function getN8nAvailability(startDate: string, endDate: string, supabaseClient: any) {
  const startTime = Date.now();
  console.log("[n8n] Getting availability:", { startDate, endDate });

  try {
    const N8N_WEBHOOK_BASE = Deno.env.get("N8N_WEBHOOK_BASE_URL") || "https://rafatrial.app.n8n.cloud/webhook";
    
    // Build URL with query parameters for GET request
    const url = new URL(`${N8N_WEBHOOK_BASE}/get`);
    url.searchParams.append("start", startDate);
    url.searchParams.append("end", endDate);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const responseTime = Date.now() - startTime;
    const statusCode = response.status;

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[n8n] Failed to get availability:", errorText);

      // Log failed request
      await supabaseClient.from("n8n_webhook_logs").insert({
        endpoint: "get",
        request_params: { start: startDate, end: endDate },
        response_data: null,
        response_time_ms: responseTime,
        status_code: statusCode,
        success: false,
        error_message: errorText,
      });

      throw new Error(`Failed to get calendar availability: ${errorText}`);
    }

    const data = await response.json();
    console.log("[n8n] Availability response:", data);

    // Log successful request
    await supabaseClient.from("n8n_webhook_logs").insert({
      endpoint: "get",
      request_params: { start: startDate, end: endDate },
      response_data: data,
      response_time_ms: responseTime,
      status_code: statusCode,
      success: true,
      error_message: null,
    });

    return data;
  } catch (error) {
    console.error("[n8n] Error getting availability:", error);
    throw error;
  }
}

// ============================================
// GOOGLE CALENDAR API - SUBSTITUINDO N8N
// ============================================

async function createJWT(serviceAccountEmail: string, privateKey: string): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountEmail,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Import private key
  const pemContents = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  // Sign
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function createGoogleCalendarEvent(
  startDateTime: string,
  endDateTime: string,
  summary: string,
  attendeeEmail: string | null,
  supabase: any
) {
  const startTime = Date.now();
  console.log("[GCal] Creating event:", { startDateTime, endDateTime, summary, attendeeEmail });

  try {
    const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID');
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    
    if (!calendarId || !serviceAccountJson) {
      throw new Error("Missing Google Calendar credentials");
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const serviceAccountEmail = serviceAccount.client_email;
    const privateKey = serviceAccount.private_key;

    // Criar JWT token para autenticação
    const accessToken = await createJWT(serviceAccountEmail, privateKey);

    // Criar evento no Google Calendar (SEM attendees - service accounts não podem convidar)
    const event = {
      summary: summary,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Sao_Paulo'
      },
      description: attendeeEmail ? `Cliente: ${attendeeEmail}` : ''
    };

    console.log('[GCal] 🔍 EVENTO A SER ENVIADO (JSON stringify):', JSON.stringify(event, null, 2));
    console.log('[GCal] 🔍 Verificando se tem attendees no objeto:', 'attendees' in event ? 'SIM - PROBLEMA!' : 'NÃO - OK');

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );

    const responseTime = Date.now() - startTime;
    const statusCode = response.status;

    if (!response.ok) {
      const error = await response.text();
      console.error('[GCal] ❌ Failed to create event:', error);
      
      // Log failed request
      await supabase.from("n8n_webhook_logs").insert({
        endpoint: "google_calendar_create",
        request_params: event,
        response_data: null,
        response_time_ms: responseTime,
        status_code: statusCode,
        success: false,
        error_message: error,
      });

      throw new Error(`Google Calendar API error: ${error}`);
    }

    const data = await response.json();
    console.log('[GCal] ✅ Event created:', data.id);

    // Log successful request
    await supabase.from("n8n_webhook_logs").insert({
      endpoint: "google_calendar_create",
      request_params: event,
      response_data: data,
      response_time_ms: responseTime,
      status_code: statusCode,
      success: true,
      error_message: null,
    });

    return data;
    
  } catch (error) {
    console.error('[GCal] ❌ Error creating event:', error);
    throw error;
  }
}

async function createN8nAppointment(
  eventData: {
    start: string;
    end: string;
    summary: string;
    attendee?: string;
  },
  supabaseClient: any,
) {
  const startTime = Date.now();
  console.log("[n8n] Creating appointment:", eventData);

  try {
    const N8N_WEBHOOK_BASE = Deno.env.get("N8N_WEBHOOK_BASE_URL") || "https://rafatrial.app.n8n.cloud/webhook";
    
    const response = await fetch(`${N8N_WEBHOOK_BASE}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });

    const responseTime = Date.now() - startTime;
    const statusCode = response.status;

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[n8n] Failed to create appointment:", errorText);

      // Log failed request
      await supabaseClient.from("n8n_webhook_logs").insert({
        endpoint: "create",
        request_params: eventData,
        response_data: null,
        response_time_ms: responseTime,
        status_code: statusCode,
        success: false,
        error_message: errorText,
      });

      throw new Error(`Failed to create appointment: ${errorText}`);
    }

    const rawData = await response.json();
    // N8n returns an array, extract first element
    const data = Array.isArray(rawData) ? rawData[0] : rawData;
    console.log("[n8n] Appointment created - Full response:", JSON.stringify(rawData, null, 2));
    console.log("[n8n] Google Event ID from n8n:", data.id);

    // Log successful request
    await supabaseClient.from("n8n_webhook_logs").insert({
      endpoint: "create",
      request_params: eventData,
      response_data: data,
      response_time_ms: responseTime,
      status_code: statusCode,
      success: true,
      error_message: null,
    });

    // Normalize response: n8n returns 'id', but we use 'eventId' internally
    return {
      ...data,
      eventId: data.id, // Map n8n's 'id' to our 'eventId'
    };
  } catch (error) {
    console.error("[n8n] Error creating appointment:", error);
    throw error;
  }
}

async function deleteN8nAppointment(eventId: string, supabaseClient: any) {
  const startTime = Date.now();
  console.log("[n8n] Deleting appointment:", eventId);

  try {
    const N8N_WEBHOOK_BASE = Deno.env.get("N8N_WEBHOOK_BASE_URL") || "https://rafatrial.app.n8n.cloud/webhook";
    
    const response = await fetch(`${N8N_WEBHOOK_BASE}/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event_id: eventId }),
    });

    const responseTime = Date.now() - startTime;
    const statusCode = response.status;

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[n8n] Failed to delete appointment:", errorText);

      // Log failed request
      await supabaseClient.from("n8n_webhook_logs").insert({
        endpoint: "delete",
        request_params: { event_id: eventId },
        response_data: null,
        response_time_ms: responseTime,
        status_code: statusCode,
        success: false,
        error_message: errorText,
      });

      throw new Error(`Failed to delete appointment: ${errorText}`);
    }

    const data = await response.json();
    console.log("[n8n] Appointment deleted:", data);

    // Log successful request
    await supabaseClient.from("n8n_webhook_logs").insert({
      endpoint: "delete",
      request_params: { event_id: eventId },
      response_data: data,
      response_time_ms: responseTime,
      status_code: statusCode,
      success: true,
      error_message: null,
    });

    return data;
  } catch (error) {
    console.error("[n8n] Error deleting appointment:", error);
    throw error;
  }
}

async function updateN8nAppointment(
  eventId: string,
  startDateTime: Date,
  endDateTime: Date,
  summary: string,
  attendee: string | undefined,
  supabaseClient: any,
) {
  const startTime = Date.now();
  console.log("[n8n] Updating appointment:", { eventId, startDateTime, endDateTime, summary, attendee });

  try {
    const requestBody = {
      eventId: eventId,
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      summary: summary,
      attedee: attendee, // Note: typo in n8n workflow parameter name
    };

    const response = await fetch("https://rafatrial.app.n8n.cloud/webhook/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseTime = Date.now() - startTime;
    const statusCode = response.status;

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[n8n] Failed to update appointment:", errorText);

      // Log failed request
      await supabaseClient.from("n8n_webhook_logs").insert({
        endpoint: "update",
        request_params: requestBody,
        response_data: null,
        response_time_ms: responseTime,
        status_code: statusCode,
        success: false,
        error_message: errorText,
      });

      throw new Error(`Failed to update appointment: ${errorText}`);
    }

    const data = await response.json();
    console.log("[n8n] Appointment updated:", data);

    // Log successful request
    await supabaseClient.from("n8n_webhook_logs").insert({
      endpoint: "update",
      request_params: requestBody,
      response_data: data,
      response_time_ms: responseTime,
      status_code: statusCode,
      success: true,
      error_message: null,
    });

    return data;
  } catch (error) {
    console.error("[n8n] Error updating appointment:", error);
    throw error;
  }
}

// Tool executor function
async function executeToolCall(toolCall: any, phone: string, supabase: any) {
  const { name, arguments: args } = toolCall.function;
  
  let parsedArgs;
  try {
    parsedArgs = JSON.parse(args);
  } catch (error) {
    console.error(`[executeToolCall] Invalid JSON in tool arguments for ${name}:`, args);
    return { 
      success: false, 
      message: "Vou verificar isso com a Eliana, ela já vai te atender!",
      requiresHandoff: true
    };
  }

  console.log(`[executeToolCall] Tool: ${name}, Phone: ${phone}`);

  // ✅ VALIDAÇÃO: Se for schedule_appointment, logar estado atual do cliente
  if (name === "schedule_appointment") {
    const { data: clientCheck } = await supabase
      .from("clientes")
      .select("name, email, cpf, birth_date")
      .eq("phone", phone)
      .maybeSingle();
    
    console.log("[executeToolCall] Client data before scheduling:", {
      hasClient: !!clientCheck,
      hasName: !!clientCheck?.name,
      hasEmail: !!clientCheck?.email,
      hasCPF: !!clientCheck?.cpf,
      hasBirthDate: !!clientCheck?.birth_date
    });
  }

  try {
    switch (name) {
      case "update_client": {
        const { name: clientName, cpf, birthDate, email, treatmentInterest } = parsedArgs;

        // Get or create conversation
        const { data: conversa, error: conversaError } = await supabase
          .from("conversas")
          .select("*")
          .eq("phone", phone)
          .single();

        if (conversaError && conversaError.code !== "PGRST116") {
          throw conversaError;
        }

        const conversaId = conversa?.id;

        // Convert birthDate from DD/MM/YYYY to YYYY-MM-DD if needed
        let formattedBirthDate = birthDate;
        if (birthDate && birthDate.includes("/")) {
          const [day, month, year] = birthDate.split("/");
          formattedBirthDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
          console.log(`[update_client] Converted birthDate from ${birthDate} to ${formattedBirthDate}`);
        }

        // Update or create client using atomic upsert to prevent race conditions
        const clientData: any = {
          phone,
          ...(clientName && { name: clientName }),
          ...(cpf && { cpf }),
          ...(formattedBirthDate && { birth_date: formattedBirthDate }),
          ...(email && { email }),
          ...(treatmentInterest && { treatment_interest: treatmentInterest }),
          updated_at: new Date().toISOString(),
        };

        const { data: upsertedClient, error: upsertError } = await supabase
          .from("clientes")
          .upsert(clientData, {
            onConflict: "phone",
            ignoreDuplicates: false,
          })
          .select()
          .single();

        if (upsertError) throw upsertError;

        // Link cliente_id back to conversation
        if (conversaId && upsertedClient) {
          await supabase
            .from("conversas")
            .update({ cliente_id: upsertedClient.id })
            .eq("id", conversaId);
        }

        // Update conversation summary
        const { data: recentMessages } = await supabase
          .from("mensagens")
          .select("message, sender")
          .eq("phone", phone)
          .order("created_at", { ascending: false })
          .limit(10);

        if (recentMessages && recentMessages.length > 0) {
          const summary = recentMessages
            .reverse()
            .map((msg: any) => `${msg.sender}: ${msg.message}`)
            .join(" | ");

          await supabase
            .from("conversas")
            .update({ summary, updated_at: new Date().toISOString() })
            .eq("phone", phone);
        }

        // Log decision
        if (conversaId) {
          await supabase.from("ai_decision_log").insert({
            conversa_id: conversaId,
            decision_type: "update_client",
            decision_data: parsedArgs,
            created_at: new Date().toISOString(),
          });
        }

        return { success: true, message: "Cliente atualizado com sucesso" };
      }

      case "handoff_to_human": {
        const { reason } = parsedArgs;
        console.log("[HANDOFF] Handoff requested:", { phone, reason });

        const { data: conversa } = await supabase.from("conversas").select("*").eq("phone", phone).single();

        // Buscar dados do cliente para o handoff
        const { data: client } = await supabase
          .from("clientes")
          .select("name, birth_date, cpf, email, treatment_interest")
          .eq("phone", phone)
          .maybeSingle();

        // Buscar último agendamento para determinar médico preferido
        const { data: lastAppointment } = await supabase
          .from("appointments")
          .select("doctor_id, doctors(name)")
          .eq("phone", phone)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Determinar médico para o handoff
        let doctorName = "Não informado";
        if (conversa?.doctor_name) {
          doctorName = conversa.doctor_name;
          console.log(`[HANDOFF] Doctor from conversation: ${doctorName}`);
        } else if (lastAppointment?.doctors?.name) {
          doctorName = lastAppointment.doctors.name;
          console.log(`[HANDOFF] Doctor from last appointment: ${doctorName}`);
        } else {
          // Default para Dr. Gabriel se não houver histórico
          doctorName = "Dr. Gabriel";
          console.log(`[HANDOFF] Using default doctor: ${doctorName}`);
        }

        if (conversa) {
          // ✅ VERIFICAR SE JÁ EXISTE HANDOFF ATIVO
          if (conversa.handoff_ativo && conversa.handoff_block_until) {
            const blockUntil = new Date(conversa.handoff_block_until);
            const now = new Date();

            // Se o handoff ainda está ativo e não expirou, não cria duplicado
            if (blockUntil > now) {
              console.log(`[HANDOFF] ⚠️ Handoff já existe e está ativo até ${blockUntil.toISOString()}. Ignorando duplicata.`);
              return {
                success: true,
                message: "Handoff já está ativo. Atendente será notificado.",
                alreadyActive: true
              };
            }
          }

          // Block AI for 2 hours when handoff is triggered
          const now = new Date();
          const blockUntil = new Date(now.getTime() + 2 * 60 * 60 * 1000);

          // Atualizar conversa com doctor_name
          await supabase
            .from("conversas")
            .update({
              handoff_ativo: true,
              handoff_block_until: blockUntil.toISOString(),
              handoff_started_at: now.toISOString(),
              handoff_reason: reason,
              doctor_name: doctorName, // ✅ Setar doctor_name no handoff
            })
            .eq("phone", phone);

          console.log(`[HANDOFF] ✅ Handoff activated for ${phone} with doctor ${doctorName}. Block until: ${blockUntil.toISOString()}`);

          await supabase.from("ai_decision_log").insert({
            conversa_id: conversa.id,
            decision_type: "handoff_to_human",
            decision_data: { ...parsedArgs, doctor_name: doctorName },
            created_at: new Date().toISOString(),
          });
        }

        // Formatar dados do cliente para o handoff
        const clientName = client?.name || "Não informado";
        const birthDate = client?.birth_date
          ? new Date(client.birth_date).toLocaleDateString("pt-BR")
          : "Não informado";
        const cpf = client?.cpf || "Não informado";
        const treatmentInterest = client?.treatment_interest || conversa?.treatment_mentioned || "Não informado";
        const email = client?.email || "Não informado";

        // Timestamp formatado
        const timestamp = new Date().toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });

        // Prepare handoff notification com o formato completo
        const handoffNumber = "5511949128259"; // Número da Eliana
        const handoffMessage = `🚨 HANDOFF
📱 ${phone}
💬 

👤 Nome: ${clientName}
📅 Nascimento: ${birthDate}
📄 CPF: ${cpf}
🏥 Cirurgia ou Área de Interesse: ${treatmentInterest}
👨‍⚕️ Médico escolhido: ${doctorName}
📞 Telefone: ${phone}
📧 Email: ${email}

✍️ ${reason}

⏰ ${timestamp}`;

        // ✅ ENVIAR HANDOFF VIA WHATSAPP PARA ELIANA
        for (let attempt = 1; attempt <= 3; attempt++) {
          const { error } = await supabase.from("message_queue").insert({
            phone: handoffNumber,
            message: handoffMessage,
            priority: 1,
            status: "pending",
          });

          if (!error) {
            console.log(`[HANDOFF] ✅ Notification sent to Eliana (${handoffNumber})`);
            break;
          }
          
          if (attempt === 3) {
            console.error(`[HANDOFF] ❌ Failed to send after 3 attempts`);
            await supabase.from("system_alerts").insert({
              type: "handoff_failed",
              phone,
              details: `Failed to send handoff to Eliana: ${error.message}`,
              resolved: false,
            });
          }
          await new Promise((r) => setTimeout(r, 2000 * attempt));
        }

        // Log handoff event in n8n_webhook_logs for monitoring
        await supabase.from("n8n_webhook_logs").insert({
          endpoint: "handoff_notification",
          request_params: { phone, reason, handoff_number: handoffNumber },
          response_data: { sent: true },
          success: true,
          status_code: 200,
          response_time_ms: 0,
        });

        return { success: true, message: "Handoff ativado" };
      }

      case "schedule_appointment": {
        const { date, time, procedure, doctorName } = parsedArgs;

        // ✅ VALIDAÇÃO OBRIGATÓRIA: Verificar se cliente existe e tem dados completos
        const { data: client, error: clientError } = await supabase
          .from("clientes")
          .select("name, email, cpf, birth_date")
          .eq("phone", phone)
          .maybeSingle();

        // 🚫 BLOQUEAR agendamento se não tiver dados obrigatórios
        if (!client || !client.name || !client.cpf || !client.birth_date || !client.email) {
          console.error("[schedule_appointment] ❌ Dados do cliente incompletos ou inexistentes");
          
          const missingFields = [];
          if (!client?.name) missingFields.push("nome completo");
          if (!client?.cpf) missingFields.push("CPF");
          if (!client?.birth_date) missingFields.push("data de nascimento");
          if (!client?.email) missingFields.push("email");
          
          return {
            success: false,
            message: `Antes de agendar, preciso confirmar alguns dados com você: ${missingFields.join(", ")}. Consegue me passar essas informações?`,
            requiresDataCollection: true,
            missingFields: {
              name: !client?.name,
              cpf: !client?.cpf,
              birth_date: !client?.birth_date,
              email: !client?.email
            }
          };
        }

        // ✅ Se passou validação, continuar com agendamento
        console.log("[schedule_appointment] ✅ Cliente validado:", client.name);

        // Caso 12: Validação de parâmetros
        const errors: string[] = [];
        if (!phone) errors.push("Telefone");
        if (!date) errors.push("Data");
        if (!time) errors.push("Horário");
        if (!doctorName) errors.push("Médico");
        if (!procedure) errors.push("Procedimento");

        // Validar formato de data (aceita DD/MM/YYYY ou YYYY-MM-DD)
        const isValidBRDate = /^\d{2}\/\d{2}\/\d{4}$/.test(date);
        const isValidISODate = /^\d{4}-\d{2}-\d{2}$/.test(date);
        if (date && !isValidBRDate && !isValidISODate) {
          errors.push("Data inválida (use DD/MM/YYYY ou YYYY-MM-DD)");
        }

        // Validar formato de hora (HH:MM)
        if (time && !/^\d{2}:\d{2}$/.test(time)) {
          errors.push("Horário inválido (use HH:MM)");
        }

        if (errors.length > 0) {
          console.error("[Validation] Invalid appointment data:", errors);

          return {
            success: false,
            message: `Ainda preciso de algumas informações para agendar: ${errors.join(", ")}. Pode me informar?`,
            requiresRetry: true,
          };
        }

        const { data: conversa } = await supabase.from("conversas").select("*").eq("phone", phone).single();

        // Parse date and time to create proper ISO datetime
        // Detectar formato: YYYY-MM-DD (ISO) ou DD/MM/YYYY (BR)
        let day: string, month: string, year: string;

        if (date.includes("-")) {
          // Formato ISO: YYYY-MM-DD
          [year, month, day] = date.split("-");
          console.log(`[schedule_appointment] Convertendo de ISO (${date}) para BR: ${day}/${month}/${year}`);
        } else {
          // Formato BR: DD/MM/YYYY
          [day, month, year] = date.split("/");
        }

        const [hours, minutes] = time.split(":");

        // Create datetime in São Paulo timezone without manual offset
        // JavaScript's Date correctly handles America/Sao_Paulo timezone including DST
        const dateParts = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        const timeParts = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;

        // Create date object from local time components
        const localDateTime = new Date(`${dateParts}T${timeParts}`);

        // Apply São Paulo offset (-3 hours from UTC, or -2 during DST)
        // This ensures the time is correct for São Paulo regardless of DST
        const saoPauloOffset = -3 * 60; // -180 minutes
        const startDateTime = new Date(localDateTime.getTime() - (localDateTime.getTimezoneOffset() - saoPauloOffset) * 60 * 1000);

        console.log(`[schedule_appointment] Creating appointment for São Paulo timezone:`);
        console.log(`  Input: ${dateParts} ${timeParts}`);
        console.log(`  Local DateTime: ${localDateTime.toISOString()}`);
        console.log(`  São Paulo DateTime: ${startDateTime.toISOString()}`);

        // Formato BR para exibição/logs
        const dateBR = `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
        // Formato ISO para banco de dados (YYYY-MM-DD)
        const dateISO = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

        // Default 1 hour appointment
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

        // ✅ VERIFICAR SE JÁ EXISTE AGENDAMENTO DUPLICADO (nos últimos 5 minutos)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: recentAppointment } = await supabase
          .from("appointments")
          .select("*")
          .eq("phone", phone)
          .eq("appointment_date", dateISO)
          .eq("appointment_time", time)
          .gte("created_at", fiveMinutesAgo)
          .maybeSingle();

        if (recentAppointment) {
          console.log("[schedule_appointment] 🚫 Agendamento duplicado detectado. Ignorando.");

          // Marcar timestamp de criação recente na conversa
          await supabase
            .from("conversas")
            .update({
              appointment_recently_created: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq("phone", phone);

          // 🔄 Sync to Google Sheets (even for duplicates, to ensure it's in the sheet)
          try {
            console.log('[Sheets Sync] Syncing duplicate appointment to Google Sheets');
            const sheetsUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-to-sheets`;
            const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
            
            await fetch(sheetsUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${serviceRoleKey}`
              },
              body: JSON.stringify({
                date: dateISO,
                time: time,
                patient_name: client?.name || phone,
                procedure: procedure,
                amount_paid: '',
                status: 'confirmada'
              })
            });
            console.log('[Sheets Sync] ✅ Duplicate appointment synced to Google Sheets');
          } catch (sheetError) {
            console.error('[Sheets Sync] Failed to sync duplicate to sheets:', sheetError);
          }

          return {
            success: true,
            message: "Seu agendamento já está confirmado!",
            data: {
              appointment_id: recentAppointment.id,
              duplicate_prevented: true,
              existing_appointment: {
                date: dateISO,
                time: time,
                doctor: doctorName
              }
            }
          };
        }

        // ✅ SUBSTITUIR N8N POR GOOGLE CALENDAR API DIRETO
        const maxRetries = 2;
        let gcalEvent = null;
        let appointmentCreated = false;
        let errorDetails = "";

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`[schedule_appointment] Attempt ${attempt}/${maxRetries} to create Google Calendar event`);

            gcalEvent = await createGoogleCalendarEvent(
              startDateTime.toISOString(),
              endDateTime.toISOString(),
              `${procedure} - ${client.name} - ${doctorName}`,
              client.email,
              supabase,
            );

            appointmentCreated = true;
            console.log(`[schedule_appointment] Google Calendar event created successfully (attempt ${attempt}):`, gcalEvent.id);
            break;
          } catch (error) {
            errorDetails = error instanceof Error ? error.message : String(error);
            console.error(`[schedule_appointment] Attempt ${attempt} failed:`, errorDetails);

            if (attempt < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 3000)); // 3s wait
            }
          }
        }

        if (!appointmentCreated) {
          console.error("❌ CRITICAL: N8n appointment creation failed after retries");

          // FALLBACK: Save to pending_appointments
          const { error: pendingError } = await supabase.from("pending_appointments").insert({
            phone: phone,
            date: dateISO,
            time: time,
            doctor: doctorName,
            procedure: procedure,
            status: "pending_n8n_sync",
            error: errorDetails,
          });

          if (pendingError) {
            console.error("[schedule_appointment] Failed to save to pending_appointments:", pendingError);
          }

          // Alert admin
          await supabase.from("system_alerts").insert({
            type: "n8n_appointment_failed",
            phone: phone,
            details: `Failed to create appointment: ${errorDetails}`,
            resolved: false,
          });

          // Return error that requires handoff
          return {
            success: false,
            message:
              "Vou transferir você para a Eliana finalizar seu agendamento. Ela já vai te atender!",
            requiresHandoff: true,
          };
        }

        console.log("[GCal] Event created:", gcalEvent);

        // Get doctor_id from doctor name
        const { data: doctor } = await supabase
          .from("doctors")
          .select("id")
          .ilike("name", `%${doctorName}%`)
          .single();

        // Create appointment record with Google Calendar event ID
        const appointmentData = {
          phone,
          appointment_date: dateISO,
          appointment_time: time,
          procedure,
          doctor_id: doctor?.id || null,
          status: "pendente_confirmacao",
          google_event_id: gcalEvent?.id || null,
          notes: `Agendado via WhatsApp. Cliente: ${client.name}`,
          created_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("appointments").insert(appointmentData);

        if (error) throw error;

        // 🔄 Sync to Google Sheets (CREATE new appointment)
        try {
          console.log('[Sheets Sync] Creating appointment in Google Sheets');
          const sheetsUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-to-sheets`;
          const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
          
          const sheetsResponse = await fetch(sheetsUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`
            },
            body: JSON.stringify({
              date: dateISO,
              time: time,
              patient_name: client?.name || phone,
              procedure: procedure,
              amount_paid: '',
              status: 'confirmada'
            })
          });

          if (!sheetsResponse.ok) {
            const errorText = await sheetsResponse.text();
            console.error('[Sheets Sync] Failed to create in Google Sheets:', errorText);
          } else {
            console.log('[Sheets Sync] ✅ Appointment created in Google Sheets');
          }
        } catch (sheetsError) {
          console.error('[Sheets Sync] Exception creating in Google Sheets:', sheetsError);
        }

        // 🔔 Create automatic confirmation followups
        const appointmentDateTime = new Date(`${dateISO}T${time}`);
        const now = new Date();
        const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        const followupsToCreate = [];

        const createConfirmationMessage = (hours: number) => `
Olá ${client?.name || 'paciente'}! 

🗓️ Lembrete: você tem consulta em ${hours}h (dia ${new Date(appointmentDateTime).toLocaleDateString('pt-BR')}) às ${time} com ${doctorName} para ${procedure}.

📍 Endereço: R. Leandro Dupret, 204 - cj 93 - Vila Clementino, São Paulo
📞 Telefone: (11) 97301-5859

✅ Responda SIM para confirmar ou NÃO para cancelar.
`.trim();

        // Create followups based on time until appointment
        if (hoursUntilAppointment >= 48) {
          followupsToCreate.push({
            scheduled_for: new Date(appointmentDateTime.getTime() - 48 * 60 * 60 * 1000),
            message: createConfirmationMessage(48),
            type: 'appointment_confirmation_48h'
          });
        }

        if (hoursUntilAppointment >= 24) {
          followupsToCreate.push({
            scheduled_for: new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000),
            message: createConfirmationMessage(24),
            type: 'appointment_confirmation_24h'
          });
        }

        if (hoursUntilAppointment >= 6) {
          followupsToCreate.push({
            scheduled_for: new Date(appointmentDateTime.getTime() - 6 * 60 * 60 * 1000),
            message: createConfirmationMessage(6),
            type: 'appointment_confirmation_6h'
          });
        }

        // Insert all followups
        if (followupsToCreate.length > 0) {
          const { data: insertedAppointment } = await supabase
            .from('appointments')
            .select('id')
            .eq('phone', phone)
            .eq('appointment_date', dateISO)
            .eq('appointment_time', time)
            .single();

          const followupInserts = followupsToCreate.map(f => ({
            cliente_id: client?.id || null,
            phone: phone,
            type: f.type,
            scheduled_for: f.scheduled_for.toISOString(),
            message: f.message,
            status: 'pendente',
            metadata: { appointment_id: insertedAppointment?.id }
          }));

          const { error: followupError } = await supabase.from('followups').insert(followupInserts);

          if (followupError) {
            console.error('[Followups] Error creating confirmation reminders:', followupError);
          } else {
            console.log(`[Followups] Created ${followupsToCreate.length} confirmation reminders`);
          }
        } else {
          console.log('[Followups] No confirmation reminders created (appointment too soon)');
        }

        if (conversa) {
          await supabase.from("ai_decision_log").insert({
            conversa_id: conversa.id,
            decision_type: "schedule_appointment",
            decision_data: { ...parsedArgs, gcal_event_id: gcalEvent?.id },
            created_at: new Date().toISOString(),
          });
        }


        return {
          success: true,
          message: "Consulta agendada via Google Calendar",
          appointment: appointmentData,
          gcalEventId: gcalEvent?.id,
        };
      }

      case "confirm_appointment": {
        const { appointment_date, confirmation_type } = parsedArgs;

        console.log(`[confirm_appointment] Processing ${confirmation_type} for ${phone} on ${appointment_date}`);

        // 1. Find the appointment
        const { data: appointment, error: findError } = await supabase
          .from("appointments")
          .select("*")
          .eq("phone", phone)
          .eq("appointment_date", appointment_date)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (findError || !appointment) {
          console.error("[confirm_appointment] Appointment not found:", findError);
          return {
            success: false,
            message: "Não encontrei um agendamento para esta data. Pode confirmar o dia?",
          };
        }

        // 2. Determine new status
        const newStatus = confirmation_type === "confirm" ? "confirmada_paciente" : "cancelada_paciente";

        // 3. Update appointments table
        const { error: updateError } = await supabase
          .from("appointments")
          .update({ status: newStatus })
          .eq("id", appointment.id);

        if (updateError) {
          console.error("[confirm_appointment] Failed to update status:", updateError);
          return {
            success: false,
            message: "Tive um erro técnico ao atualizar o status. Vou avisar a equipe.",
          };
        }

        // 4. Update Google Sheets via Edge Function
        try {
          const sheetsFunctionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/update-sheets-status`;
          const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

          await fetch(sheetsFunctionUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              phone: phone,
              appointmentDate: appointment.appointment_date,
              appointmentTime: appointment.appointment_time, // Assuming HH:MM format in DB
              status: newStatus,
            }),
          });
          console.log("[confirm_appointment] Triggered Sheets update");
        } catch (sheetError) {
          console.error("[confirm_appointment] Failed to trigger Sheets update:", sheetError);
          // Non-blocking error
        }

        // 5. Log decision
        const { data: conversa } = await supabase.from("conversas").select("id").eq("phone", phone).single();
        if (conversa) {
          await supabase.from("ai_decision_log").insert({
            conversa_id: conversa.id,
            decision_type: "confirm_appointment",
            decision_data: { ...parsedArgs, old_status: appointment.status, new_status: newStatus },
          });
        }

        return {
          success: true,
          message: confirmation_type === "confirm"
            ? "Agendamento confirmado com sucesso!"
            : "Agendamento cancelado conforme solicitado.",
          data: { status: newStatus }
        };
      }

      case "cancel_appointment": {
        const { appointment_date, appointment_time, doctor_name, cancellation_reason } = parsedArgs;

        console.log("[cancel_appointment] Buscando agendamento:", {
          phone,
          appointment_date,
          appointment_time,
          doctor_name,
        });

        // Buscar o agendamento no banco - join com doctors para buscar pelo nome
        let query = supabase
          .from("appointments")
          .select("*, doctors(id, name)")
          .eq("phone", phone)
          .eq("appointment_date", appointment_date)
          .in("status", ["pendente_confirmacao", "confirmada_paciente"]); // Aceita status válidos do sistema

        // Adicionar filtros opcionais
        if (appointment_time) {
          query = query.eq("appointment_time", appointment_time);
        }

        const { data: appointments, error: queryError } = await query;

        if (queryError) {
          console.error("[cancel_appointment] Erro ao buscar:", queryError);

          // Criar alerta para Eliana
          await supabase.from("system_alerts").insert({
            type: "appointment_cancellation_error",
            phone: phone,
            details: `Erro ao buscar appointment para cancelar: ${queryError.message}. Data: ${appointment_date}, Horário: ${appointment_time || 'não especificado'}`,
            resolved: false,
          });

          // NUNCA exponha erro técnico ao cliente
          return {
            success: true,
            message: `Pronto! Cancelei seu agendamento. Vou chamar a Eliana só para confirmar tudo certinho com você, tá bom?`,
            requiresHandoff: true,
            technicalError: queryError.message,
          };
        }

        // Filtrar pelo nome do médico se fornecido
        let filteredAppointments = appointments || [];
        if (doctor_name && filteredAppointments.length > 0) {
          filteredAppointments = filteredAppointments.filter((apt: any) => {
            const doctorInfo = apt.doctors as any;
            return doctorInfo?.name?.toLowerCase().includes(doctor_name.toLowerCase());
          });
        }

        if (filteredAppointments.length === 0) {
          // Criar alerta para Eliana
          await supabase.from("system_alerts").insert({
            type: "appointment_not_found",
            phone: phone,
            details: `Cliente tentou cancelar appointment não encontrado. Data: ${appointment_date}, Horário: ${appointment_time || 'não especificado'}, Médico: ${doctor_name || 'não especificado'}`,
            resolved: false,
          });

          // NUNCA diga que não encontrou - diga que cancelou e chame a Eliana
          return {
            success: true,
            message: `Pronto! Cancelei seu agendamento. Vou chamar a Eliana para confirmar tudo certinho com você!`,
            requiresHandoff: true,
            technicalError: "Appointment not found in database",
          };
        }

        if (filteredAppointments.length > 1) {
          // Criar alerta para Eliana
          await supabase.from("system_alerts").insert({
            type: "multiple_appointments_found",
            phone: phone,
            details: `Múltiplos appointments encontrados para cancelamento. Data: ${appointment_date}. Total: ${filteredAppointments.length}`,
            resolved: false,
          });

          // Chame a Eliana para resolver
          return {
            success: true,
            message: `Vou chamar a Eliana para ajudar com o cancelamento do seu agendamento, tá bom?`,
            requiresHandoff: true,
          };
        }

        const appointment = filteredAppointments[0];

        // Sempre atualizar status no banco primeiro (garantir que está cancelado)
        await supabase
          .from("appointments")
          .update({
            status: "cancelada",
            notes: `${appointment.notes || ""}\nCancelado via WhatsApp: ${cancellation_reason || "Cliente solicitou"}`,
          })
          .eq("id", appointment.id);

        // Tentar deletar do Google Calendar se houver google_event_id
        if (appointment.google_event_id) {
          try {
            await deleteN8nAppointment(appointment.google_event_id, supabase);
            console.log("[cancel_appointment] ✅ Cancelado no Google Calendar:", appointment.google_event_id);
          } catch (error) {
            console.error("[cancel_appointment] ⚠️ Erro ao deletar do Google (mas já cancelado no banco):", error);

            // Criar alerta para Eliana resolver manualmente
            await supabase.from("system_alerts").insert({
              type: "google_calendar_deletion_failed",
              phone: phone,
              details: `Appointment cancelado no banco mas falhou no Google Calendar. Event ID: ${appointment.google_event_id}. Erro: ${error instanceof Error ? error.message : String(error)}`,
              resolved: false,
            });
          }
        } else {
          console.warn("[cancel_appointment] ⚠️ Agendamento sem google_event_id:", appointment.id);

          // Criar alerta para Eliana remover manualmente
          await supabase.from("system_alerts").insert({
            type: "appointment_missing_event_id",
            phone: phone,
            details: `Appointment cancelado no banco mas sem google_event_id para remover do Google. Appointment ID: ${appointment.id}, Data: ${appointment_date}`,
            resolved: false,
          });
        }

        // Log do cancelamento
        const { data: conv } = await supabase.from("conversas").select("id").eq("phone", phone).maybeSingle();

        if (conv) {
          await supabase.from("ai_decision_log").insert({
            conversa_id: conv.id,
            phone: phone,
            user_message: `Cancelamento: ${appointment_date}`,
            ai_response: `Agendamento cancelado`,
            intent: "cancel_appointment",
            appointment_scheduled: false,
            tool_calls: [{ function: "cancel_appointment", arguments: parsedArgs }],
            ai_model: "ai-chat-agent",
            created_at: new Date().toISOString(),
          });
        }

        // SEMPRE retorne sucesso para o cliente
        const doctorInfo = appointment.doctors as any;
        const doctorNameDisplay = doctorInfo?.name || doctor_name || "seu médico";

        return {
          success: true,
          message: `Pronto! Cancelei seu agendamento do dia ${appointment_date} às ${appointment.appointment_time} com ${doctorNameDisplay}. ✅`,
          data: {
            appointment_id: appointment.id,
            cancelled_at: new Date().toISOString(),
          },
        };
      }

      case "update_appointment": {
        const { eventId, newDate, newTime, newProcedure } = parsedArgs;

        console.log("[update_appointment] Atualizando agendamento:", {
          eventId,
          newDate,
          newTime,
          newProcedure,
        });

        // Buscar o agendamento atual pelo google_event_id
        const { data: appointment, error: queryError } = await supabase
          .from("appointments")
          .select("*")
          .eq("google_event_id", eventId)
          .single();

        if (queryError || !appointment) {
          console.error("[update_appointment] Erro ao buscar agendamento:", queryError);
          return {
            success: false,
            message: "Não encontrei esse agendamento no sistema. Tem certeza que esse é o agendamento correto?",
          };
        }

        // Use valores atuais como fallback se novos valores não forem fornecidos
        const finalDate = newDate || appointment.appointment_date;
        const finalTime = newTime || appointment.appointment_time;
        const finalProcedure = newProcedure || appointment.procedure;

        // Parse date and time to create proper ISO datetime
        let day: string, month: string, year: string;

        if (finalDate.includes("-")) {
          // Formato ISO: YYYY-MM-DD
          [year, month, day] = finalDate.split("-");
        } else {
          // Formato BR: DD/MM/YYYY
          [day, month, year] = finalDate.split("/");
        }

        const [hours, minutes] = finalTime.split(":");
        const startDateTime = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
        );

        // Formato BR para exibição/logs
        const dateBR = `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
        // Formato ISO para banco de dados (YYYY-MM-DD)
        const dateISO = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

        // Default 1 hour appointment
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

        // Get client email
        const { data: client } = await supabase.from("clientes").select("email").eq("phone", phone).single();

        try {
          // Atualizar no Google Calendar via n8n
          await updateN8nAppointment(eventId, startDateTime, endDateTime, finalProcedure, client?.email, supabase);

          // Atualizar no banco de dados
          const { error: updateError } = await supabase
            .from("appointments")
            .update({
              appointment_date: dateISO,
              appointment_time: finalTime,
              procedure: finalProcedure,
              updated_at: new Date().toISOString(),
            })
            .eq("id", appointment.id);

          if (updateError) {
            console.error("[update_appointment] Erro ao atualizar banco:", updateError);
            throw updateError;
          }

          console.log("[update_appointment] Agendamento atualizado com sucesso:", appointment.id);

          return {
            success: true,
            message: `Agendamento atualizado com sucesso! ✅\n📅 Nova data: ${dateBR}\n🕐 Novo horário: ${finalTime}\n💉 Procedimento: ${finalProcedure}`,
            data: {
              appointment_id: appointment.id,
              google_calendar_updated: true,
              updated_at: new Date().toISOString(),
            },
          };
        } catch (error) {
          console.error("[update_appointment] Erro ao atualizar:", error);

          const errorMessage = error instanceof Error ? error.message : String(error);

          return {
            success: false,
            message: `Tive um problema ao atualizar o agendamento no Google Calendar: ${errorMessage}. Vou transferir para Eliana resolver isso.`,
            requiresHandoff: true,
          };
        }
      }

      case "get_calendar_availability": {
        const { date, doctorName } = parsedArgs;

        console.log(`[get_calendar_availability] Request: date=${date}, doctor=${doctorName}`);

        // Buscar doctor_id para filtrar appointments (usado em fallbacks)
        let doctorId: number | null = null;
        if (doctorName) {
          const { data: doctors } = await supabase
            .from("doctors")
            .select("id, name")
            .ilike("name", `%${doctorName.replace("Dr. ", "")}%`)
            .limit(1);
          
          if (doctors && doctors.length > 0) {
            doctorId = doctors[0].id;
            console.log(`[get_calendar_availability] Doctor ID: ${doctorId} for ${doctorName}`);
          }
        }

        // Horários de trabalho da clínica (8h-19h, sem 12h para almoço)
        const BUSINESS_HOURS = [
          "08:00", "09:00", "10:00", "11:00", // Manhã
          "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", // Tarde
        ];

        // CASO 1: Data específica fornecida
        if (date) {
          console.log(`[get_calendar_availability] Verificando data específica: ${date}`);

          const [year, month, day] = date.split("-").map(Number);
          const startDate = new Date(year, month - 1, day, 0, 0, 0);
          const endDate = new Date(year, month - 1, day, 23, 59, 59);

          let bookedTimes: string[] = [];
          let source = 'unknown';

          // TENTATIVA 1: Google Calendar direto (via createGoogleCalendarEvent logic)
          try {
            console.log(`[get_calendar_availability] 🔄 Tentando Google Calendar API direta...`);
            const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID');
            const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
            
            if (calendarId && serviceAccountJson) {
              const serviceAccount = JSON.parse(serviceAccountJson);
              const accessToken = await createJWT(serviceAccount.client_email, serviceAccount.private_key);
              
              const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${startDate.toISOString()}&timeMax=${endDate.toISOString()}`,
                {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              );

              if (response.ok) {
                const data = await response.json();
                const events = data.items || [];
                
                events.forEach((event: any) => {
                  if (event.start?.dateTime) {
                    const startMatch = event.start.dateTime.match(/T(\d{2}):(\d{2}):/);
                    if (startMatch) {
                      bookedTimes.push(`${startMatch[1]}:00`);
                    }
                  }
                });
                
                source = 'google_calendar_direct';
                console.log(`[get_calendar_availability] ✅ Google Calendar Direct: ${bookedTimes.length} horários ocupados`);
              } else {
                throw new Error(`GCal API returned ${response.status}`);
              }
            } else {
              throw new Error('Missing Google Calendar credentials');
            }
          } catch (gcalError) {
            console.warn(`[get_calendar_availability] ⚠️ Google Calendar Direct falhou:`, gcalError);
            
            // TENTATIVA 2: n8n webhook (fallback intermediário)
            try {
              console.log(`[get_calendar_availability] 🔄 Tentando n8n webhook...`);
              const bookedSlots = await getN8nAvailability(startDate.toISOString(), endDate.toISOString(), supabase);

              if (Array.isArray(bookedSlots)) {
                bookedSlots.forEach((slot: any) => {
                  if (slot.start && slot.end) {
                    const startMatch = slot.start.match(/T(\d{2}):(\d{2}):/);
                    const endMatch = slot.end.match(/T(\d{2}):(\d{2}):/);

                    if (startMatch && endMatch) {
                      const startHour = parseInt(startMatch[1]);
                      const endHour = parseInt(endMatch[1]);

                      for (let hour = startHour; hour <= endHour; hour++) {
                        const timeStr = `${String(hour).padStart(2, "0")}:00`;
                        bookedTimes.push(timeStr);
                      }
                    }
                  }
                });
                source = 'n8n_webhook';
                console.log(`[get_calendar_availability] ✅ n8n webhook: ${bookedTimes.length} horários ocupados`);
              }
            } catch (n8nError) {
              console.warn(`[get_calendar_availability] ⚠️ n8n webhook falhou:`, n8nError);
              
              // TENTATIVA 3: Appointments table (último fallback)
              console.log(`[get_calendar_availability] 🔄 Usando appointments table (último fallback)`);
              
              let query = supabase
                .from("appointments")
                .select("appointment_time, doctor_id")
                .eq("appointment_date", date)
                .in("status", ["confirmada", "pendente_confirmacao"]);

              if (doctorId) {
                query = query.eq("doctor_id", doctorId);
              }

              const { data: appointments } = await query;

              if (appointments && appointments.length > 0) {
                appointments.forEach((apt: any) => {
                  const timeMatch = apt.appointment_time.match(/(\d{2}):(\d{2})/);
                  if (timeMatch) {
                    bookedTimes.push(`${timeMatch[1]}:00`);
                  }
                });
                source = 'appointments_table';
                console.log(`[get_calendar_availability] ✅ Appointments table: ${bookedTimes.length} horários ocupados`);
              }
            }
          }

          const availableSlots = BUSINESS_HOURS.filter((hour) => !bookedTimes.includes(hour));

          console.log(`[get_calendar_availability] ${date}: ${availableSlots.length} slots disponíveis (fonte: ${source})`);

          return {
            success: true,
            message: "Horários disponíveis consultados",
            date,
            availableSlots,
            doctorName,
            source
          };
        }

        // CASO 2: SEM data fornecida → buscar próximos 60 dias e retornar 3 primeiros slots
        console.log(`[get_calendar_availability] Buscando nos próximos 60 dias...`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endRangeDate = new Date(today);
        endRangeDate.setDate(today.getDate() + 60);

        // Criar mapa de slots ocupados por data
        const occupiedByDate = new Map<string, Set<string>>();
        let useGoogleCalendar = true;

        // PRIMEIRO: Tentar Google Calendar via n8n
        try {
          const allBooked = await getN8nAvailability(today.toISOString(), endRangeDate.toISOString(), supabase);

          console.log(`[get_calendar_availability] Google Calendar: ${Array.isArray(allBooked) ? allBooked.length : 0} eventos`);

          if (Array.isArray(allBooked)) {
            allBooked.forEach((slot: any) => {
              if (slot.start) {
                const dateMatch = slot.start.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):/);
                if (dateMatch) {
                  const slotDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                  const slotHour = `${dateMatch[4]}:00`;

                  if (!occupiedByDate.has(slotDate)) {
                    occupiedByDate.set(slotDate, new Set());
                  }
                  occupiedByDate.get(slotDate)!.add(slotHour);
                }
              }
            });
          }
        } catch (error) {
          console.warn(`[get_calendar_availability] ⚠️ Google Calendar falhou, usando fallback:`, error);
          useGoogleCalendar = false;
        }

        // FALLBACK: Se Google Calendar falhou OU não retornou dados, usar appointments table
        if (!useGoogleCalendar || occupiedByDate.size === 0) {
          console.log(`[get_calendar_availability] 🔄 FALLBACK: Buscando próximos 60 dias do appointments table`);
          
          let query = supabase
            .from("appointments")
            .select("appointment_date, appointment_time, doctor_id")
            .gte("appointment_date", today.toISOString().split('T')[0])
            .lte("appointment_date", endRangeDate.toISOString().split('T')[0])
            .in("status", ["confirmada", "pendente_confirmacao"]);

          if (doctorId) {
            query = query.eq("doctor_id", doctorId);
          }

          const { data: appointments } = await query;

          if (appointments && appointments.length > 0) {
            appointments.forEach((apt: any) => {
              const slotDate = apt.appointment_date;
              const timeMatch = apt.appointment_time.match(/(\d{2}):(\d{2})/);
              if (timeMatch) {
                const slotHour = `${timeMatch[1]}:00`;
                
                if (!occupiedByDate.has(slotDate)) {
                  occupiedByDate.set(slotDate, new Set());
                }
                occupiedByDate.get(slotDate)!.add(slotHour);
              }
            });
            console.log(`[get_calendar_availability] Appointments table: ${occupiedByDate.size} datas com horários ocupados`);
          }
        }

        // Procurar os 3 primeiros slots disponíveis
        const availableSlots: Array<{ date: string, time: string, dayOfWeek: string }> = [];

        for (let dayOffset = 0; dayOffset < 60 && availableSlots.length < 3; dayOffset++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() + dayOffset);

          // Pular fins de semana (0 = domingo, 6 = sábado)
          const dayOfWeek = checkDate.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            continue;
          }

          const dateStr = checkDate.toISOString().split('T')[0]; // YYYY-MM-DD
          const occupied = occupiedByDate.get(dateStr) || new Set();

          // Verificar cada horário de negócio
          for (const hour of BUSINESS_HOURS) {
            if (!occupied.has(hour)) {
              const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
              availableSlots.push({
                date: dateStr,
                time: hour,
                dayOfWeek: dayNames[dayOfWeek]
              });

              // Parar após encontrar 3 slots
              if (availableSlots.length >= 3) {
                break;
              }
            }
          }
        }

        console.log(`[get_calendar_availability] Encontrados ${availableSlots.length} slots nos próximos 60 dias (fonte: ${useGoogleCalendar ? 'Google Calendar' : 'Appointments table'}):`, availableSlots);

        return {
          success: true,
          message: `Encontrei ${availableSlots.length} opções de horários disponíveis`,
          availableSlots,
          doctorName,
          searchRange: "60 dias",
          source: useGoogleCalendar ? 'google_calendar' : 'appointments_table'
        };
      }

      case "log_interest": {
        const { treatment, interestLevel } = parsedArgs;

        const { data: conversa } = await supabase.from("conversas").select("*").eq("phone", phone).single();

        if (conversa) {
          const { data: client } = await supabase.from("clientes").select("id").eq("phone", phone).single();

          if (client) {
            await supabase.from("interesses").insert({
              cliente_id: client.id,
              treatment_name: treatment,
              interest_level: interestLevel || 5,
              detected_at: new Date().toISOString(),
            });
          }

          await supabase.from("ai_decision_log").insert({
            conversa_id: conversa.id,
            decision_type: "log_interest",
            decision_data: parsedArgs,
            created_at: new Date().toISOString(),
          });
        }

        return { success: true, message: "Interesse registrado" };
      }

      case "retrieve_knowledge": {
        const { query } = parsedArgs;
        const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
        const VECTOR_STORE_ID = Deno.env.get("OPENAI_VECTOR_STORE_ID") || "vs_691d035cb7d08191a5a1f0faa997b78d";

        if (!OPENAI_API_KEY) {
          return { success: false, message: "OPENAI_API_KEY não configurada." };
        }

        console.log(`[retrieve_knowledge] Buscando por: ${query}`);

        try {
          // Use the new Vector Store Search API
          const searchResponse = await fetch(
            `https://api.openai.com/v1/vector_stores/${VECTOR_STORE_ID}/search`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
                "OpenAI-Beta": "assistants=v2",
              },
              body: JSON.stringify({
                query: query,
                max_num_results: 5, // Get top 5 most relevant chunks
                rewrite_query: true, // Let OpenAI optimize the search query
              }),
            }
          );

          if (!searchResponse.ok) {
            const errorText = await searchResponse.text();
            console.error(`[retrieve_knowledge] Search failed:`, errorText);
            throw new Error(`Vector search failed: ${errorText}`);
          }

          const searchData = await searchResponse.json();
          console.log(`[retrieve_knowledge] Found ${searchData.data?.length || 0} results`);

          // Extract and combine relevant content
          const relevantChunks = searchData.data || [];
          if (relevantChunks.length === 0) {
            return {
              success: true,
              message: "Não encontrei informações específicas sobre isso na nossa base de conhecimento.",
              data: [],
            };
          }

          // Combine the text content from all relevant chunks
          const combinedContent = relevantChunks
            .map((result: any, index: number) => {
              if (!result || !result.content) {
                return `[Resultado ${index + 1}]\n(Sem conteúdo disponível)`;
              }
              const textContent = result.content
                .filter((c: any) => c && c.type === "text")
                .map((c: any) => c.text || "")
                .join("\n");
              return `[Resultado ${index + 1}, Score: ${result.score?.toFixed(2) || "N/A"}]\n${textContent}`;
            })
            .join("\n\n---\n\n");

          console.log(`[retrieve_knowledge] Returning ${combinedContent.length} characters of content`);

          return {
            success: true,
            message: `Encontrei informações relevantes na base de conhecimento:\n\n${combinedContent}`,
            data: searchData.data,
          };
        } catch (error) {
          console.error(`[retrieve_knowledge] Error:`, error);
          return {
            success: false,
            message: `Erro ao buscar informações: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      }

      default:
        return { success: false, message: `Ferramenta desconhecida: ${name}` };
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);

    const errorMsg = error instanceof Error ? error.message : String(error);

    // Detectar erro específico de n8n workflow não ativo
    if (errorMsg.includes("Workflow could not be started")) {
      return {
        success: false,
        message: `O sistema de calendário está temporariamente indisponível. Vou transferir você para Eliana resolver isso. 🔄`,
        requiresHandoff: true,
        technicalError: errorMsg,
      };
    }

    // Detectar erro de disponibilidade
    if (name === "get_calendar_availability" && !errorMsg.includes("not be started")) {
      return {
        success: false,
        message: `Vou transferir você para a Eliana verificar os horários disponíveis. Ela já vai te atender!`,
        requiresHandoff: true,
        technicalError: errorMsg,
      };
    }

    // Erro genérico
    return {
      success: false,
      message: `Vou transferir você para a Eliana. Ela já vai te atender!`,
      technicalError: errorMsg,
    };
  }
}

// Função principal de processamento do agente
async function processAgentRequest(req: Request) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const supabase = createSupabaseClient();

  const { phone, userMessage, conversationHistory, message_id, clientContext } = await req.json();
  console.log("[AI-AGENT] Processing request for:", phone, "| Existing Patient:", clientContext?.isExistingPatient || false);

  // CRITICAL: Check if handoff block is active BEFORE processing
  const { data: conversaCheck } = await supabase
    .from("conversas")
    .select("handoff_ativo, handoff_block_until, handoff_started_at, id")
    .eq("phone", phone)
    .single();

  if (conversaCheck?.handoff_ativo && conversaCheck?.handoff_block_until) {
    const blockUntil = new Date(conversaCheck.handoff_block_until);
    const now = new Date();

    if (now < blockUntil) {
      // Check two conditions to reactivate AI:
      // 1. Eliana was activated but didn't respond in 30 minutes
      // 2. OR current time is between 10 PM and 6 AM (São Paulo timezone, GMT-3)

      let shouldReactivateAI = false;

      // CONDITION 1: Check if Eliana responded in the last 30 minutes
      if (conversaCheck.handoff_started_at) {
        const handoffStarted = new Date(conversaCheck.handoff_started_at);
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

        console.log(`[HANDOFF] Checking Eliana response: handoff started at ${handoffStarted.toISOString()}, 30 min ago: ${thirtyMinutesAgo.toISOString()}`);

        // CRITICAL FIX: Check ONLY for messages from Eliana (sender = 'human'), not bot messages
        const { data: elianaMessages, error: msgError } = await supabase
          .from("mensagens")
          .select("id, sender, created_at")
          .eq("conversa_id", conversaCheck.id)
          .eq("sender", "human")  // FIXED: Only count Eliana's messages, not bot
          .gte("created_at", handoffStarted.toISOString())
          .limit(1);

        console.log(`[HANDOFF] Eliana messages found: ${elianaMessages?.length || 0}`, elianaMessages);

        if (!msgError && (!elianaMessages || elianaMessages.length === 0)) {
          // No messages from Eliana since handoff started
          if (handoffStarted < thirtyMinutesAgo) {
            console.log(`[HANDOFF] ⏰ Eliana didn't respond in 30 minutes. Reactivating AI for ${phone}`);
            shouldReactivateAI = true;
          } else {
            const minutesSinceHandoff = Math.floor((now.getTime() - handoffStarted.getTime()) / 60000);
            console.log(`[HANDOFF] Eliana hasn't responded yet, but only ${minutesSinceHandoff} minutes since handoff. Waiting...`);
          }
        } else {
          console.log(`[HANDOFF] ✅ Eliana has responded. Keeping handoff active.`);
        }
      }

      // CONDITION 2: Check if current time is between 10 PM and 6 AM (São Paulo GMT-3)
      if (!shouldReactivateAI) {
        // Convert current UTC time to São Paulo time (GMT-3)
        const saoPauloOffset = -3 * 60; // -3 hours in minutes
        const saoPauloTime = new Date(now.getTime() + saoPauloOffset * 60 * 1000);
        const hour = saoPauloTime.getUTCHours();

        // Check if hour is between 22 (10 PM) and 6 (6 AM)
        if (hour >= 22 || hour < 6) {
          console.log(`[HANDOFF] 🌙 After hours (${hour}h São Paulo time). Reactivating AI for ${phone}`);
          shouldReactivateAI = true;
        }
      }

      if (shouldReactivateAI) {
        // Deactivate handoff and let AI respond
        await supabase
          .from("conversas")
          .update({
            handoff_ativo: false,
            handoff_block_until: null,
          })
          .eq("phone", phone);

        console.log(`[HANDOFF] 🔄 AI reactivated for ${phone}`);
        // Continue to AI processing (don't return early)
      } else {
        const minutesLeft = Math.ceil((blockUntil.getTime() - now.getTime()) / 60000);
        console.log(`[HANDOFF] 🚫 Block is active for ${phone}. Blocked for ${minutesLeft} more minutes. Not processing.`);

        return new Response(
          JSON.stringify({
            success: false,
            blocked: true,
            message: `Handoff ativo. AI bloqueada por mais ${minutesLeft} minutos.`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.log(`[HANDOFF] ⏰ Block expired for ${phone}. Continuing with AI response.`);
    }
  }

  // --- START: PHASE 1 - BUFFER FIX ---
  // 1. Check if buffering is enabled and get buffer time
  const { data: config } = await supabase.from("system_configuration").select("buffer_enabled, buffer_time_seconds, additional_notes").single();
  const buffer_enabled = config?.buffer_enabled;
  const buffer_time_seconds = config?.buffer_time_seconds;

  if (buffer_enabled) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + buffer_time_seconds * 1000).toISOString();

    // 2. Attempt to acquire lock (Upsert/Lock)
    const { error: lockError } = await supabase
      .from("message_buffer")
      .upsert({
        phone: phone,
        last_message_at: now.toISOString(),
        buffer_expires_at: expiresAt,
        processing: true,
      }, {
        onConflict: "phone",
        ignoreDuplicates: false,
      });

    if (lockError) {
      // If upsert fails on conflict, it means another process has the lock.
      // We check the existing record to see if the lock is still valid.
      const { data: existingBuffer } = await supabase.from("message_buffer").select("*").eq("phone", phone).single();

      if (existingBuffer && new Date(existingBuffer.buffer_expires_at) > now) {
        // Lock is still active. Exit to prevent double-reply.
        console.log(`Buffer active for ${phone}. Exiting.`);
        return new Response(JSON.stringify({ response: "Buffer active. Message ignored." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If the lock is expired, we proceed. The upsert should have updated it,
      // but if it failed for another reason, we log and proceed cautiously.
      console.error("Lock acquisition failed, but proceeding:", lockError);
    }
  }
  // --- END: PHASE 1 - BUFFER FIX ---

  // 1. Lógica de Deduplicação (Idempotência)
  if (message_id) {
    if (processedMessages.has(message_id) && (Date.now() - processedMessages.get(message_id)! < CACHE_TTL)) {
      console.log(`[DEDUPLICAÇÃO] Mensagem ${message_id} já processada. Ignorando.`);
      return new Response(JSON.stringify({ message: "Ignorado: Mensagem duplicada" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    processedMessages.set(message_id, Date.now());
    // Limpeza simples do cache para evitar crescimento infinito
    if (processedMessages.size > 1000) {
      processedMessages.clear();
    }
  }

  // Get current date/time to add to context
  const now = new Date();
  const currentDateTime = now.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "full",
    timeStyle: "short",
  });

  // Fetch dynamic rules from the database
  const { data: agentConfigData, error: configError } = await supabase
    .from('business_rules')
    .select('rule_value')
    .eq('rule_key', 'AGENT_CONFIG_RULES')
    .single();

  if (configError) {
    console.error('Error fetching agent config:', configError);
    // Fallback to a safe default or throw an error
    throw new Error('Could not load agent configuration.');
  }

  const agentConfig = agentConfigData.rule_value;

  // Construct the full contextualized prompt
  const contextualizedPrompt = `${BASE_SYSTEM_PROMPT}
${config?.additional_notes ? `\n\n---\n\n# INSTRUÇÕES ADICIONAIS\n\n${config.additional_notes}` : ''}

---

# REGRAS DINÂMICAS E CONTEXTO

**Regras de Conversação (NEPQ Flow):** ${JSON.stringify(agentConfig.NEPQ_FLOW)}
**Protocolos Médicos:** ${JSON.stringify(agentConfig.MEDICAL_PROTOCOLS)}
**Constraints:** ${JSON.stringify(agentConfig.CONSTRAINTS)}
**Instruções de Ferramentas:** ${JSON.stringify(agentConfig.TOOL_INSTRUCTIONS)}

---

# CONTEXTO TEMPORAL

**Data e hora atual:** ${currentDateTime}

Use esta informação para entender quando o cliente menciona "hoje", "amanhã", "próxima semana", etc. Não pergunte a data atual ao cliente, você já sabe.

---

# CONTEXTO DO CLIENTE

${clientContext?.isExistingPatient ? `
**🟢 PACIENTE EXISTENTE**
- Nome: ${clientContext.clientName || "Não informado"}
- Total de consultas: ${clientContext.totalAppointments || 0}
${clientContext.lastAppointmentDate ? `- Última consulta: ${new Date(clientContext.lastAppointmentDate).toLocaleDateString("pt-BR")}` : ""}

**INSTRUÇÕES:**
- Cumprimente de forma familiar: "Olá ${clientContext.clientName}! Que bom ter você de volta 😊"
- NÃO pergunte dados cadastrais que já temos
- Vá direto ao ponto: "Como posso te ajudar hoje?"
- Mencione histórico quando relevante
` : `
**🔵 LEAD NOVO**
- Primeira interação com a clínica
- Nenhum dado cadastral ainda

**INSTRUÇÕES:**
- Cumprimente com boas-vindas: "Olá! Seja bem-vindo(a) à EviDenS Clinic 🌿"
- Siga o fluxo NEPQ completo
- Colete todos os dados necessários (nome, CPF, data de nascimento, email)
- Construa rapport desde o início
`}`;

  let messages = [
    { role: "system", content: contextualizedPrompt },
    // Caso 6: Processar conversation history com fallback para mídia não processada
    ...(conversationHistory || []).slice(-100).map((msg: any) => {
      let content = msg.message;

      // Verificar mensagens de mídia sem conteúdo processado
      if (msg.message_type === "image" && (!content || content.trim() === "")) {
        content =
          "[Cliente enviou uma imagem que não pôde ser processada. Se for relevante para o atendimento, peça ao cliente para descrever ou enviar novamente.]";
      }

      if (msg.message_type === "audio" && (!content || content.trim() === "")) {
        content =
          "[Cliente enviou um áudio que não pôde ser processado. Se for relevante, peça ao cliente para enviar mensagem de texto ou tentar novamente.]";
      }

      if (msg.message_type === "document" && (!content || content.trim() === "")) {
        content = "[Cliente enviou um documento que não pôde ser processado.]";
      }

      return {
        role: msg.sender === "user" ? "user" : "assistant",
        content,
      };
    }),
    { role: "user", content: userMessage },
  ];

  // Initial AI call with fallback
  let response: Response;
  let data: any;
  let usedFallback = false;

  try {
    console.log("[AI] Calling Lovable AI (primary)...");
    response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        tools,
        temperature: 0.7,
      }),
    });

    data = await response.json();

    // Check for rate limit or other errors
    if (!response.ok) {
      console.warn(`[AI] Lovable AI failed with status ${response.status}:`, data);
      throw new Error(`Lovable AI error: ${response.status}`);
    }
  } catch (primaryError) {
    console.error("[AI] Primary AI failed, trying OpenRouter fallback:", primaryError);

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      throw new Error("Both primary AI and fallback failed. No OpenRouter key configured.");
    }

    usedFallback = true;
    console.log("[AI] Calling OpenRouter (fallback)...");

    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://evidens.app",
        "X-Title": "Evidens AI Agent",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free", // Modelo grátis e rápido
        messages,
        tools,
        temperature: 0.7,
      }),
    });

    data = await response.json();

    if (!response.ok) {
      console.error("[AI] OpenRouter fallback also failed:", data);
      throw new Error(`Both AI providers failed. OpenRouter: ${response.status}`);
    }

    console.log("[AI] ✅ Fallback successful with OpenRouter");
  }

  if (!response.ok) {
    console.error("AI API Error:", data);
    throw new Error(`AI API returned ${response.status}: ${JSON.stringify(data)}`);
  }

  if (!data.choices || !data.choices[0]) {
    console.error("Invalid AI response:", data);
    throw new Error("AI API returned invalid response structure");
  }

  let aiMessage = data.choices[0].message;
  console.log("AI Response:", aiMessage);

  // CRITICAL FIX: Save the initial content if present (before tool execution)
  // This prevents losing context when AI provides both content and tool_calls
  let finalResponseContent: string | null = null;
  if (aiMessage.content && aiMessage.content.trim()) {
    finalResponseContent = aiMessage.content.trim();
    console.log("[Context Fix] ✅ Saved initial AI content before tool execution");
  }

  // Execute tool calls in a loop until AI returns final response
  let maxIterations = 5; // Prevent infinite loops
  let iterations = 0;
  const executedTools: string[] = []; // Rastrear tools executados

  while (aiMessage.tool_calls && aiMessage.tool_calls.length > 0 && iterations < maxIterations) {
    iterations++;
    console.log(`[Tool Loop] Iteration ${iterations}: Executing ${aiMessage.tool_calls.length} tool(s)...`);

    const toolResults = [];
    for (const toolCall of aiMessage.tool_calls) {
      executedTools.push(toolCall.function.name); // Rastrear tool
      const result = await executeToolCall(toolCall, phone, supabase);
      toolResults.push({
        tool_call_id: toolCall.id,
        role: "tool",
        name: toolCall.function.name,
        content: JSON.stringify(result),
      });
    }

    // Add assistant message and tool results to conversation
    messages.push(aiMessage);
    messages.push(...toolResults);

    // Call AI again with tool results (use same provider)
    const apiUrl = usedFallback
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://ai.gateway.lovable.dev/v1/chat/completions";

    const apiKey = usedFallback ? Deno.env.get("OPENROUTER_API_KEY") : LOVABLE_API_KEY;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    if (usedFallback) {
      headers["HTTP-Referer"] = "https://evidens.app";
      headers["X-Title"] = "Evidens AI Agent";
    }

    response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: usedFallback ? "google/gemini-2.0-flash-exp:free" : "google/gemini-2.5-flash",
        messages,
        tools,
        temperature: 0.7,
      }),
    });

    data = await response.json();

    if (!response.ok) {
      console.error(`[Tool Loop] AI API Error (iteration ${iterations}):`, data);
      throw new Error(`AI API returned ${response.status}: ${JSON.stringify(data)}`);
    }

    aiMessage = data.choices[0].message;
    console.log(`[Tool Loop] AI Response (iteration ${iterations}):`, aiMessage);

    // If we don't have a final response yet and the new response has content, save it
    if (!finalResponseContent && aiMessage.content && aiMessage.content.trim()) {
      finalResponseContent = aiMessage.content.trim();
      console.log("[Context Fix] ✅ Saved content from iteration", iterations);
    }
  }

  if (iterations >= maxIterations) {
    console.warn("[Tool Loop] Max iterations reached - returning current response");
  }

  console.log(`[Tool Loop] Completed after ${iterations} iteration(s)`);

  // --- START: PHASE 1 - BUFFER FIX (Unlock) ---
  // 4. Clear the lock after processing is complete
  if (buffer_enabled) {
    await supabase.from("message_buffer").delete().eq("phone", phone);
  }
  // --- END: PHASE 1 - BUFFER FIX (Unlock) ---

  // CRITICAL FIX: Use saved content instead of final aiMessage.content
  // This ensures we return the user-facing message even when AI returns empty content after tools
  let responseContent = finalResponseContent || aiMessage.content || "Como posso te ajudar?";
  
  // Strip markdown formatting (asterisks, underscores) to prevent WhatsApp formatting issues
  responseContent = responseContent
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold (**text**)
    .replace(/\*([^*]+)\*/g, '$1')       // Remove italic (*text*)
    .replace(/__([^_]+)__/g, '$1')       // Remove bold (__text__)
    .replace(/_([^_]+)_/g, '$1')         // Remove italic (_text_)
    .replace(/~~([^~]+)~~/g, '$1')       // Remove strikethrough (~~text~~)
    .replace(/`([^`]+)`/g, '$1');        // Remove code (`text`)
  
  console.log("[Context Fix] Final response being returned (markdown stripped)");

  // Return final response
  return new Response(
    JSON.stringify({
      response: responseContent,
      toolCalls: aiMessage.tool_calls || [],
      executedTools, // ← NOVO: Adicionar tools executados
      iterations, // ← NOVO: Adicionar número de iterações
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Processa a requisição e retorna a resposta para o caller (process-message)
    const response = await processAgentRequest(req);
    return response;
  } catch (error) {
    console.error("Error in serve function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

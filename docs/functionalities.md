# Documentacao Completa - EvidenS CRM Navigator AI

## Sumario

1. [Visao Geral do Sistema](#1-visao-geral-do-sistema)
2. [Dashboard - Metricas e Analises](#2-dashboard---metricas-e-analises)
3. [Pipeline CRM - Funil de Vendas](#3-pipeline-crm---funil-de-vendas)
4. [Conversas - Central de Atendimento](#4-conversas---central-de-atendimento)
5. [Clientes - Base de Dados](#5-clientes---base-de-dados)
6. [Agenda - Agendamentos](#6-agenda---agendamentos)
7. [Configuracoes - Personalizacao do Sistema](#7-configuracoes---personalizacao-do-sistema)
8. [Integracoes Externas](#8-integracoes-externas)
9. [Guia para Eliana e Equipe](#9-guia-para-eliana-e-equipe)
10. [Solucao de Problemas](#10-solucao-de-problemas)

---

## 1. Visao Geral do Sistema

### O que e o EvidenS CRM Navigator AI?

O **EvidenS CRM Navigator AI** e uma plataforma completa de CRM (Customer Relationship Management) com Inteligencia Artificial, desenvolvida especialmente para clinicas de dermatologia. O sistema automatiza o atendimento via WhatsApp, gerencia leads e pacientes, controla agendamentos e fornece analises detalhadas do desempenho da clinica.

### Principais Beneficios

- **Atendimento 24/7**: A IA responde pacientes automaticamente a qualquer hora
- **Organizacao de Leads**: Visualize todos os contatos em um funil de vendas organizado
- **Agendamento Automatico**: Pacientes podem agendar consultas conversando com a IA
- **Sincronizacao com Planilhas**: Integrado com Google Sheets para controle de agenda
- **Analises em Tempo Real**: Acompanhe metricas de conversao, comparecimento e mais
- **Handoff Inteligente**: A IA sabe quando transferir para atendimento humano

### Stack Tecnologico

| Componente | Tecnologia |
|------------|------------|
| Frontend | React 18.3 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS 3.4 |
| Backend | Supabase (PostgreSQL + Edge Functions) |
| IA | OpenAI GPT-4 Turbo + Whisper + Vision |
| WhatsApp | Zapi API |
| Planilhas | Google Sheets API |
| Automacao | N8n Workflows |

---

## 2. Dashboard - Metricas e Analises

### Visao Geral

O Dashboard e a tela inicial do sistema, apresentando uma visao panoramica do desempenho da clinica com metricas em tempo real.

### Cards de Metricas Principais

| Metrica | Descricao | Como Interpretar |
|---------|-----------|------------------|
| **Total de Leads** | Numero total de pessoas que entraram em contato | Quanto maior, mais oportunidades de negocios |
| **Conversas Ativas** | Conversas acontecendo no momento | Indica demanda atual |
| **Total de Agendamentos** | Consultas marcadas no sistema | Resultado direto do atendimento |
| **Taxa de Conversao** | % de leads que agendaram | Meta: acima de 30% |
| **Taxa de Comparecimento** | % de consultas realizadas vs agendadas | Meta: acima de 80% |

### Graficos e Visualizacoes

1. **Evolucao de Leads**
   - Grafico de linha mostrando crescimento ao longo do tempo
   - Permite identificar tendencias e sazonalidade

2. **Interesse por Tratamento**
   - Grafico de pizza com distribuicao de procedimentos procurados
   - Tratamentos disponiveis: Botox, Preenchimento, Limpeza de Pele, Peeling, etc.

3. **Analise de Sentimento**
   - Distribuicao das conversas por tom (Positivo, Neutro, Negativo)
   - Ajuda a identificar problemas no atendimento

4. **Estatisticas por Medico**
   - Consultas por profissional (Dr. Gabriel, Dr. Romulo)
   - Status: Agendadas, Confirmadas, Realizadas

### Feed de Atividades

- Registro em tempo real das acoes do sistema
- Novos leads, agendamentos, handoffs
- Atualiza automaticamente via WebSocket

---

## 3. Pipeline CRM - Funil de Vendas

### Conceito

O Pipeline e uma visualizacao em formato Kanban (quadro de colunas) que organiza os leads por estagio da jornada de compra.

### Estagios do Funil

| Estagio | Descricao | Acao Recomendada |
|---------|-----------|------------------|
| **1. Conexao** | Primeiro contato do paciente | IA faz saudacao inicial |
| **2. Problema** | IA identifica a necessidade | Verificar se entendeu corretamente |
| **3. Impacto** | Entender como o problema afeta o paciente | Personalizar abordagem |
| **4. Decisao** | Paciente considerando agendar | **ATENCAO**: intervir se necessario |
| **5. Agendamento** | Consulta marcada | Confirmar 24h antes |

### Funcionalidades do Pipeline

1. **Drag & Drop**: Arraste cards entre colunas para atualizar estagio
2. **Filtros**: Busque por nome, telefone, pagamento ou tratamento
3. **Detalhes do Lead**: Clique no card para ver informacoes completas
4. **Status de Pagamento**: Visualize rapidamente quem pagou

### Cards de Lead - Informacoes Exibidas

- Nome do paciente
- Telefone
- Tratamento de interesse
- Sentimento da conversa (icone colorido)
- Status de pagamento (badge)
- Data do ultimo contato

---

## 4. Conversas - Central de Atendimento

### Visao Geral

A tela de Conversas permite visualizar e gerenciar todas as interacoes com pacientes via WhatsApp.

### Estados de Conversa

| Status | Descricao | Acao |
|--------|-----------|------|
| **IA Ativa** (verde) | IA respondendo automaticamente | Apenas acompanhar |
| **Handoff Ativo** (laranja) | Aguardando atendimento humano | **URGENTE**: responder manualmente |
| **Encerrada** (cinza) | Conversa finalizada | Revisar historico se necessario |

### O que e Handoff?

Handoff e quando a IA transfere a conversa para um humano. Isso acontece quando:

- Paciente pede para falar com "atendente", "humano", "pessoa"
- Paciente demonstra irritacao ou insatisfacao
- IA nao consegue responder apos varias tentativas
- Perguntas especificas sobre procedimentos medicos

### Como Responder Manualmente

1. Abra a conversa com Handoff ativo
2. Clique em "Assumir Conversa" ou "Reivindicar"
3. Digite sua mensagem no campo de texto
4. Clique em "Enviar" - vai direto para WhatsApp do paciente
5. Apos resolver, clique em "Finalizar Handoff"

### Informacoes da Conversa

- **Historico Completo**: Todas as mensagens trocadas
- **Resumo da IA**: Sintese automatica do que foi conversado
- **Sentimento**: Classificacao do tom (positivo/neutro/negativo)
- **Intencao Detectada**: O que o paciente quer (agendar, informacoes, reclamacao)
- **Dados do Cliente**: Link para perfil completo

---

## 5. Clientes - Base de Dados

### Visao Geral

Banco de dados completo de todos os leads e pacientes da clinica.

### Campos Armazenados

#### Dados Pessoais
- **Telefone**: Numero WhatsApp (identificador unico)
- **Nome**: Nome completo
- **Email**: Para comunicacoes adicionais
- **CPF**: Documento (opcional)
- **Data de Nascimento**: Para calculo de idade

#### Classificacao do Lead
- **Status**: Lead, Qualificado, Agendado, Paciente, Perdido
- **Estagio**: Conexao, Problema, Impacto, Decisao, Agendamento
- **Interesse**: Tratamento desejado
- **Origem**: Instagram, Google, Indicacao, WhatsApp Direto

#### Dados Financeiros
- **Status de Pagamento**: Pago, Pendente, Parcial, Atrasado
- **Valor**: Montante pago ou devido
- **Data do Pagamento**: Quando foi realizado

#### Historico Clinico
- **Total de Consultas**: Quantas vezes veio a clinica
- **Ultima Consulta**: Data do ultimo atendimento
- **Notas**: Observacoes adicionais

### Filtros e Busca

- Buscar por nome, telefone ou email
- Filtrar por status do lead
- Filtrar por estagio no funil
- Filtrar por tratamento de interesse

---

## 6. Agenda - Agendamentos

### Visualizacoes

| Modo | Descricao | Quando Usar |
|------|-----------|-------------|
| **Calendario** | Visualizacao por dia/semana/mes | Visao geral da agenda |
| **Lista** | Tabela com todos os agendamentos | Busca especifica |

### Status das Consultas

| Status | Cor | Descricao |
|--------|-----|-----------|
| **Pendente** | Amarelo | Aguardando confirmacao |
| **Confirmada** | Verde | Paciente confirmou presenca |
| **Concluida** | Azul | Consulta realizada |
| **Cancelada** | Vermelho | Paciente ou clinica cancelou |
| **Reagendada** | Laranja | Horario alterado |

### Como Criar um Agendamento

1. Clique em "+ Novo Agendamento"
2. Preencha os campos:
   - **Telefone**: Numero do paciente
   - **Data**: Selecione no calendario
   - **Hora**: Escolha horario disponivel
   - **Medico**: Dr. Gabriel ou Dr. Romulo
   - **Procedimento**: Tipo de tratamento
   - **Observacoes**: Notas adicionais
3. Clique em "Salvar"

### Sincronizacao com Google Sheets

Todos os agendamentos sao automaticamente sincronizados com a planilha:

- **ID da Planilha**: `1FGJ7Cr8Vd8fGU8cncDFplMo0gcUhRhjXg-qaHRVKFUo`
- **Formato das Abas**: `MES / ANO` (ex: NOVEMBRO / 2025)
- **Atualizacao**: Em tempo real
- **Cores**: Aplicadas automaticamente conforme status

---

## 7. Configuracoes - Personalizacao do Sistema

### Configuracoes da IA

#### Observacoes Personalizadas (MAIS IMPORTANTE!)

Este campo permite "ensinar" a IA sobre a clinica. Exemplos:

```
- Nosso Botox custa R$ 1.500 a R$ 2.500 dependendo da area
- Atendemos de segunda a sexta, das 9h as 18h
- Agendamos com antecedencia minima de 24h
- Seja sempre gentil e use "voce" ao inves de "senhor"
- Promocao de novembro: 20% de desconto no Botox
```

#### Modelo da IA

- **Padrao**: GPT-4 Turbo (mais inteligente)
- **Recomendacao**: Nao alterar sem orientacao tecnica

#### Temperatura

- **Valores baixos (0.1-0.3)**: Respostas previsveis e formais
- **Valores altos (0.7-1.0)**: Respostas mais criativas
- **Recomendacao**: 0.2-0.4 para atendimento medico

### Buffer de Mensagens

Quando ativado, o sistema espera um tempo antes de responder para agrupar mensagens sequenciais.

| Configuracao | Padrao | Descricao |
|--------------|--------|-----------|
| Tempo de Buffer | 30 segundos | Quanto esperar |
| Maximo de Mensagens | 5 | Limite de agrupamento |

### Configuracoes de Handoff

| Configuracao | Descricao |
|--------------|-----------|
| **Numero para Notificacoes** | WhatsApp que recebe alertas de handoff |
| **Palavras-chave** | Termos que ativam handoff (atendente, humano, reclamacao) |
| **Timeout** | Tempo para desativar handoff automaticamente |

### Ferramentas da IA

Funcionalidades que podem ser ativadas/desativadas:

| Ferramenta | Descricao | Recomendacao |
|------------|-----------|--------------|
| Agendar Consultas | IA pode marcar consultas | ATIVADO |
| Atualizar Dados | IA pode corrigir cadastro | ATIVADO |
| Registrar Interesse | IA registra tratamento desejado | ATIVADO |
| Solicitar Handoff | IA pode pedir ajuda humana | ATIVADO |

### Modo de Teste

- Quando ativado, IA funciona apenas para numeros na whitelist
- Use para testar mudancas antes de liberar para todos

---

## 8. Integracoes Externas

### WhatsApp (Zapi)

- **Funcao**: Receber e enviar mensagens
- **Webhook**: Recebe mensagens em tempo real
- **Envio**: API para responder pacientes

### Google Sheets

- **Funcao**: Sincronizar agenda
- **Estrutura**: Abas por mes, colunas por dia da semana
- **Dados**: Status, Nome, Procedimento, Valor

### OpenAI

| API | Funcao |
|-----|--------|
| GPT-4 Turbo | Conversacao inteligente |
| Whisper | Transcricao de audios |
| GPT-4 Vision | Analise de imagens |

### N8n

- **Funcao**: Automacao de workflows
- **Uso**: Sincronizacao hibrida com Sheets

---

## 9. Guia para Eliana e Equipe

### Rotina Diaria Recomendada

#### Manha (9h)
1. Abra o Dashboard
2. Verifique se ha Handoffs pendentes
3. Responda handoffs IMEDIATAMENTE
4. Revise agendamentos do dia

#### Durante o Dia
1. Monitore conversas ativas
2. Fique atenta a notificacoes de handoff
3. Confirme consultas do dia seguinte

#### Fim do Dia (18h)
1. Revise metricas do Dashboard
2. Compare com dia anterior
3. Atualize status de consultas realizadas

### Quando Intervir Manualmente

| Situacao | Acao |
|----------|------|
| Handoff Ativo | Responder o mais rapido possivel |
| Conversa Negativa | Investigar e intervir |
| Perguntas sobre precos especificos | Confirmar valores atuais |
| Urgencia medica | Encaminhar imediatamente |

### Mantendo Dados Atualizados

- Atualize promocoes nas observacoes da IA
- Corrija dados de clientes quando identificar erros
- Marque consultas como concluidas apos atendimento
- Atualize status de pagamento quando paciente pagar

### Erros a Evitar

- **NAO** ignorar Handoffs - pacientes estao esperando!
- **NAO** alterar configuracoes tecnicas sem entender
- **NAO** esquecer de confirmar consultas
- **NAO** deixar informacoes desatualizadas no prompt da IA

---

## 10. Solucao de Problemas

### Problemas Comuns

| Problema | Causa | Solucao |
|----------|-------|---------|
| Mensagens nao chegam | Webhook Zapi desconfigurado | Verificar URL no painel Zapi |
| IA nao responde | Chave OpenAI invalida | Verificar OPENAI_API_KEY |
| Sync com Sheets falha | Permissao insuficiente | Compartilhar planilha com service account |
| Handoff nao notifica | Numero incorreto | Verificar formato nas configuracoes |
| "Could not find week header" | Data inexistente na planilha | Verificar cabecalho da semana |
| "Could not find time slot" | Horario nao cadastrado | Adicionar horario na coluna A |

### Como Acessar Logs

1. Acesse o painel do Supabase
2. Va em Edge Functions > Logs
3. Filtre por funcao especifica
4. Analise erros detalhados

### Contato para Suporte Tecnico

Para problemas que nao conseguir resolver:
- Documente o erro com screenshots
- Anote horario exato do problema
- Entre em contato com a equipe tecnica

---

## Historico de Atualizacoes

| Data | Versao | Alteracoes |
|------|--------|------------|
| Nov 2025 | 2.0 | Documentacao expandida e detalhada |
| Nov 2025 | 1.5 | Adicionado guia para usuarios |
| Nov 2025 | 1.0 | Documentacao inicial |

---

**EvidenS CRM Navigator AI** - Desenvolvido para facilitar a gestao da sua clinica

*Documentacao atualizada em Novembro de 2025*

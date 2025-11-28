# Integração Google Sheets → Supabase

Sincronização automática de agendamentos da planilha do Google Sheets para o banco Supabase.

## 🎯 Arquitetura

```
Google Sheets → Apps Script (onEdit) → Edge Function → Supabase DB
```

## 📋 Setup

### 1. Configurar Edge Function

Este edge function já está criado e será deployed automaticamente. URL:
```
https://zslgqpnodzbehuflnbpq.supabase.co/functions/v1/receive-sheets-update
```

### 2. Configurar Google Apps Script

1. Abra sua planilha do Google Sheets
2. Vá em **Extensions > Apps Script**
3. Cole o código que está em `APPS_SCRIPT_CODE.txt`
4. **IMPORTANTE:** Ajuste as configurações no objeto `CONFIG` de acordo com sua planilha:

```javascript
const CONFIG = {
  DATE_COL: 1,      // Coluna da Data
  TIME_COL: 2,      // Coluna da Hora
  PATIENT_COL: 3,   // Coluna do Nome
  PHONE_COL: 4,     // Coluna do Telefone
  STATUS_COL: 5,    // Coluna do Status
  DOCTOR_COL: 6,    // Coluna do Médico
  PROCEDURE_COL: 7, // Coluna do Procedimento
  FIRST_DATA_ROW: 2,
};
```

5. Salve o projeto
6. Autorize as permissões quando solicitado

### 3. Testar

Execute a função `testSync()` no Apps Script para testar a integração sem editar a planilha.

## 📊 Estrutura da Planilha

Exemplo esperado:

| Data       | Hora  | Paciente       | Telefone      | Status     | Médico        | Procedimento |
|------------|-------|----------------|---------------|------------|---------------|--------------|
| 15/12/2024 | 10:00 | João Silva     | 11999887766   | confirmada | Dr. Gabriel   | Harmonização |
| 15/12/2024 | 14:30 | Maria Santos   | 11988776655   | pendente   | Dr. Rômulo    | Preenchimento|

## ⚙️ Funcionamento

### Trigger Automático

O Apps Script detecta automaticamente quando você:
- Edita qualquer célula relevante (data, hora, telefone, médico, etc.)
- Ignora edições no cabeçalho
- Ignora edições em colunas irrelevantes

### Processamento

1. **Apps Script** captura a edição e formata os dados
2. **Validação** local dos campos obrigatórios
3. **Envio** para o edge function via HTTP POST
4. **Edge Function** processa:
   - Busca ou cria o cliente pelo telefone
   - Busca o ID do médico pelo nome
   - Verifica se já existe appointment na mesma data/hora
   - Cria ou atualiza o appointment
5. **Feedback** visual na coluna H (✅ ou ❌)

### Feedback Visual

- ✅ **Verde**: Sincronizado com sucesso
- ❌ **Vermelho**: Erro (com mensagem)
- Feedback desaparece após 3 segundos (sucesso) ou fica permanente (erro)

## 🔧 Personalização

### Formato de Data

O script aceita:
- Objeto Date do Google Sheets
- String no formato DD/MM/YYYY
- String no formato DD-MM-YYYY

### Formato de Hora

O script aceita:
- Objeto Date (extrai hora)
- String no formato HH:MM
- String no formato HHMM

### Normalização de Telefone

Todos os caracteres não numéricos são removidos:
- `(11) 99988-7766` → `11999887766`
- `11 9 9988 7766` → `11999887766`

## 🐛 Debugging

### Logs no Apps Script

Vá em **Extensions > Apps Script > Executions** para ver os logs de todas as execuções.

### Logs no Supabase

```bash
# Ver logs do edge function
supabase functions logs receive-sheets-update
```

Ou acesse: https://supabase.com/dashboard/project/zslgqpnodzbehuflnbpq/functions/receive-sheets-update/logs

### Teste Manual

Execute `testSync()` no Apps Script para testar a linha 2 da planilha manualmente.

## 🚨 Problemas Comuns

### "Missing required fields"

Certifique-se que as colunas obrigatórias estão preenchidas:
- Data
- Hora
- Telefone
- Médico

### "Doctor not found"

O nome do médico na planilha deve conter parte do nome cadastrado no banco:
- ✅ "Gabriel" → encontra "Dr. Gabriel"
- ✅ "Dr. Gabriel" → encontra "Dr. Gabriel"
- ✅ "Romulo" → encontra "Dr. Rômulo"

### Feedback não aparece

Verifique se a coluna H está livre para o feedback visual.

## 🔮 Fallback: AI Studio

Se a estrutura da planilha mudar drasticamente em dezembro, podemos migrar para Google AI Studio:
- Tolerante a mudanças de estrutura
- Entende contexto e variações
- Latência de ~2-5s
- Custo: ~$0.0001 por linha

A migração leva ~30 minutos.

# 📊 Sync to Google Sheets with Gemini AI

Sistema inteligente que sincroniza appointments do Supabase para Google Sheets, usando **Gemini AI** para analisar dinamicamente a estrutura da planilha.

## 🎯 Por que usar este método?

✅ **Funciona com planilhas irregulares** - Gemini AI entende estruturas dinâmicas  
✅ **Não precisa mapear colunas manualmente** - AI descobre a estrutura automaticamente  
✅ **Detecta conflitos** - Verifica se slot já está ocupado  
✅ **Formatação automática** - Aplica cores baseadas no status  
✅ **Fallback inteligente** - Se AI falhar, usa lógica baseada em regras

---

## 🚀 Setup Completo

### **Passo 1: Configurar Google Apps Script**

1. Abra sua planilha "AGENDA 2025" no Google Sheets
2. Vá em **Extensions > Apps Script**
3. Delete qualquer código existente
4. Cole o código de `APPS_SCRIPT_CODE.txt`
5. Salve o projeto (Ctrl+S ou Cmd+S)

### **Passo 2: Configurar Gemini API Key**

1. Obtenha uma API key do Gemini:
   - Vá em https://aistudio.google.com/app/apikey
   - Clique em "Create API Key"
   - Copie a key

2. No Apps Script, vá em **Project Settings** (ícone de engrenagem)
3. Em **Script Properties**, clique em "Add script property"
4. Adicione:
   - Property: `GEMINI_API_KEY`
   - Value: [Cole sua API key aqui]

### **Passo 3: Deploy como Web App**

1. No Apps Script, clique em **Deploy > New deployment**
2. Clique no ícone de engrenagem e escolha **Web app**
3. Configure:
   - Description: "Sync Appointments to Sheets"
   - Execute as: **Me**
   - Who has access: **Anyone** (ou "Anyone with the link")
4. Clique em **Deploy**
5. **Copie a URL do Web App** - você vai precisar dela!
   - Formato: `https://script.google.com/macros/s/AKfycbz.../exec`

### **Passo 4: Configurar Supabase Edge Function**

1. Vá no Supabase Dashboard
2. Edge Functions > `sync-to-n8n`
3. Adicione uma variável de ambiente:
   - Key: `GOOGLE_SHEETS_WEBHOOK_URL`
   - Value: [Cole a URL do Web App aqui]

---

## 🧪 Testar o Sistema

### **Teste Manual no Apps Script:**

1. No Apps Script, selecione a função `testSync` no dropdown
2. Clique em **Run** (▶️)
3. Na primeira vez, autorize as permissões
4. Verifique os logs (View > Logs) para ver o resultado

### **Teste via Webhook:**

```bash
# Substitua YOUR_WEB_APP_URL pela URL do seu Web App
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentDate": "2025-11-25",
    "appointmentTime": "14:00",
    "doctor": "Dr. Gabriel",
    "name": "João Silva",
    "procedure": "Consulta",
    "phone": "5511999999999",
    "status": "confirmada_paciente"
  }'
```

### **Teste via Supabase:**

1. Crie ou atualize um appointment no Supabase
2. Verifique os logs da Edge Function `sync-to-n8n`
3. Verifique a planilha do Google Sheets

---

## 🤖 Como Funciona o AI

### **Análise Inteligente:**

O Gemini AI recebe:
- **Estrutura da planilha** (primeiras 30 linhas e colunas)
- **Dados do appointment** (data, hora, médico, etc)

E retorna:
```json
{
  "row": 5,
  "col": 7,
  "confidence": 95,
  "reasoning": "Encontrei Terça-feira na coluna G e 14:00 na linha 5"
}
```

### **Sistema de Fallback:**

Se o AI falhar ou tiver baixa confiança (<50%), o sistema usa lógica baseada em regras:

**Mapeamento fixo:**
- Segunda = Coluna B (2)
- Terça = Coluna G (7)
- Quarta = Coluna L (12)
- Quinta = Coluna Q (17)
- Sexta = Coluna V (22)
- Sábado = Coluna AA (27)

**Horários:** Procura na coluna A pelo horário exato

---

## 📊 Estrutura de Dados

### **Payload esperado pelo webhook:**

```json
{
  "appointmentDate": "2025-11-25",      // YYYY-MM-DD ou DD/MM/YYYY
  "appointmentTime": "14:00",           // HH:MM
  "doctor": "Dr. Gabriel",              // Nome do médico
  "name": "João Silva",                 // Nome do paciente (opcional)
  "procedure": "Consulta",              // Procedimento (opcional)
  "phone": "5511999999999",            // Telefone (opcional)
  "status": "confirmada_paciente"      // Status do appointment
}
```

### **Status e cores:**

| Status | Cor | Hex |
|--------|-----|-----|
| `pendente_confirmacao` | Laranja | `#fb923c` |
| `confirmada_paciente` | Verde | `#10b981` |
| `confirmada` | Verde | `#10b981` |
| `cancelada_paciente` | Vermelho | `#ef4444` |
| `cancelada` | Vermelho | `#ef4444` |
| `completed` | Azul | `#3b82f6` |

---

## 🔧 Troubleshooting

### **"GEMINI_API_KEY not configured"**

**Solução:** Configure a API key nas Script Properties (veja Passo 2)

### **"Sheet NOVEMBRO/2025 not found"**

**Solução:** O script usa a primeira sheet disponível como fallback. Certifique-se de que as sheets têm nomes no formato `MÊS/ANO` (ex: `NOVEMBRO/2025`)

### **"Slot ocupado"**

**Comportamento esperado:** O sistema detectou que já existe um appointment naquela célula e não sobrescreveu.

### **AI retornando célula errada**

1. Verifique os logs do Apps Script (View > Logs)
2. Veja o campo `reasoning` na resposta do AI
3. Se necessário, ajuste o prompt na função `findCellWithAI`
4. Ou aumente a confiança mínima (atualmente 50%)

### **Erro de permissões**

1. Vá em Apps Script > Project Settings
2. Marque "Show 'appsscript.json' manifest file in editor"
3. Adicione os escopos necessários em `appsscript.json`:

```json
{
  "timeZone": "America/Sao_Paulo",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```

---

## 📈 Monitoramento

### **Logs no Apps Script:**

1. No Apps Script, vá em **View > Logs** (ou Ctrl+Enter)
2. Veja detalhes de cada execução:
   - Dados recebidos
   - Resposta do AI
   - Célula encontrada
   - Sucesso/erro

### **Logs no Supabase:**

1. Supabase Dashboard > Edge Functions > `sync-to-n8n`
2. Veja logs de chamadas ao webhook
3. Identifique erros de conexão

---

## 🎨 Customização

### **Ajustar mapeamento de colunas:**

Edite a função `findCellFallback()` e atualize o objeto `dayToCol`:

```javascript
const dayToCol = {
  'Segunda': 2,   // Coluna B
  'Terça': 7,     // Coluna G
  'Quarta': 12,   // Sua coluna personalizada
  // ...
};
```

### **Ajustar formatação de texto:**

Edite a função `formatAppointmentText()`:

```javascript
function formatAppointmentText(data) {
  return `${data.name}\n${data.procedure}\nTel: ${data.phone}`;
}
```

### **Ajustar cores:**

Edite a função `applyStatusFormatting()` no objeto `statusColors`.

### **Melhorar prompt do AI:**

Edite a variável `prompt` na função `findCellWithAI()` para dar mais contexto ao Gemini.

---

## 💡 Dicas

1. **Teste sempre com `testSync()`** antes de usar em produção
2. **Monitore os logs** nas primeiras semanas para ajustar o prompt
3. **Mantenha a estrutura da planilha consistente** quando possível
4. **Use o Gemini AI Studio** para testar prompts antes de colocá-los no código
5. **Crie backups** da planilha antes de mudanças grandes

---

## 🔄 Atualizar Edge Function

Atualize `supabase/functions/sync-to-n8n/index.ts` para chamar o webhook do Apps Script:

```typescript
// Adicione no início do arquivo
const GOOGLE_SHEETS_WEBHOOK_URL = Deno.env.get('GOOGLE_SHEETS_WEBHOOK_URL');

// No final da função, após enviar para N8n:
if (GOOGLE_SHEETS_WEBHOOK_URL) {
  try {
    const sheetsResponse = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const sheetsResult = await sheetsResponse.json();
    console.log('Google Sheets sync result:', sheetsResult);
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
  }
}
```

---

## ❓ Perguntas Frequentes

**Q: O AI consome muitos tokens?**  
A: Não. Cada sincronização usa ~200-500 tokens. Com 1M de tokens grátis por mês no Gemini, você pode fazer ~2000 sincronizações gratuitas.

**Q: O que acontece se a planilha mudar completamente?**  
A: O AI se adapta automaticamente. Ele analisa a estrutura atual antes de cada inserção.

**Q: Posso usar sem o Gemini AI?**  
A: Sim. Se `GEMINI_API_KEY` não estiver configurada, o sistema usa o fallback automático.

**Q: Como adicionar mais médicos?**  
A: Não é necessário. O AI identifica automaticamente todas as colunas de médicos.

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do Apps Script
2. Verifique os logs da Edge Function no Supabase
3. Teste com `testSync()` no Apps Script
4. Verifique se a API key do Gemini está correta

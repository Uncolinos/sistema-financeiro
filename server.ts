import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error('A chave de API do Gemini (GEMINI_API_KEY) não está configurada nos Secrets.');
    }
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// 1. API: Analyze Current Financial State
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { transactions, budget } = req.body;
    
    if (!transactions || !budget) {
      return res.status(400).json({ error: 'Os dados de transações e orçamento são necessários.' });
    }

    const ai = getGeminiClient();

    // Prepare a concise but complete picture for Gemini
    const financialSummaryText = `
      --- ORÇAMENTO ---
      Limite Geral Mensal: R$ ${budget.overall}
      Limites por Categoria:
      ${Object.entries(budget.byCategory)
        .map(([cat, val]) => `- ${cat}: R$ ${val}`)
        .join('\n')}

      --- HISTÓRICO DE TRANSAÇÕES ---
      ${transactions
        .map(
          (t: any) =>
            `- ${t.date} | [${t.type.toUpperCase()}] ${t.title} | ${t.category} | R$ ${t.amount} | Status: ${t.paymentStatus} | Método: ${t.paymentMethod}`
        )
        .join('\n')}
    `;

    const systemInstruction = `
      Você é o Mentor Financeiro IA, um orientador financeiro de elite do Brasil, empático, altamente analítico e focado em soluções práticas de economia e prosperidade.
      Sua tarefa é auditar as transações e orçamentos fornecidos pelo usuário e retornar um relatório estruturado no modelo JSON solicitado.
      Seja muito realista, faça cálculos matemáticos precisos baseando-se nas despesas e receitas enviadas. 
      Lembre-se de saudar o usuário calorosamente e manter um tom estimulante e inspirador. Siga as instruções estritamente em português.
    `;

    const prompt = `
      Analise os seguintes dados financeiros pessoais e forneça o relatório JSON estruturado:
      ${financialSummaryText}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            generalStatus: { 
              type: Type.STRING, 
              description: 'Resumo interpretativo Geral de 2 ou 3 frases sobre a saúde financeira do período.' 
            },
            savingsRate: { 
              type: Type.NUMBER, 
              description: 'Porcentagem calculada de economia (Receita Restante / Receita Total * 100), arredondada para 1 casa decimal.' 
            },
            topWarnings: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'Lista de 2 a 4 pontos de atenção específicos (estouro de orçamento, excesso em categoria, ou despesas pendentes).'
            },
            actionPlan: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'Lista de 3 a 4 metas ou conselhos altamente acionáveis para o usuário reverter gastos ou otimizar investimentos.'
            },
            aiCoachMessage: { 
              type: Type.STRING, 
              description: 'Uma mensagem pessoal inspiradora do Mentor Financeiro de cerca de 100 palavras incentivando o usuário.' 
            },
          },
          required: ['generalStatus', 'savingsRate', 'topWarnings', 'actionPlan', 'aiCoachMessage'],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Nenhuma resposta de texto retornada pelo Gemini.');
    }

    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('Erro na análise de IA:', error);
    res.status(500).json({ error: error.message || 'Erro ao processar análise do Gemini' });
  }
});

// 2. API: Assistant Conversational Chat
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, transactions, budget, userMessage } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'A mensagem do usuário é obrigatória.' });
    }

    const ai = getGeminiClient();

    const financialContext = `
      --- CONTEXTO ATUAL DO USUÁRIO ---
      Orçamento Total Configurado: R$ ${budget?.overall || 'Não informado'}
      Transações Recentes:
      ${(transactions || [])
        .slice(0, 15)
        .map(
          (t: any) =>
            `- ${t.date} | [${t.type.toUpperCase()}] ${t.title} | R$ ${t.amount} | Categoria: ${t.category} | Status: ${t.paymentStatus}`
        )
        .join('\n')}
    `;

    const systemInstruction = `
      Você é o "Mentor Financeiro IA", o especialista financeiro pessoal inteligente integrado no aplicativo do usuário.
      Você ajuda o usuário a entender melhor seus gastos, orçamentos, investimentos e tomar decisões inteligentes.
      Você tem acesso direto aos dados financeiros atuais dele (que estão listados abaixo de forma privada para você). Use estes dados reais quando apropriado para responder de forma super personalizada.
      Por exemplo, se o usuário perguntar "quanto gastei com lazer?", faça a soma real nos dados recebidos e responda.
      Seja sempre prestativo, claro, profissional e empático nos seus conselhos financeiros. Responda em português (do Brasil), de forma amigável, concisa e estruturada.
      Não use linguajar técnico excessivamente denso, prefira explicar de forma intuitiva.
      
      ${financialContext}
    `;

    // Process chat history
    const geminiContents = [];
    
    // Convert history format to Gemini parts
    if (messages && messages.length > 0) {
      for (const msg of messages) {
        geminiContents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }

    // Append the last user message
    geminiContents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: geminiContents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text;
    res.json({ reply });
  } catch (error: any) {
    console.error('Erro no chat de IA:', error);
    res.status(500).json({ error: error.message || 'Erro de comunicação com o Mentor Financeiro' });
  }
});

// Setup Vite & Static Assets serving
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Finance Server] Running correctly at http://localhost:${PORT}`);
  });
}

bootstrap();

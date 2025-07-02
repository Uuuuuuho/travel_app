import OpenAI from 'openai';

export type ChatRole = 'system' | 'user' | 'assistant';
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

class LLMService {
  private openai: OpenAI | null;

  constructor() {
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
  }

  /**
   * Send chat completion request to either OpenAI or a local Ollama server.
   * If both are unavailable, throws an error so that caller can decide to fallback.
   */
  async chat(
    messages: ChatMessage[],
    opts: { model?: string; max_tokens?: number; temperature?: number } = {},
  ): Promise<string> {
    const { model = 'gpt-4', max_tokens = 2048, temperature = 0.7 } = opts;

    // 1) Prefer OpenAI when available
    if (this.openai) {
      const res = await this.openai.chat.completions.create({
        model,
        messages,
        max_tokens,
        temperature,
      });
      return res.choices[0]?.message?.content ?? '';
    }

    // 2) Fallback to Ollama
    const ollamaUrl = process.env.OLLAMA_URL ?? 'http://localhost:11434/api/chat';
    const body = {
      model: process.env.OLLAMA_MODEL ?? 'mistral',
      messages,
      stream: false,
    } as const;

    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${await response.text()}`);
    }

    const data: any = await response.json();
    // Ollama returns { message: { role, content }, ... }
    return data?.message?.content ?? '';
  }

  /** Returns true if at least one LLM backend is available */
  isAvailable(): boolean {
    return !!(this.openai || process.env.OLLAMA_URL);
  }
}

export const llmService = new LLMService(); 
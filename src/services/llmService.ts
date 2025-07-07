import OpenAI from 'openai';

export type ChatRole = 'system' | 'user' | 'assistant';
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

class LLMService {
  private openai: OpenAI | null;

  constructor() {
    if (process.env.VLLM_BASE_URL) {
      this.openai = new OpenAI({
        apiKey: process.env.VLLM_API_KEY || 'no-key-required', // vLLM may not require a key
        baseURL: process.env.VLLM_BASE_URL,
      });
    } else if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } else {
      this.openai = null;
    }
  }

  /**
   * Send chat completion request to either OpenAI or a vLLM/Ollama server.
   * If both are unavailable, throws an error so that caller can decide to fallback.
   */
  async chat(
    messages: ChatMessage[],
    opts: { model?: string; max_tokens?: number; temperature?: number } = {},
  ): Promise<string> {
    const { model, max_tokens = 4096, temperature = 0.7 } = opts;

    // 1) Prefer OpenAI-compatible endpoint (OpenAI, vLLM) when available
    if (this.openai) {
      try {
        const modelToUse = model || (process.env.VLLM_MODEL || 'gpt-4');
        console.log(`Using LLM model: ${modelToUse}`);
        
        // Convert system messages to user messages for vLLM compatibility
        const processedMessages = this.processMessagesForvLLM(messages);
        
        const res = await this.openai.chat.completions.create({
          model: modelToUse,
          messages: processedMessages,
          max_tokens,
          temperature,
        });
        
        const content = res.choices[0]?.message?.content ?? '';
        console.log('LLM response received successfully');
        return content;
      } catch (error) {
        console.error('OpenAI/vLLM API error:', error);
        
        // If this is a vLLM instance, try with a more basic request
        if (process.env.VLLM_BASE_URL) {
          console.log('Retrying with simplified vLLM request...');
          try {
            const processedMessages = this.processMessagesForvLLM(messages);
            const res = await this.openai.chat.completions.create({
              model: model || process.env.VLLM_MODEL || 'default',
              messages: processedMessages,
              max_tokens: Math.min(max_tokens, 2048), // Reduce token limit for vLLM
              temperature: Math.min(temperature, 1.0), // Ensure temperature is within bounds
            });
            return res.choices[0]?.message?.content ?? '';
          } catch (retryError) {
            console.error('vLLM retry failed:', retryError);
            throw new Error(`vLLM error: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
          }
        }
        
        throw new Error(`LLM API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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

  /** Process messages to be compatible with vLLM (convert system to user messages) */
  private processMessagesForvLLM(messages: ChatMessage[]): ChatMessage[] {
    if (!process.env.VLLM_BASE_URL) {
      return messages; // Don't modify for non-vLLM endpoints
    }

    return messages.map(msg => {
      if (msg.role === 'system') {
        return {
          role: 'user' as ChatRole,
          content: `Instructions: ${msg.content}\n\nPlease follow the above instructions carefully.`
        };
      }
      return msg;
    });
  }
}

export const llmService = new LLMService();
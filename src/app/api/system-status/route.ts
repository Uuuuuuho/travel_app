import { NextResponse } from 'next/server';
import { llmService } from '@/services/llmService';

export async function GET() {
  try {
    const isAvailable = llmService.isAvailable();
    
    let llmType = 'none';
    if (process.env.VLLM_BASE_URL) {
      llmType = `vLLM (${process.env.VLLM_BASE_URL})`;
    } else if (process.env.OPENAI_API_KEY) {
      llmType = 'OpenAI';
    } else if (process.env.OLLAMA_URL) {
      llmType = 'Ollama';
    }

    // Test if LLM is actually working by making a simple request
    let testResult = null;
    if (isAvailable) {
      try {
        console.log(`Testing ${llmType} connection...`);
        testResult = await llmService.chat([
          { role: 'user', content: 'Reply with exactly: "OK"' }
        ], { max_tokens: 10, temperature: 0 });
        console.log(`${llmType} test result:`, testResult);
      } catch (error) {
        console.error(`${llmType} test failed:`, error);
        return NextResponse.json({
          llmAvailable: false,
          llmType,
          error: `LLM test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    return NextResponse.json({
      llmAvailable: isAvailable && testResult !== null,
      llmType,
      testResponse: testResult,
      environment: {
        hasVllmUrl: !!process.env.VLLM_BASE_URL,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasOllamaUrl: !!process.env.OLLAMA_URL,
        vllmModel: process.env.VLLM_MODEL || 'not set'
      }
    });
  } catch (error) {
    console.error('System status check failed:', error);
    return NextResponse.json({
      llmAvailable: false,
      llmType: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

import { EventEmitter } from 'eventemitter3';
import { Plugin, PluginManifest } from '../types';
import Groq from 'groq-sdk';

export class GroqPlugin extends EventEmitter implements Plugin {
  public manifest: PluginManifest = {
    id: 'plugin:groq',
    name: 'Groq Cloud Plugin',
    version: '0.1.0',
    description: 'AI inference and language model completion powered by Groq',
    author: 'CozanetOS',
    category: 'ai',
    authType: 'apikey',
    permissions: ['ai:complete', 'ai:stream', 'ai:embed'],
    capabilities: [
      {
        name: 'complete',
        description: 'Generate highly optimized LLM text completions',
        inputSchema: {
          type: 'object',
          properties: {
            messages: { type: 'array', items: { type: 'object' } },
            model: { type: 'string', default: 'mixtral-8x7b-32768' }
          },
          required: ['messages']
        },
        outputSchema: { type: 'object' },
        requiresAuth: true
      },
      {
        name: 'stream',
        description: 'Stream optimized LLM completions back to client',
        inputSchema: {
          type: 'object',
          properties: {
            messages: { type: 'array', items: { type: 'object' } },
            model: { type: 'string' }
          },
          required: ['messages']
        },
        outputSchema: { type: 'object' },
        requiresAuth: true
      },
      {
        name: 'embed',
        description: 'Generate high-performance embeddings',
        inputSchema: {
          type: 'object',
          properties: {
            input: { type: 'string' },
            model: { type: 'string' }
          },
          required: ['input']
        },
        outputSchema: { type: 'object' },
        requiresAuth: true
      }
    ],
    events: ['completion:started', 'completion:done', 'error'],
    actions: ['complete', 'stream', 'embed', 'listModels'],
    entrypoint: 'src/AIProviders/groq-plugin.ts'
  };

  private ready = false;
  private apiKeys: string[] = [];
  private currentKeyIndex = 0;

  public async init(config: Record<string, string> = {}): Promise<void> {
    const keys = [
      config.GROQ_API_KEY_1 || process.env.GROQ_API_KEY_1,
      config.GROQ_API_KEY_2 || process.env.GROQ_API_KEY_2,
      config.GROQ_API_KEY_3 || process.env.GROQ_API_KEY_3
    ].filter((k): k is string => typeof k === 'string' && k.length > 0);

    this.apiKeys = keys;
    this.ready = this.apiKeys.length > 0;

    if (!this.ready) {
      console.warn('Warning: No GROQ_API_KEYs (1/2/3) found. Groq Plugin is initialized but offline.');
    }
  }

  public async destroy(): Promise<void> {
    this.ready = false;
    this.apiKeys = [];
  }

  public isReady(): boolean {
    return this.ready;
  }

  private getClient(): Groq {
    if (this.apiKeys.length === 0) {
      throw new Error('Groq API Key is not set up. Please provide GROQ_API_KEY_1, 2, or 3.');
    }
    const key = this.apiKeys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    return new Groq({ apiKey: key });
  }

  public async execute(action: string, params: any): Promise<any> {
    this.emit('execution:started', { action, params });
    try {
      switch (action) {
        case 'complete': {
          const model = params.model || 'mixtral-8x7b-32768';
          const client = this.getClient();
          this.emit('completion:started', { model, messages: params.messages });
          const response = await client.chat.completions.create({
            messages: params.messages,
            model,
            temperature: params.temperature ?? 0.7
          });
          this.emit('completion:done', response);
          return response;
        }
        case 'stream': {
          const model = params.model || 'mixtral-8x7b-32768';
          const client = this.getClient();
          return await client.chat.completions.create({
            messages: params.messages,
            model,
            stream: true
          });
        }
        case 'embed': {
          const client = this.getClient();
          return await client.embeddings.create({
            input: params.input,
            model: params.model || 'nomic-embed-text-v1.5'
          });
        }
        case 'listModels': {
          const client = this.getClient();
          return await client.models.list();
        }
        default:
          throw new Error(`Unsupported action "${action}" in Groq Plugin.`);
      }
    } catch (err: any) {
      this.emit('error', err);
      throw err;
    }
  }
}

export const groqPlugin = new GroqPlugin();

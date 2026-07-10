import { Plugin } from '../types';

export const groqPlugin: Plugin = {
  id: 'plugin:groq',
  name: 'Groq Cloud Plugin',
  version: '0.1.0',
  description: 'AI translation & reasoning service powered by Groq',
  init: async () => {
    if (!process.env.GROQ_API_KEY_1) {
      console.warn('Warning: GROQ_API_KEY_1 environment variable is missing for Groq Plugin.');
    }
  },
  destroy: async () => {},
  handlers: {
    complete: async (args: { messages: any[]; model?: string }) => {
      const apiKey = process.env.GROQ_API_KEY_1;
      if (!apiKey) {
        throw new Error('GROQ_API_KEY_1 environment variable is not defined.');
      }

      const model = args.model || 'mixtral-8x7b-32768';
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: args.messages
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq completion request failed: ${response.status} - ${errorText}`);
      }

      return response.json();
    }
  }
};

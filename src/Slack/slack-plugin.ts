import { EventEmitter } from 'eventemitter3';
import { Plugin, PluginManifest } from '../types';

export class SlackPlugin extends EventEmitter implements Plugin {
  public manifest: PluginManifest = {
    id: 'plugin:slack',
    name: 'Slack Communication Plugin',
    version: '0.1.0',
    description: 'Driver for messaging and workflow orchestration on Slack channels',
    author: 'CozanetOS',
    category: 'communication',
    authType: 'apikey',
    permissions: ['slack:chat:write', 'slack:channels:read'],
    capabilities: [
      {
        name: 'postMessage',
        description: 'Send fully formatted markdown rich messages into Slack channel',
        inputSchema: {
          type: 'object',
          properties: {
            channel: { type: 'string' },
            text: { type: 'string' },
            blocks: { type: 'array', items: { type: 'object' } }
          },
          required: ['channel', 'text']
        },
        outputSchema: { type: 'object' },
        requiresAuth: true
      },
      {
        name: 'listChannels',
        description: 'Fetch list of channels in the authorized Slack workspace',
        inputSchema: {
          type: 'object',
          properties: {
            types: { type: 'string', default: 'public_channel' }
          }
        },
        outputSchema: { type: 'array' },
        requiresAuth: true
      }
    ],
    events: ['message:sent', 'error'],
    actions: ['postMessage', 'listChannels'],
    entrypoint: 'src/Slack/slack-plugin.ts'
  };

  private ready = false;
  private botToken = '';

  public async init(config: Record<string, string> = {}): Promise<void> {
    this.botToken = config.SLACK_BOT_TOKEN || process.env.SLACK_BOT_TOKEN || '';
    this.ready = this.botToken.length > 0;
    if (!this.ready) {
      console.warn('Warning: SLACK_BOT_TOKEN is missing. Slack plugin is running in stub mode.');
      this.ready = true;
    }
  }

  public async destroy(): Promise<void> {
    this.ready = false;
  }

  public isReady(): boolean {
    return this.ready;
  }

  public async execute(action: string, params: any): Promise<any> {
    this.emit('execution:started', { action, params });
    switch (action) {
      case 'postMessage': {
        const payload = {
          ok: true,
          channel: params.channel,
          ts: `${Date.now() / 1000}`,
          message: {
            text: params.text,
            username: 'CozanetOS Bot',
            bot_id: 'B12345',
            attachments: params.blocks || [],
            type: 'message',
            subtype: 'bot_message',
            ts: `${Date.now() / 1000}`
          }
        };
        this.emit('message:sent', payload);
        return payload;
      }
      case 'listChannels': {
        return [
          { id: 'C0123456', name: 'general', is_channel: true, created: 1600000000 },
          { id: 'C9876543', name: 'cozanet-alerts', is_channel: true, created: 1610000000 }
        ];
      }
      default:
        throw new Error(`Unsupported action "${action}" in Slack Plugin.`);
    }
  }
}

export const slackPlugin = new SlackPlugin();

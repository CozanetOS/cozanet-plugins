import { EventEmitter } from 'eventemitter3';
import { Plugin, PluginManifest } from '../types';
import nodemailer from 'nodemailer';

export class EmailPlugin extends EventEmitter implements Plugin {
  public manifest: PluginManifest = {
    id: 'plugin:email',
    name: 'Email Communication Plugin',
    version: '0.1.0',
    description: 'Nodemailer mailer driver with support for inbox stubs',
    author: 'CozanetOS',
    category: 'communication',
    authType: 'basic',
    permissions: ['email:send', 'email:read'],
    capabilities: [
      {
        name: 'send',
        description: 'Send fully formatted SMTP messages',
        inputSchema: {
          type: 'object',
          properties: {
            to: { type: 'string' },
            subject: { type: 'string' },
            text: { type: 'string' },
            html: { type: 'string' }
          },
          required: ['to', 'subject', 'text']
        },
        outputSchema: { type: 'object' },
        requiresAuth: true
      },
      {
        name: 'listInbox',
        description: 'List recent email messages (Stub capability)',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'integer', default: 10 }
          }
        },
        outputSchema: { type: 'array' },
        requiresAuth: true
      },
      {
        name: 'search',
        description: 'Search for matching messages (Stub capability)',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' }
          },
          required: ['query']
        },
        outputSchema: { type: 'array' },
        requiresAuth: true
      }
    ],
    events: ['email:sent', 'error'],
    actions: ['send', 'listInbox', 'search'],
    entrypoint: 'src/Email/email-plugin.ts'
  };

  private ready = false;
  private transporter: nodemailer.Transporter | null = null;

  public async init(config: Record<string, string> = {}): Promise<void> {
    const host = config.SMTP_HOST || process.env.SMTP_HOST;
    const port = parseInt(config.SMTP_PORT || process.env.SMTP_PORT || '587', 10);
    const user = config.SMTP_USER || process.env.SMTP_USER;
    const pass = config.SMTP_PASS || process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
      this.ready = true;
    } else {
      console.warn('Warning: SMTP parameters missing. Email plugin is running in stub mock mode.');
      this.ready = true; // Still mark as ready for stub fallback
    }
  }

  public async destroy(): Promise<void> {
    this.transporter = null;
    this.ready = false;
  }

  public isReady(): boolean {
    return this.ready;
  }

  public async execute(action: string, params: any): Promise<any> {
    this.emit('execution:started', { action, params });

    try {
      switch (action) {
        case 'send': {
          if (this.transporter) {
            const info = await this.transporter.sendMail({
              from: process.env.SMTP_FROM || 'no-reply@cozanetos.com',
              to: params.to,
              subject: params.subject,
              text: params.text,
              html: params.html
            });
            this.emit('email:sent', info);
            return info;
          } else {
            // Mock response
            const info = {
              messageId: `mock-email-id-${Math.random().toString(36).substr(2, 9)}`,
              envelope: { from: 'no-reply@cozanetos.com', to: [params.to] },
              response: '250 Mock email accepted',
              isMock: true
            };
            this.emit('email:sent', info);
            return info;
          }
        }
        case 'listInbox': {
          const limit = params.limit || 10;
          return new Array(limit).fill(null).map((_, i) => ({
            id: `msg-${i + 1}`,
            from: 'newsletter@example.com',
            subject: `Newsletter Issue #${i + 1}`,
            date: new Date(Date.now() - i * 3600000).toISOString(),
            body: 'Hello, this is a mock email stub response in CozanetOS plugin framework!'
          }));
        }
        case 'search': {
          return [
            {
              id: 'search-1',
              from: 'boss@corp.com',
              subject: `Urgent request regarding: ${params.query}`,
              date: new Date().toISOString(),
              body: `I searched everywhere but found nothing about "${params.query}".`
            }
          ];
        }
        default:
          throw new Error(`Unsupported action "${action}" in Email Plugin.`);
      }
    } catch (err) {
      this.emit('error', err);
      throw err;
    }
  }
}

export const emailPlugin = new EmailPlugin();

import { EventEmitter } from 'eventemitter3';
import { Plugin, PluginManifest } from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabasePlugin extends EventEmitter implements Plugin {
  public manifest: PluginManifest = {
    id: 'plugin:supabase',
    name: 'Supabase DB and Storage Plugin',
    version: '0.1.0',
    description: 'Plugin for connecting to Supabase database, performing operations, and handling uploads/downloads',
    author: 'CozanetOS',
    category: 'storage',
    authType: 'apikey',
    permissions: ['db:read', 'db:write', 'storage:read', 'storage:write'],
    capabilities: [
      {
        name: 'query',
        description: 'Query database tables with filters',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string' },
            select: { type: 'string', default: '*' },
            filter: { type: 'object' }
          },
          required: ['table']
        },
        outputSchema: { type: 'array' },
        requiresAuth: true
      },
      {
        name: 'insert',
        description: 'Insert records into database tables',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string' },
            data: { type: 'object' }
          },
          required: ['table', 'data']
        },
        outputSchema: { type: 'object' },
        requiresAuth: true
      },
      {
        name: 'update',
        description: 'Update records matching conditions',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string' },
            data: { type: 'object' },
            match: { type: 'object' }
          },
          required: ['table', 'data', 'match']
        },
        outputSchema: { type: 'object' },
        requiresAuth: true
      },
      {
        name: 'delete',
        description: 'Delete records matching conditions',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string' },
            match: { type: 'object' }
          },
          required: ['table', 'match']
        },
        outputSchema: { type: 'object' },
        requiresAuth: true
      },
      {
        name: 'upload',
        description: 'Upload file to a Supabase bucket',
        inputSchema: {
          type: 'object',
          properties: {
            bucket: { type: 'string' },
            path: { type: 'string' },
            fileBody: { type: 'string' },
            contentType: { type: 'string' }
          },
          required: ['bucket', 'path', 'fileBody']
        },
        outputSchema: { type: 'object' },
        requiresAuth: true
      },
      {
        name: 'download',
        description: 'Download file from a Supabase bucket',
        inputSchema: {
          type: 'object',
          properties: {
            bucket: { type: 'string' },
            path: { type: 'string' }
          },
          required: ['bucket', 'path']
        },
        outputSchema: { type: 'object' },
        requiresAuth: true
      },
      {
        name: 'subscribe',
        description: 'Subscribe to realtime changes on a table',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string' }
          },
          required: ['table']
        },
        outputSchema: { type: 'object' },
        requiresAuth: true
      }
    ],
    events: ['realtime:change', 'error'],
    actions: ['query', 'insert', 'update', 'delete', 'upload', 'download', 'subscribe'],
    entrypoint: 'src/Supabase/supabase-plugin.ts'
  };

  private ready = false;
  private client: SupabaseClient | null = null;

  public async init(config: Record<string, string> = {}): Promise<void> {
    const url = config.SUPABASE_URL || process.env.SUPABASE_URL;
    const key = config.SUPABASE_API_KEY || process.env.SUPABASE_API_KEY;

    if (url && key) {
      this.client = createClient(url, key);
      this.ready = true;
    } else {
      console.warn('Warning: SUPABASE_URL or SUPABASE_API_KEY is missing. Supabase plugin is offline.');
      this.ready = false;
    }
  }

  public async destroy(): Promise<void> {
    this.client = null;
    this.ready = false;
  }

  public isReady(): boolean {
    return this.ready;
  }

  private getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase Client is not initialized. Verify credentials.');
    }
    return this.client;
  }

  public async execute(action: string, params: any): Promise<any> {
    const sb = this.getClient();
    this.emit('execution:started', { action, params });

    try {
      switch (action) {
        case 'query': {
          let query = sb.from(params.table).select(params.select || '*');
          if (params.filter) {
            for (const [key, val] of Object.entries(params.filter)) {
              query = query.eq(key, val);
            }
          }
          const { data, error } = await query;
          if (error) throw error;
          return data;
        }
        case 'insert': {
          const { data, error } = await sb.from(params.table).insert(params.data).select();
          if (error) throw error;
          return data;
        }
        case 'update': {
          const { data, error } = await sb.from(params.table).update(params.data).match(params.match).select();
          if (error) throw error;
          return data;
        }
        case 'delete': {
          const { data, error } = await sb.from(params.table).delete().match(params.match).select();
          if (error) throw error;
          return data;
        }
        case 'upload': {
          // Supports base64 or raw string fileBody
          let body: any = params.fileBody;
          if (typeof params.fileBody === 'string' && params.fileBody.startsWith('base64,')) {
            body = Buffer.from(params.fileBody.substring(7), 'base64');
          }
          const { data, error } = await sb.storage.from(params.bucket).upload(params.path, body, {
            contentType: params.contentType,
            upsert: true
          });
          if (error) throw error;
          return data;
        }
        case 'download': {
          const { data, error } = await sb.storage.from(params.bucket).download(params.path);
          if (error) throw error;
          const text = await data.text();
          return { content: text, size: data.size, type: data.type };
        }
        case 'subscribe': {
          const channel = sb.channel(`realtime:${params.table}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: params.table }, (payload) => {
              this.emit('realtime:change', payload);
            })
            .subscribe();
          return { subscribed: true, channelId: channel.topic };
        }
        default:
          throw new Error(`Unsupported action "${action}" in Supabase Plugin.`);
      }
    } catch (err) {
      this.emit('error', err);
      throw err;
    }
  }
}

export const supabasePlugin = new SupabasePlugin();

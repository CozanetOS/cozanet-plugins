import { EventEmitter } from 'eventemitter3';
import { Plugin, PluginManifest } from '../types';

export class NotionPlugin extends EventEmitter implements Plugin {
  public manifest: PluginManifest = {
    id: 'plugin:notion',
    name: 'Notion Integration Plugin',
    version: '0.1.0',
    description: 'Interface driver for Notion workspaces, databases, and page rendering',
    author: 'CozanetOS',
    category: 'productivity',
    authType: 'apikey',
    permissions: ['notion:pages:read', 'notion:pages:write', 'notion:databases:read'],
    capabilities: [
      {
        name: 'queryDatabase',
        description: 'Query database items with filter schemas',
        inputSchema: {
          type: 'object',
          properties: {
            databaseId: { type: 'string' },
            filter: { type: 'object' }
          },
          required: ['databaseId']
        },
        outputSchema: { type: 'array' },
        requiresAuth: true
      },
      {
        name: 'createPage',
        description: 'Create a new Notion page within a database or existing page',
        inputSchema: {
          type: 'object',
          properties: {
            parentPageId: { type: 'string' },
            parentDatabaseId: { type: 'string' },
            properties: { type: 'object' }
          }
        },
        outputSchema: { type: 'object' },
        requiresAuth: true
      }
    ],
    events: ['page:created', 'error'],
    actions: ['queryDatabase', 'createPage'],
    entrypoint: 'src/Notion/notion-plugin.ts'
  };

  private ready = false;
  private apiKey = '';

  public async init(config: Record<string, string> = {}): Promise<void> {
    this.apiKey = config.NOTION_API_KEY || process.env.NOTION_API_KEY || '';
    this.ready = this.apiKey.length > 0;
    if (!this.ready) {
      console.warn('Warning: NOTION_API_KEY is missing. Notion plugin stub is operating in mock mode.');
      this.ready = true; // still allow stub mode
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
      case 'queryDatabase': {
        return [
          {
            object: 'page',
            id: `page-${Math.random().toString(36).substr(2, 9)}`,
            created_time: new Date().toISOString(),
            last_edited_time: new Date().toISOString(),
            cover: null,
            icon: null,
            parent: { type: 'database_id', database_id: params.databaseId },
            archived: false,
            properties: {
              Name: { id: 'title', type: 'title', title: [{ type: 'text', text: { content: 'Mock Notion Record' } }] }
            },
            url: 'https://notion.so/mock-page-id'
          }
        ];
      }
      case 'createPage': {
        const page = {
          object: 'page',
          id: `page-${Math.random().toString(36).substr(2, 9)}`,
          created_time: new Date().toISOString(),
          parent: params.parentDatabaseId ? { database_id: params.parentDatabaseId } : { page_id: params.parentPageId },
          properties: params.properties || {},
          url: 'https://notion.so/mock-new-page'
        };
        this.emit('page:created', page);
        return page;
      }
      default:
        throw new Error(`Unsupported action "${action}" in Notion Plugin.`);
    }
  }
}

export const notionPlugin = new NotionPlugin();

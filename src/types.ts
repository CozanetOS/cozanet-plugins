import { EventEmitter } from 'eventemitter3';

export interface PluginCapability {
  name: string;
  description: string;
  inputSchema: object; // Zod schema or JSON Schema
  outputSchema: object;
  requiresAuth: boolean;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: 'ai' | 'communication' | 'storage' | 'development' | 'productivity' | 'finance' | 'custom';
  authType: 'none' | 'apikey' | 'oauth2' | 'basic';
  permissions: string[];
  capabilities: PluginCapability[];
  events: string[];
  actions: string[];
  entrypoint: string;
}

export interface Plugin extends EventEmitter {
  manifest: PluginManifest;
  init(config: Record<string, string>): Promise<void>;
  destroy(): Promise<void>;
  execute(action: string, params: any): Promise<any>;
  on(event: string, handler: Function): void;
  isReady(): boolean;
}

export interface PluginRegistry {
  plugins: Map<string, Plugin>;
  register(plugin: Plugin): void;
  get(id: string): Plugin | null;
  list(): Plugin[];
  listByCategory(category: string): Plugin[];
  getCapabilities(pluginId: string): PluginCapability[];
  discoverCapabilities(): Record<string, PluginCapability[]>; // CEO AI uses this
}

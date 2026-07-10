import { Plugin } from '../types';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private activePlugins: Set<string> = new Set();

  public register(plugin: Plugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  public async load(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin "${id}" is not registered.`);
    }

    if (this.activePlugins.has(id)) {
      return;
    }

    await plugin.init();
    this.activePlugins.add(id);
  }

  public async unload(id: string): Promise<void> {
    if (!this.activePlugins.has(id)) {
      return;
    }

    const plugin = this.plugins.get(id);
    if (plugin) {
      await plugin.destroy();
    }
    this.activePlugins.delete(id);
  }

  public getPlugin(id: string): Plugin | null {
    return this.plugins.get(id) || null;
  }

  public listPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  public async callHandler(pluginId: string, handler: string, ...args: any[]): Promise<any> {
    if (!this.activePlugins.has(pluginId)) {
      throw new Error(`Plugin "${pluginId}" is not loaded/active.`);
    }

    const plugin = this.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found.`);
    }

    const handlerFn = plugin.handlers[handler];
    if (!handlerFn) {
      throw new Error(`Handler "${handler}" not found on plugin "${pluginId}".`);
    }

    return handlerFn(...args);
  }
}

import { Plugin, PluginCapability, PluginRegistry } from '../types';

export class PluginManager implements PluginRegistry {
  public plugins: Map<string, Plugin> = new Map();
  private initializedPlugins: Set<string> = new Set();

  public register(plugin: Plugin): void {
    this.plugins.set(plugin.manifest.id, plugin);
  }

  public async load(id: string, config: Record<string, string> = {}): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin "${id}" is not registered.`);
    }
    if (this.initializedPlugins.has(id)) {
      return;
    }
    await plugin.init(config);
    this.initializedPlugins.add(id);
  }

  public async unload(id: string): Promise<void> {
    if (!this.initializedPlugins.has(id)) {
      return;
    }
    const plugin = this.plugins.get(id);
    if (plugin) {
      await plugin.destroy();
    }
    this.initializedPlugins.delete(id);
  }

  public async execute(pluginId: string, action: string, params: any): Promise<any> {
    if (!this.initializedPlugins.has(pluginId)) {
      // Auto-load if not already initialized
      await this.load(pluginId, process.env as Record<string, string>);
    }
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found.`);
    }
    return await plugin.execute(action, params);
  }

  public get(id: string): Plugin | null {
    return this.plugins.get(id) || null;
  }

  public getPlugin(id: string): Plugin | null {
    return this.get(id);
  }

  public list(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  public listByCategory(category: string): Plugin[] {
    return this.list().filter(p => p.manifest.category === category);
  }

  public getCapabilities(pluginId: string): PluginCapability[] {
    const plugin = this.get(pluginId);
    return plugin ? plugin.manifest.capabilities : [];
  }

  public discoverCapabilities(): Record<string, PluginCapability[]> {
    const capabilitiesMap: Record<string, PluginCapability[]> = {};
    for (const [id, plugin] of this.plugins.entries()) {
      capabilitiesMap[id] = plugin.manifest.capabilities;
    }
    return capabilitiesMap;
  }

  public discoverAll(): Record<string, PluginCapability[]> {
    return this.discoverCapabilities();
  }
}

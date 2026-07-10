export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  init: () => Promise<void>;
  destroy: () => Promise<void>;
  handlers: Record<string, Function>;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  entrypoint: string;
  permissions: string[];
}

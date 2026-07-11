import { EventEmitter } from 'eventemitter3';
import { Plugin, PluginManifest } from '../types';

/**
 * CozanetOS Custom Plugin Implementation Template
 * 
 * Simply duplicate this template, adjust the manifest, define your custom
 * capabilities and Zod/JSON input/output schemas, and implement the lifecycle methods.
 * Register your finished plugin with the `PluginManager` to make its capabilities
 * discoverable by the CozanetOS CEO AI.
 */
export class CustomPluginTemplate extends EventEmitter implements Plugin {
  public manifest: PluginManifest = {
    id: 'plugin:custom-template',
    name: 'Custom Plugin Template',
    version: '1.0.0',
    description: 'Boilerplate reference template for building native CozanetOS pluggable drivers',
    author: 'Developer Name',
    category: 'custom',
    authType: 'apikey', // 'none' | 'apikey' | 'oauth2' | 'basic'
    permissions: ['custom:permission:read'],
    capabilities: [
      {
        name: 'sampleCapability',
        description: 'Provide an extensive action description to guide AI dynamic discoverability',
        inputSchema: {
          type: 'object',
          properties: {
            parameterOne: { type: 'string', description: 'Sample argument input' }
          },
          required: ['parameterOne']
        },
        outputSchema: {
          type: 'object',
          properties: {
            result: { type: 'string' }
          }
        },
        requiresAuth: true
      }
    ],
    events: ['sampleEventEmitted', 'error'],
    actions: ['sampleCapability'],
    entrypoint: 'src/Custom/custom-plugin-template.ts'
  };

  private ready = false;

  public async init(config: Record<string, string> = {}): Promise<void> {
    // 1. Initialize API Clients, parse configuration options, etc.
    const apiKey = config.CUSTOM_API_KEY || process.env.CUSTOM_API_KEY;
    if (apiKey) {
      this.ready = true;
    } else {
      console.warn('Warning: CUSTOM_API_KEY is missing. Custom plugin is running in fallback/offline mode.');
      this.ready = true;
    }
  }

  public async destroy(): Promise<void> {
    // 2. Perform any cleanup (disconnect socket connections, clear intervals, close file descriptors, etc.)
    this.ready = false;
  }

  public isReady(): boolean {
    return this.ready;
  }

  public async execute(action: string, params: any): Promise<any> {
    this.emit('execution:started', { action, params });

    switch (action) {
      case 'sampleCapability': {
        // Implement custom logic here...
        const output = {
          result: `Processed parameterOne: "${params.parameterOne}" inside custom template.`
        };
        this.emit('sampleEventEmitted', output);
        return output;
      }
      default:
        throw new Error(`Unsupported action "${action}" in Custom Plugin.`);
    }
  }
}

export const customPluginTemplate = new CustomPluginTemplate();

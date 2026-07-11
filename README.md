# @cozanet/plugins

CozanetOS Modular Extensibility Framework and Core Integration Plugins.

## Overview
This repository provides a unified, pluggable ecosystem for CozanetOS.
By standardizing plugins to a robust, type-safe specification, the **CEO AI** can dynamically discover capabilities, manage auth requirements, list actions, handle event emissions, and trigger integrations seamlessly without core engine upgrades.

## Plugin Philosophy
- **Everything is a Plugin**: Every external provider, driver, or service integration is isolated as a modular class implementing the `Plugin` interface.
- **Dynamic AI Discovery**: The CEO AI calls `PluginManager.discoverCapabilities()` or `discoverAll()` to dynamically fetch manifests, capability descriptions, and required parameter schemas (Zod or JSON Schema).
- **Decoupled Configuration**: Authentication parameters are passed dynamically during initialization (`init(config)`) or fetched automatically from environments.
- **Event-Driven**: All plugins extend `EventEmitter` allowing full stream subscription, logging, and workflow hooks.

## Available Core Plugins
1. **Groq Cloud Plugin** (`plugin:groq`): High performance inference and embeddings featuring round-robin multi-key failover (`GROQ_API_KEY_1/2/3`).
2. **OpenAI Plugin** (`plugin:openai`): Full stub supporting chat completions, embeddings, and model lists.
3. **GitHub Plugin** (`plugin:github`): Dynamic repo manager, files manager, issue generator, and PR constructor utilizing `@octokit/rest`.
4. **Supabase Plugin** (`plugin:supabase`): Secure DB queries, inserts, updates, deletes, and storage bucket uploads/downloads via `@supabase/supabase-js`.
5. **Email Plugin** (`plugin:email`): Mail transmission driver via `nodemailer` with inbox query stubs.
6. **Google Workspace Plugin** (`plugin:google`): Stubs for Gmail, Drive, and Google Calendar.
7. **Notion Plugin** (`plugin:notion`): Page and database creation/query stubs.
8. **Slack Plugin** (`plugin:slack`): Core bot messaging and channel list query stubs.
9. **Firebase Plugin** (`plugin:firebase`): Cloud firestore database and FCM push notification stubs.
10. **Base44 Plugin** (`plugin:base44`): Native runtime automation and workflow execution driver.

## Creating a Custom Plugin
Simply duplicate the template in `src/Custom/custom-plugin-template.ts`. Implement the `Plugin` interface, define your manifests and capabilities, and register your class with `PluginManager`.

```typescript
import { PluginManager } from '@cozanet/plugins';
import { myCustomPlugin } from './my-plugin';

const manager = new PluginManager();
manager.register(myCustomPlugin);

// CEO AI dynamic discovery
const capabilities = manager.discoverCapabilities();
```

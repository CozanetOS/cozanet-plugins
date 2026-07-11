# CozanetOS Plugins: The Extensible Integration Framework

An integral component of **CozanetOS**—the AI-native operating system designed for frictionless human-agent collaboration.

---

## Overview

CozanetOS Plugins is the extensibility platform for CozanetOS. It defines the universal SDK and runtime environment enabling external integrations, services, AI engines, third-party databases, financial systems, and blockchains to connect seamlessly and securely under a sandboxed, permissioned architecture.

---

## Core Capabilities

- **AI Provider Plugins**: Connect to top providers like OpenAI, Anthropic, Groq, Google Gemini, Mistral, and local systems running Ollama.
- **Browser Integration Plugins**: Run headful or headless automation using high-quality Playwright, Puppeteer, or custom Chrome browser extensions.
- **Email API Plugins**: Synchronize, search, draft, and send emails via robust Gmail and Microsoft Graph (Outlook) OAuth integrations.
- **Calendar Sync Plugins**: Integrate schedule events, agendas, and busy times seamlessly with Google Calendar and iCal formats.
- **Cloud Storage Integrations**: Connect and synchronize directories with Google Drive, Dropbox, AWS S3, and OneDrive.
- **Developer Platform Plugins**: Track tasks, commits, and tickets via custom integrations with GitHub, GitLab, Jira, and Linear.
- **Finance Plugins**: Retrieve stock data, process payments, and track transactions with Stripe, Yahoo Finance, Binance, and Coinbase APIs.
- **Blockchain & Token Integrations**: Interact with smart contracts, verify transactions, and manage wallets on Ethereum, Solana, and the native CZN Token network.
- **Custom Plugin SDK**: Build proprietary plugins easily with clear lifecycle hooks, typed configurations, and secure message-passing interfaces.
- **Plugin Marketplace**: Access a secure, community-driven marketplace to discover, install, and review open-source extensions.
- **Isolated Sandbox Runtime**: Run plugins inside strict, isolated runtimes, blocking unauthorized file or network access.
- **Security & Permission Verification**: Perform automated static security scans and verify plugin package hashes before execution.
- **Versioning & Rollbacks**: Easily lock plugin versions, check updates, and perform instant rollbacks on breaking changes.
- **Hot-Loading Runtime**: Install, reload, disable, and configure plugins live on-the-fly without restarting main processes.
- **Granular Permission System**: Require plugins to declare necessary scopes (e.g., net, fs, calendar) and request explicit permission from users.
- **Centralized Registry**: Easily browse, list, configure, and manage active system integrations using the centralized plugin registry.

---

## Architecture & Components

The cozanet-plugins system is built on safety, performance, and portability:
1. **Plugin Manager**: Discovers, registers, and loads plugins, validating signatures and version constraints.
2. **Sandbox Supervisor**: Launches each plugin in a secure WebAssembly or Node VM sandbox, intercepting and sanitizing system calls.
3. **Capability Broker**: Evaluates requested API capabilities against user-granted permissions at runtime, enforcing strict security boundaries.
4. **Data Sync Gateway**: Manages state translation, credential key management (via OS keyring), and rate-limiting limits for external connections.

---

## API & Interface Overview

Here is an example of interacting with this module programmatically:

```typescript
import { PluginRegistry, Plugin } from '@cozanetos/plugins';

// Fetch active plugin instance
const githubPlugin = PluginRegistry.getPlugin('github');

// Ensure the plugin is active and authorized
if (githubPlugin.isAuthorized()) {
  const repoDetails = await githubPlugin.execute('getRepository', {
    owner: 'CozanetOS',
    repo: 'cozanet-cx7'
  });
  console.log(`Plugin fetched repo details:`, repoDetails);
}
```

---

## Integration with Other CozanetOS Modules

This module is designed to interact seamlessly with other core layers of the CozanetOS ecosystem:

- **cozanet-core**: Accesses the native operating system keyring, database, and system-level configuration files.
- **cozanet-api**: Exposes third-party integration data structures as clean, queryable GraphQL/REST endpoints.
- **cozanet-security**: Enforces sandboxing boundaries, manages access tokens, and audits active integration behaviors.
- **cozanet-agents**: Empowers agents by automatically registering plugins as tools the agents can call during task execution.

---

## Quick-Start Notes

To begin using **cozanet-plugins** inside your CozanetOS development environment:

### 1. Installation
Add the module to your application:
```bash
npm install @cozanetos/plugins
# or
yarn add @cozanetos/plugins
```

### 2. Configuration
Ensure your environment variables are configured in your `.env` file or registered inside your CozanetOS dashboard:
```env
COZANET_ENV=development
# Add module-specific configuration as required
```

### 3. Initialize & Run
Import the core module and start the process:
```javascript
import { Initialize } from '@cozanetos/plugins';

Initialize().then(() => {
  console.log('cozanet-plugins initialized successfully within CozanetOS.');
});
```

---

## License & Support
Part of the CozanetOS open platform suite. For security disclosures, active status monitors, or developer support, please visit the central CozanetOS portal.

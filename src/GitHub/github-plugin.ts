import { EventEmitter } from 'eventemitter3';
import { Plugin, PluginManifest } from '../types';
import { Octokit } from '@octokit/rest';

export class GitHubPlugin extends EventEmitter implements Plugin {
  public manifest: PluginManifest = {
    id: 'plugin:github',
    name: 'GitHub Platform Plugin',
    version: '0.1.0',
    description: 'Full interaction suite to manage repositories, issues, PRs, and contents on GitHub',
    author: 'CozanetOS',
    category: 'development',
    authType: 'apikey',
    permissions: ['repo:read', 'repo:write', 'issues:write', 'pull_requests:write'],
    capabilities: [
      {
        name: 'listRepos',
        description: 'List public/private repositories for authenticated user or org',
        inputSchema: {
          type: 'object',
          properties: {
            org: { type: 'string', description: 'GitHub organization name' },
            type: { type: 'string', default: 'all' }
          }
        },
        outputSchema: { type: 'array' },
        requiresAuth: true
      },
      {
        name: 'createRepo',
        description: 'Create a new repository under user space or organization',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            org: { type: 'string' },
            private: { type: 'boolean', default: false }
          },
          required: ['name']
        },
        outputSchema: { type: 'object' },
        requiresAuth: true
      },
      {
        name: 'createFile',
        description: 'Create or update file contents in a repo',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            path: { type: 'string' },
            message: { type: 'string' },
            content: { type: 'string' },
            branch: { type: 'string' }
          },
          required: ['owner', 'repo', 'path', 'message', 'content']
        },
        outputSchema: { type: 'object' },
        requiresAuth: true
      },
      {
        name: 'getFile',
        description: 'Fetch file content and meta from a repo',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            path: { type: 'string' },
            ref: { type: 'string' }
          },
          required: ['owner', 'repo', 'path']
        },
        outputSchema: { type: 'object' },
        requiresAuth: true
      },
      {
        name: 'createIssue',
        description: 'Open a new issue in the target repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            title: { type: 'string' },
            body: { type: 'string' }
          },
          required: ['owner', 'repo', 'title']
        },
        outputSchema: { type: 'object' },
        requiresAuth: true
      },
      {
        name: 'listIssues',
        description: 'List issues in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            state: { type: 'string', default: 'open' }
          },
          required: ['owner', 'repo']
        },
        outputSchema: { type: 'array' },
        requiresAuth: true
      },
      {
        name: 'createPR',
        description: 'Create a new pull request in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            title: { type: 'string' },
            head: { type: 'string' },
            base: { type: 'string', default: 'main' },
            body: { type: 'string' }
          },
          required: ['owner', 'repo', 'title', 'head']
        },
        outputSchema: { type: 'object' },
        requiresAuth: true
      }
    ],
    events: ['repo:created', 'file:updated', 'issue:created', 'pr:created', 'error'],
    actions: ['listRepos', 'createRepo', 'createFile', 'getFile', 'createIssue', 'listIssues', 'createPR'],
    entrypoint: 'src/GitHub/github-plugin.ts'
  };

  private ready = false;
  private octokit: Octokit | null = null;

  public async init(config: Record<string, string> = {}): Promise<void> {
    const token = config.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
    if (token) {
      this.octokit = new Octokit({ auth: token });
      this.ready = true;
    } else {
      console.warn('Warning: GITHUB_TOKEN environment variable is missing for GitHub Plugin. GitHub Plugin is offline.');
      this.ready = false;
    }
  }

  public async destroy(): Promise<void> {
    this.octokit = null;
    this.ready = false;
  }

  public isReady(): boolean {
    return this.ready;
  }

  private getOctokit(): Octokit {
    if (!this.octokit) {
      throw new Error('Octokit is not initialized. Please ensure GITHUB_TOKEN is available.');
    }
    return this.octokit;
  }

  public async execute(action: string, params: any): Promise<any> {
    const octo = this.getOctokit();
    this.emit('execution:started', { action, params });

    try {
      switch (action) {
        case 'listRepos': {
          if (params.org) {
            const { data } = await octo.repos.listForOrg({ org: params.org, type: params.type });
            return data;
          } else {
            const { data } = await octo.repos.listForAuthenticatedUser({ type: params.type });
            return data;
          }
        }
        case 'createRepo': {
          let response;
          if (params.org) {
            response = await octo.repos.createInOrg({ org: params.org, name: params.name, private: params.private });
          } else {
            response = await octo.repos.createForAuthenticatedUser({ name: params.name, private: params.private });
          }
          this.emit('repo:created', response.data);
          return response.data;
        }
        case 'createFile': {
          const fileMeta = await octo.repos.getContent({
            owner: params.owner,
            repo: params.repo,
            path: params.path,
            ref: params.branch
          }).catch(() => null);

          const sha = fileMeta && !Array.isArray(fileMeta.data) && 'sha' in fileMeta.data ? fileMeta.data.sha : undefined;
          
          const { data } = await octo.repos.createOrUpdateFileContents({
            owner: params.owner,
            repo: params.repo,
            path: params.path,
            message: params.message,
            content: Buffer.from(params.content).toString('base64'),
            sha,
            branch: params.branch
          });
          this.emit('file:updated', data);
          return data;
        }
        case 'getFile': {
          const { data } = await octo.repos.getContent({
            owner: params.owner,
            repo: params.repo,
            path: params.path,
            ref: params.ref
          });
          if (!Array.isArray(data) && 'content' in data && data.content) {
            const textContent = Buffer.from(data.content, 'base64').toString('utf-8');
            return { ...data, decodedContent: textContent };
          }
          return data;
        }
        case 'createIssue': {
          const { data } = await octo.issues.create({
            owner: params.owner,
            repo: params.repo,
            title: params.title,
            body: params.body
          });
          this.emit('issue:created', data);
          return data;
        }
        case 'listIssues': {
          const { data } = await octo.issues.listForRepo({
            owner: params.owner,
            repo: params.repo,
            state: params.state
          });
          return data;
        }
        case 'createPR': {
          const { data } = await octo.pulls.create({
            owner: params.owner,
            repo: params.repo,
            title: params.title,
            head: params.head,
            base: params.base,
            body: params.body
          });
          this.emit('pr:created', data);
          return data;
        }
        default:
          throw new Error(`Unsupported action "${action}" in GitHub Plugin.`);
      }
    } catch (err) {
      this.emit('error', err);
      throw err;
    }
  }
}

export const githubPlugin = new GitHubPlugin();

import { Plugin } from '../types';

export const githubPlugin: Plugin = {
  id: 'plugin:github',
  name: 'GitHub Platform Plugin',
  version: '0.1.0',
  description: 'Manage repos and workflows on GitHub',
  init: async () => {
    if (!process.env.GITHUB_TOKEN) {
      console.warn('Warning: GITHUB_TOKEN environment variable is missing for GitHub Plugin.');
    }
  },
  destroy: async () => {},
  handlers: {
    listRepos: async (args?: { org?: string }) => {
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        throw new Error('GITHUB_TOKEN environment variable is not defined.');
      }

      const org = args?.org || 'CozanetOS';
      const response = await fetch(`https://api.github.com/orgs/${org}/repos`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'CozanetOS-Plugin-Manager'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API request failed: ${response.status} - ${errorText}`);
      }

      return response.json();
    }
  }
};

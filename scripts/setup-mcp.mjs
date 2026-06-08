#!/usr/bin/env node
// Generates an MCP config JSON so Claude Code (`claude -p --mcp-config`) can launch
// the kicktipp MCP server. Secrets are read from the environment.
// Used by the GitHub Actions "auto-bet" workflow; can also be run locally.
//
// Usage: node scripts/setup-mcp.mjs [output-path]
//   output-path defaults to $MCP_CONFIG_PATH or ./mcp-config.json

import fs from 'fs';
import path from 'path';

const outPath = process.argv[2] || process.env.MCP_CONFIG_PATH || 'mcp-config.json';
const repo = process.env.GITHUB_WORKSPACE || process.cwd();
const serverPath = path.join(repo, 'dist', 'server.js');

if (!fs.existsSync(serverPath)) {
  console.error(`MCP server not built at ${serverPath}. Run "npm run build" first.`);
  process.exit(1);
}

const env = {
  KICKTIPP_EMAIL: process.env.KICKTIPP_EMAIL,
  KICKTIPP_PASSWORD: process.env.KICKTIPP_PASSWORD,
  KICKTIPP_COMMUNITY: process.env.KICKTIPP_COMMUNITY,
};
for (const [k, v] of Object.entries(env)) {
  if (!v) {
    console.error(`Missing required environment variable: ${k}`);
    process.exit(1);
  }
}

const config = {
  mcpServers: {
    kicktipp: {
      command: 'node',
      args: [serverPath],
      env,
    },
  },
};

// JSON.stringify safely escapes any special characters in the secret values.
fs.writeFileSync(outPath, JSON.stringify(config, null, 2));
fs.chmodSync(outPath, 0o600);
console.log(`Wrote ${outPath} (kicktipp MCP server -> ${serverPath})`);

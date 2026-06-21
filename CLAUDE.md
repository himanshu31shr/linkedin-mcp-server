# LinkedIn MCP Server Instructions

## Overview
TypeScript MCP server for LinkedIn API. Published as `@himanshu31shr/linkedin-mcp-server` on npm. Exposes standard MCP tools so AI agents can read/write user profile + orgs.

## Installation
- **npm**: `npm install -g @himanshu31shr/linkedin-mcp-server`
- **npx**: `npx -y @himanshu31shr/linkedin-mcp-server`
- **From source**: `git clone` → `npm install` → `npm run build`

## MCP Client Config (Claude Desktop / Cursor / etc.)
```json
{
  "mcpServers": {
    "linkedin": {
      "command": "npx",
      "args": ["-y", "@himanshu31shr/linkedin-mcp-server"],
      "env": {
        "LINKEDIN_ACCESS_TOKEN": "your-token"
      }
    }
  }
}
```

## Core Rules
1. **ESM Imports**: All local imports use `.js` extension (e.g. `import { foo } from './foo.js'`).
2. **CAVEMAN Logging**: All logging via `createChildLogger` from `src/utils/logger.js`. Every log message MUST begin with `CAVEMAN: `. No `console.log`.
3. **No Direct Standard Out**: Never `console.log` — corrupts MCP JSON-RPC over stdio.
4. **Test Coverage**: 100% coverage. Mock LinkedIn endpoints with MSW in `tests/mocks/handlers.ts`.

## Start Commands
- **Build**: `npm run build`
- **Test**: `npm test`
- **Lint**: `npm run lint`
- **Run (dev)**: `npm run dev`
- **Run (prod)**: `npm start` or `linkedin-mcp-server` (if installed globally)

## Project Structure
- `src/index.ts`: Main MCP server entry (has `#!/usr/bin/env node` shebang for bin usage).
- `src/services/linkedin-client.ts`: Wrap LinkedIn API (`/v2` + `/rest`).
- `src/tools/`: Tool impl by domain (profile, posts, media, org, social-actions, org-analytics).
- `src/schemas/`: Zod schemas for tool inputs.

## Publishing
- Package is scoped: `@himanshu31shr/linkedin-mcp-server`.
- Publish with: `npm publish --access public`.
- The `prepublishOnly` script runs lint, tests, and build automatically.
- `bin` field maps `linkedin-mcp-server` → `dist/index.js` for CLI usage.

## Development Workflow
Add new tool:
1. Schema in `src/schemas`.
2. Handler + registration in `src/tools`.
3. Mock LinkedIn endpoint with MSW in `tests/mocks/handlers.ts`.
4. Unit tests in `tests/unit/tools/`. Cover all error states + edge cases.
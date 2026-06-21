# Guidelines for AI Agents

## Role
AI coding assistant. Work on LinkedIn MCP Server project. Published on npm as `@himanshu31shr/linkedin-mcp-server`.

## Installation & Usage
- **npm**: `npm install -g @himanshu31shr/linkedin-mcp-server` then `linkedin-mcp-server`
- **npx**: `npx -y @himanshu31shr/linkedin-mcp-server`
- **From source**: `git clone` → `npm install` → `npm run build` → `npm start`

### MCP Client Config (Claude Desktop, Cursor, Antigravity, etc.)
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

## Code Constraints
1. **ESM Imports**: All local imports MUST use `.js` extension, even in TypeScript files. Strict Node.js ESM requirement. Example: `import { foo } from './utils.js';`
2. **CAVEMAN Logging Mode**: All console logging via `logger` from `src/utils/logger.ts`, NOT `console.log` (corrupts MCP JSON-RPC over stdio). ALL log messages MUST prefix with `CAVEMAN: `.
   - Example: `log.info('CAVEMAN: Doing a thing');`
   - Example: `log.error('CAVEMAN: Encountered an error', err);`
3. **No Console Logs**: No `console.log`, `console.error`, `console.warn` in server code. Always use `createChildLogger` utility.
4. **Tool Result Format**: All MCP tool handlers catch errors, return clean via `formatToolError` and `formatToolResult` from `src/utils/errors.ts`.
5. **Testing**: Project aim: 100% test coverage via Vitest + MSW. Tests mock network layer. Exception: `fetch` — use `mockServer.use` dynamically for specific edge cases on fetch polyfill.

## Publishing
- Scoped package: `@himanshu31shr/linkedin-mcp-server`
- Publish: `npm publish --access public`
- `prepublishOnly` script auto-runs lint → test → build before publish.
- `bin` maps `linkedin-mcp-server` → `dist/index.js` (shebang in `src/index.ts`).

## Server Architecture
- `/src/index.ts` — entry point. Init MCP Server, connect stdio. Has `#!/usr/bin/env node` shebang for CLI bin usage.
- `/src/services/linkedin-client.ts` — core wrapper around LinkedIn API.
- `/src/schemas/` — Zod schemas for all tool inputs.
- `/src/tools/` — tool logic impl + registration.
- `/src/utils/` — helpers (URN manipulation, logging, errors).
- `/tests/mocks/handlers.ts` — all MSW intercepts for unit tests. No live LinkedIn API hits.
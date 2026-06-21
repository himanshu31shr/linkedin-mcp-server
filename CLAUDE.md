# LinkedIn MCP Server Instructions

## Overview
TypeScript MCP server for LinkedIn API. Expose standard tools so AI agent read/write user profile + orgs.

## Core Rules
1. **ESM Imports**: All local imports use `.js` extension (e.g. `import { foo } from './foo.js'`).
2. **CAVEMAN Logging**: All logging via `createChildLogger` from `src/utils/logger.js`. Every log message MUST begin with `CAVEMAN: `. No `console.log`.
3. **No Direct Standard Out**: Never `console.log` — corrupts MCP JSON-RPC over stdio.
4. **Test Coverage**: 100% coverage. Mock LinkedIn endpoints with MSW in `tests/mocks/handlers.ts`.

## Start Commands
- **Build**: `npm run build`
- **Test**: `npm test`
- **Lint**: `npm run lint`

## Project Structure
- `src/index.ts`: Main MCP server entry.
- `src/services/linkedin-client.ts`: Wrap LinkedIn API (`/v2` + `/rest`).
- `src/tools/`: Tool impl by domain (profile, posts, media, org, social-actions, org-analytics).
- `src/schemas/`: Zod schemas for tool inputs.

## Development Workflow
Add new tool:
1. Schema in `src/schemas`.
2. Handler + registration in `src/tools`.
3. Mock LinkedIn endpoint with MSW in `tests/mocks/handlers.ts`.
4. Unit tests in `tests/unit/tools/`. Cover all error states + edge cases.
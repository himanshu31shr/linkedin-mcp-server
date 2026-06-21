# LinkedIn MCP Server Instructions

## Overview
This is a TypeScript-based MCP (Model Context Protocol) server for the LinkedIn API. It exposes standard tools for an AI agent to read/write from a user's LinkedIn profile and organizations.

## Core Rules
1. **ESM Imports**: All local imports must use the `.js` extension (e.g. `import { foo } from './foo.js'`).
2. **CAVEMAN Logging**: All logging must be done via `createChildLogger` from `src/utils/logger.js`. Every log message MUST begin with `CAVEMAN: `. Do not use `console.log`.
3. **No Direct Standard Out**: Never use `console.log` directly as it corrupts the MCP JSON-RPC protocol over stdio.
4. **Test Coverage**: Keep test coverage at 100%. Use MSW in `tests/mocks/handlers.ts` to mock LinkedIn endpoints.

## Start Commands
- **Build**: `npm run build`
- **Test**: `npm test`
- **Lint**: `npm run lint`

## Project Structure
- `src/index.ts`: The main MCP server entry point.
- `src/services/linkedin-client.ts`: Wraps the LinkedIn API (both `/v2` and `/rest` protocols).
- `src/tools/`: Tool implementation separated by domain (profile, posts, media, organization, social-actions, org-analytics).
- `src/schemas/`: Zod schemas for the inputs to all tools.

## Development Workflow
When adding a new tool:
1. Define the input schema in `src/schemas`.
2. Implement the handler and registration in `src/tools`.
3. Mock the LinkedIn API endpoint using MSW in `tests/mocks/handlers.ts`.
4. Write comprehensive unit tests in `tests/unit/tools/`. Ensure all error states and edge cases are covered.

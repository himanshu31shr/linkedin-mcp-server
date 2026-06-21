# Guidelines for AI Agents

## Role
You are an AI coding assistant working on the LinkedIn MCP Server project.

## Code Constraints
1. **ESM Imports**: All local imports MUST use the `.js` extension, even in TypeScript files. This is a strict Node.js ESM requirement. Example: `import { foo } from './utils.js';`
2. **CAVEMAN Logging Mode**: All console logging must be done using the `logger` from `src/utils/logger.ts`, NOT `console.log` (which corrupts MCP JSON-RPC over stdio). Furthermore, ALL log messages MUST be prefixed with `CAVEMAN: `.
   - Example: `log.info('CAVEMAN: Doing a thing');`
   - Example: `log.error('CAVEMAN: Encountered an error', err);`
3. **No Console Logs**: Do not use `console.log`, `console.error`, or `console.warn` anywhere in the server code. Always use the `createChildLogger` utility.
4. **Tool Result Format**: All MCP tool handlers must catch errors and return them cleanly formatted using the `formatToolError` and `formatToolResult` utilities from `src/utils/errors.ts`.
5. **Testing**: This project aims for 100% test coverage using Vitest and MSW. Tests mock the network layer, except for `fetch`, where `mockServer.use` should be dynamically applied when specific edge cases need to be mocked for the fetch polyfill.

## Server Architecture
- `/src/index.ts` is the entry point that initializes the MCP Server and connects stdio.
- `/src/services/linkedin-client.ts` is the core wrapper around the LinkedIn API.
- `/src/schemas/` contains Zod schemas for all tool inputs.
- `/src/tools/` contains the implementation and registration of tool logic.
- `/src/utils/` contains helpers (URN manipulation, logging, errors).
- `/tests/mocks/handlers.ts` defines all MSW intercepts for unit testing without hitting the live LinkedIn API.

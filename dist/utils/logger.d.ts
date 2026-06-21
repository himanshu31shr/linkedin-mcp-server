import pino from 'pino';
/**
 * Application logger configured to write to stderr ONLY.
 * This is critical: stdout is reserved for the JSON-RPC stream in MCP stdio transport.
 * Any console.log() would corrupt the protocol — use this logger instead.
 */
export declare const logger: pino.Logger<never, boolean>;
/**
 * Create a child logger with a specific module context.
 * Usage: const log = createChildLogger('linkedin-client');
 */
export declare function createChildLogger(module: string): pino.Logger;
//# sourceMappingURL=logger.d.ts.map
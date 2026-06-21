import pino from 'pino';

/**
 * Application logger configured to write to stderr ONLY.
 * This is critical: stdout is reserved for the JSON-RPC stream in MCP stdio transport.
 * Any console.log() would corrupt the protocol — use this logger instead.
 */
export const logger = pino(
  {
    name: 'linkedin-mcp-server',
    level: process.env.LOG_LEVEL ?? 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.destination({ fd: 2 }), // fd 2 = stderr
);

/**
 * Create a child logger with a specific module context.
 * Usage: const log = createChildLogger('linkedin-client');
 */
export function createChildLogger(module: string): pino.Logger {
  return logger.child({ module });
}

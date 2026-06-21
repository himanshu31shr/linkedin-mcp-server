#!/usr/bin/env node
import 'dotenv/config';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import { logger } from './utils/logger.js';
async function main() {
    logger.info('CAVEMAN: Starting LinkedIn MCP Server...');
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('CAVEMAN: LinkedIn MCP Server is running on stdio');
}
main().catch((error) => {
    logger.fatal({ error }, 'CAVEMAN: Failed to start server');
    process.exit(1);
});
//# sourceMappingURL=index.js.map
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { LinkedInClient } from './services/linkedin-client.js';
import { registerProfileTools, registerPostTools, registerMediaTools, registerOrganizationTools, registerSocialActionTools, registerOrgAnalyticsTools, } from './tools/index.js';
import { createChildLogger } from './utils/logger.js';
const log = createChildLogger('server');
/**
 * Create and configure the LinkedIn MCP Server.
 * Registers all tool groups against a single LinkedInClient instance.
 *
 * @param accessToken — Optional OAuth 2.0 access token. Falls back to LINKEDIN_ACCESS_TOKEN env var.
 * @returns Configured McpServer ready for transport connection.
 */
export function createServer(accessToken) {
    const server = new McpServer({
        name: 'linkedin-mcp-server',
        version: '1.0.0',
    });
    const client = new LinkedInClient(accessToken);
    // Register all tool groups
    registerProfileTools(server, client);
    registerPostTools(server, client);
    registerMediaTools(server, client);
    registerOrganizationTools(server, client);
    registerSocialActionTools(server, client);
    registerOrgAnalyticsTools(server, client);
    log.info('CAVEMAN: All tool groups registered successfully');
    return server;
}
//# sourceMappingURL=server.js.map
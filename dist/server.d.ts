import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Create and configure the LinkedIn MCP Server.
 * Registers all tool groups against a single LinkedInClient instance.
 *
 * @param accessToken — Optional OAuth 2.0 access token. Falls back to LINKEDIN_ACCESS_TOKEN env var.
 * @returns Configured McpServer ready for transport connection.
 */
export declare function createServer(accessToken?: string): McpServer;
//# sourceMappingURL=server.d.ts.map
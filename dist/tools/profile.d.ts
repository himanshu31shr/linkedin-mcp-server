import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TextContent } from '@modelcontextprotocol/sdk/types.js';
import { LinkedInClient } from '../services/linkedin-client.js';
/**
 * Get the authenticated user's LinkedIn profile.
 */
export declare function getProfile(client: LinkedInClient): Promise<{
    content: TextContent[];
    isError?: true;
}>;
/**
 * Get the authenticated user's email address.
 */
export declare function getEmail(client: LinkedInClient): Promise<{
    content: TextContent[];
    isError?: true;
}>;
/**
 * Register all profile-related tools with the MCP server.
 */
export declare function registerProfileTools(server: McpServer, client: LinkedInClient): void;
//# sourceMappingURL=profile.d.ts.map
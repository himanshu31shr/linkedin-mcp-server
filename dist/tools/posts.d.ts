import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TextContent } from '@modelcontextprotocol/sdk/types.js';
import { LinkedInClient } from '../services/linkedin-client.js';
import { type CreateTextPostInput, type CreateLinkPostInput, type DeletePostInput } from '../schemas/posts.js';
/**
 * Create a text-only post on LinkedIn.
 */
export declare function createTextPost(client: LinkedInClient, input: CreateTextPostInput): Promise<{
    content: TextContent[];
    isError?: true;
}>;
/**
 * Create a post with a link/article on LinkedIn.
 */
export declare function createLinkPost(client: LinkedInClient, input: CreateLinkPostInput): Promise<{
    content: TextContent[];
    isError?: true;
}>;
/**
 * Delete a post from LinkedIn.
 */
export declare function deletePost(client: LinkedInClient, input: DeletePostInput): Promise<{
    content: TextContent[];
    isError?: true;
}>;
/**
 * Register all post-related tools with the MCP server.
 */
export declare function registerPostTools(server: McpServer, client: LinkedInClient): void;
//# sourceMappingURL=posts.d.ts.map
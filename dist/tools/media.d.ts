import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TextContent } from '@modelcontextprotocol/sdk/types.js';
import { LinkedInClient } from '../services/linkedin-client.js';
import { type UploadImageInput, type CreateImagePostInput, type CreateDocumentPostInput } from '../schemas/media.js';
/**
 * Upload an image to LinkedIn and return the image URN.
 */
export declare function uploadImage(client: LinkedInClient, input: UploadImageInput): Promise<{
    content: TextContent[];
    isError?: true;
}>;
/**
 * Create a post with an image on LinkedIn.
 */
export declare function createImagePost(client: LinkedInClient, input: CreateImagePostInput): Promise<{
    content: TextContent[];
    isError?: true;
}>;
/**
 * Create a post with a document (PDF, etc.) on LinkedIn.
 */
export declare function createDocumentPost(client: LinkedInClient, input: CreateDocumentPostInput): Promise<{
    content: TextContent[];
    isError?: true;
}>;
/**
 * Register all media-related tools with the MCP server.
 */
export declare function registerMediaTools(server: McpServer, client: LinkedInClient): void;
//# sourceMappingURL=media.d.ts.map
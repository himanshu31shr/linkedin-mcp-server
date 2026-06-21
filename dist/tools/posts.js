import { formatToolError, formatToolResult } from '../utils/errors.js';
import { createChildLogger } from '../utils/logger.js';
import { CreateTextPostInputSchema, CreateLinkPostInputSchema, DeletePostInputSchema, } from '../schemas/posts.js';
const log = createChildLogger('posts-tools');
/**
 * Helper to get the authenticated user's person URN.
 */
async function getPersonUrn(client) {
    const userInfo = await client.get('/userinfo', undefined, false);
    return `urn:li:person:${userInfo.sub}`;
}
/**
 * Create a text-only post on LinkedIn.
 */
export async function createTextPost(client, input) {
    try {
        log.info('CAVEMAN: Creating text post (length=%d)', input.text.length);
        const personUrn = await getPersonUrn(client);
        log.info('CAVEMAN: Resolved person URN: %s', personUrn);
        const visibility = input.visibility ?? 'PUBLIC';
        const body = {
            author: personUrn,
            commentary: input.text,
            visibility,
            distribution: {
                feedDistribution: 'MAIN_FEED',
                targetEntities: [],
                thirdPartyDistributionChannels: [],
            },
            lifecycleState: 'PUBLISHED',
        };
        const response = await client.post('/posts', body);
        log.info('CAVEMAN: Text post created successfully');
        return formatToolResult({
            success: true,
            message: 'Post created successfully',
            postId: response?.id ?? response?.['x-restli-id'] ?? 'unknown',
        });
    }
    catch (error) {
        log.error('CAVEMAN: Failed to create text post: %s', error);
        return formatToolError(error);
    }
}
/**
 * Create a post with a link/article on LinkedIn.
 */
export async function createLinkPost(client, input) {
    try {
        log.info('CAVEMAN: Creating link post (url=%s)', input.linkUrl);
        const personUrn = await getPersonUrn(client);
        log.info('CAVEMAN: Resolved person URN: %s', personUrn);
        const visibility = input.visibility ?? 'PUBLIC';
        const body = {
            author: personUrn,
            commentary: input.text,
            visibility,
            distribution: {
                feedDistribution: 'MAIN_FEED',
                targetEntities: [],
                thirdPartyDistributionChannels: [],
            },
            lifecycleState: 'PUBLISHED',
            content: {
                article: {
                    source: input.linkUrl,
                    ...(input.linkTitle ? { title: input.linkTitle } : {}),
                },
            },
        };
        const response = await client.post('/posts', body);
        log.info('CAVEMAN: Link post created successfully');
        return formatToolResult({
            success: true,
            message: 'Link post created successfully',
            postId: response?.id ?? response?.['x-restli-id'] ?? 'unknown',
        });
    }
    catch (error) {
        log.error('CAVEMAN: Failed to create link post: %s', error);
        return formatToolError(error);
    }
}
/**
 * Delete a post from LinkedIn.
 */
export async function deletePost(client, input) {
    try {
        log.info('CAVEMAN: Deleting post with URN: %s', input.postUrn);
        const encodedUrn = encodeURIComponent(input.postUrn);
        await client.delete(`/posts/${encodedUrn}`);
        log.info('CAVEMAN: Post deleted successfully');
        return formatToolResult({
            success: true,
            message: `Post ${input.postUrn} deleted successfully`,
        });
    }
    catch (error) {
        log.error('CAVEMAN: Failed to delete post: %s', error);
        return formatToolError(error);
    }
}
/**
 * Register all post-related tools with the MCP server.
 */
export function registerPostTools(server, client) {
    server.registerTool('create_text_post', {
        description: 'Create a text-only post on LinkedIn',
        inputSchema: CreateTextPostInputSchema.shape,
    }, async (input) => {
        return createTextPost(client, input);
    });
    server.registerTool('create_link_post', {
        description: 'Create a post with a link/article on LinkedIn',
        inputSchema: CreateLinkPostInputSchema.shape,
    }, async (input) => {
        return createLinkPost(client, input);
    });
    server.registerTool('delete_post', {
        description: 'Delete a post from LinkedIn by its URN',
        inputSchema: DeletePostInputSchema.shape,
    }, async (input) => {
        return deletePost(client, input);
    });
    log.info('CAVEMAN: Registered post tools (create_text_post, create_link_post, delete_post)');
}
//# sourceMappingURL=posts.js.map
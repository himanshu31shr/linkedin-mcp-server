import { createChildLogger } from '../utils/logger.js';
import { formatToolError, formatToolResult } from '../utils/errors.js';
import { GetPostCommentsSchema, CreateCommentSchema, DeleteCommentSchema, AddReactionSchema, RemoveReactionSchema, } from '../schemas/social-actions.js';
const log = createChildLogger('social-actions-tools');
/**
 * Get the authenticated user's person URN from /v2/userinfo.
 */
async function getPersonUrn(client) {
    const userInfo = await client.get('/userinfo', undefined, false);
    return `urn:li:person:${userInfo.sub}`;
}
/**
 * Parse a LinkedIn comment URN to extract the activity URN and comment ID.
 * Comment URN format: urn:li:comment:(urn:li:activity:ACTIVITY_ID,COMMENT_ID)
 * or: urn:li:comment:(activity:ACTIVITY_ID,COMMENT_ID)
 */
function parseCommentUrn(commentUrn) {
    // Match urn:li:comment:(urn:li:activity:ACTIVITY_ID,COMMENT_ID)
    const fullMatch = commentUrn.match(/^urn:li:comment:\((urn:li:activity:\d+),(\d+)\)$/);
    if (fullMatch) {
        return { activityUrn: fullMatch[1], commentId: fullMatch[2] };
    }
    // Match urn:li:comment:(urn:li:ugcPost:POST_ID,COMMENT_ID)
    const ugcMatch = commentUrn.match(/^urn:li:comment:\((urn:li:ugcPost:\d+),(\d+)\)$/);
    if (ugcMatch) {
        return { activityUrn: ugcMatch[1], commentId: ugcMatch[2] };
    }
    throw new Error(`Invalid comment URN format: "${commentUrn}". Expected format: urn:li:comment:(urn:li:activity:ID,COMMENT_ID)`);
}
/**
 * Register all social action tools with the MCP server.
 */
export function registerSocialActionTools(server, client) {
    // ─── get_post_comments ──────────────────────────────────────────────────
    server.registerTool('get_post_comments', {
        description: 'Get comments on a LinkedIn post',
        inputSchema: {
            postUrn: GetPostCommentsSchema.shape.postUrn,
            count: GetPostCommentsSchema.shape.count,
            start: GetPostCommentsSchema.shape.start,
        },
    }, async (params) => {
        try {
            log.info('CAVEMAN: get_post_comments called for postUrn=%s', params.postUrn);
            const encodedUrn = encodeURIComponent(params.postUrn);
            const count = params.count ?? 10;
            const start = params.start ?? 0;
            const result = await client.get(`/socialActions/${encodedUrn}/comments`, { count: String(count), start: String(start) }, false);
            log.info('CAVEMAN: get_post_comments succeeded');
            return formatToolResult(result);
        }
        catch (error) {
            log.error('CAVEMAN: get_post_comments failed: %s', error);
            return formatToolError(error);
        }
    });
    // ─── create_comment ─────────────────────────────────────────────────────
    server.registerTool('create_comment', {
        description: 'Add a comment to a LinkedIn post',
        inputSchema: {
            postUrn: CreateCommentSchema.shape.postUrn,
            text: CreateCommentSchema.shape.text,
            authorUrn: CreateCommentSchema.shape.authorUrn,
        },
    }, async (params) => {
        try {
            log.info('CAVEMAN: create_comment called for postUrn=%s', params.postUrn);
            const actorUrn = params.authorUrn ?? await getPersonUrn(client);
            const encodedUrn = encodeURIComponent(params.postUrn);
            const commentBody = {
                actor: actorUrn,
                message: {
                    text: params.text,
                },
            };
            log.debug('CAVEMAN: Creating comment with body=%o', commentBody);
            const result = await client.post(`/socialActions/${encodedUrn}/comments`, commentBody, false);
            log.info('CAVEMAN: create_comment succeeded');
            return formatToolResult(result ?? { success: true, message: 'Comment created successfully' });
        }
        catch (error) {
            log.error('CAVEMAN: create_comment failed: %s', error);
            return formatToolError(error);
        }
    });
    // ─── delete_comment ─────────────────────────────────────────────────────
    server.registerTool('delete_comment', {
        description: 'Delete a comment from a LinkedIn post',
        inputSchema: {
            commentUrn: DeleteCommentSchema.shape.commentUrn,
        },
    }, async (params) => {
        try {
            log.info('CAVEMAN: delete_comment called for commentUrn=%s', params.commentUrn);
            const { activityUrn, commentId } = parseCommentUrn(params.commentUrn);
            const encodedActivityUrn = encodeURIComponent(activityUrn);
            log.debug('CAVEMAN: Deleting comment: activityUrn=%s, commentId=%s', activityUrn, commentId);
            await client.delete(`/socialActions/${encodedActivityUrn}/comments/${commentId}`, false);
            log.info('CAVEMAN: delete_comment succeeded');
            return formatToolResult({ success: true, message: `Comment ${params.commentUrn} deleted successfully` });
        }
        catch (error) {
            log.error('CAVEMAN: delete_comment failed: %s', error);
            return formatToolError(error);
        }
    });
    // ─── add_reaction ───────────────────────────────────────────────────────
    server.registerTool('add_reaction', {
        description: 'Add a reaction (like, celebrate, etc.) to a LinkedIn post',
        inputSchema: {
            postUrn: AddReactionSchema.shape.postUrn,
            reactionType: AddReactionSchema.shape.reactionType,
        },
    }, async (params) => {
        try {
            log.info('CAVEMAN: add_reaction called for postUrn=%s, type=%s', params.postUrn, params.reactionType);
            const personUrn = await getPersonUrn(client);
            const encodedUrn = encodeURIComponent(params.postUrn);
            const reactionBody = {
                actor: personUrn,
                object: params.postUrn,
                reactionType: params.reactionType,
            };
            log.debug('CAVEMAN: Adding reaction with body=%o', reactionBody);
            const result = await client.post(`/socialActions/${encodedUrn}/likes`, reactionBody, false);
            log.info('CAVEMAN: add_reaction succeeded');
            return formatToolResult(result ?? { success: true, message: `Reaction ${params.reactionType} added successfully` });
        }
        catch (error) {
            log.error('CAVEMAN: add_reaction failed: %s', error);
            return formatToolError(error);
        }
    });
    // ─── remove_reaction ────────────────────────────────────────────────────
    server.registerTool('remove_reaction', {
        description: 'Remove a reaction from a LinkedIn post',
        inputSchema: {
            postUrn: RemoveReactionSchema.shape.postUrn,
            reactionType: RemoveReactionSchema.shape.reactionType,
        },
    }, async (params) => {
        try {
            log.info('CAVEMAN: remove_reaction called for postUrn=%s, type=%s', params.postUrn, params.reactionType);
            const personUrn = await getPersonUrn(client);
            const encodedPostUrn = encodeURIComponent(params.postUrn);
            const encodedPersonUrn = encodeURIComponent(personUrn);
            log.debug('CAVEMAN: Removing reaction from post=%s by person=%s', params.postUrn, personUrn);
            await client.delete(`/socialActions/${encodedPostUrn}/likes/${encodedPersonUrn}`, false);
            log.info('CAVEMAN: remove_reaction succeeded');
            return formatToolResult({ success: true, message: `Reaction ${params.reactionType} removed successfully` });
        }
        catch (error) {
            log.error('CAVEMAN: remove_reaction failed: %s', error);
            return formatToolError(error);
        }
    });
}
//# sourceMappingURL=social-actions.js.map
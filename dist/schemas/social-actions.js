import { z } from 'zod';
/** Valid LinkedIn reaction types */
export const REACTION_TYPES = [
    'LIKE',
    'CELEBRATE',
    'SUPPORT',
    'LOVE',
    'INSIGHTFUL',
    'CURIOUS',
];
/**
 * Schema for get_post_comments tool.
 */
export const GetPostCommentsSchema = z.object({
    postUrn: z
        .string()
        .describe('The URN of the post to get comments for'),
    count: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(10)
        .describe('Number of comments to retrieve (1-100, default 10)'),
    start: z
        .number()
        .int()
        .min(0)
        .optional()
        .default(0)
        .describe('Pagination offset (default 0)'),
});
/**
 * Schema for create_comment tool.
 */
export const CreateCommentSchema = z.object({
    postUrn: z
        .string()
        .describe('The URN of the post to comment on'),
    text: z
        .string()
        .min(1)
        .describe('The text content of the comment'),
    authorUrn: z
        .string()
        .optional()
        .describe('The URN of the author (defaults to authenticated user)'),
});
/**
 * Schema for delete_comment tool.
 */
export const DeleteCommentSchema = z.object({
    commentUrn: z
        .string()
        .describe('The full URN of the comment to delete (e.g., urn:li:comment:(urn:li:activity:123456,789))'),
});
/**
 * Schema for add_reaction tool.
 */
export const AddReactionSchema = z.object({
    postUrn: z
        .string()
        .describe('The URN of the post to react to'),
    reactionType: z
        .enum(REACTION_TYPES)
        .describe('The type of reaction to add'),
});
/**
 * Schema for remove_reaction tool.
 */
export const RemoveReactionSchema = z.object({
    postUrn: z
        .string()
        .describe('The URN of the post to remove the reaction from'),
    reactionType: z
        .enum(REACTION_TYPES)
        .describe('The type of reaction to remove'),
});
//# sourceMappingURL=social-actions.js.map
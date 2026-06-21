import { z } from 'zod';
/** Valid LinkedIn reaction types */
export declare const REACTION_TYPES: readonly ["LIKE", "CELEBRATE", "SUPPORT", "LOVE", "INSIGHTFUL", "CURIOUS"];
export type ReactionType = (typeof REACTION_TYPES)[number];
/**
 * Schema for get_post_comments tool.
 */
export declare const GetPostCommentsSchema: z.ZodObject<{
    postUrn: z.ZodString;
    count: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    start: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    postUrn: string;
    count: number;
    start: number;
}, {
    postUrn: string;
    count?: number | undefined;
    start?: number | undefined;
}>;
export type GetPostCommentsInput = z.infer<typeof GetPostCommentsSchema>;
/**
 * Schema for create_comment tool.
 */
export declare const CreateCommentSchema: z.ZodObject<{
    postUrn: z.ZodString;
    text: z.ZodString;
    authorUrn: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    postUrn: string;
    authorUrn?: string | undefined;
}, {
    text: string;
    postUrn: string;
    authorUrn?: string | undefined;
}>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
/**
 * Schema for delete_comment tool.
 */
export declare const DeleteCommentSchema: z.ZodObject<{
    commentUrn: z.ZodString;
}, "strip", z.ZodTypeAny, {
    commentUrn: string;
}, {
    commentUrn: string;
}>;
export type DeleteCommentInput = z.infer<typeof DeleteCommentSchema>;
/**
 * Schema for add_reaction tool.
 */
export declare const AddReactionSchema: z.ZodObject<{
    postUrn: z.ZodString;
    reactionType: z.ZodEnum<["LIKE", "CELEBRATE", "SUPPORT", "LOVE", "INSIGHTFUL", "CURIOUS"]>;
}, "strip", z.ZodTypeAny, {
    postUrn: string;
    reactionType: "LIKE" | "CELEBRATE" | "SUPPORT" | "LOVE" | "INSIGHTFUL" | "CURIOUS";
}, {
    postUrn: string;
    reactionType: "LIKE" | "CELEBRATE" | "SUPPORT" | "LOVE" | "INSIGHTFUL" | "CURIOUS";
}>;
export type AddReactionInput = z.infer<typeof AddReactionSchema>;
/**
 * Schema for remove_reaction tool.
 */
export declare const RemoveReactionSchema: z.ZodObject<{
    postUrn: z.ZodString;
    reactionType: z.ZodEnum<["LIKE", "CELEBRATE", "SUPPORT", "LOVE", "INSIGHTFUL", "CURIOUS"]>;
}, "strip", z.ZodTypeAny, {
    postUrn: string;
    reactionType: "LIKE" | "CELEBRATE" | "SUPPORT" | "LOVE" | "INSIGHTFUL" | "CURIOUS";
}, {
    postUrn: string;
    reactionType: "LIKE" | "CELEBRATE" | "SUPPORT" | "LOVE" | "INSIGHTFUL" | "CURIOUS";
}>;
export type RemoveReactionInput = z.infer<typeof RemoveReactionSchema>;
//# sourceMappingURL=social-actions.d.ts.map
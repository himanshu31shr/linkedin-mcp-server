import { z } from 'zod';
/**
 * Visibility options for LinkedIn posts.
 */
export declare const VisibilityEnum: z.ZodDefault<z.ZodEnum<["PUBLIC", "CONNECTIONS"]>>;
/**
 * Schema for create_text_post tool.
 */
export declare const CreateTextPostInputSchema: z.ZodObject<{
    text: z.ZodString;
    visibility: z.ZodOptional<z.ZodDefault<z.ZodEnum<["PUBLIC", "CONNECTIONS"]>>>;
}, "strip", z.ZodTypeAny, {
    text: string;
    visibility?: "PUBLIC" | "CONNECTIONS" | undefined;
}, {
    text: string;
    visibility?: "PUBLIC" | "CONNECTIONS" | undefined;
}>;
export type CreateTextPostInput = z.infer<typeof CreateTextPostInputSchema>;
/**
 * Schema for create_link_post tool.
 */
export declare const CreateLinkPostInputSchema: z.ZodObject<{
    text: z.ZodString;
    linkUrl: z.ZodString;
    linkTitle: z.ZodOptional<z.ZodString>;
    visibility: z.ZodOptional<z.ZodDefault<z.ZodEnum<["PUBLIC", "CONNECTIONS"]>>>;
}, "strip", z.ZodTypeAny, {
    text: string;
    linkUrl: string;
    visibility?: "PUBLIC" | "CONNECTIONS" | undefined;
    linkTitle?: string | undefined;
}, {
    text: string;
    linkUrl: string;
    visibility?: "PUBLIC" | "CONNECTIONS" | undefined;
    linkTitle?: string | undefined;
}>;
export type CreateLinkPostInput = z.infer<typeof CreateLinkPostInputSchema>;
/**
 * Schema for delete_post tool.
 */
export declare const DeletePostInputSchema: z.ZodObject<{
    postUrn: z.ZodString;
}, "strip", z.ZodTypeAny, {
    postUrn: string;
}, {
    postUrn: string;
}>;
export type DeletePostInput = z.infer<typeof DeletePostInputSchema>;
//# sourceMappingURL=posts.d.ts.map
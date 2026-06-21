import { z } from 'zod';
/**
 * Visibility options for LinkedIn posts.
 */
export declare const VisibilityEnum: z.ZodDefault<z.ZodEnum<["PUBLIC", "CONNECTIONS"]>>;
/**
 * Schema for upload_image tool.
 */
export declare const UploadImageInputSchema: z.ZodObject<{
    imageUrl: z.ZodString;
    altText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    imageUrl: string;
    altText?: string | undefined;
}, {
    imageUrl: string;
    altText?: string | undefined;
}>;
export type UploadImageInput = z.infer<typeof UploadImageInputSchema>;
/**
 * Schema for create_image_post tool.
 */
export declare const CreateImagePostInputSchema: z.ZodObject<{
    text: z.ZodString;
    imageUrl: z.ZodString;
    altText: z.ZodOptional<z.ZodString>;
    visibility: z.ZodOptional<z.ZodDefault<z.ZodEnum<["PUBLIC", "CONNECTIONS"]>>>;
}, "strip", z.ZodTypeAny, {
    text: string;
    imageUrl: string;
    visibility?: "PUBLIC" | "CONNECTIONS" | undefined;
    altText?: string | undefined;
}, {
    text: string;
    imageUrl: string;
    visibility?: "PUBLIC" | "CONNECTIONS" | undefined;
    altText?: string | undefined;
}>;
export type CreateImagePostInput = z.infer<typeof CreateImagePostInputSchema>;
/**
 * Schema for create_document_post tool.
 */
export declare const CreateDocumentPostInputSchema: z.ZodObject<{
    text: z.ZodString;
    documentUrl: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    visibility: z.ZodOptional<z.ZodDefault<z.ZodEnum<["PUBLIC", "CONNECTIONS"]>>>;
}, "strip", z.ZodTypeAny, {
    text: string;
    documentUrl: string;
    title?: string | undefined;
    visibility?: "PUBLIC" | "CONNECTIONS" | undefined;
}, {
    text: string;
    documentUrl: string;
    title?: string | undefined;
    visibility?: "PUBLIC" | "CONNECTIONS" | undefined;
}>;
export type CreateDocumentPostInput = z.infer<typeof CreateDocumentPostInputSchema>;
//# sourceMappingURL=media.d.ts.map
import { z } from 'zod';
/**
 * Visibility options for LinkedIn posts.
 */
export const VisibilityEnum = z.enum(['PUBLIC', 'CONNECTIONS']).default('PUBLIC');
/**
 * Schema for upload_image tool.
 */
export const UploadImageInputSchema = z.object({
    imageUrl: z.string().url('imageUrl must be a valid URL'),
    altText: z.string().max(300, 'Alt text cannot exceed 300 characters').optional(),
});
/**
 * Schema for create_image_post tool.
 */
export const CreateImagePostInputSchema = z.object({
    text: z.string().min(1, 'Post text cannot be empty').max(3000, 'Post text cannot exceed 3000 characters'),
    imageUrl: z.string().url('imageUrl must be a valid URL'),
    altText: z.string().max(300, 'Alt text cannot exceed 300 characters').optional(),
    visibility: VisibilityEnum.optional(),
});
/**
 * Schema for create_document_post tool.
 */
export const CreateDocumentPostInputSchema = z.object({
    text: z.string().min(1, 'Post text cannot be empty').max(3000, 'Post text cannot exceed 3000 characters'),
    documentUrl: z.string().url('documentUrl must be a valid URL'),
    title: z.string().optional(),
    visibility: VisibilityEnum.optional(),
});
//# sourceMappingURL=media.js.map
import { z } from 'zod';

/**
 * Visibility options for LinkedIn posts.
 */
export const VisibilityEnum = z.enum(['PUBLIC', 'CONNECTIONS']).default('PUBLIC');

/**
 * Schema for create_text_post tool.
 */
export const CreateTextPostInputSchema = z.object({
  text: z.string().min(1, 'Post text cannot be empty').max(3000, 'Post text cannot exceed 3000 characters'),
  visibility: VisibilityEnum.optional(),
});
export type CreateTextPostInput = z.infer<typeof CreateTextPostInputSchema>;

/**
 * Schema for create_link_post tool.
 */
export const CreateLinkPostInputSchema = z.object({
  text: z.string().min(1, 'Post text cannot be empty').max(3000, 'Post text cannot exceed 3000 characters'),
  linkUrl: z.string().url('linkUrl must be a valid URL'),
  linkTitle: z.string().optional(),
  visibility: VisibilityEnum.optional(),
});
export type CreateLinkPostInput = z.infer<typeof CreateLinkPostInputSchema>;

/**
 * Schema for delete_post tool.
 */
export const DeletePostInputSchema = z.object({
  postUrn: z.string().regex(/^urn:li:/, 'postUrn must be a valid LinkedIn URN (e.g. urn:li:share:123456)'),
});
export type DeletePostInput = z.infer<typeof DeletePostInputSchema>;

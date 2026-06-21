import { z } from 'zod';

/**
 * Schema for get_organization tool.
 * At least one of organizationId or vanityName must be provided.
 */
export const GetOrganizationSchema = z
  .object({
    organizationId: z
      .string()
      .optional()
      .describe('The numeric ID of the organization'),
    vanityName: z
      .string()
      .optional()
      .describe('The vanity name (URL slug) of the organization'),
  })
  .refine((data) => data.organizationId || data.vanityName, {
    message: 'Either organizationId or vanityName must be provided',
  });

export type GetOrganizationInput = z.infer<typeof GetOrganizationSchema>;

/**
 * Schema for create_org_post tool.
 */
export const CreateOrgPostSchema = z.object({
  organizationId: z
    .string()
    .describe('The numeric ID of the organization to post as'),
  text: z
    .string()
    .min(1)
    .describe('The text content of the post'),
  visibility: z
    .enum(['PUBLIC', 'LOGGED_IN'])
    .optional()
    .default('PUBLIC')
    .describe('Post visibility: PUBLIC or LOGGED_IN (members only)'),
  linkUrl: z
    .string()
    .url()
    .optional()
    .describe('Optional URL to include as an article attachment'),
  linkTitle: z
    .string()
    .optional()
    .describe('Optional title for the article attachment'),
});

export type CreateOrgPostInput = z.infer<typeof CreateOrgPostSchema>;

/**
 * Schema for get_org_posts tool.
 */
export const GetOrgPostsSchema = z.object({
  organizationId: z
    .string()
    .describe('The numeric ID of the organization'),
  count: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .describe('Number of posts to retrieve (1-100, default 10)'),
  start: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0)
    .describe('Pagination offset (default 0)'),
});

export type GetOrgPostsInput = z.infer<typeof GetOrgPostsSchema>;

/**
 * Schema for delete_org_post tool.
 */
export const DeleteOrgPostSchema = z.object({
  postUrn: z
    .string()
    .describe('The URN of the post to delete (e.g., urn:li:share:123456)'),
});

export type DeleteOrgPostInput = z.infer<typeof DeleteOrgPostSchema>;

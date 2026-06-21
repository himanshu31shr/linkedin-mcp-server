import { z } from 'zod';

/**
 * Schema for get_org_page_statistics tool.
 */
export const GetOrgPageStatisticsSchema = z.object({
  organizationId: z
    .string()
    .describe('The numeric ID of the organization'),
  timeRange: z
    .object({
      start: z
        .number()
        .describe('Start timestamp in milliseconds since epoch'),
      end: z
        .number()
        .describe('End timestamp in milliseconds since epoch'),
    })
    .optional()
    .describe('Optional time range filter for the statistics'),
});

export type GetOrgPageStatisticsInput = z.infer<typeof GetOrgPageStatisticsSchema>;

/**
 * Schema for get_org_follower_statistics tool.
 */
export const GetOrgFollowerStatisticsSchema = z.object({
  organizationId: z
    .string()
    .describe('The numeric ID of the organization'),
});

export type GetOrgFollowerStatisticsInput = z.infer<typeof GetOrgFollowerStatisticsSchema>;

/**
 * Schema for get_org_share_statistics tool.
 */
export const GetOrgShareStatisticsSchema = z.object({
  organizationId: z
    .string()
    .describe('The numeric ID of the organization'),
  shareUrns: z
    .array(z.string())
    .optional()
    .describe('Optional list of share URNs to filter statistics by'),
});

export type GetOrgShareStatisticsInput = z.infer<typeof GetOrgShareStatisticsSchema>;

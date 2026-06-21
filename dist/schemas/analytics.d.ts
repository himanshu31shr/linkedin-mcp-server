import { z } from 'zod';
/**
 * Schema for get_org_page_statistics tool.
 */
export declare const GetOrgPageStatisticsSchema: z.ZodObject<{
    organizationId: z.ZodString;
    timeRange: z.ZodOptional<z.ZodObject<{
        start: z.ZodNumber;
        end: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        start: number;
        end: number;
    }, {
        start: number;
        end: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    timeRange?: {
        start: number;
        end: number;
    } | undefined;
}, {
    organizationId: string;
    timeRange?: {
        start: number;
        end: number;
    } | undefined;
}>;
export type GetOrgPageStatisticsInput = z.infer<typeof GetOrgPageStatisticsSchema>;
/**
 * Schema for get_org_follower_statistics tool.
 */
export declare const GetOrgFollowerStatisticsSchema: z.ZodObject<{
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
}, {
    organizationId: string;
}>;
export type GetOrgFollowerStatisticsInput = z.infer<typeof GetOrgFollowerStatisticsSchema>;
/**
 * Schema for get_org_share_statistics tool.
 */
export declare const GetOrgShareStatisticsSchema: z.ZodObject<{
    organizationId: z.ZodString;
    shareUrns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    shareUrns?: string[] | undefined;
}, {
    organizationId: string;
    shareUrns?: string[] | undefined;
}>;
export type GetOrgShareStatisticsInput = z.infer<typeof GetOrgShareStatisticsSchema>;
//# sourceMappingURL=analytics.d.ts.map
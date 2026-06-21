import { z } from 'zod';
/**
 * Schema for get_organization tool.
 * At least one of organizationId or vanityName must be provided.
 */
export declare const GetOrganizationSchema: z.ZodEffects<z.ZodObject<{
    organizationId: z.ZodOptional<z.ZodString>;
    vanityName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    organizationId?: string | undefined;
    vanityName?: string | undefined;
}, {
    organizationId?: string | undefined;
    vanityName?: string | undefined;
}>, {
    organizationId?: string | undefined;
    vanityName?: string | undefined;
}, {
    organizationId?: string | undefined;
    vanityName?: string | undefined;
}>;
export type GetOrganizationInput = z.infer<typeof GetOrganizationSchema>;
/**
 * Schema for create_org_post tool.
 */
export declare const CreateOrgPostSchema: z.ZodObject<{
    organizationId: z.ZodString;
    text: z.ZodString;
    visibility: z.ZodDefault<z.ZodOptional<z.ZodEnum<["PUBLIC", "LOGGED_IN"]>>>;
    linkUrl: z.ZodOptional<z.ZodString>;
    linkTitle: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    visibility: "PUBLIC" | "LOGGED_IN";
    organizationId: string;
    linkUrl?: string | undefined;
    linkTitle?: string | undefined;
}, {
    text: string;
    organizationId: string;
    visibility?: "PUBLIC" | "LOGGED_IN" | undefined;
    linkUrl?: string | undefined;
    linkTitle?: string | undefined;
}>;
export type CreateOrgPostInput = z.infer<typeof CreateOrgPostSchema>;
/**
 * Schema for get_org_posts tool.
 */
export declare const GetOrgPostsSchema: z.ZodObject<{
    organizationId: z.ZodString;
    count: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    start: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    count: number;
    start: number;
}, {
    organizationId: string;
    count?: number | undefined;
    start?: number | undefined;
}>;
export type GetOrgPostsInput = z.infer<typeof GetOrgPostsSchema>;
/**
 * Schema for delete_org_post tool.
 */
export declare const DeleteOrgPostSchema: z.ZodObject<{
    postUrn: z.ZodString;
}, "strip", z.ZodTypeAny, {
    postUrn: string;
}, {
    postUrn: string;
}>;
export type DeleteOrgPostInput = z.infer<typeof DeleteOrgPostSchema>;
//# sourceMappingURL=organization.d.ts.map
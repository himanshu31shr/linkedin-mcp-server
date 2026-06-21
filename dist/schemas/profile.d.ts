import { z } from 'zod';
/**
 * Schema for get_profile tool — no input parameters needed.
 * Returns the authenticated user's profile from /v2/userinfo.
 */
export declare const GetProfileInputSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export type GetProfileInput = z.infer<typeof GetProfileInputSchema>;
/**
 * Schema for get_email tool — no input parameters needed.
 * Returns only the authenticated user's email from /v2/userinfo.
 */
export declare const GetEmailInputSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export type GetEmailInput = z.infer<typeof GetEmailInputSchema>;
/**
 * Shape of the /v2/userinfo response from LinkedIn.
 */
export interface UserInfoResponse {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture?: string;
    email: string;
    email_verified?: boolean;
    locale?: {
        country: string;
        language: string;
    };
}
//# sourceMappingURL=profile.d.ts.map
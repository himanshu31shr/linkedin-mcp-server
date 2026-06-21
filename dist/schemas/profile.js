import { z } from 'zod';
/**
 * Schema for get_profile tool — no input parameters needed.
 * Returns the authenticated user's profile from /v2/userinfo.
 */
export const GetProfileInputSchema = z.object({});
/**
 * Schema for get_email tool — no input parameters needed.
 * Returns only the authenticated user's email from /v2/userinfo.
 */
export const GetEmailInputSchema = z.object({});
//# sourceMappingURL=profile.js.map
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TextContent } from '@modelcontextprotocol/sdk/types.js';
import { LinkedInClient } from '../services/linkedin-client.js';
import { formatToolError, formatToolResult } from '../utils/errors.js';
import { createChildLogger } from '../utils/logger.js';
import type { UserInfoResponse } from '../schemas/profile.js';
import { GetProfileInputSchema, GetEmailInputSchema } from '../schemas/profile.js';

const log = createChildLogger('profile-tools');

/**
 * Get the authenticated user's LinkedIn profile.
 */
export async function getProfile(
  client: LinkedInClient,
): Promise<{ content: TextContent[]; isError?: true }> {
  try {
    log.info('CAVEMAN: Fetching user profile from /v2/userinfo');
    const userInfo = await client.get<UserInfoResponse>('/userinfo', undefined, false);
    log.info('CAVEMAN: Profile fetched successfully for sub=%s', userInfo.sub);

    const profile = {
      id: userInfo.sub,
      name: userInfo.name,
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
      email: userInfo.email,
      emailVerified: userInfo.email_verified,
      picture: userInfo.picture,
      locale: userInfo.locale,
    };

    return formatToolResult(profile);
  } catch (error) {
    log.error('CAVEMAN: Failed to fetch profile: %s', error);
    return formatToolError(error);
  }
}

/**
 * Get the authenticated user's email address.
 */
export async function getEmail(
  client: LinkedInClient,
): Promise<{ content: TextContent[]; isError?: true }> {
  try {
    log.info('CAVEMAN: Fetching user email from /v2/userinfo');
    const userInfo = await client.get<UserInfoResponse>('/userinfo', undefined, false);
    log.info('CAVEMAN: Email fetched successfully');

    return formatToolResult({ email: userInfo.email });
  } catch (error) {
    log.error('CAVEMAN: Failed to fetch email: %s', error);
    return formatToolError(error);
  }
}

/**
 * Register all profile-related tools with the MCP server.
 */
export function registerProfileTools(server: McpServer, client: LinkedInClient): void {
  server.registerTool(
    'get_profile',
    {
      description: "Get the authenticated user's LinkedIn profile including name, email, picture, and unique ID",
      inputSchema: GetProfileInputSchema.shape,
    },
    async () => {
      return getProfile(client);
    },
  );

  server.registerTool(
    'get_email',
    {
      description: "Get the authenticated user's LinkedIn email address",
      inputSchema: GetEmailInputSchema.shape,
    },
    async () => {
      return getEmail(client);
    },
  );

  log.info('CAVEMAN: Registered profile tools (get_profile, get_email)');
}

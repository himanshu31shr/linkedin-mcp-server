import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { LinkedInClient } from '../services/linkedin-client.js';
import { createChildLogger } from '../utils/logger.js';
import { formatToolError, formatToolResult } from '../utils/errors.js';
import { buildUrn } from '../utils/urns.js';
import {
  GetOrganizationSchema,
  CreateOrgPostSchema,
  GetOrgPostsSchema,
  DeleteOrgPostSchema,
} from '../schemas/organization.js';

const log = createChildLogger('organization-tools');

/**
 * Register all organization management tools with the MCP server.
 */
export function registerOrganizationTools(server: McpServer, client: LinkedInClient): void {
  // ─── get_organization ─────────────────────────────────────────────────────
  server.registerTool(
    'get_organization',
    {
      description: 'Get LinkedIn organization details by ID or vanity name',
      inputSchema: {
        organizationId: GetOrganizationSchema.innerType().shape.organizationId,
        vanityName: GetOrganizationSchema.innerType().shape.vanityName,
      },
    },
    async (params) => {
      try {
        log.info('CAVEMAN: get_organization called with params=%o', params);

        const { organizationId, vanityName } = params;

        if (!organizationId && !vanityName) {
          return formatToolError(new Error('Either organizationId or vanityName must be provided'));
        }

        let result: unknown;

        if (organizationId) {
          log.debug('CAVEMAN: Fetching organization by ID: %s', organizationId);
          result = await client.get(`/organizations/${organizationId}`, undefined, false);
        } else {
          log.debug('CAVEMAN: Fetching organization by vanityName: %s', vanityName);
          result = await client.get(
            '/organizations',
            { q: 'vanityName', vanityName: vanityName! },
            false,
          );
        }

        log.info('CAVEMAN: get_organization succeeded');
        return formatToolResult(result);
      } catch (error) {
        log.error('CAVEMAN: get_organization failed: %s', error);
        return formatToolError(error);
      }
    },
  );

  // ─── create_org_post ──────────────────────────────────────────────────────
  server.registerTool(
    'create_org_post',
    {
      description: 'Create a post on behalf of a LinkedIn organization',
      inputSchema: {
        organizationId: CreateOrgPostSchema.shape.organizationId,
        text: CreateOrgPostSchema.shape.text,
        visibility: CreateOrgPostSchema.shape.visibility,
        linkUrl: CreateOrgPostSchema.shape.linkUrl,
        linkTitle: CreateOrgPostSchema.shape.linkTitle,
      },
    },
    async (params) => {
      try {
        log.info('CAVEMAN: create_org_post called for org=%s', params.organizationId);

        const authorUrn = buildUrn('organization', params.organizationId);
        const visibility = params.visibility ?? 'PUBLIC';

        const postBody: Record<string, unknown> = {
          author: authorUrn,
          commentary: params.text,
          visibility: visibility,
          distribution: {
            feedDistribution: 'MAIN_FEED',
            targetEntities: [],
            thirdPartyDistributionChannels: [],
          },
          lifecycleState: 'PUBLISHED',
        };

        // Add article content if link URL is provided
        if (params.linkUrl) {
          postBody.content = {
            article: {
              source: params.linkUrl,
              title: params.linkTitle ?? params.linkUrl,
            },
          };
        }

        log.debug('CAVEMAN: Creating org post with body=%o', postBody);
        const result = await client.post('/posts', postBody);

        log.info('CAVEMAN: create_org_post succeeded');
        return formatToolResult(result ?? { success: true, message: 'Organization post created successfully' });
      } catch (error) {
        log.error('CAVEMAN: create_org_post failed: %s', error);
        return formatToolError(error);
      }
    },
  );

  // ─── get_org_posts ────────────────────────────────────────────────────────
  server.registerTool(
    'get_org_posts',
    {
      description: 'Get recent posts from a LinkedIn organization',
      inputSchema: {
        organizationId: GetOrgPostsSchema.shape.organizationId,
        count: GetOrgPostsSchema.shape.count,
        start: GetOrgPostsSchema.shape.start,
      },
    },
    async (params) => {
      try {
        log.info('CAVEMAN: get_org_posts called for org=%s', params.organizationId);

        const authorUrn = buildUrn('organization', params.organizationId);
        const count = params.count ?? 10;
        const start = params.start ?? 0;

        const result = await client.get('/posts', {
          q: 'author',
          author: authorUrn,
          count: String(count),
          start: String(start),
        });

        log.info('CAVEMAN: get_org_posts succeeded');
        return formatToolResult(result);
      } catch (error) {
        log.error('CAVEMAN: get_org_posts failed: %s', error);
        return formatToolError(error);
      }
    },
  );

  // ─── delete_org_post ──────────────────────────────────────────────────────
  server.registerTool(
    'delete_org_post',
    {
      description: 'Delete a LinkedIn organization post by its URN',
      inputSchema: {
        postUrn: DeleteOrgPostSchema.shape.postUrn,
      },
    },
    async (params) => {
      try {
        log.info('CAVEMAN: delete_org_post called for postUrn=%s', params.postUrn);

        const encodedUrn = encodeURIComponent(params.postUrn);
        await client.delete(`/posts/${encodedUrn}`);

        log.info('CAVEMAN: delete_org_post succeeded');
        return formatToolResult({ success: true, message: `Post ${params.postUrn} deleted successfully` });
      } catch (error) {
        log.error('CAVEMAN: delete_org_post failed: %s', error);
        return formatToolError(error);
      }
    },
  );
}

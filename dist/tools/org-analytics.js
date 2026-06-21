import { createChildLogger } from '../utils/logger.js';
import { formatToolError, formatToolResult } from '../utils/errors.js';
import { buildUrn } from '../utils/urns.js';
import { GetOrgPageStatisticsSchema, GetOrgFollowerStatisticsSchema, GetOrgShareStatisticsSchema, } from '../schemas/analytics.js';
const log = createChildLogger('org-analytics-tools');
/**
 * Register all organization analytics tools with the MCP server.
 */
export function registerOrgAnalyticsTools(server, client) {
    // ─── get_org_page_statistics ────────────────────────────────────────────
    server.registerTool('get_org_page_statistics', {
        description: 'Get page view statistics for a LinkedIn organization',
        inputSchema: {
            organizationId: GetOrgPageStatisticsSchema.shape.organizationId,
            timeRange: GetOrgPageStatisticsSchema.shape.timeRange,
        },
    }, async (params) => {
        try {
            log.info('CAVEMAN: get_org_page_statistics called for org=%s', params.organizationId);
            const orgUrn = buildUrn('organization', params.organizationId);
            const queryParams = {
                q: 'organization',
                organization: orgUrn,
            };
            if (params.timeRange) {
                queryParams['timeIntervals.timeGranularityType'] = 'DAY';
                queryParams['timeIntervals.timeRange.start'] = String(params.timeRange.start);
                queryParams['timeIntervals.timeRange.end'] = String(params.timeRange.end);
            }
            const result = await client.get('/organizationPageStatistics', queryParams, false);
            log.info('CAVEMAN: get_org_page_statistics succeeded');
            return formatToolResult(result);
        }
        catch (error) {
            log.error('CAVEMAN: get_org_page_statistics failed: %s', error);
            return formatToolError(error);
        }
    });
    // ─── get_org_follower_statistics ────────────────────────────────────────
    server.registerTool('get_org_follower_statistics', {
        description: 'Get follower statistics for a LinkedIn organization',
        inputSchema: {
            organizationId: GetOrgFollowerStatisticsSchema.shape.organizationId,
        },
    }, async (params) => {
        try {
            log.info('CAVEMAN: get_org_follower_statistics called for org=%s', params.organizationId);
            const orgUrn = buildUrn('organization', params.organizationId);
            const result = await client.get('/organizationalEntityFollowerStatistics', {
                q: 'organizationalEntity',
                organizationalEntity: orgUrn,
            }, false);
            log.info('CAVEMAN: get_org_follower_statistics succeeded');
            return formatToolResult(result);
        }
        catch (error) {
            log.error('CAVEMAN: get_org_follower_statistics failed: %s', error);
            return formatToolError(error);
        }
    });
    // ─── get_org_share_statistics ───────────────────────────────────────────
    server.registerTool('get_org_share_statistics', {
        description: 'Get share/post engagement statistics for a LinkedIn organization',
        inputSchema: {
            organizationId: GetOrgShareStatisticsSchema.shape.organizationId,
            shareUrns: GetOrgShareStatisticsSchema.shape.shareUrns,
        },
    }, async (params) => {
        try {
            log.info('CAVEMAN: get_org_share_statistics called for org=%s', params.organizationId);
            const orgUrn = buildUrn('organization', params.organizationId);
            const queryParams = {
                q: 'organizationalEntity',
                organizationalEntity: orgUrn,
            };
            // Add share URN filters if provided
            if (params.shareUrns && params.shareUrns.length > 0) {
                params.shareUrns.forEach((urn, index) => {
                    queryParams[`shares[${index}]`] = urn;
                });
            }
            const result = await client.get('/organizationalEntityShareStatistics', queryParams, false);
            log.info('CAVEMAN: get_org_share_statistics succeeded');
            return formatToolResult(result);
        }
        catch (error) {
            log.error('CAVEMAN: get_org_share_statistics failed: %s', error);
            return formatToolError(error);
        }
    });
}
//# sourceMappingURL=org-analytics.js.map
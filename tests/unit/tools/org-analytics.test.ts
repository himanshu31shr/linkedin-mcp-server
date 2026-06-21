import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerOrgAnalyticsTools } from '../../../src/tools/org-analytics.js';
import { LinkedInClient } from '../../../src/services/linkedin-client.js';
import { LinkedInApiError } from '../../../src/utils/errors.js';

// ─── Mock LinkedInClient ──────────────────────────────────────────────────
vi.mock('../../../src/services/linkedin-client.js', () => {
  return {
    LinkedInClient: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      request: vi.fn(),
      uploadBinary: vi.fn(),
    })),
  };
});

// ─── Mock logger ─────────────────────────────────────────────────────────
vi.mock('../../../src/utils/logger.js', () => ({
  createChildLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────

function extractToolHandler(server: McpServer, toolName: string) {
  const calls = vi.mocked(server.registerTool).mock.calls;
  const match = calls.find((call) => call[0] === toolName);
  if (!match) {
    throw new Error(`Tool "${toolName}" was not registered`);
  }
  return match[match.length - 1] as (params: Record<string, unknown>) => Promise<unknown>;
}

// ─── Mock Data ────────────────────────────────────────────────────────────

const mockPageStatistics = {
  elements: [
    {
      organization: 'urn:li:organization:12345',
      totalPageStatistics: {
        views: {
          allPageViews: { pageViews: 1520 },
          careersPageViews: { pageViews: 320 },
          overviewPageViews: { pageViews: 1200 },
        },
      },
    },
  ],
};

const mockFollowerStatistics = {
  elements: [
    {
      organizationalEntity: 'urn:li:organization:12345',
      followerCounts: {
        organicFollowerCount: 4500,
        paidFollowerCount: 200,
      },
    },
  ],
};

const mockShareStatistics = {
  elements: [
    {
      organizationalEntity: 'urn:li:organization:12345',
      totalShareStatistics: {
        shareCount: 150,
        clickCount: 3200,
        engagement: 0.042,
        commentCount: 89,
        impressionCount: 75000,
        likeCount: 1200,
      },
    },
  ],
};

describe('org-analytics tools', () => {
  let server: McpServer;
  let client: LinkedInClient;

  beforeEach(() => {
    vi.clearAllMocks();
    server = { registerTool: vi.fn() } as unknown as McpServer;
    client = new LinkedInClient('test-token');
    registerOrgAnalyticsTools(server, client);
  });

  it('should register all three analytics tools', () => {
    expect(server.registerTool).toHaveBeenCalledTimes(3);
    const toolNames = vi.mocked(server.registerTool).mock.calls.map((call) => call[0]);
    expect(toolNames).toContain('get_org_page_statistics');
    expect(toolNames).toContain('get_org_follower_statistics');
    expect(toolNames).toContain('get_org_share_statistics');
  });

  // ─── get_org_page_statistics ────────────────────────────────────────
  describe('get_org_page_statistics', () => {
    it('should fetch page statistics without time range', async () => {
      vi.mocked(client.get).mockResolvedValue(mockPageStatistics);

      const handler = extractToolHandler(server, 'get_org_page_statistics');
      const result = (await handler({ organizationId: '12345' })) as { content: Array<{ text: string }> };

      expect(client.get).toHaveBeenCalledWith(
        '/organizationPageStatistics',
        {
          q: 'organization',
          organization: 'urn:li:organization:12345',
        },
        false,
      );
      expect(result.content[0].text).toContain('1520');
    });

    it('should include time range params when provided', async () => {
      vi.mocked(client.get).mockResolvedValue(mockPageStatistics);

      const handler = extractToolHandler(server, 'get_org_page_statistics');
      await handler({
        organizationId: '12345',
        timeRange: { start: 1700000000000, end: 1700100000000 },
      });

      expect(client.get).toHaveBeenCalledWith(
        '/organizationPageStatistics',
        {
          q: 'organization',
          organization: 'urn:li:organization:12345',
          'timeIntervals.timeGranularityType': 'DAY',
          'timeIntervals.timeRange.start': '1700000000000',
          'timeIntervals.timeRange.end': '1700100000000',
        },
        false,
      );
    });

    it('should handle empty statistics', async () => {
      vi.mocked(client.get).mockResolvedValue({ elements: [] });

      const handler = extractToolHandler(server, 'get_org_page_statistics');
      const result = (await handler({ organizationId: '99999' })) as { content: Array<{ text: string }> };

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.elements).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(client.get).mockRejectedValue(new LinkedInApiError(403, 'Insufficient permissions'));

      const handler = extractToolHandler(server, 'get_org_page_statistics');
      const result = (await handler({ organizationId: '12345' })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Insufficient permissions');
    });
  });

  // ─── get_org_follower_statistics ────────────────────────────────────
  describe('get_org_follower_statistics', () => {
    it('should fetch follower statistics', async () => {
      vi.mocked(client.get).mockResolvedValue(mockFollowerStatistics);

      const handler = extractToolHandler(server, 'get_org_follower_statistics');
      const result = (await handler({ organizationId: '12345' })) as { content: Array<{ text: string }> };

      expect(client.get).toHaveBeenCalledWith(
        '/organizationalEntityFollowerStatistics',
        {
          q: 'organizationalEntity',
          organizationalEntity: 'urn:li:organization:12345',
        },
        false,
      );
      expect(result.content[0].text).toContain('4500');
      expect(result.content[0].text).toContain('200');
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(client.get).mockRejectedValue(new LinkedInApiError(500, 'Server error'));

      const handler = extractToolHandler(server, 'get_org_follower_statistics');
      const result = (await handler({ organizationId: '12345' })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Server error');
    });

    it('should handle rate limiting', async () => {
      vi.mocked(client.get).mockRejectedValue(new LinkedInApiError(429, 'Rate limited'));

      const handler = extractToolHandler(server, 'get_org_follower_statistics');
      const result = (await handler({ organizationId: '12345' })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('429');
    });
  });

  // ─── get_org_share_statistics ───────────────────────────────────────
  describe('get_org_share_statistics', () => {
    it('should fetch share statistics without share URN filter', async () => {
      vi.mocked(client.get).mockResolvedValue(mockShareStatistics);

      const handler = extractToolHandler(server, 'get_org_share_statistics');
      const result = (await handler({ organizationId: '12345' })) as { content: Array<{ text: string }> };

      expect(client.get).toHaveBeenCalledWith(
        '/organizationalEntityShareStatistics',
        {
          q: 'organizationalEntity',
          organizationalEntity: 'urn:li:organization:12345',
        },
        false,
      );
      expect(result.content[0].text).toContain('75000');
    });

    it('should include share URN filters when provided', async () => {
      vi.mocked(client.get).mockResolvedValue(mockShareStatistics);

      const handler = extractToolHandler(server, 'get_org_share_statistics');
      await handler({
        organizationId: '12345',
        shareUrns: ['urn:li:share:111', 'urn:li:share:222'],
      });

      expect(client.get).toHaveBeenCalledWith(
        '/organizationalEntityShareStatistics',
        {
          q: 'organizationalEntity',
          organizationalEntity: 'urn:li:organization:12345',
          'shares[0]': 'urn:li:share:111',
          'shares[1]': 'urn:li:share:222',
        },
        false,
      );
    });

    it('should not include shares params when shareUrns is empty array', async () => {
      vi.mocked(client.get).mockResolvedValue(mockShareStatistics);

      const handler = extractToolHandler(server, 'get_org_share_statistics');
      await handler({ organizationId: '12345', shareUrns: [] });

      const callParams = vi.mocked(client.get).mock.calls[0][1] as Record<string, string>;
      expect(callParams).not.toHaveProperty('shares[0]');
    });

    it('should handle single share URN filter', async () => {
      vi.mocked(client.get).mockResolvedValue(mockShareStatistics);

      const handler = extractToolHandler(server, 'get_org_share_statistics');
      await handler({
        organizationId: '12345',
        shareUrns: ['urn:li:share:111'],
      });

      const callParams = vi.mocked(client.get).mock.calls[0][1] as Record<string, string>;
      expect(callParams['shares[0]']).toBe('urn:li:share:111');
      expect(callParams).not.toHaveProperty('shares[1]');
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(client.get).mockRejectedValue(new LinkedInApiError(403, 'Access denied'));

      const handler = extractToolHandler(server, 'get_org_share_statistics');
      const result = (await handler({ organizationId: '12345' })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Access denied');
    });

    it('should handle empty statistics response', async () => {
      vi.mocked(client.get).mockResolvedValue({ elements: [] });

      const handler = extractToolHandler(server, 'get_org_share_statistics');
      const result = (await handler({ organizationId: '12345' })) as { content: Array<{ text: string }> };

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.elements).toHaveLength(0);
    });
  });
});

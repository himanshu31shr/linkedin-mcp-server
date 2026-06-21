import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerOrganizationTools } from '../../../src/tools/organization.js';
import { GetOrganizationSchema } from '../../../src/schemas/organization.js';
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

// ─── Mock logger to suppress output during tests ─────────────────────────
vi.mock('../../../src/utils/logger.js', () => ({
  createChildLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Extract the handler callback registered for a given tool name. */
function extractToolHandler(server: McpServer, toolName: string) {
  const calls = vi.mocked(server.registerTool).mock.calls;
  const match = calls.find((call) => call[0] === toolName);
  if (!match) {
    throw new Error(`Tool "${toolName}" was not registered`);
  }
  // The callback is always the last argument
  return match[match.length - 1] as (params: Record<string, unknown>) => Promise<unknown>;
}

// ─── Mock Data ────────────────────────────────────────────────────────────

const mockOrganization = {
  id: 12345,
  localizedName: 'Test Organization',
  vanityName: 'test-org',
  organizationType: 'CORPORATION',
};

const mockOrgPosts = {
  elements: [
    { id: 'urn:li:share:org-post-1', author: 'urn:li:organization:12345', commentary: 'Update #1' },
    { id: 'urn:li:share:org-post-2', author: 'urn:li:organization:12345', commentary: 'Update #2' },
  ],
  paging: { count: 10, start: 0, total: 2 },
};

// ─── Tests ────────────────────────────────────────────────────────────────
describe('organization tools', () => {
  let server: McpServer;
  let client: LinkedInClient;

  beforeEach(() => {
    vi.clearAllMocks();
    server = { registerTool: vi.fn() } as unknown as McpServer;
    client = new LinkedInClient('test-token');
    registerOrganizationTools(server, client);
  });

  describe('GetOrganizationSchema', () => {
    it('should validate correctly', () => {
      expect(GetOrganizationSchema.parse({ organizationId: '123' })).toBeDefined();
      expect(GetOrganizationSchema.parse({ vanityName: 'test' })).toBeDefined();
      expect(() => GetOrganizationSchema.parse({})).toThrow();
    });
  });

  it('should register all four organization tools', () => {
    expect(server.registerTool).toHaveBeenCalledTimes(4);
    const toolNames = vi.mocked(server.registerTool).mock.calls.map((call) => call[0]);
    expect(toolNames).toContain('get_organization');
    expect(toolNames).toContain('create_org_post');
    expect(toolNames).toContain('get_org_posts');
    expect(toolNames).toContain('delete_org_post');
  });

  // ─── get_organization ─────────────────────────────────────────────────
  describe('get_organization', () => {
    it('should fetch organization by ID', async () => {
      vi.mocked(client.get).mockResolvedValue(mockOrganization);

      const handler = extractToolHandler(server, 'get_organization');
      const result = (await handler({ organizationId: '12345' })) as { content: Array<{ text: string }> };

      expect(client.get).toHaveBeenCalledWith('/organizations/12345', undefined, false);
      expect(result.content[0].text).toContain('Test Organization');
    });

    it('should fetch organization by vanity name', async () => {
      vi.mocked(client.get).mockResolvedValue({ elements: [mockOrganization] });

      const handler = extractToolHandler(server, 'get_organization');
      const result = (await handler({ vanityName: 'test-org' })) as { content: Array<{ text: string }> };

      expect(client.get).toHaveBeenCalledWith(
        '/organizations',
        { q: 'vanityName', vanityName: 'test-org' },
        false,
      );
      expect(result.content[0].text).toContain('test-org');
    });

    it('should return error when neither organizationId nor vanityName provided', async () => {
      const handler = extractToolHandler(server, 'get_organization');
      const result = (await handler({})) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Either organizationId or vanityName must be provided');
      expect(client.get).not.toHaveBeenCalled();
    });

    it('should prefer organizationId over vanityName when both provided', async () => {
      vi.mocked(client.get).mockResolvedValue(mockOrganization);

      const handler = extractToolHandler(server, 'get_organization');
      await handler({ organizationId: '12345', vanityName: 'test-org' });

      expect(client.get).toHaveBeenCalledWith('/organizations/12345', undefined, false);
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(client.get).mockRejectedValue(new LinkedInApiError(404, 'Organization not found'));

      const handler = extractToolHandler(server, 'get_organization');
      const result = (await handler({ organizationId: '99999' })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('404');
      expect(result.content[0].text).toContain('Organization not found');
    });
  });

  // ─── create_org_post ──────────────────────────────────────────────────
  describe('create_org_post', () => {
    it('should create a simple text post for an organization', async () => {
      vi.mocked(client.post).mockResolvedValue(undefined);

      const handler = extractToolHandler(server, 'create_org_post');
      const result = (await handler({
        organizationId: '12345',
        text: 'Hello from our organization!',
      })) as { content: Array<{ text: string }> };

      expect(client.post).toHaveBeenCalledWith('/posts', expect.objectContaining({
        author: 'urn:li:organization:12345',
        commentary: 'Hello from our organization!',
        visibility: 'PUBLIC',
        lifecycleState: 'PUBLISHED',
      }));
      expect(result.content[0].text).toContain('success');
    });

    it('should create a post with LOGGED_IN visibility', async () => {
      vi.mocked(client.post).mockResolvedValue(undefined);

      const handler = extractToolHandler(server, 'create_org_post');
      await handler({
        organizationId: '12345',
        text: 'Members-only update',
        visibility: 'LOGGED_IN',
      });

      expect(client.post).toHaveBeenCalledWith('/posts', expect.objectContaining({
        visibility: 'LOGGED_IN',
      }));
    });

    it('should include article content when linkUrl is provided', async () => {
      vi.mocked(client.post).mockResolvedValue(undefined);

      const handler = extractToolHandler(server, 'create_org_post');
      await handler({
        organizationId: '12345',
        text: 'Check out our blog',
        linkUrl: 'https://example.com/blog',
        linkTitle: 'Our Latest Blog Post',
      });

      expect(client.post).toHaveBeenCalledWith('/posts', expect.objectContaining({
        content: {
          article: {
            source: 'https://example.com/blog',
            title: 'Our Latest Blog Post',
          },
        },
      }));
    });

    it('should default linkTitle to linkUrl when not provided', async () => {
      vi.mocked(client.post).mockResolvedValue(undefined);

      const handler = extractToolHandler(server, 'create_org_post');
      await handler({
        organizationId: '12345',
        text: 'Check out this link',
        linkUrl: 'https://example.com',
      });

      expect(client.post).toHaveBeenCalledWith('/posts', expect.objectContaining({
        content: {
          article: {
            source: 'https://example.com',
            title: 'https://example.com',
          },
        },
      }));
    });

    it('should not include content field when no linkUrl provided', async () => {
      vi.mocked(client.post).mockResolvedValue(undefined);

      const handler = extractToolHandler(server, 'create_org_post');
      await handler({ organizationId: '12345', text: 'No link here' });

      const postBody = vi.mocked(client.post).mock.calls[0][1] as Record<string, unknown>;
      expect(postBody.content).toBeUndefined();
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(client.post).mockRejectedValue(new LinkedInApiError(403, 'Not authorized to post'));

      const handler = extractToolHandler(server, 'create_org_post');
      const result = (await handler({
        organizationId: '12345',
        text: 'Unauthorized post',
      })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('403');
    });
  });

  // ─── get_org_posts ────────────────────────────────────────────────────
  describe('get_org_posts', () => {
    it('should fetch organization posts with default pagination', async () => {
      vi.mocked(client.get).mockResolvedValue(mockOrgPosts);

      const handler = extractToolHandler(server, 'get_org_posts');
      const result = (await handler({ organizationId: '12345' })) as { content: Array<{ text: string }> };

      expect(client.get).toHaveBeenCalledWith('/posts', {
        q: 'author',
        author: 'urn:li:organization:12345',
        count: '10',
        start: '0',
      });
      expect(result.content[0].text).toContain('org-post-1');
    });

    it('should pass custom pagination params', async () => {
      vi.mocked(client.get).mockResolvedValue(mockOrgPosts);

      const handler = extractToolHandler(server, 'get_org_posts');
      await handler({ organizationId: '12345', count: 5, start: 10 });

      expect(client.get).toHaveBeenCalledWith('/posts', {
        q: 'author',
        author: 'urn:li:organization:12345',
        count: '5',
        start: '10',
      });
    });

    it('should handle empty results', async () => {
      vi.mocked(client.get).mockResolvedValue({ elements: [], paging: { count: 10, start: 0, total: 0 } });

      const handler = extractToolHandler(server, 'get_org_posts');
      const result = (await handler({ organizationId: '99999' })) as { content: Array<{ text: string }> };

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.elements).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(client.get).mockRejectedValue(new LinkedInApiError(500, 'Internal server error'));

      const handler = extractToolHandler(server, 'get_org_posts');
      const result = (await handler({ organizationId: '12345' })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('500');
    });
  });

  // ─── delete_org_post ──────────────────────────────────────────────────
  describe('delete_org_post', () => {
    it('should delete a post by its URN', async () => {
      vi.mocked(client.delete).mockResolvedValue(undefined);

      const handler = extractToolHandler(server, 'delete_org_post');
      const result = (await handler({ postUrn: 'urn:li:share:123456' })) as { content: Array<{ text: string }> };

      const encodedUrn = encodeURIComponent('urn:li:share:123456');
      expect(client.delete).toHaveBeenCalledWith(`/posts/${encodedUrn}`);
      expect(result.content[0].text).toContain('deleted successfully');
    });

    it('should URL-encode the post URN correctly', async () => {
      vi.mocked(client.delete).mockResolvedValue(undefined);

      const handler = extractToolHandler(server, 'delete_org_post');
      await handler({ postUrn: 'urn:li:ugcPost:12345' });

      const callPath = vi.mocked(client.delete).mock.calls[0][0];
      expect(callPath).toContain(encodeURIComponent('urn:li:ugcPost:12345'));
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(client.delete).mockRejectedValue(new LinkedInApiError(404, 'Post not found'));

      const handler = extractToolHandler(server, 'delete_org_post');
      const result = (await handler({ postUrn: 'urn:li:share:nonexistent' })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Post not found');
    });

    it('should handle permission denied errors', async () => {
      vi.mocked(client.delete).mockRejectedValue(new LinkedInApiError(403, 'Insufficient permissions'));

      const handler = extractToolHandler(server, 'delete_org_post');
      const result = (await handler({ postUrn: 'urn:li:share:123456' })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('403');
    });
  });
});

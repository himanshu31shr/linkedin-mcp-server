import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerSocialActionTools } from '../../../src/tools/social-actions.js';
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

const mockComments = {
  elements: [
    { id: 'comment-1', actor: 'urn:li:person:abc', message: { text: 'Great post!' } },
    { id: 'comment-2', actor: 'urn:li:person:xyz', message: { text: 'Very insightful!' } },
  ],
  paging: { count: 10, start: 0, total: 2 },
};

const mockComment = {
  id: 'comment-new',
  actor: 'urn:li:person:test-person-id',
  message: { text: 'My new comment' },
};

const mockUserInfo = { sub: 'test-person-id' };

describe('social-actions tools', () => {
  let server: McpServer;
  let client: LinkedInClient;

  beforeEach(() => {
    vi.clearAllMocks();
    server = { registerTool: vi.fn() } as unknown as McpServer;
    client = new LinkedInClient('test-token');
    registerSocialActionTools(server, client);
  });

  it('should register all five social action tools', () => {
    expect(server.registerTool).toHaveBeenCalledTimes(5);
    const toolNames = vi.mocked(server.registerTool).mock.calls.map((call) => call[0]);
    expect(toolNames).toContain('get_post_comments');
    expect(toolNames).toContain('create_comment');
    expect(toolNames).toContain('delete_comment');
    expect(toolNames).toContain('add_reaction');
    expect(toolNames).toContain('remove_reaction');
  });

  // ─── get_post_comments ──────────────────────────────────────────────
  describe('get_post_comments', () => {
    it('should fetch comments with default pagination', async () => {
      vi.mocked(client.get).mockResolvedValue(mockComments);

      const handler = extractToolHandler(server, 'get_post_comments');
      const result = (await handler({ postUrn: 'urn:li:share:123456' })) as { content: Array<{ text: string }> };

      const encodedUrn = encodeURIComponent('urn:li:share:123456');
      expect(client.get).toHaveBeenCalledWith(
        `/socialActions/${encodedUrn}/comments`,
        { count: '10', start: '0' },
        false,
      );
      expect(result.content[0].text).toContain('Great post!');
    });

    it('should pass custom pagination params', async () => {
      vi.mocked(client.get).mockResolvedValue(mockComments);

      const handler = extractToolHandler(server, 'get_post_comments');
      await handler({ postUrn: 'urn:li:share:123456', count: 5, start: 20 });

      const encodedUrn = encodeURIComponent('urn:li:share:123456');
      expect(client.get).toHaveBeenCalledWith(
        `/socialActions/${encodedUrn}/comments`,
        { count: '5', start: '20' },
        false,
      );
    });

    it('should handle empty comments', async () => {
      vi.mocked(client.get).mockResolvedValue({ elements: [], paging: { count: 10, start: 0, total: 0 } });

      const handler = extractToolHandler(server, 'get_post_comments');
      const result = (await handler({ postUrn: 'urn:li:share:123456' })) as { content: Array<{ text: string }> };

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.elements).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(client.get).mockRejectedValue(new LinkedInApiError(403, 'Access denied'));

      const handler = extractToolHandler(server, 'get_post_comments');
      const result = (await handler({ postUrn: 'urn:li:share:123456' })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Access denied');
    });
  });

  // ─── create_comment ─────────────────────────────────────────────────
  describe('create_comment', () => {
    it('should create a comment with explicit authorUrn', async () => {
      vi.mocked(client.post).mockResolvedValue(mockComment);

      const handler = extractToolHandler(server, 'create_comment');
      const result = (await handler({
        postUrn: 'urn:li:share:123456',
        text: 'Nice post!',
        authorUrn: 'urn:li:person:custom-author',
      })) as { content: Array<{ text: string }> };

      const encodedUrn = encodeURIComponent('urn:li:share:123456');
      expect(client.post).toHaveBeenCalledWith(
        `/socialActions/${encodedUrn}/comments`,
        { actor: 'urn:li:person:custom-author', message: { text: 'Nice post!' } },
        false,
      );
      // Should NOT call get /userinfo since authorUrn was provided
      expect(client.get).not.toHaveBeenCalled();
      expect(result.content[0].text).toContain('comment');
    });

    it('should auto-resolve person URN from /v2/userinfo when authorUrn not provided', async () => {
      vi.mocked(client.get).mockResolvedValue(mockUserInfo);
      vi.mocked(client.post).mockResolvedValue(mockComment);

      const handler = extractToolHandler(server, 'create_comment');
      await handler({ postUrn: 'urn:li:share:123456', text: 'Auto-author comment' });

      expect(client.get).toHaveBeenCalledWith('/userinfo', undefined, false);
      expect(client.post).toHaveBeenCalledWith(
        expect.stringContaining('/comments'),
        expect.objectContaining({ actor: 'urn:li:person:test-person-id' }),
        false,
      );
    });

    it('should handle post creation returning undefined (201 no body)', async () => {
      vi.mocked(client.post).mockResolvedValue(undefined);

      const handler = extractToolHandler(server, 'create_comment');
      const result = (await handler({
        postUrn: 'urn:li:share:123456',
        text: 'Comment',
        authorUrn: 'urn:li:person:abc',
      })) as { content: Array<{ text: string }> };

      expect(result.content[0].text).toContain('success');
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(client.get).mockResolvedValue(mockUserInfo);
      vi.mocked(client.post).mockRejectedValue(new LinkedInApiError(400, 'Invalid comment'));

      const handler = extractToolHandler(server, 'create_comment');
      const result = (await handler({
        postUrn: 'urn:li:share:123456',
        text: '',
      })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid comment');
    });
  });

  // ─── delete_comment ─────────────────────────────────────────────────
  describe('delete_comment', () => {
    it('should delete a comment with activity URN format', async () => {
      vi.mocked(client.delete).mockResolvedValue(undefined);

      const handler = extractToolHandler(server, 'delete_comment');
      const commentUrn = 'urn:li:comment:(urn:li:activity:7000000000000000001,100)';
      const result = (await handler({ commentUrn })) as { content: Array<{ text: string }> };

      const encodedActivityUrn = encodeURIComponent('urn:li:activity:7000000000000000001');
      expect(client.delete).toHaveBeenCalledWith(
        `/socialActions/${encodedActivityUrn}/comments/100`,
        false,
      );
      expect(result.content[0].text).toContain('deleted successfully');
    });

    it('should delete a comment with ugcPost URN format', async () => {
      vi.mocked(client.delete).mockResolvedValue(undefined);

      const handler = extractToolHandler(server, 'delete_comment');
      const commentUrn = 'urn:li:comment:(urn:li:ugcPost:7000000000000000001,200)';
      await handler({ commentUrn });

      const encodedUrn = encodeURIComponent('urn:li:ugcPost:7000000000000000001');
      expect(client.delete).toHaveBeenCalledWith(
        `/socialActions/${encodedUrn}/comments/200`,
        false,
      );
    });

    it('should return error for invalid comment URN format', async () => {
      const handler = extractToolHandler(server, 'delete_comment');
      const result = (await handler({ commentUrn: 'invalid-urn' })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid comment URN format');
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(client.delete).mockRejectedValue(new LinkedInApiError(404, 'Comment not found'));

      const handler = extractToolHandler(server, 'delete_comment');
      const commentUrn = 'urn:li:comment:(urn:li:activity:7000000000000000001,100)';
      const result = (await handler({ commentUrn })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Comment not found');
    });
  });

  // ─── add_reaction ───────────────────────────────────────────────────
  describe('add_reaction', () => {
    it('should add a LIKE reaction', async () => {
      vi.mocked(client.get).mockResolvedValue(mockUserInfo);
      vi.mocked(client.post).mockResolvedValue(undefined);

      const handler = extractToolHandler(server, 'add_reaction');
      const result = (await handler({
        postUrn: 'urn:li:share:123456',
        reactionType: 'LIKE',
      })) as { content: Array<{ text: string }> };

      expect(client.get).toHaveBeenCalledWith('/userinfo', undefined, false);

      const encodedUrn = encodeURIComponent('urn:li:share:123456');
      expect(client.post).toHaveBeenCalledWith(
        `/socialActions/${encodedUrn}/likes`,
        {
          actor: 'urn:li:person:test-person-id',
          object: 'urn:li:share:123456',
          reactionType: 'LIKE',
        },
        false,
      );
      expect(result.content[0].text).toContain('LIKE');
      expect(result.content[0].text).toContain('success');
    });

    it('should add a CELEBRATE reaction', async () => {
      vi.mocked(client.get).mockResolvedValue(mockUserInfo);
      vi.mocked(client.post).mockResolvedValue(undefined);

      const handler = extractToolHandler(server, 'add_reaction');
      await handler({ postUrn: 'urn:li:share:123456', reactionType: 'CELEBRATE' });

      expect(client.post).toHaveBeenCalledWith(
        expect.stringContaining('/likes'),
        expect.objectContaining({ reactionType: 'CELEBRATE' }),
        false,
      );
    });

    it('should handle all reaction types', async () => {
      const reactionTypes = ['LIKE', 'CELEBRATE', 'SUPPORT', 'LOVE', 'INSIGHTFUL', 'CURIOUS'];

      for (const reactionType of reactionTypes) {
        vi.mocked(client.get).mockClear();
        vi.mocked(client.post).mockClear();
        vi.mocked(client.get).mockResolvedValue(mockUserInfo);
        vi.mocked(client.post).mockResolvedValue(undefined);

        const handler = extractToolHandler(server, 'add_reaction');
        const result = (await handler({ postUrn: 'urn:li:share:123456', reactionType })) as { content: Array<{ text: string }> };

        expect(client.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ reactionType }),
          false,
        );
        expect(result.content[0].text).toContain(reactionType);
      }
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(client.get).mockResolvedValue(mockUserInfo);
      vi.mocked(client.post).mockRejectedValue(new LinkedInApiError(409, 'Reaction already exists'));

      const handler = extractToolHandler(server, 'add_reaction');
      const result = (await handler({
        postUrn: 'urn:li:share:123456',
        reactionType: 'LIKE',
      })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Reaction already exists');
    });

    it('should handle userinfo fetch failure', async () => {
      vi.mocked(client.get).mockRejectedValue(new LinkedInApiError(401, 'Unauthorized'));

      const handler = extractToolHandler(server, 'add_reaction');
      const result = (await handler({
        postUrn: 'urn:li:share:123456',
        reactionType: 'LIKE',
      })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unauthorized');
    });
  });

  // ─── remove_reaction ────────────────────────────────────────────────
  describe('remove_reaction', () => {
    it('should remove a reaction from a post', async () => {
      vi.mocked(client.get).mockResolvedValue(mockUserInfo);
      vi.mocked(client.delete).mockResolvedValue(undefined);

      const handler = extractToolHandler(server, 'remove_reaction');
      const result = (await handler({
        postUrn: 'urn:li:share:123456',
        reactionType: 'LIKE',
      })) as { content: Array<{ text: string }> };

      expect(client.get).toHaveBeenCalledWith('/userinfo', undefined, false);

      const encodedPostUrn = encodeURIComponent('urn:li:share:123456');
      const encodedPersonUrn = encodeURIComponent('urn:li:person:test-person-id');
      expect(client.delete).toHaveBeenCalledWith(
        `/socialActions/${encodedPostUrn}/likes/${encodedPersonUrn}`,
        false,
      );
      expect(result.content[0].text).toContain('removed successfully');
    });

    it('should handle reaction not found errors', async () => {
      vi.mocked(client.get).mockResolvedValue(mockUserInfo);
      vi.mocked(client.delete).mockRejectedValue(new LinkedInApiError(404, 'Reaction not found'));

      const handler = extractToolHandler(server, 'remove_reaction');
      const result = (await handler({
        postUrn: 'urn:li:share:123456',
        reactionType: 'LIKE',
      })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Reaction not found');
    });

    it('should handle userinfo fetch failure', async () => {
      vi.mocked(client.get).mockRejectedValue(new LinkedInApiError(401, 'Token expired'));

      const handler = extractToolHandler(server, 'remove_reaction');
      const result = (await handler({
        postUrn: 'urn:li:share:123456',
        reactionType: 'CELEBRATE',
      })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Token expired');
    });
  });
});

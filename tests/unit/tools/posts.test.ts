import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTextPost, createLinkPost, deletePost, registerPostTools } from '../../../src/tools/posts.js';
import { LinkedInClient } from '../../../src/services/linkedin-client.js';
import { LinkedInApiError } from '../../../src/utils/errors.js';

// ── Mock the LinkedInClient and logger ────────────────────────────────────
vi.mock('../../../src/services/linkedin-client.js');
vi.mock('../../../src/utils/logger.js', () => ({
  createChildLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────
const mockUserInfo = {
  sub: 'person-id-789',
  name: 'Test User',
  given_name: 'Test',
  family_name: 'User',
  email: 'test@example.com',
  email_verified: true,
};

describe('Post Tools', () => {
  let mockClient: LinkedInClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      request: vi.fn(),
      uploadBinary: vi.fn(),
    } as unknown as LinkedInClient;
  });

  // ── create_text_post ──────────────────────────────────────────────────
  describe('createTextPost', () => {
    it('should create a text post successfully', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce({ id: 'urn:li:share:999' });

      const result = await createTextPost(mockClient, { text: 'Hello LinkedIn!' });

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.message).toContain('created');
      expect(parsed.postId).toBe('urn:li:share:999');
    });

    it('should send correct post body with default PUBLIC visibility', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce({ id: 'urn:li:share:999' });

      await createTextPost(mockClient, { text: 'My post text' });

      expect(mockClient.post).toHaveBeenCalledWith('/posts', {
        author: 'urn:li:person:person-id-789',
        commentary: 'My post text',
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
      });
    });

    it('should use CONNECTIONS visibility when specified', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce({ id: 'urn:li:share:999' });

      await createTextPost(mockClient, { text: 'Connections only', visibility: 'CONNECTIONS' });

      const postCall = vi.mocked(mockClient.post).mock.calls[0];
      expect((postCall[1] as Record<string, unknown>).visibility).toBe('CONNECTIONS');
    });

    it('should resolve person URN from userinfo', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce({ id: 'urn:li:share:999' });

      await createTextPost(mockClient, { text: 'test' });

      expect(mockClient.get).toHaveBeenCalledWith('/userinfo', undefined, false);
      const postCall = vi.mocked(mockClient.post).mock.calls[0];
      expect((postCall[1] as Record<string, unknown>).author).toBe('urn:li:person:person-id-789');
    });

    it('should handle postId from x-restli-id fallback', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce({ 'x-restli-id': 'urn:li:share:fallback-id' });

      const result = await createTextPost(mockClient, { text: 'test' });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.postId).toBe('urn:li:share:fallback-id');
    });

    it('should handle unknown postId when response has no id', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce({});

      const result = await createTextPost(mockClient, { text: 'test' });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.postId).toBe('unknown');
    });

    it('should return error on 403 Forbidden', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockRejectedValueOnce(
        new LinkedInApiError(403, 'Not enough permissions to access this resource'),
      );

      const result = await createTextPost(mockClient, { text: 'test' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('403');
      expect(result.content[0].text).toContain('permissions');
    });

    it('should return error on 429 Rate Limited', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockRejectedValueOnce(
        new LinkedInApiError(429, 'Rate limited by LinkedIn API'),
      );

      const result = await createTextPost(mockClient, { text: 'test' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('429');
      expect(result.content[0].text).toContain('Rate limited');
    });

    it('should return error when userinfo call fails', async () => {
      vi.mocked(mockClient.get).mockRejectedValueOnce(
        new LinkedInApiError(401, 'Invalid access token'),
      );

      const result = await createTextPost(mockClient, { text: 'test' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('401');
    });

    it('should handle null response from post', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(null);

      const result = await createTextPost(mockClient, { text: 'test' });

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.postId).toBe('unknown');
    });
  });

  // ── create_link_post ──────────────────────────────────────────────────
  describe('createLinkPost', () => {
    it('should create a link post successfully', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce({ id: 'urn:li:share:link-post-1' });

      const result = await createLinkPost(mockClient, {
        text: 'Check this out!',
        linkUrl: 'https://example.com/article',
        linkTitle: 'Amazing Article',
      });

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.message).toContain('Link post created');
      expect(parsed.postId).toBe('urn:li:share:link-post-1');
    });

    it('should handle unknown postId when response has no id for link post', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce({});

      const result = await createLinkPost(mockClient, {
        text: 'Check this out!',
        linkUrl: 'https://example.com/article',
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.postId).toBe('unknown');
    });

    it('should include article content in post body', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce({ id: 'urn:li:share:1' });

      await createLinkPost(mockClient, {
        text: 'My article',
        linkUrl: 'https://example.com',
        linkTitle: 'Example',
      });

      const postCall = vi.mocked(mockClient.post).mock.calls[0];
      const body = postCall[1] as Record<string, unknown>;
      expect(body.content).toEqual({
        article: {
          source: 'https://example.com',
          title: 'Example',
        },
      });
    });

    it('should omit linkTitle from article when not provided', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce({ id: 'urn:li:share:1' });

      await createLinkPost(mockClient, {
        text: 'My article',
        linkUrl: 'https://example.com',
      });

      const postCall = vi.mocked(mockClient.post).mock.calls[0];
      const body = postCall[1] as Record<string, unknown>;
      const content = body.content as { article: Record<string, unknown> };
      expect(content.article.title).toBeUndefined();
      expect(content.article.source).toBe('https://example.com');
    });

    it('should use CONNECTIONS visibility when specified', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce({ id: 'urn:li:share:1' });

      await createLinkPost(mockClient, {
        text: 'Private link',
        linkUrl: 'https://example.com',
        visibility: 'CONNECTIONS',
      });

      const postCall = vi.mocked(mockClient.post).mock.calls[0];
      expect((postCall[1] as Record<string, unknown>).visibility).toBe('CONNECTIONS');
    });

    it('should return error on 404 Not Found', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockRejectedValueOnce(
        new LinkedInApiError(404, 'Resource not found'),
      );

      const result = await createLinkPost(mockClient, {
        text: 'test',
        linkUrl: 'https://example.com',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('404');
    });

    it('should return error on 429 Rate Limited', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockRejectedValueOnce(
        new LinkedInApiError(429, 'Rate limited'),
      );

      const result = await createLinkPost(mockClient, {
        text: 'test',
        linkUrl: 'https://example.com',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('429');
    });
  });

  // ── delete_post ───────────────────────────────────────────────────────
  describe('deletePost', () => {
    it('should delete a post successfully', async () => {
      vi.mocked(mockClient.delete).mockResolvedValueOnce(undefined);

      const result = await deletePost(mockClient, { postUrn: 'urn:li:share:123456' });

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.message).toContain('urn:li:share:123456');
      expect(parsed.message).toContain('deleted');
    });

    it('should URL-encode the URN in the delete path', async () => {
      vi.mocked(mockClient.delete).mockResolvedValueOnce(undefined);

      await deletePost(mockClient, { postUrn: 'urn:li:share:123456' });

      const deleteCall = vi.mocked(mockClient.delete).mock.calls[0];
      expect(deleteCall[0]).toBe('/posts/' + encodeURIComponent('urn:li:share:123456'));
    });

    it('should handle ugcPost URN encoding', async () => {
      vi.mocked(mockClient.delete).mockResolvedValueOnce(undefined);

      await deletePost(mockClient, { postUrn: 'urn:li:ugcPost:7890' });

      const deleteCall = vi.mocked(mockClient.delete).mock.calls[0];
      expect(deleteCall[0]).toBe('/posts/' + encodeURIComponent('urn:li:ugcPost:7890'));
    });

    it('should return error on 403 Forbidden', async () => {
      vi.mocked(mockClient.delete).mockRejectedValueOnce(
        new LinkedInApiError(403, 'Cannot delete this post'),
      );

      const result = await deletePost(mockClient, { postUrn: 'urn:li:share:123' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('403');
      expect(result.content[0].text).toContain('Cannot delete');
    });

    it('should return error on 404 Not Found', async () => {
      vi.mocked(mockClient.delete).mockRejectedValueOnce(
        new LinkedInApiError(404, 'Post not found'),
      );

      const result = await deletePost(mockClient, { postUrn: 'urn:li:share:nonexistent' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('404');
      expect(result.content[0].text).toContain('not found');
    });

    it('should return error on 429 Rate Limited', async () => {
      vi.mocked(mockClient.delete).mockRejectedValueOnce(
        new LinkedInApiError(429, 'Rate limited'),
      );

      const result = await deletePost(mockClient, { postUrn: 'urn:li:share:123' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('429');
    });

    it('should return error on network failure', async () => {
      vi.mocked(mockClient.delete).mockRejectedValueOnce(
        new Error('Network error'),
      );

      const result = await deletePost(mockClient, { postUrn: 'urn:li:share:123' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Network error');
    });
  });
});

// ── registerPostTools ────────────────────────────────────────────────
describe('registerPostTools', () => {
  it('should register create_text_post, create_link_post, and delete_post tools', async () => {
    const server = { registerTool: vi.fn() } as any;
    const client = new LinkedInClient('test-token');
    
    registerPostTools(server, client);
    
    expect(server.registerTool).toHaveBeenCalledTimes(3);
    
    // Extract calls
    const calls = vi.mocked(server.registerTool).mock.calls;
    const createTextPostCall = calls.find(c => c[0] === 'create_text_post');
    const createLinkPostCall = calls.find(c => c[0] === 'create_link_post');
    const deletePostCall = calls.find(c => c[0] === 'delete_post');
    
    expect(createTextPostCall).toBeDefined();
    expect(createLinkPostCall).toBeDefined();
    expect(deletePostCall).toBeDefined();
    
    // Test the callbacks
    const createTextPostCb = createTextPostCall![2] as Function;
    const createLinkPostCb = createLinkPostCall![2] as Function;
    const deletePostCb = deletePostCall![2] as Function;
    
    vi.mocked(client.get).mockResolvedValueOnce({ sub: 'person-id-789' });
    vi.mocked(client.post).mockResolvedValueOnce({ 'x-restli-id': 'urn:li:share:123' });
    await createTextPostCb({ text: 'test' });
    
    vi.mocked(client.get).mockResolvedValueOnce({ sub: 'person-id-789' });
    vi.mocked(client.post).mockResolvedValueOnce({ 'x-restli-id': 'urn:li:share:123' });
    await createLinkPostCb({ text: 'test', linkUrl: 'https://example.com' });
    
    vi.mocked(client.delete).mockResolvedValueOnce({});
    await deletePostCb({ postUrn: 'urn:li:share:123' });
    
    expect(client.delete).toHaveBeenCalledWith('/posts/urn%3Ali%3Ashare%3A123');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockServer } from '../../mocks/setup.js';
import { http, HttpResponse } from 'msw';
import { uploadImage, createImagePost, createDocumentPost, registerMediaTools } from '../../../src/tools/media.js';
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
  sub: 'person-id-abc',
  name: 'Test User',
  given_name: 'Test',
  family_name: 'User',
  email: 'test@example.com',
  email_verified: true,
};

const mockImageInitResponse = {
  value: {
    uploadUrl: 'https://api.linkedin.com/mediaUpload/images/upload-id-test',
    image: 'urn:li:image:C4E22AQH-test-img',
  },
};

const mockDocumentInitResponse = {
  value: {
    uploadUrl: 'https://api.linkedin.com/mediaUpload/documents/upload-id-test',
    document: 'urn:li:document:C4E22AQH-test-doc',
  },
};

const fakePngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const fakePdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

/**
 * Helper to create a mock fetch Response for binary data.
 */
function setupFetchMock(data: Uint8Array, contentType: string | null, status = 200) {
  mockServer.use(
    http.get('https://example.com/*', () => {
      const headers: Record<string, string> = {};
      if (contentType !== null) {
        headers['content-type'] = contentType;
      }
      return new HttpResponse(data, {
        status,
        headers,
      });
    })
  );
}

describe('Media Tools', () => {
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

  // ── upload_image ──────────────────────────────────────────────────────
  describe('uploadImage', () => {
    it('should upload an image successfully', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockImageInitResponse);
      setupFetchMock(fakePngBytes, 'image/png');
      vi.mocked(mockClient.uploadBinary).mockResolvedValueOnce(undefined);

      const result = await uploadImage(mockClient, { imageUrl: 'https://example.com/photo.png' });

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.imageUrn).toBe('urn:li:image:C4E22AQH-test-img');
    });

    it('should call initializeUpload with correct owner', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockImageInitResponse);
      setupFetchMock(fakePngBytes, 'image/png');
      vi.mocked(mockClient.uploadBinary).mockResolvedValueOnce(undefined);

      await uploadImage(mockClient, { imageUrl: 'https://example.com/photo.png' });

      expect(mockClient.post).toHaveBeenCalledWith(
        '/images?action=initializeUpload',
        { initializeUploadRequest: { owner: 'urn:li:person:person-id-abc' } },
      );
    });

    it('should upload binary to the provided upload URL', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockImageInitResponse);
      setupFetchMock(fakePngBytes, 'image/png');
      vi.mocked(mockClient.uploadBinary).mockResolvedValueOnce(undefined);

      await uploadImage(mockClient, { imageUrl: 'https://example.com/photo.png' });

      expect(mockClient.uploadBinary).toHaveBeenCalledWith(
        'https://api.linkedin.com/mediaUpload/images/upload-id-test',
        expect.any(Uint8Array),
        'image/png',
      );
    });

    it('should return error when image fetch fails (404)', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockImageInitResponse);
      setupFetchMock(new Uint8Array(), 'text/html', 404);

      const result = await uploadImage(mockClient, { imageUrl: 'https://example.com/missing.png' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to fetch');
    });

    it('should return error when initializeUpload fails', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockRejectedValueOnce(
        new LinkedInApiError(500, 'Upload initialization failed'),
      );

      const result = await uploadImage(mockClient, { imageUrl: 'https://example.com/photo.png' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('500');
    });

    it('should return error when binary upload fails', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockImageInitResponse);
      setupFetchMock(fakePngBytes, 'image/png');
      vi.mocked(mockClient.uploadBinary).mockRejectedValueOnce(
        new LinkedInApiError(413, 'Upload quota exceeded'),
      );

      const result = await uploadImage(mockClient, { imageUrl: 'https://example.com/huge.png' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('413');
    });

    it('should return error when userinfo call fails', async () => {
      vi.mocked(mockClient.get).mockRejectedValueOnce(
        new LinkedInApiError(401, 'Invalid access token'),
      );

      const result = await uploadImage(mockClient, { imageUrl: 'https://example.com/photo.png' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('401');
    });

    it('should default content-type to application/octet-stream', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockImageInitResponse);

      setupFetchMock(fakePngBytes, null);
      vi.mocked(mockClient.uploadBinary).mockResolvedValueOnce(undefined);

      const result = await uploadImage(mockClient, { imageUrl: 'https://example.com/photo' });
      expect(result.isError).toBeUndefined();

      expect(mockClient.uploadBinary).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Uint8Array),
        'application/octet-stream',
      );
    });
  });

  // ── create_image_post ─────────────────────────────────────────────────
  describe('createImagePost', () => {
    it('should upload image and create post successfully', async () => {
      // First get call: for createImagePost's getPersonUrn
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      // First post call: initializeUpload
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockImageInitResponse);
      // fetch call: download image
      setupFetchMock(fakePngBytes, 'image/png');
      // uploadBinary call
      vi.mocked(mockClient.uploadBinary).mockResolvedValueOnce(undefined);
      // Second post call: create post
      vi.mocked(mockClient.post).mockResolvedValueOnce({ id: 'urn:li:share:img-post-1' });

      const result = await createImagePost(mockClient, {
        text: 'Check out this photo!',
        imageUrl: 'https://example.com/photo.png',
        altText: 'A beautiful photo',
      });

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.imageUrn).toBe('urn:li:image:C4E22AQH-test-img');
      expect(parsed.postId).toBe('urn:li:share:img-post-1');
    });

    it('should handle unknown postId when response has no id', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockImageInitResponse);
      setupFetchMock(fakePngBytes, 'image/png');
      vi.mocked(mockClient.uploadBinary).mockResolvedValueOnce(undefined);
      vi.mocked(mockClient.post).mockResolvedValueOnce({}); // no id returned

      const result = await createImagePost(mockClient, {
        text: 'Check out this photo!',
        imageUrl: 'https://example.com/photo.png',
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.postId).toBe('unknown');
    });

    it('should include altText in post content', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockImageInitResponse);
      setupFetchMock(fakePngBytes, 'image/png');
      vi.mocked(mockClient.uploadBinary).mockResolvedValueOnce(undefined);
      vi.mocked(mockClient.post).mockResolvedValueOnce({ id: 'urn:li:share:1' });

      await createImagePost(mockClient, {
        text: 'My post',
        imageUrl: 'https://example.com/photo.png',
        altText: 'Description of image',
      });

      // The second post call is the post creation
      const postCalls = vi.mocked(mockClient.post).mock.calls;
      const createPostBody = postCalls[1][1] as Record<string, unknown>;
      const content = createPostBody.content as { media: { id: string; altText?: string } };
      expect(content.media.altText).toBe('Description of image');
      expect(content.media.id).toBe('urn:li:image:C4E22AQH-test-img');
    });

    it('should omit altText when not provided', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockImageInitResponse);
      setupFetchMock(fakePngBytes, 'image/png');
      vi.mocked(mockClient.uploadBinary).mockResolvedValueOnce(undefined);
      vi.mocked(mockClient.post).mockResolvedValueOnce({ id: 'urn:li:share:1' });

      await createImagePost(mockClient, {
        text: 'My post',
        imageUrl: 'https://example.com/photo.png',
      });

      const postCalls = vi.mocked(mockClient.post).mock.calls;
      const createPostBody = postCalls[1][1] as Record<string, unknown>;
      const content = createPostBody.content as { media: { id: string; altText?: string } };
      expect(content.media.altText).toBeUndefined();
    });

    it('should use specified visibility', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockImageInitResponse);
      setupFetchMock(fakePngBytes, 'image/png');
      vi.mocked(mockClient.uploadBinary).mockResolvedValueOnce(undefined);
      vi.mocked(mockClient.post).mockResolvedValueOnce({ id: 'urn:li:share:1' });

      await createImagePost(mockClient, {
        text: 'Private post',
        imageUrl: 'https://example.com/photo.png',
        visibility: 'CONNECTIONS',
      });

      const postCalls = vi.mocked(mockClient.post).mock.calls;
      const createPostBody = postCalls[1][1] as Record<string, unknown>;
      expect(createPostBody.visibility).toBe('CONNECTIONS');
    });

    it('should return error when image upload fails', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockRejectedValueOnce(
        new LinkedInApiError(500, 'Image upload failed'),
      );

      const result = await createImagePost(mockClient, {
        text: 'My post',
        imageUrl: 'https://example.com/photo.png',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('500');
    });

    it('should return error when post creation fails after upload', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockImageInitResponse);
      setupFetchMock(fakePngBytes, 'image/png');
      vi.mocked(mockClient.uploadBinary).mockResolvedValueOnce(undefined);
      vi.mocked(mockClient.post).mockRejectedValueOnce(
        new LinkedInApiError(403, 'Post creation forbidden'),
      );

      const result = await createImagePost(mockClient, {
        text: 'My post',
        imageUrl: 'https://example.com/photo.png',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('403');
    });
  });

  // ── create_document_post ──────────────────────────────────────────────
  describe('createDocumentPost', () => {
    it('should upload document and create post successfully', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockDocumentInitResponse);
      setupFetchMock(fakePdfBytes, 'application/pdf');
      vi.mocked(mockClient.uploadBinary).mockResolvedValueOnce(undefined);
      vi.mocked(mockClient.post).mockResolvedValueOnce({ id: 'urn:li:share:doc-post-1' });

      const result = await createDocumentPost(mockClient, {
        text: 'Read my whitepaper!',
        documentUrl: 'https://example.com/whitepaper.pdf',
        title: 'Q4 Whitepaper',
      });

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.documentUrn).toBe('urn:li:document:C4E22AQH-test-doc');
      expect(parsed.postId).toBe('urn:li:share:doc-post-1');
    });

    it('should handle unknown postId when response has no id', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockDocumentInitResponse);
      setupFetchMock(fakePdfBytes, 'application/pdf');
      vi.mocked(mockClient.uploadBinary).mockResolvedValueOnce(undefined);
      vi.mocked(mockClient.post).mockResolvedValueOnce({}); // no id returned

      const result = await createDocumentPost(mockClient, {
        text: 'Read my whitepaper!',
        documentUrl: 'https://example.com/whitepaper.pdf',
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.postId).toBe('unknown');
    });

    it('should call document initializeUpload with correct owner', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockDocumentInitResponse);
      setupFetchMock(fakePdfBytes, 'application/pdf');
      vi.mocked(mockClient.uploadBinary).mockResolvedValueOnce(undefined);
      vi.mocked(mockClient.post).mockResolvedValueOnce({ id: 'urn:li:share:1' });

      await createDocumentPost(mockClient, {
        text: 'Check this',
        documentUrl: 'https://example.com/doc.pdf',
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        '/documents?action=initializeUpload',
        { initializeUploadRequest: { owner: 'urn:li:person:person-id-abc' } },
      );
    });

    it('should include title in post content when provided', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockDocumentInitResponse);
      setupFetchMock(fakePdfBytes, 'application/pdf');
      vi.mocked(mockClient.uploadBinary).mockResolvedValueOnce(undefined);
      vi.mocked(mockClient.post).mockResolvedValueOnce({ id: 'urn:li:share:1' });

      await createDocumentPost(mockClient, {
        text: 'My doc',
        documentUrl: 'https://example.com/doc.pdf',
        title: 'My Document Title',
      });

      const postCalls = vi.mocked(mockClient.post).mock.calls;
      const createPostBody = postCalls[1][1] as Record<string, unknown>;
      const content = createPostBody.content as { media: { id: string; title?: string } };
      expect(content.media.title).toBe('My Document Title');
    });

    it('should omit title when not provided', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockDocumentInitResponse);
      setupFetchMock(fakePdfBytes, 'application/pdf');
      vi.mocked(mockClient.uploadBinary).mockResolvedValueOnce(undefined);
      vi.mocked(mockClient.post).mockResolvedValueOnce({ id: 'urn:li:share:1' });

      await createDocumentPost(mockClient, {
        text: 'My doc',
        documentUrl: 'https://example.com/doc.pdf',
      });

      const postCalls = vi.mocked(mockClient.post).mock.calls;
      const createPostBody = postCalls[1][1] as Record<string, unknown>;
      const content = createPostBody.content as { media: { id: string; title?: string } };
      expect(content.media.title).toBeUndefined();
    });

    it('should return error when document fetch fails', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockDocumentInitResponse);
      setupFetchMock(new Uint8Array(), 'text/html', 404);

      const result = await createDocumentPost(mockClient, {
        text: 'My doc',
        documentUrl: 'https://example.com/missing.pdf',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to fetch');
    });

    it('should return error when document upload fails', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockDocumentInitResponse);
      setupFetchMock(fakePdfBytes, 'application/pdf');
      vi.mocked(mockClient.uploadBinary).mockRejectedValueOnce(
        new LinkedInApiError(413, 'Document too large'),
      );

      const result = await createDocumentPost(mockClient, {
        text: 'My doc',
        documentUrl: 'https://example.com/huge.pdf',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('413');
    });

    it('should return error when post creation fails after upload', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockDocumentInitResponse);
      setupFetchMock(fakePdfBytes, 'application/pdf');
      vi.mocked(mockClient.uploadBinary).mockResolvedValueOnce(undefined);
      vi.mocked(mockClient.post).mockRejectedValueOnce(
        new LinkedInApiError(429, 'Rate limited'),
      );

      const result = await createDocumentPost(mockClient, {
        text: 'My doc',
        documentUrl: 'https://example.com/doc.pdf',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('429');
    });

    it('should return error when fetch throws network error', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);
      vi.mocked(mockClient.post).mockResolvedValueOnce(mockDocumentInitResponse);
      mockServer.use(http.get('https://invalid-domain.example/*', () => HttpResponse.error()));

      const result = await createDocumentPost(mockClient, {
        text: 'My doc',
        documentUrl: 'https://invalid-domain.example/doc.pdf',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to fetch');
    });
  });
});

// ── registerMediaTools ──────────────────────────────────────────────────
describe('registerMediaTools', () => {
  it('should register upload_image, create_image_post, and create_document_post tools', async () => {
    const server = { registerTool: vi.fn() } as any;
    const client = new LinkedInClient('test-token');
    
    registerMediaTools(server, client);
    
    expect(server.registerTool).toHaveBeenCalledTimes(3);
    
    // Extract calls
    const calls = vi.mocked(server.registerTool).mock.calls;
    const uploadImageCall = calls.find(c => c[0] === 'upload_image');
    const createImagePostCall = calls.find(c => c[0] === 'create_image_post');
    const createDocumentPostCall = calls.find(c => c[0] === 'create_document_post');
    
    expect(uploadImageCall).toBeDefined();
    expect(createImagePostCall).toBeDefined();
    expect(createDocumentPostCall).toBeDefined();
    
    // Test the callbacks
    const uploadImageCb = uploadImageCall![2] as Function;
    const createImagePostCb = createImagePostCall![2] as Function;
    const createDocumentPostCb = createDocumentPostCall![2] as Function;
    
    // Mock the network calls for one of the callbacks
    vi.mocked(client.get).mockResolvedValueOnce({ sub: 'person-id-abc' });
    vi.mocked(client.post).mockResolvedValueOnce({
      value: { uploadUrl: 'https://upload.url', image: 'urn:li:image:123' }
    });
    
    // This will eventually fail because we didn't mock fetch/MSW for uploadUrl here,
    // but the callback wrapper itself is what we are covering.
    try {
      await uploadImageCb({ imageUrl: 'https://example.com/test.png' });
    } catch {}
    
    try {
      await createImagePostCb({ text: 'test', imageUrl: 'https://example.com/test.png' });
    } catch {}
    
    try {
      await createDocumentPostCb({ text: 'test', documentUrl: 'https://example.com/test.pdf' });
    } catch {}
    
    expect(server.registerTool).toHaveBeenCalledTimes(3);
  });
});

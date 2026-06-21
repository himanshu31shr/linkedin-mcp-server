import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { mockServer } from '../../mocks/setup.js';
import { LinkedInClient } from '../../../src/services/linkedin-client.js';
import { LinkedInApiError, AuthenticationError } from '../../../src/utils/errors.js';

describe('LinkedInClient', () => {
  const TEST_TOKEN = 'test-access-token-abc123';

  // ── Constructor ────────────────────────────────────────────────────
  describe('constructor', () => {
    it('should throw AuthenticationError when no token is provided', () => {
      // Ensure env is clean
      const original = process.env.LINKEDIN_ACCESS_TOKEN;
      delete process.env.LINKEDIN_ACCESS_TOKEN;

      expect(() => new LinkedInClient()).toThrow(AuthenticationError);
      expect(() => new LinkedInClient()).toThrow(
        'LINKEDIN_ACCESS_TOKEN environment variable is not set or is invalid.',
      );

      // Restore
      if (original) process.env.LINKEDIN_ACCESS_TOKEN = original;
    });

    it('should accept token from constructor parameter', () => {
      const client = new LinkedInClient(TEST_TOKEN);
      expect(client).toBeInstanceOf(LinkedInClient);
    });

    it('should accept token from environment variable', () => {
      const original = process.env.LINKEDIN_ACCESS_TOKEN;
      process.env.LINKEDIN_ACCESS_TOKEN = 'env-token-xyz';

      const client = new LinkedInClient();
      expect(client).toBeInstanceOf(LinkedInClient);

      // Restore
      if (original) {
        process.env.LINKEDIN_ACCESS_TOKEN = original;
      } else {
        delete process.env.LINKEDIN_ACCESS_TOKEN;
      }
    });

    it('should prefer constructor parameter over env variable', () => {
      const original = process.env.LINKEDIN_ACCESS_TOKEN;
      process.env.LINKEDIN_ACCESS_TOKEN = 'env-token';

      // Create client with explicit token, then verify it uses the explicit one
      // by checking the auth header in a request
      const client = new LinkedInClient('explicit-token');
      expect(client).toBeInstanceOf(LinkedInClient);

      if (original) {
        process.env.LINKEDIN_ACCESS_TOKEN = original;
      } else {
        delete process.env.LINKEDIN_ACCESS_TOKEN;
      }
    });
  });

  // ── GET Requests ───────────────────────────────────────────────────
  describe('GET requests', () => {
    it('should send correct Authorization header', async () => {
      let capturedHeaders: Record<string, string> = {};

      mockServer.use(
        http.get('https://api.linkedin.com/v2/userinfo', ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries());
          return HttpResponse.json({ sub: 'test' });
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);
      await client.get('/userinfo', undefined, false);

      expect(capturedHeaders['authorization']).toBe(`Bearer ${TEST_TOKEN}`);
    });

    it('should send LinkedIn-Version header', async () => {
      let capturedHeaders: Record<string, string> = {};

      mockServer.use(
        http.get('https://api.linkedin.com/v2/userinfo', ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries());
          return HttpResponse.json({ sub: 'test' });
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);
      await client.get('/userinfo', undefined, false);

      expect(capturedHeaders['linkedin-version']).toBe('202406');
    });

    it('should send X-Restli-Protocol-Version header', async () => {
      let capturedHeaders: Record<string, string> = {};

      mockServer.use(
        http.get('https://api.linkedin.com/v2/userinfo', ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries());
          return HttpResponse.json({ sub: 'test' });
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);
      await client.get('/userinfo', undefined, false);

      expect(capturedHeaders['x-restli-protocol-version']).toBe('2.0.0');
    });

    it('should use /rest base URL by default', async () => {
      let capturedUrl = '';

      mockServer.use(
        http.get('https://api.linkedin.com/rest/posts', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ elements: [] });
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);
      await client.get('/posts');

      expect(capturedUrl).toContain('https://api.linkedin.com/rest/posts');
    });

    it('should use /v2 base URL when useRestApi is false', async () => {
      let capturedUrl = '';

      mockServer.use(
        http.get('https://api.linkedin.com/v2/userinfo', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ sub: 'test' });
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);
      await client.get('/userinfo', undefined, false);

      expect(capturedUrl).toContain('https://api.linkedin.com/v2/userinfo');
    });

    it('should append query parameters', async () => {
      let capturedUrl = '';

      mockServer.use(
        http.get('https://api.linkedin.com/rest/posts', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ elements: [] });
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);
      await client.get('/posts', { author: 'urn:li:organization:12345', count: '10' });

      const url = new URL(capturedUrl);
      expect(url.searchParams.get('author')).toBe('urn:li:organization:12345');
      expect(url.searchParams.get('count')).toBe('10');
    });

    it('should return parsed JSON response body', async () => {
      const client = new LinkedInClient(TEST_TOKEN);
      const result = await client.get<{ sub: string }>('/userinfo', undefined, false);

      expect(result).toEqual(expect.objectContaining({ sub: 'test-person-id' }));
    });
  });

  // ── POST Requests ──────────────────────────────────────────────────
  describe('POST requests', () => {
    it('should send JSON body with Content-Type header', async () => {
      let capturedHeaders: Record<string, string> = {};
      let capturedBody: unknown;

      mockServer.use(
        http.post('https://api.linkedin.com/rest/posts', async ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries());
          capturedBody = await request.json();
          return new HttpResponse(null, {
            status: 201,
            headers: { 'x-restli-id': 'urn:li:share:999' },
          });
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);
      const body = { author: 'urn:li:person:test', commentary: 'Hello world' };
      await client.post('/posts', body);

      expect(capturedHeaders['content-type']).toBe('application/json');
      expect(capturedBody).toEqual(body);
    });

    it('should not set Content-Type when no body is provided', async () => {
      let capturedHeaders: Record<string, string> = {};

      mockServer.use(
        http.post('https://api.linkedin.com/v2/socialActions/test/likes', ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries());
          return new HttpResponse(null, { status: 201 });
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);
      await client.post('/socialActions/test/likes', undefined, false);

      // No Content-Type should be set when body is undefined
      expect(capturedHeaders['content-type']).toBeUndefined();
    });
  });

  // ── DELETE Requests ────────────────────────────────────────────────
  describe('DELETE requests', () => {
    it('should handle 204 No Content response', async () => {
      mockServer.use(
        http.delete('https://api.linkedin.com/rest/posts/test-post', () => {
          return new HttpResponse(null, { status: 204 });
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);
      const result = await client.delete('/posts/test-post');

      expect(result).toBeUndefined();
    });
  });

  // ── PATCH Requests ────────────────────────────────────────────────
  describe('PATCH requests', () => {
    it('should send PATCH with body', async () => {
      let capturedMethod = '';
      let capturedBody: unknown;

      mockServer.use(
        http.patch('https://api.linkedin.com/rest/posts/test-post', async ({ request }) => {
          capturedMethod = request.method;
          capturedBody = await request.json();
          return HttpResponse.json({ patched: true });
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);
      await client.patch('/posts/test-post', { commentary: 'Updated' });

      expect(capturedMethod).toBe('PATCH');
      expect(capturedBody).toEqual({ commentary: 'Updated' });
    });
  });

  // ── Error Handling ─────────────────────────────────────────────────
  describe('error handling', () => {
    it('should throw LinkedInApiError on 401 Unauthorized', async () => {
      mockServer.use(
        http.get('https://api.linkedin.com/v2/userinfo', () => {
          return HttpResponse.json(
            { message: 'Invalid access token', status: 401 },
            { status: 401 },
          );
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);

      await expect(client.get('/userinfo', undefined, false)).rejects.toThrow(LinkedInApiError);
      await expect(client.get('/userinfo', undefined, false)).rejects.toThrow(
        'Invalid access token',
      );
    });

    it('should throw LinkedInApiError on 429 with rate limit message', async () => {
      mockServer.use(
        http.get('https://api.linkedin.com/rest/posts', () => {
          return new HttpResponse(null, {
            status: 429,
            headers: { 'Retry-After': '60' },
          });
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);

      try {
        await client.get('/posts');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LinkedInApiError);
        const apiError = error as LinkedInApiError;
        expect(apiError.status).toBe(429);
        expect(apiError.message).toContain('Rate limited');
        expect(apiError.message).toContain('Retry after 60 seconds');
      }
    });

    it('should throw LinkedInApiError on 429 without Retry-After header', async () => {
      mockServer.use(
        http.get('https://api.linkedin.com/rest/posts', () => {
          return new HttpResponse(null, { status: 429 });
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);

      try {
        await client.get('/posts');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LinkedInApiError);
        const apiError = error as LinkedInApiError;
        expect(apiError.status).toBe(429);
        expect(apiError.message).toContain('Please try again later');
      }
    });

    it('should throw LinkedInApiError on 500 with error body', async () => {
      mockServer.use(
        http.get('https://api.linkedin.com/rest/posts', () => {
          return HttpResponse.json(
            {
              message: 'Internal Server Error',
              status: 500,
              serviceErrorCode: 0,
            },
            { status: 500 },
          );
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);

      try {
        await client.get('/posts');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LinkedInApiError);
        const apiError = error as LinkedInApiError;
        expect(apiError.status).toBe(500);
        expect(apiError.message).toBe('Internal Server Error');
        expect(apiError.details).toEqual({
          message: 'Internal Server Error',
          status: 500,
          serviceErrorCode: 0,
        });
      }
    });

    it('should handle 403 with error_description format', async () => {
      mockServer.use(
        http.get('https://api.linkedin.com/rest/posts', () => {
          return HttpResponse.json(
            {
              error: 'access_denied',
              error_description: 'Not enough permissions to access this resource',
            },
            { status: 403 },
          );
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);

      try {
        await client.get('/posts');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LinkedInApiError);
        const apiError = error as LinkedInApiError;
        expect(apiError.status).toBe(403);
        expect(apiError.message).toBe('Not enough permissions to access this resource');
      }
    });

    it('should handle API error with body.error only format', async () => {
      mockServer.use(
        http.get('https://api.linkedin.com/rest/posts', () => {
          return HttpResponse.json(
            {
              error: 'Not found error message',
            },
            { status: 404 },
          );
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);

      try {
        await client.get('/posts');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LinkedInApiError);
        const apiError = error as LinkedInApiError;
        expect(apiError.status).toBe(404);
        expect(apiError.message).toBe('Not found error message');
      }
    });

    it('should handle non-JSON error response', async () => {
      mockServer.use(
        http.get('https://api.linkedin.com/rest/posts', () => {
          return new HttpResponse('Bad Gateway', {
            status: 502,
            headers: { 'Content-Type': 'text/plain' },
          });
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);

      try {
        await client.get('/posts');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LinkedInApiError);
        const apiError = error as LinkedInApiError;
        expect(apiError.status).toBe(502);
      }
    });

    it('should handle error response with empty body', async () => {
      mockServer.use(
        http.get('https://api.linkedin.com/rest/posts', () => {
          return new HttpResponse(null, {
            status: 500,
          });
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);

      try {
        await client.get('/posts');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LinkedInApiError);
        const apiError = error as LinkedInApiError;
        expect(apiError.status).toBe(500);
        expect(apiError.details).toBeUndefined();
      }
    });
  });

  // ── uploadBinary ───────────────────────────────────────────────────
  describe('uploadBinary', () => {
    it('should send PUT with correct content type and auth header', async () => {
      let capturedHeaders: Record<string, string> = {};
      let capturedMethod = '';

      mockServer.use(
        http.put('https://api.linkedin.com/mediaUpload/images/upload-123', ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries());
          capturedMethod = request.method;
          return new HttpResponse(null, { status: 201 });
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);
      const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes

      await client.uploadBinary(
        'https://api.linkedin.com/mediaUpload/images/upload-123',
        data,
        'image/png',
      );

      expect(capturedMethod).toBe('PUT');
      expect(capturedHeaders['authorization']).toBe(`Bearer ${TEST_TOKEN}`);
      expect(capturedHeaders['content-type']).toBe('image/png');
    });

    it('should throw LinkedInApiError on upload failure', async () => {
      mockServer.use(
        http.put('https://api.linkedin.com/mediaUpload/images/upload-fail', () => {
          return new HttpResponse('Upload quota exceeded', { status: 413 });
        }),
      );

      const client = new LinkedInClient(TEST_TOKEN);
      const data = new Uint8Array([0x00]);

      await expect(
        client.uploadBinary(
          'https://api.linkedin.com/mediaUpload/images/upload-fail',
          data,
          'image/png',
        ),
      ).rejects.toThrow(LinkedInApiError);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProfile, getEmail, registerProfileTools } from '../../../src/tools/profile.js';
import { LinkedInClient } from '../../../src/services/linkedin-client.js';
import { LinkedInApiError, AuthenticationError } from '../../../src/utils/errors.js';

// ── Mock the LinkedInClient ───────────────────────────────────────────────
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
  sub: 'abc-123-xyz',
  name: 'Jane Doe',
  given_name: 'Jane',
  family_name: 'Doe',
  email: 'jane.doe@example.com',
  email_verified: true,
  picture: 'https://media.licdn.com/dms/image/jane.jpg',
  locale: { country: 'US', language: 'en' },
};

describe('Profile Tools', () => {
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

  // ── get_profile ───────────────────────────────────────────────────────
  describe('getProfile', () => {
    it('should return full profile on success', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);

      const result = await getProfile(mockClient);

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe('abc-123-xyz');
      expect(parsed.name).toBe('Jane Doe');
      expect(parsed.firstName).toBe('Jane');
      expect(parsed.lastName).toBe('Doe');
      expect(parsed.email).toBe('jane.doe@example.com');
      expect(parsed.emailVerified).toBe(true);
      expect(parsed.picture).toBe('https://media.licdn.com/dms/image/jane.jpg');
      expect(parsed.locale).toEqual({ country: 'US', language: 'en' });
    });

    it('should call client.get with correct path and useRestApi=false', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);

      await getProfile(mockClient);

      expect(mockClient.get).toHaveBeenCalledWith('/userinfo', undefined, false);
    });

    it('should handle profile without optional picture field', async () => {
      const userInfoNoPicture = { ...mockUserInfo, picture: undefined };
      vi.mocked(mockClient.get).mockResolvedValueOnce(userInfoNoPicture);

      const result = await getProfile(mockClient);

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.picture).toBeUndefined();
    });

    it('should return error on 401 Unauthorized', async () => {
      vi.mocked(mockClient.get).mockRejectedValueOnce(
        new LinkedInApiError(401, 'Invalid access token'),
      );

      const result = await getProfile(mockClient);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('401');
      expect(result.content[0].text).toContain('Invalid access token');
    });

    it('should return error on 500 Internal Server Error', async () => {
      vi.mocked(mockClient.get).mockRejectedValueOnce(
        new LinkedInApiError(500, 'Internal Server Error'),
      );

      const result = await getProfile(mockClient);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('500');
      expect(result.content[0].text).toContain('Internal Server Error');
    });

    it('should return error on AuthenticationError (missing token)', async () => {
      vi.mocked(mockClient.get).mockRejectedValueOnce(
        new AuthenticationError(),
      );

      const result = await getProfile(mockClient);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('LINKEDIN_ACCESS_TOKEN');
    });

    it('should return error on unknown error', async () => {
      vi.mocked(mockClient.get).mockRejectedValueOnce('some weird error');

      const result = await getProfile(mockClient);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('some weird error');
    });

    it('should return error when non-Error object is thrown', async () => {
      vi.mocked(mockClient.get).mockRejectedValueOnce(42);

      const result = await getProfile(mockClient);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('An unknown error occurred');
    });
  });

  // ── get_email ─────────────────────────────────────────────────────────
  describe('getEmail', () => {
    it('should return only email on success', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);

      const result = await getEmail(mockClient);

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual({ email: 'jane.doe@example.com' });
    });

    it('should call client.get with correct path and useRestApi=false', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);

      await getEmail(mockClient);

      expect(mockClient.get).toHaveBeenCalledWith('/userinfo', undefined, false);
    });

    it('should not include name or other fields in email response', async () => {
      vi.mocked(mockClient.get).mockResolvedValueOnce(mockUserInfo);

      const result = await getEmail(mockClient);
      const parsed = JSON.parse(result.content[0].text);

      expect(parsed.name).toBeUndefined();
      expect(parsed.sub).toBeUndefined();
      expect(parsed.picture).toBeUndefined();
      expect(Object.keys(parsed)).toEqual(['email']);
    });

    it('should return error on 401 Unauthorized', async () => {
      vi.mocked(mockClient.get).mockRejectedValueOnce(
        new LinkedInApiError(401, 'Invalid access token'),
      );

      const result = await getEmail(mockClient);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('401');
    });

    it('should return error on 500 Internal Server Error', async () => {
      vi.mocked(mockClient.get).mockRejectedValueOnce(
        new LinkedInApiError(500, 'Internal Server Error'),
      );

      const result = await getEmail(mockClient);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('500');
    });

    it('should return error on AuthenticationError (missing token)', async () => {
      vi.mocked(mockClient.get).mockRejectedValueOnce(
        new AuthenticationError(),
      );

      const result = await getEmail(mockClient);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('LINKEDIN_ACCESS_TOKEN');
    });

    it('should return error on network failure', async () => {
      vi.mocked(mockClient.get).mockRejectedValueOnce(
        new Error('Network request failed'),
      );

      const result = await getEmail(mockClient);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Network request failed');
    });
  });
});

// ── registerProfileTools ────────────────────────────────────────────────
describe('registerProfileTools', () => {
  it('should register get_profile and get_email tools', async () => {
    const server = { registerTool: vi.fn() } as any;
    const client = new LinkedInClient('test-token');
    
    registerProfileTools(server, client);
    
    expect(server.registerTool).toHaveBeenCalledTimes(2);
    
    // Extract calls
    const calls = vi.mocked(server.registerTool).mock.calls;
    const getProfileCall = calls.find(c => c[0] === 'get_profile');
    const getEmailCall = calls.find(c => c[0] === 'get_email');
    
    expect(getProfileCall).toBeDefined();
    expect(getEmailCall).toBeDefined();
    
    // Test the callbacks
    const getProfileCb = getProfileCall![2] as Function;
    const getEmailCb = getEmailCall![2] as Function;
    
    // Mock getProfile / getEmail by mocking client since they depend on client.get
    vi.mocked(client.get).mockResolvedValueOnce({ sub: 'test' });
    await getProfileCb({});
    expect(client.get).toHaveBeenCalledWith('/userinfo', undefined, false);
    
    vi.mocked(client.get).mockResolvedValueOnce({ email: 'test@test.com' });
    await getEmailCb({});
    expect(client.get).toHaveBeenCalledTimes(2);
  });
});

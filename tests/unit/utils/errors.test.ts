import { describe, it, expect } from 'vitest';
import {
  formatToolError,
  formatToolResult,
  extractErrorMessage,
  LinkedInApiError,
  AuthenticationError,
} from '../../../src/utils/errors.js';

describe('errors', () => {
  // ── LinkedInApiError ─────────────────────────────────────────────────
  describe('LinkedInApiError', () => {
    it('should set name, status, message, and details', () => {
      const details = { serviceErrorCode: 100, code: 'INVALID_PARAM' };
      const error = new LinkedInApiError(400, 'Bad request', details);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LinkedInApiError);
      expect(error.name).toBe('LinkedInApiError');
      expect(error.status).toBe(400);
      expect(error.message).toBe('Bad request');
      expect(error.details).toEqual(details);
    });

    it('should work without details', () => {
      const error = new LinkedInApiError(500, 'Internal server error');

      expect(error.status).toBe(500);
      expect(error.message).toBe('Internal server error');
      expect(error.details).toBeUndefined();
    });

    it('should have a proper stack trace', () => {
      const error = new LinkedInApiError(404, 'Not found');
      expect(error.stack).toBeDefined();
    });
  });

  // ── AuthenticationError ──────────────────────────────────────────────
  describe('AuthenticationError', () => {
    it('should use default message when none provided', () => {
      const error = new AuthenticationError();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.name).toBe('AuthenticationError');
      expect(error.message).toBe(
        'LINKEDIN_ACCESS_TOKEN environment variable is not set or is invalid.',
      );
    });

    it('should accept a custom message', () => {
      const error = new AuthenticationError('Token expired');

      expect(error.name).toBe('AuthenticationError');
      expect(error.message).toBe('Token expired');
    });
  });

  // ── extractErrorMessage ──────────────────────────────────────────────
  describe('extractErrorMessage', () => {
    it('should extract message from LinkedInApiError with details', () => {
      const error = new LinkedInApiError(400, 'Bad request', { code: 'INVALID' });
      const message = extractErrorMessage(error);

      expect(message).toBe('LinkedIn API Error (400): Bad request\nDetails: {"code":"INVALID"}');
    });

    it('should extract message from LinkedInApiError without details', () => {
      const error = new LinkedInApiError(500, 'Server error');
      const message = extractErrorMessage(error);

      expect(message).toBe('LinkedIn API Error (500): Server error');
    });

    it('should extract message from a plain Error', () => {
      const error = new Error('Something went wrong');
      const message = extractErrorMessage(error);

      expect(message).toBe('Something went wrong');
    });

    it('should use string directly', () => {
      const message = extractErrorMessage('plain string error');

      expect(message).toBe('plain string error');
    });

    it('should return generic message for unknown types', () => {
      expect(extractErrorMessage(42)).toBe('An unknown error occurred');
      expect(extractErrorMessage(null)).toBe('An unknown error occurred');
      expect(extractErrorMessage(undefined)).toBe('An unknown error occurred');
      expect(extractErrorMessage({ foo: 'bar' })).toBe('An unknown error occurred');
    });

    it('should prioritize LinkedInApiError over plain Error', () => {
      // LinkedInApiError extends Error, so it should match the first branch
      const error = new LinkedInApiError(403, 'Forbidden');
      const message = extractErrorMessage(error);

      expect(message).toContain('LinkedIn API Error');
      expect(message).toContain('403');
    });
  });

  // ── formatToolError ──────────────────────────────────────────────────
  describe('formatToolError', () => {
    it('should format an Error into MCP tool error result', () => {
      const error = new Error('test failure');
      const result = formatToolError(error);

      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe('test failure');
    });

    it('should format a string into MCP tool error result', () => {
      const result = formatToolError('string error');

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('string error');
    });

    it('should format LinkedInApiError with full context', () => {
      const error = new LinkedInApiError(429, 'Rate limited', { retryAfter: 60 });
      const result = formatToolError(error);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('LinkedIn API Error (429)');
      expect(result.content[0].text).toContain('Rate limited');
      expect(result.content[0].text).toContain('retryAfter');
    });

    it('should format unknown error types gracefully', () => {
      const result = formatToolError(12345);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('An unknown error occurred');
    });
  });

  // ── formatToolResult ─────────────────────────────────────────────────
  describe('formatToolResult', () => {
    it('should format a string as-is', () => {
      const result = formatToolResult('Profile loaded successfully');

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe('Profile loaded successfully');
      expect(result).not.toHaveProperty('isError');
    });

    it('should JSON-serialize objects with indentation', () => {
      const data = { name: 'Test User', id: '12345' };
      const result = formatToolResult(data);

      expect(result.content[0].text).toBe(JSON.stringify(data, null, 2));
    });

    it('should JSON-serialize arrays', () => {
      const data = [1, 2, 3];
      const result = formatToolResult(data);

      expect(result.content[0].text).toBe(JSON.stringify(data, null, 2));
    });

    it('should handle null and undefined', () => {
      const nullResult = formatToolResult(null);
      expect(nullResult.content[0].text).toBe('null');

      const undefinedResult = formatToolResult(undefined);
      // undefined serializes to undefined via JSON.stringify → but typeof is not 'string'
      // so it goes to JSON.stringify(undefined) which returns undefined
      // The function does: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
      // JSON.stringify(undefined) returns undefined, so text would be undefined
      // This is an edge case worth documenting
      expect(undefinedResult.content[0].text).toBeUndefined();
    });

    it('should handle nested objects', () => {
      const data = {
        profile: {
          name: 'Test',
          connections: [{ id: 1 }, { id: 2 }],
        },
      };
      const result = formatToolResult(data);
      const parsed = JSON.parse(result.content[0].text);

      expect(parsed).toEqual(data);
    });
  });
});

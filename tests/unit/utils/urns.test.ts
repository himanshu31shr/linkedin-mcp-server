import { describe, it, expect } from 'vitest';
import {
  buildUrn,
  parseUrn,
  isValidUrn,
  isUrnOfType,
  extractEntityId,
} from '../../../src/utils/urns.js';
import type { LinkedInEntityType } from '../../../src/utils/urns.js';

describe('urns', () => {
  // ── buildUrn ─────────────────────────────────────────────────────────
  describe('buildUrn', () => {
    const cases: Array<[LinkedInEntityType, string, string]> = [
      ['person', 'ABC123', 'urn:li:person:ABC123'],
      ['organization', '12345', 'urn:li:organization:12345'],
      ['share', '67890', 'urn:li:share:67890'],
      ['ugcPost', '99999', 'urn:li:ugcPost:99999'],
      ['image', 'C4E22AQH-abcd', 'urn:li:image:C4E22AQH-abcd'],
      ['video', 'V4D00AQXYZ', 'urn:li:video:V4D00AQXYZ'],
      ['document', 'D4E10AQ-test', 'urn:li:document:D4E10AQ-test'],
      ['comment', '(urn:li:activity:123,456)', 'urn:li:comment:(urn:li:activity:123,456)'],
      ['activity', '7000000000000000001', 'urn:li:activity:7000000000000000001'],
    ];

    it.each(cases)(
      'should build URN for %s:%s → %s',
      (entityType, entityId, expected) => {
        expect(buildUrn(entityType, entityId)).toBe(expected);
      },
    );
  });

  // ── parseUrn ─────────────────────────────────────────────────────────
  describe('parseUrn', () => {
    it('should parse a valid person URN', () => {
      const result = parseUrn('urn:li:person:ABC123');

      expect(result).toEqual({ entityType: 'person', entityId: 'ABC123' });
    });

    it('should parse a valid organization URN', () => {
      const result = parseUrn('urn:li:organization:12345');

      expect(result).toEqual({ entityType: 'organization', entityId: '12345' });
    });

    it('should parse URN with complex entity ID', () => {
      const result = parseUrn('urn:li:comment:(urn:li:activity:123,456)');

      expect(result).toEqual({
        entityType: 'comment',
        entityId: '(urn:li:activity:123,456)',
      });
    });

    it('should parse URN with hyphens in entity ID', () => {
      const result = parseUrn('urn:li:image:C4E22AQH-xyz-123');

      expect(result).toEqual({ entityType: 'image', entityId: 'C4E22AQH-xyz-123' });
    });

    it('should throw on empty string', () => {
      expect(() => parseUrn('')).toThrow('Invalid LinkedIn URN format');
    });

    it('should throw on malformed URN (missing prefix)', () => {
      expect(() => parseUrn('li:person:ABC123')).toThrow('Invalid LinkedIn URN format');
    });

    it('should throw on malformed URN (wrong namespace)', () => {
      expect(() => parseUrn('urn:xx:person:ABC123')).toThrow('Invalid LinkedIn URN format');
    });

    it('should throw on URN without entity ID', () => {
      expect(() => parseUrn('urn:li:person:')).toThrow('Invalid LinkedIn URN format');
    });

    it('should throw on URN without entity type', () => {
      expect(() => parseUrn('urn:li::ABC123')).toThrow('Invalid LinkedIn URN format');
    });

    it('should throw on random string', () => {
      expect(() => parseUrn('not-a-urn-at-all')).toThrow('Invalid LinkedIn URN format');
    });

    it('should include the invalid URN in the error message', () => {
      expect(() => parseUrn('bad')).toThrow('"bad"');
    });
  });

  // ── isValidUrn ───────────────────────────────────────────────────────
  describe('isValidUrn', () => {
    it('should return true for valid URNs', () => {
      expect(isValidUrn('urn:li:person:ABC123')).toBe(true);
      expect(isValidUrn('urn:li:organization:12345')).toBe(true);
      expect(isValidUrn('urn:li:share:67890')).toBe(true);
      expect(isValidUrn('urn:li:comment:(urn:li:activity:123,456)')).toBe(true);
      expect(isValidUrn('urn:li:image:C4E22AQH-test')).toBe(true);
    });

    it('should return false for invalid URNs', () => {
      expect(isValidUrn('')).toBe(false);
      expect(isValidUrn('not-a-urn')).toBe(false);
      expect(isValidUrn('urn:xx:person:ABC123')).toBe(false);
      expect(isValidUrn('urn:li:')).toBe(false);
      expect(isValidUrn('urn:li:person:')).toBe(false);
    });

    it('should return false for URN without entity type', () => {
      expect(isValidUrn('urn:li::ABC123')).toBe(false);
    });
  });

  // ── isUrnOfType ──────────────────────────────────────────────────────
  describe('isUrnOfType', () => {
    it('should return true when URN matches the entity type', () => {
      expect(isUrnOfType('urn:li:person:ABC123', 'person')).toBe(true);
      expect(isUrnOfType('urn:li:organization:12345', 'organization')).toBe(true);
      expect(isUrnOfType('urn:li:share:67890', 'share')).toBe(true);
    });

    it('should return false when URN does not match the entity type', () => {
      expect(isUrnOfType('urn:li:person:ABC123', 'organization')).toBe(false);
      expect(isUrnOfType('urn:li:share:67890', 'person')).toBe(false);
    });

    it('should return false for invalid URNs', () => {
      expect(isUrnOfType('not-a-urn', 'person')).toBe(false);
      expect(isUrnOfType('', 'person')).toBe(false);
    });
  });

  // ── extractEntityId ──────────────────────────────────────────────────
  describe('extractEntityId', () => {
    it('should extract entity ID from a person URN', () => {
      expect(extractEntityId('urn:li:person:ABC123')).toBe('ABC123');
    });

    it('should extract entity ID from an organization URN', () => {
      expect(extractEntityId('urn:li:organization:12345')).toBe('12345');
    });

    it('should extract complex entity IDs (comments)', () => {
      expect(extractEntityId('urn:li:comment:(urn:li:activity:123,456)')).toBe(
        '(urn:li:activity:123,456)',
      );
    });

    it('should extract entity ID with hyphens', () => {
      expect(extractEntityId('urn:li:image:C4E22AQH-test-123')).toBe('C4E22AQH-test-123');
    });

    it('should throw for invalid URNs', () => {
      expect(() => extractEntityId('not-a-urn')).toThrow('Invalid LinkedIn URN format');
    });
  });
});

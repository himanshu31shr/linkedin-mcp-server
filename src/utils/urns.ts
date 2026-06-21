/**
 * LinkedIn URN (Uniform Resource Name) utilities.
 *
 * LinkedIn uses URNs to identify entities:
 *   urn:li:person:ABC123
 *   urn:li:organization:12345
 *   urn:li:share:67890
 *   urn:li:image:C4E22AQH...
 *   urn:li:ugcPost:12345
 */

/** Valid LinkedIn entity types that appear in URNs */
export type LinkedInEntityType =
  | 'person'
  | 'organization'
  | 'share'
  | 'ugcPost'
  | 'image'
  | 'video'
  | 'document'
  | 'comment'
  | 'activity';

/** Parsed representation of a LinkedIn URN */
export interface ParsedUrn {
  entityType: string;
  entityId: string;
}

/**
 * Build a LinkedIn URN string from entity type and ID.
 * @example buildUrn('person', 'ABC123') → 'urn:li:person:ABC123'
 */
export function buildUrn(entityType: LinkedInEntityType, entityId: string): string {
  return `urn:li:${entityType}:${entityId}`;
}

/**
 * Parse a LinkedIn URN string into its components.
 * @example parseUrn('urn:li:person:ABC123') → { entityType: 'person', entityId: 'ABC123' }
 * @throws {Error} If the URN format is invalid
 */
export function parseUrn(urn: string): ParsedUrn {
  const match = urn.match(/^urn:li:(\w+):(.+)$/);
  if (!match) {
    throw new Error(`Invalid LinkedIn URN format: "${urn}". Expected format: urn:li:{entityType}:{entityId}`);
  }
  return {
    entityType: match[1],
    entityId: match[2],
  };
}

/**
 * Validate that a string is a valid LinkedIn URN.
 */
export function isValidUrn(urn: string): boolean {
  return /^urn:li:\w+:.+$/.test(urn);
}

/**
 * Validate that a URN is of a specific entity type.
 * @example isUrnOfType('urn:li:person:ABC123', 'person') → true
 */
export function isUrnOfType(urn: string, entityType: LinkedInEntityType): boolean {
  try {
    const parsed = parseUrn(urn);
    return parsed.entityType === entityType;
  } catch {
    return false;
  }
}

/**
 * Extract just the entity ID from a URN.
 * @example extractEntityId('urn:li:person:ABC123') → 'ABC123'
 */
export function extractEntityId(urn: string): string {
  return parseUrn(urn).entityId;
}

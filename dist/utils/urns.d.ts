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
export type LinkedInEntityType = 'person' | 'organization' | 'share' | 'ugcPost' | 'image' | 'video' | 'document' | 'comment' | 'activity';
/** Parsed representation of a LinkedIn URN */
export interface ParsedUrn {
    entityType: string;
    entityId: string;
}
/**
 * Build a LinkedIn URN string from entity type and ID.
 * @example buildUrn('person', 'ABC123') → 'urn:li:person:ABC123'
 */
export declare function buildUrn(entityType: LinkedInEntityType, entityId: string): string;
/**
 * Parse a LinkedIn URN string into its components.
 * @example parseUrn('urn:li:person:ABC123') → { entityType: 'person', entityId: 'ABC123' }
 * @throws {Error} If the URN format is invalid
 */
export declare function parseUrn(urn: string): ParsedUrn;
/**
 * Validate that a string is a valid LinkedIn URN.
 */
export declare function isValidUrn(urn: string): boolean;
/**
 * Validate that a URN is of a specific entity type.
 * @example isUrnOfType('urn:li:person:ABC123', 'person') → true
 */
export declare function isUrnOfType(urn: string, entityType: LinkedInEntityType): boolean;
/**
 * Extract just the entity ID from a URN.
 * @example extractEntityId('urn:li:person:ABC123') → 'ABC123'
 */
export declare function extractEntityId(urn: string): string;
//# sourceMappingURL=urns.d.ts.map
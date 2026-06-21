import type { TextContent } from '@modelcontextprotocol/sdk/types.js';
/**
 * Format an error into an MCP-compatible tool result with isError: true.
 * This lets the LLM see the failure and self-correct, rather than crashing the protocol.
 */
export declare function formatToolError(error: unknown): {
    content: TextContent[];
    isError: true;
};
/**
 * Format a successful tool result.
 */
export declare function formatToolResult(data: unknown): {
    content: TextContent[];
};
/**
 * Extract a human-readable error message from various error types.
 */
export declare function extractErrorMessage(error: unknown): string;
/**
 * Custom error class for LinkedIn API errors.
 * Preserves HTTP status code and any error details from the API response.
 */
export declare class LinkedInApiError extends Error {
    readonly status: number;
    readonly details?: Record<string, unknown> | undefined;
    constructor(status: number, message: string, details?: Record<string, unknown> | undefined);
}
/**
 * Error thrown when the access token is missing or invalid.
 */
export declare class AuthenticationError extends Error {
    constructor(message?: string);
}
//# sourceMappingURL=errors.d.ts.map
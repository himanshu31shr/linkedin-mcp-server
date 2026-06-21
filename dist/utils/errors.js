/**
 * Format an error into an MCP-compatible tool result with isError: true.
 * This lets the LLM see the failure and self-correct, rather than crashing the protocol.
 */
export function formatToolError(error) {
    const message = extractErrorMessage(error);
    return {
        content: [{ type: 'text', text: message }],
        isError: true,
    };
}
/**
 * Format a successful tool result.
 */
export function formatToolResult(data) {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    return {
        content: [{ type: 'text', text }],
    };
}
/**
 * Extract a human-readable error message from various error types.
 */
export function extractErrorMessage(error) {
    if (error instanceof LinkedInApiError) {
        return `LinkedIn API Error (${error.status}): ${error.message}${error.details ? `\nDetails: ${JSON.stringify(error.details)}` : ''}`;
    }
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'An unknown error occurred';
}
/**
 * Custom error class for LinkedIn API errors.
 * Preserves HTTP status code and any error details from the API response.
 */
export class LinkedInApiError extends Error {
    status;
    details;
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
        this.name = 'LinkedInApiError';
    }
}
/**
 * Error thrown when the access token is missing or invalid.
 */
export class AuthenticationError extends Error {
    constructor(message = 'LINKEDIN_ACCESS_TOKEN environment variable is not set or is invalid.') {
        super(message);
        this.name = 'AuthenticationError';
    }
}
//# sourceMappingURL=errors.js.map
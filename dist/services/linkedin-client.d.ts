/** HTTP methods supported by the client */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
/** Options for making a LinkedIn API request */
export interface LinkedInRequestOptions {
    /** HTTP method */
    method: HttpMethod;
    /** API path (appended to base URL) */
    path: string;
    /** Use /rest base URL (true, default) or /v2 base URL (false) */
    useRestApi?: boolean;
    /** Request body (will be JSON-serialized) */
    body?: Record<string, unknown>;
    /** Additional query parameters */
    params?: Record<string, string>;
    /** Additional headers */
    headers?: Record<string, string>;
}
/**
 * LinkedIn REST API client.
 * Handles authentication, required headers, error parsing, and rate limit awareness.
 */
export declare class LinkedInClient {
    private accessToken;
    constructor(accessToken?: string);
    /**
     * Make an authenticated request to the LinkedIn API.
     */
    request<T = unknown>(options: LinkedInRequestOptions): Promise<T>;
    /**
     * Convenience method for GET requests.
     */
    get<T = unknown>(path: string, params?: Record<string, string>, useRestApi?: boolean): Promise<T>;
    /**
     * Convenience method for POST requests.
     */
    post<T = unknown>(path: string, body?: Record<string, unknown>, useRestApi?: boolean): Promise<T>;
    /**
     * Convenience method for DELETE requests.
     */
    delete<T = unknown>(path: string, useRestApi?: boolean): Promise<T>;
    /**
     * Convenience method for PATCH requests.
     */
    patch<T = unknown>(path: string, body?: Record<string, unknown>, useRestApi?: boolean): Promise<T>;
    /**
     * Upload binary data to a LinkedIn upload URL.
     * Used for image/video/document uploads where LinkedIn provides a pre-signed URL.
     */
    uploadBinary(uploadUrl: string, data: Uint8Array, contentType: string): Promise<void>;
    /**
     * Extract a useful error message from a LinkedIn API error response.
     */
    private extractApiErrorMessage;
}
//# sourceMappingURL=linkedin-client.d.ts.map
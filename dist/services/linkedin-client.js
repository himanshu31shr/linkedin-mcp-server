import { AuthenticationError, LinkedInApiError } from '../utils/errors.js';
import { createChildLogger } from '../utils/logger.js';
const log = createChildLogger('linkedin-client');
/** LinkedIn API version header value (YYYYMM format) */
const LINKEDIN_API_VERSION = '202406';
/** Base URLs for LinkedIn API */
const REST_BASE_URL = 'https://api.linkedin.com/rest';
const V2_BASE_URL = 'https://api.linkedin.com/v2';
/**
 * LinkedIn REST API client.
 * Handles authentication, required headers, error parsing, and rate limit awareness.
 */
export class LinkedInClient {
    accessToken;
    constructor(accessToken) {
        const token = accessToken ?? process.env.LINKEDIN_ACCESS_TOKEN;
        if (!token) {
            throw new AuthenticationError();
        }
        this.accessToken = token;
        log.info('CAVEMAN: LinkedInClient initialized with token (length=%d)', token.length);
    }
    /**
     * Make an authenticated request to the LinkedIn API.
     */
    async request(options) {
        const baseUrl = options.useRestApi === false ? V2_BASE_URL : REST_BASE_URL;
        const url = new URL(`${baseUrl}${options.path}`);
        // Append query params
        if (options.params) {
            for (const [key, value] of Object.entries(options.params)) {
                url.searchParams.set(key, value);
            }
        }
        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            'LinkedIn-Version': LINKEDIN_API_VERSION,
            'X-Restli-Protocol-Version': '2.0.0',
            ...options.headers,
        };
        // Add Content-Type for requests with bodies
        if (options.body) {
            headers['Content-Type'] = 'application/json';
        }
        log.debug('CAVEMAN: %s %s', options.method, url.toString());
        const response = await fetch(url.toString(), {
            method: options.method,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });
        log.debug('CAVEMAN: Response status=%d', response.status);
        // Handle rate limiting
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            throw new LinkedInApiError(429, `Rate limited by LinkedIn API. ${retryAfter ? `Retry after ${retryAfter} seconds.` : 'Please try again later.'}`);
        }
        // Handle no-content responses (e.g., DELETE)
        if (response.status === 204) {
            return undefined;
        }
        // Parse response body
        const responseText = await response.text();
        let responseBody;
        if (responseText) {
            try {
                responseBody = JSON.parse(responseText);
            }
            catch {
                // If response is not JSON, wrap it
                responseBody = { rawResponse: responseText };
            }
        }
        // Handle error responses
        if (!response.ok) {
            const errorMessage = this.extractApiErrorMessage(responseBody, response.status);
            log.error('CAVEMAN: API error: %s', errorMessage);
            throw new LinkedInApiError(response.status, errorMessage, typeof responseBody === 'object' ? responseBody : undefined);
        }
        log.debug('CAVEMAN: Request successful');
        return responseBody;
    }
    /**
     * Convenience method for GET requests.
     */
    async get(path, params, useRestApi = true) {
        return this.request({ method: 'GET', path, params, useRestApi });
    }
    /**
     * Convenience method for POST requests.
     */
    async post(path, body, useRestApi = true) {
        return this.request({ method: 'POST', path, body, useRestApi });
    }
    /**
     * Convenience method for DELETE requests.
     */
    async delete(path, useRestApi = true) {
        return this.request({ method: 'DELETE', path, useRestApi });
    }
    /**
     * Convenience method for PATCH requests.
     */
    async patch(path, body, useRestApi = true) {
        return this.request({ method: 'PATCH', path, body, useRestApi });
    }
    /**
     * Upload binary data to a LinkedIn upload URL.
     * Used for image/video/document uploads where LinkedIn provides a pre-signed URL.
     */
    async uploadBinary(uploadUrl, data, contentType) {
        log.debug('CAVEMAN: Uploading binary to %s (size=%d, type=%s)', uploadUrl, data.length, contentType);
        const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': contentType,
            },
            body: data,
        });
        if (!response.ok) {
            const text = await response.text();
            log.error('CAVEMAN: Upload failed: status=%d, body=%s', response.status, text);
            throw new LinkedInApiError(response.status, `Upload failed: ${text}`);
        }
        log.debug('CAVEMAN: Upload successful');
    }
    /**
     * Extract a useful error message from a LinkedIn API error response.
     */
    extractApiErrorMessage(responseBody, status) {
        if (responseBody && typeof responseBody === 'object') {
            const body = responseBody;
            // LinkedIn error format: { message: "...", status: 401 }
            if (typeof body.message === 'string') {
                return body.message;
            }
            // Alternative format: { error: "...", error_description: "..." }
            if (typeof body.error_description === 'string') {
                return body.error_description;
            }
            if (typeof body.error === 'string') {
                return body.error;
            }
        }
        return `LinkedIn API request failed with status ${status}`;
    }
}
//# sourceMappingURL=linkedin-client.js.map
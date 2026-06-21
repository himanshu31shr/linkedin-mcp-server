import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TextContent } from '@modelcontextprotocol/sdk/types.js';
import { LinkedInClient } from '../services/linkedin-client.js';
import { formatToolError, formatToolResult } from '../utils/errors.js';
import { createChildLogger } from '../utils/logger.js';
import {
  UploadImageInputSchema,
  CreateImagePostInputSchema,
  CreateDocumentPostInputSchema,
  type UploadImageInput,
  type CreateImagePostInput,
  type CreateDocumentPostInput,
} from '../schemas/media.js';
import type { UserInfoResponse } from '../schemas/profile.js';

const log = createChildLogger('media-tools');

/**
 * Helper to get the authenticated user's person URN.
 */
async function getPersonUrn(client: LinkedInClient): Promise<string> {
  const userInfo = await client.get<UserInfoResponse>('/userinfo', undefined, false);
  return `urn:li:person:${userInfo.sub}`;
}

/**
 * Fetch binary data from a URL.
 */
async function fetchBinaryFromUrl(url: string): Promise<{ data: Uint8Array; contentType: string }> {
  log.info('CAVEMAN: Fetching binary from URL: %s', url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch from ${url}: HTTP ${response.status} ${response.statusText}`);
  }
  const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
  const arrayBuffer = await response.arrayBuffer();
  return { data: new Uint8Array(arrayBuffer), contentType };
}

/** Response shape for image upload initialization */
interface InitializeUploadResponse {
  value: {
    uploadUrl: string;
    image: string; // image URN
  };
}

/** Response shape for document upload initialization */
interface InitializeDocumentUploadResponse {
  value: {
    uploadUrl: string;
    document: string; // document URN
  };
}

/**
 * Upload an image to LinkedIn and return the image URN.
 */
export async function uploadImage(
  client: LinkedInClient,
  input: UploadImageInput,
): Promise<{ content: TextContent[]; isError?: true }> {
  try {
    log.info('CAVEMAN: Starting image upload from URL: %s', input.imageUrl);

    const personUrn = await getPersonUrn(client);
    log.info('CAVEMAN: Resolved person URN: %s', personUrn);

    // Step 1: Initialize upload
    const initResponse = await client.post<InitializeUploadResponse>(
      '/images?action=initializeUpload',
      {
        initializeUploadRequest: {
          owner: personUrn,
        },
      },
    );

    const uploadUrl = initResponse.value.uploadUrl;
    const imageUrn = initResponse.value.image;
    log.info('CAVEMAN: Got upload URL and image URN: %s', imageUrn);

    // Step 2: Fetch image from source URL
    const { data, contentType } = await fetchBinaryFromUrl(input.imageUrl);
    log.info('CAVEMAN: Fetched image (size=%d, type=%s)', data.length, contentType);

    // Step 3: Upload the binary to LinkedIn
    await client.uploadBinary(uploadUrl, data, contentType);
    log.info('CAVEMAN: Image uploaded successfully');

    return formatToolResult({
      success: true,
      imageUrn,
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    log.error('CAVEMAN: Failed to upload image: %s', error);
    return formatToolError(error);
  }
}

/**
 * Internal helper to upload an image and return the URN (throws on failure).
 */
async function uploadImageInternal(
  client: LinkedInClient,
  imageUrl: string,
  personUrn: string,
): Promise<string> {
  const initResponse = await client.post<InitializeUploadResponse>(
    '/images?action=initializeUpload',
    {
      initializeUploadRequest: {
        owner: personUrn,
      },
    },
  );

  const uploadUrl = initResponse.value.uploadUrl;
  const imageUrn = initResponse.value.image;

  const { data, contentType } = await fetchBinaryFromUrl(imageUrl);
  await client.uploadBinary(uploadUrl, data, contentType);

  return imageUrn;
}

/**
 * Create a post with an image on LinkedIn.
 */
export async function createImagePost(
  client: LinkedInClient,
  input: CreateImagePostInput,
): Promise<{ content: TextContent[]; isError?: true }> {
  try {
    log.info('CAVEMAN: Creating image post (imageUrl=%s)', input.imageUrl);

    const personUrn = await getPersonUrn(client);
    log.info('CAVEMAN: Resolved person URN: %s', personUrn);

    // Step 1: Upload the image
    const imageUrn = await uploadImageInternal(client, input.imageUrl, personUrn);
    log.info('CAVEMAN: Image uploaded with URN: %s', imageUrn);

    // Step 2: Create the post with the image
    const visibility = input.visibility ?? 'PUBLIC';
    const body: Record<string, unknown> = {
      author: personUrn,
      commentary: input.text,
      visibility,
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      content: {
        media: {
          id: imageUrn,
          ...(input.altText ? { altText: input.altText } : {}),
        },
      },
    };

    const response = await client.post<Record<string, unknown>>('/posts', body);
    log.info('CAVEMAN: Image post created successfully');

    return formatToolResult({
      success: true,
      message: 'Image post created successfully',
      imageUrn,
      postId: response?.id ?? 'unknown',
    });
  } catch (error) {
    log.error('CAVEMAN: Failed to create image post: %s', error);
    return formatToolError(error);
  }
}

/**
 * Create a post with a document (PDF, etc.) on LinkedIn.
 */
export async function createDocumentPost(
  client: LinkedInClient,
  input: CreateDocumentPostInput,
): Promise<{ content: TextContent[]; isError?: true }> {
  try {
    log.info('CAVEMAN: Creating document post (documentUrl=%s)', input.documentUrl);

    const personUrn = await getPersonUrn(client);
    log.info('CAVEMAN: Resolved person URN: %s', personUrn);

    // Step 1: Initialize document upload
    const initResponse = await client.post<InitializeDocumentUploadResponse>(
      '/documents?action=initializeUpload',
      {
        initializeUploadRequest: {
          owner: personUrn,
        },
      },
    );

    const uploadUrl = initResponse.value.uploadUrl;
    const documentUrn = initResponse.value.document;
    log.info('CAVEMAN: Got upload URL and document URN: %s', documentUrn);

    // Step 2: Fetch document from source URL
    const { data, contentType } = await fetchBinaryFromUrl(input.documentUrl);
    log.info('CAVEMAN: Fetched document (size=%d, type=%s)', data.length, contentType);

    // Step 3: Upload the binary to LinkedIn
    await client.uploadBinary(uploadUrl, data, contentType);
    log.info('CAVEMAN: Document uploaded successfully');

    // Step 4: Create the post with the document
    const visibility = input.visibility ?? 'PUBLIC';
    const body: Record<string, unknown> = {
      author: personUrn,
      commentary: input.text,
      visibility,
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      content: {
        media: {
          id: documentUrn,
          ...(input.title ? { title: input.title } : {}),
        },
      },
    };

    const response = await client.post<Record<string, unknown>>('/posts', body);
    log.info('CAVEMAN: Document post created successfully');

    return formatToolResult({
      success: true,
      message: 'Document post created successfully',
      documentUrn,
      postId: response?.id ?? 'unknown',
    });
  } catch (error) {
    log.error('CAVEMAN: Failed to create document post: %s', error);
    return formatToolError(error);
  }
}

/**
 * Register all media-related tools with the MCP server.
 */
export function registerMediaTools(server: McpServer, client: LinkedInClient): void {
  server.registerTool(
    'upload_image',
    {
      description: 'Upload an image to LinkedIn from a URL and get an image URN for use in posts',
      inputSchema: UploadImageInputSchema.shape,
    },
    async (input) => {
      return uploadImage(client, input as UploadImageInput);
    },
  );

  server.registerTool(
    'create_image_post',
    {
      description: 'Create a post with an image on LinkedIn',
      inputSchema: CreateImagePostInputSchema.shape,
    },
    async (input) => {
      return createImagePost(client, input as CreateImagePostInput);
    },
  );

  server.registerTool(
    'create_document_post',
    {
      description: 'Create a post with a document (PDF, etc.) on LinkedIn',
      inputSchema: CreateDocumentPostInputSchema.shape,
    },
    async (input) => {
      return createDocumentPost(client, input as CreateDocumentPostInput);
    },
  );

  log.info('CAVEMAN: Registered media tools (upload_image, create_image_post, create_document_post)');
}

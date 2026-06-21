import { describe, it, expect } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../../src/server.js';

describe('MCP Server Integration', () => {
  it('should list all available tools over MCP protocol', async () => {
    // 1. Initialize server
    const server = createServer('dummy-token');

    // 2. Set up InMemory transports
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    // 3. Connect server to its transport
    await server.connect(serverTransport);

    // 4. Set up client
    const client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    // 5. Connect client
    await client.connect(clientTransport);

    // 6. Request tools list
    const toolsResponse = await client.listTools();

    const expectedTools = [
      'get_profile',
      'get_email',
      'create_text_post',
      'create_link_post',
      'delete_post',
      'upload_image',
      'create_image_post',
      'create_document_post',
      'get_organization',
      'create_org_post',
      'get_org_posts',
      'delete_org_post',
      'get_post_comments',
      'create_comment',
      'delete_comment',
      'add_reaction',
      'remove_reaction',
      'get_org_page_statistics',
      'get_org_follower_statistics',
      'get_org_share_statistics',
    ];

    expect(toolsResponse.tools).toBeDefined();
    const toolNames = toolsResponse.tools.map((t) => t.name);

    for (const expectedTool of expectedTools) {
      expect(toolNames).toContain(expectedTool);
    }
    
    // There should be exactly 20 tools based on our current implementation
    expect(toolNames.length).toBe(20);

    // 7. Cleanup
    await client.close();
    await server.close();
  });
});

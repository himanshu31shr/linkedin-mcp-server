# LinkedIn MCP Server

[![npm version](https://img.shields.io/npm/v/@himanshu31shr/linkedin-mcp-server.svg)](https://www.npmjs.com/package/@himanshu31shr/linkedin-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides AI agents with read/write access to the LinkedIn API.

## Features

- **Profile Tools**: Fetch user profile and email.
- **Post Tools**: Create text, link, image, and document posts. Delete posts.
- **Media Tools**: Upload images and documents to LinkedIn.
- **Organization Tools**: Fetch organization details, post on behalf of an organization, fetch and delete org posts.
- **Social Action Tools**: Fetch, create, and delete comments on posts. Add or remove reactions (like, celebrate, etc.).
- **Organization Analytics Tools**: Get organization page, follower, and share statistics.

## Prerequisites

You need a LinkedIn Access Token. Create an app on the [LinkedIn Developer Portal](https://developer.linkedin.com/), then either:

- Use the built-in OAuth flow (see [Development Setup](#development-setup)), **or**
- Generate a token manually from the developer portal.

## Quick Start (npm — recommended)

The easiest way to use this server is via the published npm package. No cloning required.

### Install globally

```bash
npm install -g @himanshu31shr/linkedin-mcp-server
```

Then run it:

```bash
LINKEDIN_ACCESS_TOKEN=your-token linkedin-mcp-server
```

### Or run directly with `npx`

```bash
LINKEDIN_ACCESS_TOKEN=your-token npx -y @himanshu31shr/linkedin-mcp-server
```

## MCP Client Configuration

### Claude Desktop

Add the following to your `claude_desktop_config.json`:

**Using npx (no install needed):**

```json
{
  "mcpServers": {
    "linkedin": {
      "command": "npx",
      "args": ["-y", "@himanshu31shr/linkedin-mcp-server"],
      "env": {
        "LINKEDIN_ACCESS_TOKEN": "your-linkedin-access-token"
      }
    }
  }
}
```

**Using a global install:**

```json
{
  "mcpServers": {
    "linkedin": {
      "command": "linkedin-mcp-server",
      "env": {
        "LINKEDIN_ACCESS_TOKEN": "your-linkedin-access-token"
      }
    }
  }
}
```

**Using a local clone:**

```json
{
  "mcpServers": {
    "linkedin": {
      "command": "node",
      "args": ["/path/to/linkedin-mcp-server/dist/index.js"],
      "env": {
        "LINKEDIN_ACCESS_TOKEN": "your-linkedin-access-token"
      }
    }
  }
}
```

### Cursor

In Cursor's Settings > AI > MCP Servers, add a new server:

- **Type**: `command`
- **Name**: `linkedin`
- **Command**: `npx -y @himanshu31shr/linkedin-mcp-server`
- **Environment Variables**: Add `LINKEDIN_ACCESS_TOKEN` with your token.

### Antigravity / Windsurf / Other MCP Clients

Use the same pattern — point the MCP client to:

```
npx -y @himanshu31shr/linkedin-mcp-server
```

And set the `LINKEDIN_ACCESS_TOKEN` environment variable.

## Available Tools

| Tool | Description |
|------|-------------|
| `get_profile` | Fetch the authenticated user's LinkedIn profile |
| `get_email` | Fetch the authenticated user's email address |
| `create_text_post` | Create a text-only post |
| `create_link_post` | Create a post with a link attachment |
| `create_image_post` | Create a post with an image |
| `create_document_post` | Create a post with a document (PDF, etc.) |
| `delete_post` | Delete a post by URN |
| `upload_image` | Upload an image to LinkedIn |
| `get_organization` | Fetch organization details |
| `create_org_post` | Create a post on behalf of an organization |
| `get_org_posts` | Fetch recent posts for an organization |
| `delete_org_post` | Delete an organization post |
| `get_post_comments` | Fetch comments on a post |
| `create_comment` | Add a comment to a post |
| `delete_comment` | Delete a comment |
| `add_reaction` | Add a reaction to a post |
| `remove_reaction` | Remove a reaction from a post |
| `get_org_page_statistics` | Get organization page statistics |
| `get_org_follower_statistics` | Get organization follower statistics |
| `get_org_share_statistics` | Get organization share statistics |

## Development Setup

If you want to contribute or run from source:

1. **Clone and install**:
   ```bash
   git clone https://github.com/himanshu31shr/linkedin-mcp-server.git
   cd linkedin-mcp-server
   npm install
   ```

2. **Build**:
   ```bash
   npm run build
   ```

3. **Get a LinkedIn Access Token** (automated OAuth flow):
   ```bash
   npm run auth
   ```
   Follow the prompts — this will save your `LINKEDIN_ACCESS_TOKEN` to the `.env` file automatically.

4. **Run locally**:
   ```bash
   npm run dev
   ```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run dev` | Run in development mode with `tsx` |
| `npm run auth` | Run the OAuth token flow |
| `npm test` | Run tests with Vitest |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Type-check with TypeScript |
| `npm run inspect` | Launch MCP Inspector for debugging |

## License

MIT

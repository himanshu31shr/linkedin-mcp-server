# LinkedIn MCP Server

A Model Context Protocol (MCP) server that provides AI agents with read/write access to the LinkedIn API.

## Features
- **Profile Tools**: Fetch user profile and email.
- **Post Tools**: Create text, link, image, and document posts. Delete posts.
- **Media Tools**: Upload images and documents to LinkedIn.
- **Organization Tools**: Fetch organization details, post on behalf of an organization, fetch and delete org posts.
- **Social Action Tools**: Fetch, create, and delete comments on posts. Add or remove reactions (like, celebrate, etc.).
- **Organization Analytics Tools**: Get organization page, follower, and share statistics.

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Get a LinkedIn Access Token**:
   - Create an app on the [LinkedIn Developer Portal](https://developer.linkedin.com/).
   - Go to the **Auth** tab and add `http://localhost:3000/callback` to the **Authorized redirect URLs**.
   - Run the automated OAuth flow:
     ```bash
     npm run auth
     ```
   - Follow the prompts in the terminal. This will automatically open a browser window for you to log in and authorize the app, then it will save your new `LINKEDIN_ACCESS_TOKEN` directly into the `.env` file!

## Usage as a Local MCP Server

To use this server locally with an AI agent (like Claude Desktop, Cursor, or Antigravity), you need to configure the IDE to spawn the MCP server process.

### Claude Desktop Configuration

Add the following to your `claude_desktop_config.json`:

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

### Cursor Configuration

In Cursor's Settings > AI > MCP Servers, add a new server:
- **Type**: `command`
- **Name**: `linkedin`
- **Command**: `node /path/to/linkedin-mcp-server/dist/index.js`
- **Environment Variables**: Add `LINKEDIN_ACCESS_TOKEN` with your token.

## Development

- `npm run build`: Compile TypeScript to JavaScript.
- `npm run watch`: Compile in watch mode.
- `npm test`: Run tests with Vitest.
- `npm run test:ui`: Run tests with UI.
- `npm run lint`: Run ESLint.
- `npm run format`: Run Prettier.

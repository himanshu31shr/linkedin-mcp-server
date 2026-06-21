import * as http from 'http';
import * as url from 'url';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import open from 'open';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.resolve(__dirname, '../.env');

const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

const PRESET_SCOPES = {
  '1': {
    name: 'Personal Profile & Posts only',
    scopes: 'openid profile w_member_social email',
  },
  '2': {
    name: 'Personal + Organization',
    scopes: 'openid profile w_member_social email w_organization_social r_organization_admin',
  },
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function exchangeCodeForToken(
  clientId: string,
  clientSecret: string,
  code: string,
): Promise<string> {
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', REDIRECT_URI);
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  return data.access_token;
}

function updateEnvFile(clientId: string, clientSecret: string, token: string) {
  let envContent = '';
  if (fs.existsSync(ENV_PATH)) {
    envContent = fs.readFileSync(ENV_PATH, 'utf-8');
  }

  const envVars: Record<string, string> = {};
  
  // Parse existing
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });

  // Update
  envVars['LINKEDIN_CLIENT_ID'] = clientId;
  envVars['LINKEDIN_CLIENT_SECRET'] = clientSecret;
  envVars['LINKEDIN_ACCESS_TOKEN'] = token;

  // Serialize
  const newContent = Object.entries(envVars)
    .map(([key, val]) => `${key}=${val}`)
    .join('\n');

  fs.writeFileSync(ENV_PATH, newContent + '\n', 'utf-8');
}

async function runAuthFlow() {
  console.log('\n=== LinkedIn MCP Server OAuth Setup ===\n');
  console.log('You will need your Client ID and Client Secret from the LinkedIn Developer Portal.');
  console.log(`Ensure that you have added exactly this URL to your Authorized redirect URLs:`);
  console.log(`\n    ${REDIRECT_URI}\n`);

  const clientId = await askQuestion('Client ID: ');
  if (!clientId.trim()) {
    console.error('Client ID is required.');
    process.exit(1);
  }

  const clientSecret = await askQuestion('Client Secret: ');
  if (!clientSecret.trim()) {
    console.error('Client Secret is required.');
    process.exit(1);
  }

  console.log('\nSelect the OAuth scopes you want to request based on your app permissions:');
  console.log('1. Personal Profile & Posts only (openid, profile, email, w_member_social)');
  console.log('2. Personal + Organization (includes w_organization_social, r_organization_admin)');
  console.log('3. Custom (enter your own scopes)');
  
  let scopeSelection = await askQuestion('\nSelect option (1/2/3) [default: 1]: ');
  scopeSelection = scopeSelection.trim() || '1';

  let selectedScopes = '';
  if (scopeSelection === '1') {
    selectedScopes = PRESET_SCOPES['1'].scopes;
  } else if (scopeSelection === '2') {
    selectedScopes = PRESET_SCOPES['2'].scopes;
  } else if (scopeSelection === '3') {
    const custom = await askQuestion('Enter scopes separated by spaces: ');
    selectedScopes = custom.trim();
  } else {
    console.error('Invalid option.');
    process.exit(1);
  }

  const state = crypto.randomBytes(16).toString('hex');
  
  const authParams = new URLSearchParams({
    response_type: 'code',
    client_id: clientId.trim(),
    redirect_uri: REDIRECT_URI,
    state: state,
    scope: selectedScopes,
  });

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${authParams.toString()}`;

  console.log('\nStarting local web server...');

  const server = http.createServer(async (req, res) => {
    try {
      const reqUrl = url.parse(req.url || '', true);
      
      if (reqUrl.pathname === '/callback') {
        const error = reqUrl.query.error;
        const errorDescription = reqUrl.query.error_description;
        const code = reqUrl.query.code as string;
        const returnedState = reqUrl.query.state as string;

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>Authorization Failed</h1><p>${error}: ${errorDescription}</p><p>You can close this tab.</p>`);
          console.error(`\n❌ Authorization failed: ${error} - ${errorDescription}`);
          process.exit(1);
        }

        if (returnedState !== state) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>State Mismatch</h1><p>Possible CSRF attack. You can close this tab.</p>');
          console.error('\n❌ State mismatch! Aborting.');
          process.exit(1);
        }

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Success!</h1><p>Authorization code received. You can close this tab and return to your terminal.</p>');
          
          console.log('✅ Authorization code received. Exchanging for access token...');
          
          try {
            const token = await exchangeCodeForToken(clientId.trim(), clientSecret.trim(), code);
            console.log('✅ Access token received!');
            
            updateEnvFile(clientId.trim(), clientSecret.trim(), token);
            console.log(`✅ Saved credentials to ${ENV_PATH}`);
            console.log('\nYou can now run the MCP server, and it will automatically use this token!');
            
            server.close(() => {
              process.exit(0);
            });
          } catch (e) {
            console.error('\n❌ Failed to exchange code for token:');
            console.error(e instanceof Error ? e.message : e);
            process.exit(1);
          }
        }
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    } catch (err) {
      res.writeHead(500);
      res.end('Internal Server Error');
      console.error(err);
    }
  });

  server.listen(PORT, async () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`\nOpening your browser to LinkedIn...\n`);
    await open(authUrl);
  });
}

runAuthFlow().catch((err) => {
  console.error('An unexpected error occurred:', err);
  process.exit(1);
});

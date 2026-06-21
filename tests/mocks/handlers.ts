import { http, HttpResponse } from 'msw';

// ─── Mock Data ──────────────────────────────────────────────────────────

export const mockProfile = {
  sub: 'test-person-id',
  name: 'Test User',
  given_name: 'Test',
  family_name: 'User',
  email: 'test@example.com',
  email_verified: true,
  picture: 'https://media.licdn.com/dms/image/test.jpg',
};

export const mockOrganization = {
  id: 12345,
  localizedName: 'Test Organization',
  vanityName: 'test-org',
  localizedDescription: 'A test organization for unit testing.',
  logoV2: {
    'original~': {
      elements: [{ identifiers: [{ identifier: 'https://media.licdn.com/org-logo.jpg' }] }],
    },
  },
  organizationType: 'CORPORATION',
  localizedWebsite: 'https://example.com',
  industries: ['TECHNOLOGY'],
  staffCountRange: { start: 51, end: 200 },
};

export const mockPost = {
  id: 'urn:li:share:123456',
  author: 'urn:li:person:test-person-id',
  commentary: 'This is a test post from the LinkedIn MCP server.',
  visibility: 'PUBLIC',
  lifecycleState: 'PUBLISHED',
  publishedAt: 1700000000000,
  lastModifiedAt: 1700000100000,
};

export const mockOrgPosts = {
  elements: [
    {
      id: 'urn:li:share:org-post-1',
      author: 'urn:li:organization:12345',
      commentary: 'Organization update #1',
      visibility: 'PUBLIC',
      lifecycleState: 'PUBLISHED',
      publishedAt: 1700000000000,
    },
    {
      id: 'urn:li:share:org-post-2',
      author: 'urn:li:organization:12345',
      commentary: 'Organization update #2',
      visibility: 'PUBLIC',
      lifecycleState: 'PUBLISHED',
      publishedAt: 1700001000000,
    },
  ],
  paging: { count: 10, start: 0, total: 2 },
};

export const mockImageUpload = {
  value: {
    uploadUrlExpiresAt: 1700100000000,
    uploadUrl: 'https://api.linkedin.com/mediaUpload/images/upload-id-123',
    image: 'urn:li:image:C4E22AQH-test-image',
  },
};

export const mockDocumentUpload = {
  value: {
    uploadUrlExpiresAt: 1700100000000,
    uploadUrl: 'https://api.linkedin.com/mediaUpload/documents/upload-id-456',
    document: 'urn:li:document:C4E22AQH-test-doc',
  },
};

export const mockComment = {
  id: 'urn:li:comment:(urn:li:activity:7000000000000000001,100)',
  actor: 'urn:li:person:test-person-id',
  message: { text: 'Great post! Thanks for sharing.' },
  created: { time: 1700000000000 },
  lastModified: { time: 1700000000000 },
  '$URN': 'urn:li:comment:(urn:li:activity:7000000000000000001,100)',
};

export const mockComments = {
  elements: [
    {
      id: 'urn:li:comment:(urn:li:activity:7000000000000000001,100)',
      actor: 'urn:li:person:test-person-id',
      message: { text: 'Great post! Thanks for sharing.' },
      created: { time: 1700000000000 },
    },
    {
      id: 'urn:li:comment:(urn:li:activity:7000000000000000001,101)',
      actor: 'urn:li:person:another-person',
      message: { text: 'Very insightful!' },
      created: { time: 1700001000000 },
    },
  ],
  paging: { count: 10, start: 0, total: 2 },
};

export const mockPageStatistics = {
  elements: [
    {
      organization: 'urn:li:organization:12345',
      totalPageStatistics: {
        views: {
          allPageViews: { pageViews: 1520 },
          careersPageViews: { pageViews: 320 },
          overviewPageViews: { pageViews: 1200 },
        },
      },
    },
  ],
};

export const mockFollowerStatistics = {
  elements: [
    {
      organizationalEntity: 'urn:li:organization:12345',
      followerCounts: {
        organicFollowerCount: 4500,
        paidFollowerCount: 200,
      },
      followerCountsByAssociationType: [],
      followerCountsByFunction: [],
      followerCountsByRegion: [],
      followerCountsBySeniority: [],
      followerCountsByStaffCountRange: [],
    },
  ],
};

export const mockShareStatistics = {
  elements: [
    {
      organizationalEntity: 'urn:li:organization:12345',
      totalShareStatistics: {
        shareCount: 150,
        clickCount: 3200,
        engagement: 0.042,
        commentCount: 89,
        impressionCount: 75000,
        likeCount: 1200,
        shareMentionsCount: 12,
      },
    },
  ],
};

// ─── Handlers ───────────────────────────────────────────────────────────

export const handlers = [
  // ── Profile ─────────────────────────────────────────────────────────
  http.get('https://api.linkedin.com/v2/userinfo', () => {
    return HttpResponse.json(mockProfile);
  }),

  // ── Posts ───────────────────────────────────────────────────────────
  http.post('https://api.linkedin.com/rest/posts', () => {
    return new HttpResponse(null, {
      status: 201,
      headers: { 'x-restli-id': 'urn:li:share:123456' },
    });
  }),

  http.delete('https://api.linkedin.com/rest/posts/:postUrn', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('https://api.linkedin.com/rest/posts', ({ request }) => {
    const url = new URL(request.url);
    const author = url.searchParams.get('author');
    if (author) {
      return HttpResponse.json(mockOrgPosts);
    }
    return HttpResponse.json({ elements: [], paging: { count: 10, start: 0, total: 0 } });
  }),

  // ── Media: Image Upload ────────────────────────────────────────────
  http.post('https://api.linkedin.com/rest/images', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const action = (body as { initializeUploadRequest?: { action?: string } })
      ?.initializeUploadRequest?.action;
    if (action === 'INITIALIZE_UPLOAD' || !action) {
      return HttpResponse.json(mockImageUpload);
    }
    return HttpResponse.json(mockImageUpload);
  }),

  // ── Media: Document Upload ─────────────────────────────────────────
  http.post('https://api.linkedin.com/rest/documents', async () => {
    return HttpResponse.json(mockDocumentUpload);
  }),

  // ── Media: Binary Upload (pre-signed URL) ──────────────────────────
  http.put('https://api.linkedin.com/mediaUpload/*', () => {
    return new HttpResponse(null, { status: 201 });
  }),

  // ── Organizations ──────────────────────────────────────────────────
  http.get('https://api.linkedin.com/v2/organizations/:orgId', () => {
    return HttpResponse.json(mockOrganization);
  }),

  // ── Social Actions: Comments ───────────────────────────────────────
  http.get(
    'https://api.linkedin.com/v2/socialActions/:entityUrn/comments',
    () => {
      return HttpResponse.json(mockComments);
    },
  ),

  http.post(
    'https://api.linkedin.com/v2/socialActions/:entityUrn/comments',
    () => {
      return HttpResponse.json(mockComment, { status: 201 });
    },
  ),

  http.delete(
    'https://api.linkedin.com/v2/socialActions/:entityUrn/comments/:commentId',
    () => {
      return new HttpResponse(null, { status: 204 });
    },
  ),

  // ── Social Actions: Likes ──────────────────────────────────────────
  http.post(
    'https://api.linkedin.com/v2/socialActions/:entityUrn/likes',
    () => {
      return new HttpResponse(null, { status: 201 });
    },
  ),

  http.delete(
    'https://api.linkedin.com/v2/socialActions/:entityUrn/likes/:actorUrn',
    () => {
      return new HttpResponse(null, { status: 204 });
    },
  ),

  // ── Organization Analytics ─────────────────────────────────────────
  http.get('https://api.linkedin.com/v2/organizationPageStatistics', () => {
    return HttpResponse.json(mockPageStatistics);
  }),

  http.get('https://api.linkedin.com/v2/organizationalEntityFollowerStatistics', () => {
    return HttpResponse.json(mockFollowerStatistics);
  }),

  http.get('https://api.linkedin.com/v2/organizationalEntityShareStatistics', () => {
    return HttpResponse.json(mockShareStatistics);
  }),
];

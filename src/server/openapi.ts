export const OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'TalentLens — AI-Based Resume Screening REST API',
    version: '1.0.0',
    description:
      'NLP-powered resume screening, skill extraction, weighted candidate ranking, anonymized screening, and ML evaluation API.',
  },
  servers: [{ url: '/api', description: 'Same-origin API server' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'API health check',
        tags: ['System'],
        responses: { '200': { description: 'Healthy service status' } },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a new recruiter account',
        tags: ['Authentication'],
        responses: { '201': { description: 'Created user and JWT token' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate recruiter credentials and receive JWT',
        tags: ['Authentication'],
        responses: { '200': { description: 'Authenticated session' } },
      },
    },
    '/auth/demo': {
      post: {
        summary: 'Launch pre-seeded demo recruiter session',
        tags: ['Authentication'],
        responses: { '200': { description: 'Demo recruiter session with 10 sample resumes' } },
      },
    },
    '/nlp/extract-skills': {
      post: {
        summary: 'Auto-extract canonical required skills from a job description',
        tags: ['NLP Pipeline'],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Extracted skills, categories, and detected seniority' } },
      },
    },
    '/jobs': {
      get: {
        summary: 'List recruiter job postings',
        tags: ['Jobs'],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Array of job postings' } },
      },
      post: {
        summary: 'Create a new job posting',
        tags: ['Jobs'],
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'Created job posting' } },
      },
    },
    '/jobs/{jobId}': {
      patch: {
        summary: 'Update job requirements or scoring weights and re-rank candidates',
        tags: ['Jobs'],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Updated job posting' } },
      },
      delete: {
        summary: 'Delete job posting and all associated resumes',
        tags: ['Jobs'],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Deleted confirmation' } },
      },
    },
    '/jobs/{jobId}/resumes': {
      get: {
        summary: 'List ranked candidates for a job posting',
        tags: ['Resumes & Ranking'],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Ranked list of screened candidates' } },
      },
      delete: {
        summary: 'Privacy purge: delete all stored resumes for a job posting',
        tags: ['Resumes & Ranking'],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Purge count confirmation' } },
      },
    },
    '/jobs/{jobId}/resumes/upload': {
      post: {
        summary: 'Bulk upload PDF, DOCX, or TXT resumes and run full NLP screening pipeline',
        tags: ['Resumes & Ranking'],
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'Parsed and scored candidate records' } },
      },
    },
    '/jobs/{jobId}/resumes/text': {
      post: {
        summary: 'Screen pasted raw resume text directly',
        tags: ['Resumes & Ranking'],
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'Parsed and scored candidate record' } },
      },
    },
    '/resumes/{resumeId}/status': {
      patch: {
        summary: 'Update candidate status (new, shortlisted, saved, rejected)',
        tags: ['Resumes & Ranking'],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Status updated' } },
      },
    },
    '/resumes/{resumeId}': {
      delete: {
        summary: 'Delete a single candidate resume permanently (privacy compliance)',
        tags: ['Resumes & Ranking'],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Candidate deleted' } },
      },
    },
    '/analytics': {
      get: {
        summary: 'Get model evaluation metrics (Accuracy, Precision, Recall, F1, Confusion Matrix, P@K) and workspace charts',
        tags: ['Analytics & Evaluation'],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Full analytics summary' } },
      },
    },
  },
};

export function renderSwaggerDocsHtml(): string {
  const endpoints = Object.entries(OPENAPI_SPEC.paths)
    .flatMap(([route, methods]) =>
      Object.entries(methods).map(([method, spec]) => ({
        method: method.toUpperCase(),
        route: `/api${route}`,
        summary: spec.summary,
        tag: spec.tags?.[0] ?? 'API',
      }))
    );

  const rows = endpoints
    .map(
      (e) => `
      <tr>
        <td><span class="method m-${e.method.toLowerCase()}">${e.method}</span></td>
        <td><code>${e.route}</code></td>
        <td>${e.tag}</td>
        <td>${e.summary}</td>
      </tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>TalentLens OpenAPI Documentation</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 32px; background: #f8fafc; color: #0f172a; line-height: 1.5; }
    .container { max-width: 1020px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; }
    h1 { margin: 0 0 8px; font-size: 24px; }
    p { color: #475569; margin: 0 0 20px; }
    .links { margin-bottom: 24px; display: flex; gap: 16px; }
    .links a { color: #1d4ed8; text-decoration: none; font-weight: 600; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    th { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
    code { font-family: ui-monospace, monospace; font-size: 13px; color: #0f172a; }
    .method { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; font-family: ui-monospace, monospace; }
    .m-get { background: #dbeafe; color: #1e40af; }
    .m-post { background: #dcfce7; color: #166534; }
    .m-patch { background: #fef3c7; color: #92400e; }
    .m-delete { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${OPENAPI_SPEC.info.title}</h1>
    <p>${OPENAPI_SPEC.info.description}</p>
    <div class="links">
      <a href="/api/openapi.json">Download OpenAPI 3.0 JSON</a>
      <a href="/">Back to TalentLens Application</a>
    </div>
    <table>
      <thead>
        <tr><th>Method</th><th>Endpoint</th><th>Group</th><th>Summary</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</body>
</html>`;
}

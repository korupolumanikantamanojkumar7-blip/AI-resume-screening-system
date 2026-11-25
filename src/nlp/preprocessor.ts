const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'at', 'by', 'for',
  'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under',
  'again', 'further', 'once', 'here', 'there', 'where', 'why', 'how', 'all', 'any', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'is', 'am',
  'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
  'did', 'doing', 'would', 'could', 'ought', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours',
  'ourselves', 'you', 'your', 'yours', 'yourself', 'he', 'him', 'his', 'himself', 'she',
  'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs',
  'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'of',
  'as', 'until', 'while', 'per', 'via', 'using', 'used', 'use', 'work', 'worked', 'working',
  'etc', 'including', 'also', 'well', 'within', 'across', 'strong', 'ability', 'experience',
  'experienced', 'role', 'team', 'company', 'responsibilities', 'responsible', 'looking',
]);

const IRREGULAR_LEMMAS: Record<string, string> = {
  built: 'build',
  building: 'build',
  developed: 'develop',
  developing: 'develop',
  designed: 'design',
  designing: 'design',
  engineered: 'engineer',
  engineering: 'engineer',
  managed: 'manage',
  managing: 'manage',
  led: 'lead',
  leading: 'lead',
  trained: 'train',
  training: 'train',
  deployed: 'deploy',
  deploying: 'deploy',
  optimized: 'optimize',
  optimizing: 'optimize',
  automated: 'automate',
  automating: 'automate',
  analyzed: 'analyze',
  analyzing: 'analyze',
  analyses: 'analysis',
  models: 'model',
  modeling: 'model',
  modelling: 'model',
  pipelines: 'pipeline',
  services: 'service',
  systems: 'system',
  applications: 'application',
  databases: 'database',
  algorithms: 'algorithm',
  architectures: 'architecture',
  metrics: 'metric',
  candidates: 'candidate',
  resumes: 'resume',
  embeddings: 'embedding',
  transformers: 'transformer',
  classifiers: 'classifier',
  classifications: 'classification',
  extractions: 'extraction',
  deployments: 'deployment',
  containers: 'container',
  queries: 'query',
  technologies: 'technology',
  libraries: 'library',
  frameworks: 'framework',
  apis: 'api',
  microservices: 'microservice',
  dashboards: 'dashboard',
  reports: 'report',
  reporting: 'report',
  visualizations: 'visualization',
  tests: 'test',
  testing: 'test',
  tested: 'test',
  scaled: 'scale',
  scaling: 'scale',
  implemented: 'implement',
  implementing: 'implement',
  collaborated: 'collaborate',
  collaborating: 'collaborate',
  architected: 'architect',
  mentored: 'mentor',
  mentoring: 'mentor',
  recruited: 'recruit',
  recruiting: 'recruit',
  screened: 'screen',
  screening: 'screen',
};

const PRESERVE_TOKENS = new Set([
  'c++', 'c#', '.net', 'node.js', 'next.js', 'vue.js', 'ci/cd', 'scikit-learn',
  'sentence-bert', 'all-minilm-l6-v2', 'tf-idf', 'a/b', 'pl/sql', 't-sql',
  'react.js', 'express.js', 'chart.js',
]);

export function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219•▪◦]/g, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\S+@\S+\.\S+/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function lemmatizeToken(token: string): string {
  const lower = token.toLowerCase();
  if (PRESERVE_TOKENS.has(lower) || lower.length <= 3) {
    return lower;
  }
  if (IRREGULAR_LEMMAS[lower]) {
    return IRREGULAR_LEMMAS[lower];
  }
  if (lower.endsWith('ies') && lower.length > 5) {
    return lower.slice(0, -3) + 'y';
  }
  if (lower.endsWith('ing') && lower.length > 6) {
    const stem = lower.slice(0, -3);
    if (stem.endsWith('t') || stem.endsWith('n') || stem.endsWith('d') || stem.endsWith('r')) {
      return stem;
    }
    return stem;
  }
  if (lower.endsWith('ed') && lower.length > 5 && !lower.endsWith('eed')) {
    return lower.slice(0, -2);
  }
  if (lower.endsWith('s') && !lower.endsWith('ss') && !lower.endsWith('us') && !lower.endsWith('is') && lower.length > 4) {
    return lower.slice(0, -1);
  }
  return lower;
}

export function tokenizeAndLemmatize(raw: string): string[] {
  const cleaned = cleanText(raw).toLowerCase();
  // Match tech tokens like c++, c#, node.js, ci/cd, tf-idf as well as normal words
  const matches = cleaned.match(/[a-z0-9]+(?:[+#./-][a-z0-9+#]+)*|\.[a-z]+/g) ?? [];
  const tokens: string[] = [];

  for (const rawTok of matches) {
    const tok = rawTok.replace(/^[.-]+|[.-]+$/g, '');
    if (!tok || /^\d+$/.test(tok)) continue;
    if (tok.length === 1 && tok !== 'r' && tok !== 'c') continue;
    if (STOPWORDS.has(tok)) continue;
    const lemma = lemmatizeToken(tok);
    if (!STOPWORDS.has(lemma) && lemma.length > 0) {
      tokens.push(lemma);
    }
  }
  return tokens;
}

export function extractNgrams(tokens: string[], maxN = 2): string[] {
  const result = [...tokens];
  if (maxN >= 2) {
    for (let i = 0; i < tokens.length - 1; i++) {
      result.push(`${tokens[i]}_${tokens[i + 1]}`);
    }
  }
  return result;
}

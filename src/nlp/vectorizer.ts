import { extractNgrams, tokenizeAndLemmatize } from './preprocessor';
import { extractSkills } from './extractor';
import { SKILL_BY_CANONICAL } from './skillsTaxonomy';

export type SparseVector = Map<string, number>;

/**
 * Compute cosine similarity between two sparse vectors.
 */
export function cosineSimilaritySparse(a: SparseVector, b: SparseVector): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [k, v] of a.entries()) {
    normA += v * v;
    const bv = b.get(k);
    if (bv !== undefined) {
      dot += v * bv;
    }
  }
  for (const v of b.values()) {
    normB += v * v;
  }

  if (normA === 0 || normB === 0) return 0;
  return Math.max(0, Math.min(1, dot / (Math.sqrt(normA) * Math.sqrt(normB))));
}

/**
 * Compute cosine similarity between two dense float vectors.
 */
export function cosineSimilarityDense(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return Math.max(0, Math.min(1, dot / (Math.sqrt(normA) * Math.sqrt(normB))));
}

/**
 * Real TF-IDF Vectorizer with sublinear TF (1 + log(tf)), smooth IDF, and L2 normalization.
 */
export class TfidfVectorizer {
  private idf = new Map<string, number>();
  private docCount = 0;

  fit(documents: string[]): this {
    this.docCount = documents.length;
    const df = new Map<string, number>();

    for (const doc of documents) {
      const tokens = extractNgrams(tokenizeAndLemmatize(doc), 2);
      const unique = new Set(tokens);
      for (const term of unique) {
        df.set(term, (df.get(term) ?? 0) + 1);
      }
    }

    this.idf.clear();
    for (const [term, count] of df.entries()) {
      // Smooth IDF matching scikit-learn: log((1 + n) / (1 + df)) + 1
      this.idf.set(term, Math.log((1 + this.docCount) / (1 + count)) + 1);
    }
    return this;
  }

  transform(document: string): SparseVector {
    const tokens = extractNgrams(tokenizeAndLemmatize(document), 2);
    const tf = new Map<string, number>();
    for (const t of tokens) {
      tf.set(t, (tf.get(t) ?? 0) + 1);
    }

    const vec: SparseVector = new Map();
    let normSq = 0;
    const defaultIdf = Math.log(1 + Math.max(this.docCount, 1)) + 1;

    for (const [term, count] of tf.entries()) {
      const sublinearTf = 1 + Math.log(count);
      const idfVal = this.idf.get(term) ?? defaultIdf * 0.5;
      const weight = sublinearTf * idfVal;
      vec.set(term, weight);
      normSq += weight * weight;
    }

    const norm = Math.sqrt(normSq);
    if (norm > 0) {
      for (const [k, v] of vec.entries()) {
        vec.set(k, v / norm);
      }
    }
    return vec;
  }
}

/**
 * Dense Semantic Embedding Engine (latent domain-concept space approximating SBERT semantics
 * deterministically in-process without external latency, capturing synonymy & cross-concept affinity).
 */
const SEMANTIC_CONCEPT_CLUSTERS: Record<string, string[]> = {
  nlp: [
    'nlp', 'natural', 'language', 'spacy', 'bert', 'sbert', 'sentence-bert', 'transformer',
    'embedding', 'tokenization', 'lemmatization', 'ner', 'entity', 'corpus', 'text', 'tfidf',
    'tf-idf', 'cosine', 'semantic', 'retrieval', 'rag', 'llm', 'summarization', 'classification',
    'sentiment', 'parsing', 'phrasematcher', 'huggingface', 'ocr',
  ],
  machine_learning: [
    'machine', 'learning', 'ml', 'model', 'scikit-learn', 'sklearn', 'classifier', 'regression',
    'svc', 'svm', 'xgboost', 'random', 'forest', 'feature', 'validation', 'precision', 'recall',
    'f1', 'confusion', 'matrix', 'ranking', 'recommendation', 'predict', 'evaluation', 'metric',
  ],
  deep_learning: [
    'deep', 'neural', 'pytorch', 'tensorflow', 'keras', 'cnn', 'rnn', 'lstm', 'attention',
    'fine-tune', 'gpu', 'cuda', 'vision', 'opencv', 'generative', 'encoder', 'architecture',
  ],
  data_science: [
    'data', 'science', 'scientist', 'pandas', 'numpy', 'jupyter', 'notebook', 'kaggle',
    'dataset', 'experiment', 'statistic', 'bayesian', 'hypothesis', 'analysis', 'insight',
  ],
  data_analytics: [
    'analytic', 'analyst', 'sql', 'bi', 'tableau', 'power', 'looker', 'dashboard', 'kpi',
    'visualization', 'chart', 'report', 'excel', 'cohort', 'funnel', 'forecast',
  ],
  data_engineering: [
    'etl', 'elt', 'pipeline', 'airflow', 'spark', 'pyspark', 'kafka', 'dbt', 'warehouse',
    'bigquery', 'snowflake', 'ingestion', 'streaming', 'batch', 'schema',
  ],
  backend: [
    'backend', 'api', 'rest', 'restful', 'fastapi', 'express', 'node.js', 'django', 'flask',
    'spring', 'microservice', 'server', 'endpoint', 'swagger', 'openapi', 'graphql', 'auth',
    'jwt', 'middleware', 'pydantic', 'scalability', 'latency',
  ],
  frontend: [
    'frontend', 'react', 'next.js', 'vue.js', 'angular', 'typescript', 'javascript', 'html5',
    'css3', 'tailwind', 'redux', 'ui', 'ux', 'responsive', 'component', 'accessibility', 'wcag',
    'browser', 'spa', 'vite', 'dom', 'recharts',
  ],
  web_engineering: [
    'full-stack', 'fullstack', 'web', 'application', 'software', 'engineer', 'developer',
    'typescript', 'javascript', 'react', 'node.js', 'git', 'testing', 'playwright', 'jest',
  ],
  database: [
    'database', 'postgresql', 'postgres', 'sqlite', 'mongodb', 'redis', 'sql', 'sqlalchemy',
    'orm', 'migration', 'index', 'query', 'relational', 'persistence', 'schema',
  ],
  cloud: [
    'cloud', 'aws', 'gcp', 'azure', 'cloud-run', 's3', 'ec2', 'lambda', 'serverless', 'iam',
    'vpc', 'deployment', 'production', 'infrastructure', 'render', 'railway',
  ],
  devops: [
    'devops', 'docker', 'kubernetes', 'k8s', 'ci/cd', 'github', 'terraform', 'linux', 'bash',
    'container', 'helm', 'monitoring', 'observability', 'prometheus', 'grafana', 'sre',
  ],
  security: [
    'security', 'cybersecurity', 'owasp', 'penetration', 'siem', 'zero-trust', 'appsec',
    'encryption', 'vulnerability', 'compliance', 'soc', 'audit', 'authentication', 'oauth',
  ],
  product: [
    'product', 'roadmap', 'prd', 'strategy', 'agile', 'scrum', 'jira', 'discovery', 'stakeholder',
    'prioritization', 'launch', 'adoption', 'retention', 'customer', 'growth',
  ],
  ui_ux: [
    'design', 'figma', 'wireframe', 'prototype', 'usability', 'typography', 'layout', 'interaction',
    'design-system', 'visual', 'branding', 'creative',
  ],
  hr: [
    'recruit', 'recruiter', 'talent', 'acquisition', 'hiring', 'screening', 'ats', 'candidate',
    'interview', 'onboarding', 'hr', 'hris', 'compensation', 'diversity', 'sourcing',
  ],
  leadership: [
    'lead', 'leader', 'leadership', 'mentor', 'architect', 'principal', 'staff', 'senior',
    'director', 'manager', 'strategy', 'cross-functional', 'ownership', 'executive',
  ],
  systems: [
    'system', 'distributed', 'c++', 'rust', 'go', 'golang', 'concurrency', 'memory', 'network',
    'protocol', 'compiler', 'kernel', 'performance', 'throughput',
  ],
  enterprise: [
    'enterprise', 'java', 'spring', 'c#', '.net', 'salesforce', 'sap', 'erp', 'b2b', 'saas',
  ],
  testing: [
    'test', 'pytest', 'jest', 'vitest', 'playwright', 'cypress', 'qa', 'automation', 'tdd',
    'coverage', 'regression', 'benchmark',
  ],
  business: [
    'business', 'finance', 'revenue', 'roi', 'budget', 'stakeholder', 'client', 'consulting',
    'communication', 'presentation', 'operations',
  ],
  python_api: [
    'python', 'fastapi', 'flask', 'django', 'pydantic', 'sqlalchemy', 'uvicorn', 'pytest', 'alembic',
  ],
  statistics: [
    'statistic', 'probability', 'regression', 'anova', 'p-value', 'bayesian', 'sampling', 'r', 'correlation',
  ],
  performance: [
    'optimize', 'optimization', 'profiling', 'benchmark', 'cache', 'caching', 'parallel', 'async',
  ],
};

const CLUSTER_KEYS = Object.keys(SEMANTIC_CONCEPT_CLUSTERS);
const TOKEN_TO_CLUSTERS = new Map<string, number[]>();

CLUSTER_KEYS.forEach((clusterKey, idx) => {
  for (const term of SEMANTIC_CONCEPT_CLUSTERS[clusterKey]) {
    const existing = TOKEN_TO_CLUSTERS.get(term) ?? [];
    existing.push(idx);
    TOKEN_TO_CLUSTERS.set(term, existing);
  }
});

// Deterministic character trigram hash projection into extra 40 dims (total 64 dims)
const HASH_DIMS = 40;
const TOTAL_DIMS = CLUSTER_KEYS.length + HASH_DIMS;

function hashToken(token: string): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Generates a normalized 64-dim semantic embedding vector combining:
 * 1) Latent domain concept axes (24 dimensions) boosted by ESCO skill-to-axis mappings
 * 2) Character-trigram & lemma projection (40 dimensions) for fine-grained lexical semantics
 */
export function computeSemanticEmbedding(text: string): number[] {
  const vec = new Array<number>(TOTAL_DIMS).fill(0);
  const tokens = tokenizeAndLemmatize(text);
  const { skills } = extractSkills(text);

  // Concept cluster signals from tokens
  for (const tok of tokens) {
    const clusters = TOKEN_TO_CLUSTERS.get(tok);
    if (clusters) {
      for (const cIdx of clusters) {
        vec[cIdx] += 1.0;
      }
    }
    // Signed feature hashing into sub-lexical semantic dimensions
    const h = hashToken(tok);
    const dim = CLUSTER_KEYS.length + (h % HASH_DIMS);
    const sign = (h & 1) === 0 ? 1 : -1;
    vec[dim] += sign * 0.45;
  }

  // Canonical ESCO skills strongly activate their latent semantic axes
  for (const skill of skills) {
    const entry = SKILL_BY_CANONICAL.get(skill);
    if (!entry) continue;
    for (const axis of entry.semanticAxes) {
      const idx = CLUSTER_KEYS.indexOf(axis);
      if (idx >= 0) {
        vec[idx] += 2.2;
      }
    }
  }

  // Log-dampen cluster counts to prevent repetition gaming (keyword stuffing)
  for (let i = 0; i < CLUSTER_KEYS.length; i++) {
    if (vec[i] > 0) {
      vec[i] = 1 + Math.log(1 + vec[i]);
    }
  }

  // L2 normalize
  let normSq = 0;
  for (let i = 0; i < TOTAL_DIMS; i++) {
    normSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(normSq);
  if (norm > 0) {
    for (let i = 0; i < TOTAL_DIMS; i++) {
      vec[i] /= norm;
    }
  }

  return vec;
}

export function computeDocumentSimilarities(
  resumeText: string,
  jobDescription: string,
  corpusTexts: string[] = []
): {
  tfidfSimilarity: number;
  semanticSimilarity: number;
  combinedSemantic: number;
} {
  const fitDocs = [jobDescription, resumeText, ...corpusTexts];
  const vectorizer = new TfidfVectorizer().fit(fitDocs);
  const jdTfidf = vectorizer.transform(jobDescription);
  const resTfidf = vectorizer.transform(resumeText);
  const tfidfRaw = cosineSimilaritySparse(jdTfidf, resTfidf);

  const jdEmb = computeSemanticEmbedding(jobDescription);
  const resEmb = computeSemanticEmbedding(resumeText);
  const semRaw = cosineSimilarityDense(jdEmb, resEmb);

  // Calibrate TF-IDF (sparse cosine on different-length docs tends to sit in 0.08–0.55)
  const tfidfCalibrated = Math.min(1, Math.pow(tfidfRaw, 0.65));
  const semanticCalibrated = Math.min(1, Math.max(0, semRaw));

  // Combined semantic representation: 65% dense semantic + 35% TF-IDF lexical
  const combinedSemantic = Math.min(1, 0.65 * semanticCalibrated + 0.35 * tfidfCalibrated);

  return {
    tfidfSimilarity: Math.round(tfidfCalibrated * 1000) / 1000,
    semanticSimilarity: Math.round(semanticCalibrated * 1000) / 1000,
    combinedSemantic: Math.round(combinedSemantic * 1000) / 1000,
  };
}

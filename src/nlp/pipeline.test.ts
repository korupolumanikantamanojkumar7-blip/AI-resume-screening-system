import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanText, lemmatizeToken, tokenizeAndLemmatize } from './preprocessor';
import {
  anonymizeCandidateText,
  extractEducationLevel,
  extractEntities,
  extractSkills,
  extractYearsOfExperience,
  segmentResumeSections,
} from './extractor';
import { computeDocumentSimilarities, TfidfVectorizer, cosineSimilaritySparse } from './vectorizer';
import {
  computePrecisionAtK,
  parseResumeText,
  recalculateWeightedScore,
  scoreCandidateAgainstJob,
} from './ranker';
import { classifyResumeText, getClassifierEvaluationMetrics } from './classifier';
import { DEMO_RESUMES, SAMPLE_JOB_POSTING } from './sampleCorpus';

test('preprocessor cleans noise, removes stopwords, and lemmatizes tokens', () => {
  const raw = 'Built scalable pipelines using Python & PyTorch! Email: test@example.com https://github.com/u';
  const cleaned = cleanText(raw);
  assert.equal(cleaned.includes('test@example.com'), false);
  assert.equal(cleaned.includes('https://'), false);
  assert.equal(lemmatizeToken('pipelines'), 'pipeline');
  assert.equal(lemmatizeToken('developed'), 'develop');
  const tokens = tokenizeAndLemmatize(raw);
  assert.ok(tokens.includes('python'));
  assert.ok(tokens.includes('pytorch'));
  assert.equal(tokens.includes('using'), false);
});

test('PhraseMatcher extracts canonical skills from aliases including special symbols', () => {
  const text = 'Experienced with js, ts, k8s, postgres, sklearn, sbert, c++, and ci/cd pipelines.';
  const { skills } = extractSkills(text);
  assert.ok(skills.includes('javascript'), 'js alias should map to javascript');
  assert.ok(skills.includes('typescript'), 'ts alias should map to typescript');
  assert.ok(skills.includes('kubernetes'), 'k8s alias should map to kubernetes');
  assert.ok(skills.includes('postgresql'), 'postgres alias should map to postgresql');
  assert.ok(skills.includes('scikit-learn'), 'sklearn alias should map to scikit-learn');
  assert.ok(skills.includes('sentence-bert'), 'sbert alias should map to sentence-bert');
  assert.ok(skills.includes('c++'), 'c++ should be extracted accurately');
  assert.ok(skills.includes('ci/cd'), 'ci/cd should be extracted accurately');
});

test('NER extracts name, email, phone, locations, organizations, education, and sections', () => {
  const sample = DEMO_RESUMES[0].text;
  const entities = extractEntities(sample, DEMO_RESUMES[0].fileName);
  assert.equal(entities.name, 'Ananya Deshmukh');
  assert.equal(entities.email, 'ananya.deshmukh@example.com');
  assert.equal(entities.phone, '(415) 555-0182');
  assert.ok(entities.locations.includes('San Francisco'));
  assert.ok(entities.organizations.length >= 1);

  const edu = extractEducationLevel(sample);
  assert.equal(edu.level, 'Master');

  const sections = segmentResumeSections(sample);
  assert.ok(sections.experience.includes('Veridian AI Systems'));
  assert.ok(sections.education.includes('Stanford University'));
  assert.ok(sections.skills.includes('spaCy'));
});

test('experience extraction merges overlapping date ranges without double counting', () => {
  const resumeWithOverlap = `
EXPERIENCE
Senior Engineer at Alpha Corp (Jan 2020 - Dec 2023)
Advisory Consultant at Beta Labs (Jan 2021 - Dec 2022)
`;
  const years = extractYearsOfExperience(resumeWithOverlap, 2026);
  assert.ok(years >= 3.8 && years <= 4.3, `Expected ~4.0 merged years, got ${years}`);
});

test('anonymized screening mode redacts PII, pronouns, and graduation year cues', () => {
  const sample = 'Ms. Elena Rostova (elena@example.com, 212-555-0194). She graduated in 2019.';
  const entities = extractEntities(sample);
  const redacted = anonymizeCandidateText(sample, entities, 'Candidate #A101');
  assert.equal(redacted.includes('Elena'), false);
  assert.equal(redacted.includes('elena@example.com'), false);
  assert.equal(redacted.includes('212-555-0194'), false);
  assert.equal(redacted.includes('2019'), false);
  assert.ok(redacted.includes('Candidate #A101'));
});

test('TF-IDF + semantic similarity ranks strong NLP match significantly higher than HR resume', () => {
  const nlpResume = DEMO_RESUMES[0].text;
  const hrResume = DEMO_RESUMES[9].text;
  const jd = SAMPLE_JOB_POSTING.description;

  const nlpSim = computeDocumentSimilarities(nlpResume, jd);
  const hrSim = computeDocumentSimilarities(hrResume, jd);

  assert.ok(
    nlpSim.combinedSemantic > hrSim.combinedSemantic + 0.15,
    `Expected NLP candidate (${nlpSim.combinedSemantic}) >> HR candidate (${hrSim.combinedSemantic})`
  );

  // Also test TfidfVectorizer directly
  const vec = new TfidfVectorizer().fit([jd, nlpResume, hrResume]);
  const s1 = cosineSimilaritySparse(vec.transform(jd), vec.transform(nlpResume));
  const s2 = cosineSimilaritySparse(vec.transform(jd), vec.transform(hrResume));
  assert.ok(s1 > s2);
});

test('weighted ranking engine ranks top NLP candidate #1 and updates smoothly with custom weights', () => {
  const parsedTop = parseResumeText(DEMO_RESUMES[0].text, DEMO_RESUMES[0].fileName);
  const parsedJunior = parseResumeText(DEMO_RESUMES[8].text, DEMO_RESUMES[8].fileName);
  const parsedHr = parseResumeText(DEMO_RESUMES[9].text, DEMO_RESUMES[9].fileName);

  const scoreTop = scoreCandidateAgainstJob(parsedTop, SAMPLE_JOB_POSTING);
  const scoreJunior = scoreCandidateAgainstJob(parsedJunior, SAMPLE_JOB_POSTING);
  const scoreHr = scoreCandidateAgainstJob(parsedHr, SAMPLE_JOB_POSTING);

  assert.ok(scoreTop.finalScore > scoreJunior.finalScore);
  assert.ok(scoreJunior.finalScore > scoreHr.finalScore);
  assert.equal(scoreTop.missingSkills.length, 0);
  assert.ok(scoreHr.skillGapSuggestions.length >= 3);

  const eduHeavyScore = recalculateWeightedScore(scoreTop, {
    semantic: 0.1,
    skillMatch: 0.1,
    experience: 0.1,
    education: 0.7,
  });
  assert.ok(eduHeavyScore >= 85 && eduHeavyScore <= 100);
});

test('resume category classifier achieves high accuracy and Precision@K on held-out test set', () => {
  const metrics = getClassifierEvaluationMetrics();
  assert.ok(metrics.accuracy >= 0.85, `Expected accuracy >= 0.85, got ${metrics.accuracy}`);
  assert.ok(metrics.macroF1 >= 0.85, `Expected macroF1 >= 0.85, got ${metrics.macroF1}`);
  assert.ok(metrics.precisionAt3 >= 0.85, `Expected P@3 >= 0.85, got ${metrics.precisionAt3}`);
  assert.equal(metrics.confusionMatrix.length, metrics.categories.length);

  const pred = classifyResumeText(DEMO_RESUMES[7].text); // Omar DevOps SRE
  assert.equal(pred.category, 'DevOps & Cloud');
  assert.equal(computePrecisionAtK([true, true, false, true, false], 3), 0.667);
});

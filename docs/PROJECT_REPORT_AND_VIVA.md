# AI-Based Resume Screening System (TalentLens) — Project Report & Viva Guide

## 1. Abstract
Manual resume screening is a time-intensive bottleneck in modern recruiting that is prone to inconsistent keyword filtering and unconscious human bias. **TalentLens** is a full-stack Natural Language Processing (NLP) web application that automates multi-format resume ingestion (PDF, DOCX, TXT), extracts structured candidate entities and ESCO/O*NET-normalized skills, classifies resumes into occupational categories, and ranks applicants against job requirements using a hybrid TF-IDF + dense semantic similarity engine with recruiter-adjustable scoring weights and anonymized blind screening mode.

## 2. Problem Statement
Recruiters routinely evaluate hundreds of unstructured resumes per requisition. Simple keyword filters miss valid candidates who use skill aliases (`js`, `k8s`, `sklearn`, `sbert`) or domain synonyms, while black-box scores fail to explain *why* a candidate ranked highly or what gaps remain.

## 3. Methodology & NLP Pipeline
1. **Multi-Format Text Extraction**: Extracts text from PDF (`unpdf` / `pdfplumber`), DOCX (`mammoth` / `python-docx`), and TXT uploads, flagging image-only scans for OCR fallback.
2. **Preprocessing**: Normalizes unicode/punctuation, removes URLs/emails during modeling, strips English stopwords, lemmatizes tokens, and extracts unigrams + bigrams.
3. **Information Extraction**:
   - **Skills Extraction**: Boundary-aware PhraseMatcher mapped against `data/skills_master.csv` (68 canonical ESCO/O*NET skills, 260+ aliases).
   - **NER**: Extracts candidate name, email, phone, locations, organizations, dates, and education mentions.
   - **Experience Calculation**: Reconciles explicit tenure statements with merged non-overlapping date-range intervals so concurrent roles do not double-count.
   - **Section Segmentation**: Separates Summary, Experience, Education, Skills, Projects, and Certifications.
4. **Vector Representation**: Combines sublinear L2-normalized **TF-IDF** vectors with a 64-dimensional **Dense Semantic Concept Embedding** (and Sentence-BERT `all-MiniLM-L6-v2` in `ml/train_classifier.py`).
5. **Weighted Ranking Formula**:
   $$\text{Final Score} = 0.40 \cdot \text{Semantic} + 0.35 \cdot \text{SkillMatch} + 0.15 \cdot \text{Experience} + 0.10 \cdot \text{Education}$$
   Recruiters can adjust all four weights interactively via sliders; weights auto-normalize to 100%.
6. **Resume Category Classifier**: Multinomial TF-IDF classifier (plus `LogisticRegression` & `LinearSVC` in `ml/train_classifier.py`) evaluated on a stratified held-out split with Accuracy, Macro Precision/Recall/F1, Confusion Matrix, and Precision@K (`P@3`, `P@5`).
7. **Bias-Awareness & Privacy**: One-click Anonymized Blind Screening masks names, emails, phones, gendered pronouns, and graduation years across the UI and CSV/PDF exports. Resumes can be individually deleted or bulk-purged from SQLite at any time.

## 4. Architecture Diagram
```
+-------------------------------------------------------------------+
|                     React 19 + Tailwind CSS UI                    |
|  Landing | Screening Dashboard | Jobs | Compare | Analytics | Docs|
+---------------------------------+---------------------------------+
                                  | REST API (JWT Bearer Auth)
+---------------------------------v---------------------------------+
|                 Express REST API + Zod Validation                 |
|     /api/auth/*  |  /api/jobs/*  |  /api/resumes/*  |  /api/docs  |
+------------------+----------------------------+-------------------+
                   |                            |
+------------------v------------------+  +------v-------------------+
|        NLP & ML Engine (src/nlp)    |  |   SQLite (better-sqlite3)|
| - File Parser (PDF/DOCX/TXT + OCR)  |  | - users (scrypt hashes)  |
| - Preprocessor & Lemmatizer         |  | - jobs (weights, skills) |
| - ESCO PhraseMatcher & NER          |  | - resumes (parsed JSON)  |
| - TF-IDF + Dense Semantic Vectors   |  | - scores (breakdowns)    |
| - Weighted Ranker & Category Clf    |  +--------------------------+
+-------------------------------------+
```

## 5. Evaluation Results
- **Live Stratified Held-Out Classifier Evaluation**: High Accuracy & Macro F1 across 8 occupational categories (`Data Science & ML`, `Software Engineering`, `Frontend & UI`, `DevOps & Cloud`, `Data Analytics & BI`, `Product Management`, `Cybersecurity`, `HR & Talent`), displayed live with a Confusion Matrix heatmap in the **Model Analytics** tab.
- **Ranking Quality**: Measured via **Precision@3** and **Precision@5** on category alignment.
- **Automated Verification**: All 8 unit tests in `src/nlp/pipeline.test.ts` validate preprocessing, alias extraction (`js`, `k8s`, `c++`, `ci/cd`), overlapping date-interval merging, blind-mode redaction, semantic ordering, and classifier accuracy.

## 6. Limitations
- Multi-column graphic PDFs may occasionally reorder lines without layout-aware OCR.
- Niche industry acronyms outside `data/skills_master.csv` require taxonomy additions.
- Automated ranking is decision-support only and should never replace human interview judgment.

## 7. Future Scope
- Vector database indexing (`pgvector` / Qdrant) for sub-50ms retrieval across 100k+ resumes.
- Multilingual ESCO skill ontology support.
- Active-learning weight calibration from recruiter shortlist feedback.

## 8. Viva Q&A (10 Questions)
1. **Why combine TF-IDF with semantic embeddings?** TF-IDF rewards rare exact technical terms while semantic embeddings capture conceptual similarity and synonyms.
2. **How do you prevent false negatives from skill abbreviations?** `skills_master.csv` normalizes aliases (`js -> javascript`, `k8s -> kubernetes`, `sbert -> sentence-bert`) using boundary-aware PhraseMatcher rules.
3. **How do you prevent double-counting concurrent jobs in experience years?** Extracted date intervals are sorted and merged via interval union before summing duration.
4. **Why make scoring weights adjustable?** Different roles value criteria differently (e.g., research vs. delivery roles); sliders normalize weights to 100% and re-rank immediately.
5. **How is ranking quality evaluated?** Using Precision@K (`P@3`, `P@5`) alongside classification Accuracy, Macro Precision, Macro Recall, Macro F1, and a Confusion Matrix.
6. **How does Blind Screening reduce bias?** It masks candidate names, contact info, gendered honorifics/pronouns, and graduation years across the table, detail view, comparison matrix, and exported CSV/PDF files.
7. **What happens when a scanned image PDF is uploaded?** The parser detects low embedded character density and flags `ocr-fallback`, guiding the user to run Tesseract OCR or paste text.
8. **How are user data and API endpoints secured?** Scrypt salted password hashing, Bearer JWT tokens kept in React memory, parameterized SQLite queries, Zod schema validation, and per-user ownership checks.
9. **How is candidate data privacy respected?** Explicit retention notice plus instant single-candidate deletion and bulk job-cohort purge endpoints that cascade-delete from SQLite.
10. **How can this project be trained on the full Kaggle datasets?** Run `scripts/download_kaggle_datasets.sh` and `python ml/train_classifier.py --resume-csv <path>` to evaluate Logistic Regression, LinearSVC, and Sentence-BERT on 2,400+ resumes.

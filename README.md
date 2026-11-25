# TalentLens — AI-Based Resume Screening System

An end-to-end NLP-powered Resume Screening and Candidate Ranking web application featuring multi-format resume parsing (PDF, DOCX, TXT), ESCO/O*NET alias-normalized skill extraction, Named Entity Recognition (NER), hybrid TF-IDF + dense semantic matching, recruiter-adjustable scoring weights, anonymized blind screening mode, interactive analytics, and SQLite persistence.

## Project Folder Structure

```
.
├── server.ts                         # Express REST API, JWT auth, SQLite, Swagger docs, Vite middleware
├── Dockerfile                        # Container build for Render / Railway / HF Spaces
├── data/
│   └── skills_master.csv             # ESCO/O*NET-aligned skills taxonomy with aliases & upskilling tips
├── scripts/
│   └── download_kaggle_datasets.sh   # Kaggle CLI commands for Bhawal, Dutta & LinkedIn datasets
├── ml/
│   ├── requirements.txt              # Python spaCy + Sentence-BERT + scikit-learn dependencies
│   └── train_classifier.py           # Offline training & evaluation on Kaggle CSVs (LogReg/LinearSVC/SBERT)
├── docs/
│   └── PROJECT_REPORT_AND_VIVA.md    # Project report outline + 10 Viva Q&A
└── src/
    ├── nlp/
    │   ├── skillsTaxonomy.ts         # Canonical skills & alias normalizer
    │   ├── preprocessor.ts           # Cleaning, stopword removal, lemmatization, n-grams
    │   ├── extractor.ts              # PhraseMatcher, NER, date-union experience, education, blind redactor
    │   ├── vectorizer.ts             # TF-IDF vectorizer + dense semantic concept embeddings + cosine sim
    │   ├── classifier.ts             # Multinomial TF-IDF classifier + held-out metrics & confusion matrix
    │   ├── ranker.ts                 # Weighted ranking engine, explanations, skill-gap recommender, P@K
    │   ├── sampleCorpus.ts           # 10 realistic sample resumes + sample JD + 64-sample training corpus
    │   └── pipeline.test.ts          # Unit tests (node:test) for extraction, ranking, and classification
    ├── server/
    │   ├── db.ts                     # SQLite schema (users, jobs, resumes, scores) + parameterized queries
    │   ├── auth.ts                   # scrypt password hashing + JWT auth middleware
    │   ├── fileParser.ts             # PDF (unpdf), DOCX (mammoth), TXT extractor + OCR fallback detection
    │   └── openapi.ts                # OpenAPI 3.0 JSON & interactive HTML docs at /api/docs
    ├── components/
    │   ├── LandingPage.tsx
    │   ├── AuthModal.tsx
    │   ├── WorkspaceSidebar.tsx
    │   ├── ScreeningDashboard.tsx
    │   ├── JobsManager.tsx
    │   ├── CandidateDetailModal.tsx
    │   ├── CompareCandidatesView.tsx
    │   ├── AnalyticsView.tsx
    │   └── DocsAndDatasetsView.tsx
    └── utils/
        └── exportUtils.ts            # CSV and jsPDF candidate ranking export
```

## Quick Start (Windows, macOS & Linux)

### 1. Install Dependencies & Run Web App
```bash
npm install
npm run dev
```
Open **http://localhost:3000** in your browser. OpenAPI/Swagger documentation is live at **http://localhost:3000/api/docs**.

### 2. Run Unit Tests
```bash
npm test
```

### 3. Production Build
```bash
npm run build
NODE_ENV=production npm start
```

### 4. Download Kaggle Datasets & Run Python Benchmark (Optional Offline ML Training)
```bash
# macOS / Linux
bash scripts/download_kaggle_datasets.sh

# Windows PowerShell
pip install kaggle
kaggle datasets download -d snehaanbhawal/resume-dataset -p data/raw/resumes_bhawal --unzip
kaggle datasets download -d gauravduttakiit/resume-dataset -p data/raw/resumes_dutta --unzip
kaggle datasets download -d arshkon/linkedin-job-postings -p data/raw/linkedin_jobs --unzip

# Train & evaluate LinearSVC, Logistic Regression & Sentence-BERT Precision@5
pip install -r ml/requirements.txt
python -m spacy download en_core_web_sm
python ml/train_classifier.py --resume-csv data/raw/resumes_bhawal/Resume/Resume.csv
```

## Uploading to GitHub
```bash
git init
git add .
git commit -m "Initial commit: TalentLens AI-Based Resume Screening System"
git branch -M main
git remote add origin https://github.com/<your-username>/ai-resume-screening-system.git
git push -u origin main
```

## Deployment (Render / Railway / Hugging Face Spaces)
- **Render / Railway**: Connect your GitHub repo, choose **Docker** (uses included `Dockerfile`) or Node (`Build: npm run build`, `Start: npm start`), set `PORT=3000` and optionally `JWT_SECRET`.
- **Hugging Face Spaces**: Create a new **Docker** Space, push this repository, and configure `app_port: 3000` in your Space README frontmatter.

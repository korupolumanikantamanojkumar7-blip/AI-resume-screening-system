import { EducationLevel } from '../types/screening';

export interface LabeledResumeSample {
  id: string;
  category: string;
  text: string;
}

export interface DemoJobSeed {
  title: string;
  department: string;
  location: string;
  description: string;
  requiredSkills: string[];
  minExperience: number;
  educationRequirement: EducationLevel;
}

export interface DemoResumeSeed {
  fileName: string;
  text: string;
}

export const SAMPLE_JOB_POSTING: DemoJobSeed = {
  title: 'Senior Full-Stack & NLP Engineer',
  department: 'Applied AI & Platform Engineering',
  location: 'San Francisco, CA / Hybrid',
  minExperience: 4,
  educationRequirement: 'Bachelor',
  requiredSkills: [
    'Python',
    'Natural Language Processing',
    'spaCy',
    'Sentence-BERT',
    'scikit-learn',
    'FastAPI',
    'React',
    'TypeScript',
    'PostgreSQL',
    'Docker',
  ],
  description: `We are seeking a Senior Full-Stack & NLP Engineer to architect and scale our automated talent intelligence and document screening platform.

Key Responsibilities:
- Design and maintain production Natural Language Processing (NLP) pipelines using Python, spaCy (PhraseMatcher, EntityRuler, NER), scikit-learn (TF-IDF, LinearSVC), and Sentence-BERT (all-MiniLM-L6-v2) semantic embeddings.
- Build high-throughput REST APIs with FastAPI, Pydantic validation, and SQLAlchemy backed by PostgreSQL or SQLite.
- Develop clean, responsive recruiter dashboards in React, TypeScript, and Tailwind CSS with data visualization charts.
- Containerize and deploy ML inference services with Docker and CI/CD pipelines on AWS or GCP.
- Collaborate with product managers and recruiters to reduce hiring bias through explainable scoring and anonymized screening workflows.

Qualifications:
- Bachelor's or Master's degree in Computer Science, Data Science, or related field.
- 4+ years of hands-on experience in software engineering and applied NLP/machine learning.
- Strong command of Python, TypeScript, React, FastAPI, PostgreSQL, Docker, and automated testing (pytest/Jest).`,
};

export const DEMO_RESUMES: DemoResumeSeed[] = [
  {
    fileName: 'Ananya_Deshmukh_NLP_FullStack.pdf',
    text: `Ananya Deshmukh
San Francisco, CA | ananya.deshmukh@example.com | (415) 555-0182

SUMMARY
Senior Applied NLP & Full-Stack Engineer with 6+ years of experience building document extraction systems, semantic search engines, and React analytics platforms.

EXPERIENCE
Lead NLP Platform Engineer at Veridian AI Systems (Jan 2022 - Present)
- Architected an automated resume and contract screening pipeline using Python, spaCy EntityRuler/PhraseMatcher, TF-IDF, and Sentence-BERT (all-MiniLM-L6-v2) embeddings.
- Trained Logistic Regression and Linear SVC document classifiers in scikit-learn achieving 93% macro F1 across 24 occupational categories.
- Built low-latency FastAPI microservices with Pydantic validation, SQLAlchemy ORM, and PostgreSQL (pgvector).
- Led frontend development of the recruiter ranking workspace using React, TypeScript, Tailwind CSS, and Recharts.
- Containerized inference workers with Docker and automated deployment via GitHub Actions CI/CD on AWS ECS.

Software Engineer at Northstar Analytics Corp. (Jun 2019 - Dec 2021)
- Built REST APIs with FastAPI and Node.js serving 40k daily document parsing jobs (pdfplumber, OCR fallback).
- Mentored 3 junior engineers and instituted pytest and Playwright integration test suites.

EDUCATION
M.S. in Computer Science (NLP Track), Stanford University, 2019
B.Tech in Computer Engineering, Pune Institute of Computer Technology, 2017

SKILLS
Python, TypeScript, React, FastAPI, Natural Language Processing, spaCy, Sentence-BERT, scikit-learn, PyTorch, Hugging Face, PostgreSQL, SQLAlchemy, Docker, AWS, CI/CD, Git, pytest, Tailwind CSS`,
  },
  {
    fileName: 'Marcus_Vance_ML_Backend.pdf',
    text: `Marcus Vance
Seattle, WA | marcus.vance@example.com | (206) 555-0147

SUMMARY
Machine Learning and Backend Engineer with 5 years of experience deploying NLP classification models and Python APIs at scale.

EXPERIENCE
Senior ML Engineer at Cascade Data Labs (Mar 2022 - Present)
- Built hybrid retrieval and ranking engines combining TF-IDF, Sentence-BERT embeddings, and cosine similarity scoring in Python and scikit-learn.
- Developed spaCy custom NER pipelines extracting skills, job titles, and employment durations from unstructured PDFs.
- Designed FastAPI REST endpoints with PostgreSQL, Redis caching, and Docker Compose environments.
- Improved ranking Precision@5 from 0.71 to 0.89 through domain skill taxonomy normalization.

Data Scientist at Rainier Technologies Inc. (Jul 2020 - Feb 2022)
- Built text classification models with PyTorch, Hugging Face Transformers, Pandas, and NumPy.
- Created internal evaluation dashboards using React and Chart.js.

EDUCATION
Master of Science in Data Science, University of Washington, 2020
B.S. in Statistics, Oregon State University, 2018

SKILLS
Python, Natural Language Processing, spaCy, Sentence-BERT, scikit-learn, PyTorch, FastAPI, PostgreSQL, Redis, Docker, Kubernetes, AWS, React, Pandas, NumPy, Statistics`,
  },
  {
    fileName: 'Elena_Rostova_FullStack_AI.docx',
    text: `Elena Rostova
New York, NY | elena.rostova@example.com | (212) 555-0194

SUMMARY
Full-Stack Software Engineer with 5+ years of experience specializing in React, TypeScript, Node.js, Python APIs, and applied LLM/NLP workflows.

EXPERIENCE
Senior Full-Stack Engineer at Mercer Talent Systems (Aug 2021 - Present)
- Built recruiter dashboards and side-by-side candidate comparison UIs in React, TypeScript, Next.js, and Tailwind CSS.
- Implemented backend APIs in FastAPI and Express with JWT authentication, PostgreSQL, and SQLite prototypes.
- Integrated semantic search using Sentence-BERT embeddings and Hugging Face models to match job descriptions with applicant profiles.
- Automated Docker builds and GitHub Actions CI/CD testing pipelines.

Full-Stack Developer at Harborline Software LLC (May 2019 - Jul 2021)
- Developed TypeScript React applications, GraphQL endpoints, and REST APIs.
- Collaborated with UX designers in Figma to ensure WCAG AA accessibility.

EDUCATION
B.S. in Computer Science, New York University, 2019

SKILLS
TypeScript, JavaScript, React, Next.js, Tailwind CSS, Python, FastAPI, Node.js, Express, PostgreSQL, Docker, CI/CD, Sentence-BERT, Hugging Face, LLMs, REST API, Git, Testing`,
  },
  {
    fileName: 'David_Kim_NLP_Research.pdf',
    text: `David Kim
Boston, MA | david.kim@example.com | (617) 555-0133

SUMMARY
Applied NLP Scientist (PhD) with 4 years of industry and research experience in information extraction, transformer encoders, and ranking evaluation.

EXPERIENCE
NLP Research Engineer at Beacon AI Labs (Jan 2023 - Present)
- Designed custom spaCy NER and PhraseMatcher pipelines aligned with ESCO/O*NET skill ontologies.
- Fine-tuned DeBERTa and Sentence-BERT encoders in PyTorch and Hugging Face for cross-domain job-resume matching.
- Published internal benchmarks evaluating TF-IDF vs dense embeddings on Precision@K and NDCG.
- Built Python FastAPI inference prototypes containerized with Docker.

Graduate Research Assistant at MIT CSAIL (Sep 2019 - Dec 2022)
- Researched bias mitigation and counterfactual anonymization in automated resume screening systems.
- Implemented reproducible ML experiments using scikit-learn, Pandas, NumPy, and MLflow.

EDUCATION
Ph.D. in Computer Science (Computational Linguistics), Massachusetts Institute of Technology, 2022
B.S. in Mathematics & Computer Science, UC Berkeley, 2017

SKILLS
Python, Natural Language Processing, spaCy, Sentence-BERT, PyTorch, Hugging Face, scikit-learn, Machine Learning, Deep Learning, FastAPI, Docker, SQL, Pandas, NumPy, Statistics, MLOps`,
  },
  {
    fileName: 'Priya_Nair_Backend_Data.docx',
    text: `Priya Nair
Austin, TX | priya.nair@example.com | (512) 555-0165

SUMMARY
Backend & Data Platform Engineer with 6 years of experience building Python APIs, ETL pipelines, and relational databases.

EXPERIENCE
Staff Backend Engineer at RedRiver Cloud Systems (Feb 2021 - Present)
- Engineered scalable FastAPI and Django REST APIs handling 10M monthly requests backed by PostgreSQL and SQLAlchemy.
- Built document ingestion ETL pipelines in Python, Apache Airflow, and Docker on GCP Cloud Run.
- Implemented scikit-learn anomaly detection and basic TF-IDF text indexing for search features.
- Led security reviews implementing OAuth2, JWT auth, and parameterized SQL standards.

Software Engineer at LoneStar Analytics Inc. (Jun 2018 - Jan 2021)
- Maintained Flask services, PostgreSQL warehouses, and automated pytest CI/CD pipelines.

EDUCATION
B.E. in Information Science, RV College of Engineering, 2018

SKILLS
Python, FastAPI, Django, Flask, PostgreSQL, SQLAlchemy, SQL, Docker, Kubernetes, GCP, AWS, CI/CD, Data Engineering, scikit-learn, Cybersecurity, Linux, Git, Testing`,
  },
  {
    fileName: 'Lucas_Mendoza_Frontend_React.pdf',
    text: `Lucas Mendoza
Chicago, IL | lucas.mendoza@example.com | (312) 555-0121

SUMMARY
Senior Frontend Engineer with 5 years of experience crafting accessible React, TypeScript, and data visualization interfaces.

EXPERIENCE
Senior UI Engineer at Lakefront Digital Solutions (Apr 2021 - Present)
- Architected modular React 19 and TypeScript dashboards with Recharts, Tailwind CSS, and dark/light theming.
- Collaborated with backend engineers integrating REST APIs and GraphQL endpoints with optimistic UI states.
- Implemented end-to-end Playwright testing and WCAG AA keyboard navigation across complex data tables.

Frontend Developer at Midwest Commerce Corp. (Jul 2019 - Mar 2021)
- Built e-commerce storefronts with Next.js, JavaScript, HTML5, CSS3, and Redux Toolkit.

EDUCATION
B.S. in Software Engineering, University of Illinois Urbana-Champaign, 2019

SKILLS
React, TypeScript, JavaScript, Next.js, Tailwind CSS, HTML5, CSS3, Redux, Figma, Data Visualization, REST API, GraphQL, Node.js, Git, Testing, Communication`,
  },
  {
    fileName: 'Sophia_Chen_Data_Analyst.txt',
    text: `Sophia Chen
Denver, CO | sophia.chen@example.com | (303) 555-0178

SUMMARY
Data Scientist & BI Analyst with 3.5 years of experience in SQL analytics, Python modeling, and executive reporting dashboards.

EXPERIENCE
Data Analyst at Summit Health Analytics (Sep 2022 - Present)
- Built predictive attrition models using Python, scikit-learn (Logistic Regression, Random Forest), and Pandas.
- Authored complex PostgreSQL queries and Tableau/Power BI dashboards tracking hiring funnel conversion.
- Conducted A/B testing and statistical hypothesis testing for product teams.

Junior Data Analyst at FrontRange Solutions (Jun 2021 - Aug 2022)
- Cleaned survey text datasets in Python and automated weekly Excel and SQL reporting.

EDUCATION
M.S. in Business Analytics, University of Colorado Boulder, 2021
B.A. in Economics, University of Michigan, 2019

SKILLS
Python, SQL, PostgreSQL, scikit-learn, Pandas, NumPy, Data Visualization, Statistics, Machine Learning, Excel, Communication, Problem Solving`,
  },
  {
    fileName: 'Omar_AlMansoor_DevOps_SRE.pdf',
    text: `Omar Al-Mansoor
London, UK | omar.almansoor@example.com | +44 20 7946 0192

SUMMARY
DevOps & Site Reliability Engineer with 7 years of experience in Kubernetes, Terraform, AWS, CI/CD, and Linux infrastructure.

EXPERIENCE
Principal DevOps Engineer at Thames Cloud Systems (Jan 2021 - Present)
- Managed multi-region Kubernetes (EKS) clusters, Docker build pipelines, and Terraform IaC for 45 microservices.
- Automated zero-downtime GitHub Actions CI/CD workflows, security scanning, and PostgreSQL backups.
- Developed internal Python and Go automation tooling for log aggregation and cost optimization.

Systems Engineer at Sterling Bank Technologies (Aug 2017 - Dec 2020)
- Administered Linux servers, Jenkins pipelines, Redis clusters, and IAM zero-trust policies.

EDUCATION
B.Sc. in Computer Systems Engineering, University of Manchester, 2017

SKILLS
Docker, Kubernetes, AWS, GCP, Terraform, CI/CD, Linux, Python, Go, PostgreSQL, Redis, Cybersecurity, Microservices, Git, Leadership`,
  },
  {
    fileName: 'Chloe_Bennett_Junior_FullStack.txt',
    text: `Chloe Bennett
Atlanta, GA | chloe.bennett@example.com | (404) 555-0158

SUMMARY
Junior Full-Stack Developer with 1.5 years of experience building web applications with React, JavaScript, Python, and SQLite.

EXPERIENCE
Junior Software Developer at Peachtree Labs (Jun 2024 - Present)
- Developed React and TypeScript UI forms, filter bars, and CSV export utilities.
- Built REST endpoints in Flask and Express connected to SQLite and MongoDB databases.
- Completed capstone project implementing TF-IDF resume keyword matching in Python and scikit-learn.

Software Engineering Intern at Southern Tech Solutions (Summer 2023)
- Assisted with HTML5/CSS3 responsive bug fixes and unit testing in Jest.

EDUCATION
B.S. in Computer Science, Georgia Institute of Technology, 2024

SKILLS
Python, JavaScript, TypeScript, React, Flask, Express, Node.js, SQLite, MongoDB, scikit-learn, HTML5, CSS3, Tailwind CSS, Git`,
  },
  {
    fileName: 'Jordan_Hayes_Talent_HR.docx',
    text: `Jordan Hayes
Los Angeles, CA | jordan.hayes@example.com | (310) 555-0119

SUMMARY
Senior Technical Recruiter & Talent Operations Manager with 6 years of experience managing ATS pipelines, structured interviewing, and HR analytics.

EXPERIENCE
Lead Technical Recruiter at Pacific Crest Ventures (Feb 2021 - Present)
- Led end-to-end sourcing, candidate screening, and hiring manager calibration for engineering and data roles.
- Designed bias-aware blind resume review rubrics and diversity hiring dashboards in Excel and Tableau.
- Partnered with HRIS and ATS vendors to streamline recruiter workflows and reduce time-to-hire by 32%.

Talent Acquisition Specialist at Westside Media Group (May 2018 - Jan 2021)
- Managed full-cycle recruitment, stakeholder communication, and onboarding programs for 120+ hires.

EDUCATION
B.A. in Organizational Psychology, UCLA, 2018

SKILLS
Recruitment, Communication, Leadership, Product Management, Data Visualization, Excel, Problem Solving`,
  },
];

/**
 * Multi-category labeled resume corpus (8 occupational categories × 8 distinct samples = 64 samples)
 * modeled on Kaggle Resume Dataset (Snehaan Bhawal) & UpdatedResumeDataSet (Gaurav Dutta).
 * Used to train & evaluate the live Resume Category Classifier (stratified 75% train / 25% test).
 */
export const CLASSIFIER_CORPUS: LabeledResumeSample[] = [
  // 1. Data Science & ML (8)
  { id: 'ds-1', category: 'Data Science & ML', text: 'Data Scientist skilled in Python, scikit-learn, PyTorch, NLP, Sentence-BERT embeddings, TF-IDF vectorization, Logistic Regression, LinearSVC, Pandas, NumPy, statistical modeling, confusion matrix evaluation.' },
  { id: 'ds-2', category: 'Data Science & ML', text: 'Machine Learning Engineer developing deep learning neural networks with TensorFlow, Keras, Hugging Face Transformers, BERT fine-tuning, feature engineering, XGBoost, and MLflow experiment tracking.' },
  { id: 'ds-3', category: 'Data Science & ML', text: 'Applied NLP Scientist specializing in spaCy Named Entity Recognition, PhraseMatcher, text classification, topic modeling, retrieval augmented generation, LLM evaluation, and cosine similarity ranking.' },
  { id: 'ds-4', category: 'Data Science & ML', text: 'Senior ML Researcher with PhD in statistics and computer vision, OpenCV, PyTorch Lightning, Bayesian inference, hypothesis testing, hyperparameter tuning, precision recall F1 optimization.' },
  { id: 'ds-5', category: 'Data Science & ML', text: 'AI Engineer deploying recommender systems, semantic search embeddings, vector databases, scikit-learn pipelines, cross-validation, MLOps Kubeflow, and Python inference services.' },
  { id: 'ds-6', category: 'Data Science & ML', text: 'Quantitative Data Scientist experienced in R, Python, regression analysis, time series forecasting, random forest classifiers, gradient boosting, Pandas dataframes, and Jupyter notebooks.' },
  { id: 'ds-7', category: 'Data Science & ML', text: 'NLP & Speech Machine Learning Specialist building sentiment analysis, document OCR extraction, Tesseract, spaCy lemmatization, stopword preprocessing, and transformer classification models.' },
  { id: 'ds-8', category: 'Data Science & ML', text: 'Lead Data Scientist creating churn prediction models, uplift modeling, causal inference, deep learning CNNs, PyTorch, NumPy linear algebra, and Kaggle competition pipelines.' },

  // 2. Software Engineering (8)
  { id: 'se-1', category: 'Software Engineering', text: 'Full-Stack Software Engineer building REST APIs with FastAPI, Node.js, Express, PostgreSQL, SQLAlchemy, React, TypeScript, unit testing, pytest, microservices, and clean architecture.' },
  { id: 'se-2', category: 'Software Engineering', text: 'Senior Backend Engineer specializing in Java, Spring Boot, distributed systems, microservices, PostgreSQL query tuning, Redis caching, Kafka event streaming, and OpenAPI Swagger specs.' },
  { id: 'se-3', category: 'Software Engineering', text: 'Systems Software Engineer writing high-performance C++, Rust, Go backend services, concurrency, gRPC APIs, memory profiling, relational databases, and automated integration tests.' },
  { id: 'se-4', category: 'Software Engineering', text: 'Python Backend Developer architecting Django REST Framework and Flask web services, Pydantic input validation, SQLite, PostgreSQL migrations with Alembic, JWT authentication, and Git.' },
  { id: 'se-5', category: 'Software Engineering', text: 'Full-Stack Developer experienced with TypeScript, Node.js, GraphQL, MongoDB, Express middleware, ORM schemas, code reviews, TDD, Jest, and scalable SaaS backend platforms.' },
  { id: 'se-6', category: 'Software Engineering', text: 'Enterprise Software Developer working with C#, .NET Core, ASP.NET Web API, SQL Server, Entity Framework, Azure services, clean domain-driven design, and automated regression testing.' },
  { id: 'se-7', category: 'Software Engineering', text: 'Staff Platform Engineer designing multi-tenant API gateways, Go microservices, rate limiting with Redis, PostgreSQL partitioning, observability, and mentoring software engineers.' },
  { id: 'se-8', category: 'Software Engineering', text: 'Backend API Engineer implementing webhook processors, FastAPI async workers, SQLAlchemy models, RESTful pagination, Swagger documentation, and robust error handling in Python.' },

  // 3. Frontend & UI (8)
  { id: 'fe-1', category: 'Frontend & UI', text: 'Senior Frontend Engineer mastering React 19, TypeScript, Next.js App Router, Tailwind CSS, responsive layouts, WCAG AA accessibility, ARIA landmarks, and Vite build optimization.' },
  { id: 'fe-2', category: 'Frontend & UI', text: 'UI/UX Developer crafting design systems in Figma, HTML5, CSS3, SCSS, CSS Grid, Flexbox, dark mode theming, micro-interactions, and reusable component libraries in React.' },
  { id: 'fe-3', category: 'Frontend & UI', text: 'Frontend Architect building single-page applications with Vue.js, Pinia, JavaScript ES6, TypeScript, Chart.js, Recharts interactive visualizations, and browser performance profiling.' },
  { id: 'fe-4', category: 'Frontend & UI', text: 'Web Interface Engineer working with Angular, RxJS observables, Redux Toolkit, state management, Cypress and Playwright end-to-end UI testing, and cross-browser compatibility.' },
  { id: 'fe-5', category: 'Frontend & UI', text: 'Design Engineer bridging Figma prototyping and production React components, typography hierarchy, Tailwind CSS utility tokens, animations, and responsive mobile-first web apps.' },
  { id: 'fe-6', category: 'Frontend & UI', text: 'React Frontend Developer building interactive dashboards, sortable data tables, filter bars, client-side routing, REST API integration, skeleton loading states, and TypeScript hooks.' },
  { id: 'fe-7', category: 'Frontend & UI', text: 'Creative Web Developer focused on semantic HTML5, modern CSS3, JavaScript DOM manipulation, SVG charts, accessible forms, keyboard navigation, and component Storybook documentation.' },
  { id: 'fe-8', category: 'Frontend & UI', text: 'Lead UI Engineer modernizing legacy frontends to React, Next.js, TypeScript, Tailwind CSS, bundle splitting, Core Web Vitals optimization, and collaborative Figma handoffs.' },

  // 4. DevOps & Cloud (8)
  { id: 'ops-1', category: 'DevOps & Cloud', text: 'DevOps Engineer automating Docker containers, Kubernetes EKS clusters, Helm charts, Terraform infrastructure as code, GitHub Actions CI/CD pipelines, AWS IAM, and Linux administration.' },
  { id: 'ops-2', category: 'DevOps & Cloud', text: 'Site Reliability Engineer (SRE) managing GCP Cloud Run, GKE, Prometheus, Grafana observability, incident response, bash shell scripting, zero-downtime rollouts, and SLO monitoring.' },
  { id: 'ops-3', category: 'DevOps & Cloud', text: 'Cloud Infrastructure Architect deploying multi-region AWS VPC, EC2, S3, Lambda serverless stacks, Terraform modules, Ansible playbooks, Jenkins CI/CD, and automated disaster recovery.' },
  { id: 'ops-4', category: 'DevOps & Cloud', text: 'Platform Reliability Engineer building multi-stage Dockerfiles, container registries, Kubernetes horizontal pod autoscaling, GitLab CI runners, Ubuntu server hardening, and Nginx ingress.' },
  { id: 'ops-5', category: 'DevOps & Cloud', text: 'Azure Cloud & DevOps Specialist configuring AKS clusters, Azure DevOps release pipelines, infrastructure as code, secrets vaults, log analytics, and automated PostgreSQL backups.' },
  { id: 'ops-6', category: 'DevOps & Cloud', text: 'Release & Build Engineer maintaining continuous integration, continuous deployment, Docker Compose dev stacks, artifact caching, Linux networking, and automated smoke test gates.' },
  { id: 'ops-7', category: 'DevOps & Cloud', text: 'Cloud Operations Engineer optimizing cloud spend on AWS and GCP, Kubernetes service mesh, Terraform state management, bash automation, systemd daemons, and high-availability Redis.' },
  { id: 'ops-8', category: 'DevOps & Cloud', text: 'Senior Infrastructure Engineer scaling containerized microservices with Kubernetes, Helm, Docker, CI/CD pipelines, Linux kernel tuning, and hybrid cloud networking.' },

  // 5. Data Analytics & BI (8)
  { id: 'da-1', category: 'Data Analytics & BI', text: 'Business Intelligence Analyst crafting Tableau and Power BI executive dashboards, complex SQL window functions, CTEs, KPI tracking, cohort retention analysis, and Excel pivot tables.' },
  { id: 'da-2', category: 'Data Analytics & BI', text: 'Senior Data Analyst running SQL queries on BigQuery and PostgreSQL, Looker Studio visualizations, funnel conversion reporting, A/B test evaluation, and stakeholder presentations.' },
  { id: 'da-3', category: 'Data Analytics & BI', text: 'Marketing & Growth Analyst analyzing customer acquisition cost, attribution models, Google Analytics, Excel spreadsheets, Power Query, SQL reporting, and monthly revenue forecasting.' },
  { id: 'da-4', category: 'Data Analytics & BI', text: 'Data Engineering & BI Specialist building dbt transformation models, Airflow ETL jobs, Snowflake warehouses, SQL data quality tests, and interactive Tableau dashboards.' },
  { id: 'da-5', category: 'Data Analytics & BI', text: 'Product Data Analyst partnering with product managers on telemetry metrics, retention curves, SQL analytics, Python Pandas exploration, statistical significance, and executive slide decks.' },
  { id: 'da-6', category: 'Data Analytics & BI', text: 'Operations & Financial Data Analyst automating weekly KPI reports in Excel, SQL, Power BI, variance analysis, budget forecasting, and operational throughput dashboards.' },
  { id: 'da-7', category: 'Data Analytics & BI', text: 'Analytics Engineer maintaining clean star-schema SQL marts, dbt documentation, Looker explores, PostgreSQL reporting views, and self-serve BI metrics for business teams.' },
  { id: 'da-8', category: 'Data Analytics & BI', text: 'Healthcare Data Analyst extracting clinical operational metrics with SQL, Tableau, Excel VLOOKUP, data visualization best practices, compliance reporting, and trend analysis.' },

  // 6. Product Management (8)
  { id: 'pm-1', category: 'Product Management', text: 'Senior Product Manager owning B2B SaaS product roadmap, writing PRDs, conducting user discovery interviews, Agile Scrum sprint planning in Jira, and prioritizing engineering backlogs.' },
  { id: 'pm-2', category: 'Product Management', text: 'Technical Product Manager partnering with ML and platform engineers to define launch KPIs, A/B experimentation plans, go-to-market strategy, competitive analysis, and stakeholder alignment.' },
  { id: 'pm-3', category: 'Product Management', text: 'Growth Product Manager driving user activation, onboarding conversion, pricing experiments, customer research, funnel telemetry, cross-functional collaboration, and quarterly OKRs.' },
  { id: 'pm-4', category: 'Product Management', text: 'Group Product Manager leading enterprise workflow products, customer advisory boards, Figma wireframe reviews, release coordination, executive roadmaps, and revenue adoption targets.' },
  { id: 'pm-5', category: 'Product Management', text: 'AI Product Manager translating recruiter pain points into NLP feature requirements, evaluation rubrics, ethical AI guardrails, user research, Jira epics, and iterative product launches.' },
  { id: 'pm-6', category: 'Product Management', text: 'Product Owner facilitating Agile ceremonies, backlog grooming, acceptance criteria, customer feedback synthesis, stakeholder communication, and sprint velocity tracking.' },
  { id: 'pm-7', category: 'Product Management', text: 'Consumer Mobile Product Manager defining product vision, retention loops, usability testing, release notes, cross-functional design sprints, and app store growth strategy.' },
  { id: 'pm-8', category: 'Product Management', text: 'Director of Product Strategy aligning multi-quarter roadmaps, market sizing, pricing tiers, B2B customer discovery, PRD standards, and product-led growth execution.' },

  // 7. Cybersecurity (8)
  { id: 'sec-1', category: 'Cybersecurity', text: 'Application Security Engineer performing OWASP Top 10 code audits, penetration testing, threat modeling, JWT and OAuth2 hardening, SAST/DAST scanning, and vulnerability remediation.' },
  { id: 'sec-2', category: 'Cybersecurity', text: 'Security Operations Analyst (SOC) managing SIEM alerts, Splunk, incident response playbooks, endpoint detection, threat hunting, firewall rules, and network intrusion forensics.' },
  { id: 'sec-3', category: 'Cybersecurity', text: 'Cloud Security Architect implementing IAM least-privilege policies, zero trust networking, KMS encryption, SOC 2 Type II compliance audits, AWS Security Hub, and container image scanning.' },
  { id: 'sec-4', category: 'Cybersecurity', text: 'Red Team Penetration Tester conducting web application exploitation, Burp Suite assessments, SQL injection prevention, XSS mitigation, privilege escalation audits, and security reporting.' },
  { id: 'sec-5', category: 'Cybersecurity', text: 'Information Security Manager leading ISO 27001 governance, GDPR data privacy controls, risk assessments, vendor security reviews, and incident response tabletop exercises.' },
  { id: 'sec-6', category: 'Cybersecurity', text: 'DevSecOps Engineer embedding secrets detection, dependency vulnerability audits, supply-chain security, RBAC authorization checks, and TLS certificate automation in CI/CD.' },
  { id: 'sec-7', category: 'Cybersecurity', text: 'Identity & Access Management (IAM) Engineer administering SSO, SAML, OAuth2, OpenID Connect, MFA policies, privileged access management, and directory security.' },
  { id: 'sec-8', category: 'Cybersecurity', text: 'Cybersecurity Consultant auditing enterprise APIs for SSRF, broken access control, cryptographic weaknesses, secure cookie flags, and compliance readiness.' },

  // 8. HR & Talent (8)
  { id: 'hr-1', category: 'HR & Talent', text: 'Senior Technical Recruiter managing full-cycle hiring, candidate sourcing, resume screening, ATS pipelines (Greenhouse, Lever), hiring manager calibration, and structured interviews.' },
  { id: 'hr-2', category: 'HR & Talent', text: 'Talent Acquisition Manager designing bias-aware blind screening workflows, employer branding, diversity hiring initiatives, offer negotiation, and time-to-hire recruitment metrics.' },
  { id: 'hr-3', category: 'HR & Talent', text: 'HR Business Partner advising leadership on performance reviews, employee engagement, compensation benchmarking, organizational design, onboarding programs, and HRIS administration.' },
  { id: 'hr-4', category: 'HR & Talent', text: 'People Operations Specialist coordinating candidate experience, interview scheduling, Workday HRIS records, benefits enrollment, compliance policies, and workplace culture programs.' },
  { id: 'hr-5', category: 'HR & Talent', text: 'Executive Sourcer identifying senior engineering and data science talent via Boolean search, talent mapping, outreach campaigns, pipeline analytics, and stakeholder communication.' },
  { id: 'hr-6', category: 'HR & Talent', text: 'University & Campus Recruiting Lead running internship pipelines, career fairs, technical assessment coordination, rubric calibration, and new-grad onboarding cohorts.' },
  { id: 'hr-7', category: 'HR & Talent', text: 'Talent Operations Analyst building recruiting funnel dashboards, source-of-hire conversion reports, ATS automation, candidate retention tracking, and Excel HR reporting.' },
  { id: 'hr-8', category: 'HR & Talent', text: 'Director of Human Resources overseeing talent acquisition strategy, workforce planning, retention initiatives, labor compliance, leadership coaching, and equitable hiring rubrics.' },
];

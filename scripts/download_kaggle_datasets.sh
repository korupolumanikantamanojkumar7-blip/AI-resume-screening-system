#!/usr/bin/env bash
set -euo pipefail

# TalentLens — Kaggle Dataset Download Script
# Prerequisite: Place your Kaggle API token at ~/.kaggle/kaggle.json (chmod 600 ~/.kaggle/kaggle.json)

mkdir -p data/raw/resumes_bhawal data/raw/resumes_dutta data/raw/linkedin_jobs

echo "1/3 Downloading Snehaan Bhawal Resume Dataset (~2,400 resumes, 24 categories)..."
kaggle datasets download -d snehaanbhawal/resume-dataset -p data/raw/resumes_bhawal --unzip

echo "2/3 Downloading Gaurav Dutta UpdatedResumeDataSet (~960 resumes)..."
kaggle datasets download -d gauravduttakiit/resume-dataset -p data/raw/resumes_dutta --unzip

echo "3/3 Downloading LinkedIn Job Postings (Job Descriptions)..."
kaggle datasets download -d arshkon/linkedin-job-postings -p data/raw/linkedin_jobs --unzip

echo ""
echo "Downloads complete! Custom ESCO-aligned skills taxonomy is ready at data/skills_master.csv."
echo "Next step: python ml/train_classifier.py --resume-csv data/raw/resumes_bhawal/Resume/Resume.csv"

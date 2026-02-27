# PerfectCandidad

A green-themed web app for recruiters to create and publish job application forms.

## Features
- Recruiter builder with editable job title, department, description, and custom questions.
- Add/remove questions and mark each question as required.
- Save draft or publish form.
- Published forms get a shareable unique link.
- Applicants submit from shared link and are redirected to a unique application identifier link.

## Run locally
Because this is a static app, you can run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Public access setup (GitHub Pages)
This repository now includes a GitHub Actions workflow that deploys the site publicly with GitHub Pages.

### 1) Push to GitHub
Push this repository to GitHub and ensure your default branch is `main` (or update the workflow trigger branch if needed).

### 2) Enable Pages in repo settings
In GitHub: **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source.

### 3) Trigger deployment
Push to `main` (or run the workflow manually from the Actions tab).

### 4) Open your public URL
After the workflow succeeds, your app will be available at:

```text
https://<your-github-username>.github.io/<repository-name>/
```

> Note: This app stores data in `localStorage`, so recruiter forms and application submissions are browser-local and not shared across different devices/users.

# GitHub Repository Setup

## Current Local Repository

Local branch:

```text
main
```

Current commits:

```text
1b81c15 Protect admin dashboard with login
6863245 Add question-to-knowledge demo flow
2e41f10 Initial personal AI website demo
```

## Recommended Remote Repository

```text
personal-ai-digital-avatar
```

## Why Remote Creation Is Not Automated Yet

The current Codex GitHub connection can identify the account `sixteendog2-sudo`, but it does not expose any installed writable accounts or repositories. The local environment also has no `gh` CLI, `GITHUB_TOKEN`, or `GH_TOKEN`.

Because of that, this workspace cannot create a new GitHub repository or push to a remote until one of these is available:

- GitHub App installed on the target account/repository.
- A blank repository created manually.
- A local `gh` CLI authenticated session.
- A `GITHUB_TOKEN` or `GH_TOKEN` with repo permissions.

## Push Commands After Creating The Empty Repo

HTTPS:

```bash
git remote add origin https://github.com/sixteendog2-sudo/personal-ai-digital-avatar.git
git push -u origin main
```

SSH:

```bash
git remote add origin git@github.com:sixteendog2-sudo/personal-ai-digital-avatar.git
git push -u origin main
```

## Repository Automation Already Included

- `.github/workflows/ci.yml`: runs install and build on push and pull request.
- `.github/pull_request_template.md`: keeps future iterations structured.
- `vercel.json`: Vercel build configuration.


# GitHub 与 Vercel 部署指南

## 1. 当前状态

本地仓库已经可以作为 GitHub/Vercel 项目使用。

当前 GitHub App 已能识别登录账号 `sixteendog2-sudo`，但未返回可写安装账户或仓库；本地也没有 `gh` CLI、`GITHUB_TOKEN` 或 `GH_TOKEN`，因此本环境暂时无法直接创建远程 GitHub repository。

## 2. 创建 GitHub 仓库

建议仓库名：

```text
personal-ai-digital-avatar
```

在 GitHub 创建空仓库后，在本地执行：

```bash
git remote add origin https://github.com/<your-user>/personal-ai-digital-avatar.git
git branch -M main
git push -u origin main
```

如果使用 SSH：

```bash
git remote add origin git@github.com:<your-user>/personal-ai-digital-avatar.git
git branch -M main
git push -u origin main
```

## 3. Vercel 部署

1. 打开 Vercel。
2. Import Git Repository。
3. 选择 `personal-ai-digital-avatar`。
4. Framework Preset 选择 Next.js。
5. Install Command 使用：

```bash
pnpm install
```

6. Build Command 使用：

```bash
pnpm build
```

7. Output Directory 留空。

项目已包含 `vercel.json`：

```json
{
  "framework": "nextjs",
  "installCommand": "pnpm install",
  "buildCommand": "pnpm build"
}
```

## 4. 环境变量

MVP demo 不配置环境变量也能运行本地模拟 AI。

接入真实 DeepSeek 时配置：

```text
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_CHAT_MODEL=deepseek-v4-flash
```

接入数据库时配置：

```text
DATABASE_URL=
```

## 5. 本地验证命令

```bash
pnpm install
pnpm build
pnpm dev
```

访问：

```text
http://localhost:3000
http://localhost:3000/chat
http://localhost:3000/admin
```

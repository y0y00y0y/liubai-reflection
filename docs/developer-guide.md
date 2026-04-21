# 开发与部署指南

这份文档面向希望自托管或参与开发的用户。

## 技术栈

前端：

- Next.js 14
- React 18
- TypeScript

后端：

- FastAPI
- SQLAlchemy 2
- Pydantic 2
- JWT 认证
- bcrypt 密码哈希

数据与模型：

- 本地开发默认 SQLite
- Staging / Production 建议 PostgreSQL
- LLM 支持 OpenAI、Gemini、Ollama
- 未配置模型时使用本地规则 fallback

## 项目结构

```text
.
├─ docs/                 # 开发与 AI 规范文档
├─ server/               # FastAPI 后端
├─ web/                  # Next.js 前端
├─ docker-compose.yml    # 本地 PostgreSQL 服务
└─ package.json          # 根目录辅助脚本
```

## 本地运行

### 启动后端

```powershell
cd server
python -m venv .venv
.\.venv\Scripts\activate
pip install -e .
copy .env.example .env
uvicorn app.main:app --reload
```

默认后端地址：

```text
http://127.0.0.1:8000
```

健康检查：

```text
http://127.0.0.1:8000/health
```

### 启动前端

请使用 Node 20 LTS。

```powershell
cd web
npm.cmd install
copy .env.local.example .env.local
npm.cmd run dev
```

默认前端地址：

```text
http://localhost:3000
```

## 环境变量

后端 `server/.env`：

```env
APP_NAME=留白 API
APP_ENV=development
SECRET_KEY=replace-me
DATABASE_URL=sqlite:///./reflection.db

LLM_PROVIDER=auto

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=

ACCESS_TOKEN_EXPIRE_MINUTES=10080
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

前端 `web/.env.local`：

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

不要把 OpenAI、Gemini 或其他模型 API Key 放进前端环境变量。

## 使用 PostgreSQL

本地可以用 Docker Compose 启动 PostgreSQL：

```powershell
docker compose up -d postgres
```

然后把 `server/.env` 中的 `DATABASE_URL` 改为：

```env
DATABASE_URL=postgresql+psycopg://liubai:liubai@localhost:5432/liubai
```

当前版本使用 SQLAlchemy `create_all` 建表。正式上线前建议引入 Alembic 管理迁移。

## LLM 配置

OpenAI：

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4.1-mini
```

Gemini：

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
```

Ollama：

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:7b
```

如果不配置任何模型，产品仍可运行，只是 AI 输出会回退到本地规则。

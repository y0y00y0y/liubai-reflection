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
npm.cmd run dev
```

默认前端地址：

```text
http://localhost:3000
```

## 环境变量

后端 `server/.env`：

前端 `web/.env.local`：

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

如果不配置任何模型，产品仍可运行，只是 AI 输出会回退到本地规则。

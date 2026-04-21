/**
 * API Endpoints Contract
 *
 * 所有前后端接口的集中定义。前端 api.ts 从这里引用路径，
 * 后端接口变更时只需修改此处，TypeScript 会追踪所有调用点。
 *
 * 对应后端路由：server/app/routers/auth.py + entries.py
 */

export const ENDPOINTS = {
  /** 认证 */
  auth: {
    /** POST — 注册新用户 */
    register: "/api/auth/register",
    /** POST — 登录，返回 access_token */
    login: "/api/auth/login",
    /** POST — 申请一次性密码重置 token */
    requestPasswordReset: "/api/auth/password-reset/request",
    /** POST — 使用一次性 token 确认重置密码 */
    confirmPasswordReset: "/api/auth/password-reset/confirm",
    /** GET  — 获取当前登录用户信息（需 Bearer token） */
    me: "/api/auth/me",
  },

  /** 仪表盘 */
  dashboard: {
    /** GET — 当前用户仪表盘（热力图 + 最近记录）（需 token） */
    real: "/api/dashboard",
    /** GET — Demo 仪表盘（无需 token，用于未登录预览） */
    demo: "/api/dashboard/demo",
    /** GET — 35 天活跃热力图（需 token） */
    heatmap: "/api/calendar/heatmap",
  },

  /** 日记条目 */
  entries: {
    /** GET  — 列表（需 token） */
    list: "/api/entries",
    /** POST — 创建（需 token） */
    create: "/api/entries",
    /** GET  — 详情，需拼接 /:id（需 token） */
    detail: (id: string) => `/api/entries/${id}`,
    /** PATCH — 更新，需拼接 /:id（需 token） */
    update: (id: string) => `/api/entries/${id}`,
    /** DELETE — 软删除，需拼接 /:id（需 token） */
    delete: (id: string) => `/api/entries/${id}`,
    /** POST — 重新生成 AI 洞察草稿（需 token） */
    aiDraftRegenerate: (id: string) => `/api/entries/${id}/ai-draft/regenerate`,
    /** PUT  — 保存人工修订稿（需 token） */
    revision: (id: string) => `/api/entries/${id}/revision`,
  },

  /** 某天详情 */
  days: {
    /** GET — 按日期查询当天所有记录（需 token） */
    detail: (date: string) => `/api/days/${date}`,
  },

  /** 回顾洞察 */
  insights: {
    /** GET — 概览：关键词 / 情绪 / 天气 / 摘要 / 最近草稿（需 token） */
    overview: "/api/insights/overview",
    /** POST — 用户明确请求后，重新整理阶段性回顾 */
    regenerateOverview: "/api/insights/overview/regenerate",
  },

  /** 表格 */
  table: {
    /** GET — 获取所有模板（token 可选） */
    templates: "/api/table/templates",
    /** GET — 获取行列表，可加 ?template_key=xxx（需 token） */
    rows: "/api/table/rows",
    /** POST — 创建行（需 token） */
    rowCreate: "/api/table/rows",
    /** GET  — 行详情，需拼接 /:id（需 token） */
    rowDetail: (id: string) => `/api/table/rows/${id}`,
    /** PATCH — 更新行，需拼接 /:id（需 token） */
    rowUpdate: (id: string) => `/api/table/rows/${id}`,
    /** POST — AI 从自由文本提取结构化字段预览（不写库，需 token） */
    rowAiDraft: "/api/table/rows/ai-draft",
  },
} as const;

# Reminder PWA - 开发进度

> 本文件由项目经理 Agent 实时更新，子 Agent 重启后可据此恢复进度。

## 项目信息

| 项目 | 说明 |
|------|------|
| 仓库 | github.com/[待创建] |
| 部署 | Vercel |
| 开始日期 | 2026-04-15 |
| 状态 | 📋 规划阶段 |

## 团队分工

| 角色 | Agent | 职责 | 状态 |
|------|-------|------|------|
| 架构师/PM | 主 Agent | 整体协调、架构、进度管理 | 🟢 工作中 |
| 后端开发 | Agent-BE | API、推送、调度引擎 | ⏳ 待启动 |
| 前端开发 | Agent-FE | PWA UI、设计稿 | ⏳ 待启动 |
| 测试 | Agent-QA | 测试用例、执行测试 | ⏳ 待启动 |

## 里程碑

| # | 里程碑 | 状态 | 负责 | 备注 |
|---|--------|------|------|------|
| M1 | 架构文档 + PRD | 🔄 进行中 | PM | 用户确认后进入开发 |
| M2 | GitHub 仓库建立 | ⏳ 待办 | PM | |
| M3 | UI 设计稿产出 | ⏳ 待办 | Agent-FE | 用户确认后开发 |
| M4 | 测试用例产出 | ⏳ 待办 | Agent-QA | 用户确认后测试 |
| M5 | 后端 API 开发完成 | ⏳ 待办 | Agent-BE | |
| M6 | 前端开发完成 | ⏳ 待办 | Agent-FE | |
| M7 | 集成测试通过 | ⏳ 待办 | Agent-QA | |
| M8 | Vercel 部署上线 | ⏳ 待办 | PM | |
| M9 | 用户验收 | ⏳ 待办 | PM | |

## 详细进度

### Phase 1: 规划 (当前阶段)

- [x] 需求讨论
- [x] 技术选型确认（PWA）
- [ ] 架构文档
- [ ] PRD 文档
- [ ] GitHub 仓库
- [ ] 进度文档（本文件）

### Phase 2: 设计

- [ ] UI 设计稿
- [ ] 用户确认设计稿

### Phase 3: 并行开发

**后端 Agent-BE 任务清单：**
- [ ] 项目初始化（Hono + Vercel）
- [ ] Vercel KV 封装
- [ ] Reminder CRUD API
- [ ] Push Subscription API
- [ ] web-push 集成
- [ ] 调度引擎 (scheduler.ts)
- [ ] Cron Job 实现
- [ ] API 单元测试

**前端 Agent-FE 任务清单：**
- [ ] 项目初始化（Vite + React + TS）
- [ ] Tailwind 配置
- [ ] PWA Manifest + Service Worker
- [ ] IndexedDB Schema (Dexie)
- [ ] 提醒列表页面
- [ ] 创建/编辑提醒表单
- [ ] 调度规则编辑器 (ScheduleEditor)
- [ ] 通知权限引导
- [ ] Push 订阅集成
- [ ] 响应式布局

### Phase 4: 测试

**Agent-QA 任务清单：**
- [ ] 测试用例文档
- [ ] 功能测试执行
- [ ] 兼容性测试
- [ ] 性能测试
- [ ] Bug 报告

## 阻塞项

| 问题 | 影响 | 状态 |
|------|------|------|
| （暂无） | - | - |

## 决策记录

| 日期 | 决策 | 理由 |
|------|------|------|
| 2026-04-15 | 选择 PWA 而非原生 App | 部署简单（Vercel），跨平台，MVP 快速验证 |
| 2026-04-15 | 后端使用 Hono | 轻量、Edge-first、Vercel 原生支持 |
| 2026-04-15 | 数据库用 Vercel KV | 免费额度够 MVP，无运维 |
| 2026-04-15 | 前端用 Vite + React | 轻量、PWA 插件成熟 |

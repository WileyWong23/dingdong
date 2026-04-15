# 叮咚 DingDong - 开发进度

> 本文件由项目经理 Agent 实时更新，子 Agent 重启后可据此恢复进度。

## 项目信息

| 项目 | 说明 |
|------|------|
| 仓库 | [github.com/WileyWong23/dingdong](https://github.com/WileyWong23/dingdong) |
| 部署 | Vercel |
| 开始日期 | 2026-04-15 |
| 状态 | 🚀 开发阶段 |

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
| M1 | 架构文档 + PRD | ✅ 完成 | PM | 用户待确认 |
| M2 | GitHub 仓库建立 | ✅ 完成 | PM | https://github.com/WileyWong23/dingdong |
| M3 | UI 设计稿产出 | ✅ 完成 | Agent-FE | HTML 原型已确认 |
| M4 | 测试用例产出 | ⏳ 待办 | Agent-QA | 用户确认后测试 |
| M5 | 后端 API 开发完成 | ✅ 完成 | Agent-BE | 所有 API + 调度引擎 |
| M6 | 前端开发完成 | ✅ 完成 | Agent-FE | React PWA 全组件 |
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

- [x] UI 设计规范文档
- [x] HTML 高保真原型
- [x] 用户确认设计稿

### Phase 3: 并行开发

**后端 Agent-BE 任务清单：**
- [x] 项目初始化（Hono + Vercel）
- [x] Vercel KV 封装
- [x] Reminder CRUD API
- [x] Push Subscription API
- [x] web-push 集成
- [x] 调度引擎 (scheduler.ts)
- [x] Cron Job 实现
- [ ] API 单元测试（待补充）

**前端 Agent-FE 任务清单：**
- [x] 项目初始化（Vite + React + TS）
- [x] Tailwind 配置
- [x] PWA Manifest + Service Worker
- [x] IndexedDB Schema (Dexie)
- [x] 提醒列表页面
- [x] 创建/编辑提醒表单
- [x] 调度规则编辑器 (ScheduleEditor)
- [x] 通知权限引导
- [x] Push 订阅集成
- [x] 响应式布局

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

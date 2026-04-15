# Reminder PWA - 产品需求文档 (PRD)

## 1. 产品概述

**产品名称：** Reminder（暂定）  
**产品形态：** PWA（渐进式 Web 应用），部署于 Vercel  
**目标用户：** 需要灵活定时提醒的个人用户  
**核心价值：** 支持高度自定义的重复提醒规则，一次性和周期性提醒统一管理

## 2. MVP 功能范围

### 2.1 提醒创建

用户可创建提醒，包含以下字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | ✅ | 提醒标题 |
| body | string | ❌ | 提醒内容详情 |
| type | enum | ✅ | `once`（一次性）/ `recurring`（重复） |
| trigger_at | datetime | ✅ (once) | 一次性提醒的触发时间 |
| schedule | object | ✅ (recurring) | 重复规则（见下方） |
| enabled | boolean | ✅ | 是否启用（默认 true） |

### 2.2 重复提醒调度规则 (schedule)

```json
{
  "interval_seconds": 3600,
  "range_start": "09:00",
  "range_end": "21:00",
  "days_of_week": [1, 2, 3, 4, 5],
  "timezone": "Asia/Shanghai"
}
```

**支持的模式：**

| 场景 | interval_seconds | range | days_of_week |
|------|-----------------|-------|--------------|
| 每天9点提醒 | 86400 | 09:00-09:00 | [0-6] |
| 每小时提醒（9-21点工作日） | 3600 | 09:00-21:00 | [1-5] |
| 每30分钟提醒（全天） | 1800 | 00:00-23:59 | [0-6] |
| 每周一9点 | 604800 | 09:00-09:00 | [1] |

### 2.3 通知推送

- 使用 **Web Push API** + **Service Worker**
- 用户首次访问时请求通知权限
- 通知包含：标题、内容、点击后打开应用

### 2.4 提醒管理

- 查看所有提醒列表（按启用状态、类型分组）
- 编辑提醒
- 删除提醒
- 暂停/恢复提醒
- 提醒触发历史记录

### 2.5 数据存储

- **前端：** IndexedDB 存储提醒数据（本地优先）
- **后端：** 轻量数据库存储推送订阅 + 提醒调度数据
- 以后端为推送调度的 source of truth，前端 IndexedDB 为 UI 展示缓存

## 3. 技术方案

### 3.1 前端

| 技术 | 选型 | 理由 |
|------|------|------|
| 框架 | React 18 + Vite | 轻量、生态好、PWA 支持成熟 |
| UI | Tailwind CSS | 快速开发、无额外依赖 |
| PWA | vite-plugin-pwa | 自动生成 Service Worker、Manifest |
| 本地存储 | Dexie.js (IndexedDB) | IndexedDB 的优雅封装 |
| 状态管理 | Zustand | 轻量、简洁 |

### 3.2 后端

| 技术 | 选型 | 理由 |
|------|------|------|
| 运行时 | Node.js (Vercel Serverless) | 原生支持、零运维 |
| 框架 | Express / Hono | 轻量 API 框架 |
| 推送 | web-push (npm) | Web Push Protocol 标准实现 |
| 调度 | Vercel Cron Jobs | 定时触发检查待发送提醒 |
| 数据库 | Vercel KV (Redis) | 免费额度够 MVP，低延迟 |

### 3.3 架构图

```
┌─────────────────────────────────────────────────────┐
│                    PWA Frontend                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ React UI │  │ IndexedDB │  │ Service Worker   │  │
│  │ (提醒管理)│  │ (本地缓存)│  │ (Push接收+通知)  │  │
│  └────┬─────┘  └─────┬────┘  └────────┬─────────┘  │
│       │              │                 │             │
└───────┼──────────────┼─────────────────┼─────────────┘
        │ REST API     │                 │ Push Event
        ▼              ▼                 │
┌─────────────────────────────────────── │ ────────────┐
│              Vercel Backend            ▼              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ API Endpoints│  │  Vercel KV   │  │ Cron Job   │ │
│  │ CRUD提醒     │  │  (Redis)     │  │ 扫描待推送  │ │
│  │ 订阅管理     │  │ 提醒+订阅    │  │ 发送Push   │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
└──────────────────────────────────────────────────────┘
```

### 3.4 推送流程

```
1. 用户创建提醒 → 前端 POST /api/reminders → 后端存入 KV
2. Cron Job 每分钟执行 → 扫描 KV 中到期的提醒
3. 获取用户 Push Subscription → 调用 web-push 发送
4. Service Worker 收到 push 事件 → 弹出系统通知
5. 用户点击通知 → 打开 PWA 应用
```

## 4. API 设计

### 4.1 提醒 CRUD

| Method | Path | 说明 |
|--------|------|------|
| POST | /api/subscribe | 保存 Push Subscription |
| POST | /api/reminders | 创建提醒 |
| GET | /api/reminders | 获取提醒列表 |
| PUT | /api/reminders/:id | 更新提醒 |
| DELETE | /api/reminders/:id | 删除提醒 |
| PATCH | /api/reminders/:id/toggle | 启用/暂停 |

### 4.2 Cron Job

| Path | 频率 | 说明 |
|------|------|------|
| /api/cron/check-reminders | 每分钟 | 扫描到期提醒并发送 Push |

## 5. 非功能需求

- **性能：** 页面加载 < 2s，通知延迟 < 30s
- **兼容性：** Chrome 80+、Edge 80+、Safari 16.4+（iOS 支持有限）
- **离线：** PWA 可离线查看提醒列表，创建/编辑需联网
- **安全：** VAPID 密钥验证 Push 来源

## 6. 未来迭代

- [ ] 用户注册/登录（OAuth）
- [ ] 多设备同步
- [ ] 邮件/飞书/微信多渠道通知
- [ ] 提醒模板
- [ ] 语音输入创建提醒
- [ ] 日历视图

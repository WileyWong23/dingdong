# Reminder PWA - 技术架构文档

## 1. 系统架构总览

### 1.1 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18 + TypeScript | 组件化 UI |
| 构建工具 | Vite 6 | 快速 HMR、PWA 插件 |
| 样式 | Tailwind CSS 4 | 原子化 CSS |
| PWA | vite-plugin-pwa (Workbox) | Service Worker 生成 |
| 本地存储 | Dexie.js | IndexedDB 封装 |
| 状态管理 | Zustand | 轻量全局状态 |
| 后端框架 | Hono | 轻量 Edge-first 框架 |
| 推送 | web-push (npm) | VAPID + Web Push Protocol |
| 数据库 | Vercel KV (Upstash Redis) | Serverless Redis |
| 调度 | Vercel Cron Jobs | 定时触发 |
| 部署 | Vercel | 前后端一体 |

### 1.2 目录结构

```
reminder-app/
├── README.md
├── docs/
│   ├── architecture.md      # 本文档
│   ├── prd.md               # 产品需求
│   ├── design-spec.md       # UI 设计规范
│   ├── progress.md          # 开发进度跟踪
│   └── test-cases.md        # 测试用例
├── frontend/
│   ├── public/
│   │   ├── manifest.json    # PWA Manifest
│   │   ├── icons/           # PWA 图标
│   │   └── sw-custom.js     # 自定义 Service Worker 逻辑
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/      # UI 组件
│   │   │   ├── ReminderList.tsx
│   │   │   ├── ReminderForm.tsx
│   │   │   ├── ScheduleEditor.tsx
│   │   │   └── Layout.tsx
│   │   ├── stores/          # Zustand stores
│   │   │   └── reminderStore.ts
│   │   ├── db/              # IndexedDB (Dexie)
│   │   │   └── database.ts
│   │   ├── services/        # API 调用
│   │   │   ├── api.ts
│   │   │   └── push.ts
│   │   ├── utils/           # 工具函数
│   │   │   └── schedule.ts  # 调度规则计算
│   │   └── types/           # TypeScript 类型
│   │       └── reminder.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
├── backend/
│   ├── api/
│   │   ├── subscribe.ts     # POST /api/subscribe
│   │   ├── reminders.ts     # CRUD /api/reminders
│   │   ├── toggle.ts        # PATCH /api/reminders/:id/toggle
│   │   └── cron/
│   │       └── check-reminders.ts  # Cron Job 入口
│   ├── lib/
│   │   ├── kv.ts            # Vercel KV 封装
│   │   ├── push.ts          # web-push 封装
│   │   ├── scheduler.ts     # 调度引擎（计算下次触发时间）
│   │   └── crypto.ts        # ID 生成等工具
│   ├── types/
│   │   └── reminder.ts      # 共享类型
│   ├── vercel.json          # Vercel 配置（含 Cron）
│   └── package.json
└── testing/
    ├── test-cases.md         # 测试用例文档
    └── e2e/                  # E2E 测试（Playwright）
        └── reminder.spec.ts
```

## 2. 数据模型

### 2.1 Reminder

```typescript
interface Reminder {
  id: string;                    // UUID v4
  title: string;
  body: string;
  type: 'once' | 'recurring';
  
  // 一次性提醒
  triggerAt?: number;            // Unix timestamp (ms)
  
  // 重复提醒
  schedule?: {
    intervalSeconds: number;     // 间隔秒数
    rangeStart: string;          // "HH:mm"
    rangeEnd: string;            // "HH:mm"
    daysOfWeek: number[];        // 0=周日, 1=周一...6=周六
    timezone: string;            // "Asia/Shanghai"
  };
  
  // 状态
  enabled: boolean;
  lastTriggeredAt?: number;      // 上次触发时间
  nextTriggerAt?: number;        // 下次触发时间（调度引擎计算）
  createdAt: number;
  updatedAt: number;
}
```

### 2.2 PushSubscription (后端存储)

```typescript
interface StoredSubscription {
  endpoint: string;              // Push endpoint URL
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: number;
}
```

## 3. 调度引擎设计

### 3.1 核心算法

调度引擎负责计算 `nextTriggerAt`，逻辑如下：

```
输入：reminder.schedule + 当前时间 now
输出：下次触发的 timestamp

1. 将 now 转换到 reminder 的 timezone
2. 根据 days_of_week 筛选有效日期
3. 在 range_start ~ range_end 内，按 interval_seconds 生成候选时间点
4. 找到第一个 > now 的候选时间点
5. 转换回 UTC timestamp 返回
```

### 3.2 示例

**规则：** 每天 09:00-21:00，每隔 1 小时，工作日

```
当前时间: 周三 10:30
有效日期: 周三 ✅
区间内候选: 09:00, 10:00, 11:00, ..., 21:00
下一个: 11:00 (周三)
```

```
当前时间: 周三 21:30
区间内候选已过完
下一个: 09:00 (周四)
```

### 3.3 Cron Job 扫描逻辑

```typescript
// 每分钟执行
async function checkReminders() {
  const now = Date.now();
  const reminders = await getRemindersDueBefore(now + 60_000);
  
  for (const reminder of reminders) {
    const subscription = await getSubscription();
    await sendPush(subscription, {
      title: reminder.title,
      body: reminder.body,
      data: { reminderId: reminder.id }
    });
    
    // 更新下次触发时间
    reminder.nextTriggerAt = calculateNextTrigger(reminder, now);
    await saveReminder(reminder);
  }
}
```

## 4. 前端核心模块

### 4.1 Service Worker 策略

- **缓存策略：** Stale-While-Revalidate（静态资源）
- **Push 处理：** 监听 `push` 事件，显示 Notification
- **点击处理：** `notificationclick` 事件打开对应提醒详情

### 4.2 IndexedDB Schema

```typescript
// Dexie schema
const db = new Dexie('ReminderDB');
db.version(1).stores({
  reminders: 'id, type, enabled, nextTriggerAt, createdAt',
});
```

### 4.3 关键交互

1. **创建提醒流程：**
   - 用户填写表单 → 前端计算 nextTriggerAt → 存入 IndexedDB → POST 到后端
   - 后端存入 KV → 返回成功

2. **请求通知权限：**
   - 首次打开 App → 检测 Notification.permission
   - 若 "default" → 弹出引导 → 请求权限
   - 若 "granted" → 订阅 Push → POST /api/subscribe

## 5. Vercel 配置

### 5.1 vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/check-reminders",
      "schedule": "* * * * *"
    }
  ]
}
```

### 5.2 环境变量

| 变量 | 说明 |
|------|------|
| VAPID_PUBLIC_KEY | VAPID 公钥（前端也用） |
| VAPID_PRIVATE_KEY | VAPID 私钥 |
| VAPID_EMAIL | VAPID 邮箱 |
| KV_REST_API_URL | Vercel KV URL |
| KV_REST_API_TOKEN | Vercel KV Token |
| CRON_SECRET | Cron Job 鉴权密钥 |

## 6. 部署流程

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 链接项目
vercel link

# 3. 创建 Vercel KV 数据库
vercel kv create

# 4. 生成 VAPID 寚钥
npx web-push generate-vapid-keys

# 5. 设置环境变量
vercel env add VAPID_PUBLIC_KEY
vercel env add VAPID_PRIVATE_KEY
vercel env add VAPID_EMAIL
vercel env add CRON_SECRET

# 6. 部署
vercel --prod
```

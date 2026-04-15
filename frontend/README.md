# 叮咚 DingDong - 前端 PWA

基于 React + Vite + Tailwind CSS 4 构建的渐进式 Web 应用（PWA）。

## 技术栈

- **React 18** - UI 框架
- **Vite 6** - 构建工具 + HMR
- **TypeScript** - 类型安全
- **Tailwind CSS 4** - 原子化 CSS
- **Dexie.js** - IndexedDB 封装
- **Zustand** - 轻量状态管理
- **vite-plugin-pwa** - PWA 支持

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
frontend/
├── public/           # 静态资源
│   ├── icons/        # PWA 图标
│   ├── manifest.json # PWA Manifest
│   └── sw-custom.js  # Service Worker
├── src/
│   ├── components/   # UI 组件
│   │   ├── Layout.tsx
│   │   ├── ReminderList.tsx
│   │   ├── ReminderForm.tsx
│   │   └── ScheduleEditor.tsx
│   ├── stores/       # Zustand 状态管理
│   │   └── reminderStore.ts
│   ├── db/           # IndexedDB (Dexie)
│   │   └── database.ts
│   ├── services/     # API 服务
│   │   ├── api.ts
│   │   └── push.ts
│   ├── utils/        # 工具函数
│   │   └── schedule.ts
│   ├── types/        # TypeScript 类型
│   │   └── reminder.ts
│   ├── App.tsx       # 应用入口
│   ├── main.tsx      # React 渲染入口
│   └── index.css     # 全局样式
├── index.html        # HTML 模板
├── vite.config.ts    # Vite 配置
└── package.json      # 项目依赖
```

## 设计规范

遵循 Apple 设计哲学，详见 [design-spec.md](../docs/design-spec.md)。

### 色彩系统

| 用途 | 亮色模式 | 暗色模式 |
|------|---------|---------|
| 背景 | #FAFAFA | #000000 |
| 表面 | #FFFFFF | #1C1C1E |
| 主文字 | #1D1D1F | #FFFFFF |
| 次要文字 | #6E6E73 | #8E8E93 |
| 强调色 | #007AFF | #007AFF |

## PWA 功能

- 离线查看提醒列表
- Service Worker 缓存策略
- Web Push 推送通知
- 添加到主屏幕

## 开发

```bash
# 运行开发服务器（带网络访问）
npm run dev -- --host

# 类型检查
npm run build

# 环境变量配置
cp .env.example .env.local
```

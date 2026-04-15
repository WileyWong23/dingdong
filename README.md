# Reminder PWA 🔔

高度自定义的定时提醒应用，支持灵活的重复规则调度。

## 功能特性

- ✅ 一次性提醒和重复提醒
- ✅ 灵活的重复规则：间隔、时间范围、星期筛选
- ✅ 系统级推送通知（Web Push）
- ✅ PWA — 可安装到桌面，离线查看
- ✅ 本地优先存储（IndexedDB）
- 🚧 多用户支持（迭代中）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 后端 | Hono + Vercel Serverless |
| 数据库 | Vercel KV (Redis) |
| 推送 | Web Push API + Service Worker |
| 部署 | Vercel |

## 项目结构

```
reminder-app/
├── docs/           # 文档（架构、PRD、设计规范、进度、测试用例）
├── frontend/       # PWA 前端
├── backend/        # Serverless 后端 API
├── testing/        # 测试用例和 E2E 测试
└── README.md
```

## 本地开发

### 前端

```bash
cd frontend
npm install
npm run dev
```

### 后端

```bash
cd backend
npm install
npm run dev
```

## 部署

```bash
vercel --prod
```

详见 [架构文档](docs/architecture.md) 和 [PRD](docs/prd.md)。

## License

MIT

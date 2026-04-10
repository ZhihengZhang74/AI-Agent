# AI-Agent 项目 - TypeScript 全栈版本

基于高德地图 API 的周边店铺搜索应用，全栈使用 TypeScript 开发。

## 项目结构

```
AI-Agent/
├── frontend/           # Vue 3 + TypeScript 前端
│   ├── src/
│   │   ├── api/       # API 客户端
│   │   ├── components/ # Vue 组件
│   │   ├── types/     # TypeScript 类型定义
│   │   └── main.ts    # 应用入口
│   └── package.json
├── backend-ts/        # Fastify + TypeScript 后端
│   ├── src/
│   │   ├── routes/    # API 路由
│   │   ├── services/  # 业务逻辑
│   │   ├── types/     # 类型定义
│   │   └── main.ts    # 应用入口
│   └── package.json
└── README.md
```

## 技术栈

### 前端
- **框架**: Vue 3 + Composition API
- **语言**: TypeScript 5.3+
- **UI 库**: Element Plus
- **HTTP 客户端**: Axios
- **构建工具**: Vite 5.4
- **测试**: Vitest + Vue Test Utils

### 后端
- **框架**: Fastify 4.24
- **语言**: TypeScript 5.3+
- **验证**: Zod
- **HTTP 客户端**: Axios
- **测试**: Vitest

## 快速开始

### 前端

```bash
cd frontend

# 安装依赖
npm install

# 开发模式
npm run dev

# 类型检查
npm run type-check

# 构建
npm run build

# 运行测试
npm test
```

前端将在 http://localhost:5173 启动。

### 后端

```bash
cd backend-ts

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的高德 API Key

# 开发模式
npm run dev

# 类型检查
npm run type-check

# 构建
npm run build

# 运行测试
npm test
```

后端将在 http://localhost:8000 启动。

## 环境变量

### 后端 (.env)

```
AMAP_KEY=your_amap_api_key_here
PORT=8000
```

## API 端点

### GET /api/categories
获取支持的店铺分类列表。

**响应**:
```json
[
  { "name": "美食", "type_code": "050000" },
  { "name": "饮品", "type_code": "050700" },
  { "name": "咖啡", "type_code": "050500" }
]
```

### POST /api/search
搜索附近店铺。

**请求体**:
```json
{
  "location": "浙江省嵊州市吾悦广场",
  "category": "美食",
  "limit": 15,
  "sort_by": "rating",
  "sort_order": "desc"
}
```

**响应**:
```json
{
  "total": 15,
  "shops": [
    {
      "name": "店铺名称",
      "province": "浙江省",
      "city": "嵊州市",
      "district": "XXX区",
      "address": "详细地址",
      "phone": "电话号码",
      "type": "餐厅",
      "tags": "中餐",
      "rating": "4.5",
      "cost": "50",
      "business_hours": "10:00-22:00",
      "location": "120.5,30.5",
      "distance": "500"
    }
  ]
}
```

## 类型安全

项目使用 TypeScript 实现端到端类型安全：

- 前端和后端共享类型定义结构
- Zod 验证确保请求数据完整性
- TypeScript 编译时类型检查
- 严格的类型配置（strict mode）

## 测试

```bash
# 前端测试
cd frontend
npm test

# 后端测试
cd backend-ts
npm test
```

## 构建生产版本

```bash
# 前端
cd frontend
npm run build
# 输出到 frontend/dist/

# 后端
cd backend-ts
npm run build
# 输出到 backend-ts/dist/
```

## 开发工具

- **类型检查**: `npm run type-check`
- **开发服务器**: `npm run dev`
- **测试运行器**: `npm test`

## 许可证

MIT
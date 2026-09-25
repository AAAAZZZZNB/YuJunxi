# YU JUNXI / Product Lab —— 前后端个人作品集

> 把复杂问题，做成真正可用的 AI 产品。

这是个人求职作品集网站的**前后端版本**：前端是一个可交互的多页站点（首页 / 简历 / 项目 / 产品实验室 / 博客），后端是一个 FastAPI 服务，把「内容数据」和「实验室 AI 分析」都做成了真正的 API。实验室里的 **JD 岗位匹配** 已经从前端的本地规则，搬到了后端的 Python 规则引擎——后续可以无痛替换成真实 LLM 调用。

## 架构

```
┌─────────────────────────────┐         ┌──────────────────────────────────┐
│  frontend/  (静态站)         │  fetch  │  backend/  (FastAPI)              │
│  HTML / CSS / JS            │ ──────▶ │  /api/bootstrap     内容数据       │
│  api.js  →  调后端接口       │         │  /api/projects      项目列表       │
│  data.js  →  离线兜底        │         │  /api/posts         文章列表       │
└─────────────────────────────┘         │  /api/lab/jd/match   JD 匹配(POST)│
                                        │  /api/lab/calls      外呼 Badcase  │
                                        │  /api/lab/drawing    图纸识别流程  │
                                        │  /docs  →  Swagger 文档           │
                                        └──────────────────────────────────┘
```

- **前端**：demo 的 HTML/CSS/JS 原样保留，新增一个 `api.js` 客户端。页面启动时优先从后端 `/api/bootstrap` 拉取内容；后端没启动（例如直接双击打开 HTML）时自动回退到 `data.js` 本地数据，页面照常可用。
- **后端**：FastAPI 提供内容 API + 实验室 API，并把前端静态文件一起托管——**一个 `uvicorn` 进程即可跑起整站**，同时带自动生成的 Swagger 文档。

## 目录结构

```
YuJunxi/
├── frontend/                 # 前端（静态站点）
│   ├── index.html            # 首页
│   ├── resume.html           # 简历
│   ├── projects.html         # 项目列表
│   ├── project.html          # 项目详情
│   ├── lab.html              # 产品实验室
│   ├── blog.html             # 博客列表
│   ├── post.html             # 文章详情
│   └── assets/
│       ├── styles.css        # 样式
│       ├── api.js            # API 客户端（调后端）
│       ├── data.js           # 离线兜底数据
│       └── app.js            # 交互逻辑
├── backend/                  # 后端（FastAPI）
│   ├── main.py               # 入口：CORS + 路由 + 静态托管
│   ├── routers.py            # 内容 + 实验室 API
│   ├── jd_match.py           # JD 匹配规则引擎（移植自 app.js）
│   ├── data.py               # 数据层（读取 data/portfolio.json）
│   ├── data/portfolio.json   # 内容数据（与前端 data.js 同源）
│   └── requirements.txt
└── docs/                     # 产品文档
    └── 个人展示网站-产品文档.md
```

## 技术栈

- **后端**：Python · FastAPI · Uvicorn（自带 Swagger 文档）
- **前端**：原生 HTML / CSS / JS（无构建步骤，零依赖）
- **数据**：`data.js` 与 `portfolio.json` 同源（后者由脚本从前者导出）

## 本地运行

```bash
# 后端（一个进程同时提供 API 和前端）
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

- 站点：http://127.0.0.1:8000
- API 文档：http://127.0.0.1:8000/docs

> 需要 Python 3.10+。也可前后端分开跑：后端 `uvicorn` 提供 API，前端直接双击打开或交给任意静态服务器，`api.js` 会自动识别并请求后端。

## API 一览

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/bootstrap` | 一次性返回全部内容数据（等价 `window.PORTFOLIO`） |
| GET | `/api/profile` | 个人档案 |
| GET | `/api/projects` / `/api/projects/{id}` | 项目列表 / 详情 |
| GET | `/api/posts` / `/api/posts/{id}` | 文章列表 / 详情 |
| GET | `/api/timeline` `/api/education` `/api/awards` `/api/skills` | 简历数据 |
| GET | `/api/lab/jd/samples` | JD 示例 |
| POST | `/api/lab/jd/match` | **JD 岗位匹配分析**（规则引擎） |
| GET | `/api/lab/calls` / `/api/lab/calls/{index}` | 外呼 Badcase 列表 / 详情 |
| GET | `/api/lab/drawing` | 图纸识别流程（阶段 + 结构化结果） |

## 产品实验室：从本地规则到后端 API

三个 Demo 均来自真实项目，数据为**模拟脱敏内容**：

1. **岗位匹配助手** —— 粘贴岗位描述，后端 `jd_match.py` 做关键词 → 能力维度 → 岗位类型判断 → 推荐项目 → 面试建议。
2. **AI 外呼 Badcase 分析** —— 通话摘要、失败归因、风险标签、改进建议。
3. **通信图纸识别流程** —— 预处理 → 区域定位 → 图元检测/OCR → 语义结构化 → 结构化输出。

> 第一版使用**本地关键词规则**模拟分析，未调用真实模型。接入真实 LLM 后，只需替换 `jd_match.py` 里 `match_jd()` 的实现，接口返回结构不变，前端无需改动。

## 隐私与脱敏

- 不公开：身份证、手机号、私人社交账号、家庭与健康信息、企业内部数据、生产接口与未脱敏截图。
- 简历文档（`.docx`）与个人照片**不进入仓库**，已在 `.gitignore` 中排除。

## 部署建议

- **一体式**：把整个 `YuJunxi` 目录部署到支持 Python 的平台（Render / Railway / 云服务器），启动 `uvicorn main:app` 即可。
- **分离式**：前端交给 Netlify / Vercel，后端单独部署，前端 `api.js` 里设置 `window.API_BASE` 指向后端地址。

## 下一步

- [ ] 接入真实 LLM（替换 `jd_match.py` 规则引擎）
- [ ] 交通数据可视化（`lab.html` 第 4 个 Tab，P2）
- [ ] 后台内容管理 / 文章系统
- [ ] 英文版简历

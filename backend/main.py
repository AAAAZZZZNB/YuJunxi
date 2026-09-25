"""YU JUNXI / Product Lab —— 后端入口。

一个进程同时提供：
- REST API（/api/*，含 Swagger 文档 /docs）
- 静态前端（frontend/，HTML / CSS / JS）

本地运行：
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload
    打开 http://127.0.0.1:8000  （API 文档 http://127.0.0.1:8000/docs）
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routers import router

app = FastAPI(
    title="YuJunxi Product Lab API",
    description="余俊曦个人作品集前后端项目：内容 API + 产品实验室（JD 匹配 / Badcase 分析 / 图纸识别流程）。",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

_FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

# 静态前端必须最后挂载，避免覆盖 /api 与 /docs 路由。
app.mount("/", StaticFiles(directory=_FRONTEND_DIR, html=True), name="frontend")

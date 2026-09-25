"""内容数据层。

数据来自 frontend/assets/data.js 的 window.PORTFOLIO，由一次性脚本转成
backend/data/portfolio.json（与前端同源）。后端直接读取该 JSON 作为 API 的
唯一数据源；前端 data.js 仍保留，仅作为「后端未启动 / 直接双击 HTML」时的
离线兜底。
"""
import json
import os

_DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "portfolio.json")

with open(_DATA_PATH, encoding="utf-8") as _f:
    PORTFOLIO = json.load(_f)


def get_project(pid: str):
    for p in PORTFOLIO.get("projects", []):
        if p.get("id") == pid:
            return p
    return None


def get_post(pid: str):
    for p in PORTFOLIO.get("posts", []):
        if p.get("id") == pid:
            return p
    return None


def get_call(index: str):
    for c in PORTFOLIO.get("lab", {}).get("calls", []):
        if str(c.get("index")) == str(index):
            return c
    return None

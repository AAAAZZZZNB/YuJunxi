"""API 路由：内容 + 产品实验室。"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from data import PORTFOLIO, get_call, get_post, get_project
from jd_match import match_jd

router = APIRouter()


class JDMatchRequest(BaseModel):
    text: str


# ---------------- 内容 ----------------

@router.get("/bootstrap")
def bootstrap():
    """一次性返回前端所需的全部内容数据（等价于 window.PORTFOLIO）。"""
    return PORTFOLIO


@router.get("/profile")
def profile():
    return PORTFOLIO.get("profile")


@router.get("/projects")
def projects():
    return PORTFOLIO.get("projects", [])


@router.get("/projects/{pid}")
def project_detail(pid: str):
    p = get_project(pid)
    if not p:
        raise HTTPException(status_code=404, detail="project not found")
    return p


@router.get("/posts")
def posts():
    return PORTFOLIO.get("posts", [])


@router.get("/posts/{pid}")
def post_detail(pid: str):
    p = get_post(pid)
    if not p:
        raise HTTPException(status_code=404, detail="post not found")
    return p


@router.get("/timeline")
def timeline():
    return PORTFOLIO.get("timeline", [])


@router.get("/education")
def education():
    return PORTFOLIO.get("education", [])


@router.get("/awards")
def awards():
    return PORTFOLIO.get("awards", [])


@router.get("/skills")
def skills():
    return PORTFOLIO.get("skills", [])


# ---------------- 产品实验室 ----------------

@router.get("/lab/jd/samples")
def jd_samples():
    return PORTFOLIO.get("lab", {}).get("jdSamples", [])


@router.post("/lab/jd/match")
def jd_match(req: JDMatchRequest):
    """JD 岗位匹配：关键词规则引擎（第一版，未调用真实模型）。"""
    return match_jd(req.text, PORTFOLIO.get("lab", {}))


@router.get("/lab/calls")
def calls():
    """外呼 Badcase 通话列表（模拟脱敏数据）。"""
    cs = PORTFOLIO.get("lab", {}).get("calls", [])
    return [
        {
            "index": c.get("index"),
            "title": c.get("title"),
            "meta": c.get("meta"),
            "severity": c.get("severity"),
        }
        for c in cs
    ]


@router.get("/lab/calls/{index}")
def call_detail(index: str):
    c = get_call(index)
    if not c:
        raise HTTPException(status_code=404, detail="call not found")
    return c


@router.get("/lab/drawing")
def drawing():
    """图纸识别流程：阶段 + 结构化结果（模拟数据）。"""
    lab = PORTFOLIO.get("lab", {})
    return {"stages": lab.get("drawingStages", []), "rows": lab.get("drawingRows", [])}

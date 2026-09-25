"""JD 岗位匹配规则引擎（从 demo/assets/app.js 的关键词规则移植）。

第一版使用本地关键词规则模拟分析结果，不调用真实模型。接入真实 LLM 后，
只需替换 match_jd() 的实现（例如改为「模型推理 + 结构化输出」），对上层
POST /api/lab/jd/match 的返回结构保持不变，前端无需改动。
"""
import re


def _match_keyword(text: str, compact: str, kw: str) -> bool:
    """与前端 matchKeyword 保持一致：短词按 token 精确匹配，其余按去空格子串匹配。"""
    k = re.sub(r"\s+", "", kw).lower()
    if re.fullmatch(r"[a-z0-9+]{1,3}", k):
        tokens = re.split(r"[^a-z0-9+]+", text.lower())
        return k in tokens
    return k in compact


def _analyze_dims(raw: str, dimensions: list) -> list:
    text = (raw or "").lower()
    compact = re.sub(r"\s+", "", text)
    dims = []
    for d in dimensions:
        hits = [k for k in d.get("keywords", []) if _match_keyword(text, compact, k)]
        score = 20 if not hits else min(100, round(42 + len(hits) * 11))
        dims.append({
            "key": d.get("key"),
            "name": d.get("name"),
            "weight": d.get("weight"),
            "hits": hits,
            "score": score,
        })
    return dims


def _pick_role(hit_keys: list, roles: list):
    """选出匹配度最高的岗位类型；返回值与前端 pickRole 一致。"""
    best = None
    for r in roles:
        need = r.get("need", [])
        matched = [n for n in need if n in hit_keys]
        pct = len(matched) / len(need) if need else 0.0
        value = pct * 100 + len(matched) * 8
        if best is None or value > best["value"]:
            best = {"role": r, "value": value, "matched": matched, "pct": pct}
    return best


# 各能力维度命中后，优先推荐展示的项目（顺序越靠前权重越高）。
_PROJECT_MAP = {
    "ai": ["cloud", "outbound", "drawing"],
    "product": ["outbound", "cloud", "jd-fulfillment"],
    "data": ["outbound", "jd-fulfillment", "logistics"],
    "engineer": ["drawing", "outbound", "robot-dog"],
    "industry": ["jd-fulfillment", "drawing", "logistics", "robot-dog"],
    "collab": ["jd-fulfillment", "digital-human", "guiyan"],
}


def _project_scores(hit_keys: list) -> list:
    score = {}
    for k in hit_keys:
        for i, pid in enumerate(_PROJECT_MAP.get(k, [])):
            score[pid] = score.get(pid, 0) + (3 - i)
    ranked = sorted(score.items(), key=lambda kv: kv[1], reverse=True)[:3]
    return [{"id": pid, "score": s, "reasons": hit_keys} for pid, s in ranked]


def match_jd(raw: str, lab: dict) -> dict:
    """分析一段岗位描述，返回与前端 renderMatchReport 对齐的聚合结果。"""
    dimensions = lab.get("jdDimensions", [])
    roles = lab.get("jdRoles", [])

    dims = _analyze_dims(raw, dimensions)
    hit_keys = [d["key"] for d in dims if d["hits"]]
    all_keywords = []
    for d in dims:
        all_keywords.extend(d["hits"])

    if not hit_keys:
        return {
            "text": raw,
            "dims": dims,
            "hitKeys": [],
            "allKeywords": [],
            "best": None,
            "projs": [],
            "missing": [],
            "engine": "rule-based",
        }

    best = _pick_role(hit_keys, roles)
    projs = _project_scores(hit_keys)
    missing = [n for n in best["role"].get("need", []) if n not in hit_keys]

    return {
        "text": raw,
        "dims": dims,
        "hitKeys": hit_keys,
        "allKeywords": all_keywords,
        "best": best,
        "projs": projs,
        "missing": missing,
        "engine": "rule-based",
    }

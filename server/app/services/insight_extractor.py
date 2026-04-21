from __future__ import annotations

from app.schemas import InsightDraft
from app.services.llm_client import generate_json, is_llm_configured


def heuristic_insight(content: str) -> InsightDraft:
    if any(token in content for token in ["焦虑", "害怕", "紧张"]):
        emotion = "焦虑"
    elif any(token in content for token in ["想家", "难过", "失落"]):
        emotion = "低落"
    else:
        emotion = "复杂"

    state = "迷茫" if any(token in content for token in ["卡住", "拖延", "不想开始", "不知道"]) else "摇摆"

    values_map = [
        (["家", "父母", "妈妈", "爸爸", "亲人", "想家"], ["家庭", "归属"]),
        (["朋友", "友谊", "室友", "同事"], ["友谊", "关怀"]),
        (["学习", "成长", "进步", "提升"], ["成长", "进步"]),
        (["工作", "项目", "任务", "代码"], ["责任", "卓越"]),
        (["诚实", "坦诚", "真实"], ["诚实", "正直"]),
        (["自由", "独立", "自主"], ["自由", "独立"]),
        (["健康", "身体", "运动"], ["健康", "平衡"]),
        (["意义", "价值", "目标"], ["意义", "自我实现"]),
        (["创造", "创意", "表达"], ["创造力", "表达"]),
        (["感恩", "感谢", "珍惜"], ["感恩", "善良"]),
    ]
    matched: list[str] = []
    for keywords, vals in values_map:
        if any(kw in content for kw in keywords):
            matched.extend(vals)
    if not matched:
        matched = ["诚实", "关怀"]
    values_str = " / ".join(dict.fromkeys(matched[:4]))

    return InsightDraft(
        state=state,
        emotion=emotion,
        trigger="当前文字显示出某个现实压力点正在放大内在负荷。",
        body_response="身体可能已经出现收紧、疲惫或想回避的信号。",
        belief="我需要马上做好，否则会证明自己不够胜任。",
        need="先被理解，再把问题拆小，恢复一点点行动感。",
        values=values_str,
    )


def extract_insight(content: str) -> InsightDraft:
    if not is_llm_configured():
        return heuristic_insight(content)

    prompt = f"""
请作为一名温和、克制的自我觉察教练，阅读以下日记内容。
返回严格 JSON，字段必须包含：
state, emotion, trigger, body_response, belief, need, values

values 字段：从日记中提炼 1-4 个核心价值观词汇，用 " / " 分隔。
日记内容：
{content}
"""

    try:
        data = generate_json(
            "你只返回 JSON，不要输出额外解释。",
            prompt,
        )
        return InsightDraft(**data)
    except Exception:
        return heuristic_insight(content)

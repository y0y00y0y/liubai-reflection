from __future__ import annotations

import re

from app.services.llm_client import generate_json, is_llm_configured


def heuristic_extract(free_text: str, field_keys: list[str]) -> dict[str, str]:
    sentences = [s.strip() for s in re.split(r"[。！？\n]+", free_text) if s.strip()]
    result: dict[str, str] = {}
    for index, key in enumerate(field_keys):
        if index < len(sentences) - 1:
            result[key] = sentences[index]
        elif index == len(field_keys) - 1:
            result[key] = "。".join(sentences[index:])
        else:
            result[key] = ""
    return result


def extract_table_fields(
    template_key: str,
    free_text: str,
    fields: list[dict],
) -> dict[str, str]:
    field_keys = [field["key"] for field in fields]

    if not is_llm_configured():
        return heuristic_extract(free_text, field_keys)

    field_descriptions = "\n".join(
        f'- "{field["key"]}": "{field["label"]}"' for field in fields
    )
    template_context = {
        "event_log": "事件记录，记录一次具体发生的事情及情绪反应",
        "action_motivation": "行动动机分析，分析一件想做但卡住的行动背后的恐惧与希望",
        "deep_reflection": "深度觉察，探索一个触发内在反应的主题",
    }.get(template_key, "自我觉察记录")

    prompt = f"""
用户写了一段关于「{template_context}」的自由文本。
请从中提取以下结构化字段，返回严格 JSON。

字段说明：
{field_descriptions}

要求：
- 只返回这些字段 key
- 字段值用中文
- 不能从文本中提取的字段返回空字符串
- 保持用户原有语气，不要过度总结

用户文字：
{free_text}
"""

    try:
        data = generate_json(
            "你只返回 JSON，不要输出额外解释。",
            prompt,
        )
        return {key: str(data.get(key, "")) for key in field_keys}
    except Exception:
        return heuristic_extract(free_text, field_keys)

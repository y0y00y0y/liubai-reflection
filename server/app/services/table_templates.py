from app.schemas import TableTemplate


def get_table_templates() -> list[TableTemplate]:
    return [
        TableTemplate(
            key="event_log",
            name="事件",
            description="记录发生了什么，以及当时和之后的反馈。",
            fields=[
                {"key": "event_date", "label": "日期", "type": "date"},
                {"key": "emotion", "label": "情绪", "type": "text"},
                {"key": "weather", "label": "天气", "type": "text"},
                {"key": "event_summary", "label": "事件概述", "type": "textarea"},
                {"key": "feedback", "label": "当下反馈", "type": "textarea"},
                {"key": "followup", "label": "后续想法", "type": "textarea"},
            ],
        ),
        TableTemplate(
            key="action_motivation",
            name="行动动机",
            description="拆解想做一件事的动机来源与阻力。",
            fields=[
                {"key": "goal", "label": "想做的事情", "type": "text"},
                {"key": "status", "label": "当前状态", "type": "text"},
                {"key": "fear_driver", "label": "更偏恐惧驱动", "type": "boolean"},
                {"key": "hope_driver", "label": "更偏希望驱动", "type": "boolean"},
                {"key": "next_step", "label": "最小下一步", "type": "textarea"},
            ],
        ),
        TableTemplate(
            key="deep_reflection",
            name="深度觉察",
            description="拆解触发、身体、感受、信念与支持性行动。",
            fields=[
                {"key": "topic", "label": "主题", "type": "text"},
                {"key": "trigger", "label": "触发情境", "type": "textarea"},
                {"key": "body_response", "label": "身体反应", "type": "textarea"},
                {"key": "emotion", "label": "情绪感受", "type": "textarea"},
                {"key": "belief", "label": "限制性信念", "type": "textarea"},
                {"key": "supportive_action", "label": "支持性行动", "type": "textarea"},
            ],
        ),
    ]

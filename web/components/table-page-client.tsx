"use client";

import { useRouter } from "next/navigation";
import { type KeyboardEvent, useEffect, useRef, useState, useTransition } from "react";

import { BookmarkNav } from "@/components/bookmark-nav";
import {
  TOKEN_STORAGE_KEY,
  createTableRow,
  fetchCurrentUser,
} from "@/lib/api";
import type { TableRowFieldValue } from "@/lib/types";

type SeeingModeKey = "event_log" | "action_motivation";

type SeeingStep = {
  key: string;
  prompt: string;
  placeholder: string;
};

type SeeingMode = {
  key: SeeingModeKey;
  name: string;
  shortDescription: string;
  intro: string;
  steps: SeeingStep[];
};

const STEP_EXPAND_DELAY_MS = 1800;
const DEFAULT_SEEING_MESSAGE = "你可以停在任意一层，写到这里也已经足够。";

const SEEING_MODES: Record<SeeingModeKey, SeeingMode> = {
  event_log: {
    key: "event_log",
    name: "事件复盘",
    shortDescription: "面向已经发生的事，帮你理解自己的反应与刺痛点。",
    intro: "从发生了什么开始，不着急解释，只先把那一刻放下来。",
    steps: [
      {
        key: "step_1_event",
        prompt: "发生了什么？",
        placeholder: "不用整理得很完整，只先把那一刻写下来。",
      },
      {
        key: "step_2_emotion",
        prompt: "当时你最强烈的感受是什么？",
        placeholder: "可以是一种情绪，也可以是一团说不清的感觉。",
      },
      {
        key: "step_3_body_response",
        prompt: "那一刻，你的身体最先有什么反应？",
        placeholder: "比如胸口发紧、肩膀绷住、胃里沉下去，想到什么就写什么。",
      },
      {
        key: "step_4_core_pain",
        prompt: "如果再往里看一点，真正刺痛你的是什么？",
        placeholder: "先不要急着分析，只写下最真实的那一点。",
      },
      {
        key: "step_5_response",
        prompt: "现在回头看，你想怎样理解或回应这件事？",
        placeholder: "不用立刻找到答案，哪怕只是一句此刻更愿意相信的话，也很好。",
      },
    ],
  },
  action_motivation: {
    key: "action_motivation",
    name: "动机辨认",
    shortDescription: "面向你想做却卡住的事，帮你看见犹豫、期待与方向。",
    intro: "从你想靠近的东西开始，也许答案会慢慢出现。",
    steps: [
      {
        key: "step_1_goal",
        prompt: "你想做的这件事是什么？",
        placeholder: "先把这件事说出来，不用解释为什么还没开始。",
      },
      {
        key: "step_2_importance",
        prompt: "它为什么对你重要？",
        placeholder: "也许它连接着一个期待、一种想成为的样子，或一个你很在意的方向。",
      },
      {
        key: "step_3_hesitation",
        prompt: "真正让你迟疑的是什么？",
        placeholder: "不用责怪自己，只看看是什么在把你留在原地。",
      },
      {
        key: "step_4_desire",
        prompt: "如果不是出于害怕，你更想靠近什么？",
        placeholder: "把注意力从阻力轻轻移向你真正想要的那一边。",
      },
      {
        key: "step_5_first_step",
        prompt: "现在的你，可以先迈出哪一小步？",
        placeholder: "它不需要很大，只要足够真实、足够能开始。",
      },
    ],
  },
};

function emptyAnswersFor(mode: SeeingMode) {
  return Object.fromEntries(mode.steps.map((step) => [step.key, ""])) as Record<string, string>;
}

export function TablePageClient() {
  const router = useRouter();
  const questionRefs = useRef<Record<string, HTMLElement | null>>({});
  const answerInputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const [token, setToken] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<SeeingModeKey>("event_log");
  const [openingWeather, setOpeningWeather] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>(emptyAnswersFor(SEEING_MODES.event_log));
  const [visibleStepCount, setVisibleStepCount] = useState(0);
  const [editingStepKey, setEditingStepKey] = useState<string | null>(null);
  const [message, setMessage] = useState(DEFAULT_SEEING_MESSAGE);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSavePending, startSaveTransition] = useTransition();

  const currentMode = SEEING_MODES[activeMode];

  useEffect(() => {
    const savedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!savedToken) {
      setIsCheckingAuth(false);
      router.replace("/auth");
      return;
    }

    void fetchCurrentUser(savedToken)
      .then(async () => {
        setToken(savedToken);
      })
      .catch((error) => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setMessage(error instanceof Error ? error.message : "加载失败");
        router.replace("/auth");
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, [router]);

  useEffect(() => {
    if (visibleStepCount <= 0) return;
    const currentStep = currentMode.steps[visibleStepCount - 1];
    if (!currentStep) return;
    if (editingStepKey) return;
    if (!answers[currentStep.key]?.trim()) return;
    if (visibleStepCount >= currentMode.steps.length) return;

    const timer = window.setTimeout(() => {
      setVisibleStepCount((current) => Math.min(current + 1, currentMode.steps.length));
    }, STEP_EXPAND_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [answers, currentMode, visibleStepCount, editingStepKey]);

  useEffect(() => {
    if (visibleStepCount <= 0) return;
    const step = currentMode.steps[visibleStepCount - 1];
    if (!step) return;

    window.setTimeout(() => {
      const element = questionRefs.current[step.key];
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const targetTop = window.scrollY + rect.top - (window.innerHeight - rect.height) / 2;
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
      window.setTimeout(() => {
        answerInputRefs.current[step.key]?.focus();
      }, 360);
    }, 80);
  }, [currentMode, visibleStepCount]);

  function resetComposer(nextMode?: SeeingModeKey) {
    const mode = SEEING_MODES[nextMode ?? activeMode];
    setOpeningWeather("");
    setAnswers(emptyAnswersFor(mode));
    setVisibleStepCount(0);
    setEditingStepKey(null);
    setMessage(DEFAULT_SEEING_MESSAGE);
  }

  function revealFirstStep() {
    setVisibleStepCount((current) => Math.max(current, 1));
  }

  function handleOpeningKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    revealFirstStep();
  }

  function switchMode(nextMode: SeeingModeKey) {
    setActiveMode(nextMode);
    resetComposer(nextMode);
  }

  function updateAnswer(stepKey: string, value: string) {
    setAnswers((current) => ({ ...current, [stepKey]: value }));
  }

  function handleManualNext(stepIndex: number) {
    const step = currentMode.steps[stepIndex];
    if (!step || !answers[step.key]?.trim()) return;
    setEditingStepKey(null);
    setVisibleStepCount((current) => Math.min(Math.max(current, stepIndex + 2), currentMode.steps.length));
  }

  function handleAnswerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>, stepIndex: number) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    const step = currentMode.steps[stepIndex];
    if (!step || !answers[step.key]?.trim()) return;

    event.preventDefault();
    handleManualNext(stepIndex);
  }

  function editStep(stepKey: string) {
    revealFirstStep();
    setEditingStepKey(stepKey);
  }

  function finishEditingStep() {
    setEditingStepKey(null);
  }

  function buildPayloadFields(mode: SeeingMode): TableRowFieldValue[] {
    return mode.steps.map((step) => ({
      key: step.key,
      label: step.prompt,
      value: answers[step.key] ?? "",
    }));
  }

  function handleSave() {
    if (!token) {
      router.replace("/auth");
      return;
    }

    const hasAnyAnswer = currentMode.steps.some((step) => answers[step.key]?.trim());
    if (!hasAnyAnswer) {
      setMessage("先写下一点内容，我们再把这次看见保存下来。");
      return;
    }

    const normalizedTitle = answers[currentMode.steps[0].key]?.trim().slice(0, 18) || currentMode.name;
    const payloadFields = buildPayloadFields(currentMode);

    startSaveTransition(async () => {
      try {
        await createTableRow(token, {
          template_key: currentMode.key,
          title: normalizedTitle,
          status: "active",
          fields: payloadFields,
        });
        setMessage("已为你保存这一次看见。");

        resetComposer(currentMode.key);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "保存失败");
      }
    });
  }

  if (isCheckingAuth) {
    return (
      <main className="subpage-shell">
        <p className="muted">正在验证登录状态...</p>
      </main>
    );
  }

  return (
    <main className="subpage-shell">
      <BookmarkNav current="table" />

      <section className="card seeing-shell">
        <header className="seeing-top">
          <div className="template-switch seeing-switch">
            {Object.values(SEEING_MODES).map((mode) => (
              <button
                key={mode.key}
                className={mode.key === activeMode ? "active" : ""}
                onClick={() => switchMode(mode.key)}
                type="button"
              >
                {mode.name}
              </button>
            ))}
          </div>
        </header>

        <section className="seeing-intro">
          <p className="seeing-intro-copy">如果你愿意，我们可以把这件事慢慢看清楚。</p>
        </section>

        <section className="seeing-opening">
          <p className="seeing-opening-copy">先不用急，让我们先一起回到此刻。</p>
          <label className="seeing-weather-label" htmlFor="opening-weather">
            你那里的天气怎么样？
          </label>
          <div className="seeing-weather-composer">
            <input
              id="opening-weather"
              className="seeing-weather-input"
              placeholder="在这里输入"
              value={openingWeather}
              onChange={(event) => setOpeningWeather(event.target.value)}
              onKeyDown={handleOpeningKeyDown}
            />
            <button className="seeing-composer-next" onClick={revealFirstStep} type="button">
              下一步
            </button>
          </div>
        </section>

        {visibleStepCount > 0 ? <p className="seeing-flow-note">{currentMode.intro}</p> : null}

        <section className="seeing-question-list">
          {currentMode.steps.slice(0, visibleStepCount).map((step, index) => {
            const canGoNext = Boolean(answers[step.key]?.trim()) && visibleStepCount < currentMode.steps.length;
            const answer = answers[step.key] ?? "";
            const isCompleted = index < visibleStepCount - 1 && editingStepKey !== step.key;
            const isEditing = editingStepKey === step.key;

            return (
              <article
                className={`seeing-question-item ${isCompleted ? "completed" : ""} ${isEditing ? "editing" : ""}`}
                key={step.key}
                ref={(element) => {
                  questionRefs.current[step.key] = element;
                }}
              >
                <div className="seeing-question-title">
                  <span className="seeing-question-index">{index + 1}</span>
                  <h3>{step.prompt}</h3>
                </div>
                {isCompleted ? (
                  <div className="seeing-answer-summary">
                    <p>{answer}</p>
                    <button className="seeing-edit-button" onClick={() => editStep(step.key)} type="button">
                      修改
                    </button>
                  </div>
                ) : (
                  <textarea
                    className="textarea seeing-textarea"
                    placeholder={step.placeholder}
                    ref={(element) => {
                      answerInputRefs.current[step.key] = element;
                    }}
                    value={answer}
                    onBlur={isEditing ? finishEditingStep : undefined}
                    onChange={(event) => updateAnswer(step.key, event.target.value)}
                    onKeyDown={(event) => handleAnswerKeyDown(event, index)}
                  />
                )}
                {!isCompleted && canGoNext ? (
                  <button className="text-button seeing-next-button" onClick={() => handleManualNext(index)} type="button">
                    下一步
                  </button>
                ) : null}
              </article>
            );
          })}
        </section>

        <footer className="seeing-save">
          <div className="seeing-save-copy">
            <h3>{DEFAULT_SEEING_MESSAGE}</h3>
          </div>

          <div className="seeing-save-actions">
            <button className="seeing-action-button primary" disabled={isSavePending} onClick={handleSave} type="button">
              {isSavePending ? "保存中..." : "保存到这里"}
            </button>
            <button className="seeing-action-button" onClick={() => resetComposer()} type="button">
              清空，重新开始
            </button>
          </div>
          {message !== DEFAULT_SEEING_MESSAGE ? <p className="seeing-status">{message}</p> : null}
        </footer>
      </section>
    </main>
  );
}

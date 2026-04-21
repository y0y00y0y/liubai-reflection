"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState, useTransition } from "react";

import {
  TOKEN_STORAGE_KEY,
  confirmPasswordReset,
  fetchCurrentUser,
  loginUser,
  registerUser,
  requestPasswordReset,
} from "@/lib/api";

type AuthMode = "login" | "register" | "reset";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const MESSAGE_TIMEOUT_MS = 5000;

function getPasswordError(password: string) {
  if (!password) return "请输入密码";
  if (!PASSWORD_PATTERN.test(password)) return "密码至少8位，包含字母和数字";
  return "";
}

export function AuthPageClient() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [message, setMessage] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [resetTokenTouched, setResetTokenTouched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isRegister = mode === "register";
  const isReset = mode === "reset";
  const needsStrongPassword = isRegister || isReset;

  const emailError = emailTouched && !EMAIL_PATTERN.test(email.trim()) ? "请输入有效邮箱" : "";
  const passwordError =
    passwordTouched && (needsStrongPassword ? getPasswordError(password) : !password ? "请输入密码" : "");
  const confirmPasswordError =
    (isRegister || isReset) && confirmPasswordTouched && password !== confirmPassword ? "两次输入的密码不一致" : "";
  const resetTokenError = isReset && resetTokenTouched && !resetToken.trim() ? "请输入重置 token" : "";

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return;
    void fetchCurrentUser(token)
      .then(() => {
        router.replace("/");
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      });
  }, [router]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), MESSAGE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
    setPassword("");
    setConfirmPassword("");
    setResetToken("");
    setPasswordTouched(false);
    setConfirmPasswordTouched(false);
    setResetTokenTouched(false);
  }

  function normalizeError(error: unknown) {
    const detail = error instanceof Error ? error.message : "认证失败";
    if (detail.toLowerCase().includes("failed to fetch")) {
      return "无法连接到服务器，请确认后端已启动并允许跨域访问。";
    }
    return detail;
  }

  function validateAuthForm() {
    const hasEmailError = !EMAIL_PATTERN.test(email.trim());
    const hasPasswordError = needsStrongPassword ? !!getPasswordError(password) : !password;
    const hasConfirmPasswordError = (isRegister || isReset) && password !== confirmPassword;
    const hasResetTokenError = isReset && !resetToken.trim();

    if (hasEmailError || hasPasswordError || hasConfirmPasswordError || hasResetTokenError) {
      setEmailTouched(true);
      setPasswordTouched(true);
      if (isRegister || isReset) setConfirmPasswordTouched(true);
      if (isReset) setResetTokenTouched(true);
      setMessage("请先修正输入。");
      return false;
    }
    return true;
  }

  function handleRequestReset() {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setEmailTouched(true);
      setMessage("请先输入有效邮箱。");
      return;
    }

    startTransition(async () => {
      try {
        const result = await requestPasswordReset({ email });
        if (result.reset_token) {
          setResetToken(result.reset_token);
          setResetTokenTouched(false);
        }
        setMessage(result.reset_token ? `${result.message} 本地开发 token 已自动填入。` : result.message);
      } catch (error) {
        setMessage(normalizeError(error));
      }
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateAuthForm()) return;

    startTransition(async () => {
      try {
        if (mode === "register") {
          const token = await registerUser({ email, display_name: displayName, password });
          window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
          router.replace("/");
          return;
        }

        if (mode === "reset") {
          const result = await confirmPasswordReset({
            token: resetToken,
            new_password: password,
          });
          switchMode("login");
          setEmail(email);
          setMessage(result);
          return;
        }

        const token = await loginUser({ email, password });
        window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
        router.replace("/");
      } catch (error) {
        setMessage(normalizeError(error));
      }
    });
  }

  const submitLabel = isPending
    ? "处理中..."
    : mode === "register"
      ? "注册并进入"
      : mode === "reset"
        ? "确认重置"
        : "登录";

  return (
    <main className="auth-page">
      <section className="auth-panel card">
        <div className="auth-copy">
          <p className="eyebrow">Liu Bai</p>
          <h1>在这里，更清晰地看见自己</h1>
          <p className="muted">我觉察自己，也尊重成长的过程。</p>
        </div>

        <div className="auth-form-card">
          <div className="mini-toggle">
            <button className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")} type="button">
              登录
            </button>
            <button className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")} type="button">
              注册
            </button>
          </div>

          <form className="stack-form" onSubmit={handleSubmit}>
            <input
              className={`input ${emailError ? "invalid" : ""}`}
              placeholder="邮箱"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (message) setMessage("");
              }}
              onBlur={() => setEmailTouched(true)}
            />
            {emailError ? <p className="field-hint error">{emailError}</p> : null}

            {isRegister ? (
              <input
                className="input"
                placeholder="显示名"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            ) : null}

            {isReset ? (
              <>
                <button className="secondary-button" disabled={isPending} onClick={handleRequestReset} type="button">
                  获取重置 token
                </button>
                <input
                  className={`input ${resetTokenError ? "invalid" : ""}`}
                  placeholder="重置 token"
                  value={resetToken}
                  onChange={(event) => {
                    setResetToken(event.target.value);
                    if (message) setMessage("");
                  }}
                  onBlur={() => setResetTokenTouched(true)}
                />
                {resetTokenError ? <p className="field-hint error">{resetTokenError}</p> : null}
              </>
            ) : null}

            <input
              className={`input ${passwordError ? "invalid" : ""}`}
              type="password"
              placeholder={isReset ? "新密码" : "密码"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (message) setMessage("");
              }}
              onBlur={() => setPasswordTouched(true)}
            />
            {passwordError ? <p className="field-hint error">{passwordError}</p> : null}
            {mode === "login" ? (
              <button className="text-button auth-forgot-button" onClick={() => switchMode("reset")} type="button">
                忘记密码？
              </button>
            ) : null}

            {isRegister || isReset ? (
              <>
                <input
                  className={`input ${confirmPasswordError ? "invalid" : ""}`}
                  type="password"
                  placeholder="再次输入密码"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    if (message) setMessage("");
                  }}
                  onBlur={() => setConfirmPasswordTouched(true)}
                />
                {confirmPasswordError ? <p className="field-hint error">{confirmPasswordError}</p> : null}
              </>
            ) : null}

            <button className="primary-button wide" disabled={isPending} type="submit">
              {submitLabel}
            </button>
          </form>

          {isReset ? (
            <div className="field-list">
              <p className="field-hint">输入邮箱后先获取重置 token，再设置新密码。</p>
              <button className="text-button auth-back-button" onClick={() => switchMode("login")} type="button">
                返回登录
              </button>
            </div>
          ) : null}
          {message ? <p className="muted">{message}</p> : null}
        </div>
      </section>
    </main>
  );
}

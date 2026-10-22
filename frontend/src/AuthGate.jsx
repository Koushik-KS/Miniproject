
import { useEffect, useState } from "react";
import {
  FiLock,
  FiMail,
  FiUser,
  FiLogOut,
  FiArrowLeft,
  FiCheckCircle,
} from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import App from "./App";
import "./Auth.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

async function authRequest(path, options = {}) {
  const response = await fetch(`${API_URL}/api/auth${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export default function AuthGate() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resetToken = searchParams.get("token");
  const isResetRoute = window.location.pathname === "/reset-password";

  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [resetPassword, setResetPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  useEffect(() => {
    let active = true;

    authRequest("/me")
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setNotice("");
    setBusy(true);

    try {
      const path = mode === "register" ? "/register" : "/login";
      const payload =
        mode === "register"
          ? form
          : { email: form.email, password: form.password };

      const data = await authRequest(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setUser(data.user);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    setMessage("");
    setNotice("");
    setBusy(true);

    try {
      const data = await authRequest("/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: form.email }),
      });
      setNotice(data.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setMessage("");
    setNotice("");

    if (!resetToken) {
      setMessage("This reset link is missing its token. Request a new link.");
      return;
    }

    if (resetPassword !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const data = await authRequest("/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: resetToken,
          password: resetPassword,
        }),
      });

      setResetComplete(true);
      setNotice(data.message);
      setResetPassword("");
      setConfirmPassword("");
      setSearchParams({});
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    try {
      await authRequest("/logout", { method: "POST" });
    } finally {
      setUser(null);
      setForm({
        fullName: "",
        email: "",
        phone: "",
        password: "",
      });
    }
  }

  if (checking) {
    return <div className="auth-loading">Checking your KisanVision AI session…</div>;
  }

  if (user && !isResetRoute) {
    return (
      <>
        <div className="auth-session-bar">
          <span>
            Signed in as <strong>{user.fullName}</strong>
          </span>
          <button type="button" onClick={handleLogout}>
            <FiLogOut /> Sign out
          </button>
        </div>
        <App />
      </>
    );
  }

  if (isResetRoute) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="auth-brand">
            <div className="auth-logo">K</div>
            <div>
              <h1>KisanVision AI</h1>
              <p>Secure password recovery</p>
            </div>
          </div>

          {resetComplete ? (
            <>
              <FiCheckCircle size={36} color="#166534" />
              <h2>Password updated</h2>
              <p className="auth-subtitle">{notice}</p>
              <button
                className="auth-submit"
                type="button"
                onClick={() => {
                  window.history.replaceState({}, "", "/");
                  window.location.reload();
                }}
              >
                Return to sign in
              </button>
            </>
          ) : (
            <>
              <h2>Choose a new password</h2>
              <p className="auth-subtitle">
                Your reset link is valid for 15 minutes and can be used once.
              </p>

              {message && <div className="auth-message" role="alert">{message}</div>}

              <form onSubmit={handleResetPassword}>
                <label htmlFor="newPassword">New password</label>
                <div className="auth-input-wrap">
                  <FiLock />
                  <input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    value={resetPassword}
                    onChange={(event) => setResetPassword(event.target.value)}
                    required
                  />
                </div>

                <label htmlFor="confirmPassword">Confirm new password</label>
                <div className="auth-input-wrap">
                  <FiLock />
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </div>

                <button className="auth-submit" disabled={busy} type="submit">
                  {busy ? "Updating password…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">K</div>
          <div>
            <h1>KisanVision AI</h1>
            <p>Intelligent Crop Health Assessment</p>
          </div>
        </div>

        {mode === "forgot" ? (
          <>
            <h2>Forgot your password?</h2>
            <p className="auth-subtitle">
              Enter your registered email to request a reset link.
            </p>

            {message && <div className="auth-message" role="alert">{message}</div>}
            {notice && <div className="auth-notice" role="status">{notice}</div>}

            <form onSubmit={handleForgotPassword}>
              <label htmlFor="forgotEmail">Email address</label>
              <div className="auth-input-wrap">
                <FiMail />
                <input
                  id="forgotEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  required
                />
              </div>

              <button className="auth-submit" type="submit" disabled={busy}>
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <button
              className="auth-back-button"
              type="button"
              onClick={() => {
                setMode("login");
                setMessage("");
                setNotice("");
              }}
            >
              <FiArrowLeft /> Back to sign in
            </button>
          </>
        ) : (
          <>
            <h2>{mode === "register" ? "Create your account" : "Welcome back"}</h2>
            <p className="auth-subtitle">
              Sign in to access your crop assessment dashboard.
            </p>

            <div className="auth-tabs">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  setMode("login");
                  setMessage("");
                  setNotice("");
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={mode === "register" ? "active" : ""}
                onClick={() => {
                  setMode("register");
                  setMessage("");
                  setNotice("");
                }}
              >
                Sign up
              </button>
            </div>

            {message && <div className="auth-message" role="alert">{message}</div>}

            <form onSubmit={handleSubmit}>
              {mode === "register" && (
                <>
                  <label htmlFor="fullName">Full name</label>
                  <div className="auth-input-wrap">
                    <FiUser />
                    <input
                      id="fullName"
                      name="fullName"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      value={form.fullName}
                      onChange={updateField}
                      minLength={2}
                      maxLength={80}
                      required
                    />
                  </div>

                  <label htmlFor="phone">Phone number (optional)</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Enter your phone number"
                    value={form.phone}
                    onChange={updateField}
                    maxLength={20}
                  />
                </>
              )}

              <label htmlFor="email">Email address</label>
              <div className="auth-input-wrap">
                <FiMail />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={updateField}
                  maxLength={254}
                  required
                />
              </div>

              <label htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <FiLock />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  placeholder={mode === "register" ? "At least 8 characters" : "Enter your password"}
                  value={form.password}
                  onChange={updateField}
                  minLength={mode === "register" ? 8 : undefined}
                  maxLength={72}
                  required
                />
              </div>

              {mode === "login" && (
                <button
                  className="auth-forgot-link"
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setMessage("");
                    setNotice("");
                  }}
                >
                  Forgot password?
                </button>
              )}

              <button className="auth-submit" type="submit" disabled={busy}>
                {busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in securely"}
              </button>
            </form>

            <p className="auth-footer">
              Your account is protected by secure server-side authentication.
            </p>
          </>
        )}
      </section>
    </main>
  );
}

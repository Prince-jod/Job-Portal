import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle, X, ArrowRight } from "lucide-react";
import { loginPageStyles as s } from "../assets/dummyStyles";

const API_BASE = "http://localhost:5000/api";

const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setToast({ type: "error", message: "Please enter both email and password." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email: email.trim(),
        password,
      });

      const { user, token } = res.data;

      if (user) localStorage.setItem("user", JSON.stringify(user));
      if (token) localStorage.setItem("token", token);

      setToast({ type: "success", message: "Login successful. Redirecting..." });

      setTimeout(() => {
        navigate("/");
      }, 800);
    } catch (err) {
      console.error("Login failed:", err);
      const message =
        err.response?.data?.message ?? "Invalid email or password. Please try again.";
      setToast({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={s.pageContainer}>
      {/* Toast */}
      {toast && (
        <div
          className={`${s.toastContainer} ${
            toast.type === "success" ? s.toastBorderSuccess : s.toastBorderError
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className={`${s.toastIconSuccess} w-5 h-5 shrink-0`} />
          ) : (
            <XCircle className={`${s.toastIconError} w-5 h-5 shrink-0`} />
          )}
          <p className={s.toastMessage}>{toast.message}</p>
          <button onClick={() => setToast(null)} className={s.toastCloseBtn}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className={s.card}>
        <div className={s.header}>
          <h1 className={s.title}>Welcome Back</h1>
          <p className={s.subtitle}>Login to manage jobs and applicants</p>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          {/* Email */}
          <div className={s.formGroup}>
            <label className={s.label}>Email</label>
            <div className={s.inputWrapper}>
              <span className={s.iconWrapper}>
                <Mail className={s.iconDefault} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={`${s.inputBase} ${s.inputPr3}`}
              />
            </div>
          </div>

          {/* Password */}
          <div className={s.formGroup}>
            <label className={s.label}>Password</label>
            <div className={s.inputWrapper}>
              <span className={s.iconWrapper}>
                <Lock className={s.iconDefault} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className={`${s.inputBase} ${s.inputPr12}`}
              />
              <span className={s.eyeButtonWrapper}>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={s.eyeButton}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </span>
            </div>
          </div>

          <button type="submit" disabled={submitting} className={s.submitBtn}>
            {submitting ? "Signing in..." : "Sign In"}
            <ArrowRight className={`${s.submitIcon} w-4 h-4`} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  UploadCloud,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  Loader2,
  ListChecks,
  Sparkles,
  List,
  Hash,
} from "lucide-react";
import { companyQuestionPageStyles as s } from "../assets/dummyStyles";

const API_BASE = "http://localhost:5000/api";

// Attaches the admin JWT. addInterviewCompany is protected by
// authMiddleware + authorize("admin").
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ---------------- Helpers ---------------- */

const parseCountString = (str) => {
  if (!str) return NaN;
  const trimmed = str.trim().toLowerCase().replace(/,/g, "");
  const match = trimmed.match(/^(\d+(?:\.\d+)?)(k)?\+?$/);
  if (!match) return NaN;
  const num = parseFloat(match[1]);
  const isK = match[2] === "k";
  return isK ? num * 1000 : num;
};

const formatCountShort = (n) => {
  const num = Number(n) || 0;
  if (num >= 1000) {
    const k = num / 1000;
    if (num % 1000 === 0) return `${k}k`;
    return `${parseFloat(k.toFixed(1)).toString()}k+`;
  }
  return String(num);
};

const formatDatePretty = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput;
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseCSVText = (text) => {
  const rows = [];
  let i = 0;
  const len = text.length;
  let cur = "";
  let row = [];
  let inQuotes = false;

  while (i < len) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < len && text[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        cur += ch;
        i++;
        continue;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }

      if (ch === ",") {
        row.push(cur);
        cur = "";
        i++;
        continue;
      }

      if (ch === "\r") {
        if (i + 1 < len && text[i + 1] === "\n") i++;
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
        i++;
        continue;
      }

      if (ch === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
        i++;
        continue;
      }

      cur += ch;
      i++;
      continue;
    }
  }

  if (inQuotes) {
    row.push(cur);
    rows.push(row);
  } else {
    if (cur !== "" || row.length > 0) {
      row.push(cur);
      rows.push(row);
    }
  }

  return rows.map((r) => r.map((cell) => (cell == null ? "" : cell.trim())));
};

/* ---------------- Component ---------------- */

const CompanyQuestionsPage = () => {
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [questionsCount, setQuestionsCount] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const logoInputRef = useRef(null);
  const csvInputRef = useRef(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  /* ---- Logo ---- */
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
      setErrors((prev) => ({ ...prev, logo: undefined }));
    } else {
      setLogoFile(null);
      setLogoPreview("");
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  /* ---- CSV ---- */
  const handleCsvChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setErrors((prev) => ({ ...prev, csvFile: undefined }));

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = parseCSVText(text);
      if (!rows || rows.length === 0) {
        setParsedQuestions([]);
        return;
      }

      const headers = rows[0].map((h) => (h || "").toString().toLowerCase());
      const questionIdx = headers.findIndex((h) => h.includes("question"));
      const answerIdx = headers.findIndex((h) => h.includes("answer"));
      const keyPointsIdx =
        headers.findIndex((h) => h.includes("key")) >= 0
          ? headers.findIndex((h) => h.includes("key"))
          : headers.findIndex((h) => h.includes("keypoints"));
      const postDateIdx =
        headers.findIndex((h) => h.includes("postdate")) >= 0
          ? headers.findIndex((h) => h.includes("postdate"))
          : headers.findIndex((h) => h.includes("date")) >= 0
          ? headers.findIndex((h) => h.includes("date"))
          : headers.findIndex((h) => h.includes("posted"));

      const fallbackQuestionIdx = questionIdx >= 0 ? questionIdx : 0;
      const fallbackAnswerIdx =
        answerIdx >= 0 ? answerIdx : fallbackQuestionIdx === 0 ? 1 : 0;
      const fallbackKeyPointsIdx =
        keyPointsIdx >= 0
          ? keyPointsIdx
          : Math.max(0, Math.min(rows[0].length - 1, fallbackAnswerIdx + 1));

      const defaultDate = file.lastModified
        ? new Date(file.lastModified)
        : new Date();

      const questions = [];
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        if (!values.some((v) => (v || "").toString().trim() !== "")) continue;

        const question = values[questionIdx] ?? values[fallbackQuestionIdx] ?? "";
        const answer = values[answerIdx] ?? values[fallbackAnswerIdx] ?? "";
        const keyRaw = values[keyPointsIdx] ?? values[fallbackKeyPointsIdx] ?? "";
        const postRaw = (postDateIdx >= 0 ? values[postDateIdx] : undefined) ?? "";

        const finalPostDate = postRaw.split(/[;|\n]/)[0]?.trim();
        const postDateValue = finalPostDate ? finalPostDate : defaultDate.toISOString();

        const keyPoints = (keyRaw || "")
          .split(/(?:;|\||\r?\n)+/)
          .map((k) => k.trim())
          .filter((k) => k !== "");

        questions.push({
          question: question || "",
          answer: answer || "",
          keyPoints,
          postDate: postDateValue,
        });
      }

      setParsedQuestions(questions);

      // Auto-fill the declared count from the parsed CSV if the admin hasn't
      // typed one in yet — they can still override it manually.
      setQuestionsCount((prev) => (prev.trim() ? prev : String(questions.length)));
    };
    reader.readAsText(file);
  };

  const handleRemoveCsv = () => {
    setCsvFile(null);
    setParsedQuestions([]);
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

  /* ---- Validate ---- */
  const validateForm = () => {
    const newErrors = {};
    if (!companyName.trim()) newErrors.companyName = "Company name is required";

    const parsedCount = parseCountString(questionsCount);
    if (!questionsCount.trim() || isNaN(parsedCount) || parsedCount <= 0)
      newErrors.questionsCount = "Enter a valid number of questions (e.g., 1600, 10k+)";

    if (!csvFile) newErrors.csvFile = "CSV file is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setCompanyName("");
    setQuestionsCount("");
    handleRemoveLogo();
    handleRemoveCsv();
    setErrors({});
  };

  /* ---- Submit ---- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setToast({ type: "error", message: "Please fix the highlighted fields." });
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("companyName", companyName.trim());
      formDataToSend.append("questionsCount", parseCountString(questionsCount));
      if (logoFile) formDataToSend.append("logoFile", logoFile);
      formDataToSend.append("csvFile", csvFile);

      // Mounted per interview.routes.js: interviewRouter.post('/', ...) -> POST /api/interview
      await api.post("/interview", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast({ type: "success", message: "Company questions added successfully!" });
      resetForm();
    } catch (error) {
      console.error("Error submitting form:", error);

      if (error.response?.status === 401) {
        setToast({ type: "error", message: "Session expired. Please log in again." });
        setTimeout(() => navigate("/login"), 1200);
      } else if (error.response?.status === 403) {
        setToast({ type: "error", message: "You need admin access to do this." });
      } else {
        const message =
          error.response?.data?.message ?? "Failed to submit form. Please try again.";
        setToast({ type: "error", message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={s.pageContainer}>
      {/* Toast */}
      {toast && (
        <div className={s.toastWrapper}>
          <div
            className={`${s.toastBase} ${
              toast.type === "success" ? s.toastSuccess : s.toastError
            }`}
          >
            {toast.type === "success" ? (
              <Check className={`${s.toastIconSuccess} w-5 h-5 shrink-0`} />
            ) : (
              <AlertCircle className={`${s.toastIconError} w-5 h-5 shrink-0`} />
            )}
            <p className={s.toastMessage}>{toast.message}</p>
            <button onClick={() => setToast(null)} className={s.toastCloseBtn}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className={s.contentWrapper}>
        {/* Header */}
        <div className={s.header}>
          <h1 className={s.headerTitle}>Company Questions</h1>
          <p className={s.headerSubtitle}>
            Add interview questions for a company via CSV upload
          </p>
        </div>

        {/* Form */}
        <div className={s.formCard}>
          <form onSubmit={handleSubmit} className={s.form}>
            <div className={s.gridRow}>
              {/* Company Name */}
              <div className={s.colSpan2}>
                <label className={s.label}>
                  Company Name <span className={s.requiredStar}>*</span>
                </label>
                <div className={s.inputWrapper}>
                  <Building2 className={s.inputIcon} />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Infosys"
                    className={`${s.inputField} ${
                      errors.companyName ? s.inputError : s.inputDefault
                    }`}
                  />
                </div>
                {errors.companyName && <p className={s.errorText}>{errors.companyName}</p>}
              </div>

              {/* Questions Count (manual, matches schema field) */}
              <div>
                <label className={s.label}>
                  Questions Count <span className={s.requiredStar}>*</span>
                </label>
                <div className={s.inputWrapper}>
                  <Hash className={s.inputIcon} />
                  <input
                    type="text"
                    value={questionsCount}
                    onChange={(e) => setQuestionsCount(e.target.value)}
                    placeholder="e.g. 1600 or 10k+"
                    className={`${s.inputField} ${
                      errors.questionsCount ? s.inputError : s.inputDefault
                    }`}
                  />
                </div>
                <div className={s.countHelperRow}>
                  <span className={s.countHelperText}>Detected from CSV:</span>
                  <span className={s.countDisplayValue}>
                    {formatCountShort(parsedQuestions.length)}
                  </span>
                </div>
                <p className={s.countHint}>
                  Auto-filled from the CSV row count — override if needed
                </p>
                {errors.questionsCount && (
                  <p className={s.errorText}>{errors.questionsCount}</p>
                )}
              </div>
            </div>

            {/* Logo upload */}
            <div>
              <label className={s.label}>Company Logo</label>
              <div className={s.logoContainer}>
                <div className={s.logoPreviewWrapper}>
                  {logoPreview ? (
                    <div className={s.logoPreviewBox}>
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className={s.logoPreviewImage}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className={s.removeLogoBtn}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className={s.logoPlaceholder}
                    >
                      <Building2 className="w-6 h-6" />
                    </button>
                  )}
                </div>

                <div className={s.logoUploadArea}>
                  <label htmlFor="company-question-logo" className={s.logoUploadLabel}>
                    <UploadCloud className="w-4 h-4" />
                    {logoFile ? "Change Logo" : "Upload Logo"}
                  </label>
                  <input
                    id="company-question-logo"
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className={s.fileInputHidden}
                  />
                  <p className={s.logoHint}>Optional. PNG or JPG.</p>
                </div>
              </div>
              {errors.logo && <p className={s.errorText}>{errors.logo}</p>}
            </div>

            {/* CSV upload */}
            <div>
              <label className={s.label}>
                Questions CSV <span className={s.requiredStar}>*</span>
              </label>
              <div className={s.csvUploadContainer}>
                <label htmlFor="company-question-csv" className={s.csvUploadLabel}>
                  <FileSpreadsheet className="w-4 h-4" />
                  {csvFile ? "Change CSV" : "Upload CSV"}
                </label>
                <input
                  id="company-question-csv"
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvChange}
                  className={s.fileInputHidden}
                />

                {csvFile && (
                  <>
                    <span className={s.csvFileName}>{csvFile.name}</span>
                    <span className={s.csvLoadedBadge}>
                      <Check className="w-3.5 h-3.5" />
                      {parsedQuestions.length} questions parsed
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCsv}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              {errors.csvFile && <p className={s.errorText}>{errors.csvFile}</p>}
              <p className={s.logoHint}>
                Columns: <code>question</code>, <code>answer</code>, <code>keyPoints</code>{" "}
                (semicolon-separated), <code>postDate</code> — all optional except question/answer
              </p>
            </div>

            <div className={s.submitSection}>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${s.submitBtn} ${isSubmitting ? s.submitBtnDisabled : ""}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className={s.spinner} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ListChecks className="w-5 h-5" />
                    Add Company Questions
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Parsed questions preview */}
        {parsedQuestions.length > 0 && (
          <div className={s.questionsSection}>
            <h2 className={s.sectionTitle}>
              <Sparkles className={s.sectionTitleIcon} />
              Parsed Questions Preview
            </h2>

            <div className={s.questionsGrid}>
              {parsedQuestions.map((q, idx) => (
                <div key={idx} className={s.questionCard}>
                  <div className={s.cardInner}>
                    <ListChecks className={s.cardIcon} />
                    <div className={s.cardContent}>
                      <div className={s.cardHeader}>
                        <p
                          className={`${s.cardQuestion} ${
                            !q.question ? s.cardQuestionMissing : ""
                          }`}
                        >
                          {q.question || "No question text"}
                        </p>
                        <span className={s.cardDateBadge}>
                          {formatDatePretty(q.postDate)}
                        </span>
                      </div>

                      {q.answer && (
                        <div className={s.answerSection}>
                          <p className={s.answerLabel}>
                            <List className={s.answerIcon} />
                            Answer
                          </p>
                          <div className={s.answerContent}>{q.answer}</div>
                        </div>
                      )}

                      {q.keyPoints.length > 0 && (
                        <div className={s.keyPointsSection}>
                          <p className={s.keyPointsLabel}>
                            <Sparkles className="w-3 h-3" />
                            Key Points
                          </p>
                          <ul className={s.keyPointsList}>
                            {q.keyPoints.map((point, i) => (
                              <li key={i} className={s.keyPointItem}>
                                <span className={s.keyPointIcon}>•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyQuestionsPage;

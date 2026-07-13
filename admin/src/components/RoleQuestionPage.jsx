import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  UserCheck,
  Hash,
  ImageIcon,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  Loader2,
  ListChecks,
  Building2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { roleQuestionPageStyles as s } from "../assets/dummyStyles";

const API_BASE = "http://localhost:5000/api";

// Attaches the admin JWT. addInterviewRole is protected by
// authMiddleware + authorize("admin").
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ---------------- CSV parsing helpers (kept as written) ---------------- */

function parseCSV(text) {
  if (!text) return { headersRaw: [], headers: [], data: [] };
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let insideQuotes = false;
  let cur = "";
  let line = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && !insideQuotes) {
      insideQuotes = true;
      continue;
    }
    if (ch === '"' && insideQuotes && next === '"') {
      cur += '"';
      i++;
      continue;
    }
    if (ch === '"' && insideQuotes) {
      insideQuotes = false;
      continue;
    }
    if (ch === "," && !insideQuotes) {
      line.push(cur);
      cur = "";
      continue;
    }
    if (ch === "\n" && !insideQuotes) {
      line.push(cur);
      rows.push(line.slice());
      line = [];
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur !== "" || line.length > 0) {
    line.push(cur);
    rows.push(line.slice());
  }

  const nonEmpty = rows.filter((r) =>
    r.some((c) => (c || "").toString().trim() !== ""),
  );
  if (nonEmpty.length === 0) return { headersRaw: [], headers: [], data: [] };

  const headersRaw = nonEmpty[0].map((h) => (h || "").toString().trim());
  const headers = headersRaw.map((h) => h.toLowerCase().replace(/\s+/g, "_"));

  const data = [];
  for (let i = 1; i < nonEmpty.length; i++) {
    const row = nonEmpty[i];
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] != null ? row[idx].toString().trim() : "";
    });
    obj.__rawCells = nonEmpty[i];
    data.push(obj);
  }
  return { headersRaw, headers, data };
}

const splitMulti = (cell) =>
  (cell || "")
    .toString()
    .split(/[\n;\|]+/)
    .map((s) => s.trim())
    .filter(Boolean);

function parseCompanyEntry(entry) {
  if (!entry) return { name: "", date: "" };
  const paren = entry.match(/^(.*?)\s*\(\s*([^)]+)\s*\)\s*$/);
  if (paren) return { name: paren[1].trim(), date: paren[2].trim() };
  const hyphen = entry.match(/^(.*?)\s*[-–—]\s*(.+)$/);
  if (hyphen && /\d/.test(hyphen[2]))
    return { name: hyphen[1].trim(), date: hyphen[2].trim() };
  return { name: entry.trim(), date: "" };
}

function uniqueStrings(arr) {
  const set = new Set();
  arr.forEach((x) => {
    if (x && x.toString().trim()) set.add(x.toString().trim());
  });
  return Array.from(set);
}

function uniquePairs(arr) {
  const seen = new Set();
  const out = [];
  arr.forEach((p) => {
    const k = `${(p.name || "").toLowerCase()}||${(p.date || "").toLowerCase()}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ name: p.name || "", date: p.date || "" });
    }
  });
  return out;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-GB");
}

const findHeaderKey = (headers, variants) => {
  for (const v of variants) {
    const low = v.toLowerCase().replace(/\s+/g, "_");
    const idx = headers.indexOf(low);
    if (idx !== -1) return headers[idx];
  }
  for (const h of headers) {
    for (const v of variants) {
      if ((h || "").includes(v.toLowerCase().replace(/\s+/g, "_"))) return h;
    }
  }
  return null;
};

/* ---------------- Component ---------------- */

const RoleQuestionPage = () => {
  const navigate = useNavigate();

  const [roleName, setRoleName] = useState("");
  const [totalQuestions, setTotalQuestions] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [csvFile, setCsvFile] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [toast, setToast] = useState(null);
  const [isParsingCsv, setIsParsingCsv] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const imageInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const clearToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clearToast, 3000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  /* ---- Image ---- */
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast({ message: "Please select a valid image file.", type: "error" });
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  /* ---- CSV ---- */
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setIsParsingCsv(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { headers, data } = parseCSV(ev.target.result);
        if (!data || data.length === 0) {
          setToast({ message: "CSV is empty or malformed", type: "error" });
          setIsParsingCsv(false);
          return;
        }

        const qKey = findHeaderKey(headers, ["question", "q", "prompt", "title"]);
        const aKey = findHeaderKey(headers, ["answer", "ans", "response", "solution"]);
        const kpKey = findHeaderKey(headers, [
          "keypoints",
          "key_points",
          "key_point",
          "points",
          "highlights",
        ]);
        const companyKey = findHeaderKey(headers, [
          "company",
          "companies",
          "employer",
          "company_name",
        ]);
        const dateKey = findHeaderKey(headers, ["date", "asked_date", "posted", "post_date"]);

        const map = new Map();

        data.forEach((rowObj) => {
          const rawQuestion = (qKey && rowObj[qKey]) || Object.values(rowObj)[0] || "";
          const question = (rawQuestion || "").toString().trim();
          if (!question) return;

          const answer = (aKey && rowObj[aKey]) || "";
          const keypointsCell = (kpKey && rowObj[kpKey]) || "";
          const companyCell = (companyKey && rowObj[companyKey]) || "";
          const dateCell = (dateKey && rowObj[dateKey]) || "";

          const keypoints = uniqueStrings(splitMulti(keypointsCell));

          let pairs = [];
          const compEntries = splitMulti(companyCell);
          const dateEntries = splitMulti(dateCell);

          const parsedFromCompany = compEntries.map((c) => parseCompanyEntry(c));
          const hasParsedDates = parsedFromCompany.some((p) => p.date);

          if (compEntries.length > 0 && hasParsedDates) {
            pairs = parsedFromCompany.map((p) => ({
              name: p.name || "",
              date: p.date || "",
            }));
          } else if (compEntries.length > 0 && dateEntries.length > 0) {
            const max = Math.max(compEntries.length, dateEntries.length);
            for (let i = 0; i < max; i++) {
              const comp = compEntries[i] ? parseCompanyEntry(compEntries[i]).name : "N/A";
              const dt = dateEntries[i] || dateEntries[0] || "";
              pairs.push({ name: comp, date: dt });
            }
          } else if (compEntries.length > 0) {
            pairs = compEntries.map((c) => {
              const p = parseCompanyEntry(c);
              return { name: p.name || "", date: p.date || "" };
            });
          } else if (dateEntries.length > 0) {
            pairs = dateEntries.map((d) => ({ name: "N/A", date: d }));
          } else {
            pairs = [];
          }

          const key = question.toLowerCase();
          if (!map.has(key)) {
            map.set(key, {
              question,
              answer: (answer || "").toString().trim(),
              keyPoints: keypoints.slice(),
              companies: pairs.slice(),
            });
          } else {
            const ex = map.get(key);
            if (
              ((answer || "") + "").toString().trim().length >
              (ex.answer || "").toString().trim().length
            ) {
              ex.answer = (answer || "").toString().trim();
            }
            ex.keyPoints = uniqueStrings([...ex.keyPoints, ...keypoints]);
            ex.companies = uniquePairs([...ex.companies, ...pairs]);
            map.set(key, ex);
          }
        });

        const aggregated = Array.from(map.values()).map((item, idx) => ({
          id: idx + 1,
          ...item,
        }));
        aggregated.forEach((it) => {
          it.companies = uniquePairs(it.companies || []);
          it.keyPoints = uniqueStrings(it.keyPoints || []);
        });
        aggregated.sort((a, b) => (b.companies?.length || 0) - (a.companies?.length || 0));

        setQuestions(aggregated);

        // Auto-fill declared total if empty
        setTotalQuestions((prev) => (prev.trim() ? prev : String(aggregated.length)));

        setToast({ message: "CSV parsed successfully", type: "success" });
      } catch (err) {
        console.error("CSV parse error:", err);
        setToast({
          message: "Failed to parse CSV — check formatting and headers",
          type: "error",
        });
      } finally {
        setIsParsingCsv(false);
      }
    };

    reader.onerror = () => {
      setToast({ message: "Error reading file", type: "error" });
      setIsParsingCsv(false);
    };

    reader.readAsText(file, "utf-8");
  };

  const handleRemoveCsv = () => {
    setCsvFile(null);
    setQuestions([]);
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

  /* ---- Validate & Submit ---- */
  const validateFields = () => {
    if (!roleName.trim()) {
      setToast({ message: "Role name is required", type: "error" });
      return false;
    }
    if (!totalQuestions.trim()) {
      setToast({ message: "Total questions is required", type: "error" });
      return false;
    }
    if (!imageFile) {
      setToast({ message: "Please upload an image", type: "error" });
      return false;
    }
    if (questions.length === 0) {
      setToast({ message: "Please upload a CSV with questions", type: "error" });
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setRoleName("");
    setTotalQuestions("");
    handleRemoveImage();
    handleRemoveCsv();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) return;

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("roleName", roleName.trim());
      formDataToSend.append("questionsCount", totalQuestions);
      formDataToSend.append("imageFile", imageFile);
      formDataToSend.append("csvFile", csvFile);
      formDataToSend.append("csvFileName", csvFile.name);
      formDataToSend.append("questionsData", JSON.stringify(questions));

      // Mounted per interview.routes.js: interviewRouter.post('/role', ...) -> POST /api/interview/role
      await api.post("/interview/role", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast({ message: "Role successfully uploaded", type: "success" });
      resetForm();
    } catch (err) {
      console.error("Failed to submit role questions:", err);

      if (err.response?.status === 401) {
        setToast({ message: "Session expired. Please log in again.", type: "error" });
        setTimeout(() => navigate("/login"), 1200);
      } else if (err.response?.status === 403) {
        setToast({ message: "You need admin access to do this.", type: "error" });
      } else {
        const message =
          err.response?.data?.message ?? "Failed to upload role. Please try again.";
        setToast({ message, type: "error" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={s.pageContainer}>
      <div className={s.contentWrapper}>
        <h1 className={s.title}>Role Questions</h1>

        <form onSubmit={handleSubmit}>
          <div className={s.formGrid}>
            {/* Left column */}
            <div className={s.formColumn}>
              <div className={s.card}>
                <label className={s.cardLabel}>
                  <UserCheck className={s.labelIcon} />
                  Role Name <span className={s.requiredStar}>*</span>
                </label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. Frontend Developer"
                  className={s.inputField}
                />
              </div>

              <div className={s.card}>
                <label className={s.cardLabel}>
                  <ImageIcon className={s.labelIcon} />
                  Role Image <span className={s.requiredStar}>*</span>
                </label>
                <label htmlFor="role-image-input" className={s.dropzone}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className={s.previewImage} />
                  ) : (
                    <>
                      <ImageIcon className={s.uploadIcon} />
                      <p className={s.uploadText}>Click to upload an image</p>
                      <p className={s.uploadHint}>PNG or JPG</p>
                    </>
                  )}
                </label>
                <input
                  id="role-image-input"
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={s.fileInputHidden}
                />
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove image
                  </button>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className={s.formColumn}>
              <div className={s.card}>
                <label className={s.cardLabel}>
                  <Hash className={s.labelIcon} />
                  Total Questions <span className={s.requiredStar}>*</span>
                </label>
                <input
                  type="text"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(e.target.value)}
                  placeholder="e.g. 120"
                  className={s.inputField}
                />
              </div>

              <div className={s.card}>
                <label className={s.cardLabel}>
                  <FileSpreadsheet className={s.labelIcon} />
                  Questions CSV <span className={s.requiredStar}>*</span>
                </label>
                <label htmlFor="role-csv-input" className={s.dropzone}>
                  <FileSpreadsheet className={s.uploadIcon} />
                  <p className={s.uploadText}>
                    {csvFile ? csvFile.name : "Click to upload a CSV"}
                  </p>
                  <p className={s.uploadHint}>
                    Columns: question, answer, keyPoints, company, date
                  </p>
                </label>
                <input
                  id="role-csv-input"
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className={s.fileInputHidden}
                />

                {isParsingCsv && (
                  <div className={s.spinnerContainer}>
                    <div className={s.spinner}></div>
                  </div>
                )}

                {!isParsingCsv && questions.length > 0 && (
                  <div className={s.csvSuccess}>
                    <Check className="w-4 h-4" />
                    {questions.length} questions parsed
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={s.buttonContainer}>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${s.addButton} ${isSubmitting ? s.addButtonDisabled : ""}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className={s.buttonSpinner} />
                  Uploading...
                </>
              ) : (
                <>
                  <ListChecks className="w-5 h-5" />
                  Add Role Questions
                </>
              )}
            </button>
          </div>
        </form>

        {/* Parsed questions preview */}
        {questions.length > 0 && (
          <div className={s.questionsSection}>
            <h2 className={s.sectionTitle}>Parsed Questions</h2>

            <div className={s.questionsGrid}>
              {questions.map((q, idx) => (
                <div key={q.id ?? idx} className={`${s.questionCard} ${s.cardAnimation}`}>
                  <div className={s.cardTopLine}></div>
                  <span className={s.questionNumberBadge}>#{idx + 1}</span>

                  <div className={s.questionTextContainer}>
                    <p className={s.questionText}>{q.question}</p>
                  </div>

                  {q.answer && <div className={s.answerContainer}>{q.answer}</div>}

                  {q.keyPoints?.length > 0 && (
                    <div className={s.keyPointsContainer}>
                      {q.keyPoints.map((point, i) => (
                        <span key={i} className={s.keyPointBadge}>
                          {point}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className={s.companiesLabel}>
                    <Sparkles className="w-3 h-3" />
                    Asked at
                  </p>
                  {q.companies?.length > 0 ? (
                    <div className={s.companiesContainer}>
                      {q.companies.map((c, i) => (
                        <span key={i} className={s.companyBadge}>
                          <Building2 className={s.companyIcon} />
                          <span className={s.companyName}>{c.name || "N/A"}</span>
                          {c.date && (
                            <>
                              <span className={s.separator}>•</span>
                              <Calendar className={s.calendarIcon} />
                              <span className={s.dateText}>{formatDate(c.date)}</span>
                            </>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={s.noDataText}>No company data</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border-l-4 ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                : "bg-rose-50 border-rose-500 text-rose-800"
            }`}
          >
            {toast.type === "success" ? (
              <Check className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={clearToast} className="ml-2 text-current opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .card-animation {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default RoleQuestionPage;

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Building2,
  Globe,
  UploadCloud,
  X,
  Check,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { companiesPageStyles as s } from "../assets/dummyStyles";

const API_BASE = "http://localhost:5000/api";

// Attaches the admin JWT automatically. addCompany / deleteCompany are
// protected by authMiddleware + authorize("admin"); getCompanies is public.
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const resolveLogoUrl = (logo) => {
  if (!logo) return null;
  if (logo.startsWith("http") || logo.startsWith("data:")) return logo;
  return `http://localhost:5000${logo}`;
};

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [website, setWebsite] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error' | 'confirm', message, onConfirm }

  const fileInputRef = useRef(null);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.get("/companies");
      const data = Array.isArray(res.data) ? res.data : res.data.companies ?? [];
      setCompanies(data);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
      setToast({ type: "error", message: "Could not load companies." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (!toast || toast.type === "confirm") return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const handleBrowseClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, logo: "Please select a valid image file." }));
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, logo: undefined }));
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    const newErrors = {};
    if (!website.trim()) {
      newErrors.website = "Website is required.";
    } else if (!/^https?:\/\/.+\..+/.test(website.trim())) {
      newErrors.website = "Enter a valid URL (starting with http:// or https://).";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setWebsite("");
    handleRemoveLogo();
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("website", website.trim());
      if (logoFile) formData.append("logo", logoFile);

      // POST /api/companies -> addCompany
      const res = await api.post("/companies", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const created = res.data.company ?? res.data;
      setCompanies((prev) => [created, ...prev]);
      setToast({ type: "success", message: "Company added successfully!" });
      resetForm();
    } catch (err) {
      console.error("Failed to add company:", err);
      if (err.response?.status === 401) {
        setToast({ type: "error", message: "Session expired. Please log in again." });
      } else if (err.response?.status === 403) {
        setToast({ type: "error", message: "You need admin access to add a company." });
      } else {
        const message =
          err.response?.data?.message ?? "Could not add the company. Please try again.";
        setToast({ type: "error", message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const requestDelete = (company) => {
    setToast({
      type: "confirm",
      message: `Delete ${company.website}? This cannot be undone.`,
      onConfirm: () => deleteCompany(company._id),
    });
  };

  const deleteCompany = async (id) => {
    try {
      // DELETE /api/companies/:id -> deleteCompany
      await api.delete(`/companies/${id}`);
      setCompanies((prev) => prev.filter((c) => c._id !== id));
      setToast({ type: "success", message: "Company deleted successfully." });
    } catch (err) {
      console.error("Failed to delete company:", err);
      setToast({ type: "error", message: "Could not delete the company." });
    }
  };

  return (
    <div className={s.pageContainer}>
      {/* Toast */}
      {toast && (
        <div className={s.toastWrapper}>
          <div
            className={`${s.toastBase} ${
              toast.type === "success"
                ? s.toastSuccess
                : toast.type === "error"
                ? s.toastError
                : s.toastConfirm
            }`}
          >
            {toast.type === "success" && (
              <Check className={`${s.toastIconSuccess} w-5 h-5 shrink-0`} />
            )}
            {toast.type === "error" && (
              <AlertCircle className={`${s.toastIconError} w-5 h-5 shrink-0`} />
            )}
            {toast.type === "confirm" && (
              <AlertTriangle className={`${s.toastIconConfirm} w-5 h-5 shrink-0`} />
            )}

            <div className={s.toastContent}>
              <p className={s.toastMessage}>{toast.message}</p>
              {toast.type === "confirm" && (
                <div className={s.toastActionRow}>
                  <button
                    onClick={() => {
                      toast.onConfirm?.();
                      setToast(null);
                    }}
                    className={s.toastConfirmBtn}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                  <button onClick={() => setToast(null)} className={s.toastCancelBtn}>
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {toast.type !== "confirm" && (
              <button onClick={() => setToast(null)} className={s.toastCloseBtn}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className={s.contentWrapper}>
        {/* Header */}
        <div className={s.header}>
          <h1 className={s.headerTitle}>Companies</h1>
          <p className={s.headerSubtitle}>Add and manage hiring companies</p>
        </div>

        {/* Form */}
        <div className={s.formCard}>
          <form onSubmit={handleSubmit} className={s.form}>
            {/* Logo upload (optional) */}
            <div>
              <label className={s.logoLabel}>Company Logo</label>
              <div className={s.logoContainer}>
                <div className={s.previewWrapper}>
                  {logoPreview ? (
                    <div className={s.previewBox}>
                      <img src={logoPreview} alt="Logo preview" className={s.previewImage} />
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
                      onClick={handleBrowseClick}
                      className={s.placeholderBox}
                    >
                      <Building2 className="w-6 h-6" />
                    </button>
                  )}
                </div>

                <div className={s.uploadArea}>
                  <label htmlFor="company-logo-input" className={s.uploadLabel}>
                    <UploadCloud className="w-4 h-4" />
                    {logoFile ? "Change Logo" : "Upload Logo"}
                  </label>
                  <input
                    id="company-logo-input"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={s.fileInputHidden}
                  />
                </div>
              </div>
              {errors.logo && <p className={s.errorText}>{errors.logo}</p>}
            </div>

            {/* Website */}
            <div>
              <label className={s.websiteLabel}>
                Website <span className={s.requiredStar}>*</span>
              </label>
              <div className={s.inputWrapper}>
                <Globe className={s.inputIcon} />
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className={`${s.websiteInput} ${
                    errors.website ? s.inputError : s.inputDefault
                  }`}
                />
              </div>
              {errors.website && <p className={s.errorText}>{errors.website}</p>}
            </div>

            <div className={s.submitSection}>
              <button
                type="submit"
                disabled={submitting}
                className={`${s.submitBtn} ${submitting ? s.submitBtnDisabled : ""}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className={`w-4 h-4 ${s.spinner}`} />
                    Adding...
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    Add Company
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* List */}
        <div className={s.listSection}>
          <h2 className={s.listTitle}>All Companies</h2>

          {loading ? (
            <p className="text-slate-500 text-sm">Loading companies...</p>
          ) : companies.length === 0 ? (
            <p className="text-slate-500 text-sm">No companies added yet.</p>
          ) : (
            <div className={s.grid}>
              {companies.map((company) => {
                const logoUrl = resolveLogoUrl(company.logo);
                return (
                  <div key={company._id} className={s.companyCard}>
                    <div className={s.cardLogoWrapper}>
                      <div className={s.cardLogoBox}>
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={company.website}
                            className={s.cardLogoImage}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <Building2 className={s.cardNoImage} />
                        )}
                      </div>
                    </div>

                    <div className={s.cardDetails}>
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={s.cardLink}
                      >
                        {company.website}
                        <ExternalLink className="inline w-3.5 h-3.5 ml-1 align-text-top" />
                      </a>
                    </div>

                    <div className={s.cardDeleteWrapper}>
                      <button
                        onClick={() => requestDelete(company)}
                        className={s.deleteBtn}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

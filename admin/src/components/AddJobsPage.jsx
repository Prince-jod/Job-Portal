import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Building2,
  MapPin,
  Layers,
  IndianRupee,
  FileText,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  UploadCloud,
  X,
  Plus,
  Trash2,
  Loader2,
  Award,
  CalendarDays,
  Users2,
  Code2,
} from "lucide-react";
import { addJobsPageStyles as s } from "../assets/dummyStyles";

const API_BASE = "http://localhost:5000/api";

// Axios instance that automatically attaches the admin JWT.
// createJob is protected by authMiddleware + authorize("admin"),
// so every request here needs Authorization: Bearer <token>.
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const CATEGORIES = [
  "Development",
  "Design",
  "Marketing",
  "Sales",
  "Data Science",
  "DevOps",
  "Customer Support",
  "Human Resources",
  "Finance",
  "Other",
];

const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Remote"];
const SALARY_TYPES = ["/month", "/year", "/hour"];

const todayISO = () => new Date().toISOString().slice(0, 10);

/* ---------------- Toast ---------------- */
const Toast = ({ toast, onClose }) => {
  if (!toast) return null;
  const isSuccess = toast.type === "success";

  return (
    <div className={s.toastWrapper}>
      <div className={`${s.toastContent} ${isSuccess ? s.toastSuccess : s.toastError}`}>
        <span className="relative flex h-3 w-3">
          <span
            className={`${s.toastDot} ${isSuccess ? s.toastDotSuccess : s.toastDotError}`}
          ></span>
          <span
            className={`${s.toastDotStatic} ${isSuccess ? s.toastDotSuccess : s.toastDotError}`}
          ></span>
        </span>
        <p className={s.toastMessage}>{toast.message}</p>
        <button onClick={onClose} className={s.toastCloseBtn}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/* ---------------- AnimatedField (text / number / date / select / textarea) ---------------- */
const AnimatedField = ({
  label,
  required,
  Icon,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
  as = "input", // "input" | "select" | "textarea"
  options = [],
  rows = 4,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className={s.fieldContainer}>
      <label className={s.fieldLabel}>
        {label} {required && <span className={s.requiredStar}>*</span>}
      </label>
      <div className={`${s.fieldWrapper} ${focused ? s.fieldFocusedScale : ""}`}>
        <div className={s.fieldGlow}></div>
        <div
          className={`${s.fieldInner} ${
            error
              ? s.fieldInnerError
              : focused
              ? s.fieldInnerFocused
              : s.fieldInnerDefault
          }`}
        >
          <span className={`${s.fieldIconSpan} ${focused ? s.fieldIconFocused : ""}`}>
            <Icon className="w-5 h-5" />
          </span>
          <div className={s.fieldInputWrapper}>
            {as === "select" ? (
              <select
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className={s.selectInput}
              >
                <option value="">Select {label.toLowerCase()}</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : as === "textarea" ? (
              <textarea
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={placeholder}
                rows={rows}
                className={s.textareaInput}
              />
            ) : (
              <input
                type={type}
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={placeholder}
                className={s.inputBase}
              />
            )}
          </div>
          {required && !value && <span className={s.requiredSpan}>*</span>}
        </div>
      </div>
      {error && <p className={s.errorText}>{error}</p>}
    </div>
  );
};

/* ---------------- ImageUpload (company logo - required by schema) ---------------- */
const ImageUpload = ({ label, required, preview, onFileSelect, onRemove, error }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (file) onFileSelect(file);
  };

  return (
    <div className={s.uploadContainer}>
      <label className={s.uploadLabel}>
        <UploadCloud className={`w-4 h-4 ${s.uploadIcon}`} />
        {label} {required && <span className={s.uploadRequired}>*</span>}
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`${s.uploadDropzone} ${
          error
            ? s.uploadDropzoneError
            : preview
            ? s.uploadDropzonePreview
            : dragActive
            ? s.uploadDropzoneActive
            : s.uploadDropzoneDefault
        }`}
      >
        {preview ? (
          <div className={s.previewContainer}>
            <img src={preview} alt="Company logo preview" className={s.previewImage} />
            <button type="button" onClick={onRemove} className={s.removeImageBtn}>
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label htmlFor="logo-upload-input" className={s.uploadPlaceholder}>
            <UploadCloud className={s.uploadIconLarge} />
            <p className={s.uploadText}>
              Drag & drop an image, or <span className={s.browseLabel}>browse</span>
            </p>
          </label>
        )}
        <input
          id="logo-upload-input"
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className={s.fileInputHidden}
        />
      </div>
      {error && <p className={s.errorText}>{error}</p>}
    </div>
  );
};

/* ---------------- Array section (techStack / responsibilities / jobCriteria / education) ---------------- */
const ArraySection = ({ label, Icon, items, setItems, placeholder }) => {
  const [draft, setDraft] = useState("");

  const addItem = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setItems((prev) => [...prev, trimmed]);
    setDraft("");
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={s.arraySection}>
      <label className={s.arrayLabel}>
        <Icon className="w-4 h-4" />
        {label} <span className={s.requiredStar}>*</span>
      </label>

      <div className={s.arrayItemRow}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder={placeholder}
          className={`${s.arrayInput} ${s.arrayInputDefault}`}
        />
        <button type="button" onClick={addItem} className={s.addBtn}>
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {items.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                {item}
              </span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className={s.removeBtn}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ---------------- Main Page ---------------- */
const AddJobsPage = () => {
  const navigate = useNavigate();

  // Fields matching job.model.js exactly
  const [roleName, setRoleName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [jobType, setJobType] = useState("");
  const [category, setCategory] = useState("");
  const [openings, setOpenings] = useState("");
  const [postDate, setPostDate] = useState(todayISO());
  const [overview, setOverview] = useState("");

  const [salary, setSalary] = useState("");
  const [salaryType, setSalaryType] = useState("/month");

  const [techStack, setTechStack] = useState([]);
  const [responsibilities, setResponsibilities] = useState([]);
  const [jobCriteria, setJobCriteria] = useState([]);
  const [education, setEducation] = useState([]);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const handleLogoSelect = (file) => {
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, logo: undefined }));
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!roleName.trim()) newErrors.roleName = "Role name is required.";
    if (!companyName.trim()) newErrors.companyName = "Company name is required.";
    if (!location.trim()) newErrors.location = "Location is required.";
    if (!experience.trim()) newErrors.experience = "Experience is required.";
    if (!jobType.trim()) newErrors.jobType = "Job type is required.";
    if (!category.trim()) newErrors.category = "Category is required.";
    if (!openings || Number(openings) <= 0)
      newErrors.openings = "Enter a valid number of openings.";
    if (!postDate) newErrors.postDate = "Post date is required.";
    if (!overview.trim()) newErrors.overview = "Overview is required.";
    if (!salary || Number(salary) <= 0) newErrors.salary = "Enter a valid salary.";
    if (!logoFile) newErrors.logo = "Company logo is required.";
    if (techStack.length === 0) newErrors.techStack = "Add at least one tech stack item.";
    if (responsibilities.length === 0)
      newErrors.responsibilities = "Add at least one responsibility.";
    if (jobCriteria.length === 0) newErrors.jobCriteria = "Add at least one criterion.";
    if (education.length === 0) newErrors.education = "Add at least one education requirement.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setRoleName("");
    setCompanyName("");
    setLocation("");
    setExperience("");
    setJobType("");
    setCategory("");
    setOpenings("");
    setPostDate(todayISO());
    setOverview("");
    setSalary("");
    setSalaryType("/month");
    setTechStack([]);
    setResponsibilities([]);
    setJobCriteria([]);
    setEducation([]);
    setLogoFile(null);
    setLogoPreview(null);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setToast({ type: "error", message: "Please fix the highlighted fields." });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("roleName", roleName.trim());
      formData.append("companyName", companyName.trim());
      formData.append("location", location.trim());
      formData.append("experience", experience.trim());
      formData.append("jobType", jobType);
      formData.append("category", category);
      formData.append("openings", openings);
      formData.append("postDate", postDate);
      formData.append("overview", overview.trim());
      formData.append("salary", salary);
      formData.append("salaryType", salaryType);
      formData.append("techStack", JSON.stringify(techStack));
      formData.append("responsibilities", JSON.stringify(responsibilities));
      formData.append("jobCriteria", JSON.stringify(jobCriteria));
      formData.append("education", JSON.stringify(education));
      formData.append("companyLogo", logoFile);

      // Mounted per job.routes.js: jobRouter.post('/', ...) -> POST /api/jobs
      await api.post("/jobs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast({ type: "success", message: "Job posted successfully!" });
      resetForm();

      setTimeout(() => {
        navigate("/list/jobs");
      }, 900);
    } catch (err) {
      console.error("Failed to create job:", err);

      if (err.response?.status === 401) {
        setToast({ type: "error", message: "Session expired. Please log in again." });
        setTimeout(() => navigate("/login"), 1200);
      } else if (err.response?.status === 403) {
        setToast({ type: "error", message: "You need admin access to post a job." });
      } else {
        const message =
          err.response?.data?.message ?? "Could not post the job. Please try again.";
        setToast({ type: "error", message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={s.pageContainer}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className={s.contentWrapper}>
        <div className={s.headerCenter}>
          <h1 className={s.title}>
            <span className={s.titleInner}>Post a New Job</span>
          </h1>
          <p className={s.subtitle}>Fill in the details to list a new opening</p>
        </div>

        <form onSubmit={handleSubmit} className={s.formCard}>
          {/* Row 1: Role / Company / Location */}
          <div className={s.grid3}>
            <div className={s.colSpan1}>
              <AnimatedField
                label="Role Name"
                required
                Icon={Briefcase}
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Frontend Developer"
                error={errors.roleName}
              />
            </div>
            <div className={s.colSpan1}>
              <AnimatedField
                label="Company Name"
                required
                Icon={Building2}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Infosys"
                error={errors.companyName}
              />
            </div>
            <div className={s.colSpan1}>
              <AnimatedField
                label="Location"
                required
                Icon={MapPin}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bangalore"
                error={errors.location}
              />
            </div>
          </div>

          {/* Row 2: Experience / Job Type / Category */}
          <div className={s.grid3}>
            <div className={s.colSpan1}>
              <AnimatedField
                label="Experience"
                required
                Icon={Award}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 2-4 years"
                error={errors.experience}
              />
            </div>
            <div className={s.colSpan1}>
              <AnimatedField
                label="Job Type"
                required
                as="select"
                Icon={Briefcase}
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                options={JOB_TYPES}
                error={errors.jobType}
              />
            </div>
            <div className={s.colSpan1}>
              <AnimatedField
                label="Category"
                required
                as="select"
                Icon={Layers}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={CATEGORIES}
                error={errors.category}
              />
            </div>
          </div>

          {/* Row 3: Openings / Post Date / Salary */}
          <div className={s.grid3}>
            <div className={s.colSpan1}>
              <AnimatedField
                label="Openings"
                required
                type="number"
                Icon={Users2}
                value={openings}
                onChange={(e) => setOpenings(e.target.value)}
                placeholder="e.g. 3"
                error={errors.openings}
              />
            </div>
            <div className={s.colSpan1}>
              <AnimatedField
                label="Post Date"
                required
                type="date"
                Icon={CalendarDays}
                value={postDate}
                onChange={(e) => setPostDate(e.target.value)}
                error={errors.postDate}
              />
            </div>
            <div className={s.colSpan1}>
              <div className={s.salaryContainer}>
                <label className={s.salaryLabel}>
                  Salary <span className={s.requiredStar}>*</span>
                </label>
                <div className={s.salaryInputWrapper}>
                  <div
                    className={`${s.salaryInputGroup} ${
                      errors.salary
                        ? s.salaryInputGroupError
                        : salary
                        ? s.salaryInputGroupFilled
                        : s.salaryInputGroupDefault
                    }`}
                  >
                    <span
                      className={`${s.salaryIconSpan} ${salary ? s.salaryIconFilled : ""}`}
                    >
                      <IndianRupee className="w-5 h-5" />
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="e.g. 50000"
                      className={s.salaryAmountInput}
                    />
                    <select
                      value={salaryType}
                      onChange={(e) => setSalaryType(e.target.value)}
                      className={s.salaryPeriodSelect}
                    >
                      {SALARY_TYPES.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {errors.salary && <p className={s.errorText}>{errors.salary}</p>}
              </div>
            </div>
          </div>

          {/* Company Logo (required) */}
          <ImageUpload
            label="Company Logo"
            required
            preview={logoPreview}
            onFileSelect={handleLogoSelect}
            onRemove={handleLogoRemove}
            error={errors.logo}
          />

          {/* Overview */}
          <div className={s.mdColSpan2}>
            <AnimatedField
              label="Overview"
              required
              as="textarea"
              Icon={FileText}
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="Brief description of the role..."
              rows={4}
              error={errors.overview}
            />
          </div>

          {/* Array sections */}
          <ArraySection
            label="Tech Stack"
            Icon={Code2}
            items={techStack}
            setItems={setTechStack}
            placeholder="Add a technology and press Enter"
          />
          {errors.techStack && <p className={s.errorText}>{errors.techStack}</p>}

          <ArraySection
            label="Responsibilities"
            Icon={CheckCircle2}
            items={responsibilities}
            setItems={setResponsibilities}
            placeholder="Add a responsibility and press Enter"
          />
          {errors.responsibilities && (
            <p className={s.errorText}>{errors.responsibilities}</p>
          )}

          <ArraySection
            label="Job Criteria"
            Icon={ClipboardList}
            items={jobCriteria}
            setItems={setJobCriteria}
            placeholder="Add a requirement and press Enter"
          />
          {errors.jobCriteria && <p className={s.errorText}>{errors.jobCriteria}</p>}

          <ArraySection
            label="Education"
            Icon={GraduationCap}
            items={education}
            setItems={setEducation}
            placeholder="Add an education requirement and press Enter"
          />
          {errors.education && <p className={s.errorText}>{errors.education}</p>}

          <button
            type="submit"
            disabled={submitting}
            className={`${s.submitBtn} ${submitting ? s.submitBtnDisabled : ""}`}
          >
            {submitting ? (
              <>
                <Loader2 className={s.spinnerIcon} />
                Posting Job...
              </>
            ) : (
              <>
                <Briefcase className="w-5 h-5" />
                Post Job
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddJobsPage;

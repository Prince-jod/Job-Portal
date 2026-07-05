import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Users,
  Building2,
  MapPin,
  Sparkles,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
} from "lucide-react";
import { dashboardStyles as s, statColors } from "../assets/dummyStyles";

const API_BASE = "http://localhost:5000/api";

const STAT_CONFIG = [
  { key: "total", label: "Total Jobs", Icon: Briefcase, color: "blue" },
  { key: "closed", label: "Closed Jobs", Icon: Briefcase, color: "rose" },
  { key: "applicants", label: "Total Applicants", Icon: Users, color: "emerald" },
  { key: "companies", label: "Active Companies", Icon: Building2, color: "amber" },
];

const Dashboard = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [companyFilter, setCompanyFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  const [toast, setToast] = useState(null); // { type: 'success' | 'error' | 'confirm', message, onConfirm }
  const [brokenLogos, setBrokenLogos] = useState({});

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (!toast || toast.type === "confirm") return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/job`);
      const data = Array.isArray(res.data) ? res.data : res.data.jobs ?? [];
      setJobs(data);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setError("Could not load jobs. Is your backend running on :5000?");
    } finally {
      setLoading(false);
    }
  };

  const getCompanyName = (job) => job.company?.name ?? job.companyName ?? "Company";

  const stats = useMemo(() => {
    const total = jobs.length;
    const closed = jobs.filter((j) => j.status === "closed").length;
    const applicants = jobs.reduce(
      (sum, j) => sum + (j.applicantsCount ?? j.applicants?.length ?? 0),
      0,
    );
    const companies = new Set(jobs.map((j) => getCompanyName(j))).size;
    return { total, closed, applicants, companies };
  }, [jobs]);

  const companyOptions = useMemo(
    () => [...new Set(jobs.map((j) => getCompanyName(j)))].sort(),
    [jobs],
  );

  const roleOptions = useMemo(
    () => [...new Set(jobs.map((j) => j.role).filter(Boolean))].sort(),
    [jobs],
  );

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesStatus =
        statusFilter === "all" ? true : (job.status ?? "active") === statusFilter;
      const matchesCompany =
        companyFilter === "all" ? true : getCompanyName(job) === companyFilter;
      const matchesRole = roleFilter === "all" ? true : job.role === roleFilter;

      return matchesStatus && matchesCompany && matchesRole;
    });
  }, [jobs, companyFilter, roleFilter, statusFilter]);

  const hasActiveFilters =
    companyFilter !== "all" || roleFilter !== "all" || statusFilter !== "active";

  const clearFilters = () => {
    setCompanyFilter("all");
    setRoleFilter("all");
    setStatusFilter("active");
  };

  const handleViewApplicants = (jobId) => {
    navigate(`/view-applicants/${jobId}`);
  };

  const requestCloseJob = (job) => {
    setToast({
      type: "confirm",
      message: `Close "${job.role}" at ${getCompanyName(job)}?`,
      onConfirm: () => closeJob(job._id),
    });
  };

  const closeJob = async (jobId) => {
    try {
      await axios.patch(`${API_BASE}/jobs/${jobId}`, { status: "closed" });
      setJobs((prev) =>
        prev.map((j) => (j._id === jobId ? { ...j, status: "closed" } : j)),
      );
      setToast({ type: "success", message: "Job closed successfully." });
    } catch (err) {
      console.error("Failed to close job:", err);
      setToast({ type: "error", message: "Could not close the job. Try again." });
    }
  };

  const handleLogoError = (jobId) => {
    setBrokenLogos((prev) => ({ ...prev, [jobId]: true }));
  };

  return (
    <div className={s.container}>
      <style>{s.animations}</style>

      {/* Toast */}
      {toast && (
        <div className={s.toastWrapper}>
          <div
            className={`${s.toastBase} ${
              toast.type === "success"
                ? s.toastSuccess
                : toast.type === "error"
                ? s.toastError
                : s.toastDefault
            }`}
          >
            {toast.type === "success" && (
              <CheckCircle2 className={`${s.toastIconSuccess} w-5 h-5 shrink-0`} />
            )}
            {toast.type === "error" && (
              <XCircle className={`${s.toastIconError} w-5 h-5 shrink-0`} />
            )}
            {toast.type === "confirm" && (
              <AlertTriangle className={`${s.toastIconDefault} w-5 h-5 shrink-0`} />
            )}

            <div className={s.toastFlex}>
              <p className={s.toastMessage}>{toast.message}</p>

              {toast.type === "confirm" && (
                <div className={s.toastButtonContainer}>
                  <button
                    onClick={() => {
                      toast.onConfirm?.();
                      setToast(null);
                    }}
                    className={s.toastConfirmBtn}
                  >
                    Close job
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
        <div className={s.headerContainer}>
          <div>
            <h1 className={s.headerTitle}>Dashboard</h1>
            <p className={s.headerSubtitle}>
              <Sparkles className={s.headerIcon} />
              Real-time overview of jobs and applicants
            </p>
          </div>
          <button
            onClick={() => navigate("/addjobs")}
            className="cursor-pointer bg-linear-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-md hover:shadow-xl transition-all hover:scale-105"
          >
            + Post New Job
          </button>
        </div>

        {/* Stats */}
        <div className={s.statsGrid}>
          {STAT_CONFIG.map(({ key, label, Icon, color }) => (
            <div key={key} className={s.statCard}>
              <div className={s.statCardOverlay}></div>
              <div className={s.statCardContent}>
                <div className={s.statCardTextContainer}>
                  <p className={s.statCardLabel}>{label}</p>
                  <p className={s.statCardValue}>{stats[key]}</p>
                </div>
                <div
                  className={`${s.statCardIconWrapper} bg-linear-to-br ${statColors[color].gradient}`}
                >
                  <Icon className={s.statCardIcon} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className={s.filtersContainer}>
          <div className={s.filtersHeader}>
            <div className={s.filtersTitleContainer}>
              <Filter className={s.filtersIcon} />
              <span className={s.filtersTitle}>Filters</span>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className={s.filtersClearBtn}>
                <X className="w-3.5 h-3.5" />
                Clear filters
              </button>
            )}
          </div>

          <div className={s.filtersGrid}>
            <div className={s.filterInputContainer}>
              <label className={s.filterLabel}>Filter by Company</label>
              <div className={s.filterInputWrapper}>
                <Search className={s.filterSearchIcon} />
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className={s.filterSelect}
                >
                  <option value="all">All Companies</option>
                  {companyOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={s.filterInputContainer}>
              <label className={s.filterLabel}>Filter by Role</label>
              <div className={s.filterInputWrapper}>
                <Search className={s.filterSearchIcon} />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={s.filterSelect}
                >
                  <option value="all">All Roles</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs */}
        <div className={s.jobsSection}>
          <div className={s.jobsHeader}>
            <h2 className={s.jobsTitle}>
              <Building2 className={s.jobsTitleIcon} />
              Active Roles
            </h2>
            <div className={s.jobsFilterContainer}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={s.jobsStatusSelect}
              >
                <option value="active">Active Jobs</option>
                <option value="closed">Closed Jobs</option>
                <option value="all">All Jobs</option>
              </select>
              <span className={s.jobsCount}>
                {filteredJobs.length} job{filteredJobs.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {loading ? (
            <div className={s.loadingContainer}>
              <div className={s.loadingSpinner}></div>
            </div>
          ) : error ? (
            <div className={s.emptyState}>
              <XCircle className={s.emptyStateIcon} />
              <p className={s.emptyStateTitle}>{error}</p>
              <button onClick={fetchJobs} className={s.emptyStateBtn}>
                Retry
              </button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className={s.emptyState}>
              <Briefcase className={s.emptyStateIcon} />
              <p className={s.emptyStateTitle}>No jobs found</p>
              <p className={s.emptyStateText}>
                Try adjusting your filters or post a new job.
              </p>
              <button onClick={clearFilters} className={s.emptyStateBtn}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className={s.jobsGrid}>
              {filteredJobs.map((job) => {
                const companyName = getCompanyName(job);
                const logoUrl = job.company?.logo ?? job.companyLogo;
                const showFallback = !logoUrl || brokenLogos[job._id];
                const isClosed = job.status === "closed";
                const applicantsCount =
                  job.applicantsCount ?? job.applicants?.length ?? 0;

                return (
                  <div key={job._id} className={s.jobCard}>
                    <div className={s.jobCardContent}>
                      <div className={s.jobCardHeader}>
                        <div className={s.jobLogoContainer}>
                          <div className={s.jobLogoWrapper}>
                            {!showFallback ? (
                              <img
                                src={logoUrl}
                                alt={companyName}
                                className={s.jobLogo}
                                onError={() => handleLogoError(job._id)}
                              />
                            ) : (
                              <div
                                className={s.jobLogoFallback}
                                style={{ display: "flex" }}
                              >
                                <Building2 className={s.jobLogoFallbackIcon} />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={s.jobDetails}>
                          <p className={s.jobRole}>{job.role}</p>
                          <p className={s.jobCompany}>
                            <Building2 className={s.jobCompanyIcon} />
                            {companyName}
                          </p>
                          {job.location && (
                            <p className={s.jobLocation}>
                              <MapPin className={s.jobLocationIcon} />
                              {job.location}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className={s.jobMeta}>
                        {job.category && (
                          <span className={s.jobCategory}>{job.category}</span>
                        )}
                        <span className={s.jobApplicants}>
                          <Users className={s.jobApplicantsIcon} />
                          <span className={s.jobApplicantsCount}>
                            {applicantsCount}
                          </span>
                          <span className={s.jobApplicantsLabel}>applicants</span>
                        </span>
                      </div>

                      <div className={s.jobActions}>
                        <button
                          onClick={() => handleViewApplicants(job._id)}
                          className={`${s.viewApplicantsBtn} pointer-events-auto`}
                        >
                          View Applicants
                        </button>
                        {!isClosed && (
                          <button
                            onClick={() => requestCloseJob(job)}
                            className={`${s.closeJobBtn} pointer-events-auto`}
                          >
                            Close Job
                          </button>
                        )}
                      </div>
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
};

export default Dashboard;

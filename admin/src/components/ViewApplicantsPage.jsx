import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  FileText,
  Users,
  AlertCircle,
} from "lucide-react";
import { viewApplicantsPageStyles as s } from "../assets/dummyStyles";

const API_BASE = "http://localhost:5000/api";

// Attaches the admin JWT. getApplicants is protected by
// authMiddleware + authorize("admin").
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const formatDate = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const ViewApplicantsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Support both entry points: a direct URL like /view-applicants/:jobId,
  // and navigation from ListJobs.jsx via navigate("/applicants", { state }).
  const jobId = params.jobId ?? location.state?.jobId;
  const stateRole = location.state?.role;
  const stateCompanyName = location.state?.companyName;

  const [jobName, setJobName] = useState(stateRole ?? "");
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!jobId) {
      setError("No job selected. Go back and pick a job to view applicants.");
      setLoading(false);
      return;
    }
    fetchApplicants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const fetchApplicants = async () => {
    setLoading(true);
    setError("");
    try {
      // GET /api/applications/:id/applicants -> getApplicants
      const res = await api.get(`/applications/${jobId}/applicants`);
      setJobName(res.data.jobName ?? stateRole ?? "");
      setApplicants(res.data.applicants ?? []);
    } catch (err) {
      console.error("Failed to fetch applicants:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        setTimeout(() => navigate("/login"), 1200);
      } else if (err.response?.status === 403) {
        setError("You need admin access to view applicants.");
      } else if (err.response?.status === 404) {
        setError("This job could not be found.");
      } else {
        setError(err.response?.data?.message ?? "Could not load applicants.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.pageContainer}>
      <button onClick={() => navigate(-1)} className={s.backButton}>
        <ArrowLeft className={s.backIcon} />
      </button>

      <div className={s.contentWrapper}>
        {/* Header */}
        <div className={s.headerWrapper}>
          <h1 className={s.headerTitle}>
            <Users className={s.headerIcon} />
            <span className={s.headerText}>{jobName || "Applicants"}</span>
          </h1>
        </div>

        {stateCompanyName && (
          <div className={s.companyWrapper}>
            <div className={s.companyBadge}>
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className={s.companyName}>{stateCompanyName}</span>
              <span className={s.activeBadge}>
                <span className={s.activeDot}></span>
                Live
              </span>
            </div>
          </div>
        )}

        {/* Applicants */}
        <div className={s.containerCard}>
          {loading ? (
            <div className={s.loadingWrapper}>
              <div className={s.spinner}></div>
            </div>
          ) : error ? (
            <div className={s.emptyWrapper}>
              <div className={s.emptyIconCircle}>
                <AlertCircle className={s.emptyIcon} />
              </div>
              <p className={s.emptyTitle}>{error}</p>
              {jobId && (
                <p className={s.emptySubtitle}>
                  <button onClick={fetchApplicants} className="underline">
                    Try again
                  </button>
                </p>
              )}
            </div>
          ) : applicants.length === 0 ? (
            <div className={s.emptyWrapper}>
              <div className={s.emptyIconCircle}>
                <Users className={s.emptyIcon} />
              </div>
              <p className={s.emptyTitle}>No applicants yet</p>
              <p className={s.emptySubtitle}>
                Check back once candidates start applying.
              </p>
            </div>
          ) : (
            <div className={s.grid}>
              {applicants.map((applicant) => (
                <div key={applicant.applicationId} className={s.cardBase}>
                  <div className={s.cardInner}>
                    <p className={s.applicantName}>{applicant.name || "Unnamed"}</p>

                    <div className={s.contactInfo}>
                      {applicant.email && (
                        <div className={s.contactRow}>
                          <Mail className={s.emailIcon} />
                          <span className={s.emailText}>{applicant.email}</span>
                        </div>
                      )}
                      {applicant.phone && (
                        <div className={s.contactRow}>
                          <Phone className={s.phoneIcon} />
                          <span>{applicant.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className={s.detailsWrapper}>
                      {applicant.role && (
                        <div className={s.roleRow}>
                          <Briefcase className={s.roleIcon} />
                          <span className={s.roleBadge}>{applicant.role}</span>
                        </div>
                      )}
                      {applicant.appliedDate && (
                        <div className={s.dateRow}>
                          <Calendar className={s.dateIcon} />
                          <span className={s.dateBadge}>
                            Applied {formatDate(applicant.appliedDate)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={s.buttonWrapper}>
                      {applicant.resume ? (
                        <a
                          href={applicant.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={s.resumeButton}
                        >
                          <span className={s.resumeButtonInner}>
                            <FileText className={s.resumeIcon} />
                            View Resume
                          </span>
                        </a>
                      ) : (
                        <p className={s.noResumeText}>No resume uploaded</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewApplicantsPage;

import React from "react";
import { navbarStyles as s } from "../assets/dummyStyles";
import {useLocation , useNavigate} from "../assets/dummyStyles";
import {Home,List , Building, Briefcase,UserCheck} from 'lucide-react';

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", Icon: Home },
  { key: "jobs", label: "Jobs", Icon: Briefcase },
  { key: "listJob", label: "List Job", Icon: List },
  { key: "company", label: "Companies", Icon: Building },
  {
    key: "companyQuestions",
    label: "Company Questions",
    Icon: Building,
    dropdown: [{ key: "listCompanyQ", label: "List Company Questions" }],
  },
  {
    key: "roleQuestions",
    label: "Role Questions",
    Icon: UserCheck,
    dropdown: [{ key: "listRoleQ", label: "List Role Questions" }],
  },
];

const ROUTES = {
  dashboard: "/",
  company: "/companies",
  jobs: "/addjobs",
  listJob: "/list/jobs",
  companyQuestions: "/company-questions",
  listCompanyQ: "/list/company-questions",
  roleQuestions: "/role-questions",
  listRoleQ: "/list/role-questions",
  login: "/login",
};

const Navbar = ({logoSrc, brandName="Job Portal", onNavigate}) => {
 
  const navigate=useNavigate();
  const location=useLocation();
  const [user,serUser]=useState(null);
  useEffect(()=>{
    const storedUser=localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser):null);
  },[location.pathname]);
  const pathToKey=(pathname)=>{
    const found=Object.entries(ROUTES)
  }


  return (
    <header className={s.header}>
      <nav className={s.nav}>
        <div className={s.navContainer}>
          <div className={s.navContent}>
            {/* logo */}

            <div
              className={s.logoContainer}
              onClick={() => handleNavigation("dashboard")}
            >
              <div className={s.logoWrapper}>
                {logoToUse ? (
                  <img
                    src={logoToUse}
                    alt="logo"
                    className={s.logoImage}
                  />
                ) : (
                  <span className={s.logoFallback}>
                    {brandName[0]}
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
import React ,{
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { navbarStyles as s } from "../assets/dummyStyles";
import { useLocation, useNavigate } from "react-router-dom";
import {Home,List , Building, Briefcase,UserCheck} from 'lucide-react';
import logoFallback from '../assets/logo.png';

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
  const [user,setUser]=useState(null);
  useEffect(()=>{
    const storedUser=localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser):null);
  },[location.pathname]);
  const pathToKey=(pathname)=>{
    const found=Object.entries(ROUTES).find(([key,path])=>{
      if(path==='/') return pathname==="/";
      return (
        pathname===path ||
        pathname.startsWith(path + "/") ||
        pathname.startsWith(path)
      );
    });
    return found ? found[0] : "dashboard";
  };

  const [active, setActive] = useState(pathToKey(location.pathname));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navContainerRef = useRef(null);
  const itemRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const navCloseTimeoutRef = useRef(null);

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isLGOnly = windowWidth >= 1024 && windowWidth < 1280;

  useEffect(() => {
    if (!isLGOnly) return;
    const handleDocClick = (e) => {
      const container = navContainerRef.current;
      if (!container) return;
      if (!container.contains(e.target)) {
        setOpenDropdownKey(null);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [isLGOnly]);

 useEffect(()=>{
  const key =pathToKey(location.pathname);
  setActive(key);
  setMobileMenuOpen(false);
 },[location.pathname]);

  const updateIndicator = useCallback(() => {
    const container = navContainerRef.current;
    const activeEl = itemRefs.current[active];
    if (!container || !activeEl) {
      setIndicatorStyle({ left: 0, width: 0 });
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    setIndicatorStyle({
      left: activeRect.left - containerRect.left,
      width: activeRect.width,
    });
  }, [active]);

  useLayoutEffect(() => {
    updateIndicator();
    let rafId = null;
    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateIndicator);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [updateIndicator]);
  const handleNavigate=(key)=>{
    const path=ROUTES[key] ?? "/";
    setActive(key);
    onNavigate?.(key);
    setMobileMenuOpen(false);
    setOpenDropdownKey(null);
  };
  //to logout
  const handleLoout=()=>{
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
    setMobileMenuOpen(false);
  }
  const logoToUse=logoSrc ?? logoFallback;


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
              <div className={s.logoTextContainer}>
                <span className={s.logoBrandName}>{brandName}</span>
                <span className={s.logoSubtitle}>you will not get Job from here</span>
              </div>
            </div>
            <div className={s.desktopNav}>
             <div ref={navContainerRef} className={s.navIndicatorCotainer}>
              {active && indicatorStyle.width > 0 && (
                <div className={activeIndicator} style={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                  boxShadow : "0 0 8px rgba(165,180,252,0.5)",
                }}
                />
              )}
              <ul className={s.navList}>
                {NAV_ITEMS.map((item)=>{
                  const  Icon =item.Icon;

                  const isActiveParent=
                  active===item.key ||
                  (item.dropdown &&
                     isLGOnly &&
                     item.dropdown.some((sub)=>active ===sub.key));
                     return (
                      <React.Fragment key={item.key}>
                      <li className={s.navItem}
                      onMouseEnter={()=>
                        item.dropdown &&
                        isLGOnly &&
                        openNavDropdown(item.key)
                      }
                      onMouseLeave={()=>
                        item.dropdown && 
                        isLGOnly &&
                        closeNavDropdownDelayed(200)
                      }
                      >
                        <div ref={(el)=>{
                          itemRefs.current[item.key]=el;
                          if(item.dropdown && el && isLGOnly) {
                            item.dropdown.forEach((sub)=>{
                              itemRefs.current[sub.key]=el;
                            }); 
                          }
                        }} className={s.NavItemWrapper}
                        >
                        <button onClick={(e)=>{
                          if(item.dropdown && isLGOnly){
                            e.preventDefault();setOpenDropdownKey((prev)=>
                              prev===item.key ? null : item.key,
                            )
                            return;
                          }
                          hadleNavigate(item.key);
                        }}
                        className={`${s.navButton} ${
                          isActiveParent
                          ? s.navButtonActive
                          :s.navButtonInactive
                        }`}
                        >
                          <Icon className={s.navButtonIcon}/>
                          <span className={s.navButtonText}>
                           {item.label}
                          </span>
                        </button>
                        </div>
                      </li>
                      </React.Fragment>
                     );

                  
                })}

              </ul>
             </div>
            </div>
          </div>
        </div> 
      </nav>
    </header>
  );
};

export default Navbar;
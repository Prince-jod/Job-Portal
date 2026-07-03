import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { navbarStyles as s } from "../assets/dummyStyles";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  List,
  Building,
  Briefcase,
  UserCheck,
  ChevronDown,
  User,
  LogIn,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import logoFallback from "../assets/logo.png";

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

const Navbar = ({ logoSrc, brandName = "Job Portal", onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  }, [location.pathname]);

  const pathToKey = (pathname) => {
    const found = Object.entries(ROUTES).find(([key, path]) => {
      if (path === "/") return pathname === "/";
      return (
        pathname === path ||
        pathname.startsWith(path + "/") ||
        pathname.startsWith(path)
      );
    });
    return found ? found[0] : "dashboard";
  };

  const [active, setActive] = useState(pathToKey(location.pathname));

  // Desktop dropdown (lg-only hover flyout) state
  const navContainerRef = useRef(null);
  const itemRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const navCloseTimeoutRef = useRef(null);

  // User menu state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuContainerRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdownKey, setMobileDropdownKey] = useState(null);

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isLGOnly = windowWidth >= 1024 && windowWidth < 1280;

  // Close nav flyout dropdown when clicking outside (lg-only)
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

  // Close user menu when clicking outside
  useEffect(() => {
    const handleDocClick = (e) => {
      const container = userMenuContainerRef.current;
      if (!container) return;
      if (!container.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

  useEffect(() => {
    const key = pathToKey(location.pathname);
    setActive(key);
    setMobileMenuOpen(false);
    setMobileDropdownKey(null);
  }, [location.pathname]);

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

  const handleNavigate = (key) => {
    const path = ROUTES[key] ?? "/";
    navigate(path);
    setActive(key);
    onNavigate?.(key);
    setMobileMenuOpen(false);
    setOpenDropdownKey(null);
    setMobileDropdownKey(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  const logoToUse = logoSrc ?? logoFallback;

  // ---- Desktop flyout dropdown helpers (lg-only) ----
  const openNavDropdown = (key) => {
    if (navCloseTimeoutRef.current) {
      clearTimeout(navCloseTimeoutRef.current);
      navCloseTimeoutRef.current = null;
    }
    setOpenDropdownKey(key);
  };

  const closeNavDropdown = () => setOpenDropdownKey(null);

  const closeNavDropdownDelayed = (delay = 200) => {
    if (navCloseTimeoutRef.current) clearTimeout(navCloseTimeoutRef.current);
    navCloseTimeoutRef.current = setTimeout(() => {
      setOpenDropdownKey(null);
    }, delay);
  };

  // ---- User menu helpers ----
  const openUserMenu = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setUserMenuOpen(true);
  };

  const startCloseTimer = (delay = 200) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setUserMenuOpen(false);
    }, delay);
  };

  // ---- Mobile menu helpers ----
  const toggleMobileDropdown = (key) => {
    setMobileDropdownKey((prev) => (prev === key ? null : key));
  };

  return (
    <header className={s.header}>
      <style>{s.animations}</style>
      <nav className={s.nav}>
        <div className={s.navContainer}>
          <div className={s.navContent}>
            {/* Logo */}
            <div
              className={s.logoContainer}
              onClick={() => handleNavigate("dashboard")}
            >
              <div className={s.logoWrapper}>
                {logoToUse ? (
                  <img src={logoToUse} alt="logo" className={s.logoImage} />
                ) : (
                  <span className={s.logoFallback}>{brandName[0]}</span>
                )}
              </div>
              <div className={s.logoTextContainer}>
                <span className={s.logoBrandName}>{brandName}</span>
                <span className={s.logoSubtitle}>
                  you will not get Job from here
                </span>
              </div>
            </div>

            {/* Desktop nav */}
            <div className={s.desktopNav}>
              <div ref={navContainerRef} className={s.navIndicatorContainer}>
                {active && indicatorStyle.width > 0 && (
                  <div
                    className={s.activeIndicator}
                    style={{
                      left: indicatorStyle.left,
                      width: indicatorStyle.width,
                      boxShadow: "0 0 8px rgba(165,180,252,0.5)",
                    }}
                  />
                )}
                <ul className={s.navList}>
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.Icon;
                    const isActiveParent =
                      active === item.key ||
                      (item.dropdown &&
                        isLGOnly &&
                        item.dropdown.some((sub) => active === sub.key));

                    return (
                      <React.Fragment key={item.key}>
                        <li
                          className={s.navItem}
                          onMouseEnter={() =>
                            item.dropdown && isLGOnly && openNavDropdown(item.key)
                          }
                          onMouseLeave={() =>
                            item.dropdown &&
                            isLGOnly &&
                            closeNavDropdownDelayed(200)
                          }
                        >
                          <div
                            ref={(el) => {
                              itemRefs.current[item.key] = el;
                              if (item.dropdown && el && isLGOnly) {
                                item.dropdown.forEach((sub) => {
                                  itemRefs.current[sub.key] = el;
                                });
                              }
                            }}
                            className={s.navItemWrapper}
                          >
                            <button
                              onClick={(e) => {
                                if (item.dropdown && isLGOnly) {
                                  e.preventDefault();
                                  setOpenDropdownKey((prev) =>
                                    prev === item.key ? null : item.key,
                                  );
                                  return;
                                }
                                handleNavigate(item.key);
                              }}
                              className={`${s.navButton} ${
                                isActiveParent
                                  ? s.navButtonActive
                                  : s.navButtonInactive
                              }`}
                            >
                              <Icon className={s.navButtonIcon} />
                              <span className={s.navButtonText}>
                                {item.label}
                              </span>
                              {item.dropdown && isLGOnly && (
                                <ChevronDown className={s.navDropdownIcon} />
                              )}
                            </button>
                          </div>

                          {item.dropdown && isLGOnly && (
                            <div
                              className={`${s.dropdownPanel} ${
                                openDropdownKey === item.key
                                  ? s.dropdownVisible
                                  : s.dropdownHidden
                              }`}
                              onMouseEnter={() => openNavDropdown(item.key)}
                              onMouseLeave={() => closeNavDropdownDelayed(200)}
                            >
                              <div className={s.dropdownCaret}></div>
                              <div
                                className={`${s.dropdownContent} ${
                                  openDropdownKey === item.key
                                    ? "animated-border"
                                    : "bg-transparent"
                                }`}
                                style={{
                                  background:
                                    openDropdownKey === item.key
                                      ? undefined
                                      : "transparent",
                                }}
                              >
                                <div className={s.dropdownInner}>
                                  {item.dropdown.map((sub) => {
                                    const isActiveSub = active === sub.key;
                                    return (
                                      <button
                                        key={sub.key}
                                        onClick={() => {
                                          handleNavigate(sub.key);
                                          closeNavDropdown();
                                        }}
                                        className={`${s.dropdownItem} ${
                                          isActiveSub
                                            ? s.dropdownItemActive
                                            : s.dropdownItemInactive
                                        }`}
                                      >
                                        <span className={s.dropdownItemDot}></span>
                                        <span>{sub.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </li>

                        {!isLGOnly &&
                          item.dropdown &&
                          item.dropdown.map((sub) => {
                            const isActiveSub = active === sub.key;
                            return (
                              <li key={sub.key} className={s.subNavItem}>
                                <div
                                  ref={(el) => (itemRefs.current[sub.key] = el)}
                                  className={s.navItemWrapper}
                                >
                                  <button
                                    onClick={() => handleNavigate(sub.key)}
                                    className={`${s.subNavButton} ${
                                      isActiveSub
                                        ? s.subNavButtonActive
                                        : s.subNavButtonInactive
                                    }`}
                                  >
                                    <span className={s.subNavDot}></span>
                                    <span>{sub.label}</span>
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                      </React.Fragment>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Right side */}
            <div className={s.rightActions}>
              <div className={s.desktopAuth}>
                {user ? (
                  <div
                    ref={userMenuContainerRef}
                    className={s.userMenuContainer}
                    onMouseEnter={openUserMenu}
                    onMouseLeave={() => startCloseTimer(200)}
                  >
                    <button
                      onClick={() => {
                        if (closeTimeoutRef.current) {
                          clearTimeout(closeTimeoutRef.current);
                          closeTimeoutRef.current = null;
                        }
                        setUserMenuOpen((prev) => !prev);
                      }}
                      className={s.userMenuButton}
                    >
                      <User className={s.userIcon} />
                      <span className={s.userName}>{user.name}</span>
                      <ChevronDown className={s.userDropdownIcon} />
                    </button>

                    <div
                      className={`${s.userDropdown} ${
                        userMenuOpen
                          ? s.userDropdownVisible
                          : s.userDropdownHidden
                      }`}
                    >
                      <div
                        className={`${s.dropdownContent} ${
                          userMenuOpen ? "animated-border" : "bg-transparent"
                        }`}
                        style={{
                          background: userMenuOpen ? "lightgray" : "transparent",
                        }}
                      >
                        <div className={s.userDropdownInner}>
                          <button onClick={handleLogout} className={s.logoutButton}>
                            <LogOut className={s.logoutIcon} />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleNavigate("login")}
                    className={s.loginButton}
                  >
                    <span className={s.loginButtonOverlay}></span>
                    <span className={s.loginButtonContent}>
                      <LogIn className={s.loginIcon} />
                      Login
                    </span>
                  </button>
                )}
              </div>

              {/* Mobile hamburger toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                className={s.mobileMenuButton}
              >
                {mobileMenuOpen ? (
                  <X className={s.mobileMenuIcon} />
                ) : (
                  <Menu className={s.mobileMenuIcon} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className={s.mobileMenu}>
            <div className={s.mobileMenuContent}>
              {NAV_ITEMS.map((item) => {
                const Icon = item.Icon;
                const isActiveParent =
                  active === item.key ||
                  (item.dropdown && item.dropdown.some((sub) => active === sub.key));
                const isOpen = mobileDropdownKey === item.key;

                return (
                  <div key={item.key} className={s.mobileNavItem}>
                    <button
                      onClick={() =>
                        item.dropdown
                          ? toggleMobileDropdown(item.key)
                          : handleNavigate(item.key)
                      }
                      className={`${s.mobileNavButton} ${
                        isActiveParent
                          ? s.mobileNavButtonActive
                          : s.mobileNavButtonInactive
                      }`}
                    >
                      <Icon className={s.mobileNavIcon} />
                      <span className={s.mobileNavText}>{item.label}</span>
                      {item.dropdown && (
                        <ChevronDown
                          className={`${s.navDropdownIcon} transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>

                    {item.dropdown && isOpen && (
                      <div className={s.mobileDropdown}>
                        {item.dropdown.map((sub) => {
                          const isActiveSub = active === sub.key;
                          return (
                            <button
                              key={sub.key}
                              onClick={() => handleNavigate(sub.key)}
                              className={`${s.mobileDropdownItem} ${
                                isActiveSub
                                  ? s.mobileDropdownItemActive
                                  : s.mobileDropdownItemInactive
                              }`}
                            >
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {user ? (
                <>
                  <div className={s.mobileUserInfo}>
                    <div className={s.mobileUserInfoContent}>
                      <User className={s.userIcon} />
                      <span>{user.name}</span>
                    </div>
                  </div>
                  <button onClick={handleLogout} className={s.mobileLogoutButton}>
                    <LogOut className={s.logoutIcon} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className={s.mobileLoginContainer}>
                  <button
                    onClick={() => handleNavigate("login")}
                    className={s.mobileLoginButton}
                  >
                    <LogIn className={s.loginIcon} />
                    <span>Login</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;

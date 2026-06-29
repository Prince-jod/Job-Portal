import React from "react";
import { navbarStyles as s } from "../assets/dummyStyles";

const Navbar = () => {
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
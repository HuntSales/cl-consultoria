type NavProps = {
  logoSrc?: string;
  logoAlt?: string;
  brand?: string;
  sub?: string;
  monogram?: string;
};

export function Nav({ logoSrc, logoAlt, brand, sub, monogram }: NavProps) {
  const showLockup = Boolean(brand);

  return (
    <nav className="nav">
      <div className="nav-logo">
        {showLockup ? (
          <div className="nav-lockup">
            <div className="nav-lockup-mono" aria-hidden={logoSrc ? undefined : true}>
              {logoSrc ? (
                <img src={logoSrc} alt={logoAlt || "Logo"} />
              ) : (
                monogram ?? "CL"
              )}
            </div>
            <span className="nav-lockup-divider" aria-hidden="true" />
            <div className="nav-lockup-text">
              <span className="nav-lockup-brand">{brand}</span>
              {sub ? <span className="nav-lockup-sub">{sub}</span> : null}
            </div>
          </div>
        ) : logoSrc ? (
          <img src={logoSrc} alt={logoAlt || "Logo"} className="nav-logo-img" />
        ) : (
          <>
            RAIZ<span>.</span>
            <span className="nav-product">CONSULTORIA FINANCEIRA</span>
          </>
        )}
      </div>
      <a href="#diagnostico" className="nav-cta">
        FAZER DIAGNÓSTICO
      </a>
    </nav>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Brain } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const [role, setRole] = React.useState(() => sessionStorage.getItem("userRole"));

  React.useEffect(() => {
    const handleStorage = () => setRole(sessionStorage.getItem("userRole"));
    window.addEventListener("roleSelected", handleStorage);
    return () => window.removeEventListener("roleSelected", handleStorage);
  }, []);

  const isSpecialist = role === "specialist";
  const hideHeader = currentPageName === "PatientChat";
  const isHome = currentPageName === "Home";

  return (
    <div className="min-h-screen bg-white font-sans">
      <style>{`
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f8fafc;
        }
      `}</style>

      {!hideHeader && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-800 tracking-wide">
                Oncology Helper
              </span>
            </Link>

            {isSpecialist && !isHome && (
              <nav className="flex items-center gap-1">
                <Link
                  to={createPageUrl("CasesList")}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Мои случаи
                </Link>
                <Link
                  to={createPageUrl("NewCase")}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  + Новый случай
                </Link>
              </nav>
            )}

            {isSpecialist && isHome && (
              <nav className="flex items-center gap-1">
                <Link
                  to={createPageUrl("CasesList")}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Мои случаи
                </Link>
                <Link
                  to={createPageUrl("NewCase")}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  + Новый случай
                </Link>
              </nav>
            )}
          </div>
        </header>
      )}

      <main className={hideHeader ? "" : "pt-14"}>
        {children}
      </main>
    </div>
  );
}
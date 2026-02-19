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

  const hideNav = !role || role === "patient";
  const hideHeader = currentPageName === "PatientChat";

  return (
    <div className="min-h-screen bg-white font-sans">
      <style>{`
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .glass-input {
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.08);
        }
      `}</style>

      {!hideHeader && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold tracking-wide text-gray-900 uppercase">
                Oncology Helper
              </span>
            </Link>
            <nav className={`flex items-center gap-6 ${hideNav ? "hidden" : ""}`}>
              <Link id="tour-nav-cases" to={createPageUrl("CasesList")} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Мои случаи
              </Link>
              <Link id="tour-nav-newcase" to={createPageUrl("NewCase")} className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors">
                Новый случай
              </Link>
            </nav>
            {currentPageName === "Home" && (
              <Link
                to={createPageUrl("PatientChat")}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors ml-4"
                onClick={() => { sessionStorage.setItem("userRole", "patient"); window.dispatchEvent(new Event("roleSelected")); }}
              >
                Для пациентов
              </Link>
            )}
          </div>
        </header>
      )}

      <main className={hideHeader ? "" : "pt-16"}>
        {children}
      </main>
    </div>
  );
}
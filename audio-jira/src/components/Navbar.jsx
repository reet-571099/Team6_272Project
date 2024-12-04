import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = location.pathname === "/dashboard";
  const isAuthPage = location.pathname === "/auth";
  
  const handleLogout = () => {
    // Clear localStorage
    localStorage.clear();
  
    // Clear all cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  
    // Navigate to login or home page
    navigate("/");
  };

  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/")}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AudioJira
              </span>
            </button>
          </div>
          <div className="flex items-center space-x-8">
            {!isAuthenticated && !isAuthPage && (
              <>
                <a
                  href="#features"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  How it Works
                </a>
                <button
                  onClick={() => navigate("/auth")}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:opacity-90 transition-all transform hover:scale-105 shadow-md"
                >
                  Get Started
                </button>
              </>
            )}
            {isAuthenticated && (
              <button
              onClick={handleLogout}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

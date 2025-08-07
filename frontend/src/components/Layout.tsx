import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Monitor, LogOut } from 'lucide-react';
import { apiService } from '../services/api';

export const Layout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    apiService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Monitor className="h-8 w-8 text-primary-600" />
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                자판기 관리 시스템
              </h1>
            </div>
            
            <nav className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                대시보드
              </Link>
              <Link
                to="/devices"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                장치 관리
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                <LogOut className="h-4 w-4 mr-1" />
                로그아웃
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};
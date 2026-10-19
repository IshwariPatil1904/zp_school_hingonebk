import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#111827] text-main-text dark:text-dark-text transition-colors duration-200">
      <PublicNavbar />
      <main className="flex-1 bg-white dark:bg-[#111827]">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};

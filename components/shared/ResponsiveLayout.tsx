'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, HeartHandshake, Activity } from 'lucide-react';

interface ResponsiveLayoutProps {
  userName: string;
  email: string;
  children: React.ReactNode;
  isTherapist?: boolean;
}

export default function ResponsiveLayout({ 
  userName, 
  email, 
  children, 
  isTherapist = false 
}: ResponsiveLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col lg:flex-row relative overflow-x-hidden">
      {/* Mobile Top Header */}
      <header className="lg:hidden h-16 bg-white/85 backdrop-blur-md border-b border-stone-200/60 px-4 flex items-center justify-between sticky top-0 z-20 w-full">
        <div className="flex items-center gap-2">
          {isTherapist ? (
            <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-md">
              <Activity className="h-4 w-4" />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-md">
              <HeartHandshake className="h-4 w-4" />
            </div>
          )}
          <span className="text-md font-serif font-semibold text-stone-855">
            {isTherapist ? 'MirrorCare' : 'MindMirror'}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg hover:bg-stone-100 text-stone-600 cursor-pointer transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Sidebar Container */}
      <div 
        className={`fixed inset-y-0 left-0 z-40 w-80 max-w-[85vw] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto lg:h-screen lg:w-80 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar 
          userName={userName} 
          email={email} 
          isTherapist={isTherapist} 
          onCloseMobile={() => setIsOpen(false)} 
        />
      </div>

      {/* Backdrop for Mobile Drawer */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-stone-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen flex flex-col w-full min-w-0">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

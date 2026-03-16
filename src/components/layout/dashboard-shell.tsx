'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SidebarContext } from '@/hooks/use-sidebar';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileNav } from './mobile-nav';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 72;

interface DashboardShellProps {
  children: React.ReactNode;
  userEmail?: string;
}

export function DashboardShell({ children, userEmail }: DashboardShellProps): React.ReactElement {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}>
      <div className="min-h-screen bg-background">
        <Sidebar />

        {/* メインコンテンツエリア */}
        <motion.div
          animate={{
            marginLeft: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex min-h-screen flex-col max-lg:!ml-0"
        >
          <Header userEmail={userEmail} />

          <main id="main-content" className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-6">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </main>
        </motion.div>

        <MobileNav />
      </div>
    </SidebarContext.Provider>
  );
}

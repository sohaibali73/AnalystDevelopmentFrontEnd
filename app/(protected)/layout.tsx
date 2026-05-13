'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/layouts/MainLayout';
import { ProcessManagerProvider, ProcessManagerWidget } from '@/contexts/ProcessManager';
import DesktopAgentBootstrap from '@/components/desktop/DesktopAgentBootstrap';
import DesktopOnboarding from '@/components/desktop/DesktopOnboarding';
import ToolActivityDrawer from '@/components/desktop/ToolActivityDrawer';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <ProcessManagerProvider>
        {/* Desktop-only — no-ops in the web build. */}
        <DesktopAgentBootstrap />
        <DesktopOnboarding />
        <ToolActivityDrawer />
        <MainLayout>{children}</MainLayout>
      </ProcessManagerProvider>
    </ProtectedRoute>
  );
}

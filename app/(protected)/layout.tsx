'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/layouts/MainLayout';
import { ProcessManagerProvider, ProcessManagerWidget } from '@/contexts/ProcessManager';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <ProcessManagerProvider>
        <MainLayout>{children}</MainLayout>
        <ProcessManagerWidget />
      </ProcessManagerProvider>
    </ProtectedRoute>
  );
}

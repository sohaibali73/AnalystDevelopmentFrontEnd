'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: isDark ? '#121212' : '#ffffff',
        color: isDark ? '#ffffff' : '#212121',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderWidth: '4px',
            borderStyle: 'solid',
            borderRightColor: isDark ? '#424242' : '#e0e0e0',
            borderBottomColor: isDark ? '#424242' : '#e0e0e0',
            borderLeftColor: isDark ? '#424242' : '#e0e0e0',
            borderTopColor: '#FEC00F',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>Loading...</p>
        </div>
        {/* FIXED: Use regular style tag instead of style jsx which requires styled-jsx */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Allow access if user exists
  if (user) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
};

export default ProtectedRoute;

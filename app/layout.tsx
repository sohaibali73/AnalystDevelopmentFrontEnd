import type { Metadata } from 'next';
import { Inter, Rajdhani, Quicksand } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { FontSizeProvider } from '@/contexts/FontSizeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { TabProvider } from '@/contexts/TabContext';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });
const rajdhani = Rajdhani({ 
  subsets: ['latin'],
  weight: ['300', '500', '700'],
  variable: '--font-rajdhani'
});
const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['300', '500', '700'],
  variable: '--font-quicksand'
});

export const metadata: Metadata = {
  title: 'Potomac Analyst Workbench',
  description: 'Advanced AFL code generation, trading strategy analysis, and iOS developer blueprint platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${rajdhani.variable} ${quicksand.variable}`}>
        <ThemeProvider>
          <FontSizeProvider>
            <AuthProvider>
              <TabProvider>
                {children}
                <Toaster richColors position="bottom-right" />
              </TabProvider>
            </AuthProvider>
          </FontSizeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

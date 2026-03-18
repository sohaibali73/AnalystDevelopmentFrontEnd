import type { Metadata } from 'next';
import { Inter, Rajdhani, Quicksand, Syne, DM_Mono, Instrument_Sans } from 'next/font/google';
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
  variable: '--font-rajdhani',
});

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['300', '500', '700'],
  variable: '--font-quicksand',
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-dm-mono',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-sans',
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
      <body
        className={[
          inter.className,
          rajdhani.variable,
          quicksand.variable,
          syne.variable,
          dmMono.variable,
          instrumentSans.variable,
        ].join(' ')}
      >
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
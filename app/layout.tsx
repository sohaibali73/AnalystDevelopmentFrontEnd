import type { Metadata, Viewport } from 'next';
import { Inter, Rajdhani, Quicksand, Syne, DM_Mono, Instrument_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { FontSizeProvider } from '@/contexts/FontSizeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { TabProvider } from '@/contexts/TabContext';
import { Toaster } from 'sonner';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

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
  applicationName: 'Potomac',
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Potomac',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/potomac-icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/potomac-icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/potomac-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/potomac-icon.png'],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
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
                <ServiceWorkerRegister />
              </TabProvider>
            </AuthProvider>
          </FontSizeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
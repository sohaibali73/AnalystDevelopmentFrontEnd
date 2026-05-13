'use client';

/**
 * Desktop app download page — sleek public landing that lets users grab
 * the Potomac Analyst Workbench desktop installer.
 *
 * Artifact URLs come from environment variables (set in Vercel project
 * settings) so we can re-point them at new GitHub Releases without code
 * changes. Falls back to GitHub Releases "latest" if env vars aren't set.
 */
import { useEffect, useState } from 'react';

const GH_OWNER = process.env.NEXT_PUBLIC_DESKTOP_GH_OWNER || 'sohaibali73';
const GH_REPO  = process.env.NEXT_PUBLIC_DESKTOP_GH_REPO  || 'AnalystDevelopmentFrontEnd';

// Direct URLs (preferred if set) — point these at your hosted EXEs.
const WIN_INSTALLER = process.env.NEXT_PUBLIC_DESKTOP_WIN_INSTALLER_URL || '';
const WIN_PORTABLE  = process.env.NEXT_PUBLIC_DESKTOP_WIN_PORTABLE_URL  || '';
const MAC_DMG       = process.env.NEXT_PUBLIC_DESKTOP_MAC_DMG_URL       || '';
const LINUX_APPIMG  = process.env.NEXT_PUBLIC_DESKTOP_LINUX_APPIMAGE_URL || '';

const RELEASES_PAGE = `https://github.com/${GH_OWNER}/${GH_REPO}/releases/latest`;

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}
interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  assets: ReleaseAsset[];
}

function fmtSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function detectPlatform(): 'win' | 'mac' | 'linux' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'win';
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('linux')) return 'linux';
  return 'other';
}

export default function DownloadPage() {
  const [release, setRelease] = useState<Release | null>(null);
  const [loadingRelease, setLoadingRelease] = useState(true);
  const [platform, setPlatform] = useState<'win' | 'mac' | 'linux' | 'other'>('other');

  useEffect(() => { setPlatform(detectPlatform()); }, []);

  // Auto-fetch latest GitHub release as fallback if direct URLs aren't set.
  useEffect(() => {
    if (WIN_INSTALLER && WIN_PORTABLE) { setLoadingRelease(false); return; }
    let cancelled = false;
    fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases/latest`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Release | null) => { if (!cancelled && data) setRelease(data); })
      .catch(() => { /* ignore — fall through to manual link */ })
      .finally(() => { if (!cancelled) setLoadingRelease(false); });
    return () => { cancelled = true; };
  }, []);

  const assetByExt = (ext: string): ReleaseAsset | undefined =>
    release?.assets.find((a) => a.name.toLowerCase().endsWith(ext.toLowerCase()));

  const winInstallerHref =
    WIN_INSTALLER ||
    release?.assets.find((a) => /setup.*\.exe$/i.test(a.name))?.browser_download_url ||
    '';
  const winPortableHref =
    WIN_PORTABLE ||
    release?.assets.find((a) => /\.exe$/i.test(a.name) && !/setup/i.test(a.name))?.browser_download_url ||
    '';
  const macHref       = MAC_DMG      || assetByExt('.dmg')?.browser_download_url        || '';
  const linuxHref     = LINUX_APPIMG || assetByExt('.AppImage')?.browser_download_url   || '';

  const primaryHref =
    platform === 'win'   ? (winInstallerHref || winPortableHref)
    : platform === 'mac'   ? macHref
    : platform === 'linux' ? linuxHref
    : '';

  const version = release?.tag_name || 'latest';

  return (
    <div className="min-h-screen bg-black text-neutral-100 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div
          aria-hidden
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(254, 192, 15, 0.6), transparent 65%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.5), transparent 65%)' }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Header */}
      <header className="px-6 md:px-12 py-6 flex items-center justify-between border-b border-neutral-900/60 backdrop-blur-sm">
        <a href="/" className="flex items-center gap-3">
          <img src="/potomac-icon.png" alt="Potomac" className="w-9 h-9 rounded-lg" />
          <span className="text-sm tracking-[0.22em] font-semibold text-neutral-200">POTOMAC</span>
        </a>
        <a
          href="/chat"
          className="text-xs tracking-wider text-neutral-400 hover:text-neutral-100 transition-colors"
        >
          OPEN WEB APP →
        </a>
      </header>

      {/* Hero */}
      <section className="px-6 md:px-12 pt-20 pb-24 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: copy + CTA */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-400/90 text-[10px] tracking-[0.18em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Desktop · {version}
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-semibold leading-[1.05] tracking-tight">
              <span className="text-neutral-100">Potomac Analyst</span>
              <br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-100 bg-clip-text text-transparent">
                on your desktop.
              </span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-neutral-400 leading-relaxed max-w-xl">
              The full Potomac Analyst Workbench, packaged as a native app — with
              <span className="text-neutral-200"> YANG Autopilot</span>, background browser control,
              terminals, file system access, and more. Same login. Same data.
            </p>

            {/* Primary CTA */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {primaryHref ? (
                <a
                  href={primaryHref}
                  className="group inline-flex items-center gap-3 px-7 py-4 rounded-xl bg-gradient-to-b from-amber-300 to-amber-400 text-neutral-950 font-semibold shadow-[0_10px_40px_-10px_rgba(254,192,15,0.6)] hover:shadow-[0_14px_50px_-10px_rgba(254,192,15,0.8)] transition-shadow"
                >
                  <DownloadIcon />
                  <span className="text-sm tracking-wide">
                    Download for {platform === 'win' ? 'Windows' : platform === 'mac' ? 'macOS' : platform === 'linux' ? 'Linux' : 'your platform'}
                  </span>
                </a>
              ) : (
                <a
                  href={RELEASES_PAGE}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 px-7 py-4 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium hover:bg-neutral-800 transition-colors"
                >
                  <DownloadIcon />
                  <span className="text-sm tracking-wide">All releases →</span>
                </a>
              )}
              <span className="text-[11px] text-neutral-500 tracking-wide">
                Free · No account changes
              </span>
            </div>

            {/* Loading shimmer or version meta */}
            {loadingRelease && !release && !WIN_INSTALLER && (
              <div className="mt-6 text-xs text-neutral-600 inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 animate-pulse" />
                Resolving latest release…
              </div>
            )}
          </div>

          {/* Right: device mock */}
          <div className="relative">
            <div className="aspect-[16/10] rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 bg-neutral-950 border-b border-neutral-900">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                <span className="ml-3 text-[11px] text-neutral-500">Potomac Analyst Workbench</span>
              </div>
              <div className="p-5 grid grid-cols-12 gap-2 h-full">
                <div className="col-span-3 space-y-2">
                  {['DASHBOARD','CHAT','KB','STUDIO','YANG','STACKS'].map((n) => (
                    <div key={n} className="px-2 py-2 rounded-md bg-neutral-900/60 border border-neutral-900 text-[9px] tracking-widest text-neutral-500">{n}</div>
                  ))}
                </div>
                <div className="col-span-9 rounded-md bg-neutral-900/40 border border-neutral-900 p-3 flex flex-col gap-2">
                  <div className="text-[10px] uppercase tracking-widest text-amber-300/70">YANG · running</div>
                  <div className="h-2 w-2/3 rounded bg-neutral-800" />
                  <div className="h-2 w-1/2 rounded bg-neutral-800" />
                  <div className="mt-2 flex-1 rounded bg-neutral-950 border border-neutral-900 p-2 grid grid-cols-3 gap-1">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="h-6 rounded bg-neutral-900 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div aria-hidden className="absolute -inset-x-10 -bottom-10 h-32 rounded-full blur-3xl bg-amber-400/10" />
          </div>
        </div>
      </section>

      {/* All platforms */}
      <section className="px-6 md:px-12 pb-16 max-w-6xl mx-auto">
        <h2 className="text-xs tracking-[0.22em] uppercase text-neutral-500 font-medium mb-5">All platforms</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PlatformCard
            title="Windows"
            subtitle="Setup .exe (NSIS installer)"
            href={winInstallerHref}
            secondaryHref={winPortableHref}
            secondaryLabel="Portable .exe"
            highlighted={platform === 'win'}
            icon={<WinIcon />}
          />
          <PlatformCard
            title="macOS"
            subtitle="Universal .dmg (Intel + Apple Silicon)"
            href={macHref}
            highlighted={platform === 'mac'}
            comingSoon={!macHref}
            icon={<AppleIcon />}
          />
          <PlatformCard
            title="Linux"
            subtitle="AppImage (portable, no install)"
            href={linuxHref}
            highlighted={platform === 'linux'}
            comingSoon={!linuxHref}
            icon={<LinuxIcon />}
          />
        </div>
        <div className="mt-5 text-xs text-neutral-500">
          Looking for older builds?{' '}
          <a href={RELEASES_PAGE} target="_blank" rel="noreferrer" className="underline hover:text-neutral-300">
            View all releases on GitHub →
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-12 pb-24 max-w-6xl mx-auto">
        <h2 className="text-xs tracking-[0.22em] uppercase text-neutral-500 font-medium mb-6">Why the desktop app</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Feat title="YANG Autopilot" body="Long-running, autonomous goals with plan → execute → critique. Runs in the background while you keep working." />
          <Feat title="Filesystem & shell" body="The AI can read, write, and organize files in your workspace — and run real shell commands with your approval." />
          <Feat title="Background browser" body="Spin up a parallel Chromium tab the AI controls without touching your active browser." />
          <Feat title="Native app control" body="Drive Windows apps (Notepad, Office) via UI Automation — no cursor movement needed." />
          <Feat title="Multi-tab terminals" body="Real PTY-backed terminals for development workflows. Share tabs with the AI." />
          <Feat title="Persistent memory" body="The AI remembers your preferences and learns from past sessions, with semantic recall every turn." />
          <Feat title="GitHub PR review" body="List, diff, comment on and approve pull requests right from chat via the gh CLI." />
          <Feat title="SSH + MCP" body="Encrypted SSH profile manager and full Model Context Protocol server hosting." />
          <Feat title="Kill switch" body="Press Ctrl+Shift+Esc to halt every tool instantly. Passcode-gated to resume." />
        </div>
      </section>

      {/* System requirements */}
      <section className="px-6 md:px-12 pb-24 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-6">
            <h3 className="text-sm font-medium tracking-wide text-neutral-200 mb-3">System requirements</h3>
            <ul className="text-sm text-neutral-400 space-y-2 leading-relaxed">
              <li>Windows 10/11 (64-bit), macOS 11+, or Linux x64</li>
              <li>~250 MB disk space (~400 MB with background browser)</li>
              <li>Internet connection (the app loads the Potomac web UI)</li>
              <li>For computer-use: macOS Accessibility &amp; Screen Recording permissions</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <h3 className="text-sm font-medium tracking-wide text-amber-200 mb-3">Note on security</h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Installers are not yet code-signed, so Windows SmartScreen may warn the first time you run them
              — click <span className="font-medium text-neutral-100">More info → Run anyway</span>. We're working on
              an EV cert. macOS users may need to right-click → Open on first launch.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-8 border-t border-neutral-900/60 text-xs text-neutral-500 flex flex-wrap justify-between gap-4">
        <span>© {new Date().getFullYear()} Potomac. All rights reserved.</span>
        <div className="flex gap-5">
          <a href="/privacy" className="hover:text-neutral-300">Privacy</a>
          <a href="/terms" className="hover:text-neutral-300">Terms</a>
          <a href={RELEASES_PAGE} target="_blank" rel="noreferrer" className="hover:text-neutral-300">GitHub</a>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function PlatformCard({
  title, subtitle, href, secondaryHref, secondaryLabel, highlighted, comingSoon, icon,
}: {
  title: string; subtitle: string; href: string; secondaryHref?: string; secondaryLabel?: string;
  highlighted?: boolean; comingSoon?: boolean; icon: React.ReactNode;
}) {
  const disabled = !href || comingSoon;
  return (
    <div
      className={`relative rounded-2xl border p-5 transition-all ${
        highlighted
          ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/[0.07] to-amber-500/[0.02] shadow-[0_8px_40px_-12px_rgba(254,192,15,0.4)]'
          : 'border-neutral-900 bg-neutral-950/60 hover:bg-neutral-950'
      }`}
    >
      {highlighted && (
        <span className="absolute top-3 right-3 text-[9px] tracking-widest uppercase text-amber-300/90 font-medium">
          Recommended
        </span>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg ${highlighted ? 'bg-amber-500/10' : 'bg-neutral-900'} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <div className="text-base font-medium text-neutral-100">{title}</div>
          <div className="text-xs text-neutral-500">{subtitle}</div>
        </div>
      </div>
      {comingSoon ? (
        <div className="mt-4 inline-flex items-center gap-2 text-xs text-neutral-500">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" /> Coming soon
        </div>
      ) : (
        <>
          <a
            href={href || '#'}
            className={`mt-1 inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              disabled
                ? 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                : highlighted
                  ? 'bg-amber-400 text-neutral-950 hover:bg-amber-300'
                  : 'bg-neutral-100 text-neutral-900 hover:bg-white'
            }`}
            onClick={(e) => disabled && e.preventDefault()}
          >
            <DownloadIcon />
            Download
          </a>
          {secondaryHref && secondaryLabel && (
            <a
              href={secondaryHref}
              className="ml-2 text-xs text-neutral-400 hover:text-neutral-200 underline-offset-4 hover:underline"
            >
              {secondaryLabel}
            </a>
          )}
        </>
      )}
    </div>
  );
}

function Feat({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-4 hover:border-neutral-800 transition-colors">
      <div className="text-sm font-medium text-neutral-100">{title}</div>
      <div className="text-xs text-neutral-500 mt-1.5 leading-relaxed">{body}</div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function WinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-neutral-300">
      <path d="M3 12V6.75l6-1.07v6.32L3 12zm0 .75 6 .07v6.39l-6-1.07V12.75zm6.55-7.09L21 4v8.25l-11.45-.06V5.66zM21 12.75v8.25l-11.45-1.66V12.69L21 12.75z" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-neutral-300">
      <path d="M17.05 13c-.04-3.7 3.02-5.48 3.16-5.57-1.72-2.52-4.4-2.87-5.36-2.9-2.28-.23-4.45 1.34-5.61 1.34-1.18 0-2.96-1.31-4.87-1.27-2.5.04-4.81 1.46-6.1 3.7-2.6 4.51-.66 11.18 1.87 14.84 1.24 1.79 2.71 3.8 4.62 3.73 1.86-.08 2.57-1.2 4.82-1.2 2.24 0 2.87 1.2 4.82 1.16 1.99-.03 3.25-1.82 4.46-3.62 1.41-2.08 1.99-4.09 2.02-4.19-.04-.02-3.88-1.49-3.92-5.91zM13.83 4.27c1.03-1.25 1.73-3 1.54-4.76-1.49.06-3.3 1-4.37 2.25-.96 1.1-1.8 2.88-1.57 4.6 1.66.13 3.36-.84 4.4-2.09z" />
    </svg>
  );
}
function LinuxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-neutral-300">
      <path d="M12 0c-.95 0-1.92.36-2.5 1-1.1 1.2-1 3 0 4-.5.7-1 1.5-1 2.5 0 2.5 2 4 2 6.5 0 1-.5 2-1 2.5-1 1-1.5 2-1.5 3.5 0 1.5 1 2.5 2.5 2.5h3c1.5 0 2.5-1 2.5-2.5 0-1.5-.5-2.5-1.5-3.5-.5-.5-1-1.5-1-2.5 0-2.5 2-4 2-6.5 0-1-.5-1.8-1-2.5 1-1 1.1-2.8 0-4-.58-.64-1.55-1-2.5-1z" />
    </svg>
  );
}

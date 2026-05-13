# Publishing the Desktop App for Download

The `/download` page on your Vercel site is wired to fetch installers from
**GitHub Releases**. To put a new build live, you:

1. Build the EXE locally
2. Upload it to a GitHub Release on the `sohaibali73/AnalystDevelopmentFrontEnd` repo
3. (Optional) Override URLs via Vercel env vars if you want to host elsewhere

The download page automatically:
- Detects the user's OS and surfaces the right installer
- Falls back to "latest" GitHub release if no explicit URLs are configured
- Shows release version, file size, and a polished hero with platform cards

---

## Quick path — first-time setup (5 min)

### Step 1 — Build the desktop installers (already done)

```powershell
cd electron
npm run dist:win
```

Output:
- `electron/out/Potomac Analyst Workbench Setup 0.1.0.exe` (NSIS installer, ~95 MB)
- `electron/out/Potomac Analyst Workbench 0.1.0.exe` (portable, ~95 MB)

### Step 2 — Sign in to GitHub CLI (one-time)

```powershell
gh auth login
# Pick: GitHub.com → HTTPS → Yes (auth git operations) → Login with browser
```

### Step 3 — Create the release & upload the EXEs

```powershell
# Tag the current commit and push
git tag desktop-v0.1.0
git push origin desktop-v0.1.0

# Create a GitHub release and upload both EXEs
gh release create desktop-v0.1.0 `
  "electron\out\Potomac Analyst Workbench Setup 0.1.0.exe" `
  "electron\out\Potomac Analyst Workbench 0.1.0.exe" `
  --title "Desktop v0.1.0 — YANG Autopilot" `
  --notes "Initial public desktop release. Includes:
- YANG Autopilot (Goals, Memory, Schedules)
- Filesystem, shell, computer-use, background browser
- Multi-tab terminals, GitHub PR review, SSH, MCP
- Kill switch (Ctrl+Shift+Esc), passcode-gated"
```

### Step 4 — Verify

Open `https://potomacdeveloper.vercel.app/download` (or your domain).
The page auto-detects the latest release via the GitHub API and serves the
correct installer for the visitor's OS.

---

## Updating to a new version

```powershell
# 1. Bump version in electron/package.json (e.g. 0.1.0 → 0.2.0)
# 2. Rebuild
cd electron
npm run dist:win

# 3. Tag & release
cd ..
git tag desktop-v0.2.0
git push origin desktop-v0.2.0
gh release create desktop-v0.2.0 `
  "electron\out\Potomac Analyst Workbench Setup 0.2.0.exe" `
  "electron\out\Potomac Analyst Workbench 0.2.0.exe" `
  --title "Desktop v0.2.0" `
  --notes "Changelog goes here…"
```

The `/download` page picks up the new release automatically — no Vercel redeploy needed.

---

## Optional — override URLs via Vercel env vars

If you'd rather host the installers somewhere else (S3, Cloudflare R2,
your own static server, etc.), set these env vars in Vercel project settings
under **Production / Preview**:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_DESKTOP_WIN_INSTALLER_URL` | Direct URL to the NSIS `.exe` installer |
| `NEXT_PUBLIC_DESKTOP_WIN_PORTABLE_URL` | Direct URL to the portable `.exe` |
| `NEXT_PUBLIC_DESKTOP_MAC_DMG_URL` | Direct URL to the macOS `.dmg` |
| `NEXT_PUBLIC_DESKTOP_LINUX_APPIMAGE_URL` | Direct URL to the Linux `.AppImage` |
| `NEXT_PUBLIC_DESKTOP_GH_OWNER` | (default: `sohaibali73`) GitHub owner for the "All releases" link |
| `NEXT_PUBLIC_DESKTOP_GH_REPO`  | (default: `AnalystDevelopmentFrontEnd`) GitHub repo |

When direct URLs are set, the page skips the GitHub API call entirely.

---

## Future automation (GitHub Actions)

To auto-build + auto-release on every tag, add `.github/workflows/electron-release.yml`:

```yaml
name: Electron Release
on:
  push:
    tags: ['desktop-v*']

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
        working-directory: electron
      - run: npm run dist:win
        working-directory: electron
      - uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ github.ref_name }}
          files: |
            electron/out/Potomac Analyst Workbench Setup *.exe
            electron/out/Potomac Analyst Workbench *.exe
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

After this is in place, pushing a `desktop-v*` tag triggers a full Windows
build on GitHub's runners and uploads the artifacts to the release for you.

---

## Code signing (later)

The current installers are **unsigned**, so Windows SmartScreen warns on first run.
Users need to click **"More info" → "Run anyway"**.

To eliminate that warning:
1. Buy an EV code-signing certificate (~$300/yr; DigiCert, Sectigo, etc.)
2. Pass cert + password to `electron-builder` via `CSC_LINK` + `CSC_KEY_PASSWORD` env vars
3. `electron-builder` will auto-sign during `npm run dist:win`

This isn't blocking — distribution works fine without it; users just see one extra dialog.

---

## File sizes & hosting limits

| Asset | Approximate size | GitHub Release limit |
|---|---|---|
| Setup .exe (NSIS) | ~95 MB | 2 GB per file ✅ |
| Portable .exe | ~95 MB | ✅ |
| Future macOS .dmg | ~110 MB | ✅ |
| Future Linux AppImage | ~95 MB | ✅ |

GitHub Releases is a perfectly good CDN for this scale (the assets are served
from a global CDN automatically). For >100k MAU you might want to move to S3 +
CloudFront, in which case use the env-var override pattern above.

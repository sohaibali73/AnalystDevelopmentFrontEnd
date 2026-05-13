# YANG Autopilot — Computer-Use Test Goal

Use this prompt to exercise the full chain: planning → screenshot grounding → keyboard control → mouse clicks → typing → file save → verification screenshot — all via the `cu_*` family (Background Computer Use). It works against any of the three adapters; copy whichever variant matches what you want to test.

---

## ✅ Pre-flight (one-time)

1. **Onboarding completed** (the first-run modal asked for a passcode and you set one).
2. **Settings → Desktop Agent → Capabilities → Computer use** is **ON**.
3. **Settings → Desktop Agent → Auto-approve → Computer use** is **ON** (otherwise the goal will pause and wait for "Allow once / session / deny" dialog every action).
4. **Backend is live for Phase 1+2** (the recipe in `docs/YANG_AUTOPILOT_PHASE_1_2_BACKEND.md` is deployed on Railway with `cu_*` tools registered and `yang_cu` in `ALLOWED_CAPS`).
5. **Playwright Chromium installed** (only needed for browser-target tests):
   ```powershell
   cd electron
   npx playwright install chromium
   ```

---

## 🎯 Test Goal A — Full Notepad write-and-save flow (Windows native, no-cursor-movement)

Best test of `UiaWindowsAdapter` — proves the AI can drive a real Windows app via UI Automation without ever touching the user's cursor.

**Paste into the chat:**

```
/goal Open a Notepad window in the background, type a short timestamped note in it, save it as ~/PotomacWorkspace/yang-test-notepad.txt, and then take a confirmation screenshot proving the file was saved. Report back when done. Use the cu_* tools — never use the global computer_* tools (those move my real cursor).
```

**Expected step sequence in the Goals timeline:**
1. `plan` — outlines the steps
2. `cu_open_target({kind:"native", app:"notepad.exe"})` → returns a `native:1:HWND` id
3. `cu_screenshot(id)` → grounds the window
4. `cu_type(id, "YANG Autopilot test — <ISO timestamp>\n")`
5. `cu_key(id, "Ctrl+S")` → opens Save As dialog
6. `cu_screenshot(id)` → reads the dialog
7. `cu_type(id, "<full path to ~/PotomacWorkspace/yang-test-notepad.txt>")`
8. `cu_key(id, "Enter")`
9. `fs_stat("~/PotomacWorkspace/yang-test-notepad.txt")` → confirms file exists
10. `cu_screenshot(id)` → final visual proof
11. `cu_close(id)`
12. `note` — "Saved successfully at <timestamp>" + summary

**What proves it worked:** Your real cursor never moves, Notepad opens & operates entirely in the background, the `.txt` file appears in your workspace folder.

---

## 🎯 Test Goal B — Background browser form fill (Playwright)

Best test of `BrowserAdapter` — runs in a fully invisible Chromium with its own cursor.

**Paste into the chat:**

```
/goal In a background browser tab, navigate to https://duckduckgo.com, type "YANG Autopilot test query" into the search box, press Enter, wait for results, take a screenshot, extract the first 3 result titles via DOM access, and write them to ~/PotomacWorkspace/yang-test-search.json. Use only cu_* and browser_* tools.
```

**Expected step sequence:**
1. `plan`
2. `cu_open_target({kind:"browser", url:"https://duckduckgo.com"})` → `browser:1`
3. `cu_screenshot(browser:1)` → reads the layout
4. `cu_click(browser:1, x, y)` on the search box
5. `cu_type(browser:1, "YANG Autopilot test query")`
6. `cu_key(browser:1, "Enter")`
7. `cu_screenshot(browser:1)` — verifies results loaded
8. `cu_get_content(browser:1)` — returns the a11y tree
9. **either** `browser_eval(browser:1, "Array.from(document.querySelectorAll('article h2 a')).slice(0,3).map(a => a.textContent)")`
   **or** the AI parses titles from the a11y tree directly
10. `fs_write_file("~/PotomacWorkspace/yang-test-search.json", JSON.stringify({titles}, null, 2))`
11. `cu_close(browser:1)`
12. `note` with the extracted titles

**What proves it worked:** A JSON file with three result titles appears in your workspace; you never saw a browser window open on your screen.

---

## 🎯 Test Goal C — Excel data entry on a Virtual Desktop (true background)

Most ambitious — exercises `VirtualDesktopAdapter` which places the target window on a secondary Windows virtual desktop.

**Paste into the chat:**

```
/goal Launch Excel on a secondary virtual desktop so I don't see it. Type "Date" in A1, "Value" in B1. Then in rows 2-6 put the last 5 calendar dates (oldest first) in column A and the integers 10, 20, 30, 40, 50 in column B. Save the workbook as ~/PotomacWorkspace/yang-test-table.xlsx. Take a final screenshot. Use cu_* with kind="virtual-desktop". Don't touch my real cursor.
```

**Expected step sequence:**
1. `plan`
2. `cu_open_target({kind:"virtual-desktop", app:"excel.exe"})` → `vd:native:…`
3. `cu_screenshot(vd:…)` — looks at empty workbook
4. `cu_type` / `cu_key("Tab")` / `cu_key("Down")` to enter headers + 5 rows of data
5. `cu_key(vd:…, "Ctrl+S")`
6. Type filename, Enter
7. `fs_stat` to verify
8. `cu_screenshot(vd:…)` — final state
9. `cu_close`

**Note:** Virtual desktop isolation is best-effort on Windows (the COM API for `IVirtualDesktopManager` is unofficial). If the isolation step fails, the adapter falls back to plain UIA behavior — the meta field `isolated: false` will show in the audit log. The test still works; the window will just be on your primary desktop.

---

## 🎯 Test Goal D — Multi-app workflow (combines browser + native)

Stress test: AI uses both adapters in one goal.

**Paste into the chat:**

```
/goal In a background browser, go to https://en.wikipedia.org/wiki/Special:Random, grab the page title via the a11y tree, then open Notepad (in the background, using cu_open_target kind=native), type "Random Wikipedia: <title>" into it, save as ~/PotomacWorkspace/yang-wiki-random.txt, and close both targets. Report the page title in your final note.
```

**Expected step sequence:** opens 2 targets, juggles between them by passing their respective `targetId`s, closes both.

---

## 🛠 Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Goal stuck in `waiting_for_input` | Auto-approve for computer use is OFF — there's a dialog waiting on your screen | Click "Allow for session" in the prompt, or enable auto-approve in Settings |
| `E_DISABLED: Computer-use capability is disabled in settings` | Capability toggle is off | Settings → Desktop Agent → Capabilities → enable Computer use |
| `E_KILL_SWITCH` on every call | Kill switch is engaged | Settings → Desktop Agent → Kill switch → enter passcode → Unlock |
| `Unknown desktop tool: cu_open_target` in tool-result | Backend hasn't registered the `cu_*` schemas | Deploy `YANG_AUTOPILOT_PHASE_1_2_BACKEND.md` |
| `Playwright was not initialized` / Chromium missing | First-time use, browser binary not downloaded | `cd electron && npx playwright install chromium` |
| Notepad opens visibly on your screen | UIA can't fully hide a window — it minimizes input theft, but window is still visible. For full invisibility use the virtual-desktop adapter (Goal C). | Expected behavior |
| `E_NO_HWND: Could not find a main window` | The launched process is a UWP / store app that hides its HWND | Try the classic Win32 version: `notepad.exe` not "Notepad" from Start Menu |
| Cursor moves during `cu_type` | The AI fell back to the legacy `computer_type` tool (which uses nut.js and DOES move the real cursor) | Re-prompt: "Use cu_type, not computer_type, and pass the targetId." Or remove `computer` from your capabilities so only `cu_*` is available |

---

## 🚨 Kill switch test

While any of the above goals is running, press **`Ctrl+Shift+Esc`**. You should see:
- A warning dialog: "Agent kill switch engaged — terminated N processes."
- The goal pauses with status `failed` or `waiting_for_input`
- Subsequent tool calls in the activity drawer show `E_KILL_SWITCH`
- To resume: Settings → Desktop Agent → Kill switch → enter your passcode → Unlock

---

## 📊 What to inspect after each goal

1. **Goals dock** (`/yang/goals/<id>`) — full step-by-step timeline with status pills
2. **Tool activity drawer** (bottom-right pill) — last 60 s of tool calls, click to expand
3. **Audit log** — Settings → Desktop Agent → Audit log → shows every tool invocation (start/success/error/denied) with timestamps and duration
4. **Workspace** — `~/PotomacWorkspace/` should now contain whatever files the goal produced

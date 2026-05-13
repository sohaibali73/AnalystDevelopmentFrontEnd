/**
 * Native right-click context menu with copy/paste, spelling suggestions,
 * link/image actions, and DevTools toggle. Self-contained, no deps.
 */
import { BrowserWindow, Menu, MenuItemConstructorOptions, clipboard, shell } from 'electron';

export function attachContextMenu(win: BrowserWindow): void {
  win.webContents.on('context-menu', (_event, params) => {
    const items: MenuItemConstructorOptions[] = [];

    // Spelling suggestions
    if (params.misspelledWord && params.dictionarySuggestions.length > 0) {
      for (const suggestion of params.dictionarySuggestions.slice(0, 5)) {
        items.push({
          label: suggestion,
          click: () => win.webContents.replaceMisspelling(suggestion),
        });
      }
      items.push({
        label: 'Add to Dictionary',
        click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
      });
      items.push({ type: 'separator' });
    }

    // Link actions
    if (params.linkURL) {
      items.push(
        {
          label: 'Open Link in Browser',
          click: () => shell.openExternal(params.linkURL).catch(() => {}),
        },
        {
          label: 'Copy Link',
          click: () => clipboard.writeText(params.linkURL),
        },
        { type: 'separator' },
      );
    }

    // Image actions
    if (params.mediaType === 'image' && params.srcURL) {
      items.push(
        {
          label: 'Copy Image URL',
          click: () => clipboard.writeText(params.srcURL),
        },
        {
          label: 'Open Image in Browser',
          click: () => shell.openExternal(params.srcURL).catch(() => {}),
        },
        { type: 'separator' },
      );
    }

    // Standard editing
    if (params.isEditable) {
      items.push(
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'selectAll' },
      );
    } else if (params.selectionText && params.selectionText.trim().length > 0) {
      items.push({ role: 'copy' }, { role: 'selectAll' });
    } else if (items.length === 0) {
      // Empty area — show navigation
      items.push(
        {
          label: 'Back',
          enabled: win.webContents.canGoBack(),
          click: () => win.webContents.goBack(),
        },
        {
          label: 'Forward',
          enabled: win.webContents.canGoForward(),
          click: () => win.webContents.goForward(),
        },
        { label: 'Reload', click: () => win.webContents.reload() },
        { type: 'separator' },
        { role: 'selectAll' },
      );
    }

    items.push({ type: 'separator' }, {
      label: 'Inspect Element',
      click: () => win.webContents.inspectElement(params.x, params.y),
    });

    Menu.buildFromTemplate(items).popup({ window: win });
  });
}

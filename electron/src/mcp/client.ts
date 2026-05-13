/**
 * Model Context Protocol (MCP) host inside Electron.
 *
 * Manages 1..N MCP servers configured by the user. Each server runs either as
 * a stdio child process (`command + args`) or via streamable HTTP. We use the
 * official SDK (`@modelcontextprotocol/sdk`) to handshake & list tools.
 *
 * The discovered tools are exposed to the renderer as `mcp_<server>_<tool>`
 * names, which the agent calls just like any other desktop tool — the
 * dispatcher in the backend recipe routes the call to this host, which forwards
 * to the right MCP server.
 *
 * Config persisted at `userData/mcp-servers.json`.
 */
import { ipcMain, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { append as auditAppend } from '../tools/audit';

interface ServerConfig {
  id: string;
  name: string;
  transport: 'stdio' | 'http';
  command?: string;          // stdio
  args?: string[];           // stdio
  env?: Record<string, string>;
  url?: string;              // http
  headers?: Record<string, string>;
  disabled?: boolean;
}

interface RunningServer {
  config: ServerConfig;
  client: unknown;           // MCP SDK Client instance
  toolNames: string[];       // qualified mcp_<serverId>_<tool>
  status: 'connected' | 'disconnected' | 'error';
  error?: string;
}

const cfgPath = () => path.join(app.getPath('userData'), 'mcp-servers.json');
const running = new Map<string, RunningServer>();

function loadConfigs(): ServerConfig[] {
  try {
    if (!fs.existsSync(cfgPath())) return [];
    return JSON.parse(fs.readFileSync(cfgPath(), 'utf-8'));
  } catch { return []; }
}
function saveConfigs(list: ServerConfig[]): void {
  try {
    fs.mkdirSync(path.dirname(cfgPath()), { recursive: true });
    fs.writeFileSync(cfgPath(), JSON.stringify(list, null, 2));
  } catch { /* ignore */ }
}

async function connect(cfg: ServerConfig): Promise<void> {
  // Lazy-require so we don't pay the cost when MCP is unused.
  // The SDK is dual-published (ESM + CJS); we use dynamic import.
  type ClientCtor = new (info: { name: string; version: string }, opts?: { capabilities?: Record<string, unknown> }) => unknown;
  let Client: ClientCtor;
  let StdioClientTransport: new (opts: { command: string; args?: string[]; env?: Record<string, string> }) => unknown;
  let StreamableHTTPClientTransport: new (url: URL, opts?: { headers?: Record<string, string> }) => unknown;
  try {
    const sdk = await import('@modelcontextprotocol/sdk/client/index.js');
    const stdio = await import('@modelcontextprotocol/sdk/client/stdio.js');
    const http = await import('@modelcontextprotocol/sdk/client/streamableHttp.js');
    Client = (sdk as { Client: ClientCtor }).Client;
    StdioClientTransport = (stdio as { StdioClientTransport: typeof StdioClientTransport }).StdioClientTransport;
    StreamableHTTPClientTransport = (http as { StreamableHTTPClientTransport: typeof StreamableHTTPClientTransport }).StreamableHTTPClientTransport;
  } catch (err) {
    throw new Error(`@modelcontextprotocol/sdk not loadable: ${err instanceof Error ? err.message : String(err)}`);
  }

  const client = new Client({ name: 'Potomac Analyst Workbench', version: '0.1.0' }, { capabilities: {} });
  let transport: unknown;
  if (cfg.transport === 'stdio') {
    if (!cfg.command) throw new Error('command is required for stdio transport');
    transport = new StdioClientTransport({ command: cfg.command, args: cfg.args, env: cfg.env });
  } else {
    if (!cfg.url) throw new Error('url is required for http transport');
    transport = new StreamableHTTPClientTransport(new URL(cfg.url), { headers: cfg.headers });
  }
  // @ts-expect-error — SDK Client#connect signature isn't statically typed via our minimal shape
  await client.connect(transport);

  // @ts-expect-error — listTools is on Client but our shape is intentionally minimal
  const tools = await client.listTools();
  const toolNames: string[] = ((tools?.tools as Array<{ name: string }>) || []).map((t) => `mcp_${cfg.id}_${t.name}`);

  running.set(cfg.id, { config: cfg, client, toolNames, status: 'connected' });
  auditAppend({ ts: Date.now(), tool: 'mcp_connect', status: 'success', args: { id: cfg.id, name: cfg.name, toolCount: toolNames.length } });
}

async function disconnect(id: string): Promise<void> {
  const rs = running.get(id);
  if (!rs) return;
  try {
    // @ts-expect-error — close on the SDK Client
    await rs.client.close?.();
  } catch { /* ignore */ }
  running.delete(id);
}

export function registerMcpIpc(): void {
  ipcMain.handle('mcp:list-configs', () => loadConfigs());
  ipcMain.handle('mcp:list-running', () => {
    return Array.from(running.values()).map((rs) => ({
      id: rs.config.id,
      name: rs.config.name,
      status: rs.status,
      tools: rs.toolNames,
      error: rs.error,
    }));
  });

  ipcMain.handle('mcp:save-config', async (_e, cfg: ServerConfig) => {
    const list = loadConfigs();
    const idx = list.findIndex((x) => x.id === cfg.id);
    if (idx >= 0) list[idx] = cfg;
    else list.push({ ...cfg, id: cfg.id || `mcp-${Date.now()}` });
    saveConfigs(list);
    if (!cfg.disabled) {
      try { await disconnect(cfg.id); await connect(cfg); }
      catch (err) { return { ok: false, error: err instanceof Error ? err.message : String(err) }; }
    }
    return { ok: true, configs: list };
  });

  ipcMain.handle('mcp:remove-config', async (_e, id: string) => {
    await disconnect(id);
    const list = loadConfigs().filter((x) => x.id !== id);
    saveConfigs(list);
    return list;
  });

  ipcMain.handle('mcp:reconnect', async (_e, id: string) => {
    const cfg = loadConfigs().find((x) => x.id === id);
    if (!cfg) return { ok: false, error: 'No such config' };
    try { await disconnect(id); await connect(cfg); return { ok: true }; }
    catch (err) { return { ok: false, error: err instanceof Error ? err.message : String(err) }; }
  });

  /** Invoke a discovered MCP tool by qualified name. */
  ipcMain.handle('mcp:call-tool', async (_e, qualifiedName: string, args: Record<string, unknown>) => {
    const m = qualifiedName.match(/^mcp_([^_]+)_(.+)$/);
    if (!m) return { ok: false, error: { code: 'E_BAD_NAME', message: 'Tool name must be mcp_<server>_<tool>' } };
    const [, serverId, toolName] = m;
    const rs = running.get(serverId);
    if (!rs) return { ok: false, error: { code: 'E_NO_SERVER', message: `MCP server "${serverId}" not running.` } };
    try {
      // @ts-expect-error — callTool on the SDK Client
      const result = await rs.client.callTool({ name: toolName, arguments: args });
      auditAppend({ ts: Date.now(), tool: qualifiedName, status: 'success' });
      return { ok: true, result };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      auditAppend({ ts: Date.now(), tool: qualifiedName, status: 'error', error: message });
      return { ok: false, error: { code: 'E_MCP', message } };
    }
  });
}

/** Auto-connect every non-disabled server on startup. */
export async function startMcpServers(): Promise<void> {
  for (const cfg of loadConfigs()) {
    if (cfg.disabled) continue;
    try { await connect(cfg); }
    catch (err) {
      running.set(cfg.id, { config: cfg, client: null, toolNames: [], status: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  }
}

export async function shutdownMcp(): Promise<void> {
  for (const id of Array.from(running.keys())) await disconnect(id);
}

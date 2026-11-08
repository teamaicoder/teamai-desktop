'use strict';

// teamai-open <url|file>
//
// Opens a page in TeamAICoder's preview. Terminals inside the app set
// BROWSER to the teamai-open wrapper, so tools that open a browser (Python's
// webbrowser, `$BROWSER file.html`) land in the app: a Chat + Preview tab's own
// preview, or a new browser tab beside a terminal tab.
//
// It sends one JSON line { url, ptyId } to the app's socket (TEAMAICODER_SOCKET).
// Outside the app, or if the socket can't be reached, it falls back to the
// system opener so nothing breaks.

const net = require('net');
const path = require('path');
const { pathToFileURL } = require('url');
const { spawn } = require('child_process');

// An argument → an http(s) or file URL, or null. A bare path (absolute or
// relative to cwd) becomes a file:// URL; a bare host like example.com is not
// guessed at.
function normalizeOpenTarget(arg, cwd = process.cwd()) {
  if (typeof arg !== 'string' || !arg.trim()) return null;
  const s = arg.trim();
  if (/^[a-z][a-z0-9+\-.]*:/i.test(s)) {
    try {
      const u = new URL(s);
      return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'file:' ? u.href : null;
    } catch {
      return null;
    }
  }
  return pathToFileURL(path.resolve(cwd, s)).href;
}

function systemOpen(target) {
  const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
  try {
    spawn(cmd, [target], { detached: true, stdio: 'ignore' }).unref();
    return true;
  } catch {
    return false;
  }
}

// Send { url, ptyId } to the app; resolves true when the app accepted it
function sendToApp(socketPath, message, timeoutMs = 1500) {
  return new Promise(resolve => {
    if (!socketPath) return resolve(false);
    let reply = '';
    const done = ok => { clearTimeout(timer); sock.destroy(); resolve(ok); };
    const sock = net.createConnection(socketPath);
    const timer = setTimeout(() => done(false), timeoutMs);
    sock.on('connect', () => sock.write(JSON.stringify(message) + '\n'));
    sock.on('data', chunk => {
      reply += chunk;
      if (reply.includes('\n')) {
        try { done(JSON.parse(reply.split('\n')[0]).ok === true); } catch { done(false); }
      }
    });
    sock.on('error', () => done(false));
    sock.on('end', () => done(false));
  });
}

async function main(argv) {
  const arg = argv[0];
  if (!arg || arg === '-h' || arg === '--help') {
    process.stderr.write('usage: teamai-open <url|file>\n');
    return arg ? 0 : 2;
  }
  const url = normalizeOpenTarget(arg);
  if (!url) {
    process.stderr.write(`teamai-open: not an http(s) URL or file: ${arg}\n`);
    return 2;
  }
  const ok = await sendToApp(process.env.TEAMAICODER_SOCKET, { url, ptyId: process.env.TEAMAICODER_PTY_ID || null });
  if (ok) return 0;
  return systemOpen(url) ? 0 : 1;
}

if (require.main === module) {
  main(process.argv.slice(2)).then(code => process.exit(code));
}

module.exports = { normalizeOpenTarget, sendToApp };

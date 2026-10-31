'use strict';
// Privileged Steam library lives in a disposable process, never in the renderer.
const { Session } = require('./session.cjs');
function send(value) { if (process.connected) process.send(value); }
let session;
try {
  const SteamUser = require('steam-user');
  session = new Session(options => new SteamUser(options));
} catch {
  send({ type: 'fatal', message: 'Steam component unavailable. Reopen the application.' });
  process.exitCode = 1;
}
if (session) {
  session.on('state', state => send({ type: 'state', state }));
  session.on('credential', token => send({ type: 'credential', token }));
  const refreshTimer = setInterval(() => { void session.refreshPlaytime(); }, 60000);
  refreshTimer.unref();
  process.on('message', async message => {
    const id = message?.id;
    try {
      switch (message?.action) {
        case 'login': session.login(message.payload); break;
        case 'resume': session.resume(message.payload); break;
        case 'guard': session.submitGuard(message.payload); break;
        case 'start': await session.start(message.payload); break;
        case 'stop': session.stop(); void session.refreshPlaytime(); break;
        case 'playtime': await session.refreshPlaytime(); break;
        case 'disconnect': session.disconnect(); break;
        case 'state': break;
        default: throw new Error('Invalid command.');
      }
      send({ type: 'reply', id, ok: true, state: session.snapshot() });
    } catch {
      // Never serialize third-party exception text: it can contain input or tokens.
      send({ type: 'reply', id, ok: false, message: 'Action failed. Check your connection, selection or code.' });
    } finally {
      if (message?.action === 'login' && message.payload) message.payload.password = '';
      if (message?.action === 'guard') message.payload = '';
      if (message?.action === 'resume') message.payload = '';
    }
  });
  process.on('disconnect', () => { session.disconnect(); process.exit(0); });
  process.on('SIGTERM', () => { session.disconnect(); process.exit(0); });
  process.on('uncaughtException', () => { session.disconnect('Steam connection closed.'); process.exit(1); });
  process.on('unhandledRejection', () => { session.disconnect('Steam connection closed.'); process.exit(1); });
}

'use strict';
const path = require('node:path');
const { execFileSync } = require('node:child_process');
exports.default = async context => {
  if (context.electronPlatformName !== 'win32') return;
  const compiler = path.join(process.env.WINDIR, 'Microsoft.NET', 'Framework64', 'v4.0.30319', 'csc.exe');
  execFileSync(compiler, ['/nologo', '/target:winexe', '/platform:x64',
    '/out:' + path.join(context.appOutDir, 'Steam Saat.exe'), path.resolve('installer/LegacyLauncher.cs')], { stdio: 'inherit', windowsHide: true });
};

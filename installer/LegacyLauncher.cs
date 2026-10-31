using System;
using System.Diagnostics;
using System.IO;
internal static class LegacyLauncher {
  [STAThread] private static int Main(string[] args) {
    // Preserve existing shortcuts and startup entries after the English product rename.
    try {
      string root = AppDomain.CurrentDomain.BaseDirectory;
      var start = new ProcessStartInfo(Path.Combine(root, "Steam Hours.exe"), Array.IndexOf(args, "--hidden") >= 0 ? "--hidden" : "") { UseShellExecute = false, WorkingDirectory = root };
      start.EnvironmentVariables.Remove("ELECTRON_RUN_AS_NODE");
      using (Process launched = Process.Start(start)) { }
      return 0;
    } catch { return 1; }
  }
}

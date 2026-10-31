using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;
using System.Security.Principal;

// WinExe: no console, no elevation, no credentials or remote downloads.
internal static class Bootstrap {
  [STAThread] private static int Main(string[] args) {
    string temp = null;
    try {
      using (var mutex = new Mutex(false, "Local\\SteamSaatBootstrap-" + WindowsIdentity.GetCurrent().User.Value)) {
        bool entered;
        try { entered = mutex.WaitOne(0); } catch (AbandonedMutexException) { entered = true; }
        if (!entered) return 0;
        try {
          string root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "SteamSaat");
          string exe = Path.Combine(root, "Steam Saat.exe");
          if (!File.Exists(exe)) {
            temp = Path.Combine(Path.GetTempPath(), "SteamSaat-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(temp);
            string setup = Path.Combine(temp, "setup.exe");
            using (Stream source = Assembly.GetExecutingAssembly().GetManifestResourceStream("setup"))
            using (var output = new FileStream(setup, FileMode.CreateNew, FileAccess.Write, FileShare.None)) {
              if (source == null) throw new InvalidDataException();
              source.CopyTo(output);
            }
            // NSIS /D must be the final parameter, without surrounding quotes.
            // Silent setup does not start the application; this launcher does.
            var install = new ProcessStartInfo(setup, "/S /D=" + root) { UseShellExecute = false, CreateNoWindow = true, WorkingDirectory = temp };
            install.EnvironmentVariables.Remove("ELECTRON_RUN_AS_NODE");
            using (var process = Process.Start(install)) { process.WaitForExit(); if (process.ExitCode != 0) throw new IOException(); }
          }
          if (!File.Exists(exe)) throw new FileNotFoundException();
          var start = new ProcessStartInfo(exe) { UseShellExecute = false, WorkingDirectory = root };
          start.EnvironmentVariables.Remove("ELECTRON_RUN_AS_NODE");
          using (Process launched = Process.Start(start)) { }
          return 0;
        } finally { mutex.ReleaseMutex(); }
      }
    } catch {
      MessageBox.Show("Steam Saat açılamadı. Disk alanını ve Windows koruma bildirimlerini kontrol edip yeniden dene.", "Steam Saat", MessageBoxButtons.OK, MessageBoxIcon.Error);
      return 1;
    } finally {
      // Only this invocation's randomly named temporary directory is removed.
      if (temp != null) { try {
        string expectedParent = Path.GetFullPath(Path.GetTempPath()).TrimEnd(Path.DirectorySeparatorChar);
        string actual = Path.GetFullPath(temp);
        if (String.Equals(Path.GetDirectoryName(actual), expectedParent, StringComparison.OrdinalIgnoreCase)
            && Path.GetFileName(actual).StartsWith("SteamSaat-", StringComparison.Ordinal)
            && (File.GetAttributes(actual) & FileAttributes.ReparsePoint) == 0) Directory.Delete(actual, true);
      } catch { } }
    }
  }
}

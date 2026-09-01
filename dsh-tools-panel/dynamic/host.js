// dsh-tools-panel —— Host 半区(零构建动态插件)。纯 JavaScript,禁止 import/TS/JSX。
return {
  apply(ctx) {
    const subs = ctx.get('subprocess')
    const policy = ctx.get('sandboxPolicy')
    const root = (policy && policy.workspaceRoot) || 'C:/'

    const psResolve = async function () {
      try { return await subs.resolveExecutable('powershell') } catch (e) { return 'C:/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe' }
    }

    const pick = async function () {
      if (subs === undefined) return { ok: false, error: '子进程服务不可用' }
      const script = `Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $d = New-Object System.Windows.Forms.OpenFileDialog; $d.Title='选择要添加的程序'; $d.Filter='程序 (*.exe;*.bat;*.cmd;*.ps1;*.lnk)|*.exe;*.bat;*.cmd;*.ps1;*.lnk|所有文件 (*.*)|*.*'; $o = New-Object System.Windows.Forms.Form; $o.TopMost=$true; $o.ShowInTaskbar=$false; $o.FormBorderStyle='None'; $o.Opacity=0; $o.StartPosition='CenterScreen'; $o.Size=New-Object System.Drawing.Size(1,1); $o.Show(); $o.Activate(); try { if ($d.ShowDialog($o) -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $d.FileName } } finally { $o.Close(); $o.Dispose() }`
      try {
        const psh = await psResolve()
        const h = subs.spawn({ argv: [psh, '-NoProfile', '-STA', '-Command', script], cwd: root, stdio: { stdin: 'ignore', stdout: { maxBytes: 8192 }, stderr: 'inherit' }, graceMs: 8000 })
        await h.done
        const p = (((h.collected.stdout) && h.collected.stdout.readFrom(0).text) || '').trim()
        if (!p) return null
        return { path: p, name: '' }
      } catch (err) {
        return { ok: false, error: String((err && err.message) || err) }
      }
    }

    const run = async function (args) {
      if (subs === undefined) return { ok: false, error: '子进程服务不可用' }
      const p = (args && args.path) || ''
      if (!p) return { ok: false, error: '缺少程序路径' }
      const cmd = `$p = Start-Process -FilePath $env:DSH_TOOLS_APP -PassThru; try { Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class W { [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h); [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int n); [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr a, int x, int y, int cx, int cy, uint f); }'; $dl=(Get-Date).AddSeconds(6); while ((Get-Date) -lt $dl) { Start-Sleep -Milliseconds 200; $p.Refresh(); if ($p.HasExited) { break }; if ($p.MainWindowHandle -ne 0) { break } }; if (-not $p.HasExited) { $h=[IntPtr]$p.MainWindowHandle; if ($h -ne [IntPtr]::Zero) { [W]::ShowWindow($h, 9) | Out-Null; [W]::SetWindowPos($h, [IntPtr](-1), 0,0,0,0, 0x0001 -bor 0x0002) | Out-Null; [W]::SetWindowPos($h, [IntPtr](-2), 0,0,0,0, 0x0001 -bor 0x0002) | Out-Null; [W]::SetForegroundWindow($h) | Out-Null } } } catch {}`
      try {
        const psh = await psResolve()
        const h = subs.spawn({ argv: [psh, '-NoProfile', '-Command', cmd], cwd: root, stdio: { stdin: 'ignore', stdout: { maxBytes: 4096 }, stderr: { maxBytes: 4096 } }, env: { DSH_TOOLS_APP: p }, graceMs: 8000 })
        const out = await h.done
        if (out.exitCode === 0) return { ok: true }
        const errText = (((h.collected.stderr) && h.collected.stderr.readFrom(0).text) || '').trim()
        return { ok: false, error: (errText || '启动失败（退出码 ' + out.exitCode + '）') }
      } catch (err) {
        return { ok: false, error: String((err && err.message) || err) }
      }
    }

    const icon = async function (args) {
      if (subs === undefined) return { dataUrl: null }
      const p = (args && args.path) || ''
      if (!p) return { dataUrl: null, error: '缺少程序路径' }
      const script = `Add-Type -AssemblyName System.Drawing; $p=$env:DSH_TOOLS_APP; $tp=$p; try { $sh=New-Object -ComObject WScript.Shell; $sc=$sh.CreateShortcut($p); if ($sc.TargetPath) { $tp=$sc.TargetPath } } catch {}; $icon=$null; try { $icon=[System.Drawing.Icon]::ExtractAssociatedIcon($tp) } catch {}; if ($icon) { $bmp=$icon.ToBitmap(); $ms=New-Object System.IO.MemoryStream; $bmp.Save($ms,[System.Drawing.Imaging.ImageFormat]::Png); $b=[Convert]::ToBase64String($ms.ToArray()); $b }`
      try {
        const psh = await psResolve()
        const h = subs.spawn({ argv: [psh, '-NoProfile', '-STA', '-Command', script], cwd: root, stdio: { stdin: 'ignore', stdout: { maxBytes: 65536 }, stderr: { maxBytes: 4096 } }, env: { DSH_TOOLS_APP: p }, graceMs: 8000 })
        const out = await h.done
        if (out.exitCode !== 0) return { dataUrl: null }
        const b64 = (((h.collected.stdout) && h.collected.stdout.readFrom(0).text) || '').trim()
        if (!b64) return { dataUrl: null }
        return { dataUrl: 'data:image/png;base64,' + b64 }
      } catch (err) {
        return { dataUrl: null, error: String((err && err.message) || err) }
      }
    }

    ctx.effect(() => harness.handle('tools.pick', pick))
    ctx.effect(() => harness.handle('tools.run', run))
    ctx.effect(() => harness.handle('tools.icon', icon))
  },
}

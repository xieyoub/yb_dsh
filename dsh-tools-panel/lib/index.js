// dsh-tools-panel —— Host 半区(原生单包)。
// 通过 webServer 注册 /dsh-tools/api/* JSON 路由,供浏览器端 Client 调用。
// 不再依赖动态插件沙箱的 `harness` 全局;与 profile 树加载方式兼容。
import { spawn } from 'node:child_process'

const PS_FALLBACK = 'C:/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe'
const MAX_BODY = 1_000_000

function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    let killed = false
    req.setEncoding('utf8')
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > MAX_BODY && !killed) {
        killed = true
        req.destroy()
      }
    })
    req.on('end', () => {
      if (killed) return resolve({})
      try {
        const parsed = JSON.parse(raw)
        resolve(parsed !== null && typeof parsed === 'object' ? parsed : {})
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}

function writeJson(res, value, status = 200) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-cache',
  })
  res.end(JSON.stringify(value))
}

function runPowershell({ script, sta = false, maxBytes = 65536, cwd, env = {} }) {
  return new Promise((resolve) => {
    const attempt = (bin) => new Promise((resolveAttempt) => {
      const args = ['-NoProfile']
      if (sta) args.push('-STA')
      args.push('-Command', script)
      const child = spawn(bin, args, {
        cwd,
        env: { ...process.env, ...env },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      })
      let stdout = ''
      let stderr = ''
      child.stdout.on('data', (d) => {
        stdout += d.toString('utf8')
        if (stdout.length > maxBytes) child.kill()
      })
      child.stderr.on('data', (d) => {
        stderr += d.toString('utf8')
      })
      child.on('error', (err) => resolveAttempt({ error: err }))
      child.on('close', (code) => resolveAttempt({ code: code ?? -1, stdout, stderr }))
    })
    attempt('powershell.exe')
      .then((result) => {
        if (result.error && result.error.code === 'ENOENT') return attempt(PS_FALLBACK)
        resolve(result)
      })
      .catch((err) => resolve({ error: err }))
  })
}

const PICK_SCRIPT = `[Console]::OutputEncoding=[Text.Encoding]::UTF8; Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $d = New-Object System.Windows.Forms.OpenFileDialog; $d.Title='选择要添加的程序'; $d.Filter='程序 (*.exe;*.bat;*.cmd;*.ps1;*.lnk)|*.exe;*.bat;*.cmd;*.ps1;*.lnk|所有文件 (*.*)|*.*'; $o = New-Object System.Windows.Forms.Form; $o.TopMost=$true; $o.ShowInTaskbar=$false; $o.FormBorderStyle='None'; $o.Opacity=0; $o.StartPosition='CenterScreen'; $o.Size=New-Object System.Drawing.Size(1,1); $o.Show(); $o.Activate(); try { if ($d.ShowDialog($o) -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $d.FileName } } finally { $o.Close(); $o.Dispose() }`

const RUN_SCRIPT = `[Console]::OutputEncoding=[Text.Encoding]::UTF8; $p = Start-Process -FilePath $env:DSH_TOOLS_APP -PassThru; try { Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class W { [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h); [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int n); [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr a, int x, int y, int cx, int cy, uint f); }'; $dl=(Get-Date).AddSeconds(6); while ((Get-Date) -lt $dl) { Start-Sleep -Milliseconds 200; $p.Refresh(); if ($p.HasExited) { break }; if ($p.MainWindowHandle -ne 0) { break } }; if (-not $p.HasExited) { $h=[IntPtr]$p.MainWindowHandle; if ($h -ne [IntPtr]::Zero) { [W]::ShowWindow($h, 9) | Out-Null; [W]::SetWindowPos($h, [IntPtr](-1), 0,0,0,0, 0x0001 -bor 0x0002) | Out-Null; [W]::SetWindowPos($h, [IntPtr](-2), 0,0,0,0, 0x0001 -bor 0x0002) | Out-Null; [W]::SetForegroundWindow($h) | Out-Null } } } catch {}`

const ICON_SCRIPT = `[Console]::OutputEncoding=[Text.Encoding]::UTF8; Add-Type -AssemblyName System.Drawing; $p=$env:DSH_TOOLS_APP; $tp=$p; try { $sh=New-Object -ComObject WScript.Shell; $sc=$sh.CreateShortcut($p); if ($sc.TargetPath) { $tp=$sc.TargetPath } } catch {}; $icon=$null; try { $icon=[System.Drawing.Icon]::ExtractAssociatedIcon($tp) } catch {}; if ($icon) { $bmp=$icon.ToBitmap(); $ms=New-Object System.IO.MemoryStream; $bmp.Save($ms,[System.Drawing.Imaging.ImageFormat]::Png); $b=[Convert]::ToBase64String($ms.ToArray()); $b }`

export default {
  inject: ['webServer'],
  apply(ctx) {
    const policy = ctx.get('sandboxPolicy')
    const root = (policy && policy.workspaceRoot) || 'C:/'

    const routes = [
      {
        kind: 'exact',
        path: '/dsh-tools/api/pick',
        handler: async (req, res) => {
          await readJsonBody(req)
          const out = await runPowershell({ script: PICK_SCRIPT, sta: true, maxBytes: 8192, cwd: root })
          if (out.error) return writeJson(res, { ok: false, error: String(out.error.message || out.error) })
          const text = out.stdout.trim()
          if (!text) return writeJson(res, null)
          return writeJson(res, { path: text, name: '' })
        },
      },
      {
        kind: 'exact',
        path: '/dsh-tools/api/run',
        handler: async (req, res) => {
          const body = await readJsonBody(req)
          const p = String(body.path || '')
          if (!p) return writeJson(res, { ok: false, error: '缺少程序路径' })
          const out = await runPowershell({ script: RUN_SCRIPT, sta: false, maxBytes: 4096, cwd: root, env: { DSH_TOOLS_APP: p } })
          if (out.error) return writeJson(res, { ok: false, error: String(out.error.message || out.error) })
          if (out.code === 0) return writeJson(res, { ok: true })
          const errText = out.stderr.trim()
          return writeJson(res, { ok: false, error: errText || '启动失败(退出码 ' + out.code + ')' })
        },
      },
      {
        kind: 'exact',
        path: '/dsh-tools/api/icon',
        handler: async (req, res) => {
          const body = await readJsonBody(req)
          const p = String(body.path || '')
          if (!p) return writeJson(res, { dataUrl: null, error: '缺少程序路径' })
          const out = await runPowershell({ script: ICON_SCRIPT, sta: true, maxBytes: 65536, cwd: root, env: { DSH_TOOLS_APP: p } })
          if (out.error || out.code !== 0) return writeJson(res, { dataUrl: null })
          const b64 = out.stdout.trim()
          if (!b64) return writeJson(res, { dataUrl: null })
          return writeJson(res, { dataUrl: 'data:image/png;base64,' + b64 })
        },
      },
    ]

    ctx.effect(() => {
      const disposers = routes.map((route) => ctx.webServer.register(route))
      return () => {
        for (const dispose of disposers) {
          try { dispose() } catch {}
        }
      }
    })
  },
}

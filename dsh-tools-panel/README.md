# 本地工具面板 (dsh-tools-panel)

DeepSeek Harness Web 插件：在会话头部提供一个「工具」按钮，打开本地程序面板——增删改本地程序、自动提取程序图标、点击一键启动。

## 功能

- 会话头部「工具」胶囊按钮，点击弹出面板
- 通过系统文件选择器添加本地程序（`.exe` / `.bat` / `.cmd` / `.ps1` / `.lnk` / `.msi`）
- 图标网格展示，自动提取程序图标（支持快捷方式目标）
- 点击图标一键启动，并自动将窗口置前
- 支持重命名 / 删除，条目保存在浏览器 `localStorage`

## 安装

前置条件：已安装 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（dsh CLI），并已初始化 `web` profile。

### 方式一：从本仓库安装（推荐）

```bash
git clone https://github.com/xieyoub/yb_dsh.git
cd yb_dsh
dsh plugin --profile web add -w ./dsh-tools-panel
```

安装完成后重启 `dsh web`（或硬刷新浏览器页面），会话头部即可看到「工具」按钮。

> 如果 profile 的 `node_modules` 尚未初始化，先执行 `pnpm install`。

### 方式二：本地路径安装

已有源码目录时，直接用绝对路径安装：

```bash
dsh plugin --profile web add -w "C:\path\to\yb_dsh\dsh-tools-panel"
```

### 方式三：创造者模式 / 动态插件（零构建，备用）

动态插件在 dsh 进程内定义并运行，不写入 profile 配置，进程重启后失效：

1. 在 Web UI 中让 Agent 执行 `cordis_define`（或使用动态插件面板的「新建插件」入口）
2. 将 [`dynamic/host.js`](./dynamic/host.js) 全文粘贴到 **Host 代码**
3. 将 [`dynamic/client.js`](./dynamic/client.js) 全文粘贴到 **Client 代码**
4. `cordis_run` 激活；首次出现 Run 卡时点「允许」

## 使用

1. 启动 `dsh web`，选择工作区
2. 点击会话头部「工具」按钮
3. 点「添加」从文件选择器选择一个本地程序
4. 点击程序图标即可一键启动

## 目录结构

```
dsh-tools-panel/
├── lib/
│   ├── index.js      # Host 半区（原生单包，webServer JSON 路由 /dsh-tools/api/*）
│   └── client.js     # Client 半区（浏览器 bundle，__ModuleLoader__ 格式）
├── dynamic/
│   ├── host.js       # 零构建动态版 Host（创造者模式使用）
│   └── client.js     # 零构建动态版 Client（创造者模式使用）
├── manifest.json     # 插件清单
├── cordis.patch.yml  # 组合补丁（安装时把插件行插入 profile 组合）
└── package.json      # 包定义
```

源码即以上 JavaScript 文件（无构建步骤）；`lib/` 为树加载用的原生单包版本，`dynamic/` 为创造者模式用的零构建版本，二者功能一致、传输方式不同。

## 卸载

从 profile 的 `package.json` 中移除 `dsh-tools-panel`：

```bash
cd ~/.dsh/profiles/web
pnpm remove dsh-tools-panel
```

然后编辑 `package.json`，把 `dependencies` 中的 `dsh-tools-panel` 和 `dsh.profile.bundles` 数组里的 `"dsh-tools-panel"` 一并删除，最后 `pnpm install`。

## 许可证

[Apache-2.0](../../LICENSE)

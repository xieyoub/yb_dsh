# yb_dsh
dsh 插件

DeepSeek Harness（dsh）插件仓库。每个插件一个独立文件夹，可直接安装到 `web` profile。

## 插件列表

| 插件 | 说明 | 文档 |
| --- | --- | --- |
| [dsh-tools-panel](./dsh-tools-panel/) | 本地工具面板：右上角工具按钮，增删改本地程序并一键启动 | [安装与使用](./dsh-tools-panel/README.md) |

## 通用安装

```bash
git clone https://github.com/xieyoub/yb_dsh.git
cd yb_dsh
dsh plugin --profile web add -w ./dsh-tools-panel
```

安装完成后重启 `dsh web`（或硬刷新浏览器页面）。每个插件各自的 README 有详细说明；如果 profile 的 `node_modules` 尚未初始化，先执行 `pnpm install`。

## 目录结构

```
yb_dsh/
├── dsh-tools-panel/   # 本地工具面板（含源码与安装说明）
└── ...                # 后续插件各自独立文件夹
```

## 许可证

[Apache-2.0](./LICENSE)

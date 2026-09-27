# FleshOut — AI 小说阅读、改写与创作工作台（Windows 打包版）

> 本项目 Fork 自 [orcorcss/FleshOut](https://github.com/orcorcss/FleshOut)，原项目是一款本地优先的开源 AI 写作工具，把长篇小说阅读、剧情大纲设计、AI 改写、写法卡片与版本管理放进同一个工作台。

本 Fork 在原项目基础上增加了 **Electron 桌面化封装** 与 **GitHub Actions 自动打包**，可一键生成 Windows 安装版与便携版 `.exe`，双击即用，无需手动配置 Node.js 环境。

## 项目来源

- **原始项目**：[https://github.com/orcorcss/FleshOut](https://github.com/orcorcss/FleshOut)
- **原项目作者**：orcorcss
- **原项目许可**：MIT License
- **本 Fork 仓库**：[https://github.com/cskungfu/FleshOut](https://github.com/cskungfu/FleshOut)

本 Fork 保留了原始项目的全部功能与 MIT 许可声明，仅新增桌面打包能力与构建流程，不改变原项目的核心业务逻辑。

## 本 Fork 新增内容

### 1. Electron 桌面封装

新增 `electron-main.cjs`，将原本需要命令行启动的 Node.js 网页应用封装为原生 Windows 桌面程序：

- 启动时自动加载 `server.js`，无需用户手动执行 `npm start`
- 数据自动保存到 `%APPDATA%/FleshOut/app/data`，解决 Program Files 写入权限问题
- 关闭窗口时自动终止后台服务，不留残余进程

### 2. GitHub Actions 自动打包

新增 `.github/workflows/build.yml`，在 GitHub 服务器上自动完成：

- 安装 Node.js 20 与项目依赖
- 运行 `electron-builder` 生成 Windows 安装包
- 将生成的 `.exe` 上传为可下载的 Artifact

### 3. 构建产物

每次构建会生成两种 Windows 程序：

| 产物 | 说明 |
|---|---|
| `FleshOut Setup x.x.x.exe` | NSIS 安装版，带安装向导，创建桌面快捷方式 |
| `FleshOut x.x.x.exe` | 便携版，双击直接运行，不写注册表 |

## 功能特性（继承自原项目）

- **沉浸式阅读**：支持 TXT / Markdown / HTML 三种渲染模式，字体、字号、行距、文字与背景颜色均可调；约 10 万字自动分段渲染，长文不卡顿。
- **AI 改写**：基于 DeepSeek，可选中段落或整节改写；支持多条系统级提示词、温度、最大输出、思考模式与强度（low / high / max）配置。
- **大纲设计**：针对选段生成剧情大纲思路——情节目标、冲突递进、人物动机、伏笔埋设/回收、情绪节奏、场景调度，并可直接带入改写指令。
- **写法卡片**：让 AI 分析选中文本的风格特点并生成卡片，创作时随时参考，沉淀自己的写作风格库。
- **附属信息**：维护故事背景、角色设定、情节发展；可手工编辑，也可让 AI 从当前版本全文提取（大文本自动分块、并发合并），改写时自动携带，保持世界观、人物与情节一致。
- **版本管理**：每次改写自动保存为独立版本，支持版本对比，随时回看每一次改动。
- **多用户**：本地账号系统，密码仅存哈希，各用户数据完全隔离。
- **本地优先**：所有书籍、配置与日志均存为本地 JSON 文件，不依赖外部数据库。

## 快速开始

### 方式一：直接下载 exe（推荐）

1. 进入本仓库的 **Actions** 标签页
2. 选择 **Build Windows EXE** 工作流
3. 点击 **Run workflow** 手动触发构建
4. 构建完成后，在运行记录底部的 **Artifacts** 区域下载 `FleshOut-Windows.zip`
5. 解压后双击 `.exe` 即可运行

### 方式二：从源码运行（开发用）

需要 **Node.js 18+**。

```bash
npm install
npm start

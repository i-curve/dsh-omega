# dsh-omega

[![ci](https://github.com/i-curve/dsh-omega/actions/workflows/ci.yml/badge.svg)](https://github.com/i-curve/dsh-omega/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/dsh-omega.svg)](https://www.npmjs.com/package/dsh-omega)
[![license](https://img.shields.io/npm/l/dsh-omega.svg)](LICENSE)

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的 Zero Omega
式代理分流：情景模式、域名规则、**按模型提供商**绑定代理或直连，并支持导入/导出
浏览器扩展的 `.bak` 备份。

> 只有你指定的流量走代理。默认模型可以保持直连，同时让 GitHub Copilot 走
> `127.0.0.1:1080` —— 不需要设置一个把所有请求都拖下水的全局 `HTTPS_PROXY`。

[English](README.md)

## 为什么需要它

DSH 的代理是进程级的：启动时从 `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY`
解析一次。只有一个提供商需要代理、其他必须直连时，全局变量会改变每一个请求，
而 `NO_PROXY` 只能列“例外”，没法反过来只让一个域名走代理。

`dsh-omega` 把全局 dispatcher 换成一个**按请求**判断的路由器，沿用 Zero Omega /
SwitchyOmega 的情景模式与规则词汇，并额外加了一层 DSH 绑定：可以把
`github-copilot` 固定到代理，同时让 `deepseek-account` 保持直连。

## 功能

- **Zero Omega 式情景模式**：直接连接、代理服务器、自动切换、规则列表；支持新建、
  改名、编辑规则、选择当前情景模式。
- **自动切换**：默认情景模式 + 有序的域名 / URL / 正则 / IP 规则，命中第一条即停止。
- **按提供商绑定**：每个检测到的 DSH 模型提供商都有情景模式选择器；绑定优先于当前
  情景模式，并会显示该提供商实际使用的域名。网关使用自定义域名时可以直接改。
- **Zero Omega 格式导入 / 导出**：浏览器扩展导出的 `.bak` 可以直接导入（扁平
  `+profile` / `-setting` 文档，包含 AutoProxy 与 SwitchyOmega 规则列表）；导出也是
  同样的形状，可以带回浏览器。
- **规则列表订阅**：给规则列表情景模式填一个 URL（AutoProxy/GFWList 或
  SwitchyOmega 文本），随时更新，也可以让宿主按间隔自动刷新；列表可以下载或
  复制出来，自己托管分享。
- **规则测试**：对当前草稿解析任意 URL，逐步显示判定过程。
- **即时生效**：保存后直接替换路由表，不需要重启 DSH。
- **中英双语界面**。

## 安装

### 从插件市场（推荐）

1. 打开 DSH 的 **插件** 页，选择 **添加插件**。
2. 用包名 `dsh-omega` 安装（首次发布到 npm 之后），或填本仓库的 Git 地址，
   或选择一个本地目录。
3. 打开 **设置 → 代理**。

配置保存在 `$DSH_HOME/dsh-omega/config.json`（通常是
`~/.dsh/dsh-omega/config.json`），页面通过 DSH 本地 Web 服务与宿主通信。不需要
API key，也不依赖外部服务。

### 从源码

```sh
git clone https://github.com/i-curve/dsh-omega.git
cd dsh-omega
npm test
```

然后在 **插件 → 添加插件** 里安装这个目录，或使用 DSH 的插件管理工具。

## 快速开始

首次安装会生成：

| 情景模式 | 类型 | 含义 |
|---|---|---|
| `proxy` | 代理服务器 | `http://127.0.0.1:1080` |
| `auto switch` | 自动切换 | 默认 `direct`；`*.githubcopilot.com`、`github.com`、`api.github.com` → `proxy` |

在 **代理 → proxy** 里改端口，然后用 **代理 → 规则测试** 检查
`https://api.individual.githubcopilot.com/v1/models`。如果想让某个提供商不受
自动切换规则影响，在 **代理 → 模型提供商** 里把 `github-copilot` 设为 `proxy`，
默认模型保持“跟随当前情景模式”（或固定为 `direct`）。

### 规则列表订阅

点 **+ 新建规则列表** 创建一个情景模式，填入 AutoProxy 或 SwitchyOmega 列表的
URL，点 **立即更新**。下载请求和普通请求走同一张路由表，所以 GitHub 上的列表可以走
代理，本机镜像保持直连。**自动更新间隔**（分钟，`0` 关闭）会让宿主在后台刷新
过期列表。

规则列表也可以**下载或复制**成文本；自动切换情景模式还有**导出为规则列表**，
可以把它的规则转成 SwitchyOmega 列表。放到任意可访问的 URL 后就能作为订阅地址
分享。

## 路由判定顺序

1. **本机地址**（`localhost`、`127.0.0.0/8`、`::1`）始终直连。
2. **提供商绑定**：请求域名命中某个已绑定提供商时，用该绑定决定；域名匹配越具体
   优先级越高。
3. **当前情景模式**：自动切换按规则从上到下匹配，命中不了就用默认；代理服务器按
   自身配置（先看 bypassList）；直接连接保持直连。
4. 不支持的情景模式（PAC、SOCKS 代理）会给出提示并按直连处理，不会偷偷借用别的
   路由。

## 与 Zero Omega 的兼容性

配置文档就是浏览器扩展的扁平 options 对象：

```json
{
  "schemaVersion": 2,
  "-startupProfileName": "auto switch",
  "+proxy": { "name": "proxy", "profileType": "FixedProfile", "fallbackProxy": { "scheme": "http", "host": "127.0.0.1", "port": 1080 }, "bypassList": [] },
  "+auto switch": { "name": "auto switch", "profileType": "SwitchProfile", "defaultProfileName": "direct", "rules": [] },
  "-dshOmega": { "version": 1, "currentProfileName": "auto switch", "providerBindings": {}, "providerHosts": {} }
}
```

`-dshOmega` 是唯一的 DSH 扩展键。浏览器扩展会忽略不认识的设置键；想要逐字节的
浏览器备份，把它删掉即可。

支持：`DirectProfile`、`SystemProfile`（在 DSH 中按直连）、`FixedProfile`
（HTTP/HTTPS）、`SwitchProfile`、`VirtualProfile`、`RuleListProfile`
（`AutoProxy` 与 `Switchy` 文本，支持 `sourceUrl` 订阅与 `lastUpdate`）、
域名/URL 通配与正则、关键词、IP/CIDR、bypass 列表。

不支持：SOCKS 代理（`socks4://`、`socks5://`）、PAC 脚本，以及浏览器专属设置。完整矩阵见 [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md)。

## 配置与安全

- 状态文件：`$DSH_HOME/dsh-omega/config.json`，权限 `0600`。
- 如果你填了代理用户名/密码，它们以明文存在这个文件里。优先使用无需认证的本机
  代理端口。
- 页面通过 `/dsh-omega/api` 下的同源 JSON 接口与宿主通信；写操作拒绝跨源请求和
  非 JSON 内容类型，且所有调用仅接受本机（loopback）连接。远程访问部署需要在宿主
  本机或通过隧道配置，不能从另一台机器直接改。
- 卸载插件会恢复到安装前的 dispatcher；配置文件会保留，直到你手动删除。

## 开发

```sh
npm test          # 单元测试（条件匹配、路由、Zero Omega 导入导出）
npm run check     # 宿主与浏览器入口的语法检查
```

传输测试需要 DSH Desktop 运行时，因为它要加载与 Harness 相同的 `undici`：

```sh
NODE_TLS_REJECT_UNAUTHORIZED=0 ELECTRON_RUN_AS_NODE=1 \
  "/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness" \
  test/router.e2e.mjs
```

浏览器半侧是一个 lazy-CJS 工厂（`client.js`），不需要构建步骤。

## 许可证

MIT © allcloud

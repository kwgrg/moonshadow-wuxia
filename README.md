# 月影传说 · 江湖长卷

可部署到 **Cloudflare Workers Static Assets** 的网页同人游戏。玩家打开网址即可进入游戏，无需登录 ChatGPT、Cloudflare 或游戏账号。剧情、战斗和存档在浏览器运行；没有后端 API、数据库或运行时密钥。

## 本地游玩

推荐 Node.js 24（最低 22），在项目目录执行：

```sh
npm ci
npm run dev
```

打开 http://127.0.0.1:8787 。本地预览无需 Cloudflare 账号。鼠标点击行走，WASD / 方向键移动，J 攻击，E 交谈，空格轻功；游戏内“操作说明”提供完整按键。

## 部署到 Cloudflare

首次部署者需授权自己的 Cloudflare 账号，这一步只针对发布者：

```sh
npx wrangler login
npm run deploy:check
npm run deploy
```

部署成功后，打开命令输出的 `https://moonshadow-wuxia.<你的子域>.workers.dev` 地址即可游玩。`wrangler.jsonc` 已启用 `workers_dev`，仅发布 `public/` 中的游戏资源，不设置访问登录页。项目名称可在该配置的 `name` 字段修改。

如需绑定自己的域名，可在这个 Worker 的 **Settings → Domains & Routes** 添加 Custom Domain。为保持玩家免登录，该游戏域名不要配置 Cloudflare Access 登录策略。

本仓库已准备好部署；初始化和本地预检不会自动创建云端站点，也不会修改原 Sites 地址。

## 存档迁移

自动存档、三个手动存档槽和设置保存在当前浏览器的 `localStorage`。首次进入会自动建立本地角色，不请求账号。

从原 Sites 地址换到 Cloudflare 地址时，浏览器不会自动共享旧站的存档。在旧站的“存入江湖”面板选择“导出存档”，然后在新站同一面板“导入存档”。换浏览器或设备时也使用此方式。清除浏览器站点数据会清除该站本地存档。

## 检查

```sh
npm test
npm run deploy:check
```

`npm test` 检查现有六条长线结局在两种难度下的推进、开局特殊结局、战斗、寻路、支线、存档恢复及界面逻辑。界面检查使用模拟 DOM，不等同于真实浏览器视觉验收。

保持 `npm run dev` 运行，在另一个终端检查匿名 HTTP 访问和资源加载：

```sh
npm run test:http
```

部署后，可将命令中的地址换成实际网址进行同样的检查：

```sh
npm run test:http -- https://moonshadow-wuxia.<你的子域>.workers.dev
```

检查覆盖首页、全部脚本/图片的状态码与 MIME、匿名请求是否被要求认证，以及仓库配置文件是否被意外公开。

## 目录和维护

```text
public/                 直接部署的游戏源码与本地图片
  index.html            游戏入口
  journey.js            界面、控制、音效与本地存档
  runtime.mjs           游戏引擎
  campaign.mjs          剧情与任务数据
  renderer-v3.mjs       场景绘制
  style.css             样式
  assets/               六张图片
tests/                  剧情、界面和匿名访问检查
wrangler.jsonc          Cloudflare 部署配置
package-lock.json       部署工具版本锁定
```

这里没有前端编译步骤，编辑 `public/` 后直接预览或部署。保留 Cloudflare 默认的浏览器缓存重新验证行为；文件名未带内容哈希，不配置长期 `immutable` 缓存。未知路径返回 404，避免将缺失的模块错误返回为首页。

Wrangler 固定为 4.130.0。其本地运行工具 Miniflare 的 `sharp` 依赖通过 `overrides` 升级至补丁版本 0.35.4，修复 [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c)。以后升级 Wrangler 时，可以在上游依赖已修复后移除这项覆盖。

## 来源与内容范围

游戏源码由现有 Sites 项目的静态目录迁入，来源提交为 `326865190000af09e3e9e2334914145079df47bc`。本仓库使用独立本地 Git 历史，不保留 Sites 部署绑定。

目前包含 135 个剧情事件、75 个地点名称、18 门武学和 7 个结局；场景使用五张环境图及一张人物图集。它是网页同人重制，并非原作全素材、逐句剧情及全部地图的一比一复刻。此次迁移保留现有游戏内容。

部署方式参考 Cloudflare 官方的 [静态站点指南](https://developers.cloudflare.com/workers/static-assets/get-started/)、[静态资源配置](https://developers.cloudflare.com/workers/static-assets/) 和 [响应头及缓存说明](https://developers.cloudflare.com/workers/static-assets/headers/)。

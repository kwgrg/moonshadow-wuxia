# 原版参考边界独立审计

日期：2026-09-22。检查对象为本轮邪线岛村、大陆码头和月眉儿新图接入后的工作区；检查时发布目录共57个文件。此文记录独立核到的证据及缺口，不把“未发现直接复制”等同于全部来源完整、原作全流程达标或权利授权结论。

## 范围与方法

遵守 [AGENTS.md](../AGENTS.md)：`D:\Game\Monthly Shadow Legend` 仅供只读参考。本轮审计没有访问该目录，没有解包、运行原游戏、建立导入器或输出原始对白。读取范围限当前仓库、工作与构建目录，以及根代理明确提供的当前任务生成图片目录。只读审计阶段除本文和一处旧文档措辞外，没有修改产品、资源、配置或测试；随后依授权新增来源清单与专项检查，见末节，产品资源仍未修改。

- 检查当前 Git 文件清单、未提交文件、`public`、`tools`、`vendor`，以及实际存在的 `.wrangler`、`work`、`output`、`.playwright-cli` 文件类型。
- 检索非依赖应用代码、工作脚本、浏览器文本与构建文本中的原目录、PAK、解码器和原脚本调用痕迹；复核命中是否仅为来源元数据。通用 `node_modules`、npm缓存和 `work/reference-codec` 不作游戏素材认定，也没有把通用解压依赖本身误记成原资源导入器。
- 阅读新增 `evil-docks-revisions.mjs`、`evil-docks-staging.mjs` 和对应参考、制作文档。检查对白、状态和来源字段，不重新读取原文做逐句比对。
- 对本轮三张PNG做头部、尺寸、长度、SHA-256和生成源文件完整字节比较；对全部26张发布PNG检查容器结束位置与附加文本/EXIF块。
- 只读枚举了当前可达Git历史中曾新增的文件名，未发现名称上指向原资源导入器、原游戏包或引擎副本的条目；没有穷举历史对象内容、不可达对象或旧版本二进制。因此不将此项描述为完整Git历史内容认证。

## 当前发布和代码检查

`wrangler.jsonc:7` 的唯一静态发布入口为 `./public`。此时57个发布文件为26张PNG、28个MJS、1个JS、1个HTML和1个CSS；没有原游戏PAK、SPR、INI、音频、动画包、可执行文件或解包目录。项目根下未见独立 `dist` / `build` 发布树；本轮没有重新部署线上站点，结论仅覆盖该工作区配置和文件。

`tools` 与 `vendor` 都为空。`.wrangler` 只见开发服务器的 no-op worker、middleware、source map 和本地状态数据库；`.js.map` 是JavaScript source map，不能因扩展名含map便认定为原游戏地图。`work` 排除通用依赖后含原创机制JSON、网页测试/修正脚本、日志及试玩截图；`output` 为155张JPG试玩记录，`.playwright-cli` 为日志和页面快照。相关文本检索未发现原包读取器或完整原脚本。截图在本次做的是文件清单与相关文本来源检查，并未逐张和原游戏对照；数据库也未做全表内容审计。

检索命中的 `public/cult-revisions.mjs`、`public/recruitment-revisions.mjs` 中 `script.pak` / `ini.pak` 字样属于事实定位字符串，不是读取包的调用。`work/original-story-analysis.json` 保留原创概述、包项标识和少量坐标定位元数据，未见脚本全文或原台词。现有路径、哈希和人物名的记录不能被误用为未来导入资源的许可。

新增两个docks模块采用本项目任务、演出和状态字段，没有嵌入原脚本、资源字节、原目录加载路径或完整原对白。对白是对现有机制概述的重新表达；拒杀支的挥剑、固定插叙、原创战力和站位已在 [实现记录](evil-docks-staging.md) 与原版已核事实分开。由于本轮没有再次读取完整原对白，结论是“本次代码审查未发现直接复制”，不是对每一句话完成全语料相似性认证。

## 本轮三张资源

制作方记录说明三张图均由内置image_gen根据原创文字生成，无参考图片输入。本审计独立核对了 [制作记录](evil-docks-art.md) 中提示词、指定生成原文件与实际发布PNG：三者均逐字节相同。哈希一致证明交付文件对应所列生成产物；不自动证明所有历史资源均有同样完整证据。

| 发布文件 | 尺寸 | 字节数 | SHA-256 |
| --- | --- | ---: | --- |
| `public/assets/island-village.png` | 1536×1024，RGB | 3769077 | `afba54159b95e726ee6e1f8a99a048e449b4dc497abc54e3741b02f254548e36` |
| `public/assets/mainland-dock.png` | 1536×1024，RGB | 3471096 | `5afc723b8d03c7557c38f07dc5530d08708857d50871a72db008594efadd764b` |
| `public/assets/mei-original.png` | 1024×1536，RGBA | 1863287 | `600078a555c6a6a345ea254338453f84e3e5bd7241fd32f2f0bd4e89603d89fb` |

生成文件共同目录为 `C:/Users/kwgrg/.codex/generated_images/01a088cc-a046-7932-9942-4d38be2d16a9/`，分别为 `exec-567f5b34-7526-4478-9795-905ffdc42da7.png`、`exec-bbf880cf-8031-4db1-bcd1-2df63b23c2f3.png`、`exec-94c6af47-39c6-4803-98c9-5c9ee8ce46e4.png`。本次全部发布PNG均在IEND处结束，未见文本/EXIF块或尾随内容；这仅排除该类可见容器附加内容，不是隐藏信息取证。

最初发现三张新图只有“独立制作”简述，缺完整提示词、源路径和哈希。现已由美术负责人补齐 `docs/evil-docks-art.md`，本审计完成独立字节核验，关闭该项记录缺口。

## 仍未确认的旧资源来源

以下六张旧图仍缺可复核的直接生成来源。仅在上述当前任务生成目录的9张PNG中按完整SHA-256查找，全部没有匹配；未扩大访问其他用户目录，也未访问原游戏来作反向判断。没有匹配不等于证明它们被复制，但也不能据现有间接说明写成“已核原创”。

| 文件 | 当前能找到的说明 | 发布文件SHA-256 | 状态 |
| --- | --- | --- | --- |
| `characters.png` | `hero-kneel-art.md:7` / `treatment-staging.md:9` 称此前独立生成，未见该原图完整生成记录 | `bf197c097a9b3886ef8228e03c73064078c2d9b89fe9af2887cb799664393042` | 来源未确认 |
| `forest.png` | `scene-audit.md:78` 称已有独立绘制；未见该图源路径及提示词 | `29e00c5f6a8aa2d7181f9dc63e61322f911f3634a4bd2ae058907f69931bbd62` | 来源未确认 |
| `town.png` | 未检得以此文件对应的制作来源记录 | `d8e77f77fbeccba61fbbdf5e7656c74838621fedc8e33899a9e978f615d7f4fa` | 来源未确认 |
| `lake.png` | 未检得以此文件对应的制作来源记录 | `7ffc6b2b2eaba5704aa7087644a1c62db1df7b569a774f4f72c85aeae1c1cac2` | 来源未确认 |
| `snow.png` | 未检得以此文件对应的制作来源记录 | `a2ab673db0972b529b51bf1b2f32e4cf383e23b4b0bc229d108c54bca2ffdc9f` | 来源未确认 |
| `wudang.png` | 全量清单复查新增发现；不在art-prompts.md的六张制作记录内，不能借用temple记录 | `e6830d1485deee47328bbd3eacad80f3280cf8d55d8d5c97f09c59c52be08b07` | 来源未确认 |

解决门槛是找到这六张的真实制作记录和源文件并核对字节；若无法追溯，后续应独立重新制作并替换。本次未替换任何资源，也没有用新的声明代替来源证据。

## 来源机制与文档纠正

审计开始时，来源机制依赖分散的美术制作文档及剧情的 `sources`、`source`、`dialogueStatus`、`referencePolicy` 字段。`tests/validate-quality.mjs:28` 仅验证场景图片存在，不能发现未登记资源被替换。后续按授权新增 [资源清单](asset-provenance.json) 与 `tests/validate-asset-provenance.mjs`：枚举全部发布PNG、核对逐文件SHA-256、约束真实路径在本仓库指定目录内，并检查来源文档和参考输入。无记录新增文件、漏项、哈希变化、非法路径或无制作文档却标documented会失败，不固定断言资源数量。20项负例使用内存清单，不修改真实发布文件。

本次将 `docs/art-prompts.md:10` 旧有“依原版截图重绘”描述改为：只依已核空间关系调整独立构图，不描摹、复制或导入原版截图、地图及贴图。它是一处未来工作方向的表述修正，不是声称发现了已复制图片。

清单现记录20项documented、6项unconfirmed；documented只指具体交付文件、方法与完整提示词已有制作记录，不是法律原创或授权结论。`hero-kneel.png` 自身有制作记录，但引用的 `characters.png` 为unconfirmed，专项输出单列该上游缺口。bedroom、npcs、props的旧制作文档未保留生成源文件路径，也在条目中注明。专项结果为清单检查PASS且sourceCoverage=INCOMPLETE。后续仍须补齐旧资源真实来源，不得用更新哈希或改状态代替证据。当前未发现直接复制原游戏内容的实际证据；六张旧图来源缺口、全部历史对象和截图未逐项取证等限制仍须保留，不应写成“全部资源来源已确认”或“无版权风险”。


## 2026-09-23 边界复核

用户再次明确仅参考、不直接复制。本轮没有访问原游戏目录，基于现有概述独立实现山庄夜行；新图为beimo-garden-day.png、beimo-hero-room.png、beimo-mei-room.png，均无输入图独立生成，完整记录见 [制作记录](manor-night-art.md)。未采用的首张暮色图已从本轮发布资源移除，生成源未删除。

当前发布清单29张PNG，其中23项documented、6项unconfirmed；原有上游依赖缺口不变。静态目录只含游戏静态资源；本轮代码/配置改动未发现读取、复制、解包或导入原目录的代码，也无发布目录软链接。此范围检查不代表已完成全部历史对象取证或法律认证。没有向云端部署。

## 2026-09-23 落叶谷救治增量

本轮四张新增图 leaf-courtyard.png、leaf-infirmary.png、leaf-rose-room.png、tianchi-islet.png 均由内置文生图独立制作，无输入图片；[完整制作记录](valley-care-art.md)保留提示词、源文件与交付哈希。原版目录仅由有界参考子任务对小筑两梦与首次楼战作内存只读机制核验，结果为独立概述与定位元数据，见 [局部参考记录](early-evil-interludes-reference.md)；没有把读取的脚本或对白写入产品、仓库或构建。该参考增量尚未实施，不能当作新演出已完成。

发布清单现33张PNG：27项documented、6项unconfirmed；六张早期图及hero-kneel的上游来源缺口未解决，不能宣称所有资源均已核原创或不存在版权风险。原版图片、地图、音频、动画、完整台词没有作为本轮产品或生成输入。本地Wrangler dry-run仅验证可部署性，本轮没有发布云端。

## 2026-09-23：独立替换后的当前发布状态（revision 11）

上文六张未确认来源的旧图已从 public/assets 移除，而不是更改它们的历史来源判定。另移除依赖旧角色图制作的 hero-kneel.png。新增独立文生图 characters-original、hero-kneel-original、forest-original、lake-original、town-original，均无图片参考输入；旧 snow/wudang 的实际逻辑别名改指已有独立资源。制作记录见 characters-original-art.md 与 landscape-original-art.md，含生成源、完整提示词、SHA与接入方法。

当前31张发布PNG均有对应制作记录，清单校验结果为 DOCUMENTED_RECORDS_ONLY；这一状态不等于法律结论或对历史来源的追认。97张地图的当前背景、备用背景与预加载键均解析到现存PNG。历史文档保留旧记录，未重写旧审计事实。本轮未访问原版目录，也未建立原资源导入步骤。


## 2026-09-23：返庄与传功增量（revision 12）

继续执行用户明确的“仅参考、不直接copy”。本轮参考子任务在内存中有界只读核对原事件顺序、人数、条件和失败行为；仓库仅存独立概述、包哈希及事件定位，见 hut-return-reference.md 与 valley-defense-reference.md。没有新增原图片、地图、音频、动画、完整台词、脚本副本或导入工具。所有新增对白、舞台步骤、地图分区、坐标、战斗属性、代码均独立编写。

本轮没有新增或替换发布PNG，仍为31项制作记录。受损谷院图只尝试以本项目原创leaf-courtyard.png作为生成输入，工具因本地沙箱读取故障失败；没有交付新图，也没有转用原游戏图片。该受损画面仍是未完成项。清单状态仍为DOCUMENTED_RECORDS_ONLY，不是法律认证，也不追认历史素材来源。


## 2026-09-24：浏览器修正与后续禁地核验

本轮产品修正仅为独立编写的战后交互标签/目标与坐姿衣摆曲线，没有新增或更改PNG。发布清单仍为31项documented制作记录。原参考子任务仅在内存核验限定禁地事件，后续独立摘要保留定位元数据；不写入脚本、原台词、地图/坐标或解包副本。实际本地浏览器与自动预检均不需要原版目录，也未部署到云端。

## 2026-09-24：善线禁地两战增量（revision 13）

本次范围审查只读取当前仓库中的新增 `good-forbidden-revisions.mjs`、`good-forbidden-staging.mjs`、`good-forbidden-migration.mjs` 及其 world/routes/runtime/skirmish/renderer/同行/UI 接入改动和依赖差异；**没有再次访问原游戏目录作比对**。前序有界机制核验的独立概述和定位保留在 [good-forbidden-reference.md](good-forbidden-reference.md)，原始脚本、台词、NPC配置、坐标及媒体不作为新模块的输入或运行依赖。

新增对白和演出步骤按已核的事件关系重新编写，战斗36/53人、阵营与固定遭俘条件属于本轮使用的事实。网页人物位置、阵形、HP/tier、跨图路线、迁移和失败重试是独立实现；第二战主角倒下采用普通失败的适配已与原回调优先级未知明确区分。押走时的双束绳由 Canvas 曲线绘制在现有原创人物图上，没有引入原绑缚图或动画。

限定模块扫描没有发现原目录路径、原包/动画格式引用、原目录读盘调用或外部代码import；只存在本项目模块依赖与来源说明链接。来源链接是说明元数据，没有被用作加载原内容的运行入口。当前 `public` 下未发现软链接。新增禁地各层、空屋、镇中与外场复用已有项目PNG；本轮 `public/assets`、资源来源清单、`package-lock.json` 均无差异，没有新增或替换发布PNG，也没有增加开发或运行依赖。`package.json` 的修改仅将新专项纳入测试命令。发布PNG仍为31项既有制作记录；本次未重新认证这些历史记录。

以上结论是本轮代码、依赖和资源引用的有限范围检查。它不包含原版实机比对、对白全语料相似性检验、全部Git历史对象取证或法律审查；“未发现直接复制或运行依赖”不等于版权无风险、获得授权或法律原创认证。部署仍以静态 `public` 为边界，参考文档和原目录不属于游戏运行资源。

## 2026-09-24：善线救援数据与演出增量（revision 14，限定模块）

本次增量审查限定于 `good-rescue-revisions.mjs`、`good-rescue-staging.mjs`、`good-rescue-migration.mjs` 与 [good-rescue-reference.md](good-rescue-reference.md)。前序必要核验仅在内存读取原包的指定事件及相邻出口，仓库仅留下独立动作/条件概述和定位元数据。没有保存原脚本、台词、NPC配置、动作文件、坐标、地图或媒体副本，没有创建原资源读取/导入工具。

三个产品模块重新编写对白、动作编排、角色与军阵稳定ID、数值、任务门槛和迁移。数据模块只import项目自己的cult-revisions.mjs以保留既有招揽选项；限定扫描未见原目录路径、pak或原动画格式、解包库、网络加载代码或外部代码import。来源网页地址仅为说明元数据。28名地牢守卫不设未经证实的全清救人条件；页面暂停、失败重试及奖励兼容均明确为本项目适配，不宣称原版行为。

这次限定审查没有重新对比原台词语料，也不覆盖根任务与地图代理并行编写的运行时及新图制作全过程；两幅新增项目图的制作记录由各自来源文档说明，不在这里代为认证。此记录是代码与引用边界检查，不是授权证明、法律审查或版权风险认证。

## 2026-09-24：revision 14 集成与三幅新图边界补审

这是上一节“三模块限定审查”的增量。本次仅只读当前仓库及其Git差异，**没有再次打开原游戏目录，也没有读取仓库外的生成源图片**。检查范围扩展到新增rescue-runtime.mjs，以及campaign、runtime、staging-runtime、skirmish-runtime、travel-party、staging、journey、world、routes的本轮接入。参考、浏览器和全流程完成度仍分别以各自记录为准，本节不代替玩法验收。

集成代码使用项目自己的模块注册、独立状态机、队伍显示、场景标识、军阵位置和多边形通行范围。地牢、安置庭院和沙漠的新art键通过既有`./assets/<name>.png`图像入口加载；地图路线没有引入原地图文件、NPC配置、动画或脚本读取器。新增的救援运行时只处理项目存档、交互和出口提交，不含原包读取或解压调用。

对当前public文本与文件名的扫描结果：未见`D:\Game`或`Monthly Shadow Legend`运行路径，未见原格式`.pak/.asf/.mpc/.spr/.mps/.npc/.map`实体文件，未见解包库或原资源导入器调用；JS模块import均指向项目相对路径，没有外部代码import。必须保留一个准确例外：既有cult-revisions.mjs和recruitment-revisions.mjs的source说明仍含`script.pak`、`ini.pak`与包内hash等定位文字。这些是来源元数据，本轮没有新增对应读盘、下载或加载调用，不能把扫描结果写成“public完全不含pak字样”。public递归检查未发现符号链接、目录联接或其他重解析点。

### 三幅新增发布图

| 发布文件 | 制作记录 | 本次重新计算的SHA-256 |
| --- | --- | --- |
| public/assets/rescue-dungeon.png | [rescue-dungeon-art.md](rescue-dungeon-art.md) | afedaa95f0f1dbce85979927d328ca8f9fa023e43faef5478502f68c5092a5d2 |
| public/assets/hanbo-hut-yard.png | [hanbo-hut-yard-art.md](hanbo-hut-yard-art.md) | 6f7433acdfb20e04e9405d2a5d0bd480faa58e2f077103edf916e17f165e9050 |
| public/assets/desert-passage.png | [desert-passage-art.md](desert-passage-art.md) | 22d629ea1875cff8e6c03b98817051892af45a358e55826fd9f204a1b86b5e5a |

三图均从仓库PNG头部核得1536×1024，实际字节数分别为3,005,211、3,678,709、3,187,952。每图实算hash同时匹配其制作文档和asset-provenance.json条目，条目为documented且referenceAssets为空。三份记录各自提供完整文字提示词、生成源绝对路径、交付文件和目视说明，并写明内置imagegen文生图、没有输入参考图。**本次证实的是当前发布字节与记录一致**；没有重新调用生成服务、复核仓库外源文件或执行原版图像相似性比对，不能单凭记录独立认证生成过程或法律权属。

当前public共89个文件，其中34幅PNG；资源清单也有34项。相对于审查时HEAD，既有31个public/assets文件无修改，新增项正是上表三图。没有把机制参考文档、内存核验工具或原目录作为新发布图的输入链记录；原参考目录也不属于静态部署目录。

依赖与部署配置方面：package.json只把validate-good-rescue专项加入总测试并新增test:good-rescue命令；dependencies/devDependencies均未改变，开发依赖仍为Wrangler 4.130.0，package-lock.json无差异。wrangler.jsonc无差异，静态资产目录仍是`./public`。本轮产品接入没有增加认证、服务器端存档或远端游戏内容服务，继续使用既有浏览器本地存档；本检查没有执行云端部署。

本节属于本轮集成代码、文件引用、依赖差异和制作记录一致性的有限审查。它不包含所有Git历史对象取证、全部对白相似性检验、原版实机/图像比较、服务端生成记录认证或法律审查。未发现直接原资源运行依赖、制作记录完整或hash一致，均不等于取得授权、版权无风险或法律原创认证。


## 2026-09-24：revision 15 塔内护送与落叶谷长夜增量复核

本次独立检查仅访问当前仓库的 `public`、新增资源、来源文档、配置和测试；没有访问原游戏目录，没有解包，也没有打开仓库外的生成源文件。范围是 R15 的五幅新背景、`good-tower-valley-revisions/staging/migration.mjs`、`tower-runtime.mjs`、`combat-progress.mjs` 及其现有接入边界。此次只追加本文，不修改产品代码、图片、资源清单、部署配置或测试。剧情/战斗/浏览器是否完整另见各自验收记录，本节不替它们作结论。

### 五幅新图及实际发布字节

五图均在 [完整制作记录](tower-valley-art.md) 中明确记为内置 imagegen 纯文字生成、无输入图片。每项记录含完整提示词、指定生成源绝对路径、交付文件和 SHA-256；`asset-provenance.json` 的对应条目均为 `documented`，`referenceAssets: []`。本次从仓库交付 PNG 独立重新计算哈希、读取 PNG 头部尺寸，与制作文档和清单双重核对一致。

| 当前发布文件 | 尺寸 | 字节数 | 实算 SHA-256 |
| --- | --- | ---: | --- |
| `public/assets/tower-prison.png` | 1536×1024 | 3,104,675 | `b816f37c87e1cb35a0f03f5f4e491bcda3d2255cd2556a9f25b650a359cb320d` |
| `public/assets/tower-lower.png` | 1536×1024 | 2,898,847 | `5c0077265aaed07dcaa5dd1f22ceada8004a49bbee905204b4cc6d752144bedf` |
| `public/assets/tower-middle.png` | 1536×1024 | 3,158,272 | `8884c5bd1447f6a63b05d8cbe33a338a0c664e181fe57815bbffb89461fdf63d` |
| `public/assets/leaf-ruined-courtyard.png` | 1536×1024 | 3,649,862 | `cb22c8332fb1dd2a507f6312cb652b0b6657cbabb313242fd4db227887cd266b` |
| `public/assets/leaf-memorial.png` | 1536×1024 | 4,006,487 | `63ef85b2209a7f239005ce9bb2b08f915c0af3c80ebed34ab6beb9c02908ce32` |

五个 PNG 的容器均在 IEND 处结束，尾随字节为零；块类型均为 `IHDR / caBX / IDAT / IEND`。因此不能沿用早期审计中“不含附加块”的笼统描述：这批文件含 `caBX` 块，本次没有验证其内部声明或签名，也没有进行隐写取证。没有把这些块删掉、修改图片或另行重编码。

`node tests/validate-asset-provenance.mjs` 当前通过：39项发布PNG、39项制作记录、20项负例，输出 `DOCUMENTED_RECORDS_ONLY`，未列出未确认参考输入。这个结果证实清单、当前字节、文档路径和输入依赖记录一致；**没有独立重演生成调用、读取生成源作逐字节比较或核验生成服务历史**，不能单凭文档声明与空参考列表证明法律意义的原创性、授权或视觉不相似。

### 原版参考与产品实现的分界

[本轮有界参考](good-tower-valley-reference.md)保存敌方数量与角色构成、上下楼/同行/安葬/邀请条件的独立概述，另以包哈希、包内条目标识、路径与行号定位。它不是可运行原脚本、完整对白、NPC配置或地图坐标副本，也不位于 `public`。本次没有回到原目录比对，因此不把审查仓库摘要说成又做了一次原版事件核验。

新增产品模块使用本项目的任务、旗标、演出步骤、军阵槽位、生命值和迁移协议；对白与舞台动作是重新编写的表达。三组塔底图、受损院的完整 scene 变体、独立墓区与两房往返、墓碑 Canvas 绘制、守卫分散站位、跨层军阵保存及失败重试属于网页表现或存档适配。原同图的厅、墓位、房位没有被误宣称为原版多个独立 LoadMap；塔守卫保存也没有被宣称已经确认原引擎的全部 SaveNpc/LoadNpc 语义。

限定扫描当前 `public` 文本与文件名未发现原目录运行路径、原包读取器、解压调用、原素材导入器、外部代码 import 或需要下载原版内容的运行入口。准确保留旧有例外：`cult-revisions.mjs` 与 `recruitment-revisions.mjs` 仍含 `script.pak`、`ini.pak` 和包项 hash 等**来源定位文字**，没有与之配套的读盘或加载调用。代码中的 `.npc` 属性访问不是原 `.npc` 文件引用，不能因关键词命中误报。

### 当前发布目录与无需登录的边界

检查时 `public` 共99个文件：39 PNG、57 MJS、1 JS、1 HTML、1 CSS。递归枚举未见 `.pak/.spr/.asf/.mpc/.mps/.npc/.ini/.map/.obj` 原格式实体、音频包、可执行程序或解包目录；未见符号链接、目录联接或其他重解析点。新增机制参考文档、生成源路径和仓库外原目录不是发布目录的文件或静态资源入口。此项是文件与引用检查，不能用文件扩展名扫描排除任何形式的隐藏内容。

`wrangler.jsonc` 仍仅将 `./public` 配置为静态 assets，没有新 Worker 程序入口、认证服务或数据绑定。`package.json` 继续使用 Wrangler 静态开发/部署命令，部署前执行资源来源清单检查；本轮 `wrangler.jsonc` 和 `package-lock.json` 无差异。首页直接载入游戏 Canvas 与 `./journey.js`，存档/偏好读写浏览器 `localStorage`，没有新增账号步骤。

本次实际运行 `node tests/validate-hosting.mjs http://127.0.0.1:8787` 通过：**99个匿名游戏资源、13个非发布路径检查**。请求使用 `credentials: 'omit'`；各游戏资源返回200与预期 MIME，无认证挑战、设置 Cookie 或登录重定向。原已撤出的七张旧图、配置/包文件、Git配置与测试入口均返回404。该结果仅覆盖当前本地静态服务；本次没有执行云端部署、没有查询生产 Cloudflare Access/账号设置，也不把本地匿名访问当成线上站点已经发布或远端权限配置已审计。

此增量没有发现原资源进入当前发布目录或成为运行依赖的具体证据。它不包含全部 Git 历史对象、所有旧图片生成历史、原台词全语料相似性、原版实机或法律审查。来源记录完整、哈希一致与匿名静态检查通过，不等同权利授权、无版权风险、法律原创认证或全流程复刻达标。

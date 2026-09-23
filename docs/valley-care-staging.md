# 落叶谷救治环路：数据、演出与边界

日期：2026-09-23。本子任务新增 `public/valley-care-revisions.mjs`、`public/valley-care-staging.mjs` 与本文，导出 `VALLEY_CARE_REVISIONS`、`VALLEY_CARE_ADDITIONS`、`VALLEY_CARE_STAGING`。campaign、运行时、旧档迁移、地图、美术和专项测试分别由对应负责人接入；本文不将数据落盘称为整段浏览器验收完成。

## 依据与独立实现

本段使用根代理本轮确认的 [杜胜利详攻略第82–85节](https://vv0817.neocities.org/gametxt/15_jxqysp) 和 [NBE正线相应部分](https://www.nbegame.com/post/11647.html)，以及项目已有 late-story/errands 的机制概述。本子任务没有为救治段再次访问原游戏目录，没有读取原素材或抄写原台词。两份攻略是公开的非官方参考；原引擎动画、精确坐标、隐藏数值及版本差异未在本轮认证。

| 已有参考支持的机制 | 本轮独立表现 | 不推导的内容 |
| --- | --- | --- |
| 孟知秋把救治与婚事相提并论；拒绝与考虑都给一天时间 | 院中先听条件与期限，再选择；到真儿房里分别转述自己的答复 | 两支都不自动成立婚约，不增加善恶或好感。 |
| 去隔壁见真儿、听她说明被眉儿救；去蔷薇房问萱儿、得知天池去向 | 两个实际房间和演员交谈，先后前置独立保存 | 不把真儿写成被蔷薇救出，也不提前用玉佩认证姐妹关系。 |
| 到天池求助；蔷薇先返谷；父女说情后答应今夜救治 | 玩家进入天池独立湖心区域，蔷薇走向岛侧跃点后在淡出中离去，玩家实际回谷；父女当面交谈 | 不在湖边就宣告孟已经答应；不让 NPC 普通行走穿水。湖心布局/跃点是网页原创空间。 |
| 带蔷薇见真儿，再回主角房休息，夜里到蔷薇房中道谢 | 房间引见、真实跨门、床边坐姿、黑场时间过渡、夜访道谢 | 不新增主角目击孟运功的镜头，不把睡眠等同恢复生命/内力。 |
| 次日樱儿说明孟运功后闭关、伤势稳定；去找真儿，再看已醒眉儿，影枫道歉且蔷薇劝说 | 先病房询问，再真儿房邀请，再病房共同探望；伤者从坐姿慢慢起身离开 | 苏醒/稳定不等于治愈，不能在谷内就发药草、玉佩、技能或痊愈奖励。 |
| 三人回忘忧岛，在海边小屋安置后才采十二株银丝草 | 谷外陆路、大陆码头登船、岛渡口、海边和小屋分别步行/乘船；安置后清跟随并进入现有采药任务 | 不把到达码头当作安置完成；蔷薇留谷，不成为返岛第四位同行者。 |

关于夜访发钗，详攻略提及、NBE对应段未提。本轮没有新增任何发钗奖励、背包物品或交付动作；具体领取条件及原版物品调用仍待独立核验。也没有用一句“礼物”来暗示本模块已经完成了该事实。

对白全部重新撰写；坐姿、淡入淡出、慢步、时长、演员 ID、脚点和保存事务是网页设计。房间使用项目自有资源链，旧人物图的来源不因本模块使用而自动得到认证；素材记录与未确认项继续以 [asset-provenance.json](asset-provenance.json) 及 [边界审计](reference-boundary-audit.md) 为准。

## 任务与状态合同

保留 `g06`、`g07` 稳定 ID，增加13个任务，共15场演出。这个数量只描述实现结构，不作为全流程达标依据。

| ID | 真实地图 | 必要前置 | 完成提交 |
| --- | --- | --- | --- |
| g06 | m51 院中 | 现有正线到谷进度；先演出后选择 | 选择提交 valleyCareStarted、恰一 valleyCareRefused/Considered，companion:null |
| g06_confide | r_leaf_zhen_room | valleyCareStarted，选择恰一 | valleyZhenHeard |
| g06_inquire | r_leaf_rose_room | valleyZhenHeard | valleyRoseLocation |
| g06_request | m52 | valleyRoseLocation；主角实际到湖心演出点 | valleyRoseAsked |
| g06_return | m51 | valleyRoseAsked | valleyTreatmentAgreed，companion:蔷薇 |
| g06_introduce | r_leaf_zhen_room | valleyTreatmentAgreed | valleyIntroduced，companion:null |
| g06_rest | r_leaf_hero_room | valleyIntroduced | valleyCareNight |
| g07 | r_leaf_rose_room | valleyCareNight 或明确旧档 valleyLegacyCarePrelude | valleyThanks |
| g07_dawn | r_leaf_hero_room | valleyThanks | valleyCareMorning |
| g07_visit | r_leaf_mei_room | valleyCareMorning | valleyMorningReport |
| g07_zhen | r_leaf_zhen_room | valleyMorningReport | valleyZhenReady，companion:纳兰真 |
| g07_apology | r_leaf_mei_room | valleyZhenReady | valleyMeiAwake，companion:纳兰真；运行时据此显示眉儿同行 |
| g07_mainland | r_mainland_dock | valleyMeiAwake | valleyCareBoarded |
| g07_island | m40 | valleyCareBoarded | valleyCareLanded |
| g07_settle | m33 | valleyCareLanded | valleyCareSettled，companion:null |
| g08（仅加前置） | m32 | valleyCareSettled 或明确旧档 valleyLegacyCare | 沿用现有十二株采药/交付任务，不在本模块重发 |

全部新任务 `when:{route:'good'}`；进度采用 requiredFlags/requiredAnyFlags，不把每个旗标加到 when 路线枚举。任务入口与演出恢复都须核前置。g06 两选项索引保持0拒绝、1考虑，显式将另一分支置false；没有善恶/好感修改。选择的 after 与任务 after 清空，已发生的后果必须通过后续真实演出落实，不能先读完压缩摘要便视为已救治。

g06_confide 每支只有对应的一句答复转述，通过 step.when 隔离，之后走同一完整环路。不是两条不同救命结局，也不允许两个分支旗标同时true。g06之后的六个前置任务严格要求选择恰一；g07及更后任务仅允许明确旧档未知选择标记例外，见下文。

**所有15场任务显式 xp:0、money:0。** 保留g06/g07此前通用兜底的65经验/15钱没有剧情依据，本轮取消此类谈话发钱；旧余额不追扣。没有物品、技能、药品、recover、战斗、攻击、死亡或交付步骤。日夜过渡不会恢复状态。剧情旗标和跟随只在完成结算或g06选答事务提交，逐步演出的cue不是提前结算。

## 演出、日夜与同行

`g06_rest` 在床边坐下后淡出，黑场中设置 `valleyCareLight:'night'`，再亮起并起身走至门内；完成时才提交 valleyCareNight。`g07_dawn` 从夜访回房再休息，黑场中设置同键的 `day`，醒后才提交 valleyCareMorning。运行时应优先按当前sequence cue，再按完成旗标和明确历史决定谷内场景光色。主角刚进客房不能提前换夜，刚从蔷薇房出门也不能直接天亮。`dreamFade` 只是现成淡入淡出渲染键，本模块没有新增梦境。

全程真实 map 只由玩家穿门/步行/乘船改变，演出没有 scene 步骤把真实位置直接改为下一房间。床边使用坐姿和黑场，不声称原版同样动画。夜间救治发生在叙事背景；主角的可见动作只有等待、夜访、次日询问。

g06_return 完成后蔷薇跟随到真儿房，引见完成后清跟随。g07_zhen 完成后真儿跟随；g07_apology 完成后运行时同时呈现真儿与眉儿，直到g07_settle完成才清空。引见、道歉及返岛旅行的 `hideCompanion:false` 保证地图行走可见；演出内同名演员和跟随演员须由运行时去重，不能在病床和主角旁各出现一个眉儿。

病房初访用病姿，第二次探望用坐姿，同行前慢慢起身；这是原创清地上的病容表现，不把角色硬贴在底图床面。蔷薇在道歉段入场劝说后离开，未获返岛同行状态。海屋结尾保留真儿照看病姿眉儿，持久显示到g08；不播放之后交药任务的药碗、煎药、合玉cue。

## 旧档兼容边界

由根代理实现迁移，本数据只声明入口：

- 旧revision≤9当前g06没有有效答复：仍从g06继续。旧phase choice/after只加 `valleyLegacyCareProposal`，g06 的 legacyStagingFlag 使用此名，可回到选择；其他phase重走院中求助演出。
- 旧g06已有有效 choices.g06 0/1：转到g06_confide，按原选择静态重建互斥分支，不再次计算钱、经验、善恶或好感。
- 旧当前g07且未完成：保留在新夜访入口，标 `valleyLegacyCarePrelude`。原答复可验证则派生两旗标；原答复不明则只标 `valleyLegacyCareChoiceUnknown`，不制造choice。g07 requiredAnyFlags允许Night或Prelude；g07及后七段exclusiveLegacyFlag允许恰好零选择的明确历史例外，两个旗标同true仍拒绝。
- 旧g07已完成或已经越过救治段：只以 `valleyLegacyCare` 保留已发生历史，不插入新的done、claimed或staged，不强迫返谷重做，也不追扣旧余额。

房门、日夜和谷外门控须识别明确的旧Prelude，而不是要求迁移伪造六个新阶段。旧档兼容由专项验证；本模块不通过visited数量、当前善恶值或不相关任务数量猜出答复。

## 脚点与当前验证范围

地图负责人已报告，院中、真儿房、主角房、病房、两侧码头和海屋合计137脚点/2790条逐5px采样路径通过（含最终蔷薇房）。此为世界几何检查的协作报告，不是原版几何认证，也不是本人浏览器目视验收。

主要脚点：院中影枫760,650、孟850,505、蔷薇965,575；真儿房影枫650,570、真儿805,490、蔷薇900,620；主角床边620,450、醒来690,535、门内760,760。病房眉儿1060,585、樱儿900,660、真儿760,585、主角750,690；蔷薇900,795入至930,735，后至820,810离开。返岛点和海屋点沿世界负责人校准，海屋眉儿665,625至600,540、真儿760,550至720,610、主角795,625。

天池最终实图改变了可站立雪地的位置，原草案点已弃用。当前模块与世界统一采用西岸550,550到岛侧920,450的跃点；求助主角1040,480、蔷薇1180,390。蔷薇离场至岛侧跃点，在短暂淡出内隐去。湖心水面必须阻断普通步行，主角仍须使用独立跳跃操作；最终画面、落点恢复、往返出口及旧任务兼容由世界与运行时专项验证。蔷薇房最终日光图已由地图负责人实看，未烘焙月亮；脚点也纳入上述静态检查。使用影枫755,705、萱儿780,580、蔷薇950,550；夜谢时两人分别走到835,695与930,630，影枫最后到门内750,780。房门750,955仍须玩家继续步行接近，演出不直接跨图。

已运行两模块语法检查和独立数据结构合同检查：新增ID/演员引用、任务地图一致、每场release、零额外资源、两选择互斥、对应confide步骤和日夜cue均通过。后续质量检查发现工厂before直接重复objective，现已改为[]，真实对白由staging承担，没有降低质量断言。专项负责人随后报告tests/validate-valley-care.mjs通过：两答复完整环路及旧未知答复夜访，453个演出存档恢复、67个旅行存档恢复、跃水往返及空中恢复。这是协作自动检查报告，不是本子任务浏览器试玩。全量quality曾另报m52交互点平台间距/可达规则问题，地图与测试负责人正在对应处理，不能由本次文案修复宣称整套quality已通过。

后续必须实际检查两答复完整走到采药入口、步行同行可见且不重复、每个房间/跃点中断恢复、错前置/错分支拒绝、日夜加载失败不推进、重复领取与无端回血、旧档路径及匿名静态Cloudflare资源。不能以15场演出、脚点数或自动通关宣称完整复刻。


## 本轮发布边界的限定复核

在收尾时仅检查当前工作区，没有再读取原游戏。`wrangler.jsonc` 的发布根为 `./public`，package的部署命令先运行来源清单校验。public当前只有PNG、JS/MJS、HTML、CSS；没有PAK、ASF、原地图格式或解包目录。public中命中script.pak/ini.pak的地方为已有source说明字符串，未发现可执行原目录读取、解压或导入器。tools、vendor及work/reference为空；本轮新文件清单没有原游戏副本，`.wrangler/tmp`所见为Wrangler通用门面/空worker文件。work中的既有original-story-analysis.json保留的是purpose/flow/priorities/unknowns等概述结构，不是原脚本。此为限定清单与代码检查，不是对未知来源图像做原版逐像素比对。

运行 `tests/validate-asset-provenance.mjs` 得到33项PNG清单及哈希一致性通过，其中27项documented、6项unconfirmed，sourceCoverage仍为INCOMPLETE。documented只表示制作记录状态。6项当前用途如下，均仍在发布根中：

| 未确认图片 | 当前用途与限制 |
| --- | --- |
| characters.png | 每次prepareScene必载；主角、部分角色及对话肖像仍使用。hero-kneel虽有自身制作记录，其参考输入仍依赖这张未确认图片。 |
| forest.png | 多处山路/林道主图，例如m6、m32、禁地连接路和武当登山道；也有旧region.art回退引用。 |
| town.png | m18、m41、m44、m72、m74当前主图；另有region.art回退引用。 |
| lake.png | m17当前主图；另有旧地图美术键回退引用。 |
| snow.png | 当前逐图getScene没有将其设作主图，但旧MAPS.art仍引用，例如m1、m29、m37、m38；普通场景主图加载失败时prepareScene会尝试region.art，因此不能视为已从运行时移除。 |
| wudang.png | 当前逐图getScene没有将其设作主图，但大量旧MAPS.art仍引用，例如m3、m4、m49；与snow同样仍可能进入失败回退，且文件可以由发布路径请求。 |

本轮四张新背景的制作记录见valley-care-art.md，记录了无参考输入、完整提示词、生成源和交付哈希。没有因此改变旧六项的状态。本次未发现直接复制或导入原内容的新增证据，不等于来源记录完整；unconfirmed本身也不等于已发现盗用。六项未确认来源和跪姿图的上游依赖仍明确保留，未宣称清零或作法律原创结论。

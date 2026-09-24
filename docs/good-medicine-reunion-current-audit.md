# 求医、返庄、首谈与善线终局现状审计（R15）

2026-09-24。基线提交755d1b0657f58fca5cee7c05e1ed45557042a1e4，合并后的campaign为revision 15、228项任务。本报告只读项目产品代码与现有文档；没有访问原游戏目录，没有使用原版图片、脚本或台词。下述行为证据来自独立网页实现，不能证明原版时序、完整复刻或浏览器视觉验收。

本轮范围为g21/g22/g23/g24/gBad1/gBad2、chooseEnding、人物随行、任务路由、普通终战结果、旧档静态分支及奖励。此前R13审计中的普通失败刷新、重复逐敌奖励、裸after终战、g20四拒后的活人同行等问题已在R15另行修正，本报告不将这些历史缺陷重新列为现存问题。

## 最影响流程的三项确认问题

### 1. 留庄角色继续同行，接到的人反而不同行

位置：[late-story-revisions.mjs](../public/late-story-revisions.mjs:148)、[travel-party.mjs](../public/travel-party.mjs:3)。

g21完成后由实际travel/tick从m23走到m49，g22 choose(0)叙述真儿和蔷薇留在山庄，任务推进到g23。序列化并restore后，partyNames与实际渲染入口companions仍返回蔷薇；再通过真实道路走到m17也一样。g23选先与眉儿交谈后进入g24，firstWoman确为mei，但同行仍仅蔷薇，没有眉儿。g22/g23的rewards没有离队或接人提交，party实现也没有这段的专属人员规则。

这属于正常网页路径里“对白说留庄、角色却跟着走”的确定矛盾，非仅存档破坏负例。现在的接人和送回只发生在文字中。紫轩是否同行还取决于首谈分支，不能简单固定加入所有人物；准确加入/离开时点需由本轮参考合同决定。

### 2. 樱花谷首谈并非人物交互，且结果播放期间刷新可撤回

位置：[late-story-revisions.mjs](../public/late-story-revisions.mjs:155)、[runtime.mjs](../public/runtime.mjs:169)、[journey.js](../public/journey.js:57)。

g23实际人物标记仅有紫轩，无月眉儿交互目标。生产journey函数的DOM桩复现：靠近唯一主目标后，必须先读紫轩询问蔷薇平安的对话和影枫回应，之后才出现“先与紫轩/先与月眉儿”的菜单。因此选择眉儿也无法满足“第一次实际交谈的人就是眉儿”。

另有明确提交时点问题：点击眉儿选项后，界面已经显示眉儿同意同行的答复，live choices.g23、firstWoman以及当时保存内对应字段仍为空；此刻restore仍回未选择状态。只有读完结果全部对白才写g23=1、firstWoman=mei并转g24。这不是已记录选择被反复加分，而是已经播放所选结果后，刷新仍可静默撤回应答。

建议用两个人物目标进行实际首谈：第一次合法、近距离交互就在显示其答复前提交稳定身份和存档；后续交谈、返回、刷新不能覆盖。选择累计好感、领奖、后续加入队伍应分开记录。不能只改菜单名称或增加一个装饰人物而沿用固定紫轩前置对白。

### 3. 有效终战证据存在，缺损分支字段仍映射错误结局

位置：[campaign.mjs](../public/campaign.mjs:28)、[runtime.mjs](../public/runtime.mjs:106)、[good-tower-valley-migration.mjs](../public/good-tower-valley-migration.mjs:24)。

R15普通战斗协议已经拒绝凭空after结束，本轮所有终战复现都走startBattle、cast及有效结果，再completeQuest。边界敌HP设为1，仅用于缩短复现，不宣称自然难度通关。

| 保存夹具 | R14恢复及真正胜利后 | R15恢复及真正胜利后 |
| --- | --- | --- |
| 当前g24，done含g23，choices.g23=1，缺firstWoman | reunion | reunion |
| 当前g24，done含g23，choices.g23=1，firstWoman=zi | reunion | reunion |
| 当前gBad2，done含gBad1，goodRoseBuried=true，缺forsake | reunion | reunion |

前两项已有明确选择证据应指向网页三美分支，却被chooseEnding的默认值变成四美；后一项位于悲剧任务且已有安葬证据，仍被默认值变成四美。restore当前单次选择只在当前任务是该选择时处理静态assignment，任务已经前进后不会从g23历史修复。chooseEnding只看route、forsake和firstWoman，也不检查当前终局任务与所选分支是否相容。

这些是人为构造缺字段/矛盾字段保存的保护缺口，不能宣称正常完整存档会自行丢字段。后续迁移应优先采用明确历史答复，修复静态分支而不重发好感/银两/经验；真实未知首谈不能默认造为紫轩。终战证据和叙事分支证据必须分别检查。

## 其他确定的压缩和表现缺口

- 合并g21为talk，g22/g23为choice，三者均无独立STAGED_QUESTS演出。求医失败、蔷薇服药、安置睡下、真儿谈心、翌日决定归隐，目前在相邻对白和选择中完成；没有可单独存读档的服药/安置/次日节点。本报告不自行断言原版此处需要某物品或等待时长。
- 真实路由为m23→m49、m49→m17；g23后routeTo(g24.map)为m17→m70，后者由相邻任务推断边产生，没有返回m49接人集合的实际节点。对“返庄准备归隐/再遇招揽”的表现不充分；这些边是网页原创推断，不声称原游戏的准确地图邻接。
- gBad1完成后直接到gBad2。发现紫轩与眉儿遇害、把二人安葬于樱花谷、真儿赶来、料理父亲后事与离开中原，都仍压缩于gBad2前后文字，未有独立可玩步骤。R15已实现的是蔷薇的死亡与安葬，不能据此冒称另外两人的后事也已实现。
- 普通boss胜利后，g24/gBad2仍会在主目标位置显示纳兰潜凛供战后交谈；这里没有新增死亡或离场演出。具体原版胜负时序由后续参考核验决定，本轮只记录现有表现。

## 奖励及已经守住的边界

在当前网页兼容规则中，g21/g22/g23各使用默认一次65经验/15银，没有本段新增道具奖励。本轮g21真实完成所得正是65/15。终战的普通首领逐敌奖由combatClaims与有效阵容维护，任务奖由claimedRewards维护；本次6个R14/R15终局夹具完成后再次completeQuest，银两、经验和claimed记录均未追加。

没有发现本段正常动作下再次触发已完成选择能重复领奖的新缺陷。尚未做本段完整所有旧版本/失败/分支的穷举；不能用这几项检查替代新合同后的专项。此前普通战斗失败、重新读取及重复逐敌领取的修复证据见[普通战斗审计](combat-progress-current-audit.md)。

## 建议的有意义验证

1. 真正走求医→返庄各门口，在服药、安置、谈心、翌日、离庄、接人、返庄各提交点存读档；每一步检查可见人物、partyNames、companions、实际路线及已经发生的剧情状态。
2. 首谈先紫轩/先眉儿两条都从没有首谈记录的真实人物点击开始；点击后第一句、演出移动中、两次谈话之间刷新。首谈身份不可被第二人覆盖，重复谈话不可再次派奖。
3. 当前格式及旧档分别覆盖：未谈、已选未领取、已领取未推进、明确历史答复但静态flag丢失/相反、只有不确定旧游标。兼容只能保留可佐证历史，不能把新演出标为已玩或复制额外收益。
4. 终战真正败北、刷新、重试及真胜利仍走普通协议；普通battle结果不得替叙事分支背书。g24/gBad2必须与选择/死亡历史相容，未知状态应有明确恢复路径。
5. 实际浏览器验证两人位置、可交互范围、留庄与加入动作、日夜转换和返庄集合；本报告的DOM桩不是浏览器。

## 独立基线、复现和限制

冻结文件work/revision-fifteen-quest-baseline.json以wx创建，包含228个[id,effectiveTier]，未覆盖既有文件。文件字节SHA-256为3638290515eafba30d1355674cb2bc3afaf75e84e2ca0983b172f4400459018b；紧凑JSON数组SHA-256为798188d83c0d583daafc28c437047fc244c29ec141b14fa2398b82d8cd71f525。后续测试应嵌入此独立expected，不从改后的campaign回算历史预期。

忽略目录内复现：work/r16-medicine-audit-repro.mjs及.json（真实方法、实际行走、两种保存修订的缺损终局）；work/r16-medicine-ui-repro.mjs及.json（使用现有项目DOM桩执行生产journey处理函数）。后者只摘用了项目自己编写的测试环境，未访问原目录。本审计未运行完整npm、HTTP或CF预检，也未部署。

| 读取的产品文件 | SHA-256 |
| --- | --- |
| public/campaign.mjs | f7e0d1100ff6d9dcf624bacd3f58cfbb7d99cbb99e71cc59bd3fa1a4980e3994 |
| public/late-story-revisions.mjs | 82f7aba896596a61f2434e65e08b6db28416dc06505076b3045a56528c18c568 |
| public/good-tower-valley-revisions.mjs | 3afd77669be0bc8833c38bc747920186ce647f2fb416da7b358b7fdf608e1e28 |
| public/good-tower-valley-migration.mjs | fadd7265758ecef5b0d60a91f8467711980237e87f43be964554bc1ba48c52fb |
| public/runtime.mjs | aeeca381297ace4ca01457282e8e2db2be2ee978b949f1d4fc04cdb0f30e4f97 |
| public/journey.js | c322c826e9d940937f17b1b170fcdf417e88901e500ac9f3d99cf22db184fc07 |
| public/travel-party.mjs | 7dd353c18ad6f96af20bbd12ab313d4c25e6ff402f204034aba267c78595f8f0 |
| public/routes.mjs | c7adbb4d05fdcbcc5f9a1c1c636eb8ce136c89689bf5e4754b8c0c29e7d29617 |
| public/combat-progress.mjs | b24163f4017fa1eb53d8661ded767f8931bb5b22f746471e4f1521298fa0d497 |

这些是当前实现相对自身叙述与已经记录分支的审计结论；本轮原版机制参考由另一个子任务独立核验。原创呈现与未确认细节仍需分别记录，不以任务数、矩阵数或到达结局宣称完整复刻。


## R16 实现增量说明

上述条目保留为提交 755d1b0 的独立审计结果。R16 已增加近身首谈及对白前保存、双人同行与离队归一、历史 choices.g23 权威修复、未知分支实际补谈以及终局缺损保护；具体状态验证和剩余差异见 [R16 验证记录](good-medicine-reunion-validation.md)。本增量不把旧报告里的真实问题抹去，也不把新实现的自动检查当作完整还原证明。

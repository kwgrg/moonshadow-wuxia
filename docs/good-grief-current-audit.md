# R17 悲剧情线集成审查（初审基线与落实记录）

审查日期：2026-09-27。审查边界：仅阅读本项目代码；本审查未读取原版目录。以下初审章节描述 R16 工作基线与接入建议；落实情况见文末和 good-grief-validation.md。“已核”指独立实现的行为，不是原版机制核验。

## 当前差距与已核实现

- R16 的 gBad1 在 m49 仅以两段交谈表示真儿带回迟到的解药、随后独自离开，任务前置为 goodRoseBuried 或 goodTowerValleyLegacy。
- gBad2 在 m71 以开场叙述省略小筑发现遇害、谷中安葬、赴楼复仇；以胜后叙述省略真儿赶来、父亲后事、离开中原。它是普通 boss、count 1、encounterTier 14、ending true，胜利任务默认奖励 65 经验与 15 金；boss 击杀独立奖励 100 经验与 80 金，任务另补一药一丹。
- gBad1/gBad2 的 when 均为 route good、flag forsake、notAll cultPath。成功留宿蔷薇的 g21–g24 当前用 not forsake 分隔。
- 待补的是上述可操作过程与现场状态。不能以新增任务数量或模拟通过宣称原版全流程已完成；原版事件、具体转场、演员关系须由另行只读机制核验确定。

## R16 冻结与版本接入

已使用 wx（存在即不覆写）创建 work/revision-sixteen-quest-baseline.json，并对已有内容做精确一致性检查。文件只含 238 组 [任务 ID, 有效战斗 tier]，不含任何原版内容。

- 紧凑 JSON SHA256：ffa9a8cd1b7cd4b04b5149721f70cc137d6155109550311d21b3340ee99d8e52
- 落盘文件 SHA256：8759bda17ba455f8545b7060d9e051f6b1183479f9a6fa27064a347fa8e9579f
- campaign.mjs 应在 GOOD_MEDICINE_REUNION 的修订与插入全部完成后、R17 的修订与插入之前导出 REVISION_SIXTEEN_QUEST_IDS，并冻结缺省 encounterTier。不能在已经插入 R17 后生成此表。
- runtime.mjs 的 freshState revision 改为 17；无 questId 的 revision 16 先按新冻结表查出 ID，再按当前 QUESTS 定位。旧 revision 1–15 的分支保持原表。带 questId 的存档仍以 ID 为准。
- 新增节点应显式 xp:0、money:0；旧 gBad1/gBad2 奖励不因拆分再次发放。旧 claimedRewards 只修复静态状态，不重复累计效果。

## 普通 boss 持久战保护

combat-progress.mjs 的持久协议依据 questId、wave:0、固定 roster 声明、死亡 ID 与 outcome 证明胜利；phase after 或空 enemies 都不是胜利证据。

- 保留 gBad2 的 ID、count、tier 与 boss 槽即可保留旧 roster；可更新原创展示文案。staging 中 enemy 演员名称会参与恢复的规范名字生成，数量/槽位须一致。
- R16 尚在 gBad2 战中的档：不要 reset sequence/enemies/combatProgress/phase/heroHP；只补显式 legacy 前史通行标识。活动、胜利待交付、失败都要保留。
- hero HP 为 0 优先于所有胜利推断；仅玩家 retry 可恢复。retry 保留 combatClaims，同一敌人不能二次付奖。
- R15/R16 有战斗痕迹却缺损 roster 的档必须仍失败待重试，不能因新迁移重置 talk 而洗掉失败。更旧无协议的档遵循原 restoreCombatProgress 的未知击杀奖励抑制逻辑。
- gBad2 done 而未有合法 ending 的异常/旧中断档，可转新的后事节点，并记录 LegacyDuel 之类独立历史说明；不得再进入 boss，不伪造新增节点 done，也不再次发放旧任务/击杀奖励。
- 完成的合法旧 zhen_good 结局保持完成；迁移不强制重玩。完成判定仍由合法 ENDINGS[raw.ending] 建立。

## 迁移范围与状态合同

migrateGoodMedicineReunion 在后段迁移末尾调用；新迁移应紧随其后、先于 restoreStaging / restoreCombatProgress。新函数必须精确匹配悲剧 ID 集合，再读历史，不能以数组序号“later”跨到 evil 或 cult。

建议分类（具体目标 ID 待 R17 数据合同）：

| 旧状态 | 应保留/恢复的行为 |
| --- | --- |
| gBad1 未完成 | 从新增的 gBad1 交谈/离别开始；清理仅此旧任务的过期 staging；没有新领物/剧情完成证明 |
| gBad1 已完成、当前仍为 gBad1 | 转到新调查入口；显式 legacy report，旧 done/claimed 原样 |
| gBad2 尚未完成 | 保留当前战斗、失败或待交付状态，显式 legacy funeral/investigation 通行；不逼玩家回去重查 |
| gBad2 已完成、未结束 | 转后事任务；legacy duel，不再发钱、经验、补给 |
| 合法旧结局 | 保持结局与资源 |
| unrelated e*/gCult*/留宿线 | 完全不被悲剧迁移改变 |
| R17 新档/重读 | 静态分支纠正可做，但不循环重置进行中的 staging/战斗 |

资源保护应比较 coins、经验、等级、药丹、kills、inventory、skills、affection、done、claimedRewards、combatClaims。普通战斗存档另外比较 HP、敌人 HP/位置/计时器、技能冷却。

## 分支、结尾与同行

- chooseEnding 的当前顺序：evil 先判累计值；再 forsake -> zhen_good；最后 firstWoman 决定 three/reunion。
- completeQuest 对 q.ending 善线会先 repairMedicineBranch；若既无 forsake、旧悲剧任务 done、蔷薇亡故等证据，也无 firstWoman，会进入 g23 补首谈。因此新增悲剧节点须维护独立的悲剧资格，不可让脏旧档默认为团聚。
- 最终节点可显式 endingId:'zhen_good'，但仍必须有 before/after/staging 与 requiredFlags 的真实门槛；q.endingId 单独存在不会触发上述首谈修复。
- repairMedicineBranch 当前只显式识别 gBad1/gBad2；新增 ID 需采用精确集合或可靠剧情旗标。不要扩大成全局 g 前缀。
- 同行统一使用 applyCompanionEffects 的 companions/companion 双字段，不直接只写数组。真儿离开、无同行调查、尾声同行都应分别在真正完成的节点提交。已 claimed 的静态同行修复需要 repairCompanions:true。
- 初审时 finish 只清空 companion，completed 隐藏队伍但 companions 数组仍留存。R17 已通过 applyCompanionEffects 同步清空双字段，避免旧档后续静态修复误读。

## 场景、演出与真实路线

- staging.mjs 末尾合并独立 GOOD_GRIEF_STAGING；STAGED_QUESTS 中 map 应与 quest.map 一致，requireStaging:true 保护直接 completeQuest。
- staging 的普通 release 自动设置 staged_ID 后 beginObjective，所有中间步可恢复；移动经碰撞图，sceneKeys 必须声明可用中立镜头，镜头结束先 scene(null) 再 release。
- 演员条件在 stagingActors 过滤，同行会抑制同名在场演员；死亡角色用 fallen 且 interactive:false，并在跨剧情节点后隐藏，避免活人对话标记残留。
- runtime.scene 的 medicineCare 只匹配 route good、非 forsake、非 cult 和 g21–g24，因此不能复用其条件承载悲剧镜头。应加准确的悲剧段变体，避免影响 evil 同用的 m71 和较早 m16/m17。
- world.mjs 当前 m71 通用厅堂有多个邪线门，m49 也有旧通用捷径。routes.mjs 需按悲剧当前节点/旗标重建并屏蔽错误出口；只放行实际调查、安葬、赴楼、尾声所需路线。
- 路由缓存将 quest/when/requiredFlags/requiredAnyFlags 纳入 key；新增纯路线旗标若不进入上述集合，需保证旗标提交伴随 quest 切换或显式纳入 cache key。

## 验证要求与旧测试影响

专项：旧各版本 numeric/ID 映射；未完成/已 claimed/已 done gBad1；活动/失败/胜利待交付/缺损战斗 gBad2；已 done 未结束；合法旧结局；两次 reload 不重置；死亡与最后一击同时发生；retry/二次交互/二次领奖；所有新增节点精确 when；cult/evil/留宿分支不串线。

现有版本断言涉及 validate-good-rescue、validate-cult-route、validate-hut-night、validate-valley-care、validate-evil-docks、validate-first-meeting、validate-evil-dungeon、validate-valley-defense、validate-fullflow-revisions、validate-good-forbidden；应只提升“当前版本”等式，历史 fixture revision 不得批量改写。

validate-first-meeting 当前有旧 gBad2 保持本任务及资源、gBad1/gBad2 legacy 前置可达断言。validate-combat-progress 明确测试 gBad2 不可只以 after 提交，其 persistent 胜利合同必须保留。初审时 validate-tower-valley-night/data/world 沿用蔷薇葬礼直接进入 gBad1 的旧假设。后续来源核验发现中间有天山封路战；R17 已将新流程入口修正为 gBad_road，同时为既有 gBad1/gBad2 保留有界历史通行。

最后须浏览器实际走完调查→安葬→赴楼→胜败/重试→后事→尾声，观察死亡人物、同行、地图出口、镜头结束及刷新，不以 fixture 模拟代替实玩。原版具体情节/数值未由本审查确认。

## 集成合同更新

后续独立机制核验改变了终战合同：新游戏应采用 44 名敌人和纳兰潜凛，胜利条件只要求纳兰倒下。前文“保留 count 1”的建议仅适用于升级中既有的 R16 单首领存档，不适用于 R17 新游玩。新任务采用 count 45 / victoryTarget boss；旧悲剧终战设置显式 goodGriefLegacySingleDuel，并通过 legacyCombatCount 恢复单首领声明，保留其 HP、计时器、战败与击杀收据。不得把旧单首领兼容模式宣称为新流程忠实战斗。新进入的 gBad_road 也单独采用真实封路战的全清门槛；旧已在 gBad1/gBad2 的存档使用 goodGriefLegacyNews 跳过历史入口，不伪造新战斗已完成。具体原版定位与核验范围记录由来源审查文档负责，本文件未读取原版。

## 迁移落实与当前检查

已新增 good-grief-migration.mjs，并接入 runtime revision 17、旧 R16 ID 表、恢复顺序和结局同行双字段清理。既有报信入口使用 LegacyNews；既有终战使用 LegacyRevenge/LegacySingleDuel；已提交终战但未结束使用 LegacyDuel 转后事。不同 legacy 标识只代表历史摘要，不计入新增剧情 done 或场景完成。validate-good-grief-migration.mjs 覆盖旧版数值/ID入口、奖励账本、缺失前置旗标、单首领受损战局、死亡重试、待交付胜利、缺损证据和早期未知击杀奖励抑制。该检查不验证原版忠实度，也不替代 R17 实际浏览器与演出中间帧恢复验收。

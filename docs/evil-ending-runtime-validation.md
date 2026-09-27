# R18 邪线结尾：运行时与旧档验证

核验日期：2026-09-27。本轮仅根据已完成的机制概述 docs/evil-ending-reference.md 独立实现；没有重新读取原版目录，没有复制原对白、脚本、媒体或配置。剧情和原作机制的已核范围、网页原创适配及未知细节以该概述和 evil-ending-revisions.mjs 中的证据声明为准。

## 版本冻结

R17 的 243 对 [id, encounterTier] 已用 wx 写入被忽略的 work/revision-seventeen-quest-baseline.json。写后重新读取并逐字比较紧凑 JSON，且 R18 合并后通过 REVISION_SEVENTEEN_QUEST_IDS 重建全部 243 对再次比对：

- 紧凑 JSON SHA256：643e3e00c4757077a56d78d914a73b0fe905ae32c60e70f9c947c1354cdfc024。
- 基线文件 SHA256：54c90a68770154df7f8ea464585eac42b70db036bca943856908d2db89796328。

当前保存 campaignRevision 为 18。修订 1 至 17 的纯数字游标先经对应冻结身份表转换，再按身份迁移。原有测试里 18 处“当前保存版本”断言更新为 18；旧版本输入夹具没有改为新版本。

## 兼容合同

| 输入 | 恢复行为 |
| --- | --- |
| 有效历史 alone/family 结局 | 保持已完结，不强迫回放新段落，不补奖励或新任务记录。 |
| 旧 e13 未完成 | 保留八锁事实及资源；重新验证新增救人演出。 |
| 旧 e13 done，游标未前进 | 到 e14_report，记录明确的 evilFinalLegacyRescued 摘要，不伪造新报告已演。 |
| 旧 e14 未完成，包括活动战、已败、待领奖胜利 | evilFinalLegacyFourFight 保持四人协议，evilFinalLegacyGate 保留历史入口。名册姓名、最大气血、伤势、攻击计时、技能冷却、死亡和领取记录均继续按原协议恢复。 |
| 旧 e14 done 但没有有效结局 | 到 e14_recovery，记录 evilFinalLegacyBattleWon，不伪造新战斗或药局。 |
| 旧档停在既有远图 | 保留所在地图；沿有界旧路实际返回庄门或房间，不自动传送，不凭返回操作补报告/战胜旗标。 |

新开始的庄门战为 29 人同场全清，沿用冻结 tier 20；旧四人战明确保留旧数量和“来犯武人”姓名。庄门战普通死亡仍暂停并要求重试，失败不能进入结尾。

## 梦境结果与一次分支

梦战使用独立 dreamCombat:true 合同。四名敌人姓名和 sprite 声明在出生及恢复一致。击倒梦中敌人记入该场 defeatedIds，但不增加现实 kills、经验、银两或击杀奖励收据；该任务也不赠送战斗补给。

victory 必须有四人完整清场证据且结算气血大于零；dream-loss 必须是完整有效名册、准确 defeatedIds 及 heroHpAtOutcome 为零。保存刚好发生在有效 active 梦战且真实气血已经归零、尚未运行下一帧时，可在校验后补 dream-loss。已失败、缺失、损坏、重复敌人或伪造 after 不会变成合法梦败。真实普通战不能使用该结果。

合法梦胜和梦败都直接提交任务、恢复三值并转到父墓，无须零气血时走向标记，也不弹普通战败提示。提交前把完整 validEntry 克隆到 dreamCombatOutcomes.e14_dream，零气血证据不会因醒来恢复被抹去。evilFinalDreamOutcome 只是恢复自有效证据的摘要。待演父墓若失去有效归档，会回到明确失败的梦战检查点，可重试；原奖励收据仍保留。

参汤演出全部完成且完成条件满足后、选择下一任务之前，自动一次提交 evilFinalOutcome（alone 或 family）、evilFinalModel（web-v1）和对应互斥的 evilFinalCruel/evilFinalMercy。这里继续采用网页已有“evil 大于等于 3”原创适配，不能解释为原作 118 比较符已获精确验证。已保存的有效结果优先，之后修改总倾向值不会改道。

## 实际完成的验证

本代理运行：

- tests/validate-evil-ending-runtime.mjs：69 身份、147 迁移、7 战斗、25 梦战、6 分支用例通过。
- tests/validate-combat-progress.mjs：30 模块、14 实际引擎调用用例通过。
- tests/validate-evil-ending-world.mjs：42 脚点、254 路径、384 门锁、6 实际行走、79 旧图的 237 返回路径、11 牢门检查通过。
- tests/validate-good-grief-migration.mjs：71 身份、164 迁移、11 战斗用例通过。
- tests/validate-good-grief-world-combat.mjs：17 战斗、53 路线、168 脚点、604 路径通过。

战斗验证明确使用有界的气血夹具配合实际 cast/hurt/tick/retry/restore/completeQuest 调用；这不是玩家自然通关，也不是原作数值或画面等同证明。本文件没有把自动测试通过、事件数或模拟通关当成完整复刻。实际浏览器交互、画面和自然行走验收由主任务另行记录；本文件不宣称已替代该验收。

## 集成复核后的补充修复

只读复核发现并复现两处边界，随后获主任务授权修复：网页手动/导入读档只替换现有引擎状态，没有经过构造函数的自动醒梦；以及负气血的损坏 active 梦战误入了小于等于零的死亡恢复路径。

现在启动和网页 loadState 都调用同一个 resumeLoadedState 收尾入口。网页在清理交互和关闭面板之后调用，再保存已转父墓且包含完整归档的状态。瞬间梦败恢复只接受恰好为零的气血，负数仍是失败记录。

新增 10 例已经执行通过：4 例负气血（active/已标梦败各两种）；6 例实际读取 journey.js 的 resetRuntime/loadState 源码执行手动与二次 restore 的导入路径，覆盖胜利、已记梦败、HP0 尚未下一帧三种检查点。只对文档/面板显示设置桩，任务提交、恢复、归档与保存调用使用真实实现。每次保存都检查已经到父墓且归档完整；第二次加载仍不增加奖励或重复领取。这些测试仍不替代实际浏览器验收。

## 实际浏览器发现的入梦图片缺失

主任务浏览器从长夜连续进入四人梦战时，画面仍显示卧房。根因是同一真实地图上的 quest 事件只刷新任务文字，没有触发场景图片准备；梦战的 battleScene 也没有 sequence.sceneKey，导致图片失败时可以静默退回现实房间背景。

现 quest 事件同样触发 sceneIntro；所有动态场景共用带 sceneId/art/递增 token 的等待与失败重试流程。未加载完成时不推进演出或战斗，直接攻击和交互也被阻止。dream battleScene 必须成功加载其独立图片，失败时显示重试提示并保持等待，指引按钮会重新请求该图。专属人物加载与人物头像代码保持独立。

新增 tests/validate-evil-ending-scene-loading.mjs 已执行通过：两条从 e14_sleep 的真实演出自然推进到四人梦战的路径（一条正常、一条首次图片失败后实际 track 重试），直接执行 journey 的图片加载、任务事件、sceneIntro 与重试函数。图片完成由受控 Image 桩模拟，最终使用实际 Renderer.backgroundImage 断言画的是 evil-final-dream。测试也核对加载未完成期间不能开战、不能攻击或交互、梦图不加入现实 visited。它不只构造一个已进入梦战的状态，仍不替代主任务的修复后浏览器截图。

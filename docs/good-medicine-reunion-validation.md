# R16 求医、返庄与首谈验证

2026-09-24。本轮从 R15 提交 755d1b0657f58fca5cee7c05e1ed45557042a1e4 继续。实现为独立编写的网页逻辑；参考机制、原创表现与未确认细节分别见 [参考核验](good-medicine-reunion-reference.md)、[场景核验](good-medicine-reunion-world-audit.md)。本报告记录状态机与生产 UI 函数验证，不以模拟流程、任务数量或测试通过证明完整复刻。原始缺陷保留在 [R15 审计](good-medicine-reunion-current-audit.md)，不会因本轮修复而改写历史结论。

## 首谈、同行与结局恢复

- g23 在樱花谷显示紫轩和月眉儿两个实际角色。必须接近所选角色（使用现有距离函数，阈值 135）才提交；远处伪造标记坐标、通用 choose、裸 complete 均不能建立或完成首谈。
- 首次交互先记录 choices.g23 和静态分支，再发 firstMeetingCommitted 由生产 journey 保存，之后才显示结果对白。刷新后只可继续既定人物的交谈；对话完成回调才结算 g23。所选 NPC 的位置用于后续跟随起点，交谈期间不会重复绘制一个跟随分身。
- companions 数组保存双人同行，并同步旧 companion 别名。旧逻辑直接清空或替换 scalar 时仍有优先兼容；角色列表去重并只接受项目已有四位同伴。已领取但未完成的 medicine 节点使用 repairCompanions 修复静态队伍，不追加奖励。
- R1–15 数字游标先按各修订冻结身份映射。旧 g22 未答回到返庄治疗；已答回到新增休息，不重复好感；已到首谈的历史跳过新增求医前置，明确标记 goodMedicineLegacy，不能据此宣称已经播放新增演出。
- 已有 choices.g23 对 firstWoman 和两布尔分支拥有权威。只有合法 firstWoman 摘要但无 choice 时保留摘要，不伪造新选择。gBad 链记录恢复 forsake。仅 old<16 且当前或 done 明确处于坏链时补 goodTowerValleyLegacy，以恢复旧任务门槛；不伪造蔷薇埋葬或新的演出完成。未知旧终战存档回谷中实际补谈，保留历史 done/claimed 和资源，再回原待续节点；不默认 reunion。
- 当前运行时若终局缺失分支，会在写 done 和领奖前退回实际补谈，完成后返回原待结局任务。无效 finish 参数不再默认生成 reunion。已结束的旧档保留记录的 ending。
- 旧 done.g24 的陈旧未结束游标进入后事，用独立 goodMedicineLegacyFinalDuel 表示历史，不假写新战斗完成旗标。

## 已执行检查

| 检查 | 结果与范围 |
| --- | --- |
| validate-first-meeting.mjs | PASS：22 组边界检查与 135 个 R1–15 迁移用例。两分支实际寻路靠近，提交前后刷新、他人不可改选、重复结算、陈旧奖励、单双人同伴兼容、缺损终局恢复、普通终战的血量/攻击冷却/英雄冷却不丢失及一次领奖。|
| validate-story-ui.mjs | 原 27 组 PASS；新增 2 组生产 journey 的 DOM 桩验证 PASS：真实演员入口、对白前 localStorage 已记录首谈、无首谈菜单、刷新继续到正确后续。DOM 桩不是浏览器视觉验收。|
| validate-choice-transactions.mjs | PASS：141 检查、16 旧档用例，选择事务与原分支恢复未回归。|
| validate-long-journey.mjs | PASS：两难度各六结果、开局分支及原有收集/技能/保存检查。g23 驱动已改成实际 actor marker 寻路交互，结果事件才完成，未用通用 choose 冒充首谈。此运行早于后续晨光专门修正，不能覆盖后续视觉变更。|

运行时修订号已从 15 改为 16。最初受影响的旧 good-forbidden/good-rescue 固定 revision 15 断言，以及 valley-care 严格 flags 白名单出现预期兼容失败，已将具体位置交由根代理更新；本表不将那些初次失败伪记为通过。最终整条 npm test、HTTP 和 Cloudflare dry-run 由根代理完成后补记，本文此阶段未声称已执行。

R15 独立冻结基线位于忽略目录 work/revision-fifteen-quest-baseline.json，共 228 对 id/effective tier，写入使用 wx；文件 SHA-256 为 3638290515eafba30d1355674cb2bc3afaf75e84e2ca0983b172f4400459018b；紧凑数组 JSON SHA-256 为 798188d83c0d583daafc28c437047fc244c29ec141b14fa2398b82d8cd71f525。新首谈专项用后者核验导出的 R15 身份和原战斗强度，没有用新任务表生成新的 expected。

## 验收边界

本文不覆盖原游戏目录核验、不代表真实浏览器全程体验或版权法律认证。场景/台词/动画为独立实现。本轮最终战仍为项目已有单首领战；参考中的十名守卫尚未实现，不能将终战称为已完整复刻。坏线后事与其他未确认内容也不能由上述首谈测试推出已还原。实际浏览器、演出逐步恢复与最终部署预检证据应分别记录，不混写成一次同快照全量验收。


## 最终集成检查

完整npm test共38个脚本通过，退出码0，日志work/r16-frozen-npm-test.log；包括后续独立审查新增的旧g22已领奖但答复缺失重复好感回归，首谈专项最终30组检查及135旧档。完整回归后仅调整尾声句号/去除旧制作说明及首谈寻路按钮不替玩家选人，validate-interface与validate-story-ui再次通过；后者两个首谈用例新增追踪不提交的断言。

独立审查实际走了旧unknown g24的四种往返回路，并发现/修复旧已领奖g22重复+2好感。迁移仅在该历史证据成立时开启静态选择恢复，正常新选择仍保留+2/0。无关任务身份通过明确ID门槛隔离，矛盾evil游标/good旗标的旧夹具不被求医迁移卷入。

匿名HTTP检查通过：104游戏资源200及13非发布路径404，不使用登录、认证挑战或会话Cookie。Cloudflare本地Wrangler4.130.0静态dry-run通过，读取105静态文件，无绑定；没有云部署。部署脚本/版本按已安装help和项目锁定依赖核验，未升级依赖。最终输出不含原目录资源。

视觉与动作证据另见good-medicine-reunion-browser.md。自动检查和局部实际游玩不能代表全流程复刻达标。

最后视觉修正：诊院蔷薇使用既有groundSeated绘制（避免sit通用病床覆盖物），原角色床上姿势未改；17分支/371恢复演出专项再次通过，真实浏览器截图已检查。首谈追踪按钮的生产UI专项与实际浏览器均确认不自动选人。

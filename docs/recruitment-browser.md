# 招揽、拒绝与死亡：浏览器记录

2026-09-22，缓存 Playwright CLI，独立会话 recruitment-smoke，http://127.0.0.1:8787 。起点是 e05 的17级普通难度章节测试档（气血908、内力420），不是自然开局档；此后到 e07 的移动、战斗、拒绝、重试均由真实界面/键盘推进，未再注入剧情进度或物品。

## 已实际操作

1. e05 走近纳兰潜凛，推进救援对白，按住 J 应战。实际受到伤害，必败后恢复至227/908，进入招揽，没有普通再战弹窗。
2. 连拒两次，选择仍停在 e05，界面标明已拒绝2次。刷新后从追踪按钮重开选择，计数保持2；第三拒结束于“此程中止”。保存 phase=failed、refusal_e05=3、hp=0，无 done/claimedRewards。
3. 死亡后再次刷新，仍显示中止界面，没有自动进入 e06。点击“回到最后一次答复前”，明确返回第3次答复，改选接受后进入 e06；failure 清空，e05 的 done/claimed 各一次，计数回2。
4. 继续 e06，选择“拒绝动手”并读完现有对白；随后沿出口从 m71 实际步行进入 m57。e06 的死亡动作当前仍是文字，本记录不能证明它已完成场景演出。
5. e07 推进身份揭露对白，真实按 J 与月眉儿交手，实际败北后进入第二处招揽。第一拒后刷新，仍可继续最后答复；第二拒使旅程中止。此时 refusal_e05=2、refusal_e07=2，彼此独立；done 只有 e05/e06，没有提前完成 e07。
6. e07 死亡后刷新仍中止。点击返回答复前，改选加入飞龙堡，继续后续任务。最终控制台0错误、0警告。

## 图片

- [摘星楼败后招揽](../output/playwright/recruitment-e05-after-duel.jpg)
- [第三次答复前](../output/playwright/recruitment-e05-last-choice.jpg)
- [三拒死亡](../output/playwright/recruitment-e05-failed.jpg)
- [返回答复后接受](../output/playwright/recruitment-e05-retry-accepted.jpg)
- [禁地败后招揽](../output/playwright/recruitment-e07-after-duel.jpg)
- [两拒死亡](../output/playwright/recruitment-e07-failed.jpg)
- [加入飞龙堡后续](../output/playwright/recruitment-e07-retry-accepted.jpg)

## 证据范围与未完成项

拒绝次数及后果参考独立记录 recruitment-reference.md；产品对白、伤害数值、重试入口和路线布局独立实现。两处当前通过场景战斗与明确失败状态表达；最终杀手动作、e07假面/开门/读信尚不是独立动作演出。返回最后答复前是网页便捷设计，不能据此声称原版存在相同恢复行为。

本次没有验证 g15 正转邪后续，没有进行全邪线自然通关，也没有发布云端。

## 结果对白中断补验

完成上面的连续章节后，另建e07最后答复前的定点测试档（refusal_e07=1、HP75、金创药5），只验证新修复的提交时点。点击拒绝后未读完致死对白，存档已是failed/count2/hp0；此时按Q无恢复，刷新直接显示中止页，按Esc仍保持面板打开，药品仍5。截图： [对白首句已提交](../output/playwright/recruitment-answer-committed-mid-dialogue.jpg)、[刷新后保留失败](../output/playwright/recruitment-failed-refresh-final.jpg)。最终控制台0错误/警告。Runtime负例另外验证死亡原态和读档态调用两种药都不消耗物品或恢复HP/MP。

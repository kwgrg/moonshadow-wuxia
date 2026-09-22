# 正转邪路线真实浏览器记录

日期：2026-09-22。会话：`cult-route`，Playwright CLI 有头浏览器；页面 `http://127.0.0.1:8787/`。本文记录从 **g15 章节定点存档** 开始的接受链，以及另一份独立定点存档的三次拒绝。不是从开局自然练级、取得物品后连续通关，也不能证明原作全流程、地图或数值完全一致。

本次没有访问或提取原版目录。剧情依据沿用 [招揽参考记录](recruitment-reference.md)，独立表现及数据边界见 [路线审计](cult-route-audit.md) 和 [舞台记录](cult-staging.md)。

## 起始 fixture 与操作边界

两条测试分别只在起点写入一次章节存档，随后只用实际界面、键盘、保存、刷新和普通重试推进，没有修改敌人 HP、战果、后续地图、阶段或剧情旗标。

| 项目 | 初始值 |
| --- | --- |
| 任务、地图 | `g15`，`m61`，`phase:talk`，campaignRevision 4；位置取当前地图正常 spawn。 |
| 难度、操作 | 普通难度，现代操作，高画质，动画开启。 |
| 主角 | 15 级，HP 832/832，MP 390/390；家传剑、布衣。 |
| 武学 | 已学 1–6，熟练度各 20；快捷栏 1、2、3、5、6。不含邪线后续 7–9。 |
| 补给与财物 | 金创药 12、补气丹 8、银两 1500；物品栏空。 |
| 分支 | `route:good`，`moral:0`，`evil:0`；没有 cultPath 或任何 cult 完成旗标。 |
| 记录 | done、claimedRewards 均为空，kills 0；这是定点 fixture，不伪造此前章节完成记录。 |

实际使用主线追踪步行、地图出口、继续对白和选择按钮；战斗使用 J 普攻、1–5 武学、Q/X 补给，并曾用 A 与空格撤步。读取 localStorage 只用于比对实际状态。完成接受链后，通过游戏保存界面存入手动槽 1，再另起三拒 fixture。

## 接受链实际经过

| 阶段 | 实际观察 |
| --- | --- |
| g15 答复 | 到纳兰面前完成对白，选择接受。只产生 cultPath，下一任务为 gCult_wudang，仍未完成游戏；不播放留楼救人的拒绝后续。 |
| 武当 | 从厅堂实际步行出图至 m5；完成战前对白，生成 39 敌、27 友。修正起点后通过真实攻击、武学和补给清除全部敌人，20 名友军存活。 |
| 战后回楼 | 39 人清除后进入 after；当时尚无 cultWudangCleared。完成战后对白才提交清场旗标，实际返回 m61，开始授职。 |
| 授职 | 主角走近纳兰，出现令符与转向地下的演出；结束才有 cultAppointed。随后经实际出口到地牢。 |
| 蔷薇 | 到第一处牢位；对白后发生出手、倒地，完成才写 cultQiangweiDead。刷新后倒地状态保持，没有复活或与尸体对话。 |
| 紫轩 | 另一牢位独立触发；蔷薇保持倒地，第二次出手后紫轩倒下。随后纳兰离开，完成才有 cultZixuanDead。 |
| 离别 | 实际离开地牢至客房，真儿先走向门口并隐藏，眉儿随后离开。两旗标在这一段完成后产生，没有提前跳结局。 |
| 尾声 | 自动进入时间过渡，纳兰倒下、继位静修、主角独处；最后 release 才显示“教主孤影”结局。 |

最终状态为 `ending:cult`、`completed:true`、`gCult_epilogue`、`r_cult_chamber`。done 与 claimedRewards 各自仅含 g15 和六个 gCult 节点，无 g16、塔层或悲线。清场、授职、两次死亡、两人离去、纳兰身故及尾声旗标按顺序自然生成，companion 为 null。

最终 HP 805/832，内力随后恢复至 390，银两仍 1500、kills 仍 0；没有新经书或武学。技能仍为 1–6，熟练度因真实施展变为 25、25、24、20、25、24。武当没有逐人金钱、经验或击杀计数奖励；战斗完成沿用网页补给 **金创药 +1、补气丹 +1**，不是原版掉落认证。本次实战用了 2 份补气丹，故最终金创药 13、补气丹 7。后五段没有物品、金钱、经验或技能奖励。

## 战斗缺陷、修正与真实刷新

初次加载的版本把主角放在敌方阵前附近 `(901,535)`。尚未有效操作即被击倒，39 敌、27 友仍在；这是本次发现的可玩性问题。主任务随后将首次和重试起点改为原创友方阵前 `(580,810)`，未降低敌方 HP、伤害或人数。第二次仍是旧加载页面，使用撤步和攻击后退出包围，但工具间隔未持续操作，最终在击倒 15 人、友军全灭后再次失败。

刷新失败存档、加载修正版本后使用界面“再战”，重新出现完整 39/27 阵容。正常操作完成本次成功战斗。此成功说明给定章节装备与补给可以取胜，不代表原作战斗平衡已经匹配，也不代表无需主动操作即可存活。

成功战斗中在击倒 37 人后打开实际保存面板暂停并保存，再刷新。刷新前后再次通过界面保存读取，以下值相同：

| 保存项 | 刷新前后 |
| --- | --- |
| 阶段与失败标记 | battle，failed false，尚无 cultWudangCleared。 |
| 主角 | HP 805；MP 283.37340000000006；位置 `(748.8229021150581,508.45489146545435)`。 |
| 已击倒 | 37。 |
| 两名存活敌人 | cult-wudang-enemy-10 清宇 HP205；cult-wudang-enemy-26 清旭 HP181。 |
| 存活友军 | 20。 |

关闭面板后用真实普通攻击和武学击倒最后两人，再继续路线。没有在浏览器里改任何敌人 HP 或伪造清场。

技能冷却/蓄力精确恢复、同 tick 主角与最后敌人同亡优先失败、战后纳兰不重复绘制由主任务另增自动检查；不能把上述一次真实刷新扩展为这些全部边界都已由本次浏览器覆盖。

## 三拒独立定点与恢复

| 时点 | 实际结果 |
| --- | --- |
| 第一拒绝后 | refusal_g15=1，moral=0，HP832，无 cultPath、失败或结局。 |
| 第二拒绝后 | refusal_g15=2，moral=0，HP832；显示最后答复的警告。 |
| 第二拒绝后刷新 | 次数仍为 2，moral 仍为 0；用主线按钮重新打开答复，没有重新战斗或重置计数。 |
| 第三拒绝后 | 自然进入 g16 talk，moral=2，HP832；cultPath 为假，failure/ending 为空，completed 为假，done 仅 g15。 |

没有继续完成 g16 救援，也没有在浏览器另测第 2/3 轮接受；这些答复入口由自动测试覆盖。三拒端点与接受端点没有串线。

## 画面、后续修正与范围

本次蔷薇倒地后刷新按 E，尸体没有对话或复活；但当时旧 UI 在缺少附近有效交互时转向了下一主线。主任务后来修复空 E，另一独立浏览器会话在原进度回访实测坐标不变、没有对白，见 [舞台记录](cult-staging.md)。本文不把早期截图当作最新版空 E 验证。

本会话的地牢截图使用当时的原创 cave 背景与道具布局。之后新增的专用原创地牢图不在这些过程截图中，其加载及空间边缘需以 [地牢美术记录](cult-dungeon-art.md) 和后续浏览器复核为准。角色动作是独立图集配合移动、姿态和剑光，尚非完整逐帧动画；地图细节、碰撞与视觉边缘也不因路线可达就获得原版一致性证明。

本地预览可直接游玩，没有登录步骤；自动存档、手动保存与刷新恢复在本次实际使用。未在本子任务执行线上 Cloudflare 发布或另跑匿名资源扫描。整个会话浏览器 console 为 **0 errors / 0 warnings**；其中一次保存按钮动作被死亡面板拦截而超时属于 Playwright 操作失败，已通过正常失败/重试继续，不计作浏览器 console 错误。

## 截图

文件均位于仓库 `output/playwright`，为本次网页画面，不是原版素材：

- [g15 初始答复](../output/playwright/cult-g15-choice.jpg)
- [修正后武当起点](../output/playwright/cult-wudang-fixed-start.jpg)、[战中刷新后继续](../output/playwright/cult-wudang-resumed.jpg)、[39 人清场](../output/playwright/cult-wudang-complete.jpg)
- [授职](../output/playwright/cult-fullflow-appointment.jpg)、[蔷薇倒地](../output/playwright/cult-fullflow-qiangwei-fallen.jpg)、[紫轩倒地](../output/playwright/cult-fullflow-zixuan-fallen.jpg)、[地牢两段完成](../output/playwright/cult-fullflow-dungeon-complete.jpg)
- [离别](../output/playwright/cult-fullflow-farewell.jpg)、[真儿先离去](../output/playwright/cult-fullflow-zhen-departed.jpg)、[纳兰身故](../output/playwright/cult-fullflow-nalan-fallen.jpg)、[完整接受链最终结局](../output/playwright/cult-fullflow-ending.jpg)
- [第二拒绝](../output/playwright/cult-refusal-second.jpg)、[刷新保留答复](../output/playwright/cult-refusal-reloaded-choice.jpg)、[三拒进入 g16](../output/playwright/cult-refusal-good-route.jpg)

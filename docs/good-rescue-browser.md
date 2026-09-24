# 善线救援至入塔：实际浏览器记录（revision 14）

2026-09-24，Chrome / Playwright CLI，1280×720，本地匿名 Wrangler 页面 http://127.0.0.1:8787/ 。只用按钮、键盘、实际寻路、刷新推进；读取 localStorage 作为旁证，没有写任务、坐标、敌血或旗标来推进。

## 起点与边界

接续 [上一章真实试玩](valley-defense-browser.md) 留下的 valley-defense 会话：g15 / m61 / choice，0次拒绝，64级、2892气血、1310内力、1740当前经验、500银、2药3丹。该角色来自上一章一次性30级章节QA起点，经过网页独立等级曲线的传功结算；不能称从新游戏自然通关。本轮没有重新播种存档。原存档为 revision 12，刷新迁移到新版本；已有禁地历史明确保留为 goodForbiddenLegacy，没有伪记新禁地演出。

设置存储始终为 null，使用默认普通难度。高等级角色使用群攻清阵较快；以下仅证明这些交互和恢复实际执行，不能据此认定难度、动作或原版数值已还原。

## 实际经过

1. **三拒与44敌破围**：通过真实选项三次拒绝，转 g15_escape。观看纳兰离开后进入44敌战。检查间隔不攻击，主角被真实AI打倒；刷新保留失败与0/44，普通“再战”重开。用J、数字武学和清心咒实际清场，44敌归零、主角2622HP；仍500银/1740经验。后续交互才写 goodRescueHallCleared，实体出口进入地下。
2. **28敌在场时救紫轩**：进入原创地牢立即有28守卫。点击“救出紫轩”并奔跑接近，触发 step2 救援对白；当时主角2433HP、28敌全部存活。在此刷新，仍是同一演出步骤与28敌。读完对白并看完扶起、移步动作后，phase回 battle，staged_g16=true，28敌仍存活，尚无 goodRescueZiFreed，仍500银/1740经验。没有清敌、钥匙或假胜利条件。
3. **带人撤出**：紫轩转换为跟随角色。用清心咒后点击“返回楼上”，实际跑到左侧返楼石阶，抵达空厅才转 g16_homecoming、写 goodRescueZiFreed、一次增加65经验/15银（1805/515），companion=紫轩。这次实际浏览器覆盖冒险救人分支；先清28人再救、释放后死亡重试、缺失名册和远距离提交等由专项检验，不能混称全部实际手打。
4. **归谷到点安置**：刷新返楼后的存档，沿摘星楼议事厅→倚天山归路→寒波谷归途→寒波谷小筑近旁实际步行。到达地图时仍同行，尚未安置。靠近院前发生安置演出，step4对白处刷新再继续；紫轩止步屋前，主角离开，演出结束才写 goodRescueZiSettled 并清空同行。没有强制穿过卧房。随后走小筑近旁→寒波谷归途→寒波谷外山路→惠安镇南郊。
5. **27追兵与眉儿败北**：开场27敌、月眉儿2800HP。停止攻击后真实AI使眉儿归零，主角仍2784HP，失败原因 rescue-mei；刷新后的面板明确说明眉儿倒下。普通重试，实际J与群攻清敌，最后眉儿2464HP，仍515银/1805经验。战后交谈才提交原任务一次65/15。随后独立脱险演出里眉儿说明通天塔消息、自己走离，写 goodRescueMeiDeparted，companion仍为空；她没有跟随主角返庄。
6. **第二次返庄56敌**：从南郊直接进入山庄。早期 manorInvadersCleared 已为true，但仍要面对新56敌，其中有辛楚；没有沿用此前丁戈清庄战果。实际清场后刷新保留after，再交互确认出口。新任务不额外发经验、银两或战斗补给，仍530银/1870经验。
7. **敦煌路线与飞龙堡56敌**：实际经过山庄→敦煌外山道→敦煌洞口通路→飞龙堡前山径→飞龙堡。此处独立56敌没有辛楚。击败9人时打开设置再刷新，UI仍9/56，接着用实际技能完成。清场时仍530银/1870经验，确认后门交互才结算旧任务一次65/15至545银/1935经验。
8. **沙漠与入塔**：从飞龙堡实体后门进入原创沙漠，实际沿砂路抵达通天塔第1层。最终 gTower1 / m62 / talk，等待开始塔内旧任务。没有直接从堡跳入塔，也没有两位已安置女子继续同行。

最后浏览器控制台：Total messages 0，Errors 0，Warnings 0。本轮没有账号、服务器存档或云端部署。

## 画面与截图

截图位于被忽略的 output/playwright；不是原版资料或发布资源。已目视查看 good-rescue-zi-approach.jpg、good-rescue-hanbo-settlement.jpg、good-rescue-desert.jpg：地牢人物在囚室/地面范围内，小筑安置止步屋前，沙漠中央有连续可走砂路。三张背景均是纯文本独立生成，无原版输入，完整制作记录见 [地牢](rescue-dungeon-art.md)、[小筑院落](hanbo-hut-yard-art.md)、[沙漠](desert-passage-art.md)。制作记录不等于授权或法律结论。

其他截图：good-rescue-hall-start.jpg、good-rescue-hall-failed.jpg、good-rescue-dungeon-entry.jpg、good-rescue-zi-following.jpg、good-rescue-hanbo-arrival.jpg、good-rescue-mei-start.jpg、good-rescue-mei-failed.jpg、good-rescue-mei-departed.jpg、good-rescue-manor-start.jpg、good-rescue-fort-partial.jpg、good-rescue-tower-arrival.jpg。部分截图带有对话/设置覆盖层，不能作为完整场景可见性证明。

## 尚未完成

敦煌现在只有独立通行段，十洞内部迷路/机关尚未核验实现。多个山路仍复用本项目背景，角色原型重复、出招和受击动作不足、敌群拥挤、文本标签重叠、对白遮挡、战斗成长与难度平衡仍有明显差距。后段结局和早中期更多压缩行动仍待修正。证据、独立表现和未知项见 [参考概述](good-rescue-reference.md)，自动检查见 [验证记录](good-rescue-validation.md)。本段走通不表示全流程复刻完成。

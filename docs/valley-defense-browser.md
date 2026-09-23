# 清庄、传功与查空屋：浏览器验收

日期：2026-09-24。Chrome / Playwright CLI，1280×720，本地 Wrangler http://127.0.0.1:8787。原会话已关闭、旧预览端口不通，重新启动后继续核验当前 b567253 及下述实际游玩修复。

## 起点与边界

只在新会话起点装载一次 g14_dock_report / 中原码头章节 QA 存档：30级，HP1600/MP800，经验0，500银，5药3丹，基础装备，已学前段可得武学1–6，hotbar为1/2/3/4/6。done中的g13是明确的章节前提，不表示本轮玩过禁地。设置为空，游戏采用默认普通难度；没有选择赏景重试。

使用sessionStorage一次标记，刷新不重新播种。之后只点击寻路、继续、再战及实际J/数字武学/Q按键，不写引擎状态、敌血、坐标或完成旗标。只读localStorage用来核对实际存档。以下是章节实玩，不能称全流程自然通关。

## 实际过程

- 走近码头铁云、听完急报，经惠安镇南郊返回悲魔山庄；丁戈前奏结束后进入55敌战。
- 第一场进入战斗后未作战，在检查间隔中被打倒；不是检测即时死亡的计时实验。刷新仍显示再战、55敌存活、0击破，没有获得银两/经验。通过“再战”普通重试。
- 持续J攻击，交替使用现有武学与Q药物。UI进度实际出现0、9、11、51、54，最终55/55。剩余敌人0、失败标记false，角色仍30级/0经验/500银；用掉3药，保留2药。无需写死敌人HP或跳过战斗。
- 实玩发现战后提示和主目标错误沿用丁戈。已修为“检视山庄”的无人物交互点与主角独白；刷新保留55人战果，未复现可交谈丁戈。随后实际走到落叶谷。
- 孟知秋保持活人的地面坐姿及老者头像；两人近前、坐下，完成传功与托付后起身。flowing阶段实际刷新：仍是g14/staging/step9/flowing，30级、经验0、500银，claimed中尚无g14，没有提前发奖励。
- 演出结束后一次结算：30级/0剩余经验变64级/1740剩余经验，按本项目各级阈值累计恰增100000。500银保持；刷新后成长不变。等级曲线是网页独立实现，不代表原版数值系统。
- 步行离谷，进入寒波谷归途，听主角担忧紫轩；实际进芭蕉小筑，在空屋中行走寻人后决定先救其他人。再出屋经寒波谷，进入摘星楼议事厅，最终到g15招揽choice、拒绝数0、choices仍为空。
- 最后刷新仍是g15/choice、64级/1740经验/500银。刷新默认关闭对话浮层，点击寻路交互后可重新打开接受/拒绝按钮；没有自动替玩家作答。CLI连续对白脚本曾误等“继续”而超时，复查确认当时已正常进入两项招揽选择，并非游戏卡住。

visited依次包含 r_mainland_dock、m41、m49、m51、r_hanbo_return、m16、m61。实际新done/claimed依次增加 g14_dock_report、g14_manor_battle、g14、g14_hanbo、g14_resolve。valleyManorReported、manorInvadersCleared、valleyPowerReceived、valleyHanboReached、valleyRescueResolved各在对应节点结束后产生。控制台查询0错误、0警告。

## 画面检查与修复

已实际查看截图。山庄清理了旧几何水池、门架、栅栏和路面覆盖层及对应虚构碰撞，保留独立temple背景与地形边界。战后“检视山庄”不会画出丁戈。孟使用NPC老者图格；衣摆尖角占位形在本轮改为原创圆润布料轮廓。传功气流由代码绘制；截图捕捉了两人地面坐姿和flowing检查点，但气流与亮地板的对比仍较弱，后续可改善，不能据截图宣称原版传功动画已复刻。

相关截图保存在被忽略的output/playwright：valley-defense-first-battle.jpg、valley-defense-retry-combat.jpg、valley-defense-cleared.jpg、valley-defense-meng-seated.jpg、valley-defense-transmission.jpg、valley-defense-empty-hut.jpg、valley-defense-rescue-offer.jpg。

受损谷院背景仍未完成，当前院落完好，与这段剧情尚有视觉差异；不能算作毁谷景观验收通过。原版目录未作为本次浏览器、渲染或图像输入。机制与原创表现边界见[参考记录](valley-defense-reference.md)，自动专项与部署预检范围见[验收记录](hut-return-validation.md)。

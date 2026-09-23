# 小筑两梦：实际浏览器记录

日期：2026-09-23；本地静态预览 http://127.0.0.1:8787，Chrome，1280×720。机制依据、原创设计和未知项见 hut-night-staging.md。原版目录本轮未读取。

## 测试起点与真实操作

hut-night 仅在开始时载入一次 e04 小筑章节 QA 起点，角色等级30、气血1600、内力800、剧情难度。该数值方便检验章节行为，不代表从开局养成到此或原版数值。此后点寻路、阅读战前对白、点击迎敌、实际按 J 出剑，击败610气血的紫轩，进入答复菜单；未写引擎状态跳过单挑。单挑结束气血1234、经验25、金钱150、击杀0。

在这个实际到达的答复断点导出独立浏览器状态，再用第二个隔离浏览器 hut-refuse 从同一断点检验不原谅。两支均从真实答复按钮继续，没有改写任务、演出步数或完成旗标推进剧情。

## 两支结果

原谅：原谅话别 → 紫轩靠近及离去 → 影枫歇下 → 樱花谷梦境 → 紫轩坐地后起身 → 真儿出现、离去消失 → 影枫追寻 → 紫轩消失 → 影枫再次寻找 → 醒回真实小筑。梦境对白断点刷新后仍是 hutForgivenessDream，返回 origin 为小筑620,450，再实际走至690,535。最终 e05、m16、evilHutForgiven=true、evilHutRefused=false、evilHutNightComplete=true。

不原谅：拒绝话别 → 紫轩直接离去 → 歇下 → 对应梦境 → 紫轩起身、卓非凡出现 → 紫轩向卓靠近 → 影枫出招 → 醒回小筑。梦中刷新保持 hutRefusalDream 与选择1，未混入真儿或另一梦的紫轩。最终 e05、m16、evilHutRefused=true、evilHutForgiven=false、evilHutNightComplete=true。

两支最终金钱165、经验90、气血1234、击杀0、背包空。新增离去和梦境任务奖励均为0，差额来自既有 e04 一次性完成奖励；拒绝梦中的攻击没有现实死亡、战利品或治疗。两个新增任务仅各完成和记账一次。拒绝支醒后重复按 E 六次并刷新，任务、选择、钱、经验、气血、背包、完成及奖励账本完全相同。两浏览器控制台均0错误、0警告。

## 截图发现与修复

初次实际截图发现上场战斗伤害数字和剑弧会冻结在梦境。startStaging 现清除短效、飘字、受击与冲刺显示计时，避免跨场残留。专项同时断言资源数值不变。

另一处是露天紫轩坐姿误走病床绘制，带被褥和“倚榻调息”。两梦紫轩现有明确 groundSeated 标记，使用自己的角色列、紫色衣摆和地面坐姿；站起后回完整站立图，病床人物仍保留原显示。hut-refuse-ground-seat.jpg 已目视确认不再出现被褥。

新角色头像、站立和透明边缘在实际梦境中正常；hut-refuse-zhuo.jpg 可见三人各在可走地面，没有错误格的人物碎片。画面仍以单幅原型和独立衣摆演出，不能称完整人物动画。

证据文件（本地QA输出，未作为发布资源）：output/playwright/hut-forgive-new-characters.jpg、hut-forgive-waking.jpg、hut-refuse-ground-seat.jpg、hut-refuse-zhuo.jpg、hut-refuse-waking.jpg。

## 验收边界

这只是两个新增梦段的真实交互验证，不是所有路线的连续真实通关。醒后回庄、真儿传讯蔷薇被带走目前仍被压缩进 e05 前情，尚未展开独立行动；不能用两梦完成掩盖该缺口。新背景与角色均为独立制作，不以原版资源作为输入。首次楼战另按独立章节起点验证。

## 首次摘星楼切镜与海边醒来

hut-first-tower 独立浏览器使用一次有效章节起点：e06_first_interlude、m34、evilIslandArrived=true、同伴纳兰真。首次准备时直接写存档再reload被旧页面pagehide覆盖，尚未进入该剧情；改用一次性sessionStorage守卫后有效载入起点，此后只进行UI交互和刷新，没有写任务或步数。该起点仅用于此段，未算作从前面梦境连续走到海边。

真实操作经过海边交谈、坐下、摘星楼切镜、教徒上前报告、纳兰近前与孟交锋、返回岸边。切镜目视只见纳兰、孟、教徒；两次出招后两人仍站立，没有主角、真儿或倒地结果。台词step15刷新保持towerFirstInterlude、步骤15和origin m34(945,735,dir1)，资源不变。

返回段逐帧截图：e06_first_interlude-37为影枫坐而真儿隐；e06_rest-4真儿出现；e06_rest-6已走到远端；e06_rest-11影枫站起且真儿隐。之后真实继续到e07_village、map仍m34、phase=travel，即追踪入口；本轮不声称已经进村。最终evilFirstTowerInterludeComplete=true、evilZhenMissing=true、companion=null，没有第二次楼战旗标；visited仅m34，done仅首次切镜和海边醒来。金钱150、经验0、击杀0、气血300、内力180、药5、丹3、背包空、技能及好感均与起点相同。控制台0错误、0警告。

截图统一在output/playwright/，前缀hut-first-tower-：cutaway.jpg、restored.jpg、report-approach.jpg、e06_first_interlude-27.jpg、e06_first_interlude-37.jpg、e06_rest-4.jpg、e06_rest-6.jpg、e06_rest-11.jpg、pursuit-ready.jpg。交锋与醒来截图已目视；首次楼战剧情缺口在此段已独立实现，未确认的原版精确操作、阵容与数值仍不作还原承诺。

最终截图复核另发现：真儿已离场但任务结算前，纪事栏仍按逻辑队伍显示“纳兰真同行”。界面现遵循当前任务隐藏同伴及切镜隐藏主角的显示规则，实际队伍状态仍在任务完成时结算。修正后story-ui回归通过；另建一次临时e06_rest步骤11视觉断点，浏览器显示“真儿……已经不在这里了”时纪事栏仅“已历0段江湖”，无同行文字。该临时上下文立即关闭，不覆盖正式首次楼战的真实流程存档，也不计为通关证据。截图 hut-shore-status-visual-check.jpg。

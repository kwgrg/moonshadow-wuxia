# 悲魔山庄报告与夜间两支演出

日期：2026-09-23。模块为 `public/manor-night-revisions.mjs` 与 `public/manor-night-staging.mjs`，导出 `MANOR_NIGHT_REVISIONS`、`MANOR_NIGHT_ADDITIONS`、`MANOR_NIGHT_STAGING`。本数据子任务只新增这两个模块及本文；campaign、运行时、迁移、地图、测试和美术由相应负责人接入。

## 参考范围

只使用已有 [只读机制核验](evil-docks-reference.md) 与 [实施计划](evil-docks-implementation-plan.md)。本轮未再访问原游戏目录，也没有复制、落盘或导入原脚本、对白、地图、媒体。新对白、演员坐标、动作秒数和状态事务均为独立实现。

定位元数据沿用参考文档：`72738a15` 对应悲魔山庄入口的 Event3100，报告及反应约第8–42行、夜间入睡与醒后出房约第72–119行；`4f536bd3` 对应 Event3110，相遇和计划约第1–70行、送房两支约第73–138行、天亮约第140–176行。它们是查找标识，未作为可部署资源。局部主题索引104110/104150/104170及 [攻略64–67节](https://vv0817.neocities.org/gametxt/15_jxqysp)、[NBE回庄段](https://www.nbegame.com/post/11646.html) 提供既有交叉记录，本轮没有重新抓取这些页面。

| 已核机制 | 本轮独立表现 | 边界 |
| --- | --- | --- |
| 铁云近前禀报后离开；报告涉及楼破纳兰死、孟携回蔷薇遗体、误认影枫已死、孟已返落叶谷 | 独立铁云演员走近，依次转述四项，影枫回应后铁云离场；月眉儿另行退下 | 是铁云转述，没有造主角亲见搬运遗体的镜头，不补未核携回路线。 |
| 报告后进入夜间，主角入睡、醒后首次出房 | 自己的房间内走到床边、坐姿、黑场、醒来、起身至门前；玩家穿真实门户进园 | 坐姿及黑场是网页睡眠表现，不声称原版相同动画或时长；不回血。 |
| 园中相遇、二人接近同行，先谈后续计划，再给送房选择 | 月眉儿出现，人物向园内移动，讨论利用旧日信任入谷，然后停顿并开放选择 | 不增加控制月眉儿的角色切换玩法；原善恶阈值的不同措辞尚未校准，采用中性共同对白，不冒充完整隐藏模型。 |
| 送她回房支同行入室、交谈与时间过渡 | 真实进入另一房间，条件化的送房对白、两人移至各自坐谈点、淡出度过夜间 | 不加物品、亲密值外的奖励、战斗或露骨内容。 |
| 独自回房支必须先月眉儿离去，再回房难眠、第二次起身、园中重逢 | 三个独立任务完成上述动作，之后真实走入她房中；夜谈只播放这一支的段落 | 不能选完独自就天亮，也不能先完成第二会面之前进入房内夜谈。 |
| 次日恢复白天，月眉儿留庄，影枫独自继续 | 园中 `manorDaybreak` cue时才天亮，辞行完成后清companion并保留通常交谈演员 | 入园的第一个画面仍是薄暗，不能按任务名立即白天；驻留至e10接应前，之后不在庄中留下分身。 |

## 任务、旗标与选择事务

| ID | 地图 | 必要前置 | 完成提交 |
| --- | --- | --- | --- |
| e09_report | m49 | evilZixuanDead 或 evilLegacyZixuanOutcome | evilManorReported、evilManorNightStarted，companion:null |
| e09_first_wake | r_beimo_hero_room | evilManorReported | evilManorFirstWoke |
| e09（保留） | m50 | evilManorFirstWoke 或 evilLegacyManorPrelude；先完成本场演出 | evilManorDecision及独占evilMeiEscorted/evilMeiAlone |
| e09_part | m50 | Decision、Alone，且送房旗标不得同真 | evilMeiParted，companion:null |
| e09_sleepless | r_beimo_hero_room | Alone、Parted，且送房旗标不得同真 | evilManorRestless |
| e09_second_meeting | m50 | Alone、Restless，且送房旗标不得同真 | evilMeiSecondMet，companion:月眉儿 |
| e09_room_talk | r_beimo_mei_room | Decision；Escorted或SecondMet；两选择恰一 | evilManorRoomTalk |
| e09_morning | m50 | RoomTalk；两选择恰一 | evilMeiStaysAtManor、evilManorNightComplete，companion:null |
| e10_teaching（仅加门槛） | m51 | evilManorNightComplete 或 evilLegacyManorNight | 保留原授技奖励，不提前发放或重授 |

7个新增任务和保留e09都要求演出完成。只有独自支三节点使用 `when.flag:evilMeiAlone` 来跳过不适用任务；其余进度使用 requiredFlags / requiredAnyFlags，避免把每个里程碑都加入路线组合枚举。

保留e09的网页选择索引和权重：索引0送房为evil+2、mei好感+1；索引1独自为evil-1。选项即时提交Decision与互斥旗标，明确将另一旗标置false；送房设跟随，独自清跟随。e09与选项after均为空，具体后果由后续演出承担，UI须在选择提交后立即保存。这里没有改用原记录+5/-5，网页全部隐藏值模型仍未整体校准。

所有新任务及修正的e09显式 `xp:0,money:0`，没有物品、药品、技能、recover或战斗配置。sleep、淡出、时间过渡和次日辞行不能改变生命、内力、药品、钱财或经验。旗标与companion只有任务完成或选择事务提交；途中刷新不能领取结算或绕过动作。e10_teaching仅补前置，不改已存在的云生结海奖励。

## 演出与驻留契约

两次入睡共用睡眠动作结构，但分别归属first_wake与sleepless，使用各自staged和完成旗标，不能互相替代。黑场复用已有可渲染的 `dreamFade`，此处只是淡入淡出键名，并不制造新的梦境。全部跨地图转场仍通过玩家步行门户完成，没有scene步骤把现实map直接改成另一房间。

room_talk内送房和独自两段分别用逐步骤when隔离；共有入场、最后起身与退出步骤。两条旗标同时true或同时false时必须拒绝开启/恢复该演出；独自支还须有SecondMet。演员ID稳定，不在同一场生成两个眉儿。

morning的 `manorDaybreak:'day'` 在实际时间过渡中段设置，finalCues保留day；运行时在庄内四图依据NightStarted、当前序列cue或NightComplete决定光照。不得把任意旧任务index当作天亮，也不得提前提交NightComplete。

晨后驻留定义使用 `persistFlag:'evilMeiStaysAtManor'` 与 `legacyPersistFlag:'evilLegacyManorNight'`。普通演员为 `manor-mei-resident`，`residentUntilQuest:'e10'`，附独立dialogue数组；交谈应可重复但无任务推进、奖励或存档改写。默认内容只说留庄照看事务和路上留心，不假定旧档曾送房或经历第二次重逢。明确旧完成历史可展示驻留，但不因此造出staged_e09_morning。

legacyManorPrelude只用于旧e09确实已经到选择/结果的前置兼容；legacyManorNight只用于旧版确实已过夜间段的历史。尚未完成的新存档不得凭visited或无关done得到通行。具体迁移由主运行时负责人实现、测试，不在本数据模块伪造记录。

## 美术、几何与当前验收范围

主场m49复用项目现有temple图。铁云及主角脚点由地图负责人在现图通行层检查：主角760,650；眉儿865,675；铁云1030,495至940,565再至1200,800离开；眉儿向1140,780退出。铁云借用项目人物图集的弟子格只是独立人物原型，不声称原版铁云肖像已重建。

主角房、眉儿房、后园使用本轮独立新图，脚点集中在staging的P常量内，依完成图上的实际地面选取，不把提示词像素当碰撞依据。地图负责人已核主角房7个独立脚点的49点对、眉儿房9点的81点对全部可行；房内演出终点距真正出口仍超过170像素，release之后玩家必须继续步行出门。床边与坐谈点是原创清地脚点，不把人物强行塞入底图椅座。最终采用的花园日光图已由地图负责人实看并接入；P中的演员和动作点在新图清地上保持不变。最终世界专项报告80个脚点、2226点对逐5像素检查、10次实际地图交叉、两房读档、两分支/旧档方向门控及早期花园伏击兼容均通过。花园通m49出口采用385,540、主角房门425,295、眉儿房门1120,315；演出停步点仍留在门内，结束后由玩家继续走到门口。以上是几何与运行时检查，浏览器视效另行验收。

当前已完成两个数据模块语法检查及独立数据合同检查：新增ID不重复、权重与互斥旗标正确、无额外奖励、所有演出有release、演员引用有效、room_talk条件隔离、晨后驻留与中段天亮合同明确。任务/演员/旗标已同步运行时、地图与测试负责人。专项负责人已报告两条支路实际运行时演出202次恢复通过，其中32次移动中、28次等待/姿势；房内实际播放对白只走选中支路，daybreak cue前夜后昼，两支都能交给e10_teaching。本段注明这些是专项自动检查的报告，不能当作浏览器连续试玩。花园最终日光图已完成静态几何核查，匿名资源与浏览器连续行走仍待对应验收；全部专项断言与结果以tests/validate-manor-night.mjs和主验收记录为准。此文不会以8场演出或自动测试的数量声称原作全流程复刻完成。

未确认项目继续保留：原版房内精确布局和动画、角色控制权切换、善恶阈值对应每段措辞、全部原版存读档/离图行为、中原至山庄完整道路。已有证据支持的夜间两支动作在此落实；后续落叶谷与武当仍须按独立核验推进。

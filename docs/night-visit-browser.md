# 梦醒后主动夜访：实际浏览器验证

日期：2026-09-22，Asia/Shanghai。环境为本地 Cloudflare 预览 `http://127.0.0.1:8787/`，剧情版本 `campaignRevision=6`。使用独立 Playwright CLI Chrome 会话 `night-visit-check`，没有操作其他代理的原版参考或禁地追踪会话，没有登录，也没有发布云端部署。

## 范围与起点

本次从 **e06_night 定点章节存档** 开始，连续操作到完成 e06_escort、进入 e06_ferry 旅行阶段。不是从祭父开局自然通关，也没有实际重走本样本之前的地牢处决。

仅在会话初始化时注入一次以下样本；随后地图、坐标、阶段、演员与旗标均由真实按钮、E/Enter 按键、游戏逐帧更新及一次浏览器刷新产生，没有调用引擎推进方法或中途改写状态。

- 普通难度、15 级，气血 832/832、内力 390/390、经验 0，银两 1500，金创药 5、补气丹 3，空包裹。
- 已学武功编号 1/2/3/4/6/7；快捷栏 1/2/3/4/7。本段没有战斗和施法。
- `route=evil`，`choices.e06=1`，现实结果为从命；起点已有 `evilQiangweiDecision`、`evilQiangweiKill`、`evilQiangweiDead`、`evilFamilyHeard`。
- 起点完成和奖励账本仅用 `e05/e06/e06_kill/e06_aftermath` 表示章节前置；没有伪造 night、night_visit、escort 或禁地事件的完成。
- 起点位置为 `r_evil_chamber` 的独立场景出生点；尚无 `evilDreamEnded`、`evilNightPassed`、`evilEscortStarted`，没有同行者。

原版机制依据另见 [禁地追踪与夜梦参考](forbidden-pursuit-reference.md)。本记录验证网页当前行为，不认证原版动画、地图、时间或全流程一致性。

## 实际操作与状态

| 连续环节 | 真实操作与观察 | 自然保存结果 |
| --- | --- | --- |
| e06_night 客房 | 点击“寻路前往”，角色走至歇息处，坐下、暗场，随后出现影枫醒来对白。客房没有真儿演员来访。 | 尚未授予夜谈或同行完成。 |
| 醒来结束 | 按 Enter 读完两段醒来对白，角色起身向房间出口方向移动。 | `questId=e06_night_visit`、`map=r_evil_chamber`、`phase=travel`；只有 `staged_e06_night` 和 `evilDreamEnded` 新增，没有 `evilNightPassed`、`evilEscortStarted` 或同伴。 |
| 主动出房 | 点击“启程前往”，角色实际经过客房出口，进入摘星楼；抵达后仍需点击“寻路前往”走近真儿。 | 从 `r_evil_chamber` 进入 `m71`，没有直接跳到翌日辞行。 |
| 夜谈 | 影枫走到楼内真儿附近，面对她开启对话。画面显示一个真儿外观演员，没有跟随者分身。 | `questId=e06_night_visit`、`map=m71`、`phase=staging`，演出第 4 步；`evilNightPassed` 和 `evilEscortStarted` 都尚未提交。 |
| 夜谈中刷新 | 在第一段夜谈处真实刷新页面，没有注入新存档；继续读取对话。 | 仍为同一任务、地图和演出第 4 步，仍未提前完成夜谈或同行。 |
| 谈妥翌日同行 | 按 Enter 读完五段夜谈，经过淡出/转晨间演出。 | 进入 `e06_escort/talk`；新增 `staged_e06_night_visit`、`evilNightPassed`，仍无 `evilEscortStarted` 和同行者。 |
| 翌日辞行 | 根据界面的 E 交互提示开始辞行，阅读真儿、影枫与纳兰的三段对话，等待人物走向厅堂出口。 | 自然进入 `e06_ferry/travel`，位置仍 `m71`；此时才新增 `staged_e06_escort`、`evilEscortStarted` 和 `companion=纳兰真`。 |

完成后，气血、内力、银两、经验、包裹与两类药品均与起点相同；没有发玉佩、信件、武功或战利品。新完成的三个事件在 `done` 与 `claimedRewards` 各出现一次。真实浏览器 console 为 **Total messages 0，Errors 0，Warnings 0**。

## 画面与仍存在的缺口

已目视检查醒来、夜谈、辞行完成截图，确认客房与厅堂确实分图，主角主动前往，夜谈有单一真儿外观演员，辞行之后才显示同行状态。

**两种原版分支梦境尚未实装。** 本次从命样本看到的是坐下、暗场和醒来对白，没有婚礼、蔷薇或孟知秋的梦中演员。当前共享夜间演出也没有拒杀后的天池动作；本次没有另以拒杀样本做浏览器复验。不得将此小链通过记成婚礼梦或天池梦完成。

当前夜谈使用 `m71` 厅堂，尚未另建真儿房间；夜谈与翌日共用厅堂背景，目视差异有限。它修正了“真儿主动来影枫客房”的行动方向，但不能等同原版独立房间和完整夜昼场景已还原。

本次未实测后续下山、乘船、海边、禁地与败后招揽，亦未做原版实机比较。那些链条的其他自动/浏览器结果应分开引用。

## 截图

截图保存在本地 `output/playwright/`，不属于 `public/` 发布资源：

- [客房醒来](../output/playwright/night-visit-awake.jpg)
- [夜访任务出现，主角仍在客房](../output/playwright/night-visit-before-walking.jpg)
- [实际出房进入厅堂](../output/playwright/night-visit-hall-arrival.jpg)
- [走近真儿开启夜谈](../output/playwright/night-visit-conversation.jpg)
- [夜谈完成，进入翌日辞行](../output/playwright/night-visit-next-morning.jpg)
- [与纳兰辞行](../output/playwright/night-visit-farewell.jpg)
- [辞行完成后才形成同行](../output/playwright/night-visit-escort-complete.jpg)

## 相关旧回归更新

本轮同步更新 6 个既有测试文件以适配 revision 6：连续旅程通过 `followPursuit()` 和 `tick()` 推进追踪；招揽专用样本明确以已开门/揭面状态隔离其测试范围；地牢链新增 night_visit 的实际步行与前置条件，并把 rest 的下一事件改为 village；旧数字索引迁移覆盖冻结的 revision-five 161 个原任务 ID，检查旧揭面历史使用专门 legacy 旗标，不伪造新增事件的 done、claimed 或 staged。

旧 12 项回归各自运行通过，包括两种难度的六条长结局测试。这里的自动旅程仅说明网页逻辑可以继续，不表示人工从头游玩，也不能以其节点数量声明完整复刻。

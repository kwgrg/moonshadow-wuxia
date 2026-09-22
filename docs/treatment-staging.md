# 海屋治疗演出与校验

日期：2026-09-22。实现位置：`public/staging.mjs` 的 `g08_deliver`、`public/renderer-v3.mjs` 的治疗道具及卧病/坐起姿态；执行、存档与物品事务由独立的 staging runner 管理。

## 证据边界

依据既有 [跑腿与交付审计](errands-audit.md)，可核验的事件链为：离忧山采足十二株银丝草 → 实际返回海边小屋 → 交给纳兰真煎药 → 月眉儿服药好转 → 两半玉佩相合、姐妹相认 → 赴禁地密室。缺少药草不得先播放成功治疗或发玉佩。

本次没有读取、提取或复制原游戏目录。背景与人物仅使用项目此前独立制作的 `bedroom.png`、`characters.png`。对白、病榻、药炉、药碗、玉佩图案、人物坐标、运动路径、朝向、镜头和秒数均是网页原创设计，不作为原版画面、原台词或原动画的证据。没有新增煎药小游戏或推断姐妹长幼。

## 数据和渲染契约

- `map:'m33'`，`startPoint:{x:795,y:625}`，标记“交付银丝草”。通过交互开始，不设自动触发；库存门槛由 runner 检查。
- 场景演员：纳兰真 `healer` 初始 `(760,550)`；月眉儿 `patient` 初始 `(600,540)`、`pose:'ill'`。主角实际走到 `(840,620)` 交谈。
- `handover:{silver_grass:12}` 在交药时扣除十二株。`medicine` cue 依次为 `handed → brewing → ready → served`；药包、火光/蒸汽、随人移动的药碗和床头喂药随 cue 切换。
- 纳兰真走到炉边 `(865,545)`，煎药后实际走到床头 `(475,575)`。药碗由她手边移近病者，再留在榻旁。月眉儿从 `ill` 转为 `sit`，明确呈现好转。
- `jade` cue 为 `apart → joined`，两半玉由分开移向中央相合。展示位置 `(735,365)` 留出人物姓名区域。此为便于辨认的物品展示，不把悬浮图标解释为世界中的悬浮物。
- 渲染读取 `engine.stagingPresentation()` 返回的 `{definition,actors,cues}`；`props[]` 只负责画面，不扣物品或发奖励。排序单独使用 `sortY`，确保床在病者下方、手中器物位于演员上层。
- `finalActors` 为纳兰真 `(720,610)` 与坐起的月眉儿 `(600,540)`；`finalCues` 为 served/joined，`persistFor:['g09']`。任务完成后仍留在海屋、以及实际返回海屋时，终态演员与器物保持可见。

药草消费账本、演出位置/姿态/cue/步骤的保存恢复、结束时发放两半玉、同名同行人物去重由根代理接入 runner/runtime。本文件不把 Canvas 画面作为这些事务的实现。

## 实际浏览器验证

页面 `http://127.0.0.1:8787`，缓存 Playwright CLI，会话 `fullflow-treatment`。以 17 级普通难度、14 株银丝草的交付前章节 fixture 开始；初始设置后均通过追踪、继续对白、地图与地面点击推进，没有修改物品、任务或地图来达成结果。

| 检查 | 结果 |
| --- | --- |
| 交药时点 | 首段对话时 14 株；handover 后 2 株，账本 `g08_deliver.silver_grass=12`。 |
| 中途读档 | 在 brewing 时刷新；仍为 2 株，从煎药接续，未重复扣药。 |
| 现场动作 | 逐段实拍药炉蒸汽、端碗移动、床头服药、月眉儿坐起、两半玉分离/相合，全部由界面推进。 |
| 完成及重载 | `g09`、仍在 `m33`，2 株草/2 半玉，done/claimedRewards 各一次；重载不重复奖励。 |
| 真儿唯一性 | 实际走出海屋至 `m56`。首次发现任务 NPC 与同行者重复，根代理修复后，谈话阶段只留一名任务真儿；开始 search 后只留一名随行真儿。没有拾取密室遗物，collected 仍为 0。谈话阶段清晰截图复用了前一次 12 草真实 UI 验证产生的 `fullflow-errands` 存档，未另造成功进度。 |
| 回屋终态 | 通过舆图实际返回 `m33`，月眉儿仍坐起、真儿固定在床边且唯一，玉佩展示移开了姓名，物品仍为 2 草/2 玉。 |
| 11 株负例 | 独立 `fullflow-errands-missing` 存档连续四次交互，仅提示“还需要：银丝草 12 份”。无 sequence、无对白、无交药旗标、无奖励，仍为 11 株。 |
| 控制台 | 本轮正例、负例最终均 0 errors / 0 warnings。 |

关键截图：

- [卧病与交药开场](../output/playwright/treatment-ill-and-handover.jpg)
- [煎药中](../output/playwright/treatment-brewing-before-reload.jpg)、[刷新后接续](../output/playwright/treatment-brewing-restored.jpg)
- [药成端碗](../output/playwright/treatment-medicine-ready.jpg)、[走到床头](../output/playwright/treatment-at-bedside.jpg)、[服药](../output/playwright/treatment-drinking.jpg)
- [月眉儿坐起](../output/playwright/treatment-recovered-sitting.jpg)
- [两半玉](../output/playwright/treatment-jade-apart.jpg)、[相合对白](../output/playwright/treatment-jade-joined.jpg)（这两张为展示上移前；最终位置见下图）
- [实际回屋后的终态](../output/playwright/treatment-return-final-tableau.jpg)
- [密室唯一任务真儿](../output/playwright/treatment-secret-room-single-npc.jpg)、[开始搜索后唯一随行真儿](../output/playwright/treatment-secret-room-single-companion.jpg)
- [十一株阻止演出](../output/playwright/treatment-eleven-blocked.jpg)

静态检查：两个改动模块 `node --check` 通过；`validate-interface.mjs` 通过（147 场景、1937 次图像绘制），仅补足真实 Canvas 渐变接口 mock，未删减既有断言；`validate-treatment-staging.mjs` 通过（29 个步骤、34 个恢复快照，含事务交付、物品守恒、不足药草、路线锁定和旧档/分支隔离）；`git diff --check` 通过。

## 仍需完善

卧病和坐起使用既有原创人物图集上半身、角度与被褥组合，尚不是完整的逐帧角色动作。药碗有实际位置转移，尚未制作独立手臂骨骼和吞咽动作；Canvas 道具与背景的绘画笔触仍有差别。原版屋内布局、动作细节与准确时长未核验。以上验证确认本段事件与可见动作已经衔接，不能代表原版全流程、原画质或角色动画已完整复刻。
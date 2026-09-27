# R19 樱花谷首谈真实浏览器验收

日期：2026-09-27。会话：独立 headed Chrome `first-talk-r19`；地址 `http://localhost:8787`。未操作其他验收会话。当前存档 revision 19。

本次从正常存档界面导入 `output/playwright/r19-g23-before-talk.json`。这是**人工章节起点**：64 级、气血 8500、内力 5500、药 99、金钱 50000，已到樱花谷 `g23` 且有 `goodMedicineFarewellReady`，尚无首谈选择、`done.g23` 或 `staged_g23`。它只验证首谈演出与存档，不是从开头玩到此处的证据，也不证明普通难度或全流程可完成。独立的新游戏默认侠客记录在 `docs/default-start-browser-r19.md`，两者没有混用。

全部状态变化来自画布点击、继续对白、存档导入/导出等正常 UI。只读本地存档与导出 JSON 用于确认结果；没有通过控制台修改引擎、角色、存储或演出步骤。原版目录本轮未读取，截图都是本项目网页表现。

## 实际操作与结果

进入章节后，紫轩和眉儿都在场。未点击人物时点击任务指引，仍保持 `phase=talk`，没有首谈选择或演出序列；指引没有替玩家选人。

| 实际先点人物 | 首谈标记 | 离场者 | 离场中导出的步骤与坐标 | 恢复完成后下一任务 |
| --- | --- | --- | --- | --- |
| 紫轩 | `choices.g23=0`、`firstMeetingIndex=0` | 月眉儿 | step 3，眉儿 `(1034.474375220302, 653.6837498531321)`；位于初始 `(1100,610)` 向 `(800,810)` 的途中 | `g23_pickup`，小筑接眉儿 |
| 月眉儿 | `choices.g23=1`、`firstMeetingIndex=1` | 紫轩 | step 10，紫轩 `(890.504618005506, 591.2805064866936)`；位于初始 `(920,520)` 向 `(800,810)` 的途中 | `g23_farewell`，小筑辞紫轩 |

两次都在离场者发言结束后，让人物走约 600 ms，再打开存档界面暂停并导出。导出时 `done=[]`、`claimedRewards=[]`，演出尚未完成，金钱仍为 50000。读档后立即打开设置暂停，核对选择、演出步骤和人物坐标与相应导出值完全相同。关闭设置后才继续人物行走；没有跳过舞台或直接改成完成态。

紫轩优先：先播放紫轩与影枫的两句，眉儿说明回小筑，随后眉儿分两段走到出口并隐藏，才出现紫轩后续两句。实际打开截图检查：中途恢复时三人仍在场，后续对白时眉儿已离场。最终 `goodFirstZi=true`、`goodFirstMei=false`，任务进入小筑接眉儿。

眉儿优先：先播放眉儿、影枫、眉儿三句，紫轩说明留谷并回小筑道别。恢复后紫轩继续行走到 `(800,915)`，存档的 step 13 明确为 `hidden=true`，眉儿仍在 `(1100,610)` 且未隐藏；这时才显示影枫收尾的一句。截图目视确认紫轩离场，画面只保留影枫与眉儿。最终 `goodFirstMei=true`、`goodFirstZi=false`，任务进入小筑辞紫轩。

两个分支结束都只有 `done=[g23]`、`claimedRewards=[g23]`，金钱 50015、角色经验 65、背包为空。又分别通过正常 UI 重载各自完成档：对应任务、独占分支标记与这些资源数值保持不变，没有重新演出或重复奖励。

## 证据文件

正常 UI 导出的文件：

- `output/playwright/r19-first-zixuan-mid-exit.json`：step 3 的眉儿离场中检查点。
- `output/playwright/r19-first-zixuan-complete.json`：紫轩优先完成档。
- `output/playwright/r19-first-mei-mid-exit.json`：step 10 的紫轩离场中检查点。
- `output/playwright/r19-first-mei-complete.json`：眉儿优先完成档。

保存后实际打开查看的主要截图：

- `output/playwright/r19-first-talk-initial.png`：未选择时两位人物均在场。
- `output/playwright/r19-first-zixuan-first-line.png`：紫轩首句与角色位置。
- `output/playwright/r19-first-zixuan-mid-restored.png`：读档后的眉儿正在离场。
- `output/playwright/r19-first-zixuan-after-exit.png`：眉儿已离场，紫轩后续对白显示。
- `output/playwright/r19-first-mei-mid-restored.png`：读档后的紫轩正在离场。
- `output/playwright/r19-first-mei-after-exit.png`：紫轩已隐藏，影枫收尾对白显示。

CSS 视口为 **1037×739**，`devicePixelRatio=2`，截图文件为 **2074×1478** 物理像素。一次初期自动化误把截图物理坐标当作 CSS 坐标，导致超出画布的点击超时；随后按实际 CSS 坐标点击成功。这是验收脚本操作错误，没有记为产品卡死。`r19-first-mei-first-line.png` 捕获时角色尚在走近目标、对白尚未绘出，不能把这个文件名当作首句画面证据；首句和逐句顺序来自正常 UI 文本读取与后续操作。

## 边界与仍待改进

本次两个首谈分支、离场中保存恢复以及完成档重载未发现阻断。演出期间附近的旧木箱仍可显示名称或交互提示，画面注意力会被分散；本次未尝试在演出中点击它，不能据此声称能打断剧情。

本次核验的是当前网页的交互顺序、存档行为与可见演出。场景、美术、对白属于本项目原创表现；本轮没有重新核对原版对应机制，不能以这些结果补充原版匹配度结论。未检验小筑内后续告别、后续结局、其他尺寸或移动端，也不能用此章节测试替代全流程实玩。

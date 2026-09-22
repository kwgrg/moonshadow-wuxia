# 采药、返程与对玉相认：浏览器验证

验证日期：2026-09-22。页面：`http://127.0.0.1:8787`。工具：缓存 Playwright CLI；会话 `fullflow-errands`（正例）与 `fullflow-errands-missing`（缺药负例）。

本次使用 17 级、普通难度的章节测试存档，从 `g08` 开始；不代表从游戏开局自然通关。初始存档建立后，采集、交谈、返程和交付均通过界面按钮完成，没有通过修改 inventory、count、map 或 phase 达成成功。存档仅用于只读核验结果。另设独立 11 株药草的交付前存档测试负例。

## 验证结果

| 流程 | 操作与实际结果 |
| --- | --- |
| 采集 12 株 | 从离忧山开始，追踪到目标并推进两句开场对白；之后逐次点击追踪，角色走近药草并自动采集。取得 12 个不同采集点：`9, 0, 5, 3, 1, 10, 6, 4, 8, 2, 11, 7`。完成对白后获得 `silver_grass: 12`。 |
| 实际返回海屋 | 任务变为 `g08_deliver` 时仍在 `m32`，状态为 travel。点击追踪后先沿道路行走，随后实际进入 `m33`；已访问地图由 `[m32]` 变为 `[m32, m33]`。没有直接设置地图。 |
| 交付与相认 | 走到纳兰真处，通过界面推进两句交药对白及四句煎药、对玉、前往密室的叙述/对白。完成后任务为 `g09`，银丝草 `12 → 0`，半块玉佩 `0 → 2`，`silverGrassDelivered: true`。 |
| 奖励持久化 | `g08_deliver` 在 claimedRewards 与 done 中各出现一次。重载页面后仍为 `g09`、银丝草 0、半块玉佩 2，两个记录仍各一次；未重复发放。 |
| 11 株负例 | 独立存档处于海屋交药前，连续四次点击追踪尝试交付。始终提示“还需要：银丝草 12 份”，未显示对白、煎药或相认。任务保持 `g08_deliver`，银丝草保持 11，无交药旗标，无完成/奖励记录。 |

正例和负例最终控制台均为 **0 errors、0 warnings**。首次加载曾碰到开发中间状态的 `ReferenceError: q is not defined`；根代理修复引用后重新加载，以上结果均来自修复后的运行。

## 截图

- [采集十二株](../output/playwright/errand-collected-twelve.jpg)
- [采完仍须返程](../output/playwright/errand-return-required.jpg)
- [实际抵达海边小屋](../output/playwright/errand-arrived-seaside.jpg)
- [对玉相认对白](../output/playwright/errand-jade-recognition.jpg)
- [交付后的行囊](../output/playwright/errand-delivered-inventory.jpg)
- [十一株阻止交付](../output/playwright/errand-eleven-blocked.jpg)

## 尚未满足的场景演出

对玉截图中可见杨影枫和纳兰真，未见月眉儿的场景演员；煎药、服药和病情转稳仍通过文字叙述表达，没有对应的现场动作。本次证明的是采集、实际返程、物品门槛和一次性奖励机制，不能据此认定该段场景演出已经充分还原。

本次仅操作浏览器并新增此记录，没有改动应用源码或测试文件，没有读取或导入原游戏资源。

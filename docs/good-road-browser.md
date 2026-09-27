# R19 道路浏览器实测

2026-09-27；本地127.0.0.1:8787，headed Chromium会话roads-r19，实际CSS1037×739、DPR2。所有移动、点选、对话、导入导出及重试均通过产品界面。浏览器内仅只读DOM/本地存档以核对结果，没有写engine/global/storage或跳事件。原版目录未读取。

## 前置边界

r19-medicine-eagles-fresh.json与r19-manor-outer-fresh.json是明确的人工章节前置：level64、8500HP、5500MP、已具备相应剧情旗标，并非从默认开局积累。初始敌群由生产runtime构建，所有敌人满血、0击杀/0收据。该实测证明本轮交互与保存行为，不证明普通难度整程平衡。

默认开局另见default-start-browser-r19.md（其连续运行页面在集成前打开，实导出为R18基线，勿与本记录拼成全流程通关）。首谈和终战旁观者另有独立浏览器记录。

## 实际经过与结果

1. 药谷：导入→沿指引实际步行穿过鹰群→进入m23诊院。HP8500降到8270，0击杀、0道路收据、30鹰仍活。随后正常逐句完成胡神医诊查，实际到m49/g21_return；导出r19-doctor-zero-kills-played.json仍为30鹰全活、0击杀。银两只增加g21既有15，不发鹰奖励。
2. 岭道：正常点选第12名守军，自动接近并配合出剑/烈火击败。导出r19-road-partial-played.json：11存活、medicine-outer-12死亡，只有对应一条道路收据，50010银两、1击杀。其他11人未被自动清除。
3. 正常导入该实际战局→走到松坡：r19-pine-road-entered-played.json显示岭道11活、松坡25活，仍只有前述收据，HP8413。随后从可见道路出口回岭道：r19-road-returned-played.json为r_good_manor_outer、脚点330/645、HP8384，11活、同一笔钱与击杀，已死敌人不复生。
4. 从返回点再连续走至樱花谷：r19-roads-to-valley-played.json为m17/g23，实际visited依次含岭道、松坡、m41、寒波谷路、m17。HP8094，岭道11人和松坡25人仍活，钱/击杀/收据不变。证明可以带着余敌继续走，不要求37人全清。
5. 失败专用夹具r19-road-low-hp-qa.json只将上述实际部分战局的英雄HP设为1，以快速覆盖失败分支；这是人工前置，不称为正常游戏自然受伤过程。导入后正常走入守军警戒范围，由真实攻击打到HP0，出现再战面板。关闭面板并刷新，仍0HP、failed=true、原收据保留，不能通过刷新自行复活。
6. 点击再战，随后正常点选再次击败medicine-outer-12。r19-road-retry-rekill-played.json为attempt2、HP8500，该敌人再次死亡；仍50010银两、1击杀和一条收据，没有第二次领奖。

## 画面检查与截图

新三图均在实际浏览器加载。药谷初版简易鹰形与画风不协调，目视发现后换成独立透明苍鹰，缩小占屏，并重新截图；当前并非原版逐帧扑翼动画。岭道不把底部悬崖作可走地面，松坡显示宽路和侧路，入口不与敌人重叠。

清晰场景：output/playwright/r19-eagles-final-art.png、r19-manor-road-entry.png、r19-pine-road-visible.png。流程：r19-eagles-walked-to-clinic.png、r19-doctor-with-live-eagles.png。失败：r19-road-defeat.png、r19-road-defeat-reloaded.png。部分导出截图带存档面板，仅作为保存操作记录，不作为场景无遮挡证明。

两次测试操作误差（把DPR2截图坐标当CSS坐标、导出按钮文字定位不准确）已按真实DOM更正；未修改产品来适应这些误差，未将其算作游戏缺陷。方向键尝试未对准返程门，之后正常点击可见出口才实际完成返程，以上返程结论以最终实际导出为准。

本记录不宣称完整复刻、默认全程平衡或全部剧情都已核实；早中期内容、敌人AI差异与演出精度仍待后续工作。

## 补充：道路领奖字段损坏的真实 UI 验证

收据修复落盘后，独立 headed 会话 `road-claims-r19` 刷新加载最新网页代码，于 2026-09-27 完成一次缺字段专项。这里使用**损坏字段 QA 派生档**，与上方完整正常存档分别记录：读取真实 UI 导出的 `r19-road-partial-played.json`，只删除顶层 `roadClaims`，写出 `output/playwright/r19-road-missing-claims-qa.json`；逐字段比较确认唯一差异就是该字段缺失。没有修改英雄、敌人、道路战况、奖励值或其他字段；原始文件保留。

正常存档 UI 导入后立即打开设置暂停，核对仍在 `r_good_manor_outer`、`phase=travel`，英雄气血 8500，道路 attempt 1、非失败；11 名守军仍为 360 HP，第 12 名仍为 0 HP。道路名册和现场敌人坐标、HP 与派生前保持一致。修复把该道路标记为 `rewardBlocked=true`，从已经死亡的第 12 名守军补记保守收据。此时银两 50010、角色经验 18、奖励击杀计数 1 均未增加。关闭面板后的实际截图可见 11 名活敌与“尚有 11 个对手”提示。

随后正常点击最近的第 11 名守军并按 J 出剑，实际击败该敌人，HUD 变成“尚有 10 个对手”。通过存档 UI 导出 `output/playwright/r19-road-missing-claims-after-kill-played.json`：第 11、12 名均为 0 HP，另外 10 人仍活；`rewardBlocked=true` 持续保留，第 11 名被记入收据，但银两仍 50010、经验仍 18、奖励击杀计数仍 1，没有因缺失旧记录而获得不确定的新奖励。英雄气血仍为 8500。

实际打开查看的截图：`output/playwright/r19-road-missing-claims-imported.png`、`output/playwright/r19-road-missing-claims-after-kill.png`。它们来自 CSS 1037×739、DPR 2 的真实浏览器，文件物理尺寸 2074×1478。该起点并非失败状态，所以本次没有触发重试；实测范围是缺字段导入、现场保留及一次正常击杀禁奖，没有扩展为全流程验证。所有浏览器内读状态均只读，未写引擎或 localStorage，也未修改产品代码。

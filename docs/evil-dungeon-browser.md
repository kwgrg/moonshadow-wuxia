# 邪线地牢及回岛浏览器验证

日期：2026-09-22；本地Wrangler http://127.0.0.1:8787，Playwright真实浏览器。匿名访问、无账号、localStorage存档。所有截图为浏览器直接JPEG，没有后期编辑。

## 范围

两分支各允许一次章节起点fixture，不宣称从开局或e05自然通关。之后只使用任务追踪、实际对白按钮、选择、地图或地面移动，不改后续位置、phase、旗标、敌人HP或物品来制造通过。读取localStorage仅用于对照实际结果。

拒绝分支详见[演出与实测记录](evil-dungeon-staging.md)：15级、900银两起点，实际拒绝、本人撞墙、倒地step16刷新、纳兰离牢、回楼再回访；死者不交互，不重复发奖，控制台0错误/0警告。

## 听命分支（evil-journey）

起点e06/r_evil_dungeon，15级，832HP/390MP，武学1–6已有熟练20，银两1500、药12/丹8、击杀0、包裹空；初始visited还含freshState默认的m1，不能把该项当作本次走访。

- 通过追踪实际走近，施压演出结束才出现选择。点击听从胁迫进入e06_kill，影枫出手、蔷薇倒地、纳兰走南门并隐藏。进入e06_aftermath时done只有e06/e06_kill，evil为3、包裹仍空、资源未增加。已目视[倒地结果](../output/playwright/evil-kill-consequence.jpg)。
- 实际从地牢走回m71并进行会面，再进入r_evil_chamber。半玉为演员道具，没有物品发放。楼内姐妹与密室信息在后续审查补齐，先前截图不作为更新后全文通过证据。
- 夜间坐姿step5真实刷新：hero(760,665)/sit、隐藏的真儿、heroPose sit、当前步骤、旗标均一致；刷新后人物没有提前现身，继续夜谈后走远离场。梦境明确未完整演绎。[坐姿截图](../output/playwright/evil-night-seated.jpg)拍于地牢梦措辞修正前，刷新后实际读到笼统梦醒的新措辞；此图只证明姿态。
- 再由客房走回m71辞行；之后任务追踪实际经过r_evil_yitian和r_evil_ferry才到船夫，同行仍在。没有楼内直接到渡头的捷径。
- 实际问船后才有航渡，穿过乘船出口抵m40，e06_landing仍待交谈，包裹为空；岛上只显示一位当时身份为纳兰真的角色。[原始抵岛截图](../output/playwright/evil-island-landing.jpg)暴露旧平面水池/道路覆盖，因此另行清理并复验，不把该图当作最终画质通过证据。

- 实际由m40交谈后走到m34；刷新载入清理后的地图，底图上没有旧平面池、路和假石块。根代理目视[清理后海边](../output/playwright/evil-shore-clean.jpg)。三处水岸m40/m34/r_evil_ferry均去掉重复覆盖及其碰撞，仅保留原创底图mask和必要交互点；quality/interface/新邪线专项重新通过。
- 在海边实际走近休息，主角坐下、同行者走到(1210,700)后隐藏、主角醒来起身。最后自动释放到e07，地图仍m34、phase travel、sequence null、evilZhenMissing true、companion null；并未直接进入或完成禁地战斗。根代理目视[醒后独处](../output/playwright/evil-shore-awake.jpg)，没有角色残影。
- 最终done/claimed各8项且完全相同：e06、e06_kill、e06_aftermath、e06_night、e06_escort、e06_ferry、e06_landing、e06_rest；拒绝分支结果未混入。HP832、MP390、银两1500、击杀0、药12/丹8、包裹空，均保留起点值。evil仍3，仅选择一次产生。
- 本会话控制台0错误、0警告。局部真实路径共经过地牢、楼厅、客房、山路、大陆渡头、岛码头、海边7个不同地图；freshState遗留的m1不算实际经历。客房夜谈方向与分支梦缺口见审计。

## e04战前认出身份（evil-zixuan）

独立会话只在开头建立一次e04/m16邪线15级fixture。实际走近交谈，尚未开战时杨影枫称紫轩，紫轩本人回应；无原谅选项、无战斗血条。继续最后战前对白后实际进入1名对手的切磋，敌人标签紫轩，仍未出现原谅选择。本次没有战胜/完成该任务，战后门槛由既有浏览器记录与本轮运行时测试支持。

截图[战前认出](../output/playwright/evil-zixuan-named-before-battle.jpg)、[紫轩回应](../output/playwright/evil-zixuan-reply-before-battle.jpg)、[开战标签](../output/playwright/evil-zixuan-battle-label.jpg)。控制台0错误、0警告。截图暴露m16为室内而文本写庭中，已将措辞改为小筑等候，不臆称室内画面是庭院；该地点的高精度场景还原仍未完成。

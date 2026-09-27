# R18 高倾向结尾实际浏览器验收

日期：2026-09-27。目标为本地 `http://127.0.0.1:8787/`，独立 headed Chromium 会话 `evil-high-r18`。本记录区分实际操作、读取的存档证据与尚未复验的表现问题，不作为全游戏复刻完成的证明。

## 起点与方法

- 使用正常「存入江湖 → 导入存档」导入 `output/playwright/r18-alone-chapter-start.json`。这是明确的 QA 章节档：64 级、气血 2892、内力 1310、邪向值 4、八层开关均已开启，位置为塔八层 `m69`，当前 `e13`，此前 `done` 为空。没有从游戏开头实际完成前面章节或八锁解谜。
- 仅使用页面按钮、移动寻路、对白继续、键盘 J 与武功 1/2/3/4/5。浏览器内没有写引擎对象、血量或本地存储；为证据只读 `localStorage`。检查点均从正常导出按钮下载，比较路径使用正常导入。
- 每次操作前将本会话置前；检查与分段期间用设置/存档弹窗暂停。画面文件保存后实际打开查看。
- 本次没有读取原版目录。对白、图像均为本项目独立实现；本记录核验的是已核机制在网页中的操作结果。原版未确认的数值阈值不能由网页 QA 的邪向值 4 反推；来源边界见 `evil-ending-reference.md`。

## 实际完成路径

1. 从塔八层沿实际道路下降至五层，走到铁门前；看到真儿位于封闭牢栏中，影枫在外。正常继续演出后开门、接出、返回庄内卧房，照料真儿，铁云进屋报告。
2. 沿道路走到庄门，完成对峙并开始 29 人战斗。使用 J 与正常技能实战，HUD 对手数实际经过 29 → 12 → 3 → 战毕；自动存档 `e14 / after` 的名册为 29、存活为 0、29 个去重击败 ID、`outcome: victory`、`finished: true`。之后实际走回卧房，而非直接跳到后续场景。
3. 经过三月休养对白，前往花园；当前人物切为纳兰真。可容首次对白在场人物为青绿侍女，头像完整非空；揭面后原位置改为眉儿及其头像。姐妹、母亲来信与所谓吐真药的骗局在对白内表达，回房后视角恢复影枫。
4. 参汤毒发后自动进入高倾向支线，无结局菜单。只读存档为 `evilFinalOutcome: alone`、`evilFinalCruel: true`、`evilFinalMercy: false`、模型 `web-v1`。中毒画面看到主角低坐及「毒发」提示。
5. 顺序实际为：真儿倒下 → 独立「解药交出」演出 → 主角恢复站姿及毒发提示消失 → 「第二次举剑」 → 两墓。进入第二次举剑时 `done` 已含 `e14_zhen_fall`、`e14_antidote`，`evilFinalAntidoteTaken: true`。没有把服解药省略到第二次举剑之后，也没有把这两次受控演出作普通掉落战。
6. 庄外双冢场景可见「纳兰真之墓」「月眉儿之墓」，影枫先后走近祭拜。随后返回卧房，时间表现为夜，进入四道旧影演出和四人实际战斗。
7. 四人名册依次为纳兰真、月眉儿、蔷薇、紫轩，各 820 气血；在此通过正常导出获得 `output/playwright/r18-high-dream-checkpoint.json`，供以下两次独立结果复验。

## 实际梦败与梦胜

| 验证 | 操作与观测 | 结果证据 |
| --- | --- | --- |
| 梦败 | 不攻击、不治疗，让对手正常攻击。HUD 实际采样 2892 → 2845 → 2318 → 1951 → 1603 → 1302 → 822 → 455 → 408 → 201 → 154 → 107，随后自动切到父墓并恢复 2892。 | `dreamCombatOutcomes.e14_dream.outcome` 为 `dream-loss`，`heroHpAtOutcome` 为 0，四人仍各 820，`defeatedIds` 为空，`failure` 为 null。未出现再战要求。父墓正常对白完成后结局为 `alone`、`completed: true`。 |
| 梦胜 | 正常导入同一份梦战起点，J 与 1/2/4 技能实战，HUD 4 → 3 → 父墓。 | `outcome: victory`，`heroHpAtOutcome: 2845`，四人气血均 0，击败 ID `[2,3,0,1]`，父墓恢复 2892、`failure: null`。正常完成父墓对白，出现「独留悔恨」，`completed: true`、`ending: alone`。 |

梦败瞬间的气血 0 没有被 300ms HUD 采样恰好捕获；上表明确区分最低可见采样 107 与结果记录中的 0，不把记录值伪称截图中的瞬时值。

两个结果均用 UI 导出留存：`output/playwright/r18-high-dream-loss-completed.json`、`output/playwright/r18-high-dream-win-completed.json`。父墓正文与结局按钮都实际操作过，没有靠构造 after 状态跳关。

## 画面证据与发现

以下截图已实际打开目视：

- `output/playwright/r18-high-tower-locked.png`：五层牢栏、门外影枫与栏内真儿。
- `output/playwright/r18-high-gate-before.png`、`r18-high-gate-won.png`：战前对峙、四家丁与战后庄门场面。
- `output/playwright/r18-high-kerong-first.png`、`r18-high-kerong-revealed.png`：可容新人物/头像及同位置揭面变化。
- `output/playwright/r18-high-poison.png`、`r18-high-second-sword-before.png`：中毒低坐与解药后站姿，第二次举剑之前的画面。
- `output/playwright/r18-high-graves.png`：两个准确墓名、祭拜动作与独立墓园环境。
- `output/playwright/r18-high-dream-four.png`、`r18-high-dream-active.png`：四人梦战及实际攻击。
- `output/playwright/r18-high-dream-loss-father.png`、`r18-high-father-dialogue.png`：梦败自动醒转、父墓跪拜和尾声。

本次实机发现梦战背景没有在同一房间内正确切换：右侧地点已为「夜梦故人」，四人已正常攻击，但开战初帧及约两秒后的画面仍显示卧房床铺与木地板。修复场景加载后，重新从同一 QA 章节起点以正常操作走过救援、29 人战、回庄、毒汤、解药和两墓；在 `e14_sleep` 第 2 步通过 UI 导出 `output/playwright/r18-high-sleep-checkpoint.json`，刷新页面后从睡眠自然继续到梦境。实际打开 `r18-high-dream-prelude-fixed.png` 和 `r18-high-dream-four-fixed.png`，确认独立月夜院落、月门、石砖地面均已显示，四人战正常开始。新的梦战 UI 导出为 `r18-high-dream-checkpoint-fixed.json`。旧卧房截图保留为缺陷证据，不再作为最终梦场画面。

在新梦场中再次正常等待梦败，HUD 采样为 2845 → 2224 → 1697 → 1189 → 681 → 107 → 父墓；结果仍为 `dream-loss`、记录气血 0、四人存活、无失败状态。`r18-high-dream-loss-fixed-father.png` 已目视，证明这次自然切换及新加载保护没有阻断实际梦败出口。

另在本会话较高比例的浏览器窗口下（截图为 2074×1478 物理像素，不能将其当作 CSS 视口尺寸），首次回看 `r18-high-poison-dialogue-fixed.png` 时，低坐影枫下缘仍被对白框挡住，且汤碗不清晰。此图保留为发现证据，不将文件名中的 fixed 当作通过结论。此前 `r18-high-poison.png` 是对白间隙取景，也不能代替对白打开时的可见性验证。

最终镜头边界已允许 R18 演出向上移出原先的贴边限制，以底部暗色留白容纳对白。主代理在 1024×768 和 1280×720 CSS 视口实际打开对白复验，并记录于[本轮浏览器总记录](evil-ending-browser.md)。本记录作者也打开查看了 `output/playwright/r18-poison-tall-fixed.png`、`r18-poison-wide-fixed.png`：两个比例下低坐姿态和盛汤的小桌均完整位于对白框上方。家庭收束的儿童位置与画面由主代理在同一总记录内报告。本次没有再次在原截图对应的浏览器窗口人工操作，修复后明确实看的比例为 4:3 与 16:9。

## 自动化回归

梦场加载修正后完整 `npm test` 实跑 48 个唯一测试文件，退出码 0，日志 `work/r18-final-scene-loading-npm-test.log`。其中新增场景加载专项覆盖正常 sleep→dream 与首次图片失败后重试两条自然路径；运行时专项含 25 个梦战情形；演出专项为 528 次恢复、630 条路径。数字是检查覆盖范围，不是复刻质量评分。

两处既有 UI 桩测试原来在同一个同步任务内连续推进数千帧，阻塞新图片加载 Promise。夹具改为在场景变化后有界等待真正的异步完成，并断言加载失败状态未被忽略；没有取消产品加载守卫，也没有减弱对白、失败、存档或分支检查。人工浏览器与这些测试的证明范围分别列出。

完整 48 套通过之后，最后一次变更仅涉及上述演出镜头边界及对应表现检查。因此补跑受影响的五套，全部退出码 0，没有把先前整套结果冒充为最后改动后的重新全量运行：

| 最后局部回归 | 实际结果 | 日志 |
| --- | --- | --- |
| R18 表现 | 15 项通过 | `work/r18-final-camera-presentation.log` |
| 界面 | 13 菜单、256 场景、2285 绘制调用通过 | `work/r18-final-camera-interface.log` |
| 剧情界面 | 27 项、首次交谈 2 路、鼠标选敌 5 项通过 | `work/r18-final-camera-story-ui.log` |
| 善线悲剧渲染 | 20 项通过 | `work/r18-final-camera-grief-rendering.log` |
| R18 演出 | 30 场景、528 恢复、630 路径、80 门禁通过 | `work/r18-final-camera-staging.log` |

## 验收边界

这证明 QA 章节起点以后的高倾向结尾可通过正常 UI 操作完成，并且实际梦胜/梦败均能进入父墓结局。64 级测试档使战斗很快，不证明普通培养曲线的难度平衡；未对全游戏所有操作系统、屏幕尺寸、设备、旧存档组合作人工验收，也不宣称完整原作复刻或原版美术/台词一致。

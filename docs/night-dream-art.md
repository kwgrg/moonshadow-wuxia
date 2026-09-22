# 夜梦与真儿房原创美术

日期：2026-09-22。三张图片由内置 image_gen 按本项目原创文字生成，未输入原游戏图像、地图或截图。原版目录只读核对机制，没有复制内容进入仓库或部署资源。图片从本轮生成结果原样保存，未作程序化图像编辑；均为 1536 × 1024 PNG。

婚礼红绸及人物动作由独立 Canvas 绘制；场景沿用本项目人物图集，非原作角色肖像。碰撞与站位根据新图独立布置。天池水线明确区分干岸和水面，真儿房家具只在上部及边缘占地。

## zhen-chamber

产品文件：`public/assets/zhen-chamber.png`。

生成来源：`C:\Users\kwgrg\.codex\generated_images\01a088cc-a046-7932-9942-4d38be2d16a9\exec-51e50e7a-9183-4307-b145-9259423c803d.png`。

SHA-256：`6F94481784EF53728B1EC3BAC7A0726FF78FE0C0AD62E04E4E7B90ADBDB9E54B`。

完整提示词：

```text
Use case: historical-scene. Original 1536x1024 painterly realistic environment background for an independently made Chinese wuxia RPG, fixed elevated oblique camera. Design a young woman's private guest chamber on an upper floor of a traditional Chinese mountain tower, nighttime. Completely new architecture and furnishings, do not reproduce any existing game, no reference artwork. Refined pale timber floor, blue moonlight through tall lattice windows on the upper right wall, a candle by a low writing desk in the upper left, a neatly folded plum-red cloak on a small chair, canopy bed set along the FAR NORTH wall, delicate screen tucked on the LEFT edge, a few rolled scrolls and porcelain vessels arranged naturally. Most of the central and lower floor is EMPTY and navigable for two full standing characters: x420..1230, y460..900. An obvious door threshold at the BOTTOM center, x750 y930, opening to an unseen corridor. Use a cutaway southern wall so characters remain visible. Bed, desk, chairs, pillars and screen stay near upper and side edges, never in the open center. Clear foot contact shadows and legible furniture floor footprints. Atmospheric yet readable, warm small candle against moonlit blue wood, melancholy stillness, elegant details. No people, no drawn heroine, no text, no readable writing, no UI, no HUD, no logo, no altar, no magical symbols, no dramatic clutter. Full scene edge-to-edge, not a floating miniature.
```

## wedding-dream

产品文件：`public/assets/wedding-dream.png`。

生成来源：`C:\Users\kwgrg\.codex\generated_images\01a088cc-a046-7932-9942-4d38be2d16a9\exec-1f582af9-b4f4-4690-b011-89a8860b9e55.png`。

SHA-256：`60CA02CAB0A09905761D8496263FBEAC55D533E8BAD2482EF29024DC01C9F7E3`。

完整提示词：

```text
Use case: historical-scene. Produce a NEW original 1536x1024 background painting for a Chinese wuxia role-playing game, not based on any existing game or screenshot. An uncanny dream of a wedding in a traditional mountain manor courtyard. High elevated oblique fixed camera, realistic painterly architecture and materials, detailed old grey flagstone floor. Crimson wedding cloth draped across the NORTH hall, paired red lanterns hung between timber columns, a tasteful red double-happiness character 囍 on a hanging square only in the far north hall. Warm amber festive lamps mixed with cool moonlit shadows, festive setting quietly becoming ominous. No people: moving bride, hero, and approaching elder will be added independently in code. Wide UNOBSTRUCTED central courtyard floor occupies x360..1300 y440..920, with clear walking space for three characters. Hall steps along upper edge around y380; low side plant stands, a few benches and brass candles restricted to upper or far side edges. Large courtyard entrance gap in the SOUTH edge x700..900 y930. No banquet tables on the central floor, no center altar, no raised center platform. East-side narrow path runs into the open courtyard from x1320 y590. Rich engraved wood and stone, natural contact shadows, balanced restrained red fabrics, slightly misty far walls only. Full frame environment, not a floating diorama. No characters, no HUD, no UI, no other writing, no logos, no magic marks, no copied artwork. Coherent perspective suitable for small game characters moving across the floor.
```

## lake-dream

产品文件：`public/assets/lake-dream.png`。

生成来源：`C:\Users\kwgrg\.codex\generated_images\01a088cc-a046-7932-9942-4d38be2d16a9\exec-e4bd8173-bb80-4fcf-879f-a6b91aa6d47c.png`。

SHA-256：`0EF7456CBCB0972E2E78DE1D10C86A6E7DB84C3C834F4057A6DE1DB7E1446DB6`。

完整提示词：

```text
Use case: historical-scene. NEW original 1536x1024 high quality painterly realistic background for an independently created Chinese wuxia role-playing game. Dreamlike high mountain lake at cold moonlit twilight, named only visually, no writing. A majestic dark-blue still lake occupies the UPPER HALF of the image with far snow-capped mountains, faint mist, moon reflected softly on the water. In the LOWER HALF, a broad clearly navigable weathered stone shore and sparse frost-covered grass: flat open ground across x430..1300 y610..940. The curved natural WATER EDGE is clearly visible and runs approximately through (460,470), (850,500), (1210,555). Dry ground extends south of that edge with a shallow gentle bank: two characters should be able to stand facing each other in the lower center, and one can walk toward the water edge at x900,y535. No fence along the central water edge. A few small jagged rocks and bare twisted pine trees confined to extreme side edges, no central tree, no central obstacle, no statues, no temples, no bridge, no boat. Fixed high oblique camera, coherent ground plane and contact shadows, crisp stone details, frost and tiny subdued silver reflections, a quiet unsettled atmosphere, delicate cold blue palette. Spacious readable walking area and natural lakeshore curve. No people, no UI, no HUD, no text, no logo, no fantasy glowing symbols, no copied art, no existing-game or screenshot reference. Full scene edge to edge, not a floating miniature.
```

## 验证与限制

三图均已直接目视，并接入真实浏览器演出。婚礼演出修正孟知秋最终落脚点为 (900,730)，避免与蔷薇遮叠；其对白头像也与场景长者图格一致。天池蔷薇终点 (900,550) 在干岸，真儿房行走不穿床或书桌。实际截图见 night-dream-kill-browser.md 与 night-dream-refuse-browser.md。

曾尝试用内置编辑器为本项目真儿房生成保留家具位置的清晨版本，但本地图片读取触发 sandbox helper 错误，两次均无输出；没有改用 API/CLI，也没有产出或引用晨景图片。当前翌日用演出明暗与剧情状态表达，窗外月色尚未切换为清晨，这是未完成的视觉细节。此记录不将生成图片数量或几何检查当作原版场景匹配率。

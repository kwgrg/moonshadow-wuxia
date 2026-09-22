# 岛村、大陆码头与月眉儿原创美术记录

制作及校验日期：2026-09-22。本记录仅说明本轮三张图片的来源、文件一致性和接入边界；剧情证据另见 [邪线岛战与码头核验](evil-docks-reference.md)，任务与演出实现见 [本轮演出记录](evil-docks-staging.md)。

## 生成来源与文件校验

三张图片均由根代理使用内置 `image_gen` 从文字提示全新生成。生成时没有提供参考图片、原游戏图片、原地图、角色截图或其他原版输入。本记录编写只读取项目文档、提示词记录、这三个新生成文件及其交付文件，没有读取原版目录。

交付文件与下表所列 imagegen 原始产物逐字节一致；PNG 头部尺寸、文件长度、SHA-256 和完整字节比较均已核对。未对文件做裁切、缩放、补画、抠图、调色或拼接。运行时按场景坐标缩放显示人物，对白框取其上身显示，这些显示变换没有改写 PNG。

| 交付文件 | PNG 尺寸 | 大小（字节） | SHA-256 |
| --- | --- | ---: | --- |
| `public/assets/island-village.png` | 1536 × 1024 | 3769077 | `afba54159b95e726ee6e1f8a99a048e449b4dc497abc54e3741b02f254548e36` |
| `public/assets/mainland-dock.png` | 1536 × 1024 | 3471096 | `5afc723b8d03c7557c38f07dc5530d08708857d50871a72db008594efadd764b` |
| `public/assets/mei-original.png` | 1024 × 1536 | 1863287 | `600078a555c6a6a345ea254338453f84e3e5bd7241fd32f2f0bd4e89603d89fb` |

三个原始产物位于 `C:/Users/kwgrg/.codex/generated_images/01a088cc-a046-7932-9942-4d38be2d16a9/`：

- 岛村：`exec-567f5b34-7526-4478-9795-905ffdc42da7.png`。
- 大陆码头：`exec-bbf880cf-8031-4db1-bcd1-2df63b23c2f3.png`。
- 月眉儿：`exec-94c6af47-39c6-4803-98c9-5c9ee8ce46e4.png`。

## 已核机制与原创设计的区分

| 参考记录支持的内容 | 本项目独立设计 | 尚未据此核定的内容 |
| --- | --- | --- |
| 村内两名居民求援后撤离；35 名强盗和 1 名头目全部清除才继续 | 岛村房屋、菜田、石墙、广场、地面材质，以及 36 名敌人的格网站位和战斗数值 | 原版村落逐像素布局、碰撞、敌人原始站位和战力 |
| 忘忧岛码头五名居民送别，随后乘船转中原码头 | 原创岛岸底图继续用于送别；另绘大陆河港、仓房、石铺广场和木栈桥，用实际门户连接航渡 | 全部原版常规航路及中原码头至山庄的道路拓扑 |
| 月眉儿接受后同行，并参与村战；紫轩在大陆码头出现，两种答复均导致倒地结果 | 新成人女性形象采用象牙外衣、深青衣、暗红腰带与独立面容；场景、战斗、跟随和对白按月眉儿姓名调用同一图片 | 原版人物精确肖像、服装裁片、体型比例、动作帧及所有姿态 |
| 楼中第二次交锋是隐藏主角和同伴的插叙 | 临时 `towerInterlude` 复用项目已有原创 `hall` 图，并采用独立站位 | 没有新增或复制原版楼中战斗背景，也未据静态线索核定原引擎所有数值胜负 |

本轮美术不负责改变参考机制，也没有新增绑架现场、剧情物品或死亡奖励。拒杀支月眉儿挥剑的具体表现是原创演出，不能用这张人物图或出手动画证明原版存在相同动作。

## 接入、画面与几何边界

- `r_island_village` 使用 `island-village`，`r_mainland_dock` 使用 `mainland-dock`。两图各有专用地面多边形转矩形条带 mask、独立探索点和门户；没有把同一张底图改名充作两处场景，也没有叠加通用平面道路、池塘或石块。
- 场景生成未完全服从提示词的门口坐标。岛村原提示的左侧 `(230,730)` 实际邻近菜田围栏，接入采用画面上方可行村路出口 `(230,595)`、到达点 `(370,605)`；南面向渡口出口为 `(810,935)`。没有为了沿用提示坐标让角色走穿围栏。
- 大陆码头原提示右侧 `(1370,820)` 实际被建筑遮挡，接入采用南部可见石阶出口 `(710,920)`、到达点 `(720,800)`；船岸出口为木栈桥 `(700,335)`、登陆点 `(700,455)`。北方江水保留为不可走区域。
- 两张完整场景图已通过浏览器图像预览核对，mask 根据实图修改，并核验人物落脚与门户连通。矩形条带是对画面可行地面的近似，不是逐像素分割，也不是原版地图碰撞复刻。
- `mei-original` 是一张站立人物画，用于同伴、演员、战斗单位及对白显示。当前移动、朝向、出手和倒下由独立运行时的变换与特效表现，尚无原版动作帧复刻；单张站姿不能视为完整角色动画集。它也没有补齐其他居民与紫轩的专属多姿态素材。
- 缺少新人物资源时仍有既有人物图集兼容回退；旧图集共用格不表示已核定人物原貌。新增人物图的来源记录不保证与所有既有形象没有相似处，也不构成版权或其他权利的法律结论。

## 当前验证范围

本轮 `validate-evil-docks-world.mjs` 已通过：96 个独立足点、3330 条点对路径逐 5 像素检查、36 名敌人独立站位与主角初始安全距离、11 次实际相邻跨图，以及分支、旧档通行旗标和双向航渡标签。`validate-quality.mjs` 与 `validate-interface.mjs` 在本轮接入后通过。

全点对检查还暴露了旧岛岸寻路采样擦过碰撞角的问题；根代理已将线段可行判断改为矩形解析相交，该复现继续保留在新专项中。上述自动检查说明当前脚点和路线通过对应断言，不能据此声称画面、操作或全流程已完整复刻。实际剧情演出、刷新恢复和战斗体验的浏览器验收应结合本轮独立验收记录。

## 完整生成提示词

以下逐字保留根代理保存的 `work/evil-docks-art-prompts.json` 三个字符串内容，包含生成时提出而接入时根据实图修正的门口坐标。

### islandVillagePrompt

```text
Create a new original 1536x1024 painterly realistic environment background for an independently developed Chinese wuxia RPG. Fixed elevated oblique camera, detailed weathered stone and packed earth, coherent grounded architecture. A remote inhabited island village under overcast late afternoon light, distant mountain greenery and glimpses of sea only above rooftops. Wide village commons for a real skirmish: the lower and central scene x330..1350 y450..920 must be an unobstructed gently worn flat ground plane, large enough for many small moving characters, with no large central buildings, raised platform or water. Traditional tiled cottages, bamboo fences, rough stone low walls, woven baskets and small wood piles stay along the FAR TOP edge and extreme sides. Two separate village paths: entrance from left edge x230,y730; exit toward the harbor from bottom center x800,y940. A hut veranda along top-left and a taller tree at far upper right make the village recognizable, but trunks and furniture do not cover the central floor. Distinct rural village architecture, not a palace courtyard, not just a shoreline. Open doors suggest inhabitants who have fled. Soft cloudy daylight, legible footprint shadows, restrained brown-grey earth and deep green foliage, textured but readable environment. No fire, no blood, no corpses, no people, no HUD, no UI, no text or signs with writing, no logo, no magic symbols, no drawn combat units. Do not reproduce any existing game's map, art or screenshot. Full frame environment, not a floating diorama.
```

### mainlandDockPrompt

```text
Create a new original 1536x1024 high quality painterly realistic environment background for an independently developed Chinese wuxia RPG. Fixed elevated oblique camera, same kind of perspective as a classic top-down roleplaying scene, original design only. A busy-looking but currently EMPTY mainland river harbor in traditional China, grey-green river occupies the UPPER THIRD only, sail masts and distant shore architecture beyond. A sturdy weathered wooden landing pier and a moored modest river boat are near top-center, gangplank ending at solid ground around x820,y430. The LOWER TWO THIRDS form a broad flat stone quay, clearly walkable open area x420..1240 y490..920 where three characters can stand and act without obstacles. On the far LEFT edge a timber warehouse with hanging rope and covered crates; on the far RIGHT edge low stone parapet and merchant buildings. Keep goods, barrels, stacked ropes and posts restricted to upper and outer edges, no clutter in central foreground. An obvious stone road exits to the RIGHT at x1370,y820 into a mainland town, another broad walking approach from bottom center. Soft late afternoon daylight, warm old wood and cool grey slabs, subtle water reflections, convincing contact shadows and consistent ground plane. It must read as mainland dock with paved road and warehouses, distinct from a secluded island beach. No people, no combat actors, no bodies, no HUD or UI, no readable writing, no logo, no fantasy symbols. Do not copy any existing game or screenshot. Full environment edge to edge, not miniature diorama.
```

### meiOriginalPrompt

```text
Create one ORIGINAL full-body character sprite for an independently made Chinese wuxia role-playing game, with a genuinely transparent background. A Chinese woman clearly an adult in her mid twenties, long black hair half-tied with a small restrained bronze clasp, alert calm face with a subtly guarded expression, slender athletic build. Unique clothing design: flowing but practical IVORY outer robe over dark JADE-TEAL travel clothes, muted CRIMSON narrow waist sash, deep teal fitted sleeves, soft dark boots. Elegant martial traveler, fully clothed, no cleavage or exposed midriff. A sheathed narrow Chinese sword at her left waist angled close to her body, both hands relaxed and fully visible. Three-quarter view facing slightly toward viewer's left, neutral standing pose with both feet planted and clearly visible, anatomically coherent hands and face. Painterly realistic illustrated game art, fine fabric texture and naturally shaded folds, soft balanced ambient light, clearly readable silhouette at small scale. Entire body from hair to boots inside frame with ample transparent margin; vertical figure centered in a 1024x1536 portrait canvas, not cropped, no duplicate people, no other poses, no motion blur. No environment, no cast ground shadow outside the figure, no painted background, no fog, no halo, no UI, no text, no labels, no watermark, no logo. Do not reproduce any existing game character, costume, portrait or screenshot. This is a newly designed character artwork with an independent face and silhouette.
```

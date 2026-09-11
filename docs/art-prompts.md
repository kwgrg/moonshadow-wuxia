# 独立场景素材与提示词

生成日期：2026-09-11。全部使用内置 image_gen 工具，逐张生成并目视检查。每张为 1536 × 1024 PNG。未使用原版截图、原版地图数据、原版贴图或游戏文件作为输入。这些图片是原创环境重绘，用于提升可探索场景的区分度，**不代表完成了原版场景或地形的准确匹配**。

尺寸提示与可行区域目标只指导图像构图，不能自动成为碰撞范围。应依据每张图中的真实地面轮廓、障碍物和出入口建立寻路与碰撞数据。

## cliff

- 文件：`public/assets/cliff.png`
- 目视检查：中央开阔石台可行；父墓约 (390,190)，下山路径约 (1300,870)。栏杆、悬崖和松树占据边缘，不能把画面矩形全当作地面。高处背景仍有少量远山，后续精确匹配须依原版截图重绘。
- 检查结果：独立场景、无人物、无 UI、无水印、无可读文字；地面轮廓与通道可辨认。尚未做原版匹配评审。
- 默认生成源文件：`C:\Users\kwgrg\.codex\generated_images\01a08f23-5ed8-7533-bad0-17cda40e0aba\exec-44568c17-a199-478e-b47d-cc24d5f68185.png`

### 最终提示词

```text
Use case: stylized-concept. Asset type: a production background map for a Chinese wuxia 2.5D role-playing browser game. Create a single complete 1536x1024 landscape image, aspect ratio 3:2. Fixed orthographic/isometric camera looking down at 45 degrees, like a detailed classic prerendered RPG map, no horizon and not a cinematic poster or distant panorama. Refined realistic painted materials, richly textured old stone, roof tiles, timber and layered plants. The ground occupies at least 70% of the image; broad clearly visible continuous walkable ground especially pixel rectangle x200-1450 y380-930. Keep this main gameplay area open and unobstructed. Architecture and tall natural features belong mainly to the upper and side margins. Medium-sized game map with numerous meaningful environmental details, visually coherent scale. All characters will be rendered separately by a game engine, so NO people, NO animals, NO text, NO writing, NO symbols that look like writing, NO logos, NO watermark, NO interface. Original new environment painting inspired by classic Chinese wuxia atmosphere, not a claimed reproduction of an existing game's terrain. Scene: Lingjue Peak mountaintop departure point, a modest father's grave made of unlettered weathered stone on a low stone platform near the upper-left, incense vessel and mountain flowers beside it; open weathered grey stone plateau in the center, low broken stone railings around the edges, gnarled mountain pines at the upper and left margins, steep crag edges and mist confined to the far outside borders, a clear broad winding descent path exiting at the lower-right. A few flat mossy stones and sparse grass at the sides; emotionally quiet early dawn, cool jade-grey and muted warm sunlight. Grave and plateau must read as approachable playable objects, not a scenery vista. Most of the frame must be usable stone earth ground, one connected contiguous game arena.
```

## inn

- 文件：`public/assets/inn.png`
- 目视检查：中央院落清楚可行；入口位于下左约 (380,800)，上山路在右上约 (1330,190)，酒肆门约 (660,180)。桌椅、灶台、围栏需要避障。
- 检查结果：独立场景、无人物、无 UI、无水印、无可读文字；地面轮廓与通道可辨认。尚未做原版匹配评审。
- 默认生成源文件：`C:\Users\kwgrg\.codex\generated_images\01a08f23-5ed8-7533-bad0-17cda40e0aba\exec-c218c16f-68c7-4a36-a350-89fff6aa9a20.png`

### 最终提示词

```text
Use case: stylized-concept. Asset type: a production background map for a Chinese wuxia 2.5D role-playing browser game. Create a single complete 1536x1024 landscape image, aspect ratio 3:2. Fixed orthographic/isometric camera looking down at 45 degrees, like a detailed classic prerendered RPG map, no horizon and not a cinematic poster or distant panorama. Refined realistic painted materials, richly textured old stone, roof tiles, timber and layered plants. The ground occupies at least 70% of the image; broad clearly visible continuous walkable ground especially pixel rectangle x200-1450 y380-930. Keep this main gameplay area open and unobstructed. Architecture and tall natural features belong mainly to the upper and side margins. Medium-sized game map with numerous meaningful environmental details, visually coherent scale. All characters will be rendered separately by a game engine, so NO people, NO animals, NO text, NO writing, NO symbols that look like writing, NO logos, NO watermark, NO interface. Original new environment painting inspired by classic Chinese wuxia atmosphere, not a claimed reproduction of an existing game's terrain. Scene: A rural inn courtyard below Wudang Mountain. Traditional grey tiled wooden inn buildings along upper edge, open doorways facing the courtyard; small roofed cooking corner and jars along the upper-left side, wooden dining tables and benches mainly along right and left perimeter, bamboo fencing, firewood stacks, hanging cloth canopy without markings, dense bamboo beyond border. A large empty connected earthen and stone-paved courtyard fills center and lower two thirds, a village lane exits lower-left and a mountain path exits upper-right. Calm warm late-afternoon light; ochre earth, aged brown wood, jade bamboo; authentic material wear, leaf litter and small grasses. Courtyard is an explorable ground-level place, not an architectural aerial poster.
```

## temple

- 文件：`public/assets/temple.png`
- 目视检查：山门、洗剑池和练武广场有明确区分；洗剑池约 (420,265)，大门台阶约 (820,250)，下方出口约 (450,910)。广场上的太极纹是地面装饰，不是文字。
- 检查结果：独立场景、无人物、无 UI、无水印、无可读文字；地面轮廓与通道可辨认。尚未做原版匹配评审。
- 默认生成源文件：`C:\Users\kwgrg\.codex\generated_images\01a08f23-5ed8-7533-bad0-17cda40e0aba\exec-c98d21a4-7bac-4eb8-9c10-736a6ee4c5a5.png`

### 最终提示词

```text
Use case: stylized-concept. Asset type: a production background map for a Chinese wuxia 2.5D role-playing browser game. Create a single complete 1536x1024 landscape image, aspect ratio 3:2. Fixed orthographic/isometric camera looking down at 45 degrees, like a detailed classic prerendered RPG map, no horizon and not a cinematic poster or distant panorama. Refined realistic painted materials, richly textured old stone, roof tiles, timber and layered plants. The ground occupies at least 70% of the image; broad clearly visible continuous walkable ground especially pixel rectangle x200-1450 y380-930. Keep this main gameplay area open and unobstructed. Architecture and tall natural features belong mainly to the upper and side margins. Medium-sized game map with numerous meaningful environmental details, visually coherent scale. All characters will be rendered separately by a game engine, so NO people, NO animals, NO text, NO writing, NO symbols that look like writing, NO logos, NO watermark, NO interface. Original new environment painting inspired by classic Chinese wuxia atmosphere, not a claimed reproduction of an existing game's terrain. Scene: The entrance precinct of a Wudang Taoist temple. Traditional mountain gate with pale stone base, dark grey tiled roof, timber pillars, and wide shallow stone steps across the upper edge. An accessible small square sword-washing pool with clear water near the upper-left side, bordered by low stone slabs, never in central travel lane. A broad worn flagstone plaza occupies the middle and bottom, connected flat paths to both side gates; tall cypress trees at upper corners; incense brazier and carved unlettered stone fixtures along side margins. No labels or writing anywhere. Soft clear mountain daylight, pale limestone, grey tiles, dark evergreen, quiet solemn atmosphere. An inviting usable temple approach map with large open central practice space.
```

## hall

- 文件：`public/assets/hall.png`
- 目视检查：大殿具有开放石板地面，祭台约 (770,160)，主入口约 (770,900)；两侧木柱、兵器架及上方祭台应阻挡。
- 检查结果：独立场景、无人物、无 UI、无水印、无可读文字；地面轮廓与通道可辨认。尚未做原版匹配评审。
- 默认生成源文件：`C:\Users\kwgrg\.codex\generated_images\01a08f23-5ed8-7533-bad0-17cda40e0aba\exec-91945ae8-0522-48da-ad3f-47c05d7a6bff.png`

### 最终提示词

```text
Use case: stylized-concept. Asset type: a production background map for a Chinese wuxia 2.5D role-playing browser game. Create a single complete 1536x1024 landscape image, aspect ratio 3:2. Fixed orthographic/isometric camera looking down at 45 degrees, like a detailed classic prerendered RPG map, no horizon and not a cinematic poster or distant panorama. Refined realistic painted materials, richly textured old stone, roof tiles, timber and layered plants. The ground occupies at least 70% of the image; broad clearly visible continuous walkable ground especially pixel rectangle x200-1450 y380-930. Keep this main gameplay area open and unobstructed. Architecture and tall natural features belong mainly to the upper and side margins. Medium-sized game map with numerous meaningful environmental details, visually coherent scale. All characters will be rendered separately by a game engine, so NO people, NO animals, NO text, NO writing, NO symbols that look like writing, NO logos, NO watermark, NO interface. Original new environment painting inspired by classic Chinese wuxia atmosphere, not a claimed reproduction of an existing game's terrain. Scene: Interior of Wudang's main Taoist hall, roof and front wall cut away so the playable interior is fully visible. Vast worn grey stone tile floor with a subtle geometric grid occupies central and bottom 75 percent. Tall dark-red wooden pillars confined near the left and right walls, carved wood lattice windows along sides, a modest altar and uninscribed wooden backdrop on a raised shallow dais along upper wall, ritual vessels and bronze incense burners near upper corners. Side racks with practice wooden swords; small prayer mats at upper sides. Open entry threshold at lower center. Spacious indoor exploration and sparring area, connected unobstructed central floor. Soft shafts of daylight from side windows, warm candlelight near altar, rich realistic wood and stone details, dignified and quiet.
```

## island

- 文件：`public/assets/island.png`
- 目视检查：草地庭院、水岸、小屋、草药园和码头明确区分。核心地面约 x300–1080 y390–780；小屋门约 (310,240)，草药小道 (990,310)，码头约 (1300,705)。右侧水面、药圃和石岸不可当作普通地面。
- 检查结果：独立场景、无人物、无 UI、无水印、无可读文字；地面轮廓与通道可辨认。尚未做原版匹配评审。
- 默认生成源文件：`C:\Users\kwgrg\.codex\generated_images\01a08f23-5ed8-7533-bad0-17cda40e0aba\exec-357a5dcc-fe9a-428e-9f33-d6122227a5d8.png`

### 最终提示词

```text
Use case: stylized-concept. Asset type: a production background map for a Chinese wuxia 2.5D role-playing browser game. Create a single complete 1536x1024 landscape image, aspect ratio 3:2. Fixed orthographic/isometric camera looking down at 45 degrees, like a detailed classic prerendered RPG map, no horizon and not a cinematic poster or distant panorama. Refined realistic painted materials, richly textured old stone, roof tiles, timber and layered plants. The ground occupies at least 70% of the image; broad clearly visible continuous walkable ground especially pixel rectangle x200-1450 y380-930. Keep this main gameplay area open and unobstructed. Architecture and tall natural features belong mainly to the upper and side margins. Medium-sized game map with numerous meaningful environmental details, visually coherent scale. All characters will be rendered separately by a game engine, so NO people, NO animals, NO text, NO writing, NO symbols that look like writing, NO logos, NO watermark, NO interface. Original new environment painting inspired by classic Chinese wuxia atmosphere, not a claimed reproduction of an existing game's terrain. Scene: Wangyou Island lakeshore physician's cottage and herb garden. A small tasteful grey-tile timber cottage with open porch occupies upper-left margin, adjacent orderly medicinal herb beds and ceramic herb pots near upper edge. Shallow turquoise lake and reeds border only rightmost edge; small wood landing pier attached to walkable shore at lower-right. Broad connected compact-earth and pale-stone pathways form an open courtyard across center and bottom, with a flat accessible grassy area. Willow canopy and flowering shrubs frame upper-right and left edges without covering the gameplay floor. Bamboo drying racks and water jars along cottage exterior. Clear soft morning light, restorative quiet, delicate blossoms, rich translucent water but most of frame is walkable land. Cottage doorstep, garden path, shore and dock connected in one playable map.
```

## cave

- 文件：`public/assets/cave.png`
- 目视检查：石洞中央及上下通路清楚，洞口约 (230,110) 和 (1350,165)，石台约 (790,150)。核心地面约 x440–1250 y330–760；左侧和右下水潭、石笋阻挡，最下中央通路约 (850,945)。
- 检查结果：独立场景、无人物、无 UI、无水印、无可读文字；地面轮廓与通道可辨认。尚未做原版匹配评审。
- 默认生成源文件：`C:\Users\kwgrg\.codex\generated_images\01a08f23-5ed8-7533-bad0-17cda40e0aba\exec-a03e398c-4177-4f43-bc5c-2b516ec6b7ba.png`

### 最终提示词

```text
Use case: stylized-concept. Asset type: a production background map for a Chinese wuxia 2.5D role-playing browser game. Create a single complete 1536x1024 landscape image, aspect ratio 3:2. Fixed orthographic/isometric camera looking down at 45 degrees, like a detailed classic prerendered RPG map, no horizon and not a cinematic poster or distant panorama. Refined realistic painted materials, richly textured old stone, roof tiles, timber and layered plants. The ground occupies at least 70% of the image; broad clearly visible continuous walkable ground especially pixel rectangle x200-1450 y380-930. Keep this main gameplay area open and unobstructed. Architecture and tall natural features belong mainly to the upper and side margins. Medium-sized game map with numerous meaningful environmental details, visually coherent scale. All characters will be rendered separately by a game engine, so NO people, NO animals, NO text, NO writing, NO symbols that look like writing, NO logos, NO watermark, NO interface. Original new environment painting inspired by classic Chinese wuxia atmosphere, not a claimed reproduction of an existing game's terrain. Scene: A subterranean stone cave reached below a lake, an explorable wuxia cavern. A broad continuous dry limestone and gravel floor fills middle and lower 75 percent, traversable between a dark cave tunnel opening in upper-left and another arched rock passage at upper-right. Clear shallow blue-green groundwater pools restricted to side borders; layered stalagmites and stalactites mostly along back and side walls; a small ancient unlettered stone platform against upper center. Subtle moss, wet rock reflections, scattered flat stones and mineral veins add detail, no giant obstacles in center. Shafts of cool reflected lake light through fissures illuminate the floor; gentle amber lamp glow from a small stone niche at the side. Readable playable map with strong depth and carefully separated dry travel routes, not a narrow dark cinematic corridor.
```



# 原创地牢背景制作记录

制作日期：2026-09-22。工具：内置 `image_gen`（imagegen skill 默认模式）。交付文件：`public/assets/cult-dungeon.png`，1536 × 1024 PNG。未使用 CLI、API 密钥或程序图像编辑。

## 来源与制作过程

图像仅从下列文字要求生成，没有输入原游戏素材、网页截图、地图、角色或解包文件。先生成一张构图候选，目视发现横墙与门口妨碍现有坐标；尝试基于这张新图进行布局编辑时，Windows 文件系统 sandbox helper 无法读入文件，编辑调用在生成前失败。随后使用更简洁的布局提示词重新从零生成，采用第二张。未把第一张或失败编辑结果放入产品。

选定原始产物：`C:\Users\kwgrg\.codex\generated_images\01a0c767-ee49-7d52-89bc-0fc6287a6a99\exec-c4c512d0-827c-4d76-b7cf-f35fbd52c626.png`。交付时仅复制文件，没有裁切、缩放、补画、调色或拼接。

交付文件大小：2991999 字节；SHA-256：`0ac79c14251a23e0e757558b6322b87338f5925c01990b268bc554106eaab2b3`。

## 接入与几何边界

- `ROUTE_MAPS.r_cult_dungeon.art` 与该场景 `art` 指向 `cult-dungeon`；fallback 为已有原创 cave。
- `scene.maskArt='cult-dungeon'` 使用这张原创图片专用的碰撞配置；外周保留连通边界，中央墙按新图片可见脚底重新标定。
- 中央碰撞由旧 `[795,510,865,680]` 改为 `[772,425,816,595]`，消除墙北段可穿和旧位置右下空地被挡的问题。actor 点位与所有 portal 出入口不动；北侧路线改为实际绕墙北端。
- 移除本场景程序叠加的 gate、rock、lantern props，石砌墙、开放牢门和灯光由背景承担。旧灯 inspect 点在新图实为地面，改为“地面水痕”与原创观察文字，并保留旧 ID 和 paintOnly。
- 目视已确认无角色、血迹、文字、UI或水印；两侧牢门开放，大块中央地面可辨，重要演出站位落在空地。
- 生成器没有完全服从原提示词坐标：中央墙偏向左上，东北台阶亦有偏差。接入时已按新墙实际脚底修正碰撞，出口保留在可达的台阶附近；运行时的矩形边界仍为近似，不声称逐像素对齐或原版建筑关系已核验。
- 整体材质、光照与牢房结构是本项目原创美术；它改善通用洞穴叠平面道具的表现，但不能替代完整浏览器落脚点与移动验证。

## 提示词记录

### 选定图的完整提示词

```text
Use case: stylized-concept.
Create ONE completely original finished background for a 2D wuxia role-playing game. Canvas EXACTLY 1536 pixels wide by 1024 pixels high. No input images. Hand-painted premium environment art with fine realistic stonework, iron, wear and soft oil-lamp light. Desaturated grey-green masonry, small amber lights, an underground Chinese stone dungeon. Fixed steep oblique overhead camera, not a front-view interior, no dramatic perspective.

COMPOSITION: the top third (image y0–340) is mostly dark stone architecture and rock; the MAIN OPEN FLOOR begins at y345 and extends to y950, from x325 on the left to x1375 on the right. Fill this lower broad area with worn stone floor. The design is a large connected OPEN chamber with two prison alcoves set into the far side walls. Both iron cell gates are OPEN and folded against the FAR LEFT and FAR RIGHT outer walls. There are NO transverse walls across the middle of the floor, NO raised curbs crossing walkways, NO furniture, NO center columns.

A single low narrow masonry divider stands between the two sides. Its visible ground footprint is centered at pixel (830,600), extends only from x795 to x865 and from y510 to y680, with a very low profile. It looks like a short freestanding thin stone wall, never a boulder, pillar, long room wall or tall tower. Walkable floor is visibly continuous north of it at y445 and south of it at y750. Keep the exact locations (650,610), (1020,570), (575,655), (940,620), (845,445), (730,740), (1040,735), and (1220,440) clear FLOOR, without objects or wall silhouettes: animated characters will stand there.

A clearly open SOUTH entrance is centered at (830,915). Leave its approach x755–905,y790–950 empty and continuous. A NE stone stairway has its BOTTOM LANDING precisely around (1270,410); steps rise northeast from that landing into the dark perimeter. Leave clear stone approach from (1160,490) to (1220,440) to that landing. The stairway must NOT end at the very top edge of the picture.

Left/right barred alcoves, small inset wall lamps and uneven outer masonry give the room an unmistakable prison identity. Restrict all other solid architecture and rock to the perimeter; use shadow there, never to hide the central ground. Outer corners may contain dark rock masses at x325–510 below y660, x510–650 below y805, and x1100–1375 below y810. The broad middle floor from x510–1225,y390–805 is open EXCEPT the small divider.

Dense, crafted texture and material detail on stone blocks and iron bars, subtle water staining and worn mortar, carefully blended shadows; atmospheric but legible. No fog obscuring the floor. Full-bleed image. NO people, bodies, creatures, statues, weapons, blood, gallows, text, inscriptions, labels, symbols, numbers, grid, arrows, UI or watermark. Do not reproduce any existing game image or named game's map.
```

### 首张未采用候选的完整提示词

```text
Use case: stylized-concept.
Asset type: finished original 2D game environment background, exactly 1536 × 1024 landscape pixels, for a top-down/isometric wuxia RPG. This is a new composition from written requirements only; no input or reference images.
Primary request: a richly painted, believable underground stone-built Chinese martial-arts dungeon, with two open prison cells, connected passages, worn grey-green flagstones, mortared blockwork, dark iron bars, restrained amber wall oil lamps, weathering and atmospheric depth. Render as polished high-resolution hand-painted game art, nuanced material texture and realistic light, neither a diagram nor low-poly geometry.
Camera: fixed steep oblique overhead, approximately 65 degrees down, no perspective vanishing point or dramatic wide-angle. Show a continuous playable floor in the lower two-thirds, architecture and rock around its outer boundary. No roof obscuring the floor. Keep the floor readable, with fine texture rather than busy clutter.
Precise pixel-space layout is essential. Coordinates refer to the final 1536×1024 canvas, x from left, y from top. The entire main walkable floor fits x325..1375 and y345..950. Keep these connected floor areas clear:
- broad left cell floor centered at (650,610), clear open space at (575,655) and (650,685);
- broad right cell floor centered at (1020,570), clear open space at (940,620) and (1020,645);
- an unobstructed north connecting corridor following y445 from x650 to x1220, with clear standing floor at (845,445);
- an unobstructed south connecting corridor following y750 from x650 to x1080;
- south arrival passage centered x830, from y790 to the bottom entrance at (830,915);
- northeast stone staircase/open stair doorway centered at (1270,410), approached from (1160,490) and (1220,440).
Between the two cells, the ONLY central solid object is one narrow low masonry divider occupying x795..865 and y510..680. It is a long thin north-south stone partition, NOT a large boulder or central pillar. Its north and south ends MUST leave the y445 and y750 corridors open. A restrained low profile ensures it never hides the north corridor. The two cell gates are open and folded against the cell edges; they are built into the stonework, not freestanding ceremonial arches. Nothing crosses either cell approach.
Perimeter blocked masses may occupy the top band above y345; the far left outside x325; stepped lower-left masonry/rock at x325..510 below y660 and x510..650 below y805; lower-right masonry at x1100..1375 below y810; and a narrow right wall at x1300..1375 between y590 and y805. Outside the playable floor use dark masonry/rock and deep soft shadow to frame the interior; not an outdoor cavern landscape. Keep the middle ground calm and free of props so separate animated actors will fit naturally.
Lighting: cool desaturated jade-grey ambient light, small warm amber sconces set into walls, soft contact shadows, quiet solemn dungeon mood. Fully resolved craftsmanship, cracks, damp stone seams, worn stair treads and ironwork; no theatrical fire, glowing magic or fog covering the pathways.
Do not include any people, bodies, creatures, statues, weapons, blood, hanging victims, text, calligraphy, numbers, symbols, labels, borders, title, watermark, UI, arrows, grids, or coordinate markings. Do not imitate or recreate a named game's background. No giant decorative foreground objects. Deliver one finished full-bleed background image.
```

## 验证状态

生成结果已在 image_gen 输出中目视检查。接入后 `validate-cult-route.mjs` 通过：374 条路径、75 次演出步骤恢复、12 个旧索引样本。`validate-interface.mjs` 也通过：153 场景、2,276 次绘制调用。`git diff --check` 无空白错误，仅既有 CRLF 转换提示。实际浏览器已从原完成存档刷新进入新地牢：两名倒地人物、主角均落在石地，纳兰不再出现；北侧绕墙可达，南端 y617–621 可横穿，没有旧 y680 的隐形障碍。点击墙体不行走进去，空 E 不触发对白或自动走路。最终425版的北端复查见 cult-staging.md。

最终碰撞专项：374条点对路径逐6像素检查、墙体/邻接地面采样、南北绕行逐5像素检查和75步演出恢复均通过。地图背景总数为12，153场景界面检查通过。37项匿名游戏资源、6项不可公开路径及38文件Wrangler dry-run通过。

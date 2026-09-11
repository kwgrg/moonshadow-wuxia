# 透明道具图集生成记录

日期：2026-09-11。成品：`public/assets/props.png`。

使用内置 image_gen 生成，未使用 API／CLI，也未对图像执行程序化抠图、重排或缩放。复制的是最终生成 PNG 原始字节。这是新制武侠游戏道具图，非原版素材。

## 图集约定

1536 × 1024 RGBA PNG，1,833,733 字节。严格按 4 列 2 行切为 8 个 384 × 512 单元。

| 索引 | 单元列／行 | 道具 | alpha > 80 的局部轮廓包围盒 x1,y1,x2,y2 |
| --- | --- | --- | --- |
| 0 | 0 / 0 | 关闭的古木宝箱 | 78,199,324,444 |
| 1 | 1 / 0 | 打开的古木宝箱 | 89,135,347,444 |
| 2 | 2 / 0 | 无字矮石路碑 | 114,149,292,450 |
| 3 | 3 / 0 | 布包行囊 | 85,231,307,446 |
| 4 | 0 / 1 | 无字木路牌 | 80,62,323,430 |
| 5 | 1 / 1 | 小铜灯笼 | 95,133,280,427 |
| 6 | 2 / 1 | 低石座长剑 | 102,63,297,442 |
| 7 | 3 / 1 | 古塔机械拉杆 | 70,131,343,436 |

源矩形：`[column * 384, row * 512, 384, 512]`。每格建议落地锚点 `(192,450)`，或按表中实体底部微调，不宜以整格底端 512 作为物体脚底。

## 生成与重复检查

第一版图虽然包含真实 alpha，却有打开宝箱超出列界、路牌及剑进入上排的问题，未复制进项目。引用它进行定点编辑时，本机文件沙箱读取失败；随后使用内置生成器重新生成一版，强化坐标与留白约束，没有转用未经请求的 API 或 CLI。

第二版目视检查：八种道具、顺序正确，材质为木纹、铜、布和石材，俯视投影统一，宝箱开闭能够配对；无人物、文字、网格边框或 UI。机械道具采用带手柄的古塔绞盘式拉杆造型。

程序只读检查：

- RGBA，1536 × 1024，真实透明通道范围 0..254。
- 约 79.63% 像素为 alpha 0。
- 八个道具的可见实体轮廓均独立留在各自单元内，无实体越界／截断。
- 单元边界存在零星 alpha 1 的生成噪点；没有伪称所有边界像素绝对为零，也未用程序改写图像。其不透明度约 0.4%，不影响正常切片。
- 未实测原作道具尺度；游戏中需结合角色大小、缩放和碰撞继续检查。

## 最终采用提示词

Create a production PNG transparent sprite sheet, exactly 1536x1024 pixels. The picture is a strict UNDRAWN 4 column x 2 row uniform grid. Every cell is 384x512 pixels. TRUE TRANSPARENT ALPHA canvas, completely transparent between objects. Exactly eight realistic Chinese wuxia 2.5D props, fixed 45 degree downward camera, detailed aged wood, bronze and stone. Each prop is SMALL inside its cell, never larger than 270 pixels wide and 350 pixels tall. CRUCIAL PLACEMENT: Each prop bottom is at local y=445 within its cell, x center local192. Thus each object fits entirely inside its local rectangle x=57..327 y=95..445. The sword also MUST fit this small rectangle. Mandatory absolute object placement rectangles: closed old wooden treasure chest inside [57,95,327,445]; open matching treasure chest inside [441,95,711,445]; short blank stone roadside marker inside [825,95,1095,445]; tied indigo cloth travel bundle inside [1209,95,1479,445]. Second row: blank wood directional sign on post inside [57,607,327,957]; small bronze lantern inside [441,607,711,957]; straight Chinese sword inserted into LOW stone socket inside [825,607,1095,957]; compact ancient tower mechanical lever inside [1209,607,1479,957]. These are generous transparent gutters, essential for an engine to cut equal cells without clipping. Never extend any item outside its specified absolute rectangle. Same upper left lighting, believable self shading, crisp smooth transparent edges. Chinese martial arts game pre-rendered sprite art, high fidelity physical materials. All signboards and stone marker are BLANK. Do not draw rectangles, gridlines, labels, cell borders or any written text. No characters, people, animals, interface, background, floor, clouds, smoke, cast shadows, ground patches or glow. All eight objects floating as isolated cutouts on 100 percent transparent surroundings. This is a sprite atlas, not a collage, scene or poster. Keep each object independent, centered and small; preserve the extremely generous padding.

生成器没有精确服从每一个内侧留白数字，但最终八个实体均在384 × 512单元内完整隔离。上表记录成品实测值，接入时以上表为准。

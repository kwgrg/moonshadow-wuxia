# 客栈客房／书房场景重绘记录

日期：2026-09-11。文件：`public/assets/bedroom.png`。

这是一张为网页版游戏新生成的室内场景，不是《月影传说》原版截图，也未声称还原原版客房网格。它解决原先用室外酒肆庭院代表客房的场景语义错误。

使用内置 image_gen，未使用 API／CLI。未提供参考图片。成品为 1536 × 1024 PNG，2,535,843 字节。已复制到项目中，未覆盖其他素材，也未删除默认生成位置的原图。

## 最终提示词

Use case: historical-scene. Asset type: playable 2.5D Chinese wuxia RPG environment background, newly painted game asset, NOT an original retail screenshot. Create one landscape image, 1536 x 1024 pixels, 3:2. A modest, richly detailed old Chinese inn guest bedroom with a small study corner, night scene, viewed from a fixed high 45-degree overhead game camera, near-isometric projection, no vanishing-point cinematic view. Frame the whole usable room. At least 70 percent of the image is one broad continuous unobstructed warm wooden plank floor across the center, lower half and right-lower entrance corridor, suitable for later overlaying independently animated small game characters. Furniture clustered ONLY along the uppermost and far side wall: modest Chinese timber bed at upper left tucked against wall, low tea table and a packed travelling bag on the upper wall line, small book cupboard on upper center wall, folding screen tucked upper right against the wall. One lattice window in the top wall shows moonlit bamboo outside; restrained amber oil-lamp lighting inside. OPEN ENTRANCE at lower right, unobstructed floor leading into the center. Very low front wall or cutaway, no giant foreground objects hiding the floor. Subtle hand-painted pre-rendered 2001-era Chinese wuxia adventure art, high definition natural wood grain, small ceramic tea utensils, paper lattice windows, crisp readable props, softly painted shadows. Architectural interior entirely fills image; no exterior courtyard, no mountain landscape, no poster composition. Leave center EMPTY. No people, no characters, no animals, no captions, no written characters, no signage, no logos, no UI, no vignette border. Furniture must be game-scale, not huge. Keep walls in upper quarter so the center and bottom remain a truly open playable space.

## 成品检查

- 目视确认是室内客房：左上床铺、上墙窗户／茶案／行李／书柜、右上屏风，窗外夜竹与月色。
- 中央木地板连续、空旷，可叠加角色；没有桌子或屏风堵住主区域。提示词要求 70% 留白，但没有对成品作像素分割，不把这个比例当已测量数值。
- 没有人物、动物、文字、招牌、UI 或海报标题。
- 右下方有出入口，前墙采用低栏杆。栏杆与盆栽应进入碰撞或遮挡计算，不能让角色直接从画面底边穿过。
- 文件头验证通过：PNG，1536 × 1024，3:2。
- 只完成素材与建议坐标检查，游戏内的缩放、角色比例、遮挡和出口连通由场景实现回归验证。

## 坐标建议

坐标以图像左上角为原点，单位为像素，仅是目视估计的游戏布局建议，不是原作坐标。

| 家具／结构 | 建议包围盒 x1,y1—x2,y2 |
| --- | --- |
| 床及脚踏 | 105,65—460,345 |
| 茶案与坐垫 | 535,175—760,282 |
| 书柜 | 875,42—1075,275 |
| 屏风 | 1090,55—1425,315 |
| 左墙边柜 | 0,325—145,500 |
| 右墙小柜 | 1390,290—1475,420 |
| 左前盆栽与木台 | 80,750—275,870 |
| 右前栏杆柱 | 1260,710—1325,925 |

保守主行走区：`x=220..1360, y=365..740`。下方延伸：`x=300..1070, y=740..865`。右侧入口通道：`x=1320..1420, y=600..900`，出入口中心建议 `(1370,890)`。边缘与家具应适当留出角色半径，实装时以多边形或局部障碍替代单一整图矩形。

图中已绘家具，无需再在同位置叠加另一套床或茶案。建议用于悦来客栈客房、普通室内书房或疗伤小屋，室外客栈入口仍保留原来的庭院素材。

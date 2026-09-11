# 人物身份图集重绘记录

日期：2026-09-11。成品：`public/assets/npcs.png`。

目的：替换掌柜、商人、道士、长者、村民、弟子、敌人共用杨影枫造型的情况，并给蔷薇单独的紫衣辨识。使用内置 image_gen 新生成，未使用 API／CLI，不是原版角色资源，不声称原版相貌或服装还原。

## 文件和切片

PNG，1536 × 1024，RGBA，2,007,457 字节。4 列 2 行，每格 384 × 512。源矩形按 `[column * 384, row * 512, 384, 512]`。

| 索引 | 身份 | 外观 | 局部实体包围盒 x1,y1,x2,y2 | 建议脚底 anchorY |
| --- | --- | --- | --- | --- |
| 0 | 掌柜 | 中年，褐衣围裙，略胖 | 100,65,301,486 | 486 |
| 1 | 商人 | 赭黄绿旅行服，小包与头巾 | 90,55,291,487 | 487 |
| 2 | 道士 | 灰蓝道袍，发髻与拂尘 | 95,46,287,486 | 486 |
| 3 | 长者 | 白发白须，深青长袍 | 87,44,291,490 | 490 |
| 4 | 村民 | 棕灰短衣裤，日常布衣 | 110,35,299,466 | 466 |
| 5 | 门派弟子 | 青灰袍，年轻，佩剑 | 116,25,296,466 | 466 |
| 6 | 黑衣刀客 | 黑衣蒙面，手持向下的短刃 | 110,38,293,466 | 466 |
| 7 | 蔷薇重绘 | 紫衣、高马尾、利落旅装 | 106,28,287,467 | 467 |

横向锚点可统一采用 local x192。包围盒使用 alpha > 80 的像素实测，便于按真实高度统一人物比例；不要把512像素整格高度当成人物实际身高。

提示词要求脚底 local y450；生成器实际脚底如上，未完全服从这一数值。所有脚和衣物均完整留在对应单元内，因此采用此版，并让渲染器使用实测锚点。没有通过程序改图或移动像素。

## 检查

- 目视八人身份齐全、排列正确，全身及双脚可见，服饰和年龄可区分。
- 不是同一白蓝主角服装；掌柜和村民为短衣，商人有包，道士有拂尘，长者白发，刀客蒙面，蔷薇紫衣。
- 没有文字、名字标签、人物卡边框、UI或场景地面。
- 真实 alpha 通道 0..254，约70.69%像素为完全透明。
- 逐格边缘检查无可见实体越界，个别边界有 alpha1 的微弱生成噪点；未伪称每个边界像素绝对为零。
- 已向父代理提供切片顺序、实测包围盒和脚底锚点，供渲染接入。游戏内人物比例、遮挡、身份映射仍须截图回归。

## 最终提示词

Create exactly ONE transparent PNG game NPC sprite sheet, 1536x1024 pixels, strict UNDRAWN 4 columns x 2 rows uniform grid, each cell 384x512. Genuine transparent ALPHA background. Eight DIFFERENT full-body Chinese wuxia NPCs, each completely independent, centered horizontally in its cell at local x192, both feet resting near local y450, generous empty padding. Each figure including all clothing, weapons and accessories MUST remain within local x65..319 and y75..450, never touch or cross a cell boundary. Row2 figures must begin below absolute y587, feet near absolute y962. Small game-sprite scale, 3/4 view facing slightly screen-bottom-right, fixed 45-degree downward game camera, realistic proportions with clearly readable silhouettes, detailed fabric leather hair and faces, high-quality hand-painted pre-rendered 2.5D martial arts RPG art. Not chibi, not anime portraits, not a movie poster. Neutral idle standing poses. Soft upper-left lighting and self-shading only. NO floor or ground shadow. MANDATORY DIFFERENT IDENTITIES ORDER left to right: TOP ROW 1 middle-aged Chinese innkeeper, slightly stocky, brown shirt, dark brown apron, simple cap, short moustache, empty hands. TOP ROW 2 travelling Chinese merchant age40, lean build, ochre olive travel robe and cloth head wrap, carrying a SMALL tied shoulder bag close to the body, neat beard, visibly different from innkeeper. TOP ROW 3 Taoist man age35 wearing muted gray-blue Daoist robes, small dark topknot cap, plain cloth belt, holding a short fly-whisk close to torso, calm face. TOP ROW 4 elderly Chinese master, long white hair and white beard, deep dark teal robe, thin build, dignified posture. BOTTOM ROW 1 ordinary Chinese village man age30, plain tan and brown cotton short jacket and trousers, rough practical clothes, simple hair knot, clean-shaven, no sword. BOTTOM ROW 2 young adult martial sect disciple, slim athletic man, dark sage and gray-blue robes, hair in a disciplined topknot, simple sheathed sword tucked close to waist, no white hero costume. BOTTOM ROW 3 black-clothed masked swordsman, face covered below eyes, dark cloth head wrap, short sword held downward close to leg, compact dangerous silhouette. BOTTOM ROW 4 young ADULT Chinese woman Qiangwei, purple and plum travel dress with practical layered skirt and leather belt, long black hair in a high ponytail with small silver hairpin, assertive self-possessed face, hands relaxed, visually distinct from a gentle blue-robed healer, fully clothed. Keep all eight faces and identities visibly distinct. Do not dress everyone as the same white-and-blue protagonist. No decorative white hero robes. All eight full bodies and feet visible. Absolutely no text, labels, UI, grid lines, cell borders, background scene, scenery, fog, smoke, halo, checkerboard pattern, people outside the eight specified NPCs, or cast shadows outside silhouettes. Transparent pixels around every person. This is a practical uniform-cell sprite atlas to be sliced directly by a game engine.

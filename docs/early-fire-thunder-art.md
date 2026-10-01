# 火劫与霹雳堂独立美术制作

2026-10-01。火院背景由内置 image_gen 纯文字独立生成；霹雳堂背景先纯文字独立生成，再只输入该自身原创生成图制作闭门编辑。未读取原版目录，未输入原图、原截图、原地图或其他游戏的参考图。没有以已有游戏场景外观或布局为提示词依据。交付文件保留各自最终生成源的原始 PNG 字节，未作本地裁剪、重画或调色。

## 工作流程

已读取 media-use/SKILL.md 及 resolve、setup-providers 说明，并执行只读 doctor 检查。检查实证 HeyGen 未安装，版本和登录状态均不可用；按本轮任务已授权的回退，直接使用现有 image_gen 工具。没有新增 HeyGen 安装、登录步骤或目录解析器，也未使用其他媒体目录或候选图库。这里只采用媒体技能的需求、独立来源及交付登记方法，不运行跨项目素材导入。

背景显示比例按当前 renderer-v3.mjs 的 1536×1024 世界画布制定。提示词描述的是独立表现设计，不是原版机制、坐标或图像核验结果。三次生成时 transparent_background 均为 false；首次两张文生图的 referenced_image_paths 和 num_last_images_to_include 均省略。后续编辑仅使用本文记录的自身原创文生图源文件，先实际 view 当前本地 PNG，确认其与该生成源字节一致，再使用 referenced_image_paths。

## fire-hut-courtyard.png：首次文生图

用途：火灾后的芭蕉院落；独立表现设计。

交付名称：public/assets/fire-hut-courtyard.png

首次生成源：C:/Users/kwgrg/.codex/generated_images/01a0f6b8-5f1e-7982-aed3-d1876a50a9dd/exec-7ce8f813-fff7-4559-a57f-2c894da4ab7b.png

首次生成 SHA-256：bc82584c920d2cbde537257f459b9e5a9d1739c70afafc227344af117a10673c

首次尺寸：1536×1024；色彩模式 RGB；字节：3525351。

完整文生图提示词：

Create a wholly original high-detail hand-painted 2.5D historical Chinese martial-arts adventure game environment, landscape 1536x1024 pixels, fixed high oblique top-down perspective with no horizon and no camera tilt, consistent world-sized background for small character sprites. A secluded banana-grove cottage courtyard shortly after an arson fire, at blue dusk: in the upper quarter, one small timber cottage with a weathered dark grey tiled roof is partly collapsed and still burning, orange flames concentrated along the roof and open upper doorway. A very thin localized grey smoke veil rises behind the roof, never obscuring the playable ground. Scorched timber beams and broken terracotta tiles are grouped tightly at the upper building footprint, rather than across the whole court. A single damaged side pavilion at the far upper-left, lush broad banana leaves and dark bamboo confined to outer left and right margins, a small water urn and unlettered stone basin near the upper-right wall, a split low stone boundary with an open approach at the bottom-left. Keep the central and lower courtyard x250..1330 y420..960 spacious, continuously walkable, mostly flat old pale stone paving with scattered soot, few dry leaves and small cracks; a clear broad path continues off the lower edge and a safe open corridor leads toward the house front. No ponds, streams, walls, fire or fallen beams cutting the central ground. Strong readable structure: firelight reflects lightly on the top paving; deep blue evening shadows on foliage; restrained luminous orange and teal colors, intricate architectural woodwork, visible individually painted stones, botanical detail, beautiful painterly texture and natural dimensional light. This is an independently invented layout and architecture using only this text, with no reference image and no existing game's layout. No people, animals, bodies, weapons, text, signs, symbols, calligraphy, title, UI, border, watermark or logo. Not a movie still, not photorealistic, not pixel art. Ground must remain clearly visible and suitable for real playable movement.

## thunder-inner-court-night.png：首次文生图

用途：霹雳堂夜间内院；独立表现设计。

首次结果随后进行了闭门编辑；此源图留在本机生成目录，不进入产品、仓库或部署资源。最终交付信息见后续编辑段落。

交付名称：public/assets/thunder-inner-court-night.png

首次生成源：C:/Users/kwgrg/.codex/generated_images/01a0f6b8-5f1e-7982-aed3-d1876a50a9dd/exec-bf4cdb18-bdf7-444e-980c-51e27b061f80.png

首次生成 SHA-256：6406a54c0fe97f1a642958e6382d03f767f6646ab4302f7b298381aac97a383e

首次尺寸：1536×1024；色彩模式 RGB；字节：3326289。

完整文生图提示词：

Create a wholly original high-detail hand-painted 2.5D historical Chinese martial-arts adventure game environment, landscape 1536x1024 pixels, fixed high oblique top-down perspective with no horizon and no camera tilt, consistent world-sized background for small character sprites. The nighttime inner courtyard of a secluded southern Chinese martial sect whose craft is early gunpowder fire weapons. Beautiful dark blue night, pale moonlit grey flagstones, restrained warm amber lanterns. An imposing two-storey timber martial hall sits only along the far upper edge, elegant sweeping dark tiled eaves, lattice windows glowing dimly, stone entrance steps at upper-middle. No lettering anywhere. A low workshop with unmarked earthen powder jars, closed plain wooden boxes and two short early fire-tube racks stays entirely in the far upper-left margin; a quieter narrow timber side room with deep verandah stays in the upper-right margin. Carved railing, a few dark pines beyond the perimeter wall, lantern light pools on old stone. Keep x240..1290 y390..920 as a broad flat continuous empty courtyard for playable movement, varied stone slabs and a subtle worn central practice area, no central obstacle. At the right lower quarter, a clear wide opening in the perimeter wall leads onto a visible safe stone path beyond the compound: fully open, no closed gate, no cliff or water, an obvious escape route connected to the playable central court. At bottom-left, a broad open entry path is visible, also connected without a barrier. Composition must show both entry and right escape at usable ground level, not hidden by foreground roofs or trees. Architectural detail should convey a school of disciplined martial study and an archaic fire-weapon workshop, with sober craftsmanship and weathered materials, not military modernity or fantasy machinery. Rich refined brushwork, readable volumes, beautiful cool/warm contrast, subtle ambient mist only at far background. Entirely independently invented environment from this text only, no image reference and no existing game map layout. No people, animals, bodies, explosions, glowing runes, text, signs, calligraphy, UI, borders, watermark or logo. No modern firearms, metal cannon, sci-fi elements, photorealism or pixel art. The whole central ground and right exit must remain visible.

## thunder-inner-court-night.png：自身原创图的闭门编辑

制作原因：首次独立设计的两座敞开门洞与随后需要实际越墙离院的交互不一致，因此在本轮自行生成图上关闭门洞，保留右门旁可用于布置越墙动作的平顶石墙。没有输入原版图像或地图。

唯一参考输入：C:/Users/kwgrg/.codex/generated_images/01a0f6b8-5f1e-7982-aed3-d1876a50a9dd/exec-bf4cdb18-bdf7-444e-980c-51e27b061f80.png

输入 SHA-256：6406a54c0fe97f1a642958e6382d03f767f6646ab4302f7b298381aac97a383e

输入制作来源：本记录上一段完整文生图提示词。该源图与编辑前同名公开 PNG 原字节一致。原源图仍保留在本机生成目录，不另写入公开目录或仓库。

编辑后最终交付：public/assets/thunder-inner-court-night.png

编辑后生成源：C:/Users/kwgrg/.codex/generated_images/01a0f6b8-5f1e-7982-aed3-d1876a50a9dd/exec-a3a3aa3a-6cb8-46a1-bf0a-c05ae9265a36.png

编辑后最终 SHA-256：14e6cd8209ad7775459225af65069c9e1e029ed33188ab14efa1e06aab1f06f5

最终尺寸：1536×1024；色彩模式 RGB；字节：3036972。

编辑工具：内置 image_gen；referenced_image_paths 只含上述一份自身原创生成源；num_last_images_to_include 省略；transparent_background 为 false。

完整编辑提示词：

Edit only the supplied independently generated original nighttime Chinese martial-sect courtyard background. Retain the hand-painted 2.5D high oblique view, landscape 1536x1024 composition, roofs, moon, lantern lighting, upper workshops, central stone courtyard and all painterly details. Make the two existing broad foreground perimeter openings at lower-left and lower-right visibly CLOSED: add sturdy dark timber double gate leaves fitted fully between their existing stone pillars, touching at the center, no person-sized gap, no open gate. Gate doors have simple plain wood and small old iron hinges, no signs or lettering. The large central court must stay spacious and entirely empty, with no new obstacles. The path OUTSIDE the lower-right closed gate should remain visible and paved. Immediately beside the lower-right gate, create a short, clearly visible waist-high plain stone wall section with a flat smooth cap, around the lower-right image area x1250..1340 y735..790. This low segment is part of the continuous courtyard boundary, not a new passage or open gap; do not put tall gate pillars, railing, shrubs or roof above this short section. It should be visually credible as a place a martial artist could leap over, with clear dry stone ground on both the courtyard side and the outside landing side. There must be no normal walking route through either closed gateway or around the boundary within the image. Preserve a readable continuous broad inner court leading to the inside of the right wall and a broad stone route outside it toward the right lower edge. Make no changes to the left workshop or upper buildings, do not add characters, animals, shadows of people, UI markers, arrows, circles, text, logos, signs, modern objects or weapons. Use only the supplied own original image, with no other visual reference.

## 生成后目视观察与可走区交接

已目视生成结果：火院房屋和烈火位于上侧，烧梁集中在房前，烟没有遮住中间地面，香蕉叶和竹木主要在边缘。中部有大片石地；下侧实际存在矮石墙，开放门洞位于中偏左。碰撞应按实际房屋、烧梁、边墙和门洞布置，不能把提示词中的宽泛矩形直接当作通行证据。下侧门洞接着画面底部石径。

编辑后的霹雳堂上侧为大殿，两侧房舍，火器架及封口陶罐集中在左上工房；中央石庭宽阔，地面包含独立装饰纹样而没有可读文字。下侧两座原敞开门洞均已变为完全关闭的木双门；内外石地依旧可见。右门右上邻接的围墙为无栏杆平顶石墙段，右侧房前台阶和廊柱不应划入一般平地。画面最上侧出现窄条树梢和天空，虽然首次提示词要求无地平线，交付仍须依据实际画面验证人物缩放和可走范围。

编辑提示词的墙段坐标 x1250–1340、y735–790 未被生成器严格落实：此处实际主要是右门脚与院外石路，较明确的平顶墙段在右门右上方，约 x1360–1490、y570–665。坐标只是本次目视交接的近似值，最终跳跃起落点、墙体高度、人物缩放与碰撞必须根据交付 PNG 和真实浏览器验证，不得将提示词坐标直接当作验收证据。闭门图替换后首次敞开门洞版本不再作为产品背景。

本记录只核验交付背景的内容、尺寸、文件一致性和生成输入边界。实际角色遮挡、脚下位置、行走、出口和战斗需要随后在真实浏览器中验证。静态火焰和灯光属于绘制表现；这里没有制作逐帧火焰、原版动画、敌人或人物图片。原版院落外观、完整地图形状与原版美术相似度均未在本次美术任务中核验，不以生成或来源校验通过宣称完整复刻。

素材清单中的 referenceAssets 只表示仓库公开 PNG 之间的依赖。霹雳堂的编辑输入是本机目录里本轮生成的原始源文件，完整链及输入哈希已在本记录列明；该初始源图未另外成为仓库 PNG，因此清单 referenceAssets 保留为空，避免给同名最终交付写出自引用循环。这不表示编辑时没有自身原创图输入。

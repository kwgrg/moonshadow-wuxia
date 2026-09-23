# 独立角色图集与跪姿制作记录

生成与接入日期：2026-09-23。两次内置 image_gen 独立文生图，未提供参考图片、旧角色图、原版游戏截图或其他图像输入。两幅图仅按原字节复制到发布目录，没有图像编辑、重新编码或导出裁切。以下提示词按本次调用记录完整保留。

## characters-original.png

发布文件：`public/assets/characters-original.png`。

生成源：`C:/Users/kwgrg/.codex/generated_images/01a088cc-a046-7932-9942-4d38be2d16a9/exec-8ee79d6e-e597-482f-8e38-35fe5d7285bf.png`。

尺寸：1536 × 1024；RGBA。SHA-256：`35ab8f6aafd72e4de8d0704799f7c80cac5f4ef29eb7d957119ba9f9a8074235`。

完整提示词：

```text
Use case: stylized-concept. Asset: an ORIGINAL game character atlas PNG, exactly 1536x1024, genuine transparent RGBA background, no opaque backdrop or checkerboard. Four full-body adult Chinese wuxia travelers in ONE horizontal row, each confined to a separate 384 pixel wide column, centers x192,576,960,1344; all feet at y985 and heads near y95. Equal height, full shoes and hair visible, no character overlaps another column. Elevated RPG camera looking down about 20 degrees, three-quarter front-facing bodies gently facing right. Realistic hand-painted detailed materials, restrained natural daylight, sharp readable silhouettes, dignified faces, modest practical clothing. Column1: young adult male swordsman with high-tied black hair, ivory inner robe and deep indigo long outer coat, simple slate-blue shoulder guards, narrow dark sash, sheathed straight sword at hip, calm stance with empty lowered hands. Column2: adult woman healer with dark hair in a simple half-up knot, warm coral-red outer tunic over ivory long skirt, small teal sash, empty hands, gentle alert stance. Column3: adult woman martial traveler, black hair in a high looped knot, layered muted lilac and plum robe with silver-grey belt, restrained ornament, empty lowered hands. Column4: adult male fighter, dark hair tied back, dark brown travel coat over pale inner shirt, olive leather arm guards, simple sheathed blade at waist, no helmet. Each costume and face independently invented; do not imitate any existing game character or reference artwork. No names, text, ground plane, cast shadow, pedestal, scenery, props between figures, logos or watermark. Preserve real alpha transparency. Production sprite sheet, not a design presentation.
```

## hero-kneel-original.png

发布文件：`public/assets/hero-kneel-original.png`。

生成源：`C:/Users/kwgrg/.codex/generated_images/01a088cc-a046-7932-9942-4d38be2d16a9/exec-637a6763-d952-484d-b2e2-b592100de5df.png`。

尺寸：1024 × 1536；RGBA。SHA-256：`3b7a4ca49fc0ba544541924fb36122f065fde52f39ceda3b3540a6547b4a3a72`。

完整提示词：

```text
Use case: stylized-concept. Asset: ONE independently invented transparent game sprite PNG, 1024x1536 portrait canvas. A young adult Chinese wuxia swordsman kneels respectfully on BOTH knees, feet tucked behind, torso upright and head slightly bowed, hands clasped in a traditional fist salute at chest height. Three-quarter side view facing viewer RIGHT, elevated game camera looking down 20 degrees. High-tied black hair, ivory inner robe, deep indigo long outer coat with simple slate-blue shoulder guards, narrow dark sash; sheathed slim sword secured at the hip. Detailed hand-painted realistic materials and restrained natural daylight; slim grounded proportions, readable full silhouette. Place entire character centered with visible hair, hands, all robe and knee folds, approximately x150..875 and y220..1350, leaving generous transparent margins. A genuinely transparent RGBA background, no scenery, ground plane, shadows, pedestal, colored matte or simulated checkerboard. No words, logos, ornate insignia or watermark. This is an original text-designed costume and person, not an existing commercial game's design, screenshot, sprite, or reference-based edit.
```

## 运行时接入与检验边界

四人物图按原尺寸的四个 384 × 1024 列使用：主角、真儿、紫轩、通用男性。网页头像、站立、倒地、休息上身使用同一新图集；月眉儿继续使用已有独立 `mei-original.png`。人物轮廓、衣着和面容是本项目的文字构思，不依据原版人物贴图描摹。

跪姿独立生成，未引用旧或新四人图作为输入。运行时 drawImage 使用源矩形 x=64、y=96、width=854、height=1360，显示比例随此矩形计算；这是显示取景，不修改源 PNG。此矩形包含 alpha > 16 的完整主体（边界 x=78..902、y=122..1435）并留透明边距。两图 alpha 通道范围均为 0..254，没有不透明底色。四人图各列 alpha > 16 的非空边界均已读取，但该像素检查不代替人物列分割和脚底接地的浏览器目视。

本轮删除发布目录中的七张旧图：`characters.png`、`hero-kneel.png`、`forest.png`、`lake.png`、`town.png`、`snow.png`、`wudang.png`。前三幅新环境图另见 `docs/landscape-original-art.md`。旧审计和旧制作文档作为历史事实保留；旧图缺来源的结论没有被改写成已核来源。来源清单更新只针对当前发布文件。

已完成两幅生成源与产品副本全字节比较、尺寸/透明度/哈希检查。当前子任务的 view_image 因本机工具初始化失败，未进行该工具目视验收；实际浏览器角色外观、列裁切、跪姿脚底和对白头像由本轮主任务另行验证并记录。记录存在不等于对法律原创、权属、原版相似度或完整复刻给出结论。原版目录本轮未被读取，也没有原版内容进入资源制作步骤。

自动核验记录：资源清单校验（当前 31 项及 20 个负例）、界面渲染桩（196 场景）、story-ui（25 项）和 landscape-original（17 图）均通过。另逐项解析当前 97 张世界图的 region.art、scene.art、fallbackArt，以及 26 个预加载背景键，均对应现存 PNG；旧逻辑别名已转换到新资源。上述自动检查不代替浏览器外观验收。

## 浏览器视觉验收补充

本轮主任务与独立浏览器已完成目视：新HUD头像、对白头像、站立人物和梦中紫轩使用正确列，透明背景未形成矩形底色。original-atlas 使用真正fresh开局，自然经历祭父跪姿、三次继续、侠客难度选择、起身并进入a02；未写存档跳步。跪姿的膝、衣摆与发髻完整，地面锚点可见。截图 output/playwright/original-atlas-fresh-kneel.jpg 与 original-atlas-fresh-standing.jpg。四列原型另在 original-atlas-visual-fixture.jpg 临时视觉样例中检查，无明显串列/截脚；该样例不算剧情通关。

梦中露天坐姿已从病床渲染分离，使用明确groundSeated标记及对应紫轩上身，避免带被褥。两梦中的站立和对白截图见 hut-night-browser.md。以上仅是当前独立资源接入的外观与操作验收，不是完整方向动画、所有人物造型或原版画面的验收。

# 原创主角跪姿素材

生成日期：2026-09-22。

项目路径：`public/assets/hero-kneel.png`。

使用内置 `image_gen` 工具生成，未使用 CLI 或外部 API。人物参考仅为本项目此前独立生成的 `public/assets/characters.png` 第一格蓝白衣男性剑客。因本机文件沙箱读取故障，参考图先以只读内存预览显示，再作为对话中的图像参考传入生成工具。本轮没有读取或引用原游戏目录。

源生成文件：`C:\Users\kwgrg\.codex\generated_images\01a0c6ed-4929-7c73-ac18-7b5248ee4ea7\exec-5b85d8a5-07ea-4791-92be-83ab19f8ca40.png`。

## 成品检查

- 实际尺寸：1254 × 1254；RGBA。
- Alpha 范围：0–255；完全透明像素 991,221 / 1,572,516，确为透明通道，不是灰底或棋盘格背景。
- 所有非零 alpha 的包围框：`[0,21,1234,1254]`。极低 alpha 的零散边缘存在于画布边缘，不应用这个范围来推定人物脚底。
- alpha ≥ 32 的有效轮廓包围框：`[164,35,1099,1210]`，右下界不包含在框内。实际人物连衣摆高约1175像素。
- 已目视检查：只有一个男性剑客，蓝白衣、束发、佩剑入鞘、双膝跪地、胸前抱拳、低头朝画面右方。无文字、场景、地面或大面积投影。
- 绘制时可用有效轮廓作为裁切依据；地面锚点建议先以图像横向中心、y≈1210测试，再由实际场景检视衣摆落地。图像尺寸与有效轮廓以成品为准，不假称满足提示词中的1024尺寸或80%占比。

图片复制后没有改动像素，没有使用Python编辑、背景色键抠图、缩放或再编码。Python/Pillow仅用于读取尺寸和透明通道统计。跪姿素材的画布/视觉透视属于网页版独立设计，不代表原版姿态或动画复刻。

## 最终提示词

Use case: stylized-concept. Asset type: ONE transparent game character sprite, original project's character pose variant. Reference role: the latest visible image is an in-memory preview of the project's independently authored character sheet. Use identity, costume and painting style ONLY of the LEFTMOST blue-and-white male swordsman. Ignore the other three people and the preview's grey background. Generate a new square 1024×1024 image of that single young adult Chinese wuxia swordsman kneeling respectfully, isolated on a genuinely transparent RGBA background. Preserve his face, high-tied black hair, blue-and-white layered robe, silver-blue shoulder pieces and slim silhouette. Both knees are clearly on the ground, feet tucked behind, long robe spreading naturally around knees. Three-quarter side view, body facing viewer's RIGHT / upper right; head bowed modestly; hands making a respectful clasped-fist salute at chest height. Sword remains sheathed, a simple slim scabbard at the hip or back, no drawn blade. Isometric RPG view with camera looking down about 25 degrees, full body visible. Place the complete character in the center, occupying about 80 percent of image height, leave empty transparent margin around hair, hands, robe and knees, knee/hem bottom near 90% image height for easy ground anchoring. High-quality detailed hand-painted realistic CG, sharp readable silhouette, restrained daylight, material rendering consistent with the provided original project art. Absolutely no scenery, no ground plane, no pedestal, no opaque color background, no simulated checkerboard, no big cast shadow, no extra character, no text, no watermark. The alpha background must truly be transparent. This is a new pose of the provided independently authored project character, not any original commercial game asset or screenshot.

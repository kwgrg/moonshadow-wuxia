# 普通战斗状态与奖励修复合同

2026-09-24。受审基线36479ad，revision14，213项任务。此工作只读项目代码并用内存夹具复现，没有访问原游戏目录，不以模拟战斗证明原版行为或完整复刻。

## 已复现的问题

在a06、a32、e14分别由真实cast击败一名1HP夹具敌人，银两/经验从150/0到165/25；随后把主角设为1HP，再走真实hurt与tick，得到HP0、paused=true、phase=battle。保存恢复变成HP1、paused=false、phase=talk、空敌军。原对象retry后再次击败相同槽位，又得到180/50，kills从1到2。第一次奖励没有回滚，因此正常失败重试与刷新均能重新刷同一战的单位收益。

另以尚未打过战斗的章节夹具，仅设phase=after再completeQuest，g24/gBad2直接得到reunion，e14直接得到family。这里证明的是完成入口没有战斗结果证据，不宣称普通UI无需编辑状态就存在跳关按钮。

## 持久状态与接口

独立模块[combat-progress.mjs](../public/combat-progress.mjs)不导入runtime，使用当前campaign与独立演出声明。普通battle/boss、battleBeforeChoice和training归此模块；已有skirmish完全使用原协议。

- combatProgress：当前任务的分波/训练对手记录、完整阵容、defeatedIds、active/victory/scripted-loss/failed结果与当时主角HP、失败原因。每个wave和每位训练对手分别拥有key；更早波次的结果仍保留，不能靠最后一波或finished标签代替全部证据。
- combatClaims：跨尝试保留的逐敌领取账本，身份为任务ID、波次或训练对手、敌人槽位。首次击败依然获得原数额的经验/银两/击杀计数，同一身份重试不再领取。友好切磋保留经验，仍不给银两或杀人数。
- combatLegacyNoKillRewards：只标记有战斗迹象的旧未决任务，说明历史逐敌收益无法可靠追溯。本标记不代表已完成、已击败、已领奖或胜利；保留旧资源，只抑制该旧任务之后的逐敌收益。任务本身65经验/15银仍由原claimedRewards账本处理。

集成顺序固定如下：

1. restoreState在章节迁移、旧培训、演出、skirmish处理后调用restoreCombatProgress(raw,q,s)。它恢复合法波次、当前训练对手、HP0失败、完整敌军、攻击计时、蓄势范围、减速和技能冷却，且不发资源。
2. startBattle的普通分支先调用resumeCombatEncounter()；返回true就不能再次生成对手。完整生成并完成站位调整后调用recordCombatStart()，它将当前敌数组与持久阵容关联。原始任意姓名、角色、boss标记、数值上限不直接继承，按声明重建。
3. cast只在主角仍活着时执行。敌HP归零时由claimCombatDefeat(enemy)返回一次{coins,xp,kills}；调用方按返回值发放旧奖励。返回null仍可能已记录本次击败，只代表没有新增逐敌奖励。
4. 在wave增加、训练清敌/清active、after/choice转换或强制败后回血之前，调用finishCombatProgress('victory'或'scripted-loss')。返回false就不能推进。英雄HP0优先于普通胜利；强制败只有声明允许且记录到HP0才可收束。
5. 普通败北调用failCombatProgress('hero')并保存；构造器、UI、药物、技能和旅行都必须继续尊重此失败。只有显式重试调用resetCombatAttempt()，再重置主角和生成新战。它保留领取账本；分波任务从第0波重开，培训保留其他已胜弟子并只重开当前对手。
6. completeQuest和战后答复使用canCompleteCombat()守卫；同任务旅行时即使s.enemies被清空，内部完整结果仍保留。不能仅凭after、choice、finished或空数组认为胜利。

## 旧档迁移边界

带combatVersion:1、combatProgress.version:1或新R15修订号的保存必须有新协议的完整证据。接入时campaignRevision仍为14，未改任务版本；独立combatVersion用于识别尚未开始战斗、combatProgress仍为null的新保存。损坏、缺失、重复单位、非数值HP、不符声明的上限、不完整击败名单、无有效蓄势范围等不能恢复成当前胜利；进入明确的资料不完整失败，允许显式重试。

R1–14未决任务若仍有完整有效敌军，可以恢复存活HP或全清事实，死槽据此补入旧逐敌领取证据；本任务仍标记历史收益未知而抑制额外逐敌收益。分波游标之前的波次以legacyPriorWaves明示历史摘要保留，不伪造其新协议阵容；旧培训的defeated名单同样保留为legacyTrainingWins。没有完整名册的旧after/战斗选择/战斗保存不能仅靠阶段文字造胜利，应重新进入本战；旧HP0仍保持失败，不自动复活成1HP。

无战斗迹象的旧talk不冻结逐敌收益。旧引擎可能已经把战斗刷新成talk并丢失敌军，此时无法准确追溯，也不猜测所有旧talk都是打过的战斗。旧done、claimedRewards和已经记录的结局保持原历史，不追补当前胜利或新任务演出。

## 验证状态

[validate-combat-progress.mjs](../tests/validate-combat-progress.mjs)首轮30个模块边界案例通过：普通/首领/邪线普通战重复收益、友好经验、完整结果和损坏证据、英雄零HP优先、三波独立账本及前波证据、三处强制败局、培训各对手和失败重载、旧部分军阵/无军阵after/无战迹talk，以及已有skirmish隔离。夹具直接构造边界HP，结果操作由独立模块执行。

## 运行时与界面接入记录

2026-09-24后续接入完成，改动限runtime、journey、独立combat-progress，以及recruitment-runtime中旧致命答复的必要恢复分支。没有修改campaign版本。runtime在完整生成阵容后登记，击杀时按唯一身份领取，胜利/强制败先提交证据再变更阶段；普通败北明确持久化，零生命不能继续cast、药物或领取。retry限定失败才可调用，重复start不会抹掉活战或已决结果。所有旧skirmish分支仍走自己的协议。

journey的defeat事件先保存再显示失败面板。重新载入、关闭/取消面板均尊重持久失败，不会偷偷把HP0改成1，也不会因点击关闭而自动重试。只有明确点击再战才重新开始。正常击杀的账本与资源变化即时保存；敌军HP、位置、攻击计时、蓄势范围和技能冷却随普通存档恢复。

旧致命答复若还有新协议交手结果，返回答复前仍直接恢复选择；真正旧档只有终止答复、缺少交手证据时，先保留终止状态。用户明确点击返回后，保留既有回退到最后一次答复前的计数规则，提示需要重新交手；不再停在无法提交的choice，也不造出未验证战斗的胜利。此迁移仅作用于资料不完整的旧未决对局。

初次接入专项通过30个模块案例和11个真实引擎案例。生产部分实际调用cast、hurt、tick、retry与restoreState，覆盖a06/a32/e14的部分击杀→刷新残血/冷却/蓄势→自然失败入口→再次刷新保持HP0和暂停→重试同槽不领奖、新槽正常领奖；三处裸after不能结局；普通首领一次80银/100经验；三波独立身份；五名弟子与师父的剧情败局；e05/e07缺名册旧致命答复恢复。边界HP来自显式夹具，不描述为玩家自然通关。

受影响的wudang、recruitment、forbidden-pursuit通过；story-ui增至27检查，新增通过实际生产journey处理函数验证普通死亡即时保存、读取时失败面板、关闭与Esc不能隐式再战、显式按钮恢复，以及同槽不重复领奖。该UI测试使用DOM桩，仍不是浏览器。

interface、quality以及skirmish-critical、good-forbidden、good-rescue也在此次普通接入阶段通过。旧测试的“刷新回talk/回训练选人”改为保持实际战局；直接捏造最终wave或战后choice的正例改为先走实际交手。伪after负例继续保留，未放宽产品完成守卫。

初次接入时，choice-transactions因并行新剧情将g20.repeatRefusal替换成多个现场选择节点，停在旧四次连续choose断言。该历史阻塞已由下述R15兼容核验解决；完整npm入口、HTTP与部署预检由根代理在产品冻结后统一处理。实际浏览器验收仍另记。

## R15集成后的增量核验

当前任务修订为15，任务表228项。普通模块新增两处边界修复：敌人姓名从独立演出中的enemy角色声明按槽位重建，保留a03的“守山道士甲”等人物区别而不信任保存内任意姓名；同任务objectiveProgress中的after/choice也视为明确战斗迹象。后者修复旧存档离场时保存choice、无军阵，返图后停在无法提交选择的情况。旧未决档重演本战并抑制未知历史逐敌收益；新协议缺证据进入明确失败。普通旧talk没有这些迹象时仍不冻结收益。

普通专项再次通过30个模块案例和14个真实引擎边界案例，新增R14/R15离场选择证据缺失分流、读取时使用可信舞台姓名且忽略存档改名。staging-routes与wudang也在姓名修复后通过。

旧有29套npm测试完成分段核验：首轮22套通过，7套在修正过期fixture后复验通过。长流程两难度×六结局通过，塔层必须走实际trackTower楼梯；其清场是本模拟采用的路线，并非楼梯条件。g20测试改为首次拒绝一次提交到g20_return1、重复choose返回false且好感只减一次；完整四拒由新的夜间专项负责。缺军阵的历史choice正例改为真实hurt/tick交手后继续，已领奖记录仍断言不重复发任务奖；R15的pending g20明确回到g19_return，未回答g19不提前出现蔷薇随行。历史ID与有效战斗等级的冻结表没有改写。

这一分段记录不是最终完整npm命令一次通过，也不是浏览器通关或完整复刻证明。内部逐套日志位于忽略目录work/r15-suite-results-{0,1,2}.json和work/r15-old-recheck{,2,3}.json；长流程最终通过输出由执行工具留存。HTTP检查原本递归枚举public中的.mjs/.png等静态资源，因此新模块与CG无需人工追加文件名白名单。

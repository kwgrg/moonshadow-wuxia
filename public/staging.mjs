/**
 * Original staging for the web adaptation. No original game images, scripts,
 * dialogue, coordinates, animation timings, or implementation code are used.
 * Pixel coordinates refer only to this project's independently painted scenes.
 *
 * The runner persists actor positions, poses, directions and the current step.
 * `release` returns to the existing quest objective exactly once.
 */
export const STAGED_QUESTS = {
  a01: {
    auto: true,
    heroStart: {x:455,y:390,direction:-1},
    actors: [],
    steps: [
      {type:'face',actor:'hero',direction:-1},
      {type:'pose',actor:'hero',pose:'kneel',duration:1.1},
      {type:'say',focus:'hero',lines:[
        ['杨影枫','父亲，山上的晨雾又散了。往日都是你催我练剑，今日却只有我一人来辞行。',0],
        ['杨影枫','这些年，我把你传下的招式练了又练。可剑究竟练得如何，总要到江湖中试过才知道。',0],
        ['杨影枫','我会带着这把剑下山，也会带着自己的答案回来。请你看着我走这一程。',0]
      ]},
      {type:'pose',actor:'hero',pose:'stand',duration:.65},
      {type:'move',actor:'hero',x:545,y:465,speed:145},
      {type:'move',actor:'hero',x:655,y:560,speed:145},
      {type:'face',actor:'hero',direction:1},
      {type:'difficulty'},
      {type:'release'}
    ]
  },
  a02: {
    trigger: {x:520,y:745,radius:155},
    actors: [
      {id:'innkeeper',name:'酒肆老板',sprite:0,x:990,y:490,direction:-1},
      {id:'guest-merchant',name:'行商酒客',sprite:2,x:1085,y:625,direction:1},
      {id:'guest-local',name:'本地酒客',sprite:0,x:1160,y:670,direction:-1}
    ],
    steps: [
      {type:'move',actor:'hero',x:705,y:665,speed:155},
      {type:'move',actor:'hero',x:915,y:530,speed:150},
      {type:'face',actor:'hero',target:'innkeeper'},
      {type:'face',actor:'innkeeper',target:'hero'},
      {type:'say',focus:'innkeeper',lines:[
        ['杨影枫','掌柜，前面的山路能到武当吗？我初来此地，想请你指个方向。',0],
        ['酒肆老板','沿石道往上，先到洗剑池，再过山门。山路长，少侠若要歇脚，这里有热茶。',0],
        ['杨影枫','多谢。我还想打听，山上的剑术当真如此出名？',0],
        ['酒肆老板','来往的人常挂在嘴边。喏，那边两位也正说着呢。',0]
      ]},
      {type:'face',actor:'hero',target:'guest-merchant'},
      {type:'move',actor:'hero',x:980,y:665,speed:130},
      {type:'face',actor:'hero',target:'guest-merchant'},
      {type:'face',actor:'guest-merchant',target:'guest-local'},
      {type:'face',actor:'guest-local',target:'guest-merchant'},
      {type:'say',focus:'guest-merchant',lines:[
        ['行商酒客','一路听过许多门派的名号，到了这里，人人先问你见没见过武当的剑。',2],
        ['本地酒客','名头响，也得靠本事撑着。谁若想扬名，总要过得了高手这一关。',0],
        ['行商酒客','话虽如此，真敢上门求教的年轻人，可没有喝酒时说得那么多。',2]
      ]},
      {type:'face',actor:'hero',direction:-1},
      {type:'say',focus:'hero',lines:[
        ['杨影枫','若只听别人谈论高下，我又怎会知道自己的斤两。既然到了武当山下，就该亲自去问一回剑。',0]
      ]},
      {type:'release'}
    ]
  },
  a03: {
    trigger: {x:595,y:440,radius:170},
    actors: [
      {id:'pool-guard-one',name:'守山道士甲',sprite:0,x:755,y:420,direction:-1,enemy:true},
      {id:'pool-guard-two',name:'守山道士乙',sprite:0,x:860,y:430,direction:-1,enemy:true}
    ],
    steps: [
      {type:'move',actor:'hero',x:595,y:430,speed:135},
      {type:'face',actor:'hero',direction:-1},
      {type:'say',focus:'hero',lines:[
        ['杨影枫','碑上写着：入山收刃，问道守礼。洗剑池……原来武当的规矩从这里就开始了。',0]
      ]},
      {type:'face',actor:'hero',target:'pool-guard-one'},
      {type:'move',actor:'hero',x:735,y:515,speed:145},
      {type:'face',actor:'pool-guard-one',target:'hero'},
      {type:'face',actor:'pool-guard-two',target:'hero'},
      {type:'say',focus:'pool-guard-one',lines:[
        ['守山道士甲','少侠请留步。带剑上山，先说明来意。',0],
        ['杨影枫','在下杨影枫，慕武当剑术之名而来，想与门中高手讨教。',0],
        ['守山道士乙','山门自有次序。你连通报都未等，便要径直上去？',0],
        ['杨影枫','我只求见识真本事。若两位执意拦路，就请先赐教几招。',0],
        ['守山道士甲','好，你我在池前分个高下。胜负未定，这条路便不能让。',0]
      ]},
      {type:'face',actor:'hero',target:'pool-guard-one'},
      {type:'release'}
    ]
  }
};

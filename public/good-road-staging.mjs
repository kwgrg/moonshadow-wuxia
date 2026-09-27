// New movement, dialogue timing and footpoints belong to our independent art.
import {GOOD_MEDICINE_REUNION_REVISIONS} from './good-medicine-reunion-revisions.mjs';
const options=GOOD_MEDICINE_REUNION_REVISIONS.g23.choice.options;
const branch=(flag,steps)=>steps.map(step=>({...step,when:{flag}}));
const say=(focus,lines)=>({type:'say',focus,lines});
const move=(actor,x,y)=>({type:'move',actor,x,y,speed:115});
const hide=actor=>({type:'hide',actor});
const actors=GOOD_MEDICINE_REUNION_REVISIONS.g23.firstMeeting.actors.map(a=>({...a,interactive:false,direction:-1,pose:'stand',hidden:false}));
const spectators=[[390,520],[390,605],[390,690],[500,740],[540,820],[1190,430],[1230,505],[1240,590],[1180,675],[1080,780]].map(([x,y],i)=>({id:'good-final-observer-'+(i+1),name:'无忧教徒',sprite:3,npcCell:6,x,y,direction:x<800?1:-1,interactive:false}));
export const GOOD_ROAD_STAGING={
 g23:{map:'m17',label:'谷中相逢',auto:true,actors,finalActors:[],props:[],steps:[
  ...branch('goodFirstZi',[
   {type:'face',actor:'hero',target:'good-meeting-zi'},
   say('good-meeting-zi',options[0].after.slice(0,2)),
   say('good-meeting-mei',options[0].after.slice(2,3)),
   move('good-meeting-mei',800,810),move('good-meeting-mei',800,915),hide('good-meeting-mei'),
   say('good-meeting-zi',options[0].after.slice(3)),
  ]),
  ...branch('goodFirstMei',[
   {type:'face',actor:'hero',target:'good-meeting-mei'},
   say('good-meeting-mei',options[1].after.slice(0,3)),
   say('good-meeting-zi',options[1].after.slice(3,4)),
   move('good-meeting-zi',800,810),move('good-meeting-zi',800,915),hide('good-meeting-zi'),
   say('hero',options[1].after.slice(4)),
  ]),
  {type:'release'},
 ]},
 // Kind0 presence is confirmed; combat or hostile AI is not inferred.
 g24:{map:'m70',presentationOnly:true,actors:spectators,finalActors:spectators,props:[],steps:[{type:'release'}]},
};

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {QUESTS,REVISION_FIFTEEN_QUEST_IDS as oldIds} from '../public/campaign.mjs';
import {GOOD_MEDICINE_REUNION_ADDITIONS} from '../public/good-medicine-reunion-revisions.mjs';
const get=id=>QUESTS.find(q=>q.id===id);
assert.equal(oldIds.length,228);
const frozen=oldIds.map(id=>[id,get(id).encounterTier]);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(frozen)).digest('hex'),'798188d83c0d583daafc28c437047fc244c29ec141b14fa2398b82d8cd71f525','R15 identities and enemy strength remain frozen');
for(const {quests} of GOOD_MEDICINE_REUNION_ADDITIONS)for(const q of quests){assert.equal(q.xp,0,q.id);assert.equal(q.money,0,q.id);assert(!q.rewards?.items,q.id+' does not duplicate medicine');assert(!q.rewards?.recover,q.id+' no invented healing');}
assert.equal(get('g21').transition.map,'m49');
for(const id of ['g23_pickup','g23_farewell'])assert.equal(get(id).transition.map,'r_good_hanbo_road');
assert.equal(get('g24').ending,false);assert.equal(get('g24_aftermath').transition.map,'m34');assert.equal(get('g24_departure').ending,true);
const offer=get('g23_recruitment');assert.equal(offer.choice.options.length,2);assert.equal(offer.commitBeforeDialogue,true);assert(!offer.refusalRule);for(const choice of offer.choice.options){assert(!choice.ending);assert(!choice.effects.flags.cultPath);}assert.equal(offer.rewards.flags.goodMedicineChallenged,true);
const meeting=get('g23');assert.equal(meeting.before.length,0);assert.equal(meeting.firstMeeting.actors.length,2);assert.equal(new Set(meeting.firstMeeting.actors.map(a=>a.id)).size,2);for(const a of meeting.firstMeeting.actors)assert.equal(a.npcCell,null);
console.log('Medicine data PASS: R15 identity/tier hash, zero added rewards, explicit travel, actual first talk, single converging offer and separate aftermath.');

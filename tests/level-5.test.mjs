import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const snapshot=readFileSync(new URL('../snapshots/2026-08-27/index.html',import.meta.url));

const sourceStart=html.indexOf('const THEMES=');
const sourceEnd=html.indexOf('function getPlayerColor',sourceStart);
assert.notEqual(sourceStart,-1,'theme definitions should exist');
assert.notEqual(sourceEnd,-1,'level selection should precede player rendering');

const context={};
vm.runInNewContext(
  html.slice(sourceStart,sourceEnd)+'\nglobalThis.level4=getLevel(3); globalThis.level5=getLevel(4);',
  context
);

const level=context.level5;
assert.equal(context.level4.name,'Stage 4: Candy Land','other procedural stages should remain unchanged');
assert.equal(level.name,'Stage 5: Deep Space Training Run');
assert.equal(level.theme.name,'Deep Space');
assert.equal(level.checkpoints.length,2);
assert.equal(level.spinning.length,0);
assert.ok(level.coinPath.length>=18,'coin path should clearly telegraph jumps');
assert.ok(level.platforms.every(p=>p.w>=100),'every stationary landing should be at least 100px wide');

const [start,p1,p2,station,p4,station2,p6,finishPlatform]=level.platforms;
const horizontal=level.moving.find(p=>p.axis==='x');
const vertical=level.moving.find(p=>p.axis==='y');
assert.ok(horizontal,'level should include a horizontal orbit bridge');
assert.ok(vertical,'level should include a vertical moon lift');
assert.ok(horizontal.speed<=0.75,'orbit bridge should remain slow and readable');
assert.ok(vertical.speed<=0.7,'moon lift should remain slow and readable');

const gaps=[
  p1.x-(start.x+start.w),
  p2.x-(p1.x+p1.w),
  station.x-(p2.x+p2.w),
  p4.x-(station.x+station.w),
  horizontal.ex-(p4.x+p4.w),
  station2.x-(horizontal.sx+horizontal.w),
  p6.x-(station2.x+station2.w),
  vertical.x-(p6.x+p6.w),
  finishPlatform.x-(vertical.x+vertical.w),
];
assert.ok(gaps.every(gap=>gap>=0&&gap<=120),`route gaps must stay within 120px: ${gaps.join(', ')}`);

assert.ok(
  level.checkpoints.some(cp=>cp.x>=station.x&&cp.x<=station.x+station.w),
  'first checkpoint should be on the wide space station'
);
assert.ok(
  level.checkpoints.some(cp=>cp.x>=station2.x&&cp.x<=station2.x+station2.w),
  'second checkpoint should follow the orbit bridge'
);
assert.ok(
  level.finish.x>=finishPlatform.x&&level.finish.x<=finishPlatform.x+finishPlatform.w,
  'finish flag should sit on the wide gold platform'
);

const snapshotHash=createHash('sha256').update(snapshot).digest('hex');
assert.equal(snapshotHash,'f77863c8f37259cd2b0387d4247a9c9e39702e18dd4bf0d8daab2d0b2677b93f');

console.log('Level 5 geometry and preserved snapshot validated.');

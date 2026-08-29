import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sourceStart=html.indexOf('const THEMES=');
const sourceEnd=html.indexOf('function getPlayerColor',sourceStart);
assert.notEqual(sourceStart,-1);
assert.notEqual(sourceEnd,-1);

const context={};
vm.runInNewContext(
  html.slice(sourceStart,sourceEnd)+`
    globalThis.level5=getLevel(4);
    globalThis.stage6=getLevel(5);
    globalThis.stage10=getLevel(9);
    globalThis.stage14=getLevel(13);
    globalThis.stage4=getLevel(3);
    globalThis.bossStages=[5,9,13,21,29].map(i=>({i,level:getLevel(i),isBoss:isBossStage(i)}));
  `,
  context
);

assert.equal(context.level5.name,'Stage 5: Deep Space Training Run');
assert.equal(context.stage4.isBoss,undefined);
assert.equal(context.stage6.isBoss,true);
assert.equal(context.stage10.isBoss,true);
assert.equal(context.stage10.name,'Stage 10: BOSS! Hopper Prime');
assert.equal(context.stage14.isBoss,true);
assert.ok(context.stage10.bossHp>=4);
assert.equal(context.stage10.finish.x>900,true);
assert.ok(context.bossStages.every(s=>s.isBoss));
assert.equal(context.isBossStage(0),false);
assert.equal(context.isBossStage(4),false);

console.log('Boss stages: 6, 10, 14, 22, 30...');

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const noop=()=>{};
const gradient={addColorStop:noop};
const drawingContext=new Proxy({}, {
  get(_target,property){
    if(property==='createLinearGradient')return()=>gradient;
    if(property==='measureText')return()=>({width:0});
    return noop;
  },
  set(){return true;},
});
const canvas={
  style:{},
  width:0,
  height:0,
  getContext:()=>drawingContext,
  addEventListener:noop,
  getBoundingClientRect:()=>({left:0,top:0,width:800,height:600}),
};

class FakeAudioContext{
  constructor(){this.state='suspended';this.currentTime=0;}
  resume(){this.state='running';}
  createOscillator(){
    return{type:'',frequency:{value:0},connect:noop,start:noop,stop:noop};
  }
  createGain(){
    return{gain:{setValueAtTime:noop,exponentialRampToValueAtTime:noop},connect:noop};
  }
}

const context={
  console,
  navigator:{userAgent:''},
  innerWidth:800,
  innerHeight:600,
  addEventListener:noop,
  requestAnimationFrame:noop,
  setTimeout:noop,
  clearTimeout:noop,
  AudioContext:FakeAudioContext,
  webkitAudioContext:FakeAudioContext,
  localStorage:{getItem:()=>null,setItem:noop},
  MouseEvent:class{},
  document:{
    getElementById:()=>canvas,
    addEventListener:noop,
    fullscreenElement:null,
    exitFullscreen:noop,
  },
};
context.window=context;
vm.createContext(context);

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)?.[1];
assert.ok(script,'inline game script should exist');

vm.runInContext(
  script+'\nglobalThis.__startGame=startGame; globalThis.__state=state; globalThis.__getLevel=getLevel;',
  context
);

assert.equal(context.__state.mode,0,'game should boot to the menu');
assert.equal(context.__getLevel(4).name,'Stage 5: Deep Space Training Run');
context.__startGame();
assert.equal(context.__state.mode,1,'game should enter play mode');
assert.equal(context.__state.levelCoins[4].length,20,'Level 5 should use its authored coin path');

console.log('Game boot and authored Level 5 integration validated.');

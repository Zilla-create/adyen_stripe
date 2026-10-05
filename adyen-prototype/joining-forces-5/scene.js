/* Volumetric stream bundles, perspective projection and a continuous camera spline. */
(()=>{'use strict';
const canvas=document.getElementById('world'),ctx=canvas.getContext('2d'),journey=document.getElementById('journey'),stage=journey.querySelector('.stage'),titles=[...document.querySelectorAll('.chapter')],left=document.querySelector('.label-left'),right=document.querySelector('.label-right'),motion=document.querySelector('.motion'),media=matchMedia('(prefers-reduced-motion: reduce)');
const enterprise=document.querySelector('.enterprise'), headline=enterprise.querySelector('h2'), supporting=enterprise.querySelector('p'), growth=document.querySelector('.growth'), chart=document.querySelector('.chart'), art=document.querySelector('.chart-art'), reveal=document.querySelector('.chart-reveal'), counter=document.querySelector('.counter'), hint=document.querySelector('.scroll-hint'), replay=document.querySelector('.replay'), count=document.querySelector('.chapter-count'), bar=document.querySelector('.progress-track span'), header=document.querySelector('header');
const tuning=window.AdyenTuning.settings;
const milestones=[...document.querySelectorAll('.milestone')].map(el=>({el,x:Number(el.dataset.x)/1800,crossing:Number(el.dataset.crossing)/534,key:el.dataset.copy,line:el.querySelector('.milestone-line'),curve:el.querySelector('.curve-marker'),marker:el.querySelector('.label-marker'),text:el.querySelector('.milestone-text')}));
journey.style.height=tuning.scrollLength+'svh';
let reduced=media.matches,paused=false,w=0,h=0,mobile=false,range=1,progress=0,target=0,time=0,last=0,raf=0,entrance=0,ready=false;
const pointer={x:0,y:0},cursor={x:0,y:0},clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t,smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
let seed=81;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const lanes=Array.from({length:72},(_,i)=>{const angle=i*2.399963, radius=.3+Math.sqrt(rand())*.7;return{angle,radius,phase:rand()*Math.PI*2,offset:rand(),speed:.7+rand()*.4,size:rand()};});
const V=(x,y,z)=>({x,y,z}),sub=(a,b)=>V(a.x-b.x,a.y-b.y,a.z-b.z),dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z,cross=(a,b)=>V(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x),norm=a=>{const l=Math.hypot(a.x,a.y,a.z)||1;return V(a.x/l,a.y/l,a.z/l);};
// Labels join horizontally as the merged view settles; forward travel accelerates with scroll.
function beats(p){return{exit:smooth((p-1.02)/.18),merge:smooth((p-1.24)/.36),labels:smooth((p-1.50)/.28),travel:Math.pow(clamp((p-1.58)/.42),2.2)};}
// Keep the camera level while the strands twist around their horizontal axis.
function camera(p){
 const beat=beats(p),t=clamp(p),turn=t*t*t*(t*(t*6-15)+10);
 const orbit=V(0,90,1900);
 const pos=V(mix(orbit.x,0,beat.merge),mix(orbit.y,-180,beat.merge),mix(orbit.z,1420,beat.merge));
 // Track the actual shared endpoint as it becomes the merged stream's vanishing point.
 const look=streamJunction(beat.merge);
 pos.z-=beat.travel*6200;
 const px=reduced?0:cursor.x*85*beat.merge,py=reduced?0:cursor.y*48;
 pos.x+=px;pos.y+=py;
 const f=norm(sub(look,pos)),r=norm(cross(f,V(0,1,0))),up=cross(r,f);
 return{pos,f,r,up,merge:beat.merge,axisTurn:Math.PI*.5*turn,focal:1420};
}
function streamJunction(merge){return V(0,-180*merge,-22200*merge);}
function point(lane,u,side,c){const s=1-u,envelope=Math.pow(s,.85),flow=time*.16,angle=lane.angle+Math.sin(u*3+flow)*.22+u*1.35;const radial=lane.radius;
// Cross-sections are elliptical volumes: strands pass in front of and behind one another.
const initial=V(side*(1420*s+Math.sin(u*Math.PI)*100),Math.sin(angle)*radial*490*envelope+Math.sin(u*5+flow+lane.phase)*42*envelope,Math.cos(angle)*radial*800*envelope+Math.sin(u*4+lane.phase+flow)*65*envelope);
// Rotate only the cross-section; the longitudinal axis and shared tip stay fixed.
const axialY=initial.y,axialZ=initial.z;
initial.y=axialY*Math.cos(c.axisTurn)-axialZ*Math.sin(c.axisTurn);
initial.z=axialY*Math.sin(c.axisTurn)+axialZ*Math.cos(c.axisTurn);
const twist=lane.angle+u*.35+Math.sin(flow+u*2)*.09;
// Taper only the far end, so every strand shares the same centred vanishing point.
const tip=1-smooth((u-.85)/.15);
const final=V((Math.sin(twist)*radial*1050+Math.sin(u*4+flow)*45)*tip,-180+(Math.cos(twist)*radial*540+Math.sin(u*5+flow)*28)*tip,1800-u*24000);
return V(mix(initial.x,final.x,c.merge),mix(initial.y,final.y,c.merge),mix(initial.z,final.z,c.merge));}
function project(v,c){const q=sub(v,c.pos),z=dot(q,c.f);if(z<90)return null;const scale=c.focal/z;return{x:w*.5+dot(q,c.r)*scale*w/1920,y:h*.5-dot(q,c.up)*scale*h/1080,scale,z};}
function draw(){if(!ctx)return;ctx.clearRect(0,0,w,h);const c=camera(Math.min(2,reduced?(target<.5?0:target<1.4?1:2):progress)),segments=[],dots=[],stride=mobile?2:1;
// Soft, broad illumination gives the bundles volume without bloom or neon halos.
const light=ctx.createRadialGradient(w*.52,h*.52,0,w*.52,h*.52,w*.52);light.addColorStop(0,'rgba(18,63,67,.10)');light.addColorStop(1,'rgba(0,18,34,0)');ctx.fillStyle=light;ctx.fillRect(0,0,w,h);
for(let n=0;n<lanes.length;n+=stride){const lane=lanes[n],lit=.5+.5*Math.sin(lane.angle+.8);for(const side of [-1,1]){if(side===-1||c.merge<.999){let prev=null;const steps=mobile?44:60;for(let j=0;j<=steps;j++){const q=project(point(lane,j/steps,side,c),c);if(q&&prev){const depth=(q.z+prev.z)*.5,alpha=clamp(1800/depth,.15,1)*(.08+lit*.16)*(side>0?1-c.merge:1);segments.push({a:prev,b:q,z:depth,alpha,green:side>0,lit});}prev=q;}}
for(let j=0;j<8;j++){const u=(j/8+lane.offset+(side>0?.0625:0)+time*.026*lane.speed)%1,q=project(point(lane,u,side,c),c);if(!q||q.x< -12||q.x>w+12||q.y< -12||q.y>h+12)continue;const tone=(j+n)%5,colour=side<0?(tone<2?'#FFFFFF':'#8B9BA6'):(tone<3?'#00D16A':'#062D2C');const size=clamp((lane.size>.72?5.5:3)*q.scale*Math.max(.38,w/1920),.65,9);dots.push({...q,size,colour,green:side>0,lit,alpha:clamp((1-u)*30)*clamp(u*35)*clamp(2600/q.z,.2,1)});}}}
segments.sort((a,b)=>b.z-a.z);for(const seg of segments){ctx.strokeStyle=seg.green?`rgba(0,158,99,${seg.alpha})`:`rgba(143,180,186,${seg.alpha})`;ctx.lineWidth=clamp(1100/seg.z,.3,1.05);ctx.beginPath();ctx.moveTo(seg.a.x,seg.a.y);ctx.lineTo(seg.b.x,seg.b.y);ctx.stroke();}
dots.sort((a,b)=>b.z-a.z);for(const d of dots){const x=d.x-d.size/2,y=d.y-d.size/2,face=d.size*.23;ctx.globalAlpha=d.alpha;
if(d.size>2.5){ctx.fillStyle='rgba(0,8,16,.32)';ctx.fillRect(x+face,y+face,d.size,d.size);}
ctx.fillStyle=d.colour;ctx.fillRect(x,y,d.size,d.size);
if(d.size>3){ctx.fillStyle=d.green?'rgba(0,42,30,.42)':'rgba(0,18,34,.32)';ctx.fillRect(x+d.size-face,y,face,d.size);ctx.fillStyle=`rgba(255,255,255,${.07+d.lit*.1})`;ctx.fillRect(x,y,d.size-face,Math.max(.5,face*.5));}}
ctx.globalAlpha=1;}
function updateUI(){const p=Math.min(progress,2),beat=beats(p),merge=beat.labels,intro=reduced?1:smooth(entrance),a=1-smooth((p-.12)/.36),b=smooth((p-.5)/.35)*(1-beat.exit);titles.forEach((el,i)=>{const alpha=(i?b:a)*intro,dy=reduced?0:(i?(1-smooth((p-.5)/.35))*22-beat.exit*36:(1-intro)*24-smooth((p-.12)/.36)*22);el.style.opacity=alpha;el.style.transform=`translate(-50%,calc(-50% + ${dy}px))`;el.setAttribute('aria-hidden',alpha<.1);});
const y=(mobile?.66:569/1080)*100;left.style.top=right.style.top=y+'%';const leftStart=mobile?.06:251/1920,rightStart=mobile?.06:249/1920,gap=mobile?10:12;left.style.left=mix(w*leftStart,w*.5-left.offsetWidth-gap,merge)+'px';right.style.right=mix(w*rightStart,w*.5-right.offsetWidth-gap,merge)+'px';stage.dataset.scene=p<.5?'start':p<1.5?'one-scroll':'two-scroll';updateContinuation();}

// 0–2 retains the supplied Joining Forces sequence (240vh).
// 2–5 adds the Figma continuation (360vh). All reveal/counter state is scroll-derived.
const ease=(a,b,p)=>smooth((p-a)/(b-a));
function backgroundSpeedAt(p){
 const q=clamp((p-2)/3),start=tuning.revealStart/100,end=(tuning.revealStart+tuning.firstDuration)/100;
 return mix(tuning.ambientSpeed,tuning.counterBackgroundSpeed,ease(start,end,q))/100;
}
// Scroll triggers each transition; an independent clock always completes it.
let scrambleClock=0,scramblePending=false;
const scrambleStates=new Map();
function timedScramble(key,el,text,wanted,seconds){
 let state=scrambleStates.get(key);
 if(!state){state={amount:0,from:0,to:0,start:scrambleClock,duration:seconds,running:false};scrambleStates.set(key,state);}
 if(reduced){state.amount=wanted?1:0;state.to=state.amount;state.running=false;}
 else {
  if(state.running){const t=clamp((scrambleClock-state.start)/state.duration);state.amount=mix(state.from,state.to,t);if(t>=1)state.running=false;}
  // A changed scroll target queues behind the current transition, never interrupts it.
  if(!state.running&&state.amount!==(wanted?1:0)){state.from=state.amount;state.to=wanted?1:0;state.start=scrambleClock;state.duration=Math.max(.1,seconds);state.running=true;}
 }
 scramblePending=scramblePending||state.running;
 const visible=state.running||state.amount>0;
 el.textContent=scrambleMilestone(text,state.amount);
 el.style.visibility=visible?'visible':'hidden';
 el.style.opacity=state.to===0?state.amount:1;
 return visible;
}
// Invert smoothstep to trigger each line precisely when the horizontal edge arrives.
function inverseEase(y){return .5-Math.sin(Math.asin(1-2*clamp(y))/3);}
// Monotone cubic interpolation carries velocity through milestones instead of stopping.
function growthAt(q,start,firstEnd,halfway,end,firstValue){
 const xs=[start,firstEnd,halfway,end],ys=[0,firstValue,.5,1];
 if(q<=start)return 0;if(q>=end)return 1;
 const h=[firstEnd-start,halfway-firstEnd,end-halfway];
 const d=[firstValue/h[0],(.5-firstValue)/h[1],.5/h[2]];
 const tangent=i=>{const a=2*h[i]+h[i-1],b=h[i]+2*h[i-1];return (a+b)/(a/d[i-1]+b/d[i]);};
 const slopes=[0,tangent(1),tangent(2),0];
 const i=q<firstEnd?0:q<halfway?1:2,t=(q-xs[i])/h[i],t2=t*t,t3=t2*t;
 return (2*t3-3*t2+1)*ys[i]+(t3-2*t2+t)*h[i]*slopes[i]+(-2*t3+3*t2)*ys[i+1]+(t3-t2)*h[i]*slopes[i+1];
}
function milestoneArrival(x,start,firstEnd,halfway,end){
 if(x<=0)return start;if(x>=1)return end;
 let lo=start,hi=end;
 for(let i=0;i<26;i++){const mid=(lo+hi)/2;if(growthAt(mid,start,firstEnd,halfway,end,.088)<x)lo=mid;else hi=mid;}
 return (lo+hi)/2;
}
function scrambleMilestone(text,t){
 if(reduced||t>=1)return text;
 const pool='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',tick=Math.floor(t*22);
 return [...text].map((letter,i)=>/\s/.test(letter)||t>=.18+.8*i/Math.max(1,text.length-1)?letter:pool[(tick*7+i*11)%pool.length]).join('');
}
function updateMilestones(q,start,firstEnd,halfway,end){
 for(const [index,m] of milestones.entries()){
  const arrival=milestoneArrival(m.x,start,firstEnd,halfway,end);
  const lineStart=arrival+.0005;
  const next=milestones[index+1];
  const exitStart=next?milestoneArrival(next.x,start,firstEnd,halfway,end):Infinity;
  const available=(next?exitStart:1)-lineStart;
  // Reserve time for the final label even when the reveal ends near 100%.
  const lineDuration=Math.min(tuning.lineDuration/100,available*.35);
  const lineEnd=lineStart+lineDuration;
  const crossingAt=lineStart+lineDuration*inverseEase(m.crossing);
  const markerDuration=Math.min(tuning.markerDuration/100,(1-lineEnd)*.8);

  const lineProgress=ease(lineStart,lineEnd,q);
  const curveProgress=ease(crossingAt,Math.min(1,crossingAt+markerDuration),q);
  const labelProgress=ease(lineEnd,lineEnd+markerDuration,q);
  const exitEnd=exitStart+.02;
  const exit=next?ease(exitStart,exitEnd,q):0;
  const active=q>lineEnd&&q<exitStart;
  const text=window.AdyenTuning.copy[m.key].toUpperCase();
  const visible=timedScramble(m.key,m.text,text,active,tuning.labelScrambleSeconds);
  m.line.style.transform=`scaleY(${(reduced?(q>lineStart?1:0):lineProgress)*mix(1,499/534,exit)})`;
  m.line.style.opacity=mix(1,.15,exit);
  m.curve.style.transform=`translate(-50%,-50%) scale(${reduced?(q>crossingAt?1:0):curveProgress})`;
  m.marker.style.transform=`translate(-50%,-50%) scale(${(reduced?(visible?1:0):labelProgress)*(1-exit)})`;

  m.el.setAttribute('aria-label',window.AdyenTuning.copy[m.key]);m.el.setAttribute('aria-hidden',!visible);
 }
}
function updateContinuation(){
 const q=clamp((progress-2)/3), labelFade=1-ease(1.83,2.02,progress);
 left.style.opacity=right.style.opacity=labelFade;
 left.setAttribute('aria-hidden',labelFade<.1);right.setAttribute('aria-hidden',labelFade<.1);
 timedScramble('ambition',left,window.AdyenTuning.copy.ambition.toUpperCase(),progress<2,tuning.openingScrambleSeconds);
 timedScramble('platform',right,window.AdyenTuning.copy.platform.toUpperCase(),progress<2,tuning.openingScrambleSeconds);
 left.style.opacity=right.style.opacity=labelFade;
 const edge=mobile?6:3.125;
 header.style.left=header.style.right=edge+'%';
 const enter=ease(tuning.textStart/100,(tuning.textStart+tuning.textIn)/100,q), approach=ease((tuning.textStart+2)/100,(tuning.textStart+2+tuning.zoomDuration)/100,q), leave=ease(tuning.textExit/100,(tuning.textExit+tuning.textOut)/100,q);
 const alpha=enter*(1-leave);
 enterprise.style.opacity=alpha;
 enterprise.setAttribute('aria-hidden',alpha<.1);
 const scale=reduced?1:mix(tuning.startScale/100,1,approach)+leave*tuning.exitZoom/100;
 headline.style.transform=`translate(-50%,-50%) scale(${scale})`;
 supporting.style.opacity=ease(tuning.supportStart/100,(tuning.supportStart+tuning.supportIn)/100,q);
 supporting.style.transform=`translate(-50%,${reduced?0:(1-ease(tuning.supportStart/100,(tuning.supportStart+tuning.supportIn)/100,q))*16}px)`;
 // The entire panel, including its first block, wipes in at full opacity from zero width.
 const revealStart=tuning.revealStart/100, firstEnd=(tuning.revealStart+tuning.firstDuration)/100, halfway=tuning.fiftyAt/100, end=tuning.revealEnd/100;
 // Keep the opening at full opacity; dim alongside the first counter reveal.
 document.documentElement.style.setProperty('--background-opacity',mix(1,tuning.counterBackgroundOpacity/100,ease(revealStart,firstEnd,q)));
 const chartVisible=q>revealStart;
 growth.style.opacity=chartVisible?1:0;
 growth.setAttribute('aria-hidden',!chartVisible);
 // Text scrambles at full opacity; only the numeric counter retains its entrance fade.
 document.querySelector('.legend').style.opacity=1;
 document.querySelector('.stat').style.opacity=1;
 counter.style.opacity=ease(revealStart,revealStart+.025,q);
 const currentLegend=document.querySelector('.legend-current');
 currentLegend.style.visibility=chartVisible?'visible':'hidden';
 currentLegend.setAttribute('aria-hidden',!chartVisible);
 document.querySelector('.legend-current i').style.transform=`scale(${reduced?(chartVisible?1:0):ease(revealStart,revealStart+tuning.legendDuration/100,q)})`;
 const expansion=growthAt(q,revealStart,firstEnd,halfway,end,.088);
 const value=Math.round(100*growthAt(q,revealStart,firstEnd,halfway,end,.05));
 updateMilestones(q,revealStart,firstEnd,halfway,end);
 reveal.style.clipPath=`inset(0 ${(1-expansion)*100}% 0 0)`;
 counter.textContent=value+'M+';
 timedScramble('currentLegend',document.querySelector('.legend-current .legend-text'),window.AdyenTuning.copy.currentLegend.toUpperCase(),chartVisible,tuning.legendScrambleSeconds);
 // The volume prefix scrambles in without fading; the suffix waits for displayed 50M+.
 const volumeLabel=document.querySelector('.stat-volume'), adyenSuffix=document.querySelector('.stat-adyen');
 timedScramble('volumeLabel',volumeLabel,window.AdyenTuning.copy.volumeLabel.toUpperCase(),chartVisible,tuning.counterLabelScrambleSeconds);
 timedScramble('counterLabel',adyenSuffix,window.AdyenTuning.copy.counterLabel.toUpperCase(),value>=50,tuning.counterLabelScrambleSeconds);
 // White at the 50M milestone; scroll gradually blends toward Adyen green afterward.
 const green=ease(halfway,halfway+tuning.greenDuration/100,q);
 counter.style.color=`rgb(${Math.round(255*(1-green))},${Math.round(255-46*green)},${Math.round(255-149*green)})`;
 // Adyen text scrambles at full opacity; its square scales in from the 50M milestone.
 const adyenLegend=document.querySelector('.legend-adyen'), adyenIn=ease(halfway,halfway+tuning.legendDuration/100,q);
 timedScramble('adyenLegend',document.querySelector('.legend-adyen .legend-text'),window.AdyenTuning.copy.adyenLegend.toUpperCase(),q>=halfway,tuning.legendScrambleSeconds);
 adyenLegend.style.opacity=1;
 adyenLegend.style.visibility=q>=halfway?'visible':'hidden';
 document.querySelector('.legend-adyen i').style.transform=`scale(${reduced?(q>=halfway?1:0):adyenIn})`;
 adyenLegend.setAttribute('aria-hidden',q<halfway);
 if(count)count.textContent=progress<2?'01 / 03':q<revealStart?'02 / 03':'03 / 03';
 bar.style.transform=`scaleX(${progress/5})`;
 const hintAlpha=1-ease(.10,.20,progress);
 hint.style.opacity=hintAlpha;hint.hidden=hintAlpha===0;
 if(replay)replay.hidden=progress<4.94;
 stage.dataset.progress=progress.toFixed(4);
 stage.dataset.continuation=q.toFixed(4);
 window.AdyenTuning.setProgress(q);
}
function go(p,behavior=reduced?'instant':'smooth'){
 window.scrollTo({top:journey.offsetTop+range*p/5,behavior});
}
hint.addEventListener('click',()=>go(3.05));
function replayOpening(){scrambleStates.clear();entrance=0;go(0,'instant');progress=target=0;updateUI();wake();}
replay?.addEventListener('click',replayOpening);
document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();replayOpening();history.replaceState(null,'','#journey');});
document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();go(5,'instant');progress=target=5;updateUI();growth.focus({preventScroll:true});});
window.addEventListener('adyen:tune',e=>{
 const p=progress;
 // Settings are shared with the panel. Only recalculate the range when its height changes.
 if(journey.style.height!==tuning.scrollLength+'svh'){
  journey.style.height=tuning.scrollLength+'svh';resize();go(p,'instant');progress=target=p;
 }
 updateUI();wake();
});
window.addEventListener('adyen:seek-global',e=>{const p=clamp(Number(e.detail),0,5);go(p,'instant');progress=target=p;updateUI();wake();});
window.addEventListener('adyen:seek',e=>{const p=2+3*clamp(Number(e.detail));go(p,'instant');progress=target=p;updateUI();wake();});
window.addEventListener('hashchange',()=>{if(location.hash==='#continuation')go(2);else if(location.hash==='#results')go(5);});

function frame(now){raf=0;if(document.hidden||!ready)return;const dt=last?Math.min((now-last)/1000,.045):1/60;last=now;progress=reduced?target:mix(progress,target,1-Math.exp(-tuning.response*dt));if(Math.abs(progress-target)<.0001)progress=target;const ck=1-Math.exp(-3.4*dt);cursor.x=mix(cursor.x,pointer.x,ck);cursor.y=mix(cursor.y,pointer.y,ck);if(!paused&&!reduced)time+=dt*backgroundSpeedAt(progress);entrance=Math.min(1,entrance+dt/1.1);scrambleClock+=dt;scramblePending=false;updateUI();draw();const visible=scrollY<journey.offsetTop+journey.offsetHeight&&scrollY+innerHeight>journey.offsetTop;if((visible&&!paused&&!reduced)||Math.abs(progress-target)>.0001||Math.abs(cursor.x-pointer.x)>.001||Math.abs(cursor.y-pointer.y)>.001||entrance<1||scramblePending)wake();}
function wake(){if(!raf&&!document.hidden&&ready)raf=requestAnimationFrame(frame);}
function scroll(){target=clamp((scrollY-journey.offsetTop)/range)*5;wake();}
function resize(){w=stage.clientWidth;h=stage.clientHeight;mobile=w<=700;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);range=Math.max(1,journey.offsetHeight-h);const sx=chart.clientWidth/1800,sy=chart.clientHeight/499;art.style.transform=`scale(${sx},${sy})`;document.querySelector('.chart-logo').style.transform=`scale(${mobile?1.7:1},${sx/sy*(mobile?1.7:1)})`;document.querySelector('.chart-logo').style.transformOrigin='center';scroll();wake();}
window.addEventListener('resize',resize);window.addEventListener('scroll',scroll,{passive:true});stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||mobile||reduced||!matchMedia('(pointer:fine)').matches)return;pointer.x=(e.clientX/w-.5)*2;pointer.y=(.5-e.clientY/h)*2;wake();},{passive:true});stage.addEventListener('pointerleave',()=>{pointer.x=pointer.y=0;wake();});document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});media.addEventListener('change',e=>{reduced=e.matches;pointer.x=pointer.y=0;wake();});motion?.addEventListener('click',()=>{paused=!paused;motion.setAttribute('aria-pressed',paused);motion.querySelector('.motion-label').textContent=paused?'Play motion':'Pause motion';motion.querySelector('.pause-icon').textContent=paused?'▷':'Ⅱ';motion.setAttribute('aria-label',paused?'Play ambient motion':'Pause ambient motion');wake();});document.fonts.ready.then(()=>{ready=true;resize();if(location.hash==='#continuation')go(2);else if(location.hash==='#results')go(5);});
})();

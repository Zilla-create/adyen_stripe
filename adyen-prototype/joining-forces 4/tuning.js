/* Local review controls. Nothing is sent until the user copies and shares a preset. */
(()=>{'use strict';
const defaults={"headlineSize":100,"startScale":50,"exitZoom":18,"textStart":3.5,"textIn":12.5,"zoomDuration":23,"textExit":40.5,"textOut":11,"supportStart":20,"supportIn":8.5,"revealStart":56,"firstDuration":8,"fiftyAt":80,"revealEnd":95.5,"scrambleDuration":8,"counterSize":100,"greenDuration":7,"legendDuration":4.5,"ambientSpeed":35,"response":2,"scrollLength":800,"lineDuration":1.5,"labelScrambleDuration":2,"markerDuration":0.4,"counterLabelScrambleDuration":4.5};
const copyDefaults={opening:'You’ve\noutgrown',provider:'your payments\nprovider',headline:'What got you started isn’t built\nfor enterprise reality.',supporting:'Every additional software layer and dependency in your payments system slows innovation. Adyen’s single platform is designed to give enterprise businesses the control to turn payments into a strategic growth driver.',ambition:'YOUR AMBITION',platform:'OUR PLATFORM',currentLegend:'Current setup',adyenLegend:'With Adyen',counterLabel:'With Adyen',volumeLabel:'Your yearly processing volume',cta:'Talk to our experts',selfService:'Self service',aggregator:'Aggregator model',blended:'Blended model',singlePlatform:'Single platform',banking:'Global banking licenses',partnership:'Strategic partnership'};
const copyFields=[['opening','Opening headline','.chapter',0,300],['provider','Second headline','.chapter + .chapter',.85,300],['headline','Enterprise headline','.enterprise h2',3.02,300],['supporting','Supporting paragraph','.enterprise p',3.02,1200],['ambition','Left opening label','.label-left',0,100],['platform','Right opening label','.label-right',0,100],['currentLegend','Current setup legend','.legend-current .legend-text',4.5,100],['adyenLegend','Adyen legend','.legend-adyen .legend-text',4.7,100],['volumeLabel','Processing volume label','.stat-volume',4.2,160],['counterLabel','Green counter label (from 50M+)','.stat-adyen',4.7,100],['cta','Contact button','.header-cta',3.02,80],['selfService','Self service label','.milestone-selfService',5,120],['aggregator','Aggregator model label','.milestone-aggregator',5,120],['blended','Blended model label','.milestone-blended',5,120],['singlePlatform','Single platform label','.milestone-singlePlatform',5,120],['banking','Global banking licenses label','.milestone-banking',5,120],['partnership','Strategic partnership label','.milestone-partnership',5,120]];
let savedCopy={};try{savedCopy=JSON.parse(localStorage.getItem('adyen-copy-preset-20261001-v1')||'{}')||{}}catch{}
const copy={...copyDefaults};for(const [key,,,,max] of copyFields)if(typeof savedCopy[key]==='string')copy[key]=savedCopy[key].slice(0,max);
const groups=[['Text',[
 ['headlineSize','Headline size',50,200,1,'%'],['startScale','Starting zoom',20,90,1,'%'],['exitZoom','Extra zoom on exit',0,40,1,'%'],
 ['textStart','Headline enters at',0,12,.5,'%'],['textIn','Headline fade-in length',5,18,.5,'%'],['zoomDuration','Zoom length',10,26,.5,'%'],['textExit','Headline exits at',32,46,.5,'%'],['textOut','Headline fade-out length',5,11,.5,'%'],['supportStart','Supporting copy enters at',15,28,.5,'%'],['supportIn','Supporting copy fade length',3,10,.5,'%']]],
 ['Reveal & counter',[
 ['revealStart','Reveal begins at',54,60,.5,'%'],['firstDuration','First block reveal length',4,8,.5,'%'],['fiftyAt','50M+ milestone at',76,84,.5,'%'],['revealEnd','100M+ milestone at',92,98,.5,'%'],['scrambleDuration','Scramble length',2,8,.5,'%'],['counterSize','Counter size',70,120,1,'%'],['counterLabelScrambleDuration','With Adyen scramble length',.5,8,.5,'%'],['greenDuration','White-to-green fade length',1,12,.5,'%'],['legendDuration','Adyen legend fade length',1,12,.5,'%']]],
 ['Label sequence',[["lineDuration","Vertical line draw length",.5,6,.1,'%'],['labelScrambleDuration','Label scramble length',.5,5,.1,'%'],['markerDuration','Square scale-in length',.2,2,.1,'%']]],
 ['Overall motion',[
 ['ambientSpeed','Background speed',0,200,5,'%'],['response','Scroll responsiveness',2,16,.5,''],['scrollLength','Total scroll length',400,1000,20,'vh']]]];
const defs=groups.flatMap(g=>g[1]);let saved={};try{saved=JSON.parse(localStorage.getItem('adyen-motion-preset-20261001-v1')||'{}')}catch{}
const settings={...defaults};for(const [key,,min,max] of defs)if(Number.isFinite(saved[key]))settings[key]=Math.max(min,Math.min(max,saved[key]));
const textSizeDefaults={"opening":100,"provider":100,"headline":100,"supporting":80,"ambition":100,"platform":100,"currentLegend":100,"adyenLegend":100,"volumeLabel":100,"counterLabel":100,"cta":100,"selfService":80,"aggregator":80,"blended":80,"singlePlatform":80,"banking":80,"partnership":80};
let savedSizes={};try{savedSizes=JSON.parse(localStorage.getItem('adyen-text-sizes-preset-20261001-v1')||'{}')||{}}catch{}
const textSizes={...textSizeDefaults};for(const key of Object.keys(textSizes))if(Number.isFinite(savedSizes[key]))textSizes[key]=Math.max(50,Math.min(200,savedSizes[key]));
// Keep the existing enterprise-headline size control as the same setting, not a second multiplier.
textSizes.headline=settings.headlineSize;
const panel=document.getElementById('tuning-panel'), list=document.getElementById('tuning-fields'), status=document.getElementById('tuning-status'), scrub=document.getElementById('tuning-scrub'), scrubValue=document.getElementById('tuning-position'), exportBox=document.getElementById('tuning-export');
const controls=new Map(), copyInputs=new Map(), sizeControls=new Map();
const editor=document.createElement('details');editor.className='tuning-group copy-editor';editor.open=true;
const editorTitle=document.createElement('summary');editorTitle.textContent='Edit text';editor.append(editorTitle);
const help=document.createElement('p');help.className='copy-help';help.textContent='Type to update live. Enter adds a line break. Size is relative to the responsive design: 100% is the original size.';editor.append(help);
for(const [key,label,selector,position,maxLength] of copyFields){
 const row=document.createElement('div');row.className='copy-field';const caption=document.createElement('label');caption.htmlFor='copy-'+key;caption.textContent=label;
 const input=document.createElement('textarea');Object.assign(input,{id:'copy-'+key,value:copy[key],rows:key==='supporting'?5:['opening','provider','headline'].includes(key)?3:2,maxLength});
 input.addEventListener('input',()=>{copy[key]=input.value;applyCopy();apply();});
 const preview=document.createElement('button');preview.type='button';preview.textContent='Preview';preview.setAttribute('aria-label','Preview '+label.toLowerCase());preview.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('adyen:seek-global',{detail:position})));
 const sizeRow=document.createElement('div');sizeRow.className='copy-size';
 const sizeLabel=document.createElement('label');sizeLabel.htmlFor='size-'+key;sizeLabel.textContent='Text size';
 const sizeSlider=document.createElement('input');Object.assign(sizeSlider,{type:'range',id:'size-'+key,min:50,max:200,step:1,value:textSizes[key]});sizeSlider.setAttribute('aria-label',label+' text size');
 const sizeNumber=document.createElement('input');Object.assign(sizeNumber,{type:'number',id:'size-value-'+key,min:50,max:200,step:1,value:textSizes[key]});sizeNumber.setAttribute('aria-label',label+' text size percentage');
 const unit=document.createElement('span');unit.textContent='%';unit.setAttribute('aria-hidden','true');
 function setSize(value){if(!Number.isFinite(value))return;const amount=Math.round(Math.max(50,Math.min(200,value)));textSizes[key]=amount;if(key==='headline')settings.headlineSize=amount;apply();}
 sizeSlider.addEventListener('input',()=>setSize(Number(sizeSlider.value)));sizeNumber.addEventListener('change',()=>{if(sizeNumber.value.trim()===''){sizeNumber.value=textSizes[key];return;}setSize(Number(sizeNumber.value));});
 sizeRow.append(sizeLabel,sizeSlider,sizeNumber,unit);sizeControls.set(key,{slider:sizeSlider,number:sizeNumber});
 row.append(caption,preview,input,sizeRow);editor.append(row);copyInputs.set(key,input);
}
const resetText=document.createElement('button');resetText.type='button';resetText.className='copy-reset';resetText.textContent='Reset text & sizes';resetText.addEventListener('click',()=>{resetCopy();apply();status.textContent='Default wording and text sizes restored. Other motion settings kept.'});editor.append(resetText);document.getElementById('tuning-copy-fields').append(editor);
function applyCopy(){for(const [key,,selector] of copyFields){document.querySelector(selector).textContent=copy[key];}try{localStorage.setItem('adyen-copy-preset-20261001-v1',JSON.stringify(copy))}catch{}}
function resetCopy(){Object.assign(copy,copyDefaults);Object.assign(textSizes,textSizeDefaults);settings.headlineSize=defaults.headlineSize;for(const [key,input] of copyInputs)input.value=copy[key];applyCopy();}
for(const [title,fields] of groups){const section=document.createElement('details');section.className='tuning-group';section.open=false;const summary=document.createElement('summary');summary.textContent=title;section.append(summary);
 for(const [key,label,min,max,step,unit] of fields){const row=document.createElement('div');row.className='tuning-field';const caption=document.createElement('label');caption.htmlFor='tune-'+key;caption.textContent=label;const output=document.createElement('output');output.htmlFor='tune-'+key;const input=document.createElement('input');Object.assign(input,{type:'range',id:'tune-'+key,min,max,step,value:settings[key]});output.textContent=settings[key]+unit;input.setAttribute('aria-valuetext',settings[key]+unit);input.addEventListener('input',()=>{settings[key]=Number(input.value);output.textContent=settings[key]+unit;input.setAttribute('aria-valuetext',settings[key]+unit);apply();});row.append(caption,output,input);section.append(row);controls.set(key,{input,output,unit});}list.append(section);}
function apply(){
 textSizes.headline=settings.headlineSize;
 for(const [key,size] of Object.entries(textSizes)){
  document.documentElement.style.setProperty('--copy-'+key+'-size',size/100);
  const control=sizeControls.get(key);control.slider.value=size;control.number.value=size;control.slider.setAttribute('aria-valuetext',size+'%');
 }
 const headlineControl=controls.get('headlineSize');headlineControl.input.value=settings.headlineSize;headlineControl.output.textContent=settings.headlineSize+'%';headlineControl.input.setAttribute('aria-valuetext',settings.headlineSize+'%');
 // Keep the scramble resolved before the numeric count-up begins.
 settings.scrambleDuration=Math.min(settings.scrambleDuration,settings.firstDuration);
 const scrambleControl=controls.get('scrambleDuration');scrambleControl.input.value=settings.scrambleDuration;scrambleControl.output.textContent=settings.scrambleDuration+'%';scrambleControl.input.setAttribute('aria-valuetext',settings.scrambleDuration+'%');
 document.documentElement.style.setProperty('--headline-size',settings.headlineSize/100);
 document.documentElement.style.setProperty('--counter-size',settings.counterSize/100);
 try{localStorage.setItem('adyen-motion-preset-20261001-v1',JSON.stringify(settings));localStorage.setItem('adyen-text-sizes-preset-20261001-v1',JSON.stringify(textSizes));status.textContent='Saved in this browser. Copy settings to share them.'}catch{status.textContent='Changes apply now. Copy settings to keep them.'}
 exportBox.hidden=true;window.dispatchEvent(new CustomEvent('adyen:tune',{detail:{...settings}}));
}
window.AdyenTuning={settings,defaults,copy,copyDefaults,textSizes,getTextSizes:()=>({...textSizes}),getCopy:()=>({...copy}),get:()=>({...settings}),setProgress(q){scrub.value=(q*100).toFixed(1);scrubValue.textContent=(q*100).toFixed(1)+'%';}};
function seek(q){window.dispatchEvent(new CustomEvent('adyen:seek',{detail:q}));}
scrub.addEventListener('input',()=>{scrubValue.textContent=Number(scrub.value).toFixed(1)+'%';seek(Number(scrub.value)/100)});
for(const button of document.querySelectorAll('[data-tune-jump]'))button.addEventListener('click',()=>{const key=button.dataset.tuneJump;seek(key==='text'?(settings.textExit-2)/100:key==='reveal'?settings.revealStart/100:key==='fifty'?settings.fiftyAt/100:1);});
document.getElementById('tuning-toggle').addEventListener('click',()=>{panel.hidden=!panel.hidden;document.getElementById('tuning-toggle').setAttribute('aria-expanded',!panel.hidden)});
document.getElementById('tuning-close').addEventListener('click',()=>{panel.hidden=true;const toggle=document.getElementById('tuning-toggle');toggle.setAttribute('aria-expanded',false);toggle.focus()});
panel.addEventListener('keydown',e=>{if(e.key==='Escape'){document.getElementById('tuning-close').click();}});
document.getElementById('tuning-reset').addEventListener('click',()=>{Object.assign(settings,defaults);resetCopy();for(const [key,{input,output,unit}] of controls){input.value=settings[key];output.textContent=settings[key]+unit;input.setAttribute('aria-valuetext',settings[key]+unit)}apply();status.textContent='Default settings restored.'});
document.getElementById('tuning-copy').addEventListener('click',async()=>{const payload={prototype:'Adyen — Enterprise reality',version:3,continuationPositionPercent:Number(scrub.value),settings:{...settings},copy:{...copy},textSizes:{...textSizes}};exportBox.value=JSON.stringify(payload,null,2);exportBox.hidden=false;try{await navigator.clipboard.writeText(exportBox.value);status.textContent='Copied. Paste these settings into our chat.'}catch{exportBox.focus();exportBox.select();status.textContent='Select and copy the settings below, then paste them into our chat.'}});
applyCopy();apply();
if(new URLSearchParams(location.search).has('tune')){panel.hidden=false;document.getElementById('tuning-toggle').setAttribute('aria-expanded',true)}
})();

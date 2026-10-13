/* PHONE SCREEN MOTION MAKER — shared Canvas renderer
   Preview, PNG, GIF and MP4 are drawn through this exact renderer. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const smooth = p => { p = clamp(p, 0, 1); return 1 - (1-p)*(1-p)*(1-p); };
  const getImage = (s, name) => s.assets?.[name] || null;
  const textSegments = s => (typeof Intl !== 'undefined' && Intl.Segmenter)
    ? [...new Intl.Segmenter('ko',{granularity:'grapheme'}).segment(String(s))].map(p=>p.segment)
    : Array.from(String(s));

  function pathRound(ctx,x,y,w,h,r=18){
    r = Math.min(Math.max(r,0), w/2, h/2);
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
  }
  function fillRound(ctx,x,y,w,h,r,fill){pathRound(ctx,x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
  function imageCover(ctx,img,x,y,w,h,zoom=1,offsetX=0,offsetY=0){
    if(!img || !img.complete || !img.naturalWidth) return false;
    const iw=img.naturalWidth, ih=img.naturalHeight, a=Math.max(w/iw,h/ih)*Math.max(.1,zoom);
    const dw=iw*a,dh=ih*a;
    ctx.drawImage(img,x+(w-dw)/2+offsetX*w/100,y+(h-dh)/2+offsetY*h/100,dw,dh);
    return true;
  }
  function string(ctx,value,x,y,size=22,color='#fff',weight=500,maxWidth=9999,align='left'){
    ctx.font=`${weight} ${size}px -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif`;
    ctx.textAlign=align; ctx.textBaseline='middle'; ctx.fillStyle=color;
    ctx.fillText(String(value ?? ''),x,y,maxWidth);
  }
  function drawBg(ctx,s){
    const {w,h}=s;
    const grad=ctx.createLinearGradient(0,0,w,h);grad.addColorStop(0,s.bgColor||'#5b6d88');grad.addColorStop(.54,'#222b43');grad.addColorStop(1,'#0a111c');
    ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
    const bg=getImage(s,'bg');
    if(bg){ctx.save();ctx.filter=`blur(${s.bgBlur||0}px)`; const e=(s.bgBlur||0)*3;imageCover(ctx,bg,-e,-e,w+e*2,h+e*2,s.bgZoom||1,s.bgX||0,s.bgY||0);ctx.restore();}
    const veil=ctx.createLinearGradient(0,0,0,h);veil.addColorStop(0,'rgba(1,3,13,.07)');veil.addColorStop(1,`rgba(2,5,14,${clamp((s.bgShade??22)/100,0,.85)})`);
    ctx.fillStyle=veil;ctx.fillRect(0,0,w,h);
    const glow=ctx.createRadialGradient(w*.72,h*.24,10,w*.60,h*.30,Math.max(w,h)*.8);
    glow.addColorStop(0,'rgba(255,255,255,.12)');glow.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
  }
  function drawPhone(ctx,s){
    const {w,h}=s, sc=(s.phoneScale||100)/100;
    const pw=Math.min(w*.60,h*.465)*sc,ph=pw*2.075;
    const x=(w-pw)/2+(s.phoneX||0)*w/100,y=(h-ph)/2+(s.phoneY||0)*h/100;
    const r=Math.min(62,pw*.118);
    ctx.save();ctx.shadowColor='rgba(0,0,0,.54)';ctx.shadowBlur=48;ctx.shadowOffsetY=22;
    fillRound(ctx,x-6,y-6,pw+12,ph+12,r+4,'#1b1e25');ctx.restore();
    const border=ctx.createLinearGradient(x,y,x+pw,y+ph);border.addColorStop(0,'#f0f0ef');border.addColorStop(.22,'#8d939c');border.addColorStop(.55,'#f7f6f1');border.addColorStop(1,'#646b76');
    fillRound(ctx,x-5,y-5,pw+10,ph+10,r+3,border);
    fillRound(ctx,x,y,pw,ph,r,'#10131b');
    ctx.save();pathRound(ctx,x+5,y+5,pw-10,ph-10,r-5);ctx.clip();
    const ig=getImage(s,'art');
    if(!imageCover(ctx,ig,x+5,y+5,pw-10,ph-10,s.artZoom||1,s.artX||0,s.artY||0)){
      const g=ctx.createLinearGradient(x,y,x+pw,y+ph);g.addColorStop(0,'#6e7b91');g.addColorStop(.4,'#292a39');g.addColorStop(1,'#16131f');ctx.fillStyle=g;ctx.fillRect(x,y,pw,ph);
      ctx.globalAlpha=.12; for(let i=0;i<9;i++){ctx.beginPath();ctx.ellipse(x+pw*(i*.13-.2),y+ph*.6,pw*.16,ph*.42,Math.PI/5,0,TAU);ctx.fillStyle='#fff';ctx.fill();}ctx.globalAlpha=1;
    }
    const shade=ctx.createLinearGradient(0,y,0,y+ph);shade.addColorStop(0,'rgba(0,0,0,.33)');shade.addColorStop(.36,'rgba(0,0,0,0)');shade.addColorStop(1,`rgba(0,0,0,${clamp((s.phoneShade??30)/100,0,.75)})`);
    ctx.fillStyle=shade;ctx.fillRect(x,y,pw,ph);
    const font=Math.max(11,pw*.038);
    string(ctx,'9:41',x+pw*.105,y+pw*.087,font,'rgba(255,255,255,.91)',700);
    string(ctx,'●  ▰  ▰',x+pw*.9,y+pw*.087,font*.66,'rgba(255,255,255,.86)',600,100,'right');
    fillRound(ctx,x+pw*.375,y+pw*.033,pw*.25,pw*.055,pw*.035,'rgba(4,6,10,.93)');
    string(ctx,s.pairName||'',x+pw/2,y+pw*.24,pw*.042,'rgba(255,255,255,.86)',650,pw*.8,'center');
    fillRound(ctx,x+pw*.355,y+ph-pw*.060,pw*.29,pw*.010,pw*.01,'rgba(255,255,255,.85)');
    ctx.restore();
    return {x,y,w:pw,h:ph};
  }
  function glassCard(ctx,base,x,y,w,h,r=26,opacity=.21){
    ctx.save();pathRound(ctx,x,y,w,h,r);ctx.clip();
    if(base){ctx.filter='blur(17px)';ctx.drawImage(base,-9,-9,base.width+18,base.height+18);ctx.filter='none';}
    ctx.fillStyle=`rgba(255,255,255,${clamp(opacity,0,.9)})`;ctx.fillRect(x,y,w,h);
    const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'rgba(255,255,255,.33)');g.addColorStop(.45,'rgba(255,255,255,.025)');g.addColorStop(1,'rgba(255,255,255,.08)');ctx.fillStyle=g;ctx.fillRect(x,y,w,h);
    ctx.restore();
    ctx.save();pathRound(ctx,x,y,w,h,r);ctx.lineWidth=1.5;ctx.strokeStyle='rgba(255,255,255,.58)';ctx.stroke();
    pathRound(ctx,x+2,y+2,w-4,h-4,Math.max(2,r-2));ctx.lineWidth=1;ctx.strokeStyle='rgba(255,255,255,.17)';ctx.stroke();ctx.restore();
  }
  function layout(s){
    const w=s.w,h=s.h;
    const configs={
      search:[330,72],music:[380,s.showQueue?188:122],dday:[244,124],post:[306,346]
    };
    return Object.fromEntries(Object.entries(configs).map(([id,[bw,bh]])=>{
      const p=s.widgets[id],sc=(p.scale||100)/100*Math.min(w/720+0.13,1.17);
      const ww=bw*sc,hh=bh*sc;
      return [id,{id,x:p.x*w/100-ww/2,y:p.y*h/100-hh/2,w:ww,h:hh,scale:sc}];
    }));
  }
  function getTimeline(s){
    const on = ['search','music','dday','post'].filter(k=>s.widgets[k]?.visible);
    const entries=on.map((id,i)=>({id,start:(s.firstDelay||0)+i*(s.stagger||.65)}));
    const num=entries.length;
    for(const [i,b] of s.bubbles.entries()){
      if(b.visible!==false) entries.push({id:'bubble:'+b.id,start:(s.firstDelay||0)+(num+i)*(s.stagger||.65)+(Number(b.extraDelay)||0)});
    }
    const end=Math.max(1.5,...entries.map(e=>e.start+(s.motionDuration||.53)));
    return {entries,end,total:end+(s.finalHold||1.7)};
  }
  function motion(s,t,start){
    if(t===Infinity) return {alpha:1,scale:1,dx:0,dy:0};
    const p=clamp((t-start)/Math.max(.08,s.motionDuration||.53),0,1);
    if(t<start) return null;
    const ease=smooth(p);
    if(s.effect==='fade')return {alpha:ease,scale:.97+.03*ease,dx:0,dy:0};
    if(s.effect==='slide')return {alpha:ease,scale:1,dx:0,dy:34*(1-ease)};
    if(s.effect==='float')return {alpha:ease,scale:.95+.05*ease,dx:0,dy:45*(1-ease)};
    if(s.effect==='instant')return {alpha:1,scale:1,dx:0,dy:0};
    const bounce = 1 + (p<1? .085*Math.sin(p*Math.PI*2)*Math.exp(-p*2.1):0);
    return {alpha:clamp(p*2.4,0,1),scale:(.72+.28*ease)*bounce,dx:0,dy:16*(1-ease)};
  }
  function animated(ctx,s,t,key,rect,draw,boxes,final){
    const item=getTimeline(s).entries.find(e=>e.id===key);if(!item)return;
    const m=motion(s,final?Infinity:t,item.start);if(!m)return;
    const {x,y,w,h}=rect;
    ctx.save();ctx.globalAlpha*=m.alpha;ctx.translate(x+w/2+m.dx,y+h/2+m.dy);ctx.scale(m.scale,m.scale);ctx.translate(-x-w/2,-y-h/2);
    draw();ctx.restore();
    boxes.push({id:key,x,y,w,h});
  }
  function drawSearch(ctx,s,base,r,t,final){
    const {x,y,w,h,scale:sc}=r;glassCard(ctx,base,x,y,w,h,h/2,s.glassOpacity/100);
    const typed=String(s.searchText||'With suggestions');
    const timeline=getTimeline(s).entries.find(e=>e.id==='search');
    const q=final?1:clamp((t-(timeline?.start||0)-.12)/Math.max(.45,typed.length/Math.max(3,Number(s.typingSpeed||14))),0,1);
    const chars=textSegments(typed);const visible=chars.slice(0,Math.round(chars.length*q)).join('');
    string(ctx,visible,x+22*sc,y+h/2,22*sc,'#fff',500,w-92*sc);
    ctx.strokeStyle='rgba(255,255,255,.91)';ctx.lineWidth=2*sc;ctx.beginPath();ctx.arc(x+w-41*sc,y+h*.46,9*sc,0,TAU);ctx.moveTo(x+w-35*sc,y+h*.57);ctx.lineTo(x+w-29*sc,y+h*.69);ctx.stroke();
  }
  function drawMusic(ctx,s,base,r,t){
    const {x,y,w,h,scale:sc}=r; glassCard(ctx,base,x,y,w,h,25*sc,s.glassOpacity/100);
    const cx=x+16*sc,cy=y+17*sc,cover=76*sc;
    ctx.save();pathRound(ctx,cx,cy,cover,cover,13*sc);ctx.clip();
    if(!imageCover(ctx,getImage(s,'cover'),cx,cy,cover,cover,1,0,0)){
      const g=ctx.createLinearGradient(cx,cy,cx+cover,cy+cover);g.addColorStop(0,'#cfb7ba');g.addColorStop(1,'#33334f');ctx.fillStyle=g;ctx.fillRect(cx,cy,cover,cover);
      string(ctx,'♫',cx+cover/2,cy+cover/2,36*sc,'#fff',400,cover,'center');
    }ctx.restore();
    string(ctx,s.song||'Midnight Hour',cx+cover+17*sc,cy+19*sc,20*sc,'#fff',720,w-cover-67*sc);
    string(ctx,s.artist||'Pair Theme',cx+cover+17*sc,cy+48*sc,14*sc,'rgba(255,255,255,.77)',450,w-cover-67*sc);
    const px=cx+cover+17*sc,py=cy+68*sc,pw=w-cover-61*sc;
    fillRound(ctx,px,py,pw,4*sc,2*sc,'rgba(255,255,255,.35)');
    const f=clamp((s.progress??24)/100+(t%15)/250,0,.98);
    fillRound(ctx,px,py,pw*f,4*sc,2*sc,'#fff');
    string(ctx,'▶',x+w-32*sc,cy+42*sc,16*sc,'#fff',700,30*sc,'center');
    if(s.showQueue){
      const y0=y+111*sc;ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(x+16*sc,y0,w-32*sc,sc*.6);
      const songs=String(s.queueText||'Next: Our Story\nSomething About Us').split('\n').map(v=>v.trim()).filter(Boolean).slice(0,2);
      songs.forEach((line,i)=>{const py=y0+(24+i*25)*sc;
        string(ctx,String(i+1).padStart(2,'0'),x+20*sc,py,12*sc,'rgba(255,255,255,.59)',500);
        string(ctx,line,x+49*sc,py,15*sc,'rgba(255,255,255,.93)',530,w-75*sc);
      });
    }
  }
  function drawDday(ctx,s,base,r,t,final){
    const {x,y,w,h,scale:sc}=r;glassCard(ctx,base,x,y,w,h,26*sc,s.glassOpacity/100);
    const tl=getTimeline(s).entries.find(e=>e.id==='dday');
    const num=990+Math.min(10,Math.floor(Math.max(0,(t-(tl?.start||0)))/(Math.max(.13,s.flipSpeed||.24))));
    string(ctx,s.ddayLabel||'OUR DAY',x+23*sc,y+29*sc,15*sc,'rgba(255,255,255,.83)',700,w-40*sc);
    string(ctx,'D+'+(final?1000:num),x+21*sc,y+75*sc,44*sc,'#fff',750,w-30*sc);
    if(s.ddayDate){string(ctx,s.ddayDate,x+w-17*sc,y+h-18*sc,12*sc,'rgba(255,255,255,.65)',400,w-38*sc,'right');}
  }
  function wrapLines(ctx,str,maxW,maxLines=5){
    const lines=[];String(str||'').split('\n').forEach(segment=>{
      let current='';for(const g of textSegments(segment)){
        if(current && ctx.measureText(current+g).width>maxW){lines.push(current);current=g;}else current+=g;
      }lines.push(current);
    });return lines.slice(0,maxLines);
  }
  function drawPost(ctx,s,base,r,t,final){
    const {x,y,w,h,scale:sc}=r;glassCard(ctx,base,x,y,w,h,22*sc,Math.max(.28,s.glassOpacity/100));
    const inset=15*sc;string(ctx,'◉  '+(s.postUser||'OUR MOMENTS'),x+inset,y+27*sc,16*sc,'#fff',650,w-2*inset);
    const ix=x+inset,iy=y+47*sc,iw=w-2*inset,ih=215*sc;
    ctx.save();pathRound(ctx,ix,iy,iw,ih,15*sc);ctx.clip();
    if(!imageCover(ctx,getImage(s,'post'),ix,iy,iw,ih,s.postZoom||1,s.postX||0,s.postY||0)){
      const g=ctx.createLinearGradient(ix,iy,ix+iw,iy+ih);g.addColorStop(0,'#7c8094');g.addColorStop(1,'#353343');ctx.fillStyle=g;ctx.fillRect(ix,iy,iw,ih);string(ctx,'♡',ix+iw/2,iy+ih/2,52*sc,'rgba(255,255,255,.72)',500,iw,'center');
    }ctx.restore();
    string(ctx,'♡     ◯     ↗',x+inset,y+282*sc,19*sc,'#fff',540,w-2*inset);
    const tl=getTimeline(s).entries.find(e=>e.id==='post');const cap=String(s.postCaption||'Our little universe.');
    const q=final?1:clamp((t-(tl?.start||0)-.25)/(cap.length/20+.2),0,1);
    ctx.font=`${14*sc}px sans-serif`;const lines=wrapLines(ctx,textSegments(cap).slice(0,Math.round(cap.length*q)).join(''),w-2*inset,2);
    lines.forEach((v,i)=>string(ctx,v,x+inset,y+(310+i*19)*sc,14*sc,'#fff',470,w-2*inset));
  }
  function bubblePath(ctx,x,y,w,h,r,side){
    const tail=Math.max(11,Math.min(21,w*.075));r=Math.min(r,h*.30,w*.14);
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    if(side==='sent'){
      ctx.lineTo(x+w,y+h-r-10);ctx.quadraticCurveTo(x+w,y+h-10,x+w-5,y+h-7);
      ctx.quadraticCurveTo(x+w+tail*.45,y+h+tail*.33,x+w+tail*.42,y+h+tail*.8);
      ctx.quadraticCurveTo(x+w-tail*.75,y+h+7,x+w-r,y+h);
      ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    }else{
      ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
      ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x+tail*.75,y+h+7,x-tail*.42,y+h+tail*.8);
      ctx.quadraticCurveTo(x-tail*.45,y+h+tail*.33,x+5,y+h-7);
      ctx.quadraticCurveTo(x,y+h-10,x,y+h-r-10);
    }
    ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
  }
  function bubbleMetrics(ctx,s,b){
    const baseScale=Math.min(s.w/720+.13,1.17);
    const sc=baseScale*(Number(b.scale||100)/100),f=Math.max(16,(s.bubbleFont||25)*sc),padding=21*sc;
    const w=clamp((Number(b.width)||300)*sc,132,s.w*.85);
    ctx.font=`${b.bold?'700':'550'} ${f}px -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif`;
    const lines=wrapLines(ctx,b.text||'메시지',w-padding*2,12);
    const lineHeight=f*1.38,h=Math.max(65*sc,padding*2+lines.length*lineHeight);
    return {w,h,f,padding,lineHeight,lines,sc};
  }
  function bubbleText(ctx,m,x,y){
    ctx.textBaseline='middle';ctx.textAlign='left';ctx.font=`${m.bold?'700':'550'} ${m.f}px -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif`;
    m.lines.forEach((line,i)=>ctx.fillText(line,x+m.padding,y+m.padding+(i+.5)*m.lineHeight));
  }
  function drawBubble(ctx,s,base,b,m,rect){
    const {x,y,w,h}=rect,pad=24;
    // An offscreen layer lets emoji and every other glyph be recolored / punched out.
    const layer=document.createElement('canvas');layer.width=Math.ceil(w+2*pad+28);layer.height=Math.ceil(h+2*pad+28);
    const c=layer.getContext('2d');c.translate(pad,pad);
    if(b.side==='received'){
      bubblePath(c,0,0,w,h,25*m.sc,'received');c.fillStyle='#fff';c.fill();
      c.save();c.globalCompositeOperation='destination-out';c.fillStyle='#000';bubbleText(c,{...m,bold:b.bold},0,0);c.restore();
      c.save();bubblePath(c,0,0,w,h,25*m.sc,'received');c.strokeStyle='rgba(255,255,255,.82)';c.lineWidth=1.3;c.stroke();c.restore();
      ctx.save();ctx.shadowColor='rgba(0,0,0,.16)';ctx.shadowBlur=12*m.sc;ctx.shadowOffsetY=5*m.sc;
      ctx.drawImage(layer,x-pad,y-pad);ctx.restore();
    }else{
      // Warm metallic / glass outline, plus a faint genuinely translucent interior.
      bubblePath(c,0,0,w,h,25*m.sc,'sent');c.fillStyle='rgba(255,255,255,.09)';c.fill();
      const edge=c.createLinearGradient(0,0,w,h);edge.addColorStop(0,'rgba(255,255,255,.99)');edge.addColorStop(.55,'rgba(255,255,255,.44)');edge.addColorStop(1,'rgba(255,255,255,.89)');
      c.strokeStyle=edge;c.lineWidth=3*m.sc;c.stroke();
      bubblePath(c,2*m.sc,2*m.sc,w-4*m.sc,h-4*m.sc,24*m.sc,'sent');c.lineWidth=.8*m.sc;c.strokeStyle='rgba(255,255,255,.45)';c.stroke();
      const letters=document.createElement('canvas');letters.width=layer.width;letters.height=layer.height;
      const tc=letters.getContext('2d');tc.translate(pad,pad);tc.fillStyle='#fff';bubbleText(tc,{...m,bold:b.bold},0,0);
      // source-in recolors even Apple/Google color emoji into monochrome white silhouettes.
      tc.setTransform(1,0,0,1,0,0);tc.globalCompositeOperation='source-in';tc.fillStyle='#fff';tc.fillRect(0,0,letters.width,letters.height);
      c.setTransform(1,0,0,1,0,0);c.drawImage(letters,0,0);
      ctx.save();ctx.shadowColor='rgba(0,0,0,.12)';ctx.shadowBlur=12*m.sc;ctx.drawImage(layer,x-pad,y-pad);ctx.restore();
    }
  }
  function drawCommission(ctx,s){
    if(!s.showCommission || !String(s.commission||'').trim())return;
    string(ctx,`COMMISSION BY ${s.commission.trim()}`,s.w-22,s.h-24,Math.max(11,s.w*.017),'rgba(255,255,255,.80)',500,s.w*.86,'right');
  }
  function draw(s,canvas,t=Infinity,{scale=1,final=false}={}){
    const W=s.w,H=s.h;
    const desiredW=Math.max(2,Math.round(W*scale/2)*2),desiredH=Math.max(2,Math.round(H*scale/2)*2);
    if(canvas.width!==desiredW)canvas.width=desiredW;
    if(canvas.height!==desiredH)canvas.height=desiredH;
    const ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:false});
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    drawBg(ctx,s);drawPhone(ctx,s);
    const base=document.createElement('canvas');base.width=W;base.height=H;base.getContext('2d').drawImage(canvas,0,0,W,H);
    const boxes=[],rs=layout(s);
    for(const id of ['search','music','dday','post']){
      if(!s.widgets[id]?.visible)continue;
      animated(ctx,s,t,id,rs[id],()=>{
        if(id==='search')drawSearch(ctx,s,base,rs[id],t,final);
        if(id==='music')drawMusic(ctx,s,base,rs[id],t);
        if(id==='dday')drawDday(ctx,s,base,rs[id],t,final);
        if(id==='post')drawPost(ctx,s,base,rs[id],t,final);
      },boxes,final);
    }
    for(const b of s.bubbles){
      if(b.visible===false)continue;
      const m=bubbleMetrics(ctx,s,b);
      const r={x:b.x*W/100-m.w/2,y:b.y*H/100-m.h/2,w:m.w,h:m.h};
      animated(ctx,s,t,'bubble:'+b.id,r,()=>drawBubble(ctx,s,base,b,m,r),boxes,final);
    }
    drawCommission(ctx,s);
    return boxes;
  }
  window.PairRender={version:'20261013-bubble-v2',draw,getTimeline,layout,bubbleMetrics};
})();

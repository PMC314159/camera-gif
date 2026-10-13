// Exact companion renderer extracted from index.html's embedded fallback.
(()=>{
  function installEmbeddedExportRenderer(){
      const $ = s => document.querySelector(s);
      const num = (id, fallback = 0) => {
        const el = $(id.startsWith('#') ? id : `#${id}`);
        const v = el ? Number(el.value) : NaN;
        return Number.isFinite(v) ? v : fallback;
      };
      const txt = id => ($(id)?.textContent || '').trim();
      const val = id => ($(id)?.value || '').trim();
      const visible = el => !!el && getComputedStyle(el).display !== 'none' && !el.classList.contains('hidden');
      const clamp = (n,a=0,b=1) => Math.min(b, Math.max(a,n));
      const easeOutCubic = x => 1 - Math.pow(1 - clamp(x), 3);
    
      function rr(ctx,x,y,w,h,r){
        r=Math.max(0,Math.min(r,Math.min(w,h)/2));
        ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
      }
      function sceneGeometry(){
        const scene=$('#sceneContent');
        const value=scene?getComputedStyle(scene).transform:'none';
        const m=new DOMMatrixReadOnly(value==='none'?'matrix(1,0,0,1,0,0)':value);
        return {scale:m.a||1,x:m.e||0,y:m.f||0};
      }
      function localRect(el,rootRect){
        if(!el) return {x:0,y:0,w:0,h:0};
        const r=el.getBoundingClientRect();
        let x=r.left-rootRect.left,y=r.top-rootRect.top,w=r.width,h=r.height;
        const scene=$('#sceneContent');
        if(scene?.contains(el)){
          const g=sceneGeometry();
          x=(x-g.x)/g.scale;y=(y-g.y)/g.scale;w/=g.scale;h/=g.scale;
        }
        return {x,y,w,h};
      }

      function stableMusicRect(rootRect,queueCount){
        const el=$('#musicWidget'),
              raw=localRect(el,rootRect),
              list=$('#playlistOut');

        if(!el)return raw;

        if(!queueCount || !list || !visible(list)){
          return {
            ...raw,
            h:114
          };
        }

        const listRect=localRect(list,rootRect),
              h=listRect.h
                ? Math.max(
                    114,
                    Math.ceil(
                      listRect.y+
                      listRect.h-
                      raw.y+
                      14
                    )
                  )
                : 114;

        return {
          ...raw,
          h
        };
      }
      function glass(ctx,r,alpha=.22,radius=24){
        ctx.save();rr(ctx,r.x,r.y,r.w,r.h,radius);ctx.fillStyle=`rgba(238,242,248,${alpha})`;ctx.fill();ctx.lineWidth=1;ctx.strokeStyle='rgba(255,255,255,.58)';ctx.stroke();ctx.restore();
      }
      function fitImage(ctx,img,r,fit='cover',zoom=1,ox=0,oy=0,radius=0){
        if(!img || !img.complete || !img.naturalWidth || !img.naturalHeight) return;
        const nw=img.naturalWidth, nh=img.naturalHeight;
        const base=fit==='contain'?Math.min(r.w/nw,r.h/nh):Math.max(r.w/nw,r.h/nh);
        const dw=nw*base*zoom, dh=nh*base*zoom;
        ctx.save();if(radius){rr(ctx,r.x,r.y,r.w,r.h,radius);ctx.clip();}
        ctx.drawImage(img,r.x+r.w/2+ox-dw/2,r.y+r.h/2+oy-dh/2,dw,dh);ctx.restore();
      }
      function font(ctx,size,weight=500){ctx.font=`${weight} ${size}px Inter, Pretendard, Arial, sans-serif`;}
      function drawText(ctx,text,x,y,size,weight,color='white',align='left',baseline='alphabetic'){
        ctx.save();font(ctx,size,weight);ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline=baseline;ctx.fillText(text,x,y);ctx.restore();
      }
    
      const measureCanvas=document.createElement('canvas');
      const measureCtx=measureCanvas.getContext('2d');
      function measureTextWidth(text,size=14,weight=500){
        if(!measureCtx) return (text||'').length*size*.58;
        measureCtx.font=`${weight} ${size}px Inter, Pretendard, Arial, sans-serif`;
        return measureCtx.measureText(text||'').width;
      }
      function searchState(s,t,final=false){
        const full=s.text.search||'';
        const f=s.duration/5;
        const start=s.timeline.searchStart+.32*f;
        const available=Math.max(.25,s.duration-start-.18*f);
        const speed=Math.max(s.controls.typingSpeed||18,full.length/available);
        const count=final?full.length:clamp(Math.floor(Math.max(0,t-start)*speed),0,full.length);
        const text=full.slice(0,count);
        return {text,width:Math.max(88,Math.min(300,Math.ceil(measureTextWidth(text,14,500)+86)))};
      }
      function postState(s,t,final=false){
        const full=s.text.postTitle||'';
        const f=s.duration/5;
        const start=s.timeline.postStart+.28*f;
        const available=Math.max(.25,s.duration-start-.18*f);
        const speed=Math.max(s.controls.postTypingSpeed||16,full.length/available);
        const count=final?full.length:clamp(Math.floor(Math.max(0,t-start)*speed),0,full.length);
        return full.slice(0,count);
      }
      function ddayState(s,t,final=false){
        const meta=s.dday;
        if(!meta || !meta.animate || final) return {text:s.text.ddayCount,phase:1,flipping:false};
        const target=meta.value;
        const startDays=Math.min(10,Math.max(1,s.controls.ddayStartDays||5));
        const startValue=Math.max(0,target-startDays);
        const stepDur=s.controls.ddayFlipSpeed||.13;
        const elapsed=Math.max(0,t-(s.timeline.ddayStart+.38*(s.duration/5)));
        const maxSteps=Math.min(startDays,target);
        const steps=Math.min(maxSteps,Math.floor(elapsed/stepDur));
        const value=Math.min(target,startValue+steps);
        const phase=clamp((elapsed-steps*stepDur)/stepDur);
        const prefix=meta.prefix||'D+';
        return {text:`${prefix}${value}`,phase,flipping:phase<1, value};
      }
    
      function drawBackgroundImage(ctx,s,img){
        const prepared=s.images.bgPrepared;

        if(prepared && prepared.complete && prepared.naturalWidth){
          ctx.save();
          ctx.imageSmoothingEnabled=true;
          ctx.imageSmoothingQuality='high';
          ctx.drawImage(prepared,0,0,s.w,s.h);
          ctx.restore();
          return;
        }

        const blur=Math.max(0,Number(s.controls.bgBlur)||0);

        if(blur<.25){
          ctx.save();
          ctx.filter='saturate(.85) brightness(.78)';
          fitImage(ctx,img,{x:0,y:0,w:s.w,h:s.h},'contain',s.controls.bgZoom,s.controls.bgX,s.controls.bgY,0);
          ctx.restore();
          return;
        }

        // Safari/iPhone에서 CanvasRenderingContext2D blur가 무시되는 경우가 있어서,
        // 배경을 한 번 작게 렌더링한 뒤 다시 확대해 실제 픽셀을 부드럽게 만들어요.
        // CSS blur(px) 미리보기보다 저장본이 약하게 보이지 않도록
        // downsample 강도를 조금 더 높여서 시각적 강도를 맞춰요.
        const ratio=Math.max(.12,1/(1+blur*.26)),
              sw=Math.max(40,Math.round(s.w*ratio)),
              sh=Math.max(40,Math.round(s.h*ratio)),
              small=document.createElement('canvas');

        small.width=sw;
        small.height=sh;

        const sc=small.getContext('2d');
        sc.imageSmoothingEnabled=true;
        sc.imageSmoothingQuality='high';
        sc.setTransform(sw/s.w,0,0,sh/s.h,0,0);

        try{
          sc.filter='saturate(.85) brightness(.78)';
        }catch(e){}

        fitImage(sc,img,{x:0,y:0,w:s.w,h:s.h},'contain',s.controls.bgZoom,s.controls.bgX,s.controls.bgY,0);

        ctx.save();
        ctx.imageSmoothingEnabled=true;
        ctx.imageSmoothingQuality='high';
        ctx.drawImage(small,0,0,sw,sh,0,0,s.w,s.h);
        ctx.restore();
      }

      function drawBackground(ctx,s){
        ctx.fillStyle='#68707c';ctx.fillRect(0,0,s.w,s.h);
        const img=s.images.bg;
        if(img && img.complete && img.naturalWidth){
          drawBackgroundImage(ctx,s,img);
        } else {
          const g=ctx.createLinearGradient(0,0,s.w,s.h);
          g.addColorStop(0,'#cfd2d9');g.addColorStop(.45,'#929aa6');g.addColorStop(1,'#4d5159');
          ctx.fillStyle=g;ctx.fillRect(0,0,s.w,s.h);
        }
        const ov=ctx.createLinearGradient(0,0,0,s.h);
        ov.addColorStop(0,'rgba(9,10,14,.18)');
        ov.addColorStop(.6,'rgba(7,8,11,.26)');
        ov.addColorStop(1,'rgba(6,7,10,.45)');
        ctx.fillStyle=ov;ctx.fillRect(0,0,s.w,s.h);
      }
      function drawPhone(ctx,s){
        const p=s.rects.phone, sc=s.rects.screen;
        ctx.save();rr(ctx,p.x,p.y,p.w,p.h,51);ctx.fillStyle='rgba(214,220,230,.24)';ctx.fill();ctx.lineWidth=1.2;ctx.strokeStyle='rgba(255,255,255,.52)';ctx.stroke();ctx.restore();
        ctx.save();rr(ctx,sc.x,sc.y,sc.w,sc.h,44);ctx.fillStyle='#77808d';ctx.fill();ctx.restore();
        fitImage(ctx,s.images.main,sc,'cover',s.controls.mainZoom,s.controls.mainX,s.controls.mainY,44);
        const shade=ctx.createLinearGradient(0,sc.y,0,sc.y+sc.h);shade.addColorStop(0,'rgba(0,0,0,.05)');shade.addColorStop(.45,'rgba(0,0,0,0)');shade.addColorStop(1,'rgba(0,0,0,.15)');ctx.save();rr(ctx,sc.x,sc.y,sc.w,sc.h,44);ctx.clip();ctx.fillStyle=shade;ctx.fillRect(sc.x,sc.y,sc.w,sc.h);ctx.restore();
        const island={x:p.x+p.w/2-41.5,y:p.y+15,w:83,h:23};ctx.save();rr(ctx,island.x,island.y,island.w,island.h,12);ctx.fillStyle='#050608';ctx.fill();ctx.restore();
      }
      function drawSearch(ctx,s,t,final=false){
        const base=s.rects.search, st=searchState(s,t,final), r={x:base.x,y:base.y,w:st.width,h:base.h};
        glass(ctx,r,s.glassAlpha,29);
        if(st.text) drawText(ctx,st.text,r.x+18,r.y+r.h/2,14,500,'rgba(255,255,255,.92)','left','middle');
        const cx=r.x+r.w-28,cy=r.y+r.h/2;ctx.save();ctx.strokeStyle='rgba(255,255,255,.92)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx-2,cy-1,8,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(cx+4,cy+5);ctx.lineTo(cx+10,cy+11);ctx.stroke();ctx.restore();
      }
      function drawDday(ctx,s,t,final=false){
        const r=s.rects.dday;
        const labelRect=s.rects.ddayLabel;
        const countRect=s.rects.ddayCount;
        const dateRect=s.rects.ddayDate;
        const ds=ddayState(s,t,final);

        glass(ctx,r,s.glassAlpha,27);

        const labelY=labelRect&&labelRect.h
          ? labelRect.y+labelRect.h/2
          : r.y+21;

        drawText(
          ctx,
          s.text.ddayLabel,
          labelRect&&labelRect.w?labelRect.x:r.x+17,
          labelY,
          10,
          700,
          'rgba(255,255,255,.72)',
          'left',
          'middle'
        );

        const countX=countRect&&countRect.w?countRect.x:r.x+17;
        const countY=countRect&&countRect.h
          ? countRect.y+countRect.h/2
          : r.y+53;

        ctx.save();

        if(ds.flipping){
          const p=clamp(ds.phase);
          const sy=p<.55
            ? .35+.63*easeOutCubic(p/.55)
            : .98+.02*easeOutCubic((p-.55)/.45);

          ctx.globalAlpha=.45+.55*easeOutCubic(Math.min(1,p/.55));
          ctx.translate(countX,countY);
          ctx.scale(1,sy);
          ctx.translate(-countX,-countY);
        }

        drawText(
          ctx,
          ds.text,
          countX,
          countY,
          31,
          650,
          '#fff',
          'left',
          'middle'
        );

        ctx.restore();

        if(ds.flipping){
          ctx.save();
          ctx.globalAlpha=.22*(1-Math.abs(.5-ds.phase)*2);
          ctx.fillStyle='#fff';
          ctx.fillRect(countX,countY,Math.min(86,r.w-34),1);
          ctx.restore();
        }

        if(s.text.ddayDate && dateRect && dateRect.h){
          drawText(
            ctx,
            s.text.ddayDate,
            dateRect.x,
            dateRect.y+dateRect.h/2,
            9,
            520,
            'rgba(255,255,255,.58)',
            'left',
            'middle'
          );
        }
      }
      function parseClock(v){
        const m=String(v||'').trim().match(/^(\d{1,3}):([0-5]\d)$/);
        return m?(+m[1])*60+(+m[2]):216;
      }
      function formatClock(sec){
        sec=Math.max(0,Math.round(sec));const m=Math.floor(sec/60),s=sec%60;
        return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      }
      function musicPlaybackState(s,t){
        const total=parseClock(s.text.duration),start=total*(s.controls.progress||0)/100,elapsed=Math.max(0,t-s.timeline.musicStart),current=Math.min(total,start+elapsed),pct=total>0?Math.min(100,current/total*100):(s.controls.progress||0);
        return {total,current,pct};
      }
      function drawEqualizer(ctx,x,y,t){
        const widths=2.2,gap=2.4,base=9;
        for(let i=0;i<4;i++){
          const wave=.5+.5*Math.sin(t*(5.6+i*.7)+i*1.7);
          const h=4+wave*9;
          ctx.fillStyle='rgba(255,255,255,.82)';rr(ctx,x+i*(widths+gap),y-h/2,widths,h,1.1);ctx.fill();
        }
      }
      function drawMusic(ctx,s,t=0){
        const r=s.rects.music;
        glass(ctx,r,s.glassAlpha,28);

        const c=s.rects.cover;
        fitImage(
          ctx,
          s.images.cover,
          c,
          'cover',
          s.controls.coverZoom,
          s.controls.coverX,
          s.controls.coverY,
          20
        );

        const songR=s.rects.musicSong,
              artistR=s.rects.musicArtist,
              barR=s.rects.musicBar,
              eqR=s.rects.musicEq,
              playRct=s.rects.musicPlay,
              currentR=s.rects.musicCurrent,
              durationR=s.rects.musicDuration;

        // 미리보기의 실제 CSS 레이아웃 좌표를 그대로 사용해요.
        if(songR?.w){
          drawText(
            ctx,
            s.text.song,
            songR.x,
            songR.y+songR.h/2,
            13,
            700,
            '#fff',
            'left',
            'middle'
          );
        }

        if(artistR?.w){
          drawText(
            ctx,
            s.text.artist,
            artistR.x,
            artistR.y+artistR.h/2,
            10,
            500,
            'rgba(255,255,255,.68)',
            'left',
            'middle'
          );
        }

        const pb=musicPlaybackState(s,t);

        if(barR?.w){
          const bh=Math.max(2,barR.h||3),
                by=barR.y+(barR.h-bh)/2;

          ctx.fillStyle='rgba(255,255,255,.28)';
          rr(ctx,barR.x,by,barR.w,bh,bh/2);
          ctx.fill();

          const fillW=Math.max(0,barR.w*pb.pct/100);
          if(fillW>0){
            ctx.fillStyle='#fff';
            rr(ctx,barR.x,by,fillW,bh,bh/2);
            ctx.fill();
          }
        }

        if(eqR?.w){
          drawEqualizer(
            ctx,
            eqR.x+eqR.w/2-7,
            eqR.y+eqR.h/2,
            t
          );
        }

        if(playRct?.w){
          const playCx=playRct.x+playRct.w/2,
                playCy=playRct.y+playRct.h/2,
                radius=Math.min(playRct.w,playRct.h)/2;

          ctx.beginPath();
          ctx.arc(playCx,playCy,radius,0,Math.PI*2);
          ctx.fillStyle='rgba(255,255,255,.90)';
          ctx.fill();

          // 두 막대도 실제 버튼 중심을 기준으로 대칭 배치해요.
          ctx.fillStyle='#17181c';
          ctx.fillRect(playCx-5,playCy-5,3,10);
          ctx.fillRect(playCx+2,playCy-5,3,10);
        }

        if(currentR?.w){
          drawText(
            ctx,
            formatClock(pb.current),
            currentR.x,
            currentR.y+currentR.h/2,
            8,
            500,
            'rgba(255,255,255,.62)',
            'left',
            'middle'
          );
        }

        if(durationR?.w){
          drawText(
            ctx,
            formatClock(pb.total),
            durationR.x+durationR.w,
            durationR.y+durationR.h/2,
            8,
            500,
            'rgba(255,255,255,.62)',
            'right',
            'middle'
          );
        }

        const playlistR=s.rects.musicPlaylist;

        if(s.queue.length && playlistR?.w){
          // 미리보기 .playlist의 border-top을 그대로 재현해요.
          ctx.fillStyle='rgba(255,255,255,.16)';
          ctx.fillRect(
            playlistR.x,
            playlistR.y,
            playlistR.w,
            1
          );
        }

        for(const q of s.queue){
          const titleR=q.titleRect,
                artistR=q.artistRect,
                indexR=q.indexRect;

          if(titleR?.w){
            drawText(
              ctx,
              q.title,
              titleR.x,
              titleR.y+titleR.h/2,
              11,
              620,
              '#fff',
              'left',
              'middle'
            );
          }

          if(artistR?.w){
            drawText(
              ctx,
              q.artist,
              artistR.x,
              artistR.y+artistR.h/2,
              9,
              500,
              'rgba(255,255,255,.58)',
              'left',
              'middle'
            );
          }

          if(indexR?.w){
            drawText(
              ctx,
              q.index,
              indexR.x+indexR.w,
              indexR.y+indexR.h/2,
              9,
              500,
              'rgba(255,255,255,.4)',
              'right',
              'middle'
            );
          }
        }
      }
      function drawPost(ctx,s,t,final=false){
        if(!s.postVisible)return;

        const imgR=s.rects.postImage,
              titleR=s.rects.postTitle;

        fitImage(
          ctx,
          s.images.post,
          imgR,
          'contain',
          s.controls.postZoom,
          s.controls.postX,
          s.controls.postY,
          22
        );

        glass(
          ctx,
          titleR,
          Math.min(.26,s.glassAlpha+.02),
          16
        );

        const title=postState(s,t,final);

        if(title){
          const lines=title.replace(/\r/g,'').split('\n').slice(0,2),
                lineH=16.2,
                totalH=lines.length*lineH,
                firstY=titleR.y+(titleR.h-totalH)/2+lineH/2;

          lines.forEach((line,i)=>{
            drawText(
              ctx,
              line,
              titleR.x+12,
              firstY+i*lineH,
              12,
              620,
              '#fff',
              'left',
              'middle'
            );
          });
        }
      }
      function drawCommission(ctx,s){
        const text=(s.text.commission||'').trim();
        if(!text)return;
        ctx.save();
        ctx.font='600 10px Inter, Pretendard, Arial, sans-serif';
        ctx.textAlign='left';
        ctx.textBaseline='bottom';
        ctx.fillStyle='rgba(255,255,255,.96)';
        ctx.shadowColor='rgba(0,0,0,.72)';
        ctx.shadowBlur=5;
        ctx.shadowOffsetX=0;
        ctx.shadowOffsetY=1.5;
        ctx.fillText(text,14,s.h-14);
        ctx.restore();
      }
      function loadImage(src){return new Promise(resolve=>{if(!src){resolve(null);return;}const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;});}
      function loadObjectImage(url){
        return new Promise((resolve,reject)=>{
          const img=new Image();
          img.onload=()=>resolve(img);
          img.onerror=()=>reject(new Error('배경 필터 이미지를 만들지 못했어요.'));
          img.src=url;
        });
      }

      async function prepareFilteredBackground(img,w,h,zoom,ox,oy,blur){
        if(!img || !img.naturalWidth || !img.naturalHeight)return null;

        const isPhone=/iPhone|iPod/i.test(navigator.userAgent||''),
              phoneScale=Math.min(2,1080/w,1920/h),
              rasterScale=isPhone?Math.max(1,phoneScale):2,
              rw=Math.max(2,Math.round(w*rasterScale)),
              rh=Math.max(2,Math.round(h*rasterScale)),
              raw=document.createElement('canvas');

        raw.width=rw;
        raw.height=rh;

        const rc=raw.getContext('2d');
        rc.imageSmoothingEnabled=true;
        rc.imageSmoothingQuality='high';
        rc.setTransform(rasterScale,0,0,rasterScale,0,0);

        fitImage(
          rc,
          img,
          {x:0,y:0,w,h},
          'contain',
          zoom,
          ox,
          oy,
          0
        );

        const rawUrl=raw.toDataURL('image/png'),
              sigma=Math.max(0,Number(blur)||0)*rasterScale,
              pad=Math.ceil(Math.max(2,sigma*4));

        const svg=
`<svg xmlns="http://www.w3.org/2000/svg" width="${rw}" height="${rh}" viewBox="0 0 ${rw} ${rh}">
  <defs>
    <filter id="bgf"
      filterUnits="userSpaceOnUse"
      x="${-pad}" y="${-pad}"
      width="${rw+pad*2}" height="${rh+pad*2}"
      color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${sigma}"/>
      <feColorMatrix type="saturate" values="0.85"/>
      <feComponentTransfer>
        <feFuncR type="linear" slope="0.78"/>
        <feFuncG type="linear" slope="0.78"/>
        <feFuncB type="linear" slope="0.78"/>
        <feFuncA type="identity"/>
      </feComponentTransfer>
    </filter>
  </defs>
  <image
    href="${rawUrl}"
    x="0" y="0"
    width="${rw}" height="${rh}"
    preserveAspectRatio="none"
    filter="url(#bgf)"/>
</svg>`;

        const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),
              url=URL.createObjectURL(blob);

        try{
          return await loadObjectImage(url);
        }catch(e){
          console.warn('정확한 배경 블러 생성에 실패해 기존 렌더링을 사용해요.',e);
          return null;
        }finally{
          URL.revokeObjectURL(url);
        }
      }

    
      async function captureState(opts={}){
        const root=$('#capture'),
              rootRect=root.getBoundingClientRect(),
              glassValue=num('glassOpacity',34),
              queue=[];

        for(let i=1;i<=3;i++){
          const row=$(`#queueItem${i}`),
                titleEl=$(`#queueTitleOut${i}`),
                artistEl=$(`#queueArtistOut${i}`),
                indexEl=row?.querySelector('.queue-index');

          if(!row || !visible(row))continue;

          queue.push({
            title:(titleEl?.textContent||'Untitled').trim()||'Untitled',
            artist:(artistEl?.textContent||'Unknown').trim()||'Unknown',
            index:(indexEl?.textContent||String(i+1).padStart(2,'0')).trim(),
            rect:localRect(row,rootRect),
            titleRect:localRect(titleEl,rootRect),
            artistRect:localRect(artistEl,rootRect),
            indexRect:localRect(indexEl,rootRect)
          });
        }
        const [bg,main,cover,post]=await Promise.all([loadImage(window.__pairBgSrc||''),loadImage($('#mainImage')?.src||''),loadImage($('#coverImage')?.src||''),loadImage($('#postImage')?.src||'')]);
        const bubbleStarts=typeof window.__pairBubbleState==='function'?window.__pairBubbleState():[];
        const bubbleImages=await Promise.all(bubbleStarts.map(b=>loadImage(b.canvas.toDataURL('image/png'))));
        const renderedBubbles=bubbleStarts.map((b,i)=>({id:b.id,start:b.start,image:bubbleImages[i],rect:localRect(b.el,rootRect)}));
        const dur=num('duration',5),f=dur/5;
        const ddayEl=$('#ddayWidget'),
              stateH=opts.height||Math.round(rootRect.height),
              bgZoom=num('bgZoom',1),
              bgBlur=num('bgBlur',0),
              bgX=num('bgX'),
              bgY=num('bgY'),
              bgPrepared=bg
                ? await prepareFilteredBackground(
                    bg,
                    540,
                    stateH,
                    bgZoom,
                    bgX,
                    bgY,
                    bgBlur
                  )
                : null;

        const ddayStart=2.12*f,
              ddayDelay=.38*f,
              startDays=Math.min(10,Math.max(1,num('ddayStartDays',5))),
              stepDur=num('ddayFlipSpeed',.13),
              ddayTarget=Number(ddayEl?.dataset.abs||0),
              ddaySteps=ddayEl?.dataset.animate==='1'
                ? Math.min(startDays,ddayTarget)
                : 0,
              ddaySequenceEnd=ddaySteps>0
                ? ddayStart+ddayDelay+(ddaySteps+1)*stepDur
                : ddayStart+ddayDelay,
              postStart=Math.max(3.05*f,ddaySequenceEnd+.14);

        return {
          w:540,h:stateH,scene:sceneGeometry(),duration:dur,effect:val('animEffect')||'pop',glassAlpha:clamp(.10+glassValue/100*.34,.12,.34),
          timeline:{searchStart:.42*f,musicStart:1.22*f,ddayStart,postStart},
          rects:{phone:localRect($('#phone'),rootRect),screen:localRect($('.screen'),rootRect),search:localRect($('#searchWidget'),rootRect),dday:localRect(ddayEl,rootRect),ddayLabel:localRect($('#ddayLabelOut'),rootRect),ddayCount:localRect($('#ddayCount'),rootRect),ddayDate:localRect($('#ddayDateOut'),rootRect),music:stableMusicRect(rootRect,queue.length),
          cover:localRect($('.cover'),rootRect),
          musicSong:localRect($('#songOut'),rootRect),
          musicArtist:localRect($('#artistOut'),rootRect),
          musicBar:localRect($('.music .bar'),rootRect),
          musicEq:localRect($('.music .eq'),rootRect),
          musicPlay:localRect($('.music .play'),rootRect),
          musicCurrent:localRect($('#currentTimeOut'),rootRect),
          musicDuration:localRect($('#durationTimeOut'),rootRect),
          musicPlaylist:localRect($('#playlistOut'),rootRect),
          post:localRect($('#postWidget'),rootRect),postImage:localRect($('.post-image'),rootRect),postTitle:localRect($('.post-title'),rootRect)},
          images:{bg,bgPrepared,main,cover,post},queue,bubbles:renderedBubbles,postVisible:$('#postVisible').checked,searchVisible:$('#searchVisible').checked,musicVisible:$('#musicVisible').checked,ddayVisible:$('#ddayVisible').checked,
          controls:{bgZoom,bgBlur,bgX,bgY,mainZoom:num('zoom',1),mainX:num('posX'),mainY:num('posY'),coverZoom:num('coverZoom',1),coverX:num('coverX'),coverY:num('coverY'),postZoom:num('postZoom',1),postX:num('postX'),postY:num('postY'),progress:num('progress',42),typingSpeed:num('typingSpeed',18),postTypingSpeed:num('postTypingSpeed',16),ddayFlipSpeed:num('ddayFlipSpeed',.13),ddayStartDays:num('ddayStartDays',5)},
          text:{search:val('searchTextInput')||txt('#searchTextOut'),ddayLabel:txt('#ddayLabelOut'),ddayCount:ddayEl?.dataset.finalText||txt('#ddayCount'),ddayDate:visible($('#ddayDateOut'))?txt('#ddayDateOut'):'',song:txt('#songOut'),artist:txt('#artistOut'),current:txt('#currentTimeOut'),duration:txt('#durationTimeOut'),postTitle:val('postCaption')||txt('#postCaptionOut'),commission:(($('#commissionText')?.value||$('#commissionCredit')?.textContent||'').trim())},
          dday:{animate:ddayEl?.dataset.animate==='1',value:Number(ddayEl?.dataset.abs||0),prefix:ddayEl?.dataset.prefix||'D+',bottomPadding:parseFloat(getComputedStyle(ddayEl).paddingBottom)||15}
        };
      }
    
      function motionProgress(s,t,name){
        const f=s.duration/5;
        const starts={
          search:s.timeline.searchStart,
          music:s.timeline.musicStart,
          dday:s.timeline.ddayStart,
          post:s.timeline.postStart
        };
        const lens={search:.62*f,music:.72*f,dday:.66*f,post:.74*f};
        return clamp((t-starts[name])/Math.max(.001,lens[name]));
      }
      function motionTransform(effect,p){
        const q=easeOutCubic(p);
        if(effect==='snap') return {alpha:1,scale:1,dy:0};
        if(effect==='fade') return {alpha:q,scale:.985+.015*q,dy:0};
        if(effect==='slide') return {alpha:q,scale:1,dy:30*(1-q)};
        const overshoot=.15*Math.sin(Math.PI*clamp(p))*Math.exp(-1.35*p);
        return {alpha:clamp(p*1.8),scale:.70+.30*q+overshoot,dy:14*(1-q)};
      }
      function drawMotion(ctx,s,t,name,fn,final=false){
        if(final){fn(ctx,s,t,true);return;}
        const p=motionProgress(s,t,name);if(p<=0)return;
        const m=motionTransform(s.effect||'pop',p),r=s.rects[name],motionScale=name==='music'?1:m.scale;
        ctx.save();ctx.globalAlpha*=m.alpha;const cx=r.x+r.w/2,cy=r.y+r.h/2;ctx.translate(cx,cy+m.dy);ctx.scale(motionScale,motionScale);ctx.translate(-cx,-cy);fn(ctx,s,t,false);ctx.restore();
      }
      const renderCache=new WeakMap();
      function getRenderBuffers(state,scale){
        let scales=renderCache.get(state);
        if(!scales){scales=new Map();renderCache.set(state,scales);}
        const key=String(scale);
        let cached=scales.get(key);
        if(!cached){
          const width=Math.round(state.w*scale),height=Math.round(state.h*scale);
          const base=document.createElement('canvas');base.width=width;base.height=height;
          const baseCtx=base.getContext('2d');baseCtx.imageSmoothingEnabled=true;baseCtx.imageSmoothingQuality='high';baseCtx.setTransform(scale,0,0,scale,0,0);
          drawBackground(baseCtx,state);
          baseCtx.save();baseCtx.translate(state.scene?.x||0,state.scene?.y||0);baseCtx.scale(state.scene?.scale||1,state.scene?.scale||1);
          drawPhone(baseCtx,state);baseCtx.restore();
          const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
          const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
          cached={canvas,ctx,base,width,height};scales.set(key,cached);
        }
        return cached;
      }
      function render(state,t,{final=false,scale=1}={}){
        scale=Math.max(1,Number(scale)||1);
        const {canvas,ctx,base,width,height}=getRenderBuffers(state,scale);
        ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.clearRect(0,0,width,height);ctx.drawImage(base,0,0);ctx.setTransform(scale,0,0,scale,0,0);
        ctx.save();ctx.translate(state.scene?.x||0,state.scene?.y||0);ctx.scale(state.scene?.scale||1,state.scene?.scale||1);
        if(state.searchVisible)drawMotion(ctx,state,t,'search',drawSearch,final);
        if(state.musicVisible)drawMotion(ctx,state,t,'music',drawMusic,final);
        if(state.ddayVisible)drawMotion(ctx,state,t,'dday',drawDday,final);
        if(state.postVisible)drawMotion(ctx,state,t,'post',drawPost,final);
        for(const b of state.bubbles||[]){
          if(!b.image||!b.rect)continue;
          const r=b.rect,p=clamp((t-b.start)/Math.max(.001,.68*state.duration/5));
          if(!final&&p<=0)continue;
          const m=final?{alpha:1,scale:1,dy:0}:motionTransform(state.effect||'pop',p);
          ctx.save();ctx.globalAlpha*=m.alpha;
          const cx=r.x+r.w/2,cy=r.y+r.h/2;
          ctx.translate(cx,cy+m.dy);ctx.scale(m.scale,m.scale);ctx.translate(-cx,-cy);
          ctx.drawImage(b.image,r.x,r.y,r.w,r.h);ctx.restore();
        }
        ctx.restore();drawCommission(ctx,state);return canvas;
      }
      window.PairExportRenderer={version:'20261013-50',captureState,render};
  }


installEmbeddedExportRenderer();
})();

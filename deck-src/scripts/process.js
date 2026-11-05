/* Process template: nothing faded until a pin or attribute is clicked; pins sit on the element's corner; tooltip opens in the band above the screen */
(function(){
  document.querySelectorAll('.slide.wfs').forEach(sec=>{
    const st=sec.querySelector('.wf-stage'), sc=st.querySelector('.wf-scale'), hl=sc.querySelector('.wf-hl'), pins=sc.querySelector('.wf-pins');
    const band=sec.querySelector('.wf-band'), tb=st.querySelector('.wf-tip2'), arr=tb.querySelector('.arr'), cap=band.querySelector('.capt');
    const cfg=JSON.parse(st.dataset.cfg), mode=st.dataset.mode, list=sec.querySelector('.wf-attrs'), items=[...list.querySelectorAll('li')];
    const scr=[...sc.querySelectorAll('.wf-scr')], roles=[...sec.querySelectorAll('.wf-roles button')];
    const W=1000,H=700; let s=1, role=mode==='roles'?Object.keys(cfg)[0]:null, a=0, view=1;
    const C=()=>mode==='roles'?cfg[role]:cfg;
    const rel=el=>{const r=el.getBoundingClientRect(),b=sc.getBoundingClientRect();return{x:(r.left-b.left)/s,y:(r.top-b.top)/s,w:r.width/s,h:r.height/s};};
    function draw(){
      pins.innerHTML=''; hl.style.display='none'; tb.classList.remove('on');
      const on=scr.find(x=>x.classList.contains('on')); if(!on||!sc.getBoundingClientRect().width) return;
      const c=C(), used=[], bad='.nb,.nb2,.sug,.rec2,.learn,.inp,.s6,.evs,.tr,.rr,.opt,.scard,.sitem,.pr,.cc-tip,.ksum2,.klist2,.wf-me,.ln,.wt,.btn,.chp,.ic,.spk,img,h4,.pl,.ok,.ag,.dn,.cbx,.st,.tg,.m3,.dots,.num,.kpi,.ks,b,svg,circle,path,rect';
      const sb=sc.getBoundingClientRect(); pins.style.display='none';
      const clear=(x,y,el)=>{ for(const [dx,dy] of [[0,0],[-13,0],[13,0],[0,-13],[0,13],[-9,-9],[9,-9],[-9,9],[9,9]]){ const t=document.elementFromPoint(sb.left+(x+dx)*s,sb.top+(y+dy)*s); if(!t||!sc.contains(t)) return false; if(t.closest(bad)||el.contains(t)) return false; } return true; };
      const spots=[];
      Object.keys(c).forEach(n=>{
        const el=on.querySelector('#'+c[n].el); if(!el) return; const r=rel(el), pd=8;
        const cand=[[r.x-pd-17,r.y+16],[r.x+16,r.y-pd-17],[r.x+r.w+pd+17,r.y+16],[r.x+16,r.y+r.h+pd+17],[r.x-pd-17,r.y+r.h/2],[r.x+r.w+pd+17,r.y+r.h/2]];
        let pt=cand.find(([x,y])=>x>14&&x<W-14&&y>52&&y<H-14&&!used.some(u=>Math.hypot(u[0]-x,u[1]-y)<34)&&clear(x,y,el));
        if(!pt) pt=cand.find(([x,y])=>x>14&&x<W-14&&y>52&&y<H-14&&!used.some(u=>Math.hypot(u[0]-x,u[1]-y)<34))||cand[0];
        used.push(pt); spots.push([n,el,r,pt]);
      });
      pins.style.display='';
      spots.forEach(([n,el,r,pt])=>{ const pd=8;
        const p=document.createElement('b'); p.className='wf-pin'+(+n===a?' on':''); p.textContent=n; p.style.left=pt[0]+'px'; p.style.top=pt[1]+'px';
        p.addEventListener('click',e=>{e.stopPropagation(); select(+n===a?0:+n);});
        pins.appendChild(p);
        if(+n===a){
          Object.assign(hl.style,{display:'block',left:(r.x-pd)+'px',top:(r.y-pd)+'px',width:(r.w+2*pd)+'px',height:(r.h+2*pd)+'px'});
          tb.querySelector('b').textContent=c[n].t; tb.querySelector('p').textContent=c[n].b;
          tb.querySelector('em').textContent=(items[n-1].querySelector('.pp')||{textContent:''}).textContent;
          tb.classList.add('on'); tb.classList.remove('l','b','t');
          const tw=tb.offsetWidth, th=tb.offsetHeight, g=44*s+6, R=(r.x+r.w+pd)*s, Lx=(r.x-pd)*s, T=(r.y-pd)*s, B=(r.y+r.h+pd)*s, cy=(r.y+r.h/2)*s, cx=(r.x+r.w/2)*s, maxR=Math.min(W*s+260,window.innerWidth-st.getBoundingClientRect().left-72);
          let tx,ty;
          if(R+g+tw<=maxR){ tx=R+g; ty=Math.max(0,Math.min(H*s-th,cy-th/2)); arr.style.top=Math.max(14,Math.min(th-14,cy-ty))+'px'; arr.style.left=''; }
          else if(Lx-g-tw>=0){ tx=Lx-g-tw; ty=Math.max(0,Math.min(H*s-th,cy-th/2)); tb.classList.add('l'); arr.style.top=Math.max(14,Math.min(th-14,cy-ty))+'px'; arr.style.left=''; }
          else { tx=Math.max(0,Math.min(maxR-tw,cx-tw/2)); if(B+g+th<=H*s){ ty=B+g; tb.classList.add('b'); } else { ty=Math.max(0,T-g-th); tb.classList.add('t'); } arr.style.top=''; arr.style.left=Math.max(14,Math.min(tw-14,cx-tx))+'px'; }
          tb.style.left=tx+'px'; tb.style.top=ty+'px';
        }
      });
    }
    function screens(){
      if(mode==='roles'){ scr.forEach(x=>x.classList.toggle('on',x.dataset.role===role)); roles.forEach(b=>b.classList.toggle('on',b.dataset.role===role)); }
      else { if(a) view=a; scr.forEach(x=>x.classList.toggle('on',(' '+x.dataset.on+' ').includes(' '+view+' '))); }
    }
    function fill(){
      const c=C(); items.forEach((li,j)=>{ li.classList.toggle('on',j+1===a&&!!c[j+1]); li.classList.toggle('na',mode==='roles'&&!c[j+1]); });
      if(cap){ const d=mode==='roles'?null:cfg[view]; cap.textContent=d?d.s:''; }
    }
    function select(n){
      if(mode==='roles'&&n&&!C()[n]) return;
      a=n; screens(); fill(); requestAnimationFrame(draw);
    }
    function setRole(r){ role=r; a=0; screens(); fill(); requestAnimationFrame(draw); }
    roles.forEach(b=>b.addEventListener('click',e=>{e.stopPropagation(); setRole(b.dataset.role);}));
    items.forEach((li,j)=>li.addEventListener('click',e=>{e.stopPropagation(); select(a===j+1?0:j+1);}));
    sc.addEventListener('click',e=>{ if(a&&!e.target.closest('.wf-pin')){ e.stopPropagation(); select(0);} });
    function fit(){
      const inner=sec.querySelector('.slide-inner'); if(!inner||!inner.clientWidth) return;
      const col=inner.clientWidth-380-56-90, top=st.getBoundingClientRect().top||230;
      const maxH=Math.max(280,Math.min(window.innerHeight-300,window.innerHeight-top-112));
      s=Math.min(col/W,maxH/H,1.2); sc.style.transform='scale('+s+')';
      st.style.width=(W*s)+'px'; st.style.height=(H*s)+'px'; sec.style.setProperty('--stw',(W*s)+'px'); draw();
    }
    const SEQ=()=>{ const q=[]; Object.keys(cfg).forEach(r=>Object.keys(cfg[r]).sort((x,y)=>x-y).forEach(n=>q.push([r,+n]))); return q; };
    sec.__stepNext=()=>{
      if(!sec.classList.contains('active')) return false;
      if(mode==='roles'){ const q=SEQ();
        if(!a){ const k0=q.findIndex(([r])=>r===role); role=q[k0][0]; select(q[k0][1]); return true; }
        const k=q.findIndex(([r,n])=>r===role&&n===a); if(k<q.length-1){ const [r,n]=q[k+1]; if(r!==role){ role=r; a=0; screens(); } select(n); return true; } return false; }
      if(a<items.length){ select(a+1); return true; } return false;
    };
    sec.__stepPrev=()=>{
      if(!sec.classList.contains('active')||!a) return false;
      if(mode==='roles'){ const q=SEQ(), k=q.findIndex(([r,n])=>r===role&&n===a);
        if(k<=0){ select(0); return true; } const [r,n]=q[k-1]; if(r!==role){ role=r; a=0; screens(); } select(n); return true; }
      select(a-1); return true;
    };
    sec.__stepReset=()=>{ view=1; if(mode==='roles') setRole(Object.keys(cfg)[0]); else select(0); };
    new ResizeObserver(fit).observe(sec.querySelector('.slide-inner')); window.addEventListener('resize',fit);
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(fit);
    if(mode==='roles') band.style.display='none'; if(mode==='roles') setRole(role); else select(0); fit();
  });
})();

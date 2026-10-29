'use strict';
// A grid owns cols, rows, cell, open: Uint8Array, dist: Int32Array,
// mask: Uint8Array, and tone: Uint8Array. Intro, drain and paths derive from BFS distance.
window.Pixels = (() => {
  const palette = ['#0024cc', '#8a9bff', '#f7f3e9'];
  const hash = text => { let n=2166136261; for(const c of text) n=Math.imul(n^c.charCodeAt(0),16777619); return n>>>0; };
  function random(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
  const glyph = ['0001000','0101010','0011100','1111111','0011100','0101010','0001000'];
  function neighbors(grid,i,visit){const x=i%grid.cols,y=Math.floor(i/grid.cols);if(x)visit(i-1);if(x<grid.cols-1)visit(i+1);if(y)visit(i-grid.cols);if(y<grid.rows-1)visit(i+grid.cols);}
  function bfs(g,seed){
    g.seed=seed;g.dist.fill(-1);g.parent=new Int32Array(g.open.length).fill(-1);const q=new Int32Array(g.open.length);let head=0,tail=1;q[0]=seed;g.dist[seed]=0;g.maxDist=0;
    while(head<tail){const i=q[head++];neighbors(g,i,j=>{if(g.open[j]&&g.dist[j]<0){g.dist[j]=g.dist[i]+1;g.parent[j]=i;g.maxDist=Math.max(g.maxDist,g.dist[j]);q[tail++]=j;}});}
    g.order=q.slice(0,tail);for(let i=0;i<g.open.length;i++)g.tone[i]=Math.min(3,Math.floor(g.dist[i]/Math.max(1,g.maxDist)*4));
  }
  function nearest(g,x,y){let best=0,score=Infinity;for(let i=0;i<g.open.length;i++){if(!g.open[i]||g.mask[i])continue;const d=(i%g.cols-x)**2+(Math.floor(i/g.cols)-y)**2;if(d<score){score=d;best=i;}}return best;}
  function grid(width,height,seed=1,cell=20,rects=[]){
    const cols=Math.ceil(width/cell),rows=Math.ceil(height/cell),n=cols*rows;
    const g={cols,rows,cell,open:new Uint8Array(n),dist:new Int32Array(n),tone:new Uint8Array(n),mask:new Uint8Array(n),width,height};
    const rand=random(seed),scale=4,nc=Math.ceil(cols/scale)+2,nr=Math.ceil(rows/scale)+2,noise=Array.from({length:nc*nr},rand),values=[];
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){let fx=x/scale,fy=y/scale,ix=Math.floor(fx),iy=Math.floor(fy);fx-=ix;fy-=iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);const a=noise[iy*nc+ix]*(1-fx)+noise[iy*nc+ix+1]*fx,b=noise[(iy+1)*nc+ix]*(1-fx)+noise[(iy+1)*nc+ix+1]*fx;values.push(a*(1-fy)+b*fy);}
    const threshold=[...values].sort((a,b)=>a-b)[Math.floor(n*.36)];values.forEach((v,i)=>g.open[i]=v>threshold?1:0);
    for(let pass=0;pass<2;pass++){const next=g.open.slice();for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){let count=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)count+=g.open[(y+dy)*cols+x+dx];next[y*cols+x]=count>=5?1:0;}g.open=next;}
    for(const r of rects)for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      if((x+1)*cell>r.left-cell&&x*cell<r.right+cell&&(y+1)*cell>r.top-cell&&y*cell<r.bottom+cell)g.mask[y*cols+x]=1;
    }
    const center=nearest(g,cols*.52,rows*.53);bfs(g,center);
    // Join isolated rooms with narrow corridors so every floor cell participates.
    let room;while((room=g.open.findIndex((v,i)=>v&&g.dist[i]<0))>=0){let closest=center,best=Infinity;for(const i of g.order){const d=Math.abs(i%cols-room%cols)+Math.abs(Math.floor(i/cols)-Math.floor(room/cols));if(d<best){best=d;closest=i;}}let x=room%cols,y=Math.floor(room/cols),tx=closest%cols,ty=Math.floor(closest/cols);while(x!==tx){g.open[y*cols+x]=1;x+=Math.sign(tx-x);}while(y!==ty){g.open[y*cols+x]=1;y+=Math.sign(ty-y);}g.open[y*cols+x]=1;bfs(g,center);}
    return g;
  }
  function size(canvas,width,height){const dpr=Math.min(window.devicePixelRatio||1,3);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;return ctx;}
  function patterns(ctx){return [[palette[0],palette[1]],[palette[1],palette[2]]].map(([a,b])=>{const c=document.createElement('canvas');c.width=c.height=4;const p=c.getContext('2d');p.fillStyle=a;p.fillRect(0,0,4,4);p.fillStyle=b;p.fillRect(0,0,2,2);p.fillRect(2,2,2,2);return ctx.createPattern(c,'repeat');});}
  function draw(ctx,g,progress=1,time=0,path=[],ripple=-1,background=true,excluded=null){
    if(background){ctx.fillStyle=palette[2];ctx.fillRect(0,0,g.width,g.height);}else ctx.clearRect(0,0,g.width,g.height);
    if(!g.patterns)g.patterns=patterns(ctx);const tones=[palette[0],g.patterns[0],palette[1],g.patterns[1]],cut=progress*(g.maxDist+1),tick=Math.floor(time/170);
    for(const i of g.order){if(progress<=0||g.dist[i]>cut||g.mask[i]||excluded?.has(i))continue;let tone=g.tone[i];if(time&&hash(String(i+Math.floor(tick/4)))%419===0)tone=(tone+1)%4;if(ripple>=0&&Math.abs(g.dist[i]-ripple*g.maxDist)<3)tone=(tone+1)%4;ctx.fillStyle=tones[tone];ctx.fillRect(i%g.cols*g.cell,Math.floor(i/g.cols)*g.cell,g.cell,g.cell);}
    if(path.length){ctx.fillStyle='#e0b81f';for(const i of path)if(progress>0&&g.dist[i]<=cut&&!g.mask[i]&&!excluded?.has(i))ctx.fillRect(i%g.cols*g.cell+5,Math.floor(i/g.cols)*g.cell+5,g.cell-10,g.cell-10);}
  }
  function path(g,target){const p=[];let i=target;while(i>=0){p.push(i);i=g.parent[i];}return p;}
  function sigil(slug,star=false){let cells='';const rand=random(hash(slug));if(star){glyph.forEach((row,y)=>[...row].forEach((c,x)=>{if(c==='1')cells+=`<rect x="${x}" y="${y}" width="1" height="1"/>`;}));}else{for(let y=0;y<8;y++)for(let x=0;x<4;x++)if(rand()>.46)cells+=`<rect x="${x}" y="${y}" width="1" height="1"/><rect x="${7-x}" y="${y}" width="1" height="1"/>`;}
    return `<svg class="pixel-sigil" viewBox="0 0 ${star?7:8} ${star?7:8}" aria-hidden="true" fill="currentColor" shape-rendering="crispEdges">${cells}</svg>`;
  }
  return {hash,random,glyph,grid,bfs,nearest,size,draw,path,sigil,neighbors,patterns};
})();

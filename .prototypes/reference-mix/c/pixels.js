/* Original hand-drawn alphabet on a shared baseline; up to 5 × 9 cells. Each string is one row, 1 is ink.
   layoutCells(text, box) -> { x, y, glyphIndex } cells measured over real HTML.
   Every glyph carries t: 0 = bitmap, 1 = selectable type. */
const FONT = {
 A:['00100','01010','10001','10001','11111','10001','10001'],
 B:['11110','10001','10001','11110','10001','10001','11110'],
 C:['01111','10000','10000','10000','10000','10000','01111'],
 D:['11100','10010','10001','10001','10001','10010','11100'],
 E:['11111','10000','10000','11110','10000','10000','11111'],
 F:['11111','10000','10000','11110','10000','10000','10000'],
 G:['01110','10001','10000','10111','10001','10001','01110'],
 H:['10001','10001','10001','11111','10001','10001','10001'],
 I:['11111','00100','00100','00100','00100','00100','11111'],
 J:['00111','00010','00010','00010','10010','10010','01100'],
 K:['10001','10010','10100','11000','10100','10010','10001'],
 L:['10000','10000','10000','10000','10000','10000','11111'],
 M:['10001','11011','10101','10101','10001','10001','10001'],
 N:['10001','11001','11001','10101','10011','10011','10001'],
 O:['01110','10001','10001','10001','10001','10001','01110'],
 P:['11110','10001','10001','11110','10000','10000','10000'],
 Q:['01110','10001','10001','10001','10101','10010','01101'],
 R:['11110','10001','10001','11110','10100','10010','10001'],
 S:['01111','10000','10000','01110','00001','00001','11110'],
 T:['11111','00100','00100','00100','00100','00100','00100'],
 U:['10001','10001','10001','10001','10001','10001','01110'],
 V:['10001','10001','10001','10001','01010','01010','00100'],
 W:['10001','10001','10001','10101','10101','11011','10001'],
 X:['10001','01010','01010','00100','01010','01010','10001'],
 Y:['10001','10001','01010','00100','00100','00100','00100'],
 Z:['11111','00001','00010','00100','01000','10000','11111'],
 a:['00000','00000','01110','00001','01111','10001','01111'],
 b:['10000','10000','10110','11001','10001','10001','11110'],
 c:['00000','00000','01111','10000','10000','10000','01111'],
 d:['00001','00001','01101','10011','10001','10001','01111'],
 e:['00000','00000','01110','10001','11111','10000','01111'],
 f:['00110','01001','01000','11100','01000','01000','01000'],
 g:['00000','01111','10001','10001','01111','00001','01110'],
 h:['10000','10000','10110','11001','10001','10001','10001'],
 i:['00100','00000','01100','00100','00100','00100','01110'],
 j:['00010','00000','00110','00010','00010','10010','01100'],
 k:['10000','10000','10010','10100','11000','10100','10010'],
 l:['01100','00100','00100','00100','00100','00100','01110'],
 m:['00000','00000','11010','10101','10101','10101','10101'],
 n:['00000','00000','10110','11001','10001','10001','10001'],
 o:['00000','00000','01110','10001','10001','10001','01110'],
 p:['00000','11110','10001','10001','11110','10000','10000'],
 q:['00000','01111','10001','10001','01111','00001','00001'],
 r:['00000','00000','10110','11001','10000','10000','10000'],
 s:['00000','00000','01111','10000','01110','00001','11110'],
 t:['01000','01000','11110','01000','01000','01001','00110'],
 u:['00000','00000','10001','10001','10001','10011','01101'],
 v:['00000','00000','10001','10001','10001','01010','00100'],
 w:['00000','00000','10001','10001','10101','10101','01010'],
 x:['00000','00000','10001','01010','00100','01010','10001'],
 y:['00000','10001','10001','10001','01111','00001','01110'],
 z:['00000','00000','11111','00010','00100','01000','11111'],
 '0':['01110','10001','10011','10101','11001','10001','01110'],
 '1':['00100','01100','00100','00100','00100','00100','01110'],
 '2':['01110','10001','00001','00010','00100','01000','11111'],
 '3':['11110','00001','00001','01110','00001','00001','11110'],
 '4':['00010','00110','01010','10010','11111','00010','00010'],
 '5':['11111','10000','10000','11110','00001','00001','11110'],
 '6':['01110','10000','10000','11110','10001','10001','01110'],
 '7':['11111','00001','00010','00100','01000','01000','01000'],
 '8':['01110','10001','10001','01110','10001','10001','01110'],
 '9':['01110','10001','10001','01111','00001','00001','01110'],
 '.':['00000','00000','00000','00000','00000','00110','00110'],
 ',':['00000','00000','00000','00000','00110','00100','01000'],
 "'":['00100','00100','01000','00000','00000','00000','00000'],
 '!':['00100','00100','00100','00100','00100','00000','00100'],
 '?':['01110','10001','00001','00010','00100','00000','00100'],
 ':':['00000','00110','00110','00000','00110','00110','00000'],
 '-':['00000','00000','00000','11111','00000','00000','00000'],
 '✳':['00100','10101','01110','11111','01110','10101','00100'],
 ' ':['00000','00000','00000','00000','00000','00000','00000']
};
// Seven rows above the baseline, two for descenders; narrow letters keep their width.
Object.assign(FONT, {
 I:['1','1','1','1','1','1','1'], i:['1','0','1','1','1','1','1'],
 l:['1','1','1','1','1','1','1'], '.':['0','0','0','0','0','0','1'],
 "'":['1','1','0','0','0','0','0'], '!':['1','1','1','1','1','0','1'],
 ':':['0','0','1','0','0','1','0'],
 t:['010','010','111','010','010','010','011'],
 f:['011','010','111','010','010','010','010'],
 r:['000','000','101','110','100','100','100'],
 j:['001','000','001','001','001','001','001','001','110'],
 g:['00000','00000','01111','10001','10001','10001','01111','00001','01110'],
 p:['00000','00000','11110','10001','10001','10001','11110','10000','10000'],
 q:['00000','00000','01111','10001','10001','10001','01111','00001','00001'],
 y:['00000','00000','10001','10001','10001','10001','01111','00001','01110'],
 ',':['00','00','00','00','00','01','01','10','00']
});
for(const [char,rows] of Object.entries(FONT)) {
  while(rows.length<9)rows.push('0'.repeat(rows[0].length));
  const used=[...rows[0]].map((_,x)=>rows.some(row=>row[x]==='1'));
  const left=used.indexOf(true),right=used.lastIndexOf(true);
  FONT[char]=left<0?rows.map(()=>'0'):rows.map(row=>row.slice(left,right+1));
}
const PIXEL_UNIT=2;
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
function layoutCells(text, box) {
  const bounds=box.getBoundingClientRect(),style=getComputedStyle(box);
  const ctx=document.createElement('canvas').getContext('2d');
  ctx.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const metrics=ctx.measureText('H'),size=metrics.actualBoundingBoxAscent/7,cells=[];
  box.querySelectorAll('.glyph').forEach((span,glyphIndex)=>{
    const range=document.createRange();range.selectNodeContents(span);
    const rect=range.getBoundingClientRect(),bitmap=FONT[span.textContent]||FONT['?'];
    const m=ctx.measureText(span.textContent);
    const baseline=rect.top-bounds.top+metrics.fontBoundingBoxAscent;
    const cx=rect.left-bounds.left+(m.actualBoundingBoxRight-m.actualBoundingBoxLeft)/2;
    const top=baseline-7*size,left=cx-bitmap[0].length*size/2,cy=baseline-2.5*size;
    bitmap.forEach((row,y)=>[...row].forEach((bit,x)=>{
      if(bit==='1')cells.push({x:left+x*size,y:top+y*size,glyphIndex,size,cx,cy,baseline,row:y});
    }));
  });
  return cells;
}
class Typeset {
  constructor(element,{hero=false,manual=false}={}) {
    if(!element.hasAttribute('aria-label'))element.setAttribute('aria-label',element.textContent);
    this.element=element;this.original=element.innerHTML;this.hero=hero;this.manual=manual;
    this.active=false;this.visible=false;this.played=false;this.departed=false;this.raf=0;
    this.canvas=document.createElement('canvas');this.canvas.className='pixel-canvas';this.canvas.setAttribute('aria-hidden','true');this.ctx=this.canvas.getContext('2d');
    this.split();this.resize();
    if(motionQuery.matches)this.finish();else {this.glyphs.forEach(g=>{g.t=0;g.el.style.opacity=0;});this.draw();}
    document.documentElement.classList.remove('pixel-pending');
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(element);
    this.observer=new IntersectionObserver(entries=>{
      const entry=entries[0];this.visible=entry.isIntersecting;
      if(this.played&&entry.boundingClientRect.bottom<0)this.departed=true;
      if(!this.visible)cancelAnimationFrame(this.raf);
      else if(!motionQuery.matches){
        if(!this.played&&!this.manual)this.play();
        else if(this.hero&&this.departed&&entry.intersectionRatio>=.6){this.departed=false;this.play(true);}
        else if(this.active)this.tick();
      }
    },{threshold:[0,.6],rootMargin:hero||manual?'0px':'0px 0px -15% 0px'});
    this.observer.observe(element);
    this.visibility=()=>{cancelAnimationFrame(this.raf);if(!document.hidden&&this.visible&&this.active)this.tick();};
    document.addEventListener('visibilitychange',this.visibility);
    this.motion=()=>{if(motionQuery.matches)this.finish();};motionQuery.addEventListener('change',this.motion);
  }
  split(){
    if(this.element.querySelector('.glyph'))return;
    this.element.classList.remove('typeset-done');
    this.element.innerHTML=this.original;
    const walker=document.createTreeWalker(this.element,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.filter(n=>!n.parentElement.closest('.pixel-mark')).forEach(node=>{
      const fragment=document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(word=>{
        if(/^\s+$/.test(word)){fragment.append(document.createTextNode(word));return;}
        const holder=node.parentElement.classList.contains('word')?fragment:document.createElement('span');
        if(holder!==fragment)holder.className='word';
        [...word].forEach(char=>{const span=document.createElement('span');span.className='glyph';span.textContent=char;holder.append(span);});
        if(holder!==fragment)fragment.append(holder);
      });node.replaceWith(fragment);
    });
    this.glyphs=[...this.element.querySelectorAll('.glyph')].map(el=>({el,t:0}));
    this.element.append(this.canvas);
  }
  resize(){
    if(!this.canvas.isConnected)return;
    const rect=this.element.getBoundingClientRect(),dpr=devicePixelRatio||1;
    this.canvas.width=Math.ceil(rect.width*dpr);this.canvas.height=Math.ceil(rect.height*dpr);
    this.canvas.style.width=rect.width+'px';this.canvas.style.height=rect.height+'px';
    this.ctx.setTransform(dpr,0,0,dpr,0,0);this.cells=layoutCells(this.element.textContent,this.element);this.draw();
  }
  play(reverse=false){
    if(motionQuery.matches)return this.finish();
    cancelAnimationFrame(this.raf);this.split();this.resize();this.played=true;this.active=true;
    this.element.classList.add('typeset-playing');this.start=performance.now();this.reverse=reverse;
    this.duration=this.hero?440:280;this.stagger=this.hero?35:Math.min(14,200/Math.max(1,this.glyphs.length));
    this.glyphs.forEach(g=>{g.t=reverse?1:0;g.el.style.opacity=g.t;});this.draw();this.tick();
  }
  tick(){
    cancelAnimationFrame(this.raf);
    if(!this.active||!this.visible||document.hidden)return;
    const elapsed=performance.now()-this.start,lead=this.hero?400:120;let done=true;
    this.glyphs.forEach((g,i)=>{
      let local;
      if(this.reverse&&elapsed<250){local=1-elapsed/250;done=false;}
      else {local=Math.max(0,Math.min(1,(elapsed-(this.reverse?250:0)-lead-i*this.stagger)/this.duration));if(local<1)done=false;}
      g.t=local<.5?2*local*local:1-Math.pow(-2*local+2,2)/2;
      const opacity=Math.max(0,Math.min(1,(local-.45)/.55));
      g.el.style.opacity=opacity;g.el.style.filter=opacity===1?'none':`blur(${(1-opacity)*4}px)`;
    });
    this.draw();if(done)this.finish();else this.raf=requestAnimationFrame(()=>this.tick());
  }
  draw(){
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);this.ctx.fillStyle=getComputedStyle(this.element).color;
    for(const c of this.cells||[]){const t=this.glyphs[c.glyphIndex].t;if(t>=1)continue;
      this.ctx.globalAlpha=1-t;const shrink=1-t;
      this.ctx.fillRect(c.cx+(c.x-c.cx)*shrink,c.cy+(c.y-c.cy)*shrink,c.size*.87*shrink,c.size*.87*shrink);
    }this.ctx.globalAlpha=1;
  }
  finish(){
    cancelAnimationFrame(this.raf);this.active=false;this.played=true;
    this.element.innerHTML=this.original;this.element.classList.remove('typeset-playing');this.element.classList.add('typeset-done');
  }
  destroy(){cancelAnimationFrame(this.raf);this.resizeObserver.disconnect();this.observer.disconnect();document.removeEventListener('visibilitychange',this.visibility);motionQuery.removeEventListener('change',this.motion);}
}

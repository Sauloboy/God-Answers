(function(g){
 'use strict';
 const counts=new Map(g.SELAH_BIBLE.chapters.map(r=>[r[0]+'_'+r[1],r[3]]));
 function valid(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const {b,c,v}=value,progress=value.progress??0;
  if(![b,c,v].every(Number.isInteger)||!counts.has(b+'_'+c)||v<1||v>counts.get(b+'_'+c)||!Number.isFinite(progress)||progress<0||progress>1)return null;
  return {b,c,v,progress,atTop:value.atTop===true};
 }
 function capture(doc,win){
  const reader=doc.querySelector('.reader-verses');if(!reader)return null;
  const rows=[...reader.querySelectorAll(':scope>p')];if(!rows.length)return null;
  const row=rows.find(x=>x.getBoundingClientRect().bottom>16)||rows[rows.length-1],rect=row.getBoundingClientRect(),atTop=win.scrollY<4;
  return valid({b:+reader.dataset.book,c:+reader.dataset.chapter,v:+row.id.replace('verse-',''),progress:atTop?0:Math.round(Math.min(.99,Math.max(0,(16-rect.top)/Math.max(1,rect.height)))*1000)/1000,atTop});
 }
 function restore(value,doc,win){
  const position=valid(value),reader=doc.querySelector('.reader-verses');if(!position||!reader||+reader.dataset.book!==position.b||+reader.dataset.chapter!==position.c)return false;
  if(position.atTop){win.scrollTo(0,0);return true;}
  const verse=doc.getElementById('verse-'+position.v);if(!verse)return false;const rect=verse.getBoundingClientRect();
  win.scrollTo(0,Math.max(0,win.scrollY+rect.top-16+position.progress*rect.height));return true;
 }
 g.GodReadingPosition={valid,capture,restore};
})(window);

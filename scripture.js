(function(g){
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // The bundled OTB text uses Markdown markers for poetic lines and quotations.
 // Keep the source and search indexes intact; interpret those markers on display.
 function lines(text){return String(text??'').split(/(?:^|\s+)>\s+/).filter(s=>s.trim()).map(s=>s.trim());}
 function plain(text,separator='\n'){return /(?:^|\s+)>\s+/.test(String(text))?lines(text).join(separator):String(text??'');}
 function html(text,context={}){
  const format=s=>g.GodGlossary?g.GodGlossary.html(s,context):esc(s);
  if(!/(?:^|\s+)>\s+/.test(String(text)))return format(String(text??''));
  return '<span class="scripture-lines">'+lines(text).map(line=>'<span class="scripture-line">'+format(line)+'</span>').join('<br>\n')+'</span>';
 }
 g.GodScripture={html,plain};
})(window);

(function(global){
  "use strict";
  function baseName(name){return String(name||"").replace(/\.(csv|pdf)$/i,"").toLocaleLowerCase("de-DE");}
  function reportKey(item){
    const rows=global.parseCsvRows?.(item.content)||[],first=rows[0]||{};
    return [first.date||"",item.sessionType||first.sessionType||"",item.topic||first.topic||"",baseName(item.fileName)].join("|");
  }
  function counts(rows){return {presentCount:rows.filter(r=>r.status==="Anwesend").length,excusedCount:rows.filter(r=>r.status==="Entschuldigt").length,missingCount:rows.filter(r=>r.status==="Fehlt").length};}
  function itemFromCsv(file,content){
    const rows=global.parseCsvRows?.(content)||[];
    if(!rows.length)throw new Error(`${file.name}: keine lesbaren Berichtsdaten`);
    const first=rows[0];
    return {id:global.makeId(),fileName:file.name,content,sessionType:first.sessionType||"Probe",topic:first.topic||"",createdAt:new Date(file.lastModified||Date.now()).toISOString(),...counts(rows)};
  }
  async function importHistoryFiles(files){
    const list=[...files],csvFiles=list.filter(f=>/\.csv$/i.test(f.name)),pdfFiles=list.filter(f=>/\.pdf$/i.test(f.name));
    if(!csvFiles.length&&!pdfFiles.length)throw new Error("Keine CSV- oder PDF-Dateien ausgewählt.");
    const existing=new Map((global.csvArchive||[]).map(item=>[reportKey(item),item]));
    const byBase=new Map((global.csvArchive||[]).map(item=>[baseName(item.fileName),item]));
    let added=0,skipped=0,pdfs=0,orphans=0;
    for(const file of csvFiles){
      const item=itemFromCsv(file,await file.text()),key=reportKey(item);
      if(existing.has(key)){skipped++;byBase.set(baseName(file.name),existing.get(key));continue;}
      global.csvArchive.push(item);existing.set(key,item);byBase.set(baseName(file.name),item);added++;
    }
    for(const file of pdfFiles){
      const item=byBase.get(baseName(file.name));
      if(!item){orphans++;continue;}
      await global.saveImportedReportPdf?.(item.id,file);
      item.pdfFileName=file.name;item.hasImportedPdf=true;pdfs++;
    }
    global.csvArchive.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
    global.saveArchive();global.renderHistory?.();global.renderStatistics?.();
    const parts=[`${added} neue CSV`,`${pdfs} PDF zugeordnet`];
    if(skipped)parts.push(`${skipped} CSV bereits vorhanden`);if(orphans)parts.push(`${orphans} PDF ohne passende CSV`);
    global.showToast?.(parts.join(" · "));
    return {added,skipped,pdfs,orphans};
  }
  function bind(){
    const button=global.byId?.("importHistoryReportsButton"),input=global.byId?.("historyReportsFileInput");
    if(!button||!input||button.dataset.bound)return;
    button.dataset.bound="true";button.addEventListener("click",()=>input.click());
    input.addEventListener("change",async()=>{try{if(input.files?.length)await importHistoryFiles(input.files);}catch(error){console.error(error);global.showToast?.(error.message||"Berichte konnten nicht eingelesen werden.","error");}finally{input.value="";}});
  }
  global.FFWReportImport=Object.freeze({baseName,itemFromCsv,importHistoryFiles,bind});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind,{once:true});else bind();
})(window);

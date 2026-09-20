(function(global){
  "use strict";
  let pendingCloseAction=null;
  let bypassClosePrompt=false;

  function reportKey(item){
    const rows=global.parseCsvRows?.(item.content)||[];
    const first=rows[0]||{};
    return [first.date||"",item.sessionType||first.sessionType||"",item.topic||first.topic||"",item.fileName||""].join("|");
  }
  function counts(rows){
    return {presentCount:rows.filter(row=>row.status==="Anwesend").length,excusedCount:rows.filter(row=>row.status==="Entschuldigt").length,missingCount:rows.filter(row=>row.status==="Fehlt").length};
  }
  function itemFromCsv(file,content){
    const rows=global.parseCsvRows?.(content)||[];
    if(!rows.length)throw new Error("Keine lesbaren Berichtsdaten");
    const first=rows[0];
    return {id:global.makeId(),fileName:file.name,content,sessionType:first.sessionType||"Probe",topic:first.topic||"",createdAt:new Date(file.lastModified||Date.now()).toISOString(),...counts(rows)};
  }
  async function importReportCsvFiles(files){
    const candidates=[];
    for(const file of [...files])candidates.push(itemFromCsv(file,await file.text()));
    const existing=new Set((global.csvArchive||[]).map(reportKey));
    const added=candidates.filter(item=>!existing.has(reportKey(item)));
    if(added.length){
      global.csvArchive=[...added,...(global.csvArchive||[])].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
      global.saveArchive();global.renderArchive?.();
      global.showToast?.(`${added.length} Berichts-CSV wurden eingelesen.`);
    }else global.showToast?.("Keine neuen Berichts-CSV gefunden.");
    return added.length;
  }
  function performCloseAction(action){
    bypassClosePrompt=true;
    try{
      if(action==="tactics")global.finalizeProbeFromTactics?.();
      else global.requestCloseProbe?.();
    }finally{setTimeout(()=>{bypassClosePrompt=false;},0);}
  }
  function openPreCloseDialog(action){
    pendingCloseAction=action;
    global.byId?.("preCloseImportDialog")?.showModal();
  }
  function bind(){
    const button=global.byId?.("importReportCsvButton"),input=global.byId?.("reportCsvFileInput");
    const dialog=global.byId?.("preCloseImportDialog");
    if(!input)return;
    if(button&&!button.dataset.bound){button.dataset.bound="true";button.addEventListener("click",()=>input.click());}
    if(!input.dataset.bound){
      input.dataset.bound="true";
      input.addEventListener("change",async()=>{
        const closeAction=pendingCloseAction;
        try{if(input.files?.length)await importReportCsvFiles(input.files);}
        catch(error){console.error(error);global.showToast?.("Die ausgewählte CSV ist kein gültiger FFW-Bericht.","error");pendingCloseAction=null;input.value="";return;}
        input.value="";pendingCloseAction=null;
        if(closeAction)performCloseAction(closeAction);
      });
    }
    if(dialog&&!dialog.dataset.bound){
      dialog.dataset.bound="true";
      global.byId("cancelPreCloseImportButton").addEventListener("click",()=>{pendingCloseAction=null;dialog.close();});
      global.byId("skipPreCloseImportButton").addEventListener("click",()=>{const action=pendingCloseAction;pendingCloseAction=null;dialog.close();if(action)performCloseAction(action);});
      global.byId("selectPreCloseImportButton").addEventListener("click",()=>{dialog.close();input.click();});
    }
    if(!document.documentElement.dataset.preCloseImportBound){
      document.documentElement.dataset.preCloseImportBound="true";
      document.addEventListener("click",event=>{
        if(bypassClosePrompt)return;
        const closeButton=event.target.closest("#homeStageFinishButton,#exportResetButton,#finalizeProbeButton");
        if(!closeButton)return;
        event.preventDefault();event.stopImmediatePropagation();
        openPreCloseDialog(closeButton.id==="finalizeProbeButton"?"tactics":"standard");
      },true);
    }
  }
  global.FFWReportCsvImport=Object.freeze({itemFromCsv,importReportCsvFiles,bind,openPreCloseDialog});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind,{once:true});else bind();
})(window);

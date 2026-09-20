(function(){
  "use strict";
  const get=id=>document.getElementById(id);
  function normalizedBase(name){return String(name||"").replace(/\.(csv|pdf)$/i,"").toLocaleLowerCase("de-DE");}
  function normalizedRows(content){return (parseCsvRows(content)||[]).map(row=>[row.date,row.time,row.name,row.sessionType,row.status,row.role,row.topic].map(v=>String(v||"").trim()).join("|")).join("\n");}
  function reportKey(item){const rows=parseCsvRows(item.content)||[],first=rows[0]||{};return [first.date||"",item.sessionType||first.sessionType||"",item.topic||first.topic||"",normalizedRows(item.content)].join("|");}
  function counts(rows){return {presentCount:rows.filter(r=>r.status==="Anwesend").length,excusedCount:rows.filter(r=>r.status==="Entschuldigt").length,missingCount:rows.filter(r=>r.status==="Fehlt").length};}
  function itemFromCsv(file,content){const rows=parseCsvRows(content)||[];if(!rows.length)throw new Error(`${file.name}: keine lesbaren Berichtsdaten`);const first=rows[0];return {id:makeId(),fileName:file.name,content,sessionType:first.sessionType||"Probe",topic:first.topic||"",createdAt:new Date(file.lastModified||Date.now()).toISOString(),...counts(rows)};}
  async function importHistoryFiles(files){
    const list=[...files],csvFiles=list.filter(f=>/\.csv$/i.test(f.name)),pdfFiles=list.filter(f=>/\.pdf$/i.test(f.name));
    if(!csvFiles.length&&!pdfFiles.length)throw new Error("In den Speicherorten wurden keine CSV- oder PDF-Berichte gefunden.");
    const existingByKey=new Map((csvArchive||[]).map(item=>[reportKey(item),item]));
    const byBase=new Map((csvArchive||[]).map(item=>[normalizedBase(item.fileName),item]));
    let added=0,skipped=0,pdfs=0,orphans=0,invalid=0;
    for(const file of csvFiles){try{const item=itemFromCsv(file,await file.text()),key=reportKey(item);if(existingByKey.has(key)){skipped++;byBase.set(normalizedBase(file.name),existingByKey.get(key));continue;}csvArchive.push(item);existingByKey.set(key,item);byBase.set(normalizedBase(file.name),item);added++;}catch(error){console.error(error);invalid++;}}
    for(const file of pdfFiles){const item=byBase.get(normalizedBase(file.name));if(!item){orphans++;continue;}await saveImportedReportPdf(item.id,file);item.pdfFileName=file.name;item.hasImportedPdf=true;pdfs++;}
    csvArchive.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));saveArchive();renderHistory();renderStatistics();
    const parts=[`${added} neue CSV`,`${skipped} Duplikate übersprungen`,`${pdfs} PDF zugeordnet`];if(invalid)parts.push(`${invalid} ungültige CSV`);if(orphans)parts.push(`${orphans} PDF ohne CSV`);showToast(parts.join(" · "));return {added,skipped,pdfs,orphans,invalid};
  }
  async function filesFromDirectory(handle){const files=[];for await(const entry of handle.values()){if(entry.kind==="file"&&/^.+\.(csv|pdf)$/i.test(entry.name))files.push(await entry.getFile());}return files;}
  async function ensureReadPermission(handle){if(!handle)return false;if(typeof handle.queryPermission!=="function")return true;if(await handle.queryPermission({mode:"read"})==="granted")return true;return typeof handle.requestPermission==="function"&&await handle.requestPermission({mode:"read"})==="granted";}
  async function filesFromConfiguredLocations(){
    const handles=[csvDirectoryHandle,pdfDirectoryHandle].filter(Boolean);const unique=[];
    for(const handle of handles)if(!unique.some(item=>item===handle))unique.push(handle);
    if(!unique.length)return {files:[],names:[]};
    const files=[],names=[];
    for(const handle of unique){if(!await ensureReadPermission(handle))continue;names.push(handle.name||"Speicherort");files.push(...await filesFromDirectory(handle));}
    return {files,names};
  }
  async function chooseFolder(){const handle=await window.showDirectoryPicker({id:"ffw-history-import",mode:"read"});return {files:await filesFromDirectory(handle),names:[handle.name||"Ausgewählter Ordner"]};}
  async function importConfiguredOrChoose(){let source=await filesFromConfiguredLocations();if(!source.files.length)source=await chooseFolder();const result=await importHistoryFiles(source.files);return {...result,names:source.names};}
  function updateHint(){const hint=get("historyImportHint"),button=get("importHistoryReportsButton");if(!hint||!button)return;const names=[csvDirectoryHandle?.name,pdfDirectoryHandle?.name].filter(Boolean);if(names.length){button.textContent="Alle Berichte aus den eingestellten Speicherorten einlesen";hint.textContent=`Verwendete Speicherorte: ${[...new Set(names)].join(" · ")}. CSV und PDF werden zusammengeführt; Duplikate werden übersprungen.`;}else{button.textContent=typeof window.showDirectoryPicker==="function"?"Berichtsordner auswählen und alle Dateien einlesen":"CSV- und PDF-Berichte auswählen";hint.textContent="Kein erreichbarer Speicherort ist hinterlegt. Beim Import wird deshalb ein Ordner beziehungsweise werden Dateien ausgewählt.";}}
  function bind(){const button=get("importHistoryReportsButton"),input=get("historyReportsFileInput");if(!button||!input||button.dataset.bound)return;button.dataset.bound="true";updateHint();button.addEventListener("click",async()=>{if(typeof window.showDirectoryPicker!=="function"&&!csvDirectoryHandle&&!pdfDirectoryHandle){input.click();return;}button.disabled=true;const label=button.textContent;button.textContent="Berichte werden eingelesen …";try{await importConfiguredOrChoose();}catch(error){if(error?.name!=="AbortError"){console.error(error);showToast(error.message||"Die Speicherorte konnten nicht eingelesen werden.","error");}}finally{button.disabled=false;button.textContent=label;updateHint();}});input.addEventListener("change",async()=>{try{if(input.files?.length)await importHistoryFiles(input.files);}catch(error){showToast(error.message||"Berichte konnten nicht eingelesen werden.","error");}finally{input.value="";}});}
  window.FFWReportImport=Object.freeze({itemFromCsv,importHistoryFiles,importConfiguredOrChoose,updateHint,bind});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind,{once:true});else bind();
})();

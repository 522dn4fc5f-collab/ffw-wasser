"use strict";
async function buildTerminPackage({baseName,csvName,csvContent,pdfName,pdfBlob,documentReport=null}){
  if(typeof JSZip!=="function")throw new Error("ZIP-Funktion ist nicht geladen");
  const zip=new JSZip();
  zip.file(csvName,csvContent);
  zip.file(pdfName,pdfBlob);
  if(documentReport?.pdf)zip.file(documentReport.pdfName||`${baseName}_Zusatzbericht.pdf`,documentReport.pdf);
  zip.file("paket-info.json",JSON.stringify({format:"FFW-Wasser-Terminpaket",version:"1.0",createdAt:new Date().toISOString(),files:Object.keys(zip.files)},null,2));
  return zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6},mimeType:"application/zip"});
}
async function saveTerminPackage(fileName,blob){
  const handle=effectiveCsvDirectoryHandle?.()||effectivePdfDirectoryHandle?.()||null;
  if(handle){try{if(!(await ensureDirectoryWritePermission(handle)))return "failed";const fh=await handle.getFileHandle(fileName,{create:true}),w=await fh.createWritable();await w.write(blob);await w.close();return "saved";}catch(error){console.error(error);return "failed";}}
  try{if(typeof File==="function"&&navigator.share&&navigator.canShare){const file=new File([blob],fileName,{type:"application/zip"});if(navigator.canShare({files:[file]})){await navigator.share({files:[file]});return "shared";}}}catch(error){if(error?.name==="AbortError")return "cancelled";}
  try{downloadBlob(fileName,blob);return "downloaded";}catch(error){return "failed";}
}
async function packageFilesFromZip(file){const zip=await JSZip.loadAsync(file),files=[];for(const entry of Object.values(zip.files)){if(entry.dir||!/\.(csv|pdf)$/i.test(entry.name))continue;const blob=await entry.async("blob"),name=entry.name.split("/").pop();files.push(new File([blob],name,{type:/\.csv$/i.test(name)?"text/csv":"application/pdf",lastModified:file.lastModified||Date.now()}));}return files;}

/* Probe-/Terminabschluss: nur ein ZIP-Paket nach außen speichern. */
closeDay=async function(topic=currentClosingTopic){
  topic=String(topic||"").trim();if(!topic){openProbeTopicDialog();return;}
  const current=[...todayEntries()];if(!current.length)return showToast("Es sind noch keine Anmeldungen vorhanden.","error");
  const organizers=current.filter(e=>e.status==="Anwesend"&&e.role==="Organisation").length,present=current.filter(e=>e.status==="Anwesend"&&e.role!=="Organisation").length,excused=current.filter(e=>e.status==="Entschuldigt").length;
  const recorded=new Set(current.flatMap(e=>[e.storedName,e.displayName].filter(Boolean))),missing=members.filter(m=>!m.ageDepartment&&!recorded.has(nameForStorage(m))&&!recorded.has(nameForTile(m))).length;
  if(!members.length)return showToast("Es gibt keine Mitglieder für den Export.","error");
  const exportType=current[0]?.sessionType||sessionType,entryByName=new Map(current.map(e=>[e.storedName||e.displayName,e]));
  const rows=members.map(member=>{const name=nameForStorage(member),entry=entryByName.get(name)||entryByName.get(nameForTile(member));if(!entry&&member.ageDepartment)return[today(),"",name,exportType,"Betrifft nicht",""];if(!entry)return[today(),"",name,exportType,"Fehlt",""];if(entry.status==="Entschuldigt")return[entry.date,entry.time,name,exportType,"Entschuldigt",""];if(entry.status==="Betrifft nicht")return[entry.date,entry.time,name,exportType,"Betrifft nicht",""];if(entry.role==="Organisation")return[entry.date,entry.time,name,exportType,"Anwesend","Organisation"];if(exportType==="Sonderprobe")return[entry.date,entry.time,name,exportType,"Anwesend","Anwesend"];if(exportType==="Unterricht")return[entry.date,entry.time,name,exportType,"Anwesend","Unterricht"];if(exportType==="Ausschuss Sitzung")return[entry.date,entry.time,name,exportType,"Anwesend","Ausschuss Sitzung"];return[entry.date,entry.time,name,exportType,"Anwesend",csvRoleForEntry(entry,member)];});
  const csv="\ufeff"+["Datum;Uhrzeit;Name;Terminart;Status;Funktion / Status;Thema",...rows.map(row=>[...row,topic].map(csvCell).join(";"))].join("\r\n"),safeType=exportType.replace(/ /g,"-"),base=`FFW-Wasser_${today()}_${safeType}`,csvName=`${base}.csv`,pdfName=`${base}.pdf`,pdfRows=rows.map(r=>({time:r[1],name:r[2],status:r[4],role:r[5]})),notApplicable=rows.filter(r=>r[4]==="Betrifft nicht").length,pdf=probePdfBlob(pdfRows,exportType,{present:present+organizers,excused,missing,notApplicable},topic);
  const zip=await buildTerminPackage({baseName:base,csvName,csvContent:csv,pdfName,pdfBlob:pdf,documentReport:typeof pendingDocumentReport!=="undefined"?pendingDocumentReport:null}),result=await saveTerminPackage(`${base}.zip`,zip);
  if(result==="failed"||result==="cancelled")return showToast("Das Terminpaket konnte nicht gespeichert werden. Die Tagesdaten bleiben erhalten.","error");
  await addCsvToArchive(csvName,csv,exportType,topic);entries=entries.filter(e=>e.date!==today());chosenMemberId="";chosenMemberIds.clear();chosenRole="";currentClosingTopic="";resetDocumentReportState();currentProbeDate=systemToday();saveEntries();renderMembers();renderRoles();renderEntries();updateSelection();tacticsClosingPending=false;const actions=byId("tacticsCloseActions");if(actions)actions.hidden=true;setHomeFlowStage(1);showView("attendanceView");showToast("Probe abgeschlossen: Das ZIP-Terminpaket wurde gespeichert und der Tag zurückgesetzt.");
};

/* Einsatzabschluss: Vorschau bleibt PDF, final gespeichert wird ein ZIP-Paket. */
finishOperation=async function(){
  const d=collectOperationData();
  if(d.atueUsed&&!documentReportReady){showDocumentReportPanel();showToast("Bitte zuerst den Bericht der Atemschutzüberwachung fotografieren oder auswählen.","error");return;}
  const check=validateOperation(d),box=byId("operationValidation");box.hidden=!(check.errors.length||check.warnings.length);box.innerHTML=[...check.errors.map(x=>`<p class="error">${escapeHtml(x)}</p>`),...check.warnings.map(x=>`<p class="warning">${escapeHtml(x)}</p>`)].join("");
  if(check.errors.length)return showToast("Bitte die Pflichtangaben und Hinweise prüfen.","error");
  if(check.warnings.length&&!confirm(check.warnings.join("\n")+"\n\nTrotzdem fortfahren?"))return;
  const button=byId("operationFinish");button.disabled=true;
  try{
    const stamp=(d.times.alarm||new Date().toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})).replace(":","-"),base=`FFW-Wasser_${d.date}_${stamp}_Einsatz`,csvName=`${base}.csv`,pdfName=`${base}.pdf`,csv=operationCsv(d),pdf=await operationPdfBlob(d);
    const completed=await showOperationPdfPreview(pdf,pdfName,async()=>{
      const zip=await buildTerminPackage({baseName:base,csvName,csvContent:csv,pdfName,pdfBlob:pdf,documentReport:typeof pendingDocumentReport!=="undefined"?pendingDocumentReport:null}),result=await saveTerminPackage(`${base}.zip`,zip);
      if(result==="failed"||result==="cancelled"){showToast("Das Einsatz-Terminpaket konnte nicht gespeichert werden. Daten bleiben erhalten.","error");return false;}
      const previous=editingOperationArchiveId?csvArchive.find(entry=>entry.id===editingOperationArchiveId):null,item={id:previous?.id||makeId(),fileName:csvName,pdfFileName:pdfName,content:csv,sessionType:"Einsatz",topic:`${d.type} · ${d.location}`,createdAt:previous?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),presentCount:d.members.length,excusedCount:0,missingCount:0,operationData:d,hasImportedPdf:true,revisions:[...(previous?.revisions||[]),...(previous?[{correctedAt:new Date().toISOString(),reason:"Einsatzbericht korrigiert",previousOperationData:previous.operationData}]:[])]};
      await saveImportedReportPdf(item.id,new File([pdf],pdfName,{type:"application/pdf"}));await commitPendingDocumentReport?.(item.id);csvArchive=previous?csvArchive.map(entry=>entry.id===item.id?item:entry):[item,...csvArchive];saveArchive();entries=entries.filter(e=>e.operationId!==currentOperationId);saveEntries();resetDocumentReportState();resetOperationState();renderEntries();renderMembers();renderStatistics();renderHistory();setHomeFlowStage(1);showToast(previous?"Korrigiertes Einsatz-Terminpaket wurde gespeichert und archiviert.":"Einsatz-Terminpaket wurde gespeichert und archiviert.");return true;
    });
    if(!completed)showToast("Finales Speichern abgebrochen. Einsatzdaten bleiben zur Bearbeitung erhalten.","error");
  }catch(error){console.error("Einsatzabschluss fehlgeschlagen",error);showToast(`Einsatz konnte nicht abgeschlossen werden. Daten bleiben erhalten.${error?.message?` (${error.message})`:""}`,"error");}
  finally{button.disabled=false;}
};

/* ZIP-Auswahl in der Historie automatisch entpacken. */
document.addEventListener("change",async event=>{const input=event.target;if(input?.id!=="historyReportsFileInput"||![...(input.files||[])].some(f=>/\.zip$/i.test(f.name)))return;event.stopImmediatePropagation();try{const expanded=[];for(const file of [...input.files])expanded.push(...(/\.zip$/i.test(file.name)?await packageFilesFromZip(file):[file]));await window.FFWReportImport.importHistoryFiles(expanded);}catch(error){console.error(error);showToast(error.message||"Terminpaket konnte nicht eingelesen werden.","error");}finally{input.value="";}},true);

function moveReportImportToSettings(){
  const oldPanel=byId("historyImportPanel"),input=byId("historyReportsFileInput"),settings=byId("settingsFilesView")||byId("archiveView");
  if(!oldPanel||!input||!settings||byId("reportImportSettingsCard"))return;
  input.accept=".zip,.csv,.pdf,application/zip,text/csv,application/pdf";
  const card=document.createElement("article");
  card.id="reportImportSettingsCard";
  card.className="storage-card storage-backup-card report-import-settings-card";
  card.innerHTML=`<div class="storage-card-heading"><span class="storage-card-kicker">Wiederherstellung und Übernahme</span><h3>Terminpaket importieren</h3><p class="help-text">ZIP-Terminpakete und ältere CSV-/PDF-Berichte bei Bedarf in Historie und Statistik übernehmen.</p></div><div class="storage-card-actions"><button class="primary-button" id="importTerminPackageButton" type="button">Terminpaket oder ältere Berichte auswählen</button></div><p class="help-text">Der normale Terminabschluss wird automatisch in der Historie gespeichert. Diese Funktion ist nur für Übernahme oder Wiederherstellung erforderlich.</p>`;
  card.appendChild(input);
  const center=byId("archiveStorageCenter"),backupGrid=byId("archiveStorageBackupGrid");
  if(backupGrid)backupGrid.appendChild(card);else if(center)center.appendChild(card);else settings.appendChild(card);
  byId("importTerminPackageButton").addEventListener("click",()=>input.click());
  oldPanel.remove();
}
document.addEventListener("DOMContentLoaded",()=>{setTimeout(moveReportImportToSettings,0);document.querySelectorAll("#homeStageFinishButton,#operationFinish").forEach(button=>button.textContent=button.id==="operationFinish"?"Einsatz abschließen · Terminpaket":"Probe abschließen · Terminpaket");});
if(document.readyState!=="loading")setTimeout(moveReportImportToSettings,0);

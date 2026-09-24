function csvRoleForEntry(entry, member) {
  if (entry.role === "Organisation") return "Organisation";
  if (entry.tacticsRoleLabel) return entry.tacticsRoleLabel;
  if (entry.role !== "Maschinist") return entry.role || "";
  const vehicles = Array.isArray(member.machinistVehicles) ? member.machinistVehicles.filter(value => value === "LF" || value === "TSF") : [];
  return vehicles.length ? `Maschinist ${vehicles.join("/")}` : "Maschinist";
}
function csvCell(value) { return CsvEngine.cell(value); }
async function closeDay(topic = currentClosingTopic) {
  topic = String(topic || "").trim();
  if (!topic) { openProbeTopicDialog(); return; }
  const current = [...todayEntries()];
  if (!current.length) {
    showToast("Es sind noch keine Anmeldungen vorhanden.", "error");
    return;
  }
  const organizers = current.filter(entry => entry.status === "Anwesend" && entry.role === "Organisation").length;
  const present = current.filter(entry => entry.status === "Anwesend" && entry.role !== "Organisation").length;
  const excused = current.filter(entry => entry.status === "Entschuldigt").length;
  const notApplicable = current.filter(entry => entry.status === "Betrifft nicht").length;
  const recordedNames = new Set(current.flatMap(entry => [entry.storedName, entry.displayName].filter(Boolean)));
  const missing = members.filter(member => !member.ageDepartment && !recordedNames.has(nameForStorage(member)) && !recordedNames.has(nameForTile(member))).length;
  if (!members.length) {
    showToast("Es gibt keine Mitglieder für den CSV-Export.", "error");
    return;
  }

  const exportSessionType = current[0]?.sessionType || sessionType;
  const entryByName = new Map(current.map(entry => [entry.storedName || entry.displayName, entry]));
  const rows = members.map(member => {
    const storedName = nameForStorage(member);
    const displayName = nameForTile(member);
    const entry = entryByName.get(storedName) || entryByName.get(displayName);
    if (!entry && member.ageDepartment) return [today(), "", storedName, exportSessionType, "Betrifft nicht", ""];
    if (!entry) return [today(), "", storedName, exportSessionType, "Fehlt", ""];
    if (entry.status === "Entschuldigt") return [entry.date, entry.time, storedName, exportSessionType, "Entschuldigt", ""];
    if (entry.status === "Betrifft nicht") return [entry.date, entry.time, storedName, exportSessionType, "Betrifft nicht", ""];
    if (entry.role === "Organisation") return [entry.date, entry.time, storedName, exportSessionType, "Anwesend", "Organisation"];
    if (exportSessionType === "Sonderprobe" && entry.status === "Anwesend") return [entry.date, entry.time, storedName, exportSessionType, "Anwesend", "Anwesend"];
    if (exportSessionType === "Unterricht" && entry.status === "Anwesend") return [entry.date, entry.time, storedName, exportSessionType, "Anwesend", "Unterricht"];
    if (exportSessionType === "Ausschuss Sitzung" && entry.status === "Anwesend") return [entry.date, entry.time, storedName, exportSessionType, "Anwesend", "Ausschuss Sitzung"];
    return [entry.date, entry.time, storedName, exportSessionType, "Anwesend", csvRoleForEntry(entry, member)];
  });

  const rowsWithTopic = rows.map(row => [...row, topic]);
  const lines = ["Datum;Uhrzeit;Name;Terminart;Status;Funktion / Status;Thema", ...rowsWithTopic.map(row => row.map(csvCell).join(";"))];
  const safeType = exportSessionType.replace(/ /g, "-");
  const fileName = `FFW-Wasser_${today()}_${safeType}.csv`;
  const csvContent = "\ufeff" + lines.join("\r\n");
  const pdfFileName = `FFW-Wasser_${today()}_${safeType}.pdf`;
  const pdfRows = rows.map(row => ({ time:row[1], name:row[2], status:row[4], role:row[5] }));
  const pdfNotApplicable = rows.filter(row => row[4] === "Betrifft nicht").length;
  const pdfBlob = probePdfBlob(pdfRows, exportSessionType, {present:present+organizers,excused,missing,notApplicable:pdfNotApplicable}, topic);
  let exportResult = "failed";
  let savedToFolder = false;

  const folderStorageSelected=Boolean(csvDirectoryHandle||pdfDirectoryHandle);
  // Ist ein Speicherordner gewählt, müssen beide Dateien dort erfolgreich
  // geschrieben werden. Kein stiller Wechsel in den Download-Ordner.
  if (folderStorageSelected) {
    const csvSaved = await writeCsvToSelectedFolder(fileName, csvContent);
    const pdfSaved = await saveBlobToSelectedFolder(pdfFileName, pdfBlob);
    savedToFolder = csvSaved && pdfSaved;
    if (!savedToFolder) {
      showToast("CSV und PDF konnten nicht in den gewählten OneDrive-Ordner geschrieben werden. Die Probe bleibt erhalten.","error");
      return;
    }
    exportResult="saved";
  }

  // Nur wenn kein Ordner ausgewählt ist: Safari/iPad nutzt Teilen/Sichern.
  const isiPadClose=/iPad|Macintosh/i.test(navigator.userAgent||"")&&("ontouchend" in document);
  if (!folderStorageSelected && !isiPadClose && isSafariBrowser() && typeof File === "function" && navigator.share && navigator.canShare) {
    try {
      const csvFile = new File([csvContent], fileName, { type: "text/csv" });
      const pdfFile = new File([pdfBlob], pdfFileName, { type: "application/pdf" });
      if (navigator.canShare({ files: [csvFile, pdfFile] })) {
        await navigator.share({ files: [csvFile, pdfFile] });
        exportResult = "shared";
      }
    } catch (error) {
      if (error && error.name === "AbortError") {
        showToast("CSV-/PDF-Ausgabe wurde abgebrochen. Die Tagesdaten bleiben erhalten.", "error");
        return;
      }
    }
  }

  // Browser ohne gemeinsamen Datei-Dialog: CSV ausgeben und die PDF danach
  // separat herunterladen. Bei Teilfehlern werden beide Dateien erneut ausgegeben.
  if (!folderStorageSelected && exportResult === "failed" && isiPadClose) {
    showToast("Bitte zuerst einen Speicherordner wählen. CSV und PDF werden auf dem iPad nicht mehr über eine Dateivorschau ausgegeben.","error");
    return;
  }
  if (!folderStorageSelected && exportResult === "failed") {
    exportResult = await exportCsvFile(fileName, csvContent, false);
    if (exportResult !== "failed" && exportResult !== "cancelled") downloadBlob(pdfFileName, pdfBlob);
  }
  if (exportResult === "cancelled" || exportResult === "failed") {
    showToast("CSV und PDF konnten nicht ausgegeben werden. Die Tagesdaten bleiben erhalten.", "error");
    return;
  }

  await addCsvToArchive(fileName, csvContent, exportSessionType, topic);
  const completedSessionId=ensureCurrentSessionId();
  entries = entries.filter(entry => entry.sessionId !== completedSessionId);
  currentSessionId=""; safeStorage.setItem("fw_v1_current_session_id","");
  chosenMemberId = "";
  chosenMemberIds.clear();
  chosenRole = "";
  currentClosingTopic = "";
  resetDocumentReportState();
  currentProbeDate = systemToday();
  saveEntries();
  renderMembers(); renderRoles(); renderEntries(); updateSelection();
  tacticsClosingPending=false;
  const tacticsActions=byId("tacticsCloseActions");if(tacticsActions)tacticsActions.hidden=true;
  setHomeFlowStage(1);
  showView("attendanceView");
  requestAnimationFrame(()=>document.querySelector("#attendanceView .home-session-type-panel")?.scrollIntoView({behavior:"smooth",block:"start"}));

  showToast(savedToFolder
    ? `Probe abgeschlossen: CSV und PDF wurden in „${effectiveCsvDirectoryHandle()?.name||effectivePdfDirectoryHandle()?.name}“ gespeichert und der Tag zurückgesetzt.`
    : exportResult === "shared"
      ? "Probe abgeschlossen: CSV und PDF wurden an den Teilen-Dialog übergeben und der Tag zurückgesetzt."
      : "Probe abgeschlossen: CSV und PDF wurden ausgegeben und der Tag zurückgesetzt.");
}

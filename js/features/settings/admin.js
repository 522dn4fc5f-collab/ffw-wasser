function logoutAdmin(showMessage = false) {
  adminUnlocked = false;
  clearTimeout(adminTimeoutId);
  adminTimeoutId = null;
  showView("attendanceView");
  if (showMessage) showToast("Administration wurde nach 15 Minuten Inaktivität automatisch gesperrt.", "error");
}
function resetAdminTimeout() {
  if (!adminUnlocked) return;
  clearTimeout(adminTimeoutId);
  adminTimeoutId = setTimeout(() => logoutAdmin(true), ADMIN_TIMEOUT_MS);
}
async function requestCloseProbe() {
  if (!todayEntries().length) return showToast("Es muss mindestens eine Teilnahme erfasst sein.", "error");
  openProbeTopicDialog();
}
function ensureProbeTopicDialog() {
  const dialog=byId("probeTopicDialog");
  if(!dialog||dialog.dataset.bound)return;
  dialog.dataset.bound="true";
  byId("cancelProbeTopicButton").addEventListener("click",()=>{
    dialog.close();
    tacticsClosingPending=false;
    const tacticsActions=byId("tacticsCloseActions");if(tacticsActions)tacticsActions.hidden=true;
    setHomeFlowStage(2);
    showView("attendanceView");
    requestAnimationFrame(()=>byId("attendanceSelectionWorkspace")?.scrollIntoView({behavior:"smooth",block:"start"}));
  });
  byId("confirmProbeTopicButton").addEventListener("click",confirmProbeTopic);
}
function openProbeTopicDialog() {
  ensureProbeTopicDialog();
  const dialog=byId("probeTopicDialog"), input=byId("probeTopicInput");
  byId("probeTopicError").hidden=true;
  const description=byId("probeTopicDescription");
  if(description)description.textContent=`Bitte das Thema der ${sessionType} eintragen. Das Thema erscheint in CSV, PDF und Archiv.`;
  input.value=currentClosingTopic;
  dialog.showModal();
  setTimeout(()=>input.focus(),0);
}
async function confirmProbeTopic() {
  const topic=byId("probeTopicInput").value.trim();
  if(!topic){byId("probeTopicError").hidden=false;byId("probeTopicInput").focus();return;}
  currentClosingTopic=topic;
  const confirmButton=byId("confirmProbeTopicButton");
  if(confirmButton){confirmButton.disabled=true;confirmButton.textContent="Speicherzugriff wird geprüft …";}
  const folderPermission=await requestExportFolderPermissionsNow();
  if(!folderPermission.ok){
    if(confirmButton){confirmButton.disabled=false;confirmButton.textContent="Weiter zum Abschluss";}
    showToast("Kein Schreibzugriff auf den gewählten OneDrive-Ordner. Bitte Zugriff erlauben oder den Speicherort neu auswählen.","error");
    return;
  }
  if(confirmButton)confirmButton.textContent="Abschluss wird erstellt …";
  byId("probeTopicDialog").close();
  try {
    if (sessionType === "Allgemeine Probe") {
      if (!todayEntries().some(entry => entry.status === "Anwesend")) {
        showToast("Für die Taktik muss mindestens eine Person anwesend sein.", "error");
        return;
      }
      // Schritt 3 ist bereits die Fahrzeug- und Funktionskontrolle. Nach der
      // Themeneingabe deshalb nicht erneut in Schritt 3 stehen bleiben, sondern
      // die sichtbare Einteilung übernehmen und den Export direkt starten.
      openTactics(true);
      await finalizeProbeFromTactics();
      return;
    }
    await closeDay(topic);
  } catch(error) {
    console.error("Probe konnte nicht abgeschlossen werden", error);
    showToast("Der Abschluss konnte nicht erstellt werden. Die Tagesdaten bleiben erhalten.", "error");
  } finally {
    if(confirmButton){confirmButton.disabled=false;confirmButton.textContent="Weiter zum Abschluss";}
  }
}
function login() {
  if (byId("adminPin").value !== adminPin()) {
    byId("pinError").hidden = false;
    byId("adminPin").select();
    return;
  }
  adminUnlocked = true;
  resetAdminTimeout();
  byId("adminPin").value = "";
  byId("pinError").hidden = true;
  renderAdmin();
  showView(pendingSettingsTarget||"settingsMembersView");
  pendingSettingsTarget="";
}

function loginArchive() {
  if (byId("archivePin").value !== adminPin()) {
    byId("archivePinError").hidden = false;
    byId("archivePin").select();
    return;
  }
  adminUnlocked = true;
  resetAdminTimeout();
  byId("archivePin").value = "";
  byId("archivePinError").hidden = true;
  renderArchive();
  showView(pendingSettingsTarget||"settingsFilesView");
  pendingSettingsTarget="";
}

function addMember() {
  const lastName = byId("newLastName").value.trim();
  const firstName = byId("newFirstName").value.trim();
  if (!lastName || !firstName) return showToast("Bitte Nachname und Vorname eingeben.", "error");
  const duplicate = members.some(member => member.lastName.toLocaleLowerCase("de") === lastName.toLocaleLowerCase("de") && member.firstName.toLocaleLowerCase("de") === firstName.toLocaleLowerCase("de"));
  if (duplicate) return showToast("Dieses Mitglied ist bereits vorhanden.", "error");
  members = sortMembers([...members, { id: makeId(), lastName, firstName, roles: [...AVAILABLE_ROLES], ageDepartment: false, machinistVehicles: [] }]);
  saveMembers();
  byId("newLastName").value = "";
  byId("newFirstName").value = "";
  renderMembers();
  renderAdmin();
  showToast("Mitglied wurde hinzugefügt.");
}
function updateMember(id, row) {
  const lastName = row.querySelector("[data-last-name]").value.trim();
  const firstName = row.querySelector("[data-first-name]").value.trim();
  if (!lastName || !firstName) return showToast("Name darf nicht leer sein.", "error");
  const member = members.find(item => item.id === id);
  if (!member) return;
  member.lastName = lastName;
  member.firstName = firstName;
  member.roles = [...row.querySelectorAll("[data-member-role]:checked")].map(input => input.dataset.memberRole).filter(role => role !== "Maschinist");
  member.ageDepartment = Boolean(row.querySelector("[data-age-department]")?.checked);
  member.machinistVehicles = [...row.querySelectorAll("[data-machinist-vehicle]:checked")].map(input => input.dataset.machinistVehicle);
  members = sortMembers(members);
  saveMembers();
  renderMembers();
  renderAdmin();
  updateSelection();
  showToast("Mitglied wurde aktualisiert.");
}
function deleteMember(id) {
  const member = members.find(item => item.id === id);
  if (!member || !confirm(`${nameForTile(member)} wirklich löschen?`)) return;
  members = members.filter(item => item.id !== id);
  if (chosenMemberId === id) chosenMemberId = "";
  saveMembers();
  renderMembers();
  renderAdmin();
  updateSelection();
  showToast("Mitglied wurde gelöscht.");
}
function changePin() {
  const first = byId("newPin").value.trim();
  const repeated = byId("repeatPin").value.trim();
  if (first.length < 3) return showToast("Die PIN muss mindestens 3 Zeichen enthalten.", "error");
  if (first !== repeated) return showToast("Die PIN-Eingaben stimmen nicht überein.", "error");
  safeStorage.setItem(KEYS.pin, first);
  byId("newPin").value = "";
  byId("repeatPin").value = "";
  showToast("Admin-PIN wurde geändert.");
}

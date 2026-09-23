function renderMembers() {
  members = sortMembers(members);
  const current = todayEntries();
  const recordedNames = new Set(current.flatMap(entry => [entry.storedName, entry.displayName].filter(Boolean)));
  const eligibleMembers = sessionType === "Ausschuss Sitzung" ? members.filter(member => member.committeeMember) : members;
  const availableMembers = eligibleMembers.filter(member => !recordedNames.has(nameForStorage(member)) && !recordedNames.has(nameForTile(member)));
  if (!availableMembers.some(member => member.id === chosenMemberId)) chosenMemberId = "";
  chosenMemberIds = new Set([...chosenMemberIds].filter(id => availableMembers.some(member => member.id === id)));
  const multiMode = (sessionType === "Allgemeine Probe" && (chosenRole === "Anwesend" || chosenRole === "Entschuldigt" || chosenRole === "Organisation")) ||
    (sessionType === "Sonderprobe" && (chosenRole === "Anwesend" || chosenRole === "Entschuldigt" || chosenRole === "Betrifft nicht")) ||
    ((sessionType === "Unterricht" || sessionType === "Ausschuss Sitzung") && (chosenRole === "Anwesend" || chosenRole === "Entschuldigt")) ||
    (sessionType === "Einsatz" && chosenRole === "Anwesend");
  const renderMemberButton = member => {
    const recorded = recordedNames.has(nameForStorage(member)) || recordedNames.has(nameForTile(member));
    const selected = !recorded && (multiMode ? chosenMemberIds.has(member.id) : member.id === chosenMemberId);
    const organizationSelected = selected && chosenRole === "Organisation";
    return `<button type="button" class="choice-button ${member.ageDepartment ? "age-member-button" : ""} ${selected ? "selected" : ""} ${organizationSelected ? "organization-selected" : ""} ${recorded ? "recorded" : ""}" data-member="${escapeHtml(member.id)}" aria-pressed="${selected}" ${recorded ? 'disabled aria-disabled="true"' : ""}>${escapeHtml(nameForTile(member))}</button>`;
  };
  const activeMembers = (sessionType === "Ausschuss Sitzung" ? members.filter(member => member.committeeMember) : members).filter(member => !member.ageDepartment);
  const ageMembers = sessionType === "Ausschuss Sitzung" ? [] : members.filter(member => member.ageDepartment);
  const sections = [
    `<section class="member-section member-section-active"><div class="member-section-heading"><h4>Einsatzabteilung</h4><span>${activeMembers.length}</span></div><div class="member-subgrid">${activeMembers.map(renderMemberButton).join("")}</div></section>`,
    ageMembers.length ? `<section class="member-section member-section-age"><div class="member-section-heading"><h4>Alterskameraden</h4><span>${ageMembers.length}</span></div><p>Nur anwesende Mitglieder auswählen. Nicht ausgewählte Mitglieder werden als „Betrifft nicht“ gewertet.</p><div class="member-subgrid">${ageMembers.map(renderMemberButton).join("")}</div></section>` : ""
  ];
  byId("members").innerHTML = sections.join("");
  byId("memberCount").textContent = multiMode ? `${chosenMemberIds.size} ausgewählt · ${availableMembers.length} offen` : `${availableMembers.length} offen`;
}
function updatePrimaryAction() {
  const button=byId("exportResetButton"),count=todayEntries().length,hasEntries=count>0;
  if(!button)return;
  button.textContent=hasEntries?`Weiter zu Schritt 3 · ${count} ${count===1?"Person":"Personen"} erfasst →`:"Weiter zu Schritt 3 →";
  button.disabled=!hasEntries;
  button.title=hasEntries?(sessionType==="Allgemeine Probe"?"Taktik öffnen und Probe abschließen":"Probe abschließen"):"Mindestens eine Teilnahme erfassen";
  const summary=byId("step3ActionSummary");
  if(summary)summary.textContent=hasEntries?`${count} ${count===1?"Teilnahme":"Teilnahmen"} gespeichert.`:"Noch keine Teilnahme gespeichert.";
}
function backToMembers() {
  chosenMemberId = "";
  chosenMemberIds.clear();
  chosenRole = "";
  renderMembers();
  renderRoles();
  updateSelection();
  updateProbeWorkflow();
}

function updateSelection() {
  const selected = members.find(member => member.id === chosenMemberId);
  const isStandard = sessionType === "Allgemeine Probe";
  const isSpecial = sessionType === "Sonderprobe";
  const isTraining = sessionType === "Unterricht";
  const isCommittee = sessionType === "Ausschuss Sitzung";
  const isOperation = sessionType === "Einsatz";
  const multiMode = (isStandard && (chosenRole === "Anwesend" || chosenRole === "Entschuldigt" || chosenRole === "Organisation")) ||
    (isSpecial && (chosenRole === "Anwesend" || chosenRole === "Entschuldigt" || chosenRole === "Betrifft nicht")) ||
    ((isTraining || isCommittee) && (chosenRole === "Anwesend" || chosenRole === "Entschuldigt")) ||
    (sessionType === "Einsatz" && chosenRole === "Anwesend");
  const selectedMemberLabel=byId("selectedMember");
  if(selectedMemberLabel)selectedMemberLabel.textContent = multiMode
    ? (chosenMemberIds.size ? `${chosenMemberIds.size} Mitglieder ausgewählt` : "Noch keine Mitglieder gewählt")
    : (selected ? nameForTile(selected) : "Nicht gewählt");

  const selectedMultiMembers = sortMembers(members.filter(member => chosenMemberIds.has(member.id)));
  if(byId("participantOverview"))byId("participantOverview").hidden = !multiMode || chosenMemberIds.size === 0;
  if(byId("participantCount"))byId("participantCount").textContent = selectedMultiMembers.length;
  if(byId("participantList"))byId("participantList").innerHTML = selectedMultiMembers.length ? selectedMultiMembers.map(member => `<li>${escapeHtml(nameForTile(member))}</li>`).join("") : "<li>Noch keine Mitglieder ausgewählt</li>";
  document.querySelector(".current-selection")?.classList.toggle("training-selection", isTraining);
  if(byId("saveButton"))byId("saveButton").textContent = multiMode
    ? `Auswahl übernehmen (${chosenMemberIds.size})`
    : "Auswahl übernehmen";
  if(byId("saveButton"))byId("saveButton").disabled = !multiMode || chosenMemberIds.size === 0;
  if(byId("roleSaveButton"))byId("roleSaveButton").disabled = !(sessionType === "Allgemeine Probe" && selected && chosenRole);
  updateProbeWorkflow();
}
function todayEntries() { return entries.filter(entry => entry.date === today() && (sessionType === "Einsatz" ? entry.operationId === currentOperationId : !entry.operationId)); }
function renderEntries() {
  const current = todayEntries();
  byId("entries").innerHTML = current.map(entry => `
    <tr>
      <td>${escapeHtml(entry.time)}</td>
      <td><strong>${escapeHtml(entry.displayName)}</strong></td>
      <td>${escapeHtml(entry.role === "Organisation" ? "Organisation" : ((entry.status === "Entschuldigt" || entry.status === "Betrifft nicht") ? entry.status : entry.role))}</td>
      <td><button type="button" class="delete-entry" data-entry="${escapeHtml(entry.id)}" aria-label="Anmeldung löschen">✕</button></td>
    </tr>`).join("");
  const presentCount = current.filter(entry => entry.status === "Anwesend").length;
  const excusedCount = current.filter(entry => entry.status === "Entschuldigt").length;
  const recordedNames = new Set(current.flatMap(entry => [entry.storedName, entry.displayName].filter(Boolean)));
  const missingCount = members.filter(member => !member.ageDepartment && !recordedNames.has(nameForStorage(member)) && !recordedNames.has(nameForTile(member))).length;
  byId("entryCount").textContent = current.length;
  byId("todayCount").textContent = presentCount;
  byId("excusedCount").textContent = excusedCount;
  byId("missingCount").textContent = missingCount;
  byId("emptyEntries").hidden = current.length > 0;
}
function renderAdmin() {
  members = sortMembers(members);
  byId("adminMemberCount").textContent = members.length;
  byId("exportResetButton").disabled = todayEntries().length === 0;
  const targets = getRoleTargets();
  const targetBox = byId("roleTargetInputs");
  if (targetBox) targetBox.innerHTML = ROLE_GROUPS.map(group => `<fieldset class="role-target-group role-theme-${group.key}"><legend>${escapeHtml(group.title)}</legend>${group.roles.map(role => `<label><span>${escapeHtml(role)}</span><input type="number" min="0" max="99" step="1" inputmode="numeric" data-role-target="${escapeHtml(role)}" value="${targets[role]}"><small>× pro Jahr</small></label>`).join("")}</fieldset>`).join("");
  if (byId("roleTargetsStatus")) byId("roleTargetsStatus").textContent = "0 = kein Jahresziel";
  const renderMemberCard = (member, index) => {
    const memberRoles = getMemberRoles(member);
    const roleGroups = ROLE_GROUPS.map(group => `<fieldset class="admin-role-group role-theme-${group.key}"><legend>${escapeHtml(group.title)}</legend><div class="admin-role-options">${group.roles.map(role => `<label class="role-checkbox"><input type="checkbox" data-member-role="${escapeHtml(role)}" ${memberRoles.includes(role) ? "checked" : ""}><span>${escapeHtml(role)}</span></label>`).join("")}</div></fieldset>`).join("");
    const machinistVehicles = Array.isArray(member.machinistVehicles) ? member.machinistVehicles : [];
    const vehicleOptions = member.ageDepartment ? "" : `<fieldset class="admin-role-group role-theme-vehicles machinist-vehicle-group"><legend>Maschinistenberechtigung</legend><p>LF10 und/oder TSF auswählen. Dadurch wird die Person automatisch als Maschinist freigeschaltet.</p><div class="admin-role-options"><label class="role-checkbox"><input type="checkbox" data-machinist-vehicle="LF" ${machinistVehicles.includes("LF") ? "checked" : ""}><span>LF</span></label><label class="role-checkbox"><input type="checkbox" data-machinist-vehicle="TSF" ${machinistVehicles.includes("TSF") ? "checked" : ""}><span>TSF</span></label></div><div class="driver-license-control"><label><span>Letzte Führerscheinkontrolle</span><input type="date" data-driver-license-checked value="${escapeHtml(member.driverLicenseCheckedOn||"")}"></label><small>${member.driverLicenseCheckedOn?`Nächste Kontrolle bis ${escapeHtml(driverLicenseDueDate(member))}`:"Bei Maschinisten jährlich dokumentieren."}</small></div></fieldset>`;
    return `<article class="admin-row member-card member-card-${index % 3}"><header class="member-card-header"><span class="member-card-number">${index + 1}</span><strong>${escapeHtml(nameForTile(member))}</strong>${member.ageDepartment ? '<span class="age-department-badge">Altersabteilung</span>' : ''}</header><div class="member-name-fields"><label><span>Nachname</span><input class="text-input" data-last-name value="${escapeHtml(member.lastName)}"></label><label><span>Vorname</span><input class="text-input" data-first-name value="${escapeHtml(member.firstName)}"></label></div><label class="age-department-toggle"><input type="checkbox" data-age-department ${member.ageDepartment ? "checked" : ""}><span><strong>Altersabteilung</strong><small>Antippen meldet direkt als anwesend; ohne Anmeldung automatisch „Betrifft nicht“</small></span></label><label class="committee-member-toggle"><input type="checkbox" data-committee-member ${member.committeeMember ? "checked" : ""}><span><strong>Mitglied des Ausschusses</strong><small>Wird bei der Terminart Ausschuss Sitzung zur Auswahl angeboten.</small></span></label><div class="member-safety-settings"><label class="atue-member-toggle"><input type="checkbox" data-atue-qualified ${member.atueQualified ? "checked" : ""}><span><strong>Atemschutzüberwachung (ATÜ)</strong><small>Darf den separaten ATÜ-Platz übernehmen.</small></span></label><label class="breathing-clearance-toggle"><input type="checkbox" data-breathing-clearance ${member.breathingClearance ? "checked" : ""}><span><strong>Atemschutzfreigabe vorhanden</strong><small>Für tatsächlichen Atemschutzeinsatz als AT oder WT.</small></span></label><label class="breathing-clearance-date"><span>Gültig bis</span><input class="text-input" type="date" data-breathing-clearance-until value="${escapeHtml(member.breathingClearanceUntil||"")}"></label></div>${member.ageDepartment ? '<div class="age-no-role-note">Für Mitglieder der Altersabteilung ist keine Funktionsauswahl erforderlich.</div>' : `<div class="member-role-editor">${roleGroups}${vehicleOptions}</div>`}<div class="member-card-actions"><button type="button" class="admin-save" data-save-member="${escapeHtml(member.id)}">Einstellungen speichern</button><button type="button" class="danger-button" data-delete-member="${escapeHtml(member.id)}">Mitglied löschen</button></div></article>`;
  };
  const activeMembers = members.filter(member => !member.ageDepartment);
  const ageMembers = members.filter(member => member.ageDepartment);
  byId("memberAdmin").innerHTML = `<section class="admin-department admin-department-active"><div class="admin-department-heading"><h4>Einsatzabteilung</h4><span>${activeMembers.length}</span></div>${activeMembers.map((member, index) => renderMemberCard(member, index)).join("")}</section>${ageMembers.length ? `<section class="admin-department admin-department-age"><div class="admin-department-heading"><h4>Alterskameraden</h4><span>${ageMembers.length}</span></div>${ageMembers.map((member, index) => renderMemberCard(member, activeMembers.length + index)).join("")}</section>` : ""}`;
}
function saveAgeDepartmentAttendance(member) {
  if (!member || !member.ageDepartment) return false;
  const time = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  entries.unshift({
    id: makeId(), date: today(), time,
    displayName: nameForTile(member), storedName: nameForStorage(member),
    role: "", status: "Anwesend", sessionType
  });
  saveEntries();
  chosenMemberId = "";
  chosenMemberIds.clear();
  chosenRole = "";
  renderMembers(); renderRoles(); renderEntries(); renderAdmin(); updateSelection(); updateProbeWorkflow();
  showToast(`${nameForTile(member)} wurde als anwesend gespeichert.`);
  return true;
}
function saveDirectGeneralAttendance(member, status = "Anwesend") {
  if (!member || member.ageDepartment) return false;
  const time = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  entries.unshift({ id: makeId(), date: today(), time, displayName: nameForTile(member), storedName: nameForStorage(member), role: "", status, sessionType });
  saveEntries(); chosenMemberId = ""; chosenMemberIds.clear(); chosenRole = "";
  renderMembers(); renderRoles(); renderEntries(); renderAdmin(); updateSelection(); updateProbeWorkflow();
  showToast(`${nameForTile(member)} wurde als ${status.toLowerCase()} gespeichert. Die Funktion wird beim Start der Probe berechnet.`);
  return true;
}
function chooseMember(id) {
  const clickedMember=members.find(member=>member.id===id);
  if(!clickedMember || !chosenRole) return;
  const allowed=(sessionType==="Allgemeine Probe" && ["Anwesend","Entschuldigt","Organisation"].includes(chosenRole)) ||
    (sessionType==="Sonderprobe" && ["Anwesend","Entschuldigt","Betrifft nicht"].includes(chosenRole)) ||
    ((sessionType==="Unterricht" || sessionType==="Ausschuss Sitzung") && ["Anwesend","Entschuldigt"].includes(chosenRole)) ||
    (sessionType==="Einsatz" && chosenRole==="Anwesend");
  if(!allowed) return;
  if(chosenMemberIds.has(id)) chosenMemberIds.delete(id); else chosenMemberIds.add(id);
  chosenMemberId="";
  renderMembers(); updateSelection(); updateProbeWorkflow();
}
function chooseRole(role) {
  chosenRole=role;
  chosenMemberId="";
  chosenMemberIds.clear();
  renderMembers(); renderRoles(); updateSelection(); updateProbeWorkflow();
}
function saveAttendance() {
  const isStandard = sessionType === "Allgemeine Probe";
  const isSpecial = sessionType === "Sonderprobe";
  const isTraining = sessionType === "Unterricht";
  const isCommittee = sessionType === "Ausschuss Sitzung";
  const isOperation = sessionType === "Einsatz";
  const allowedStatuses = isStandard
    ? ["Anwesend", "Entschuldigt", "Organisation"]
    : isSpecial
      ? ["Anwesend", "Entschuldigt", "Betrifft nicht"]
      : (isTraining || isCommittee)
        ? ["Anwesend", "Entschuldigt"]
        : isOperation ? ["Anwesend"] : [];

  // Robuster Abgleich: interne Auswahl und sichtbar markierte Karten zusammenführen.
  document.querySelectorAll('#members .choice-button.selected[data-member]').forEach(button => {
    if (button.dataset.member) chosenMemberIds.add(button.dataset.member);
  });

  const now = new Date();
  const time = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const selectedMembers = members.filter(member => chosenMemberIds.has(member.id));

  if (allowedStatuses.includes(chosenRole) && selectedMembers.length) {
    selectedMembers.forEach(member => entries.unshift({
      id: makeId(),
      date: today(),
      time,
      displayName: nameForTile(member),
      storedName: nameForStorage(member),
      role: isStandard && chosenRole === "Organisation"
        ? "Organisation"
        : (isCommittee && chosenRole === "Anwesend" ? "Ausschuss Sitzung" : (isTraining && chosenRole === "Anwesend" ? "Unterricht" : "")),
      status: chosenRole === "Organisation" ? "Anwesend" : chosenRole,
      sessionType,
      operationId: isOperation ? currentOperationId : ""
    }));
    saveEntries();
    const count = selectedMembers.length;
    const savedRole = chosenRole;
    chosenMemberIds.clear();
    chosenMemberId = "";
    renderMembers();
    renderRoles();
    renderEntries();
    renderAdmin();
    updateSelection();
    updateProbeWorkflow();
    showToast(`${count} Personen wurden als „${savedRole}“ übernommen. Weitere Personen können markiert oder der Status kann geändert werden.`);
    const remainingMembers = members.some(member => !member.ageDepartment && !todayEntries().some(entry => entry.storedName === nameForStorage(member) || entry.displayName === nameForTile(member)));
    if (remainingMembers) requestAnimationFrame(() => {
      const statusTabs = byId("attendanceStatusToolbar");
      const fallback = byId("memberStepTitle")?.closest(".panel") || byId("members");
      const target = statusTabs || fallback;
      if (!target) return;
      const headerOffset = Math.max(96, document.querySelector(".site-header")?.getBoundingClientRect().height || 0);
      const targetTop = window.scrollY + target.getBoundingClientRect().top - headerOffset - 12;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
      statusTabs?.querySelector("[data-role].selected")?.focus({ preventScroll: true });
    });
    return;
  }

  const selected = members.find(member => member.id === chosenMemberId);
  if (isStandard || isSpecial || isTraining || isCommittee || isOperation) {
    return showToast(chosenRole
      ? "Bitte mindestens ein Mitglied auswählen."
      : "Bitte zuerst einen Status auswählen.", "error");
  }
  if (!selected || !chosenRole) return showToast("Bitte Mitglied und Funktion auswählen.", "error");
  const isExcused = chosenRole === "Entschuldigt";
  entries.unshift({
    id: makeId(), date: today(), time,
    displayName: nameForTile(selected), storedName: nameForStorage(selected),
    role: isExcused ? "" : chosenRole,
    status: isExcused ? "Entschuldigt" : "Anwesend",
    sessionType
  });
  saveEntries();
  chosenMemberId = "";
  chosenMemberIds.clear();
  chosenRole = "";
  renderMembers();
  renderRoles();
  renderEntries();
  updateSelection();
  updateProbeWorkflow();
  renderAdmin();
  showToast(`${nameForTile(selected)} wurde gespeichert. Mitglied und Funktion wurden zurückgesetzt.`);
}
function deleteEntry(id) {
  const entry=entries.find(item=>item.id===id);
  if(!entry)return showToast("Die Anmeldung wurde nicht gefunden.","error");
  const name=entry.displayName||entry.storedName||"diese Person";
  if(!confirm(`Anmeldung von ${name} wirklich aus der heutigen Liste entfernen?`))return;
  entries=entries.filter(item=>item.id!==id);
  saveEntries();
  chosenMemberId="";
  chosenMemberIds.delete(entry.memberId||"");
  renderEntries();
  renderMembers();
  renderRoles();
  renderAdmin();
  updateSelection();
  updateProbeWorkflow();
  updatePrimaryAction();
  showToast(`${name} wurde aus den heutigen Anmeldungen entfernt.`);
}
function clearToday() {
  if (!todayEntries().length) return showToast("Für heute sind keine Anmeldungen vorhanden.", "error");
  if (!confirm("Alle heutigen Anmeldungen zurücksetzen? Mitglieder, Einstellungen und Archiv bleiben erhalten.")) return;
  entries = entries.filter(entry => entry.date !== today());
  chosenMemberId = "";
  chosenMemberIds.clear();
  chosenRole = "";
  saveEntries();
  renderMembers();
  renderRoles();
  renderEntries();
  renderAdmin();
  updateSelection();
  updateProbeWorkflow();
  showToast("Alle heutigen Teilnehmer wurden zurückgesetzt und können neu eingetragen werden.");
}

function setupUnifiedHomeWorkflow(){
  if(!chosenRole) chosenRole="Anwesend";
  const input=document.querySelector("#attendanceView .input-column"),roles=byId("rolesPanel"),members=document.querySelector("#attendanceView .members-panel");
  if(input&&roles&&members){
    let workspace=byId("attendanceSelectionWorkspace");
    if(!workspace){workspace=document.createElement("div");workspace.id="attendanceSelectionWorkspace";workspace.className="attendance-selection-workspace";input.insertBefore(workspace,input.firstChild);}
    workspace.appendChild(roles);workspace.appendChild(members);
    roles.hidden=false;members.hidden=false;roles.classList.add("inline-status-panel","status-tab-rail");members.classList.add("inline-members-panel","organisation-sheet");
    roles.querySelector(".panel-heading")?.remove();
    byId("roleSelectionHint")?.remove();
  }
  byId("backToMembersButton")?.remove();byId("changeStatusButton")?.remove();
}
function updateProbeWorkflow(){
  const standard=sessionType==="Allgemeine Probe",special=sessionType==="Sonderprobe",training=sessionType==="Unterricht",committee=sessionType==="Ausschuss Sitzung",operation=sessionType==="Einsatz";
  const hasStatus=Boolean(chosenRole);
  const membersPanel=document.querySelector(".members-panel"),rolesPanel=byId("rolesPanel");
  if(membersPanel)membersPanel.hidden=false;if(rolesPanel)rolesPanel.hidden=false;
  if(byId("selectedStatusBar"))byId("selectedStatusBar").hidden=true;
  if(byId("saveButton")){byId("saveButton").hidden=false;byId("saveButton").disabled=!hasStatus||chosenMemberIds.size===0;}
  if(byId("batchSelectionHint"))byId("batchSelectionHint").hidden=true;
  if(byId("participantOverview"))byId("participantOverview").hidden=chosenMemberIds.size===0;
  if(byId("roleSaveButton"))byId("roleSaveButton").hidden=true;
  if(byId("memberStepTitle"))byId("memberStepTitle").textContent=committee?"Mitglieder des Ausschusses markieren":operation?"Anwesende Einsatzkräfte markieren":standard?"Personen markieren":training?"Teilnehmende markieren":"Personen markieren";
  if(byId("memberStepNumber"))byId("memberStepNumber").textContent="2";
  if(byId("roleStepNumber"))byId("roleStepNumber").textContent="1";
  if(byId("roleStepEyebrow"))byId("roleStepEyebrow").textContent="Status direkt auswählen";
  if(byId("roleMemberName"))byId("roleMemberName").textContent=operation?"Einsatz: nur Anwesend":standard?"Anwesend, Entschuldigt oder Organisation":special?"Anwesend, Entschuldigt oder Betrifft nicht":committee?"Ausschuss Sitzung: Anwesend oder Entschuldigt":"Anwesend oder Entschuldigt";
  if(byId("roleSelectionHint"))byId("roleSelectionHint").textContent="Der ausgewählte Status bleibt aktiv. Zum Wechsel einfach einen anderen Status antippen.";
  updatePrimaryAction();
}

function renderRoles(){
  const statuses=sessionType==="Einsatz"?["Anwesend"]:sessionType==="Allgemeine Probe"?["Anwesend","Entschuldigt","Organisation"]:sessionType==="Sonderprobe"?["Anwesend","Entschuldigt","Betrifft nicht"]:["Anwesend","Entschuldigt"];
  if(!statuses.includes(chosenRole)){chosenRole="Anwesend";chosenMemberIds.clear();}
  const workspace=byId("attendanceSelectionWorkspace"),sheet=document.querySelector(".organisation-sheet");
  const statusClass=chosenRole==="Entschuldigt"?"status-excused":chosenRole==="Betrifft nicht"?"status-not-applicable":chosenRole==="Organisation"?"status-organization":"status-present";
  [workspace,sheet].filter(Boolean).forEach(element=>{element.classList.remove("status-present","status-excused","status-not-applicable","status-organization");element.classList.add(statusClass);});

  let toolbar=byId("attendanceStatusToolbar");
  if(!toolbar){toolbar=document.createElement("nav");toolbar.id="attendanceStatusToolbar";toolbar.className="attendance-status-toolbar";toolbar.setAttribute("aria-label","Teilnahmestatus");}
  toolbar.innerHTML=statuses.map(status=>`<button type="button" role="tab" class="attendance-status-tab ${chosenRole===status?"selected":""}" data-role="${escapeHtml(status)}" aria-selected="${chosenRole===status}" aria-pressed="${chosenRole===status}">${escapeHtml(status)}</button>`).join("");
  const membersRoot=byId("members");
  const membersPanel=membersRoot?.closest(".members-panel,article,.panel,section");
  if(membersPanel&&membersPanel!==workspace&&membersPanel.parentElement){
    membersPanel.classList.add("participant-file-card");
    membersPanel.parentElement.insertBefore(toolbar,membersPanel);
  } else if(membersRoot?.parentElement){
    membersRoot.parentElement.classList.add("participant-file-card");
    membersRoot.parentElement.insertBefore(toolbar,membersRoot);
  } else workspace?.prepend(toolbar);
  const showStatusTabs=homeFlowStage===2;
  toolbar.hidden=!showStatusTabs;
  toolbar.setAttribute("aria-hidden",String(!showStatusTabs));
  toolbar.style.display=showStatusTabs?"flex":"none";

  const legacyPanel=byId("rolesPanel");if(legacyPanel){legacyPanel.hidden=true;legacyPanel.style.display="none";}
}


if(!window.__attendanceStatusToolbarBound){
  window.__attendanceStatusToolbarBound=true;
  document.addEventListener("click",event=>{
    const button=event.target.closest("#attendanceStatusToolbar [data-role]");
    if(!button)return;
    event.preventDefault();
    chosenRole=button.dataset.role;chosenMemberId="";chosenMemberIds.clear();
    renderRoles();renderMembers();updateSelection();updateProbeWorkflow();
  });
}

function setHomeFlowStage(stage){
  homeFlowStage=stage;
  const sessionPanel=document.querySelector("#attendanceView .home-session-type-panel");
  const workspace=byId("attendanceSelectionWorkspace");
  const tactics=byId("tacticsView");
  const finish=byId("homeStageFinish");

  const applyVisibility=(element,visible,display)=>{
    if(!element)return;
    element.hidden=!visible;
    element.style.removeProperty("display");
    element.style.removeProperty("visibility");
    element.style.removeProperty("opacity");
    element.style.removeProperty("pointer-events");
    if(visible){element.style.display=display;element.removeAttribute("aria-hidden");}
    else{element.style.display="none";element.setAttribute("aria-hidden","true");}
  };

  applyVisibility(sessionPanel,stage===1,"block");
  applyVisibility(workspace,stage===2,"grid");
  applyVisibility(byId("rfidCsvImport"),stage===2,"block");
  applyVisibility(byId("attendanceStatusToolbar"),stage===2,"flex");
  applyVisibility(finish,stage===3&&sessionType!=="Allgemeine Probe"&&sessionType!=="Einsatz","block");
  applyVisibility(byId("operationReportForm"),stage===3&&sessionType==="Einsatz","block");
  applyVisibility(tactics,stage===3&&sessionType==="Allgemeine Probe","block");
  document.querySelectorAll("#attendanceView .flow-stage-2-support").forEach(element=>applyVisibility(element,stage===2,""));

  if(stage===1){
    if(!todayEntries().length)currentProbeDate=systemToday();
    pendingSessionType="";
    if(byId("sessionTypes"))delete byId("sessionTypes").dataset.selectedSessionType;
    byId("sessionTypes")?.querySelectorAll("[data-session-type]").forEach(button=>{
      button.classList.remove("selected");button.setAttribute("aria-pressed","false");
    });
    const next=byId("continueToAttendanceButton");
    if(next){next.disabled=true;next.textContent="Weiter zu Schritt 2";}
    window.__sessionTypeTransitionRunning=false;
    window.syncHeaderProbeSummary?.();
  }

  if(stage===3&&sessionType==="Einsatz"){showOperationForm();}
  if(stage===3&&sessionType==="Allgemeine Probe"){
    tacticsClosingPending=true;renderTactics();byId("tacticsCloseActions").hidden=false;
  }
  updatePrimaryAction();
  window.syncHeaderProbeSummary?.();
  const progress=byId("homeFlowProgress");if(progress)progress.dataset.currentStage=String(stage);
  document.querySelectorAll("[data-flow-indicator]").forEach(item=>{
    const number=Number(item.dataset.flowIndicator);
    const isCurrent=number===stage;
    item.classList.toggle("current",isCurrent);
    item.classList.toggle("completed",number<stage);
    item.classList.toggle("upcoming",number>stage);
    if(isCurrent){item.setAttribute("aria-current","step");item.disabled=false;}
    else{item.removeAttribute("aria-current");item.disabled=!(number===1||(number===2&&stage===3));}
    item.style.setProperty("opacity","1","important");
  });
}

function continueToAttendance(){
  if(window.__sessionTypeTransitionRunning)return;
  const selectedButton=byId("sessionTypes")?.querySelector("[data-session-type].selected,[data-session-type][aria-pressed='true']");
  const type=pendingSessionType||byId("sessionTypes")?.dataset.selectedSessionType||selectedButton?.dataset.sessionType||"";
  if(!type)return showToast("Bitte zuerst eine Terminart auswählen.","error");
  window.__sessionTypeTransitionRunning=true;
  sessionType=type;
  if(sessionType==="Einsatz")startOperationSession();
  chosenMemberId="";chosenMemberIds.clear();chosenRole="Anwesend";
  tacticsClosingPending=false;currentTacticsAssignments=new Map();currentTacticsSlots=[];tacticsDragSource=null;

  setHomeFlowStage(2);

  const renderErrors=[];
  const safeRender=(name,fn)=>{
    try{fn();}
    catch(error){renderErrors.push(name);console.error(`${name} fehlgeschlagen`,error);}
  };
  safeRender("Terminart",renderSessionType);
  safeRender("Mitglieder",renderMembers);
  safeRender("Statusreiter",renderRoles);
  safeRender("Anmeldungen",renderEntries);
  safeRender("Auswahl",updateSelection);
  safeRender("Arbeitsablauf",updateProbeWorkflow);
  const label=byId("stage2Heading")?.querySelector("small");if(label)label.textContent=sessionType;
  window.syncHeaderProbeSummary?.();

  const workspace=byId("attendanceSelectionWorkspace");
  if(workspace){
    workspace.hidden=false;
    workspace.style.removeProperty("display");
    workspace.style.display="grid";
    workspace.removeAttribute("aria-hidden");
    requestAnimationFrame(()=>workspace.scrollIntoView({behavior:"smooth",block:"start"}));
  }
  if(renderErrors.length)showToast(`Schritt 2 geöffnet. Nicht geladen: ${renderErrors.join(", ")}.`,"error");
  window.__sessionTypeTransitionRunning=false;
}

function ensureStep3ConfirmDialog(){
  let dialog=byId("step3ConfirmDialog");
  if(dialog)return dialog;
  dialog=document.createElement("dialog");
  dialog.id="step3ConfirmDialog";
  dialog.className="step3-confirm-dialog";
  dialog.innerHTML=`<form method="dialog"><h3>Anwesenheitserfassung abschließen?</h3><p id="step3ConfirmSummary">Die gespeicherten Teilnahmen werden übernommen.</p><p class="step3-confirm-note">Schritt 2 kann anschließend über die obere Schrittanzeige wieder geöffnet werden.</p><div class="step3-confirm-actions"><button class="outline-button" value="cancel" type="submit">Abbrechen</button><button class="primary-button" id="confirmGoToStep3Button" value="default" type="button">Weiter zu Schritt 3</button></div></form>`;
  document.body.appendChild(dialog);
  byId("confirmGoToStep3Button").addEventListener("click",()=>{
    dialog.close();
    const finishType=byId("homeStageFinishType");if(finishType)finishType.textContent=sessionType;
    setHomeFlowStage(3);
    const target=sessionType==="Allgemeine Probe"?byId("tacticsView"):sessionType==="Einsatz"?byId("operationReportForm"):byId("homeStageFinish");
    requestAnimationFrame(()=>target?.scrollIntoView({behavior:"smooth",block:"start"}));
  });
  return dialog;
}
function ensureStagedHomeFlow(){
  const attendance=byId("attendanceView"),workspace=byId("attendanceSelectionWorkspace"),sessionPanel=attendance?.querySelector(".home-session-type-panel");
  if(!attendance||!workspace||!sessionPanel)return;
  sessionPanel.classList.add("home-flow-card","home-flow-stage-1");
  if(!byId("homeFlowProgress")){const progress=document.createElement("nav");progress.id="homeFlowProgress";progress.className="home-flow-progress";progress.setAttribute("aria-label","Probenablauf");progress.innerHTML=`<button type="button" data-flow-indicator="1"><b>1</b><span>Terminart</span></button><i></i><button type="button" data-flow-indicator="2" disabled><b>2</b><span>Anwesenheit</span></button><i></i><button type="button" data-flow-indicator="3" disabled><b>3</b><span>Abschluss</span></button>`;sessionPanel.parentElement.insertBefore(progress,sessionPanel);progress.querySelector('[data-flow-indicator="1"]').addEventListener("click",()=>{setHomeFlowStage(1);requestAnimationFrame(()=>{sessionPanel.scrollIntoView({behavior:"smooth",block:"center"});sessionPanel.querySelector("[data-session-type]")?.focus();});});progress.querySelector('[data-flow-indicator="2"]').addEventListener("click",()=>{if(homeFlowStage!==3)return;setHomeFlowStage(2);requestAnimationFrame(()=>(byId("homeFlowProgress")||workspace)?.scrollIntoView({behavior:"smooth",block:"start"}));showToast("Schritt 2 ist wieder geöffnet. Bereits gespeicherte Teilnahmen bleiben erhalten.");});}

  const title=sessionPanel.querySelector("h2,h3");if(title)title.textContent="Terminart auswählen";
  const hint=byId("sessionHint");if(hint)hint.textContent="Terminart auswählen und anschließend zu Schritt 2 wechseln.";
  if(!byId("continueToAttendanceButton")){
    const actions=document.createElement("div");actions.className="session-continue-actions";
    actions.innerHTML=`<button id="continueToAttendanceButton" class="primary-button" type="button" disabled>Weiter zu Schritt 2</button>`;
    sessionPanel.appendChild(actions);
    byId("continueToAttendanceButton").addEventListener("click",continueToAttendance);
  }
  const step=sessionPanel.querySelector(".step");if(step)step.textContent="1";
  workspace.classList.add("home-flow-card","home-flow-stage-2");
  if(!byId("stage2Heading")){const h=document.createElement("div");h.id="stage2Heading";h.className="flow-stage-heading";workspace.prepend(h);}
  const stage2Heading=byId("stage2Heading");if(stage2Heading)stage2Heading.innerHTML=`<span>2</span><div><strong>Anwesenheit erfassen</strong><small>${escapeHtml(sessionType)}</small></div>`;
  if(stage2Heading&&!byId("probeDateInput")){const dateWrap=document.createElement("label");dateWrap.className="probe-date-control";dateWrap.innerHTML=`<span>Probetermin</span><input id="probeDateInput" type="date" value="${escapeHtml(today())}" max="${escapeHtml(systemToday())}">`;stage2Heading.appendChild(dateWrap);byId("probeDateInput").addEventListener("change",event=>{if(todayEntries().length){event.target.value=currentProbeDate;return showToast("Das Datum kann nach der ersten Anmeldung nicht mehr geändert werden.","error");}currentProbeDate=event.target.value||systemToday();renderEntries();renderMembers();updatePrimaryAction();});}
  const step3ActionButton=byId("exportResetButton");
  if(step3ActionButton){
    let step3Action=byId("step3ActionArea");
    if(!step3Action){
      step3Action=document.createElement("section");
      step3Action.id="step3ActionArea";
      step3Action.className="step-3-action-area";
      step3Action.innerHTML=`<div class="step3-action-copy"><strong>Anwesenheit vollständig?</strong><span id="step3ActionSummary">Noch keine Teilnahme gespeichert.</span><small>Die Einträge können über Schritt 2 später erneut bearbeitet werden.</small></div>`;
    }
    step3ActionButton.textContent="Weiter zu Schritt 3";
    step3ActionButton.classList.add("step-3-action-button");
    step3Action.appendChild(step3ActionButton);
    workspace.appendChild(step3Action);
    step3Action.hidden=false;
    step3Action.removeAttribute("aria-hidden");
  }
  const entriesPanel=byId("entries")?.closest("article,section,.panel");if(entriesPanel){entriesPanel.classList.add("flow-stage-2-support","today-entries-panel");
    const controls=byId("saveButton")?.closest(".batch-selection-controls");
    if(controls&&!byId("desktopSaveButtonDock")){const dock=document.createElement("div");dock.id="desktopSaveButtonDock";dock.className="desktop-save-button-dock flow-stage-2-support";entriesPanel.insertAdjacentElement("afterend",dock);dock.appendChild(controls);}
  }
  const resetPanel=byId("resetTodayParticipantsButton")?.closest("article,section,.panel");if(resetPanel)resetPanel.classList.add("flow-stage-2-support");
  if(!byId("homeStageFinish")){
    const finish=document.createElement("section");finish.id="homeStageFinish";finish.className="panel home-stage-finish";finish.hidden=true;
    finish.innerHTML=`<div class="flow-stage-heading"><span>3</span><div><strong>Probe abschließen</strong><small id="homeStageFinishType"></small></div></div><p>Die Anwesenheit ist abgeschlossen. Thema eintragen und Bericht erzeugen.</p><button class="primary-button" id="homeStageFinishButton" type="button">Probe abschließen · CSV + PDF</button>`;
    attendance.appendChild(finish);byId("homeStageFinishButton").addEventListener("click",requestCloseProbe);
  }
  const step3Button=byId("exportResetButton");
  if(step3Button&&!step3Button.dataset.step3Bound){
    step3Button.dataset.step3Bound="true";
    step3Button.addEventListener("click",event=>{
      if(homeFlowStage!==2)return;
      event.preventDefault();event.stopImmediatePropagation();
      if(!todayEntries().length)return showToast("Bitte mindestens eine Teilnahme erfassen.","error");
      const dialog=ensureStep3ConfirmDialog(),count=todayEntries().length,summary=byId("step3ConfirmSummary");
      if(summary)summary.textContent=`${count} ${count===1?"Teilnahme ist":"Teilnahmen sind"} gespeichert. Soll Schritt 3 jetzt geöffnet werden?`;
      if(typeof dialog.showModal==="function")dialog.showModal();else if(confirm(summary?.textContent||"Weiter zu Schritt 3?"))byId("confirmGoToStep3Button")?.click();
    },true);
  }
  setHomeFlowStage(1);
}

/* Version 2.0: optionaler RFID-CSV-Import */
let pendingRfidImport=[];
function normalizeRfidValue(value){return String(value||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");}
function parseRfidCsv(text){
  const lines=String(text||"").replace(/^\uFEFF/,"").split(/\r?\n/).filter(line=>line.trim());
  if(lines.length<2)throw new Error("Die CSV enthält keine Datensätze.");
  const delimiter=(lines[0].match(/;/g)||[]).length>=(lines[0].match(/,/g)||[]).length?";":",";
  const split=line=>{const out=[];let cell="",quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(ch===delimiter&&!quoted){out.push(cell.trim());cell="";}else cell+=ch;}out.push(cell.trim());return out;};
  const headers=split(lines[0]).map(normalizeRfidValue);
  const find=(names)=>headers.findIndex(h=>names.includes(h));
  const indexes={rfid:find(["rfid","rfidid","chip","chipid","kartenid","kartennummer","tag","uid","transponder"]),name:find(["name","vollstandigername","mitglied","person"]),first:find(["vorname","firstname","givenname"]),last:find(["nachname","lastname","surname","familienname"]),time:find(["uhrzeit","zeit","time","anmeldezeit","timestamp"])};
  if(indexes.rfid<0&&indexes.name<0&&(indexes.first<0||indexes.last<0))throw new Error("Keine RFID- oder Namensspalte erkannt.");
  return lines.slice(1).map((line,row)=>{const cells=split(line);return{row:row+2,rfid:indexes.rfid>=0?cells[indexes.rfid]:"",name:indexes.name>=0?cells[indexes.name]:[indexes.first>=0?cells[indexes.first]:"",indexes.last>=0?cells[indexes.last]:""].filter(Boolean).join(" "),time:indexes.time>=0?cells[indexes.time]:""};}).filter(item=>item.rfid||item.name);
}
function matchRfidMember(item){
  const tag=normalizeRfidValue(item.rfid),name=normalizeRfidValue(item.name);
  if(tag){const byTag=members.filter(m=>normalizeRfidValue(m.rfid||m.rfidId||m.cardId)===tag);if(byTag.length===1)return byTag[0];}
  if(name){const byName=members.filter(m=>[nameForTile(m),nameForStorage(m),`${m.firstName||""} ${m.lastName||""}`,`${m.lastName||""} ${m.firstName||""}`].some(v=>normalizeRfidValue(v)===name));if(byName.length===1)return byName[0];}
  return null;
}
function ensureRfidCsvImport(){
  if(byId("rfidCsvImport")||!byId("attendanceView"))return;
  const panel=document.createElement("article");panel.id="rfidCsvImport";panel.className="rfid-import-card";
  panel.hidden=homeFlowStage!==2;
  panel.setAttribute("aria-hidden",homeFlowStage===2?"false":"true");
  panel.innerHTML=`<div class="rfid-import-copy"><strong>RFID-CSV importieren</strong><small>Optional: externe Anmeldungen übernehmen</small></div><div class="rfid-import-actions"><input id="rfidCsvFile" type="file" accept=".csv,text/csv" hidden><button id="rfidCsvChoose" class="outline-button" type="button">CSV auswählen</button></div><div id="rfidCsvPreview" class="rfid-import-preview" hidden></div>`;
  const workspace=byId("attendanceSelectionWorkspace")||byId("attendanceView").querySelector(".view-content")||byId("attendanceView");
  workspace.insertAdjacentElement("beforebegin",panel);
  byId("rfidCsvChoose").addEventListener("click",()=>byId("rfidCsvFile").click());
  byId("rfidCsvFile").addEventListener("change",async event=>{const file=event.target.files?.[0];if(!file)return;try{const rows=parseRfidCsv(await file.text()),recorded=new Set(todayEntries().flatMap(e=>[normalizeRfidValue(e.storedName),normalizeRfidValue(e.displayName)])),seen=new Set();pendingRfidImport=rows.map(row=>{const member=matchRfidMember(row);const key=member?normalizeRfidValue(nameForStorage(member)):"";let state="unknown";if(member){state=recorded.has(key)||seen.has(key)?"duplicate":"ready";seen.add(key);}return{...row,member,state};});const ready=pendingRfidImport.filter(x=>x.state==="ready"),unknown=pendingRfidImport.filter(x=>x.state==="unknown"),duplicate=pendingRfidImport.filter(x=>x.state==="duplicate");const preview=byId("rfidCsvPreview");preview.hidden=false;preview.innerHTML=`<strong>Vorschau</strong><p>${ready.length} bereit · ${unknown.length} unbekannt · ${duplicate.length} bereits erfasst/doppelt</p>${unknown.length?`<details><summary>Unbekannte Datensätze anzeigen</summary><ul>${unknown.map(x=>`<li>Zeile ${x.row}: ${escapeHtml(x.name||x.rfid||"Ohne Kennung")}</li>`).join("")}</ul></details>`:""}<div class="rfid-import-actions"><button id="rfidCsvApply" class="primary-button" type="button" ${ready.length?"":"disabled"}>${ready.length} Anwesenheiten übernehmen</button><button id="rfidCsvCancel" class="outline-button" type="button">Abbrechen</button></div>`;byId("rfidCsvCancel").onclick=()=>{preview.hidden=true;preview.innerHTML="";pendingRfidImport=[];event.target.value="";};byId("rfidCsvApply").onclick=()=>applyRfidCsvImport();}catch(error){showToast(error.message||"Die RFID-CSV konnte nicht gelesen werden.","error");}finally{event.target.value="";}});
}
function applyRfidCsvImport(){
  const ready=pendingRfidImport.filter(x=>x.state==="ready"&&x.member);if(!ready.length)return;
  ready.forEach(item=>entries.unshift({id:makeId(),date:today(),time:/^\d{1,2}:\d{2}/.test(item.time)?item.time.slice(0,5):new Date().toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"}),displayName:nameForTile(item.member),storedName:nameForStorage(item.member),role:"",status:"Anwesend",sessionType,source:"RFID-CSV"}));
  saveEntries();renderEntries();renderMembers();updateSelection();updateProbeWorkflow();
  const preview=byId("rfidCsvPreview");if(preview){preview.hidden=true;preview.innerHTML="";}pendingRfidImport=[];showToast(`${ready.length} RFID-Anwesenheit${ready.length===1?"":"en"} übernommen.`);
}

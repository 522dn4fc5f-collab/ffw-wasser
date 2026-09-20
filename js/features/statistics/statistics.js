function parseCsvRows(content) { return CsvEngine.parse(content); }
function statisticsArchiveData() {
  return csvArchive.map(item => ({ item, rows: parseCsvRows(item.content) })).filter(data => data.rows.length);
}
function renderMetric(containerId, label, value, tone = "neutral") {
  return `<div class="metric-row metric-${tone}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}
function renderStatistics() {
  populateIndividualMemberSelect();
  const year = String(new Date().getFullYear());
  const all = statisticsArchiveData();
  const yearData = all.filter(data => String(data.rows[0]?.date || data.item.createdAt || "").startsWith(year));
  const activeMembers = members.filter(member => !member.ageDepartment);
  const ageMembers = members.filter(member => member.ageDepartment);
  const rows = yearData.flatMap(data => data.rows);
  const eligibleRows = rows.filter(row => activeMembers.some(member => nameForStorage(member) === row.name || nameForTile(member) === row.name));
  const presentRows = eligibleRows.filter(row => row.status === "Anwesend");
  const excusedRows = eligibleRows.filter(row => row.status === "Entschuldigt");
  const missingRows = eligibleRows.filter(row => row.status === "Fehlt");
  const attendanceRate = eligibleRows.length ? (presentRows.length / eligibleRows.length * 100) : null;
  byId("yearAttendanceRate").textContent = attendanceRate === null ? "–" : `${attendanceRate.toFixed(1).replace(".", ",")} %`;
  byId("yearAttendanceDetail").textContent = `${presentRows.length} anwesend von ${eligibleRows.length} möglichen Teilnahmen`;
  byId("teamStrength").textContent = activeMembers.length;
  byId("teamStrengthDetail").textContent = `${activeMembers.length} aktive Mitglieder`;
  byId("yearProbeCount").textContent = yearData.length;
  byId("yearProbeDetail").textContent = `${all.length} Probe${all.length === 1 ? "" : "n"} insgesamt im Archiv`;
  const average = yearData.length ? presentRows.length / yearData.length : null;
  byId("averageAttendance").textContent = average === null ? "–" : average.toFixed(1).replace(".", ",");
  byId("averageAttendanceDetail").textContent = `anwesende Einsatzkräfte je Probe`;
  const ageRows = rows.filter(row => ageMembers.some(member => nameForStorage(member) === row.name || nameForTile(member) === row.name));
  const agePresentRows = ageRows.filter(row => row.status === "Anwesend");
  const ageExcusedRows = ageRows.filter(row => row.status === "Entschuldigt");
  const ageMissingRows = ageRows.filter(row => row.status === "Fehlt");
  const ageRate = ageRows.length ? agePresentRows.length / ageRows.length * 100 : null;
  byId("ageTeamStrength").textContent = ageMembers.length;
  byId("ageAttendanceRate").textContent = ageRate === null ? "–" : `${ageRate.toFixed(1).replace(".", ",")} %`;
  byId("ageAttendanceDetail").textContent = ageRows.length ? `${agePresentRows.length} anwesend von ${ageRows.length} möglichen Teilnahmen` : "Noch keine Teilnahmen";
  byId("ageAverageAttendance").textContent = yearData.length ? (agePresentRows.length / yearData.length).toFixed(1).replace(".", ",") : "–";
  byId("agePresentCount").textContent = agePresentRows.length;
  byId("ageStatusDetail").textContent = `${ageExcusedRows.length} entschuldigt · ${ageMissingRows.length} fehlt`;
  const ageVisits = new Map(ageMembers.map(member => [nameForStorage(member), 0]));
  agePresentRows.forEach(row => { if (ageVisits.has(row.name)) ageVisits.set(row.name, ageVisits.get(row.name) + 1); });
  byId("ageAttendanceRanking").innerHTML = [...ageVisits.entries()].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0],"de")).map(([name,count],index)=>renderMetric("", `${index+1}. ${name}`, `${count} Teilnahme${count===1?"":"n"}`, count>0?"good":"neutral")).join("");
  byId("ageAttendanceEmpty").hidden = ageMembers.length > 0;
  const dates = yearData.map(data => data.rows[0]?.date).filter(Boolean).sort();
  byId("statisticsPeriod").textContent = yearData.length ? `Auswertung ${year}${dates.length ? ` · ${dates[0]} bis ${dates[dates.length - 1]}` : ""}` : `Noch keine abgeschlossene Probe für ${year} im lokalen Archiv.`;

  const memberStats=activeMembers.map(member=>{
    const names=new Set([nameForStorage(member),nameForTile(member)]);
    const personalRows=rows.filter(row=>names.has(row.name));
    const relevant=personalRows.filter(row=>row.status !== "Betrifft nicht");
    const present=relevant.filter(row=>row.status === "Anwesend");
    const organization=present.filter(row=>row.role === "Organisation").length;
    return {name:nameForStorage(member),count:present.length,relevant:relevant.length,organization,operational:present.length-organization,percent:relevant.length?present.length/relevant.length*100:0};
  });
  const ranked=memberStats.filter(item=>item.count>0).sort((a,b)=>b.percent-a.percent||b.count-a.count||a.name.localeCompare(b.name,"de")).slice(0,5);
  let previousKey="",competitionRank=0;
  ranked.forEach((item,index)=>{const key=`${item.percent.toFixed(6)}|${item.count}`;if(key !== previousKey) competitionRank=index+1;item.rank=competitionRank;previousKey=key;});
  const medals={1:"🥇",2:"🥈",3:"🥉"},medalClasses={1:"ranking-gold",2:"ranking-silver",3:"ranking-bronze"};
  const top=byId("topVisitors");
  top.innerHTML=ranked.map(item=>{const pc=`${item.percent.toFixed(1).replace(".",",")} %`;const medal=medals[item.rank]?`<span class="ranking-trophy ${medalClasses[item.rank]}" aria-label="Platz ${item.rank}">${medals[item.rank]}</span>`:"";return `<div class="ranking-row ${medalClasses[item.rank]||""}"><span class="ranking-position">${item.rank}</span>${medal}<span class="ranking-name">${escapeHtml(item.name)}<small>Einsatz ${item.operational} · Organisation ${item.organization}</small></span><strong><span>${item.count} / ${item.relevant}</span><small>${pc} der betreffenden Proben</small></strong></div>`;}).join("");
  byId("topVisitorsEmpty").hidden = ranked.length > 0;

  const targets = getRoleTargets();
  const normalizedRole = role => role.startsWith("Maschinist") ? "Maschinist" : role;
  const actualCounts = new Map();
  presentRows.forEach(row => {
    const role = normalizedRole(row.role || "");
    if (!AVAILABLE_ROLES.includes(role)) return;
    const key = `${row.name}|||${role}`;
    actualCounts.set(key, (actualCounts.get(key) || 0) + 1);
  });
  const targetRows = [];
  activeMembers.forEach(member => {
    const name = nameForStorage(member);
    getMemberRoles(member).forEach(role => {
      const target = targets[role] || 0;
      if (target <= 0) return;
      const actual = actualCounts.get(`${name}|||${role}`) || 0;
      const remaining = Math.max(0, target - actual);
      targetRows.push({ name, role, target, actual, remaining });
    });
  });
  const openTargets = targetRows.filter(item => item.remaining > 0).sort((a,b) => a.name.localeCompare(b.name,"de") || b.remaining-a.remaining || a.role.localeCompare(b.role,"de"));
  const groupedTargets = new Map();
  openTargets.forEach(item => {
    if (!groupedTargets.has(item.name)) groupedTargets.set(item.name, []);
    groupedTargets.get(item.name).push(item);
  });
  const openBox = byId("openFunctions");
  openBox.innerHTML = [...groupedTargets.entries()].map(([name, items]) => {
    const totalRemaining = items.reduce((sum, item) => sum + item.remaining, 0);
    return `<details class="participant-target-card"><summary><div><strong>${escapeHtml(name)}</strong><span>${items.length} offene${items.length === 1 ? "s" : ""} Funktionsziel${items.length === 1 ? "" : "e"}</span></div><b>noch ${totalRemaining}</b><i aria-hidden="true"></i></summary><div class="participant-target-items">${items.map(item => `<div><span>${escapeHtml(item.role)}</span><small>${item.actual} / ${item.target}</small><strong>noch ${item.remaining}</strong></div>`).join("")}</div></details>`;
  }).join("");
  byId("openFunctionsEmpty").hidden = groupedTargets.size > 0;

  const types = new Map(); yearData.forEach(data => { const type=data.rows[0]?.sessionType || data.item.sessionType || "Unbekannt"; types.set(type,(types.get(type)||0)+1); });
  byId("probeTypes").innerHTML = [...types.entries()].sort((a,b)=>b[1]-a[1]).map(([type,count]) => renderMetric("",type,count,"blue")).join("");
  byId("probeTypesEmpty").hidden = types.size > 0;

  const topics = new Map();
  yearData.forEach(data => {
    const topic = String(data.item.topic || data.rows[0]?.topic || "").trim();
    if (topic) topics.set(topic, (topics.get(topic) || 0) + 1);
  });
  byId("probeTopics").innerHTML = [...topics.entries()].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0],"de")).map(([topic,count]) => renderMetric("",topic,count,"gold")).join("");
  byId("probeTopicsEmpty").hidden = topics.size > 0;
  byId("statusOverview").innerHTML = [renderMetric("","Anwesend",presentRows.length,"green"),renderMetric("","Entschuldigt",excusedRows.length,"gold"),renderMetric("","Fehlt",missingRows.length,"gray")].join("");
  byId("statusOverviewEmpty").hidden = eligibleRows.length > 0;
}

function exportStatisticsPdf() {
  renderStatistics();
  const originalTitle = document.title;
  const year = new Date().getFullYear();
  document.title = `Feuerwehr-Wasser_Statistik_${year}`;
  document.body.classList.add("printing-statistics");
  const cleanup = () => {
    document.body.classList.remove("printing-statistics");
    document.title = originalTitle;
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  setTimeout(() => {
    window.print();
    setTimeout(cleanup, 1500);
  }, 100);
}

function normalizeStatisticsRole(role) {
  return String(role || "").startsWith("Maschinist") ? "Maschinist" : String(role || "");
}
function populateIndividualMemberSelect() {
  const select = byId("individualMemberSelect");
  const current = select.value;
  const activeMembers = members.filter(member => !member.ageDepartment);
  select.innerHTML = `<option value="">Bitte auswählen</option>${activeMembers.map(member => `<option value="${escapeHtml(member.id)}">${escapeHtml(nameForTile(member))}</option>`).join("")}`;
  if (activeMembers.some(member => member.id === current)) select.value = current;
}
function renderIndividualStatistics(memberId) {
  const preview = byId("individualStatisticsPreview");
  const button = byId("individualStatisticsPdfButton");
  const member = members.find(item => item.id === memberId && !item.ageDepartment);
  if (!member) { preview.hidden = true; button.disabled = true; return; }
  const year = String(new Date().getFullYear());
  const yearData = statisticsArchiveData().filter(data => String(data.rows[0]?.date || data.item.createdAt || "").startsWith(year));
  const names = new Set([nameForStorage(member), nameForTile(member)]);
  const rows = yearData.flatMap(data => data.rows).filter(row => names.has(row.name));
  const present = rows.filter(row => row.status === "Anwesend");
  const excused = rows.filter(row => row.status === "Entschuldigt");
  const missing = rows.filter(row => row.status === "Fehlt");
  const total = present.length + excused.length + missing.length;
  const rate = total ? present.length / total * 100 : null;
  byId("individualMemberName").textContent = nameForTile(member);
  byId("individualStatisticsPeriod").textContent = `Kalenderjahr ${year} · ${yearData.length} abgeschlossene Probe${yearData.length === 1 ? "" : "n"}`;
  byId("individualAttendanceRate").textContent = rate === null ? "–" : `${rate.toFixed(1).replace(".", ",")} %`;
  byId("individualAttendanceDetail").textContent = total ? `${present.length} von ${total} möglichen Teilnahmen` : "Noch keine Daten";
  byId("individualPresentCount").textContent = present.length;
  byId("individualExcusedCount").textContent = excused.length;
  byId("individualMissingCount").textContent = missing.length;

  const usage = new Map();
  present.forEach(row => { const role = normalizeStatisticsRole(row.role); if (AVAILABLE_ROLES.includes(role)) usage.set(role, (usage.get(role) || 0) + 1); });
  const usageRows = [...usage.entries()].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0],"de"));
  byId("individualRoleUsage").innerHTML = usageRows.map(([role,count]) => renderMetric("",role,count,"blue")).join("");
  byId("individualRoleUsageEmpty").hidden = usageRows.length > 0;

  const targets = getRoleTargets();
  const targetRows = getMemberRoles(member).map(role => ({ role, target: targets[role] || 0, actual: usage.get(role) || 0 })).filter(item => item.target > 0);
  byId("individualRoleTargets").innerHTML = targetRows.map(item => {
    const remaining = Math.max(0, item.target-item.actual);
    const tone = remaining ? "gold" : "green";
    return `<div class="metric-row metric-${tone}"><span>${escapeHtml(item.role)}</span><strong>${item.actual} / ${item.target}${remaining ? ` · noch ${remaining}` : " · erreicht"}</strong></div>`;
  }).join("");
  byId("individualRoleTargetsEmpty").hidden = targetRows.length > 0;

  const types = new Map();
  rows.forEach(row => types.set(row.sessionType || "Unbekannt", (types.get(row.sessionType || "Unbekannt") || 0) + 1));
  byId("individualProbeTypes").innerHTML = [...types.entries()].sort((a,b)=>b[1]-a[1]).map(([type,count]) => renderMetric("",type,count,"blue")).join("");
  byId("individualProbeTypesEmpty").hidden = types.size > 0;

  const recent = rows
    .filter(row => row.status === "Anwesend" || row.status === "Entschuldigt")
    .sort((a,b) => String(b.date).localeCompare(String(a.date)) || String(b.time).localeCompare(String(a.time)))
    .slice(0,10);
  byId("individualRecentVisits").innerHTML = recent.map(row => `<div class="individual-recent-row"><span>${escapeHtml(row.date)}${row.time ? ` · ${escapeHtml(row.time)}` : ""}</span><strong>${escapeHtml(row.status)}</strong><small>${escapeHtml(row.sessionType || "Probe")}${row.topic ? ` · ${escapeHtml(row.topic)}` : ""}${row.role ? ` · ${escapeHtml(row.role)}` : ""}</small></div>`).join("");
  byId("individualRecentVisitsEmpty").hidden = recent.length > 0;

  preview.hidden = false; button.disabled = false;
}
function exportIndividualStatisticsPdf() {
  const memberId = byId("individualMemberSelect").value;
  const member = members.find(item => item.id === memberId);
  if (!member) return;
  renderIndividualStatistics(memberId);
  const originalTitle = document.title;
  document.title = `Feuerwehr-Wasser_${nameForTile(member).replace(/[^a-zA-Z0-9ÄÖÜäöüß]+/g,"-")}_Statistik_${new Date().getFullYear()}`;
  document.body.classList.add("printing-individual-statistics");
  const cleanup = () => { document.body.classList.remove("printing-individual-statistics"); document.title = originalTitle; window.removeEventListener("afterprint", cleanup); };
  window.addEventListener("afterprint", cleanup);
  setTimeout(() => { window.print(); setTimeout(cleanup,1500); },100);
}

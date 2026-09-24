function loadArray(key, fallback) {
  try {
    const value = JSON.parse(safeStorage.getItem(key));
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
function saveMembers() { safeStorage.setItem(KEYS.members, JSON.stringify(members)); scheduleCloudSync?.(); }
function saveEntries() { safeStorage.setItem(KEYS.entries, JSON.stringify(entries)); scheduleCloudSync?.(); }
function saveArchive() { safeStorage.setItem(KEYS.archive, JSON.stringify(csvArchive)); scheduleCloudSync?.(); }
function adminPassword() { return safeStorage.getItem(KEYS.password) || safeStorage.getItem(KEYS.pin) || "112"; }
function adminPin(){return adminPassword();}
function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

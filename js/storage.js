function loadArray(key, fallback) {
  try {
    const value = JSON.parse(safeStorage.getItem(key));
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
function saveMembers() { safeStorage.setItem(KEYS.members, JSON.stringify(members)); }
function saveEntries() { safeStorage.setItem(KEYS.entries, JSON.stringify(entries)); }
function saveArchive() { safeStorage.setItem(KEYS.archive, JSON.stringify(csvArchive)); }
function adminPin() { return safeStorage.getItem(KEYS.pin) || "112"; }
function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

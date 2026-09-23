"use strict";
const AVAILABLE_ROLES = ["GF", "ATF", "ATM", "WTF", "WTM", "STF", "STM", "Maschinist", "Melder"];
const ROLE_GROUPS = [
  { key: "leadership", title: "Führung", roles: ["GF"] },
  { key: "attack", title: "Angriffstrupp", roles: ["ATF", "ATM"] },
  { key: "water", title: "Wassertrupp", roles: ["WTF", "WTM"] },
  { key: "hose", title: "Schlauchtrupp", roles: ["STF", "STM"] },
  { key: "operations", title: "Sonderfunktionen", roles: ["Melder"] }
];

const DEFAULT_MEMBERS = [
  ["Bauer", "David"], ["Bauer", "Jürgen"], ["Böcherer", "Jan"], ["Böcherer", "Markus"],
  ["Böcherer", "Martin"], ["Bubber", "Flora"], ["Büker", "Mark"], ["Bürklin", "Markus"],
  ["Fuchs", "Daniel"], ["Griesenauer", "Hermann"], ["Griesenauer", "Julian"], ["Groß", "Kara"],
  ["Hacker", "Albin"], ["Kaltenbach", "Michael"], ["Kienle", "Thomas"], ["Kistner", "Andreas"],
  ["Kuscher", "Christian"], ["Lapp", "Patrick"], ["Roser", "Bernd"], ["Roser", "Mina"],
  ["Schillinger", "Michael"], ["Schulz", "Frank"], ["Schulz", "Stefan"], ["Sillmann", "Dietmar"],
  ["Sillmann", "Patrick"], ["Stich", "Harald"], ["Sulzberger", "Jannik"], ["Wehrle", "Marco"],
  ["Willaredt", "Christian"], ["Willaredt", "Daniel"], ["Willaredt", "Tim"], ["Würstlin", "Jens"],
  ["Zäh", "Markus"], ["Zurzevic", "Sasa"]
].map(([lastName, firstName], index) => ({ id: `standard-${index}`, lastName, firstName, roles: [...AVAILABLE_ROLES], ageDepartment: false, machinistVehicles: [] }));

const KEYS = { members: "fw_v5_members", entries: "fw_v5_entries", pin: "fw_v5_pin", archive: "fw_v35_csv_archive", functionEntry: "fw_v1_function_entry_enabled", roleTargets: "fw_v1_annual_role_targets" };
const byId = id => document.getElementById(id);
const systemToday = () => new Date().toLocaleDateString("sv-SE");
let currentProbeDate = systemToday();
let breathingProtectionPlanned = false;
const BREATHING_ROLES = new Set(["ATF","ATM","WTF","WTM"]);
function hasValidBreathingClearance(member,date=today()){return Boolean(member?.breathingClearance && member?.breathingClearanceUntil && member.breathingClearanceUntil>=date);}
function breathingClearanceState(member,date=systemToday()){if(!member?.breathingClearance||!member?.breathingClearanceUntil)return "none";if(member.breathingClearanceUntil<date)return "expired";const soon=new Date(date+"T12:00:00");soon.setDate(soon.getDate()+60);return member.breathingClearanceUntil<=soon.toLocaleDateString("sv-SE")?"soon":"valid";}
function driverLicenseControlDue(member,date=systemToday()){if(!Array.isArray(member?.machinistVehicles)||!member.machinistVehicles.length)return "not-machinist";if(!member.driverLicenseCheckedOn)return "missing";const checked=new Date(`${member.driverLicenseCheckedOn}T12:00:00`);if(Number.isNaN(checked.getTime()))return "missing";const due=new Date(checked);due.setFullYear(due.getFullYear()+1);const dueDate=due.toLocaleDateString("sv-SE");if(dueDate<date)return "overdue";const soon=new Date(`${date}T12:00:00`);soon.setDate(soon.getDate()+60);return dueDate<=soon.toLocaleDateString("sv-SE")?"soon":"valid";}
function driverLicenseDueDate(member){if(!member?.driverLicenseCheckedOn)return "";const due=new Date(`${member.driverLicenseCheckedOn}T12:00:00`);if(Number.isNaN(due.getTime()))return "";due.setFullYear(due.getFullYear()+1);return due.toLocaleDateString("sv-SE");}
const today = () => currentProbeDate || systemToday();
const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const nameForStorage = member => `${member.lastName}, ${member.firstName}`;
const nameForTile = member => `${member.lastName}, ${member.firstName}`;
const sortMembers = list => [...list].sort((a, b) =>
  a.lastName.localeCompare(b.lastName, "de-DE", { sensitivity: "base" }) ||
  a.firstName.localeCompare(b.firstName, "de-DE", { sensitivity: "base" })
);
function getMemberRoles(member) {
  if (!member) return [];
  const stored = Array.isArray(member.roles) ? member.roles.filter(role => AVAILABLE_ROLES.includes(role) && role !== "Maschinist") : AVAILABLE_ROLES.filter(role => role !== "Maschinist");
  const vehicles = Array.isArray(member.machinistVehicles) ? member.machinistVehicles.filter(value => value === "LF" || value === "TSF") : [];
  return vehicles.length ? [...new Set([...stored, "Maschinist"])] : stored;
}

let members;
let entries;
let csvArchive;
let chosenMemberId = "";
let chosenMemberIds = new Set();
let chosenRole = "";
let sessionType = "Allgemeine Probe";
let currentClosingTopic = "";
let homeFlowStage = 1;
let pendingSessionType = "";
let adminUnlocked = false;
let toastTimer;
let csvDirectoryHandle = null;
let backupDirectoryHandle = null;
let pdfDirectoryHandle = null;
let adminTimeoutId = null;
const ADMIN_TIMEOUT_MS = 15 * 60 * 1000;
function isFunctionEntryEnabled() { return safeStorage.getItem(KEYS.functionEntry) !== "false"; }
function getRoleTargets() {
  let stored = {};
  try { stored = JSON.parse(safeStorage.getItem(KEYS.roleTargets) || "{}"); } catch (error) { stored = {}; }
  return Object.fromEntries(AVAILABLE_ROLES.map(role => [role, Math.max(0, Math.min(99, Number.parseInt(stored[role], 10) || 0))]));
}
function saveRoleTargets(targets) {
  safeStorage.setItem(KEYS.roleTargets, JSON.stringify(Object.fromEntries(AVAILABLE_ROLES.map(role => [role, Math.max(0, Math.min(99, Number.parseInt(targets[role], 10) || 0))]))));
}


const memoryStorage = Object.create(null);
const safeStorage = (() => {
  const candidates = [];
  try { candidates.push(window.localStorage); } catch (error) {}
  try { candidates.push(window.sessionStorage); } catch (error) {}
  for (const candidate of candidates) {
    try {
      const testKey = "__fw_storage_test__";
      candidate.setItem(testKey, "1");
      candidate.removeItem(testKey);
      return {
        persistent: candidate === window.localStorage,
        getItem: key => candidate.getItem(key),
        setItem: (key, value) => candidate.setItem(key, value)
      };
    } catch (error) {}
  }
  return {
    persistent: false,
    getItem: key => Object.prototype.hasOwnProperty.call(memoryStorage, key) ? memoryStorage[key] : null,
    setItem: (key, value) => { memoryStorage[key] = String(value); }
  };
})();

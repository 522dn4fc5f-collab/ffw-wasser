(function(global){"use strict";
 function forYear(rows,year){return (rows||[]).filter(r=>String(r.date||"").startsWith(String(year)));}
 function statusCounts(rows){const count=s=>(rows||[]).filter(r=>r.status===s).length;return {present:count("Anwesend"),excused:count("Entschuldigt"),missing:count("Fehlt"),notApplicable:count("Betrifft nicht")};}
 function attendanceRate(rows){const c=statusCounts(rows),base=c.present+c.excused+c.missing;return base?Math.round(c.present/base*100):0;}
 function roleCounts(rows){const map=new Map();(rows||[]).filter(r=>r.status==="Anwesend"&&r.role).forEach(r=>map.set(r.role,(map.get(r.role)||0)+1));return map;}
 const api=Object.freeze({forYear,statusCounts,attendanceRate,roleCounts});global.StatisticsEngine=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);

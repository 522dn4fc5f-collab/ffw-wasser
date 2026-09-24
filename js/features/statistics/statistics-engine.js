(function(global){"use strict";
 function percentage(value,total){return total?Math.round(value/total*100):0;}
 function average(value,total){return total?value/total:0;}
 global.StatisticsEngine=Object.freeze({percentage,average});
 function loadScript(src){return new Promise((resolve,reject)=>{const existing=document.querySelector(`script[data-ffw-update="${src}"]`);if(existing)return resolve();const script=document.createElement("script");script.src=src;script.dataset.ffwUpdate=src;script.onload=resolve;script.onerror=()=>reject(new Error(`Update-Datei konnte nicht geladen werden: ${src}`));document.head.appendChild(script);});}
 async function loadTerminPackageUpdate(){try{await loadScript("js/vendor/jszip.min.js?v=3.10.1");await loadScript("js/features/reports/zip-terminpakete.js?v=20260920-2183");}catch(error){console.error(error);}}
 if(document.readyState==="complete")loadTerminPackageUpdate();else addEventListener("load",loadTerminPackageUpdate,{once:true});
})(typeof globalThis!=="undefined"?globalThis:this);

(function(global){
  "use strict";
  function percentage(part,total){return total>0?part/total*100:null;}
  function average(total,count){return count>0?total/count:null;}
  global.StatisticsEngine=Object.freeze({percentage,average});
  if(typeof module!=="undefined"&&module.exports)module.exports=global.StatisticsEngine;
})(typeof globalThis!=="undefined"?globalThis:this);

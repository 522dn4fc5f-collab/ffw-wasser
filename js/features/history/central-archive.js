(function(global){
  "use strict";
  const FILE_NAME="berichtsarchiv.json";
  let writeChain=Promise.resolve();
  let centralSyncActive=false;

  function itemTimestamp(item){
    return String(item?.correctedAt||item?.createdAt||"");
  }
  function mergeArchiveItems(remoteItems,localItems){
    const map=new Map();
    [...(remoteItems||[]),...(localItems||[])].forEach(item=>{
      if(!item||!item.id||typeof item.content!=="string")return;
      const previous=map.get(item.id);
      if(!previous||itemTimestamp(item)>=itemTimestamp(previous))map.set(item.id,item);
    });
    return [...map.values()].sort((a,b)=>itemTimestamp(b).localeCompare(itemTimestamp(a)));
  }
  async function ensureArchiveFolderPermission(handle){
    if(!handle)return false;
    const options={mode:"readwrite"};
    if(typeof handle.queryPermission==="function"&&await handle.queryPermission(options)==="granted")return true;
    return typeof handle.requestPermission==="function"&&await handle.requestPermission(options)==="granted";
  }
  async function readCentralArchive(handle=global.csvDirectoryHandle){
    if(!handle||!await ensureArchiveFolderPermission(handle))return null;
    try{
      const fileHandle=await handle.getFileHandle(FILE_NAME);
      const file=await fileHandle.getFile();
      const payload=JSON.parse(await file.text());
      if(payload?.format!=="FFW-Zentrales-Berichtsarchiv"||!Array.isArray(payload.items))throw new Error("invalid archive");
      return payload;
    }catch(error){
      if(error?.name==="NotFoundError")return {format:"FFW-Zentrales-Berichtsarchiv",version:1,updatedAt:"",items:[]};
      throw error;
    }
  }
  async function writeCentralArchiveNow(handle=global.csvDirectoryHandle){
    if(!handle||!await ensureArchiveFolderPermission(handle))return false;
    const fileHandle=await handle.getFileHandle(FILE_NAME,{create:true});
    const writable=await fileHandle.createWritable();
    const payload={format:"FFW-Zentrales-Berichtsarchiv",version:1,updatedAt:new Date().toISOString(),items:global.csvArchive||[]};
    await writable.write(JSON.stringify(payload,null,2));
    await writable.close();
    return true;
  }
  function queueCentralArchiveWrite(){
    if(centralSyncActive||!global.csvDirectoryHandle)return Promise.resolve(false);
    writeChain=writeChain.then(()=>writeCentralArchiveNow()).catch(error=>{
      console.error("Zentrales Berichtsarchiv konnte nicht gespeichert werden.",error);
      global.showToast?.("Zentrales Berichtsarchiv konnte nicht in OneDrive gespeichert werden.","error");
      return false;
    });
    return writeChain;
  }
  async function syncCentralArchiveFromFolder(options={notify:false}){
    const handle=global.csvDirectoryHandle;
    if(!handle)return false;
    centralSyncActive=true;
    try{
      const remote=await readCentralArchive(handle);
      if(!remote)return false;
      global.csvArchive=mergeArchiveItems(remote.items,global.csvArchive||[]);
      originalSaveArchive?.();
      await writeCentralArchiveNow(handle);
      global.renderArchive?.();
      if(options.notify)global.showToast?.(`${global.csvArchive.length} zentrale Berichte wurden geladen.`);
      return true;
    }catch(error){
      console.error("Zentrales Berichtsarchiv konnte nicht geladen werden.",error);
      if(options.notify)global.showToast?.("Zentrales Berichtsarchiv konnte nicht geladen werden.","error");
      return false;
    }finally{
      centralSyncActive=false;
    }
  }

  const originalSaveArchive=global.saveArchive;
  if(typeof originalSaveArchive==="function"){
    global.saveArchive=function(){
      const result=originalSaveArchive.apply(this,arguments);
      queueCentralArchiveWrite();
      return result;
    };
  }

  global.CentralArchive=Object.freeze({FILE_NAME,mergeArchiveItems,readCentralArchive,writeCentralArchiveNow,queueCentralArchiveWrite,syncCentralArchiveFromFolder});
})(window);

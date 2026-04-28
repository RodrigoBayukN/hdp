// Simulate the banner
if(typeof process!=='undefined'&&process.versions){
  try{Object.defineProperty(process.versions,'node',{value:undefined,writable:true,configurable:true})}
  catch(e){
    var _ov=process.versions;
    process.versions=new Proxy(_ov,{get:function(t,p){return p==='node'?undefined:t[p]}});
  }
}

// Now check what onnxruntime would see
console.log("process.versions.node =", process.versions.node);
console.log("typeof process.versions.node =", typeof process.versions.node);
console.log("ENVIRONMENT_IS_NODE =", typeof process=="object"&&typeof process.versions=="object"&&typeof process.versions.node=="string");

// Simulate the dynamic import check
const ENVIRONMENT_IS_NODE = typeof process=="object"&&typeof process.versions=="object"&&typeof process.versions.node=="string";
console.log("Would use fs.readFileSync?", ENVIRONMENT_IS_NODE);

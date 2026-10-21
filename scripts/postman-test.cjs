const newman=require('newman');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const {createApp}=require('../src/app');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qadam-postman-'));const {app,db}=createApp(path.join(dir,'db.sqlite'));const server=app.listen(0,'127.0.0.1',()=>{
 newman.run({collection:require('../docs/Qadam.postman_collection.json'),envVar:[{key:'baseUrl',value:'http://127.0.0.1:'+server.address().port}],reporters:['cli','json'],reporter:{json:{export:path.join(__dirname,'../docs/postman-results.json')}}},(err,summary)=>{
 server.closeAllConnections();server.close(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});if(err||summary.run.failures.length)process.exitCode=1;});
 });
});

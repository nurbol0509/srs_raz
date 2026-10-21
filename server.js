const {createApp}=require('./src/app');
const {app,db}=createApp();
const port=Number(process.env.PORT||3000);
const server=app.listen(port,'127.0.0.1',()=>console.log(`Qadam Courses: http://localhost:${port}`));
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'Порт бос емес. Басқа серверді Control+C арқылы тоқтатыңыз.':error.message);db.close();process.exitCode=1;});
function stop(){server.close(()=>{db.close();process.exit(0);});server.closeIdleConnections();}
process.on('SIGINT',stop);process.on('SIGTERM',stop);

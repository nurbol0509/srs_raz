const express=require('express');
const path=require('node:path');
const {openDatabase}=require('./db');
const {createService,schemas}=require('./service');
function createApp(filename=process.env.DB_PATH||path.join(__dirname,'../data/platform.sqlite')) {
 const db=openDatabase(filename), service=createService(db), app=express();
 app.disable('x-powered-by'); app.set('view engine','ejs'); app.set('views',path.join(__dirname,'../views'));
 app.use((req,res,next)=>{res.set('X-Content-Type-Options','nosniff'); console.log(req.method,req.originalUrl);next();});
 app.use(express.json({limit:'100kb'}));
 app.use('/assets',express.static(path.join(__dirname,'../public')));
 app.use('/api',require('../routes/api')(service));
 app.use('/api',(req,res)=>res.status(404).json({error:{code:'NOT_FOUND',message:'Endpoint табылмады'}}));
 const levels={beginner:'Бастапқы',intermediate:'Орта',advanced:'Жоғары'};
 app.locals.levels=levels;
 app.get('/',(req,res)=>res.render('home',{title:'Курс каталогы',courses:service.list('courses',req.query),teachers:service.list('teachers'),q:typeof req.query.q==='string'?req.query.q:'',counts:{courses:service.list('courses').length,students:service.list('students').length,enrollments:service.list('enrollments').length}}));
 app.get('/courses/:id',(req,res)=>{const course=service.get('courses',req.params.id);res.render('course',{title:course.title,course,teacher:service.get('teachers',course.teacher_id),lessons:service.list('lessons',{course_id:String(course.id)}).sort((a,b)=>a.position-b.position),students:service.list('students')});});
 app.get('/learning',(req,res)=>res.render('learning',{title:'Оқу прогресі',enrollments:service.list('enrollments').map(e=>({...service.summary(e.id),student:service.get('students',e.student_id),course:service.get('courses',e.course_id),lessons:service.list('lessons',{course_id:String(e.course_id)}).sort((a,b)=>a.position-b.position),progress:service.list('progress',{enrollment_id:String(e.id)})}))}));
 app.get('/manage',(req,res)=>res.render('manage',{title:'Ресурстарды басқару',schemas,teachers:service.list('teachers')}));
 app.get('/api-docs',(req,res)=>res.render('api-docs',{title:'REST API анықтамасы',resources:Object.keys(schemas)}));
 app.use((req,res)=>res.status(404).format({html:()=>res.render('error',{title:'404',status:404,message:'Бет табылмады'}),default:()=>res.json({error:{code:'NOT_FOUND',message:'Endpoint табылмады'}})}));
 app.use((err,req,res,next)=>{
  let status=err.status||500,code=err.code||'INTERNAL_ERROR',message=err.message;
  if(err.type==='entity.parse.failed'){status=400;code='INVALID_JSON';message='JSON синтаксисі қате.';}
  else if(err.type==='entity.too.large'){status=413;code='BODY_TOO_LARGE';message='Сұраныс 100 KB шегінен асты.';}
  else if(/UNIQUE constraint failed/.test(message)){status=409;code='DUPLICATE';message='Бірегей мән қайталанды (email, slug, тіркеу немесе сабақ реті).';}
  else if(/FOREIGN KEY constraint failed/.test(message)){status=409;code='RESOURCE_IN_USE';message='Байланысқан жазбалар бар. Алдымен сол жазбаларды өңдеңіз.';}
  else if(!err.status){console.error(err);message='Сервер қатесі.';code='INTERNAL_ERROR';}
  if(req.path.startsWith('/api')) res.status(status).json({error:{code,message,...(err.details?{details:err.details}:{})}});
  else res.status(status).render('error',{title:String(status),status,message});
 });
 return {app,db,service};
}
module.exports={createApp};

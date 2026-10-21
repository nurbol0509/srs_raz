const schemas = {
 teachers: { name:['text',2,100], email:['email'], specialty:['text',2,120] },
 students: { name:['text',2,100], email:['email'] },
 courses: { title:['text',3,150], slug:['slug'], description:['text',10,3000], teacher_id:['id','teachers'], category:['text',2,80], level:['enum','beginner','intermediate','advanced'], price:['int',0,10000000], duration_hours:['int',1,10000], status:['enum','draft','published','archived'] },
 lessons: { course_id:['id','courses'], title:['text',3,150], content:['text',5,10000], position:['int',1,10000], duration_minutes:['int',1,10000] },
 enrollments: { student_id:['id','students'], course_id:['id','courses'], status:['enum','active','cancelled'] },
 progress: { enrollment_id:['id','enrollments'], lesson_id:['id','lessons'], completed:['bool'] }
};
function fail(status,code,message,details) { throw Object.assign(new Error(message),{status,code,details}); }
function idNumber(value) {
 if(!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) fail(400,'INVALID_ID','ID оң бүтін сан болуы керек.');
 return Number(value);
}
function createService(db) {
 function get(table,id) {
  const row=db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(idNumber(id));
  if(!row) fail(404,'NOT_FOUND','Ресурс табылмады.');
  if(table==='progress') row.completed=Boolean(row.completed);
  if(table==='students') row.profile=db.prepare('SELECT bio,joined_at FROM student_profiles WHERE student_id=?').get(row.id);
  return row;
 }
 function list(table,query={}) {
  let rows=db.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all();
  for(const field of ['course_id','student_id','enrollment_id','teacher_id']) if(query[field]!==undefined && field in schemas[table]) {
   const id=idNumber(query[field]); rows=rows.filter(r=>r[field]===id);
  }
  if(table==='courses') {
   for(const field of ['q','category','level','status']) if(query[field]!==undefined && typeof query[field]!=='string') fail(400,'INVALID_QUERY','Іздеу параметрі мәтін болуы керек.');
   if(query.q) { const q=query.q.toLocaleLowerCase(); rows=rows.filter(r=>(r.title+' '+r.description).toLocaleLowerCase().includes(q)); }
   for(const f of ['category','level','status']) if(query[f]) rows=rows.filter(r=>r[f]===query[f]);
  }
  if(table==='progress') rows=rows.map(r=>({...r,completed:Boolean(r.completed)}));
  return rows;
 }
 function validate(table,body) {
  if(!body || typeof body!=='object' || Array.isArray(body)) fail(400,'VALIDATION_ERROR','JSON объектісі қажет.');
  const schema=schemas[table], out={}, errors={};
  for(const field of Object.keys(body)) if(!(field in schema)) errors[field]='Белгісіз немесе сервер басқаратын өріс';
  for(const [field,rule] of Object.entries(schema)) {
   const val=body[field], [type,a,b]=rule;
   if(val===undefined || val===null) { errors[field]='Міндетті өріс'; continue; }
   if(type==='text') { if(typeof val!=='string'||val.trim().length<a||val.trim().length>b) errors[field]=`${a}–${b} таңбалы мәтін`; else out[field]=val.trim(); }
   if(type==='email') { if(typeof val!=='string'||val.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) errors[field]='Email пішімі дұрыс емес'; else out[field]=val.trim().toLowerCase(); }
   if(type==='slug') { if(typeof val!=='string'||val.length>100||! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(val)) errors[field]='Латын әрпі, сан және дефис қажет'; else out[field]=val; }
   if(type==='int'||type==='id') { if(!Number.isSafeInteger(val)||val<(type==='id'?1:a)||val>(type==='id'?Number.MAX_SAFE_INTEGER:b)) errors[field]='Рұқсат етілген аралықтағы бүтін сан қажет'; else out[field]=val; }
   if(type==='enum') { if(!rule.slice(1).includes(val)) errors[field]='Рұқсат етілген мәндер: '+rule.slice(1).join(', '); else out[field]=val; }
   if(type==='bool') { if(typeof val!=='boolean') errors[field]='true немесе false қажет'; else out[field]=Number(val); }
  }
  if(Object.keys(errors).length) fail(400,'VALIDATION_ERROR','Енгізілген деректерді тексеріңіз.',errors);
  for(const [field,rule] of Object.entries(schema)) if(rule[0]==='id' && !db.prepare(`SELECT id FROM ${rule[1]} WHERE id=?`).get(out[field])) fail(400,'INVALID_REFERENCE',`${field}: байланысқан ресурс жоқ.`);
  return out;
 }
 function rules(table,data,id) {
  if(table==='enrollments') {
   if(data.status==='active' && get('courses',data.course_id).status!=='published') fail(409,'COURSE_NOT_PUBLISHED','Тек жарияланған курсқа тіркелуге болады.');
   if(id) { const old=get(table,id); if((old.course_id!==data.course_id||old.student_id!==data.student_id) && db.prepare('SELECT id FROM progress WHERE enrollment_id=? LIMIT 1').get(id)) fail(409,'HAS_PROGRESS','Прогресі бар тіркеудің студентін не курсын өзгертуге болмайды.'); }
  }
  if(table==='progress') {
   const en=get('enrollments',data.enrollment_id), lesson=get('lessons',data.lesson_id);
   if(en.status!=='active') fail(409,'ENROLLMENT_INACTIVE','Тіркеу белсенді емес.');
   if(en.course_id!==lesson.course_id) fail(409,'COURSE_MISMATCH','Сабақ тіркелген курсқа тиесілі емес.');
  }
  if(table==='lessons' && id && get('lessons',id).course_id!==data.course_id && db.prepare('SELECT id FROM progress WHERE lesson_id=? LIMIT 1').get(id)) fail(409,'HAS_PROGRESS','Прогресі бар сабақты басқа курсқа көшіруге болмайды.');
 }
 function write(table,body,id) {
  if(id) get(table,id);
  const data=validate(table,body); rules(table,data,id);
  const fields=Object.keys(data);
  db.exec('BEGIN');
  try {
   if(id) db.prepare(`UPDATE ${table} SET ${fields.map(f=>f+'=?').join(',')}${table==='progress'?",updated_at=CURRENT_TIMESTAMP":''} WHERE id=?`).run(...Object.values(data),idNumber(id));
   else { id=Number(db.prepare(`INSERT INTO ${table}(${fields.join(',')}) VALUES(${fields.map(()=>'?').join(',')})`).run(...Object.values(data)).lastInsertRowid); if(table==='students') db.prepare('INSERT INTO student_profiles(student_id) VALUES(?)').run(id); }
   db.exec('COMMIT');
  } catch(error) { db.exec('ROLLBACK'); throw error; }
  return get(table,id);
 }
 function remove(table,id) { get(table,id); db.prepare(`DELETE FROM ${table} WHERE id=?`).run(idNumber(id)); return {message:'Ресурс өшірілді',id:Number(id)}; }
 function summary(id) {
  const enrollment=get('enrollments',id);
  const total=db.prepare('SELECT count(*) AS n FROM lessons WHERE course_id=?').get(enrollment.course_id).n;
  const completed=db.prepare('SELECT count(*) AS n FROM progress p JOIN lessons l ON l.id=p.lesson_id WHERE p.enrollment_id=? AND p.completed=1 AND l.course_id=?').get(enrollment.id,enrollment.course_id).n;
  return {enrollment,total_lessons:total,completed_lessons:completed,percent:total?Math.round(completed/total*100):0};
 }
 return {get,list,write,remove,summary};
}
module.exports={createService,schemas,fail,idNumber};

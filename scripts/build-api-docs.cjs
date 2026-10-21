const fs=require('node:fs');const path=require('node:path');const {schemas}=require('../src/service');
const root=path.join(__dirname,'../docs');
const paths={},components={};
for(const [resource,fields] of Object.entries(schemas)){
 const properties={};for(const [key,rule] of Object.entries(fields)){
  const [type,a,b]=rule;properties[key]=type==='bool'?{type:'boolean'}:type==='id'?{type:'integer',minimum:1}:type==='int'?{type:'integer',minimum:a,maximum:b}:type==='enum'?{type:'string',enum:rule.slice(1)}:type==='text'?{type:'string',minLength:a,maxLength:b}:type==='email'?{type:'string',format:'email'}:{type:'string',pattern:'^[a-z0-9]+(?:-[a-z0-9]+)*$'};
 }
 components[resource+'Input']={type:'object',required:Object.keys(fields),additionalProperties:false,properties};
 const requestBody={required:true,content:{'application/json':{schema:{$ref:'#/components/schemas/'+resource+'Input'}}}};
 const responses=code=>({[code]:{description:'Success'},400:{description:'Validation error'},404:{description:'Not found'},409:{description:'Duplicate or dependency conflict'}});
 paths['/api/'+resource]={get:{summary:'List '+resource,responses:responses(200)},post:{summary:'Create '+resource,requestBody,responses:responses(201)}};
 paths['/api/'+resource+'/{id}']={parameters:[{in:'path',name:'id',required:true,schema:{type:'integer',minimum:1}}],get:{summary:'Read '+resource,responses:responses(200)},put:{summary:'Replace editable fields',requestBody,responses:responses(200)},delete:{summary:'Delete '+resource,responses:responses(200)}};
}
paths['/api/courses'].get.parameters=['q','category','level','status','teacher_id'].map(name=>({in:'query',name,schema:{type:'string'}}));
paths['/api/courses/export.xml']={get:{summary:'Course XML export',responses:{200:{description:'XML document',content:{'application/xml':{schema:{type:'string'}}}}}}};
paths['/api/enrollments/{id}/summary']={get:{summary:'Enrollment completion percentage',parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}],responses:{200:{description:'Enrollment with counts and percent'},404:{description:'Not found'}}}};
fs.writeFileSync(path.join(root,'openapi.json'),JSON.stringify({openapi:'3.0.3',info:{title:'Qadam Courses API',version:'1.0.0',description:'Local educational project. No authentication; bind to loopback.'},servers:[{url:'http://localhost:3000'}],paths,components:{schemas:components}},null,2));
function req(name,method,url,status,body,after=[],before=[]){const item={name,request:{method,url:'{{baseUrl}}'+url,header:body===undefined?[]:[{key:'Content-Type',value:'application/json'}]},event:[{listen:'test',script:{type:'text/javascript',exec:[`pm.test('Status ${status}',()=>pm.response.to.have.status(${status}));`,...after]}}]};if(body!==undefined)item.request.body={mode:'raw',raw:typeof body==='string'?body:JSON.stringify(body,null,2),options:{raw:{language:'json'}}};if(before.length)item.event.push({listen:'prerequest',script:{type:'text/javascript',exec:before}});return item;}
const course={title:'Postman API Course',slug:'postman-{{runId}}',description:'Postman generated course for CRUD demonstration.',teacher_id:1,category:'Testing',level:'beginner',price:12000,duration_hours:12,status:'published'};
const items=[
 req('01 List courses','GET','/api/courses',200),
 req('02 Search courses','GET','/api/courses?q=Node',200),
 req('03 XML export','GET','/api/courses/export.xml',200,undefined,["pm.test('XML content type',()=>pm.expect(pm.response.headers.get('Content-Type')).to.include('application/xml'));"]),
 req('04 Create course','POST','/api/courses',201,course,["if(pm.response.code===201)pm.collectionVariables.set('courseId',pm.response.json().id);"],["pm.collectionVariables.set('runId',Date.now().toString());"]),
 req('05 Read created course','GET','/api/courses/{{courseId}}',200),
 req('06 Update course','PUT','/api/courses/{{courseId}}',200,{...course,title:'Updated Postman Course',price:18000}),
 req('07 Add lesson','POST','/api/lessons',201,'{"course_id":{{courseId}},"title":"Postman lesson","content":"Learn and test the API.","position":1,"duration_minutes":30}',["if(pm.response.code===201)pm.collectionVariables.set('lessonId',pm.response.json().id);"]),
 req('08 Enroll student','POST','/api/enrollments',201,'{"student_id":2,"course_id":{{courseId}},"status":"active"}',["if(pm.response.code===201)pm.collectionVariables.set('enrollmentId',pm.response.json().id);"]),
 req('09 Complete lesson','POST','/api/progress',201,'{"enrollment_id":{{enrollmentId}},"lesson_id":{{lessonId}},"completed":true}'),
 req('10 Progress summary','GET','/api/enrollments/{{enrollmentId}}/summary',200,undefined,["pm.test('100 percent',()=>pm.expect(pm.response.json().percent).to.equal(100));"]),
 req('11 Required fields','POST','/api/courses',400,{}),
 req('12 Wrong type','POST','/api/courses',400,{...course,price:'expensive'}),
 req('13 Duplicate slug','POST','/api/courses',409,course),
 req('14 Invalid JSON','POST','/api/courses',400,'{"title":}'),
 req('15 Missing record','GET','/api/courses/999999',404),
 req('16 Referenced course cannot be deleted','DELETE','/api/courses/{{courseId}}',409),
 req('17 Delete enrollment and its progress','DELETE','/api/enrollments/{{enrollmentId}}',200),
 req('18 Delete lesson','DELETE','/api/lessons/{{lessonId}}',200),
 req('19 Delete course','DELETE','/api/courses/{{courseId}}',200),
 req('20 Confirm deleted','GET','/api/courses/{{courseId}}',404)
];
fs.writeFileSync(path.join(root,'Qadam.postman_collection.json'),JSON.stringify({info:{name:'Qadam Courses — SOZH 1',schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'},variable:[{key:'baseUrl',value:'http://localhost:3000'},{key:'courseId',value:''},{key:'lessonId',value:''},{key:'enrollmentId',value:''},{key:'runId',value:''}],item:items},null,2));

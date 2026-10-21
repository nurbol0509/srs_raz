async function api(url,method='GET',body) {
 const response=await fetch(url,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
 const data=await response.json();
 if(!response.ok) throw new Error(data.error.message+(data.error.details?'\n'+Object.entries(data.error.details).map(([k,v])=>k+': '+v).join('\n'):''));
 return data;
}
function notify(message){const box=document.querySelector('#toast');box.textContent=message;box.hidden=false;setTimeout(()=>box.hidden=true,5000);}
const enrollForm=document.querySelector('#enroll-form');
if(enrollForm) enrollForm.addEventListener('submit',async event=>{event.preventDefault();const btn=enrollForm.querySelector('button');btn.disabled=true;try{await api('/api/enrollments','POST',{student_id:Number(enrollForm.student_id.value),course_id:Number(enrollForm.dataset.courseId),status:'active'});location.href='/learning';}catch(e){notify(e.message);btn.disabled=false;}});
for(const box of document.querySelectorAll('.completion')) box.addEventListener('change',async()=>{box.disabled=true;try{await api('/api/progress'+(box.dataset.progress?'/'+box.dataset.progress:''),box.dataset.progress?'PUT':'POST',{enrollment_id:Number(box.dataset.enrollment),lesson_id:Number(box.dataset.lesson),completed:box.checked});location.reload();}catch(e){box.checked=!box.checked;box.disabled=false;notify(e.message);}});
const manager=document.querySelector('#manager');
if(manager){
 const schemas=JSON.parse(manager.dataset.schemas), select=document.querySelector('#resource'), fields=document.querySelector('#fields'), records=document.querySelector('#records'), form=document.querySelector('#resource-form'), errorBox=document.querySelector('#form-error');
 let editing=null, version=0;
 const labels={title:'Атауы',slug:'Бірегей URL атауы (slug)',description:'Сипаттама',teacher_id:'Оқытушы',category:'Санат',level:'Деңгей',price:'Бағасы (₸)',duration_hours:'Ұзақтығы (сағат)',status:'Күйі',name:'Аты-жөні',email:'Email',specialty:'Мамандығы',course_id:'Курс',content:'Сабақ мазмұны',position:'Рет нөмірі',duration_minutes:'Ұзақтығы (мин)',student_id:'Студент',enrollment_id:'Курсқа тіркелу',lesson_id:'Сабақ',completed:'Аяқталды ма?'};
 async function build(row){
  editing=row?.id||null;errorBox.hidden=true;fields.replaceChildren();document.querySelector('#form-title').textContent=editing?'Жазбаны өзгерту #'+editing:'Жаңа жазба';
  const resource=select.value, token=++version;
  for(const [key,rule] of Object.entries(schemas[resource])){
   const label=document.createElement('label');label.textContent=labels[key]||key;label.htmlFor='field-'+key;fields.append(label);
   let input;
   if(['enum','id','bool'].includes(rule[0])){
    input=document.createElement('select');
    let choices;
    if(rule[0]==='id'){
     const rows=await api('/api/'+rule[1]);if(token!==version)return;
     choices=[['','Таңдаңыз'],...rows.map(r=>[r.id,r.name||r.title||`#${r.id}: студент ${r.student_id}, курс ${r.course_id}`])];
    }else choices=rule[0]==='bool'?[['false','Жоқ'],['true','Иә']]:rule.slice(1).map(x=>[x,x]);
    choices.forEach(([value,text])=>{const option=document.createElement('option');option.value=value;option.textContent=text;input.append(option);});
   }else if(['description','content'].includes(key))input=document.createElement('textarea');
   else{input=document.createElement('input');input.type=rule[0]==='int'?'number':rule[0]==='email'?'email':'text';if(rule[0]==='int'){input.min=rule[1];input.max=rule[2];input.step=1;}}
   input.id='field-'+key;input.name=key;input.required=true;if(row)input.value=String(row[key]);fields.append(input);
  }
 }
 async function load(){const resource=select.value;const rows=await api('/api/'+resource);if(resource!==select.value)return;records.replaceChildren();if(!rows.length)records.textContent='Әзірге жазба жоқ.';
  rows.forEach(row=>{const item=document.createElement('div');item.className='record';const info=document.createElement('div'),name=document.createElement('strong'),sub=document.createElement('small');name.textContent=row.name||row.title||`Жазба #${row.id}`;sub.textContent='#'+row.id+' · '+(row.email||row.slug||JSON.stringify(row));info.append(name,sub);item.append(info);const actions=document.createElement('div');actions.className='actions';const edit=document.createElement('button');edit.className='secondary';edit.textContent='Өзгерту';edit.addEventListener('click',()=>build(row).catch(e=>notify(e.message)));const del=document.createElement('button');del.className='danger';del.textContent='Өшіру';del.addEventListener('click',async()=>{if(!confirm('Осы жазбаны өшіру керек пе?'))return;try{await api('/api/'+resource+'/'+row.id,'DELETE');await load();if(editing===row.id)await build();notify('Жазба өшірілді');}catch(e){notify(e.message);}});actions.append(edit,del);item.append(actions);records.append(item);});}
 form.addEventListener('submit',async event=>{event.preventDefault();const data={};for(const [key,rule] of Object.entries(schemas[select.value])){const value=form.elements.namedItem(key).value;data[key]=['int','id'].includes(rule[0])?Number(value):rule[0]==='bool'?value==='true':value;}const btn=form.querySelector('button');btn.disabled=true;try{await api('/api/'+select.value+(editing?'/'+editing:''),editing?'PUT':'POST',data);await load();await build();notify('Сақталды');}catch(e){errorBox.textContent=e.message;errorBox.hidden=false;}finally{btn.disabled=false;}});
 async function reset(){await build();await load();}
 select.addEventListener('change',()=>reset().catch(e=>notify(e.message)));document.querySelector('#refresh').addEventListener('click',()=>load().catch(e=>notify(e.message)));document.querySelector('#clear').addEventListener('click',()=>build().catch(e=>notify(e.message)));reset().catch(e=>notify(e.message));
}

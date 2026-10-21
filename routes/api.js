const express=require('express');
const {schemas,fail}=require('../src/service');
const escapeXml=value=>String(value).replace(/[<>&"']/g,ch=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[ch]));
module.exports=function api(service) {
 const router=express.Router();
 router.get('/courses/export.xml',(req,res)=>{
  const rows=service.list('courses',req.query);
  res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?>\n<courses>'+rows.map(row=>'<course>'+Object.entries(row).map(([k,v])=>`<${k}>${escapeXml(v)}</${k}>`).join('')+'</course>').join('')+'</courses>');
 });
 router.get('/enrollments/:id/summary',(req,res)=>res.json(service.summary(req.params.id)));
 // table names come only from the fixed schemas, never from user SQL.
 for(const table of Object.keys(schemas)) {
  router.get('/'+table,(req,res)=>res.json(service.list(table,req.query)));
  router.get('/'+table+'/:id',(req,res)=>res.json(service.get(table,req.params.id)));
  router.post('/'+table,jsonOnly,(req,res)=>{const row=service.write(table,req.body);res.location(`/api/${table}/${row.id}`).status(201).json(row);});
  router.put('/'+table+'/:id',jsonOnly,(req,res)=>res.json(service.write(table,req.body,req.params.id)));
  router.delete('/'+table+'/:id',(req,res)=>res.json(service.remove(table,req.params.id)));
  router.all('/'+table,(req,res)=>res.set('Allow','GET, POST').status(405).json({error:{code:'METHOD_NOT_ALLOWED',message:'Әдіске рұқсат жоқ'}}));
  router.all('/'+table+'/:id',(req,res)=>res.set('Allow','GET, PUT, DELETE').status(405).json({error:{code:'METHOD_NOT_ALLOWED',message:'Әдіске рұқсат жоқ'}}));
 }
 function jsonOnly(req,res,next){if(!req.is('application/json')) fail(415,'JSON_REQUIRED','Content-Type: application/json қажет.');next();}
 return router;
};

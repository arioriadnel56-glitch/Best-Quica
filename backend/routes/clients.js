const express=require('express');const {v4:uuid}=require('uuid');
const db=require('../database');const {authMiddleware}=require('../middleware');
const r=express.Router();

r.get('/',authMiddleware,(req,res)=>{
  const {q}=req.query;
  let sql='SELECT * FROM clients WHERE store_id=?', p=[req.user.storeId];
  if(q){sql+=' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';const l=`%${q}%`;p.push(l,l,l);}
  res.json(db.prepare(sql+' ORDER BY name').all(...p));
});

r.get('/:id',authMiddleware,(req,res)=>{
  const c=db.prepare('SELECT * FROM clients WHERE id=? AND store_id=?').get(req.params.id,req.user.storeId);
  if(!c) return res.status(404).json({error:'Client introuvable.'});
  const sales=db.prepare('SELECT s.*,m.name as mat_name,m.unit_detail,m.unit_gros FROM sales s LEFT JOIN materials m ON s.material_id=m.id WHERE s.client_id=? ORDER BY s.created_at DESC').all(req.params.id);
  const invs=db.prepare('SELECT * FROM invoices WHERE client_id=? ORDER BY created_at DESC').all(req.params.id);
  const totalCA=sales.reduce((a,s)=>a+s.qty*s.unit_price,0);
  const totalInv=invs.reduce((a,i)=>a+i.total_ttc,0);
  res.json({...c,sales,invoices:invs,totalCA,totalInvoiced:totalInv});
});

r.post('/',authMiddleware,(req,res)=>{
  const {name,phone,email,address,client_type,note}=req.body;
  if(!name?.trim()) return res.status(400).json({error:'Nom obligatoire.'});
  const id=uuid();
  db.prepare('INSERT INTO clients(id,store_id,name,phone,email,address,client_type,note) VALUES(?,?,?,?,?,?,?,?)').run(id,req.user.storeId,name.trim(),phone?.trim()||'',email?.trim()||'',address?.trim()||'',client_type||'detail',note?.trim()||'');
  res.status(201).json(db.prepare('SELECT * FROM clients WHERE id=?').get(id));
});

r.put('/:id',authMiddleware,(req,res)=>{
  if(!db.prepare('SELECT id FROM clients WHERE id=? AND store_id=?').get(req.params.id,req.user.storeId))
    return res.status(404).json({error:'Client introuvable.'});
  const {name,phone,email,address,client_type,note}=req.body;
  if(!name?.trim()) return res.status(400).json({error:'Nom obligatoire.'});
  db.prepare('UPDATE clients SET name=?,phone=?,email=?,address=?,client_type=?,note=? WHERE id=?').run(name.trim(),phone?.trim()||'',email?.trim()||'',address?.trim()||'',client_type||'detail',note?.trim()||'',req.params.id);
  res.json(db.prepare('SELECT * FROM clients WHERE id=?').get(req.params.id));
});

r.delete('/:id',authMiddleware,(req,res)=>{
  if(!db.prepare('SELECT id FROM clients WHERE id=? AND store_id=?').get(req.params.id,req.user.storeId))
    return res.status(404).json({error:'Client introuvable.'});
  db.prepare('UPDATE sales SET client_id=NULL WHERE client_id=?').run(req.params.id);
  db.prepare('DELETE FROM clients WHERE id=?').run(req.params.id);
  res.json({success:true});
});

module.exports=r;

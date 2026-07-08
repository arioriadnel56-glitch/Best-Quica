const express=require('express');const bcrypt=require('bcryptjs');const {v4:uuid}=require('uuid');
const db=require('../database');const {authMiddleware,ownerOnly}=require('../middleware');
const r=express.Router();
r.get('/',authMiddleware,ownerOnly,(req,res)=>res.json(db.prepare('SELECT id,full_name,email,role,created_at FROM users WHERE store_id=?').all(req.user.storeId)));
r.post('/',authMiddleware,ownerOnly,async(req,res)=>{
  const {fullName,email,password,role}=req.body;
  if(!fullName?.trim()||!email?.trim()||!password||!['owner','secretary'].includes(role))
    return res.status(400).json({error:'Données invalides.'});
  if(password.length<8) return res.status(400).json({error:'Mot de passe min. 8 caractères.'});
  if(db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase().trim()))
    return res.status(409).json({error:'E-mail déjà utilisé.'});
  const id=uuid();
  db.prepare('INSERT INTO users(id,store_id,full_name,email,password_hash,role) VALUES(?,?,?,?,?,?)').run(id,req.user.storeId,fullName.trim(),email.toLowerCase().trim(),await bcrypt.hash(password,12),role);
  res.status(201).json(db.prepare('SELECT id,full_name,email,role,created_at FROM users WHERE id=?').get(id));
});
r.delete('/:id',authMiddleware,ownerOnly,(req,res)=>{
  if(req.params.id===req.user.id) return res.status(400).json({error:'Impossible de supprimer votre propre compte.'});
  if(!db.prepare('SELECT id FROM users WHERE id=? AND store_id=?').get(req.params.id,req.user.storeId))
    return res.status(404).json({error:'Utilisateur introuvable.'});
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.json({success:true});
});
r.get('/store',authMiddleware,(req,res)=>res.json(db.prepare('SELECT * FROM stores WHERE id=?').get(req.user.storeId)));
r.put('/store',authMiddleware,ownerOnly,(req,res)=>{
  const {name,city,phone,email,address,logo_base64,currency}=req.body;
  if(!name?.trim()) return res.status(400).json({error:'Nom obligatoire.'});
  db.prepare('UPDATE stores SET name=?,city=?,phone=?,email=?,address=?,logo_base64=?,currency=? WHERE id=?').run(name.trim(),city?.trim()||'',phone?.trim()||'',email?.trim()||'',address?.trim()||'',logo_base64||'',currency||'FCFA',req.user.storeId);
  res.json(db.prepare('SELECT * FROM stores WHERE id=?').get(req.user.storeId));
});
module.exports=r;

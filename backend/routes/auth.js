const express = require('express');
const bcrypt  = require('bcryptjs');
const {v4:uuid} = require('uuid');
const db = require('../database');
const {generateToken, authMiddleware} = require('../middleware');
const r = express.Router();

r.post('/register', async (req,res) => {
  const {storeName,city,phone,fullName,email,password} = req.body;
  if (!storeName?.trim()||!city?.trim()||!fullName?.trim()||!email?.trim()||!password)
    return res.status(400).json({error:'Tous les champs obligatoires doivent être remplis.'});
  if (!email.includes('@')) return res.status(400).json({error:'E-mail invalide.'});
  if (password.length<8) return res.status(400).json({error:'Mot de passe minimum 8 caractères.'});
  if (db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase().trim()))
    return res.status(409).json({error:'E-mail déjà utilisé.'});
  try {
    const sid=uuid(), uid=uuid(), hash=await bcrypt.hash(password,12);
    db.transaction(()=>{
      db.prepare('INSERT INTO stores(id,name,city,phone) VALUES(?,?,?,?)').run(sid,storeName.trim(),city.trim(),phone?.trim()||'');
      db.prepare('INSERT INTO users(id,store_id,full_name,email,password_hash,role) VALUES(?,?,?,?,?,?)').run(uid,sid,fullName.trim(),email.toLowerCase().trim(),hash,'owner');
    })();
    const user=db.prepare('SELECT * FROM users WHERE id=?').get(uid);
    const store=db.prepare('SELECT * FROM stores WHERE id=?').get(sid);
    res.status(201).json({token:generateToken(user), user:{id:user.id,fullName:user.full_name,email:user.email,role:user.role,storeId:user.store_id}, store});
  } catch(e){console.error(e);res.status(500).json({error:'Erreur serveur.'});}
});

r.post('/login', async (req,res) => {
  const {email,password} = req.body;
  if (!email?.trim()||!password) return res.status(400).json({error:'E-mail et mot de passe requis.'});
  const user=db.prepare('SELECT * FROM users WHERE email=?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({error:'Aucun compte avec cet e-mail.'});
  if (!await bcrypt.compare(password,user.password_hash)) return res.status(401).json({error:'Mot de passe incorrect.'});
  const store=db.prepare('SELECT * FROM stores WHERE id=?').get(user.store_id);
  res.json({token:generateToken(user), user:{id:user.id,fullName:user.full_name,email:user.email,role:user.role,storeId:user.store_id}, store});
});

r.get('/me', authMiddleware, (req,res) => {
  const user=db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  const store=db.prepare('SELECT * FROM stores WHERE id=?').get(req.user.storeId);
  if(!user) return res.status(404).json({error:'Introuvable.'});
  res.json({user:{id:user.id,fullName:user.full_name,email:user.email,role:user.role,storeId:user.store_id},store});
});

module.exports = r;

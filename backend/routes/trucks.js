const express=require('express');const {v4:uuid}=require('uuid');
const db=require('../database');const {authMiddleware,ownerOnly}=require('../middleware');
const r=express.Router();
r.get('/',authMiddleware,(req,res)=>res.json(db.prepare('SELECT * FROM trucks WHERE store_id=? ORDER BY name').all(req.user.storeId)));
r.post('/',authMiddleware,ownerOnly,(req,res)=>{
  const {name,driver}=req.body;
  if(!name?.trim()||!driver?.trim()) return res.status(400).json({error:'Nom et chauffeur requis.'});
  const id=uuid();
  db.prepare('INSERT INTO trucks(id,store_id,name,driver) VALUES(?,?,?,?)').run(id,req.user.storeId,name.trim(),driver.trim());
  res.status(201).json(db.prepare('SELECT * FROM trucks WHERE id=?').get(id));
});
r.put('/:id',authMiddleware,ownerOnly,(req,res)=>{
  if(!db.prepare('SELECT id FROM trucks WHERE id=? AND store_id=?').get(req.params.id,req.user.storeId))
    return res.status(404).json({error:'Camion introuvable.'});
  const {name,driver,active}=req.body;
  db.prepare('UPDATE trucks SET name=?,driver=?,active=? WHERE id=?').run(name?.trim()||'',driver?.trim()||'',active?1:0,req.params.id);
  res.json(db.prepare('SELECT * FROM trucks WHERE id=?').get(req.params.id));
});
r.get('/logs',authMiddleware,(req,res)=>{
  const {date}=req.query;
  let sql='SELECT tl.*,t.name as truck_name,t.driver FROM truck_logs tl JOIN trucks t ON tl.truck_id=t.id WHERE tl.store_id=?';
  const p=[req.user.storeId];
  if(date){sql+=' AND tl.date=?';p.push(date);}
  res.json(db.prepare(sql+' ORDER BY tl.date DESC,t.name').all(...p));
});
r.post('/logs',authMiddleware,(req,res)=>{
  const {truckId,date,trips,note}=req.body;
  if(!truckId||!date||!trips||Number(trips)<1) return res.status(400).json({error:'Données invalides.'});
  if(!db.prepare('SELECT id FROM trucks WHERE id=? AND store_id=?').get(truckId,req.user.storeId))
    return res.status(404).json({error:'Camion introuvable.'});
  const ex=db.prepare('SELECT id FROM truck_logs WHERE truck_id=? AND date=?').get(truckId,date);
  if(ex&&req.user.role!=='owner') return res.status(403).json({error:'Déjà pointé. Contactez le propriétaire.'});
  const id=uuid();
  if(ex){
    db.prepare("UPDATE truck_logs SET trips=?,note=?,updated_at=datetime('now') WHERE id=?").run(Number(trips),note?.trim()||'',ex.id);
    return res.json(db.prepare('SELECT tl.*,t.name as truck_name,t.driver FROM truck_logs tl JOIN trucks t ON tl.truck_id=t.id WHERE tl.id=?').get(ex.id));
  }
  db.prepare('INSERT INTO truck_logs(id,store_id,truck_id,date,trips,note,created_by) VALUES(?,?,?,?,?,?,?)').run(id,req.user.storeId,truckId,date,Number(trips),note?.trim()||'',req.user.fullName);
  res.status(201).json(db.prepare('SELECT tl.*,t.name as truck_name,t.driver FROM truck_logs tl JOIN trucks t ON tl.truck_id=t.id WHERE tl.id=?').get(id));
});
r.get('/stats',authMiddleware,(req,res)=>{
  const t=new Date().toISOString().split('T')[0];
  res.json({todayTrips:db.prepare('SELECT COALESCE(SUM(trips),0) as v FROM truck_logs WHERE store_id=? AND date=?').get(req.user.storeId,t).v});
});
module.exports=r;

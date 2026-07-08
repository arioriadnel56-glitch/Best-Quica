const express=require('express');const {v4:uuid}=require('uuid');
const db=require('../database');const {authMiddleware,ownerOnly}=require('../middleware');
const r=express.Router();

r.get('/',authMiddleware,(req,res)=>res.json(db.prepare('SELECT * FROM materials WHERE store_id=? ORDER BY category,name').all(req.user.storeId)));

r.post('/',authMiddleware,ownerOnly,(req,res)=>{
  const {name,category,unit_detail,unit_gros,price_detail,price_gros,qty_gros,stock,stock_min}=req.body;
  if(!name?.trim()) return res.status(400).json({error:'Nom obligatoire.'});
  const id=uuid();
  db.prepare('INSERT INTO materials(id,store_id,name,category,unit_detail,unit_gros,price_detail,price_gros,qty_gros,stock,stock_min) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id,req.user.storeId,name.trim(),category?.trim()||'',unit_detail||'Unité',unit_gros||'Carton',Number(price_detail)||0,Number(price_gros)||0,Number(qty_gros)||1,Number(stock)||0,Number(stock_min)||10);
  if(Number(stock)>0) db.prepare('INSERT INTO stock_movements(id,store_id,material_id,type,qty,qty_before,qty_after,reason,created_by) VALUES(?,?,?,?,?,?,?,?,?)').run(uuid(),req.user.storeId,id,'in',Number(stock),0,Number(stock),'Stock initial',req.user.fullName);
  res.status(201).json(db.prepare('SELECT * FROM materials WHERE id=?').get(id));
});

r.put('/:id',authMiddleware,ownerOnly,(req,res)=>{
  const mat=db.prepare('SELECT * FROM materials WHERE id=? AND store_id=?').get(req.params.id,req.user.storeId);
  if(!mat) return res.status(404).json({error:'Produit introuvable.'});
  const {name,category,unit_detail,unit_gros,price_detail,price_gros,qty_gros,stock,stock_min}=req.body;
  if(!name?.trim()) return res.status(400).json({error:'Nom obligatoire.'});
  const ns=Number(stock); const os=mat.stock;
  db.transaction(()=>{
    db.prepare("UPDATE materials SET name=?,category=?,unit_detail=?,unit_gros=?,price_detail=?,price_gros=?,qty_gros=?,stock=?,stock_min=?,version=version+1,updated_at=datetime('now') WHERE id=? AND store_id=?").run(name.trim(),category?.trim()||'',unit_detail||'Unité',unit_gros||'Carton',Number(price_detail)||0,Number(price_gros)||0,Number(qty_gros)||1,ns,Number(stock_min)||10,req.params.id,req.user.storeId);
    if(ns!==os) db.prepare('INSERT INTO stock_movements(id,store_id,material_id,type,qty,qty_before,qty_after,reason,created_by) VALUES(?,?,?,?,?,?,?,?,?)').run(uuid(),req.user.storeId,req.params.id,'adjust',Math.abs(ns-os),os,ns,ns>os?'Entrée stock':'Sortie stock',req.user.fullName);
  })();
  res.json(db.prepare('SELECT * FROM materials WHERE id=?').get(req.params.id));
});

r.delete('/:id',authMiddleware,ownerOnly,(req,res)=>{
  if(!db.prepare('SELECT id FROM materials WHERE id=? AND store_id=?').get(req.params.id,req.user.storeId))
    return res.status(404).json({error:'Produit introuvable.'});
  db.prepare('DELETE FROM materials WHERE id=?').run(req.params.id);
  res.json({success:true});
});

r.get('/movements/all',authMiddleware,(req,res)=>{
  const {from,to,type}=req.query;
  let sql='SELECT sm.*,m.name as material_name,m.unit_detail FROM stock_movements sm LEFT JOIN materials m ON sm.material_id=m.id WHERE sm.store_id=?';
  const p=[req.user.storeId];
  if(from){sql+=' AND date(sm.created_at)>=?';p.push(from);}
  if(to){sql+=' AND date(sm.created_at)<=?';p.push(to);}
  if(type){sql+=' AND sm.type=?';p.push(type);}
  res.json(db.prepare(sql+' ORDER BY sm.created_at DESC LIMIT 500').all(...p));
});

module.exports=r;

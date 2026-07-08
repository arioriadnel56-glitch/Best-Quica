const express=require('express');const {v4:uuid}=require('uuid');
const db=require('../database');const {authMiddleware,ownerOnly}=require('../middleware');
const r=express.Router();

r.get('/',authMiddleware,(req,res)=>{
  const {from,to}=req.query;
  let sql='SELECT s.*,m.name as material_name,m.unit_detail,m.unit_gros,m.category,c.name as client_name_ref FROM sales s LEFT JOIN materials m ON s.material_id=m.id LEFT JOIN clients c ON s.client_id=c.id WHERE s.store_id=?';
  const p=[req.user.storeId];
  if(from){sql+=' AND date(s.created_at)>=?';p.push(from);}
  if(to){sql+=' AND date(s.created_at)<=?';p.push(to);}
  res.json(db.prepare(sql+' ORDER BY s.created_at DESC').all(...p));
});

r.post('/',authMiddleware,(req,res)=>{
  const {materialId,qty,sale_type,clientId,client}=req.body;
  if(!materialId||!qty||Number(qty)<=0) return res.status(400).json({error:'Produit et quantité requis.'});
  if(!['detail','gros'].includes(sale_type)) return res.status(400).json({error:'Type de vente invalide.'});
  const mat=db.prepare('SELECT * FROM materials WHERE id=? AND store_id=?').get(materialId,req.user.storeId);
  if(!mat) return res.status(404).json({error:'Produit introuvable.'});

  // En gros: qty = nb de cartons/lots, déduire qty*qty_gros du stock
  const qtyGros = sale_type==='gros' ? Number(qty)*mat.qty_gros : Number(qty);
  if(qtyGros>mat.stock) return res.status(400).json({error:`Stock insuffisant. Stock: ${mat.stock} ${mat.unit_detail} (${Math.floor(mat.stock/mat.qty_gros)} ${mat.unit_gros}).`});

  const unitPrice = sale_type==='gros' ? mat.price_gros : mat.price_detail;
  const newStock  = mat.stock - qtyGros;
  const clientName = client?.trim() || (clientId?db.prepare('SELECT name FROM clients WHERE id=?').get(clientId)?.name:'')||'';
  const id=uuid();

  db.transaction(()=>{
    db.prepare('INSERT INTO sales(id,store_id,material_id,sale_type,qty,unit_price,client_id,client,created_by) VALUES(?,?,?,?,?,?,?,?,?)').run(id,req.user.storeId,materialId,sale_type,Number(qty),unitPrice,clientId||null,clientName,req.user.fullName);
    db.prepare("UPDATE materials SET stock=?,updated_at=datetime('now') WHERE id=?").run(newStock,materialId);
    db.prepare('INSERT INTO stock_movements(id,store_id,material_id,type,qty,qty_before,qty_after,sale_type,reason,ref_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(uuid(),req.user.storeId,materialId,'sale',qtyGros,mat.stock,newStock,sale_type,`Vente ${sale_type}`,id,req.user.fullName);
  })();

  const sale=db.prepare('SELECT s.*,m.name as material_name,m.unit_detail,m.unit_gros FROM sales s LEFT JOIN materials m ON s.material_id=m.id WHERE s.id=?').get(id);
  res.status(201).json(sale);
});

r.delete('/:id',authMiddleware,ownerOnly,(req,res)=>{
  const sale=db.prepare('SELECT * FROM sales WHERE id=? AND store_id=?').get(req.params.id,req.user.storeId);
  if(!sale) return res.status(404).json({error:'Vente introuvable.'});
  db.transaction(()=>{
    const mat=db.prepare('SELECT * FROM materials WHERE id=?').get(sale.material_id);
    if(mat){
      const qtyRestore = sale.sale_type==='gros' ? sale.qty*mat.qty_gros : sale.qty;
      const ns=mat.stock+qtyRestore;
      db.prepare("UPDATE materials SET stock=?,updated_at=datetime('now') WHERE id=?").run(ns,sale.material_id);
      db.prepare('INSERT INTO stock_movements(id,store_id,material_id,type,qty,qty_before,qty_after,reason,ref_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)').run(uuid(),req.user.storeId,sale.material_id,'return',qtyRestore,mat.stock,ns,'Annulation vente',sale.id,req.user.fullName);
    }
    db.prepare('DELETE FROM sales WHERE id=?').run(req.params.id);
  })();
  res.json({success:true});
});

r.get('/stats',authMiddleware,(req,res)=>{
  const t=new Date().toISOString().split('T')[0];
  const gV=(sql,...p)=>db.prepare(sql).get(...p);
  res.json({
    todayRevenue: gV('SELECT COALESCE(SUM(qty*unit_price),0) as v FROM sales WHERE store_id=? AND date(created_at)=?',req.user.storeId,t).v,
    todayCount:   gV('SELECT COUNT(*) as v FROM sales WHERE store_id=? AND date(created_at)=?',req.user.storeId,t).v,
    todayGros:    gV("SELECT COALESCE(SUM(qty*unit_price),0) as v FROM sales WHERE store_id=? AND date(created_at)=? AND sale_type='gros'",req.user.storeId,t).v,
    todayDetail:  gV("SELECT COALESCE(SUM(qty*unit_price),0) as v FROM sales WHERE store_id=? AND date(created_at)=? AND sale_type='detail'",req.user.storeId,t).v,
    totalRevenue: gV('SELECT COALESCE(SUM(qty*unit_price),0) as v FROM sales WHERE store_id=?',req.user.storeId).v,
    topProducts:  db.prepare('SELECT m.name,SUM(s.qty) as tq,SUM(s.qty*s.unit_price) as tc FROM sales s JOIN materials m ON s.material_id=m.id WHERE s.store_id=? GROUP BY s.material_id ORDER BY tc DESC LIMIT 10').all(req.user.storeId)
  });
});

module.exports=r;

const express=require('express');const db=require('../database');
const {authMiddleware,ownerOnly}=require('../middleware');
const r=express.Router();
r.get('/export',authMiddleware,ownerOnly,(req,res)=>{
  const sid=req.user.storeId;
  const backup={version:'1.0',app:'Best-Quinca',exportedAt:new Date().toISOString(),
    store:db.prepare('SELECT * FROM stores WHERE id=?').get(sid),
    users:db.prepare('SELECT id,full_name,email,role,created_at FROM users WHERE store_id=?').all(sid),
    clients:db.prepare('SELECT * FROM clients WHERE store_id=?').all(sid),
    materials:db.prepare('SELECT * FROM materials WHERE store_id=?').all(sid),
    sales:db.prepare('SELECT * FROM sales WHERE store_id=?').all(sid),
    invoices:db.prepare('SELECT * FROM invoices WHERE store_id=?').all(sid),
    invoice_lines:db.prepare('SELECT il.* FROM invoice_lines il JOIN invoices i ON il.invoice_id=i.id WHERE i.store_id=?').all(sid),
    trucks:db.prepare('SELECT * FROM trucks WHERE store_id=?').all(sid),
    truck_logs:db.prepare('SELECT * FROM truck_logs WHERE store_id=?').all(sid),
    movements:db.prepare('SELECT * FROM stock_movements WHERE store_id=?').all(sid)
  };
  res.setHeader('Content-Disposition',`attachment; filename="bestquinca_backup_${new Date().toISOString().split('T')[0]}.json"`);
  res.setHeader('Content-Type','application/json');
  res.send(JSON.stringify(backup,null,2));
});
r.post('/restore',authMiddleware,ownerOnly,(req,res)=>{
  const data=req.body;
  if(!data?.version||!data?.store) return res.status(400).json({error:'Fichier invalide.'});
  if(data.store.id!==req.user.storeId) return res.status(403).json({error:'Sauvegarde appartenant à une autre quincaillerie.'});
  try{
    db.transaction(()=>{
      ['stock_movements','invoice_lines','invoices','sales','truck_logs','trucks','materials','clients'].forEach(t=>db.prepare(`DELETE FROM ${t} WHERE store_id=?`).run(req.user.storeId));
      const ins=(t,fields,vals)=>data[t]?.forEach(r=>db.prepare(`INSERT OR REPLACE INTO ${t}(${fields}) VALUES(${fields.split(',').map(()=>'?').join(',')})`).run(...vals(r)));
      ins('clients','id,store_id,name,phone,email,address,client_type,note,created_at',r=>[r.id,r.store_id,r.name,r.phone,r.email,r.address,r.client_type||'detail',r.note,r.created_at]);
      ins('materials','id,store_id,name,category,unit_detail,unit_gros,price_detail,price_gros,qty_gros,stock,stock_min,version,updated_at,created_at',r=>[r.id,r.store_id,r.name,r.category,r.unit_detail,r.unit_gros,r.price_detail,r.price_gros,r.qty_gros,r.stock,r.stock_min,r.version,r.updated_at,r.created_at]);
      ins('trucks','id,store_id,name,driver,active,created_at',r=>[r.id,r.store_id,r.name,r.driver,r.active,r.created_at]);
      ins('invoices','id,store_id,invoice_num,client_id,client_name,client_phone,client_address,sale_type,status,total_ht,discount,total_ttc,note,created_by,created_at,paid_at',r=>[r.id,r.store_id,r.invoice_num,r.client_id,r.client_name,r.client_phone||'',r.client_address||'',r.sale_type||'detail',r.status,r.total_ht,r.discount,r.total_ttc,r.note,r.created_by,r.created_at,r.paid_at]);
      ins('invoice_lines','id,invoice_id,material_id,description,sale_type,qty,unit,unit_price,total',r=>[r.id,r.invoice_id,r.material_id,r.description,r.sale_type||'detail',r.qty,r.unit||'Unité',r.unit_price,r.total]);
      ins('sales','id,store_id,invoice_id,material_id,sale_type,qty,unit_price,client_id,client,created_by,created_at',r=>[r.id,r.store_id,r.invoice_id,r.material_id,r.sale_type||'detail',r.qty,r.unit_price,r.client_id,r.client,r.created_by,r.created_at]);
      ins('truck_logs','id,store_id,truck_id,date,trips,note,created_by,created_at,updated_at',r=>[r.id,r.store_id,r.truck_id,r.date,r.trips,r.note,r.created_by,r.created_at,r.updated_at]);
      ins('movements','id,store_id,material_id,type,qty,qty_before,qty_after,sale_type,reason,ref_id,created_by,created_at',r=>[r.id,r.store_id,r.material_id,r.type,r.qty,r.qty_before,r.qty_after,r.sale_type||'detail',r.reason,r.ref_id,r.created_by,r.created_at]);
    })();
    res.json({success:true,message:'Restauration réussie.'});
  }catch(e){console.error(e);res.status(500).json({error:'Erreur restauration: '+e.message});}
});
module.exports=r;

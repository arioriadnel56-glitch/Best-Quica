const express=require('express');const {v4:uuid}=require('uuid');
const db=require('../database');const {authMiddleware,ownerOnly}=require('../middleware');
const r=express.Router();

function nextNum(storeId){
  const cnt=db.prepare('SELECT COUNT(*) as c FROM invoices WHERE store_id=?').get(storeId).c;
  return `FAC-${new Date().getFullYear()}-${String(cnt+1).padStart(4,'0')}`;
}

r.get('/',authMiddleware,(req,res)=>{
  const {from,to,status}=req.query;
  let sql='SELECT i.*,c.name as client_name_ref FROM invoices i LEFT JOIN clients c ON i.client_id=c.id WHERE i.store_id=?';
  const p=[req.user.storeId];
  if(from){sql+=' AND date(i.created_at)>=?';p.push(from);}
  if(to){sql+=' AND date(i.created_at)<=?';p.push(to);}
  if(status){sql+=' AND i.status=?';p.push(status);}
  res.json(db.prepare(sql+' ORDER BY i.created_at DESC').all(...p));
});

r.get('/:id',authMiddleware,(req,res)=>{
  const inv=db.prepare('SELECT i.*,c.phone as c_phone,c.address as c_address FROM invoices i LEFT JOIN clients c ON i.client_id=c.id WHERE i.id=? AND i.store_id=?').get(req.params.id,req.user.storeId);
  if(!inv) return res.status(404).json({error:'Facture introuvable.'});
  const lines=db.prepare('SELECT il.*,m.name as mat_name FROM invoice_lines il LEFT JOIN materials m ON il.material_id=m.id WHERE il.invoice_id=?').all(req.params.id);
  const store=db.prepare('SELECT * FROM stores WHERE id=?').get(req.user.storeId);
  res.json({...inv,lines,store});
});

r.post('/',authMiddleware,(req,res)=>{
  const {clientId,clientName,clientPhone,clientAddress,lines,discount,note,deductStock,sale_type}=req.body;
  if(!lines?.length) return res.status(400).json({error:'Au moins une ligne requise.'});
  const id=uuid(), num=nextNum(req.user.storeId);
  let totalHT=0;
  lines.forEach(l=>{totalHT+=Number(l.qty)*Number(l.unit_price);});
  const disc=Number(discount)||0, totalTTC=Math.max(0,totalHT-disc);
  const invType = sale_type || (lines.some(l=>l.sale_type==='gros')&&lines.some(l=>l.sale_type==='detail')?'mixte':lines[0]?.sale_type||'detail');
  const resolvedClient = clientName?.trim()||(clientId?db.prepare('SELECT name FROM clients WHERE id=?').get(clientId)?.name:'')||'Client comptoir';
  const resolvedPhone = clientPhone?.trim()||(clientId?db.prepare('SELECT phone FROM clients WHERE id=?').get(clientId)?.phone:'')||'';
  const resolvedAddr  = clientAddress?.trim()||(clientId?db.prepare('SELECT address FROM clients WHERE id=?').get(clientId)?.address:'')||'';

  db.transaction(()=>{
    db.prepare('INSERT INTO invoices(id,store_id,invoice_num,client_id,client_name,client_phone,client_address,sale_type,status,total_ht,discount,total_ttc,note,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,req.user.storeId,num,clientId||null,resolvedClient,resolvedPhone,resolvedAddr,invType,'draft',totalHT,disc,totalTTC,note?.trim()||'',req.user.fullName);
    for(const l of lines){
      const lid=uuid(), lt=Number(l.qty)*Number(l.unit_price);
      db.prepare('INSERT INTO invoice_lines(id,invoice_id,material_id,description,sale_type,qty,unit,unit_price,total) VALUES(?,?,?,?,?,?,?,?,?)').run(lid,id,l.materialId||null,l.description?.trim()||'',l.sale_type||'detail',Number(l.qty),l.unit||'Unité',Number(l.unit_price),lt);
      if(deductStock&&l.materialId){
        const mat=db.prepare('SELECT * FROM materials WHERE id=? AND store_id=?').get(l.materialId,req.user.storeId);
        if(mat){
          const realQty=l.sale_type==='gros'?Number(l.qty)*mat.qty_gros:Number(l.qty);
          if(mat.stock>=realQty){
            const ns=mat.stock-realQty;
            db.prepare("UPDATE materials SET stock=?,updated_at=datetime('now') WHERE id=?").run(ns,l.materialId);
            db.prepare('INSERT INTO stock_movements(id,store_id,material_id,type,qty,qty_before,qty_after,sale_type,reason,ref_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(uuid(),req.user.storeId,l.materialId,'sale',realQty,mat.stock,ns,l.sale_type||'detail',`Facture ${num}`,id,req.user.fullName);
            db.prepare('INSERT INTO sales(id,store_id,invoice_id,material_id,sale_type,qty,unit_price,client_id,client,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)').run(uuid(),req.user.storeId,id,l.materialId,l.sale_type||'detail',Number(l.qty),Number(l.unit_price),clientId||null,resolvedClient,req.user.fullName);
          }
        }
      }
    }
  })();
  const inv=db.prepare('SELECT * FROM invoices WHERE id=?').get(id);
  const savedLines=db.prepare('SELECT * FROM invoice_lines WHERE invoice_id=?').all(id);
  res.status(201).json({...inv,lines:savedLines});
});

r.put('/:id/status',authMiddleware,(req,res)=>{
  const {status}=req.body;
  if(!['draft','paid','cancelled'].includes(status)) return res.status(400).json({error:'Statut invalide.'});
  if(!db.prepare('SELECT id FROM invoices WHERE id=? AND store_id=?').get(req.params.id,req.user.storeId))
    return res.status(404).json({error:'Facture introuvable.'});
  db.prepare('UPDATE invoices SET status=?,paid_at=? WHERE id=?').run(status,status==='paid'?new Date().toISOString():null,req.params.id);
  res.json(db.prepare('SELECT * FROM invoices WHERE id=?').get(req.params.id));
});

r.delete('/:id',authMiddleware,ownerOnly,(req,res)=>{
  if(!db.prepare('SELECT id FROM invoices WHERE id=? AND store_id=?').get(req.params.id,req.user.storeId))
    return res.status(404).json({error:'Facture introuvable.'});
  db.prepare('DELETE FROM invoice_lines WHERE invoice_id=?').run(req.params.id);
  db.prepare('DELETE FROM invoices WHERE id=?').run(req.params.id);
  res.json({success:true});
});

module.exports=r;

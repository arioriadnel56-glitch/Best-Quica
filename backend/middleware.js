const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'bestquinca_secret_2024_changez_en_prod';
const authMiddleware = (req,res,next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({error:'Token manquant.'});
  try { req.user = jwt.verify(h.slice(7), SECRET); next(); }
  catch { res.status(401).json({error:'Token expiré. Reconnectez-vous.'}); }
};
const ownerOnly = (req,res,next) => req.user.role==='owner' ? next() : res.status(403).json({error:'Réservé au propriétaire.'});
const generateToken = u => jwt.sign({id:u.id,storeId:u.store_id,email:u.email,role:u.role,fullName:u.full_name}, SECRET, {expiresIn:'7d'});
module.exports = {authMiddleware, ownerOnly, generateToken};

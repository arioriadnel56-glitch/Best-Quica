// API centralisée — fonctionne en ligne ET hors ligne (localhost)
const BASE = '/api';
const tok  = () => localStorage.getItem('bq_token');

async function req(method, url, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(tok() ? { Authorization: `Bearer ${tok()}` } : {})
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  };
  const res  = await fetch(BASE + url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

export const api = {
  register: d  => req('POST', '/auth/register', d),
  login:    d  => req('POST', '/auth/login', d),
  me:       () => req('GET',  '/auth/me'),
  getClients:    q      => req('GET',    `/clients${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getClient:     id     => req('GET',    `/clients/${id}`),
  createClient:  d      => req('POST',   '/clients', d),
  updateClient:  (id,d) => req('PUT',    `/clients/${id}`, d),
  deleteClient:  id     => req('DELETE', `/clients/${id}`),
  getMaterials:     ()      => req('GET',    '/materials'),
  createMaterial:   d       => req('POST',   '/materials', d),
  updateMaterial:   (id, d) => req('PUT',    `/materials/${id}`, d),
  deleteMaterial:   id      => req('DELETE', `/materials/${id}`),
  getMovements:     p       => req('GET',    `/materials/movements/all${p ? '?' + new URLSearchParams(p) : ''}`),
  getInvoices:   p      => req('GET',    `/invoices${p ? '?' + new URLSearchParams(p) : ''}`),
  getInvoice:    id     => req('GET',    `/invoices/${id}`),
  createInvoice: d      => req('POST',   '/invoices', d),
  updateInvoiceStatus: (id, s) => req('PUT', `/invoices/${id}/status`, { status: s }),
  deleteInvoice: id     => req('DELETE', `/invoices/${id}`),
  getSales:   p      => req('GET',    `/sales${p ? '?' + new URLSearchParams(p) : ''}`),
  createSale: d      => req('POST',   '/sales', d),
  deleteSale: id     => req('DELETE', `/sales/${id}`),
  salesStats: ()     => req('GET',    '/sales/stats'),
  getTrucks:   ()      => req('GET',    '/trucks'),
  createTruck: d       => req('POST',   '/trucks', d),
  updateTruck: (id, d) => req('PUT',    `/trucks/${id}`, d),
  getLogs:     date    => req('GET',    `/trucks/logs${date ? `?date=${date}` : ''}`),
  postLog:     d       => req('POST',   '/trucks/logs', d),
  truckStats:  ()      => req('GET',    '/trucks/stats'),
  getTeam:      ()      => req('GET',    '/team'),
  addMember:    d       => req('POST',   '/team', d),
  deleteMember: id      => req('DELETE', `/team/${id}`),
  getStore:     ()      => req('GET',    '/team/store'),
  updateStore:  d       => req('PUT',    '/team/store', d),
  exportBackup:  ()  => fetch(BASE + '/backup/export', { headers: { Authorization: `Bearer ${tok()}` } }),
  restoreBackup: d   => req('POST', '/backup/restore', d),
};

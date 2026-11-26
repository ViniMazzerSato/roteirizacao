/* Roteiro de Visitas · aplicação (vanilla JS, sem build)
   Dados: Supabase quando config.js estiver preenchido; senão modo demonstração local. */
(() => {
'use strict';

/* =================== utilidades =================== */
const CFG = window.APP_CONFIG || {};
const LIVE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_L = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const FREQ = { S: 'Semanal', Q: 'Quinzenal', M: 'Mensal' };
const DEF_CFG = { paridade: 'iso', cap: 12, motivos: ['Estoque abastecido', 'Preço / condição comercial', 'Sem limite de crédito', 'Comprador ausente', 'Loja fechada', 'Comprou da concorrência', 'Outro'], vendedor_edita_roteiro: false };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = s => { const [a, b, c] = String(s).slice(0, 10).split('-').map(Number); return new Date(a, b - 1, c); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
const T = ymd(TODAY);
const brl = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const brl2 = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const num = v => Number(v || 0).toLocaleString('pt-BR');
const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '—';
const brDate = s => { const d = parse(s); return DIAS[d.getDay()] + ', ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1); };
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const initials = s => String(s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };

function isoWeek(d) { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y0) / 864e5 + 1) / 7); }
const nth = d => Math.ceil(d.getDate() / 7);
const parity = d => ((st.cfg.paridade === 'mes' ? nth(d) : isoWeek(d)) % 2) ? 1 : 2;
function slotFor(c, d) { const dia = d.getDay(); if (c.freq === 'S') return { dia, semana: 0 }; if (c.freq === 'Q') return { dia, semana: parity(d) }; return { dia, semana: Math.min(nth(d), 5) }; }
function visitsOn(c, d) { if (!c.dia || c.dia !== d.getDay()) return false; if (c.freq === 'S') return true; if (c.freq === 'Q') return parity(d) === c.semana; return nth(d) === c.semana; }
function code(c) { if (!c.dia) return 'Não alocado'; const di = DIAS[c.dia]; return c.freq === 'S' ? 'S ' + di : (c.freq === 'Q' ? 'Q' : 'M') + c.semana + ' ' + di; }
const fcls = c => !c.dia ? 'f-N' : c.freq === 'S' ? 'f-S' : c.freq === 'Q' ? (c.semana === 2 ? 'f-Q2' : 'f-Q1') : 'f-M';
const codePill = c => `<span class="code ${fcls(c)}">${esc(code(c))}</span>`;
function parseCode(s) { const m = norm(s).toUpperCase().match(/^([SQM])\s*([1-5])?\s*([A-Z]{3})/); if (!m) return null; const di = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].indexOf(m[3]); if (di < 1) return null; const f = m[1]; let sem = f === 'S' ? 0 : Number(m[2] || 1); if (f === 'Q') sem = sem % 2 ? 1 : 2; return { freq: f, semana: sem, dia: di }; }
const statusPill = s => { const n = norm(s); const k = n.startsWith('ativo') ? 'ok' : n.startsWith('pre') ? 'warn' : n.startsWith('inativo') ? 'bad' : ''; return s ? `<span class="pill ${k}">${esc(s)}</span>` : ''; };
const visitsInMonth = (c, m) => { if (!c.dia) return 0; let n = 0; const last = new Date(m.getFullYear(), m.getMonth() + 1, 0); for (let d = new Date(m.getFullYear(), m.getMonth(), 1); d <= last; d = addDays(d, 1)) if (visitsOn(c, d)) n++; return n; };

const I = {
  cal: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M3 15h18M9 4v16"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  store: '<path d="M3 9.5 4.5 4h15L21 9.5M3 9.5h18v1a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0v-1ZM5 13.5V20h14v-6.5M10 20v-4h4v4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  out: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
  up: '<path d="m18 15-6-6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>', phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  map: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.1-5.5A8.4 8.4 0 1 1 21 11.5Z"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  wand: '<path d="m15 4 5 5M4 20l11-11M14 3l.5 1.5L16 5l-1.5.5L14 7l-.5-1.5L12 5l1.5-.5ZM19 12l.5 1.5L21 14l-1.5.5L19 16l-.5-1.5L17 14l1.5-.5Z"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/>'
};
const ico = (n, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;

/* =================== estado =================== */
const st = {
  me: null, vendedores: [], clientes: [], byCod: new Map(), visitas: new Map(), meses: new Set(), cfg: { ...DEF_CFG },
  view: 'calendario', area: store.get('rv.area') || '', mes: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1), dia: T,
  sel: new Set(), pool: { q: '', status: '', cidade: '', freq: '', modo: 'nao' }, expand: new Set(),
  rel: { q: '', status: '', cidade: '', tipo: '', dia: '', page: 0 }, cli: { q: '', status: '', aloc: '', page: 0 }, bsel: new Set(),
  res: { ini: ymd(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)), fim: T, equipe: '' }
};
const vk = (data, cod) => data + '|' + cod;
const isAdmin = () => st.me && st.me.papel === 'admin';
const isSup = () => st.me && st.me.papel === 'supervisor';
const canPick = () => isAdmin() || isSup();
const canRoute = () => isAdmin() || isSup() || st.cfg.vendedor_edita_roteiro;
const routeVends = () => st.vendedores.filter(v => v.papel === 'vendedor' && v.ativo !== false).sort((a, b) => String(a.equipe || '').localeCompare(b.equipe || '') || String(a.area).localeCompare(b.area));
const vendByArea = a => st.vendedores.find(v => v.area === a);
const vendName = a => (vendByArea(a) || {}).nome || a || '—';
const clientsOf = a => a ? st.clientes.filter(c => c.area === a) : st.clientes;

/* =================== dados: Supabase =================== */
function liveApi() {
  const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true } });
  const chk = ({ data, error }) => { if (error) throw error; return data; };
  async function all(table, mod = q => q) {
    const out = []; let from = 0;
    for (;;) { const data = chk(await mod(sb.from(table).select('*')).range(from, from + 999)); out.push(...data); if (data.length < 1000) break; from += 1000; }
    return out;
  }
  return {
    async session() { const { data } = await sb.auth.getSession(); return data.session; },
    async signIn(email, password) { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; },
    async signOut() { await sb.auth.signOut(); },
    async me() { const s = await this.session(); if (!s) return null; const email = s.user.email; const r = chk(await sb.from('vendedores').select('*').ilike('email', email).limit(1)); return r[0] ? { ...r[0], email } : { email, semAcesso: true }; },
    async changePassword(pw) { const { error } = await sb.auth.updateUser({ password: pw }); if (error) throw error; },
    vendedores: () => all('vendedores', q => q.order('area')),
    clientes: () => all('clientes', q => q.order('cod')),
    async config() { const r = chk(await sb.from('config').select('*').eq('id', 1)); return r[0] || {}; },
    visitas: (ini, fim) => all('visitas', q => q.gte('data', ini).lte('data', fim)),
    async saveRotas(rows) { for (const p of chunk(rows, 500)) chk(await sb.rpc('salvar_rotas', { p })); },
    async saveCliente(c) { const { cod, ...rest } = c; chk(await sb.from('clientes').update({ ...rest, atualizado_em: new Date().toISOString() }).eq('cod', cod)); },
    async upsertClientes(rows, onProg) { let n = 0; for (const p of chunk(rows, 500)) { chk(await sb.from('clientes').upsert(p, { onConflict: 'cod' })); n += p.length; onProg && onProg(n); } },
    async upsertVendedores(rows) { if (rows.length) chk(await sb.from('vendedores').upsert(rows, { onConflict: 'area' })); },
    async saveVisita(v) { const r = chk(await sb.from('visitas').upsert({ ...v, atualizado_em: new Date().toISOString() }, { onConflict: 'data,cod' }).select()); return r[0]; },
    async delVisita(data, cod) { chk(await sb.from('visitas').delete().eq('data', data).eq('cod', cod)); },
    async saveConfig(c) { chk(await sb.from('config').update(c).eq('id', 1)); },
    async saveVendedor(v) { chk(await sb.from('vendedores').upsert(v, { onConflict: 'area' })); },
    async moverClientes(cods, area, equipe) { for (const p of chunk(cods, 300)) chk(await sb.from('clientes').update({ area, equipe, atualizado_em: new Date().toISOString() }).in('cod', p)); },
    async delVendedor(area) { chk(await sb.from('vendedores').delete().eq('area', area)); }
  };
}

/* =================== dados: demonstração local =================== */
function demoApi() {
  const K = 'rv.demo.v2';
  let base = { vendedores: [], clientes: [] }, d = null;
  const save = () => store.set(K, JSON.stringify(d));
  return {
    async load() {
      try { const r = await fetch(CFG.demoData || 'dados/demo.json'); if (r.ok) { const j = await r.json(); base.vendedores = j.vendedores.map(([area, nome, equipe, supervisor, tipo]) => ({ area, nome, equipe, supervisor, tipo, papel: 'vendedor', ativo: true, email: '' })); base.clientes = j.clientes.map(([cod, nome, cidade, telefone, segmento, status, ult_compra, dias_sem_compra, area, equipe, tipo]) => ({ cod, nome, cidade, telefone, segmento, status, ult_compra, dias_sem_compra, area, equipe, tipo, freq: 'M', semana: 1, dia: null, ordem: null, endereco: '' })); } } catch (e) { }
      try { d = JSON.parse(store.get(K) || 'null'); } catch (e) { d = null; }
      if (!d) { d = { rotas: {}, cli: {}, visitas: {}, config: { ...DEF_CFG }, vend: {}, seeded: false }; }
    },
    async session() { return true; }, async signIn() { }, async signOut() { },
    async me() { return { area: 'ADMIN', nome: 'Vinicius Sato', email: 'vinicius.sato@bateriasmoura.com', papel: 'admin' }; },
    async changePassword() { },
    async vendedores() { const m = new Map(base.vendedores.map(v => [v.area, v])); Object.values(d.vend).forEach(v => v._del ? m.delete(v.area) : m.set(v.area, { ...(m.get(v.area) || {}), ...v })); return [...m.values()]; },
    async clientes() { const m = new Map(base.clientes.map(c => [c.cod, c])); Object.values(d.cli).forEach(c => m.set(c.cod, { ...(m.get(c.cod) || {}), ...c })); return [...m.values()].map(c => ({ ...c, ...(d.rotas[c.cod] || {}) })); },
    async config() { return d.config; },
    async visitas(ini, fim) { return Object.values(d.visitas).filter(v => v.data >= ini && v.data <= fim); },
    async saveRotas(rows) { rows.forEach(r => { d.rotas[r.cod] = { freq: r.freq, semana: r.semana, dia: r.dia, ordem: r.ordem }; }); save(); },
    async saveCliente(c) { const { freq, semana, dia, ordem, ...rest } = c; d.cli[c.cod] = { ...(d.cli[c.cod] || {}), ...rest }; d.rotas[c.cod] = { freq, semana, dia, ordem }; save(); },
    async upsertClientes(rows, onProg) { rows.forEach(r => { d.cli[r.cod] = { ...(d.cli[r.cod] || {}), ...r }; }); save(); onProg && onProg(rows.length); },
    async upsertVendedores(rows) { rows.forEach(v => { d.vend[v.area] = { ...(d.vend[v.area] || {}), ...v }; }); save(); },
    async saveVisita(v) { d.visitas[vk(v.data, v.cod)] = { ...v }; save(); return v; },
    async delVisita(data, cod) { delete d.visitas[vk(data, cod)]; save(); },
    async saveConfig(c) { d.config = { ...d.config, ...c }; save(); },
    async saveVendedor(v) { d.vend[v.area] = { ...v, _del: false }; save(); },
    async moverClientes(cods, area, equipe) { cods.forEach(c => { d.cli[c] = { ...(d.cli[c] || {}), cod: c, area, equipe }; }); save(); },
    async delVendedor(area) { d.vend[area] = { area, _del: true }; save(); },
    get seeded() { return d.seeded; }, markSeeded() { d.seeded = true; save(); }
  };
}
const api = LIVE ? liveApi() : demoApi();

/* =================== carregamento =================== */
function indexClientes() { st.byCod = new Map(st.clientes.map(c => [c.cod, c])); }
async function loadAll() {
  const [v, c, cfg] = await Promise.all([api.vendedores(), api.clientes(), api.config()]);
  st.vendedores = v; st.clientes = c.map(x => ({ ...x, dia: x.dia || null, semana: Number(x.semana || 0), ordem: x.ordem ?? null })); st.cfg = { ...DEF_CFG, ...cfg }; indexClientes();
  if (!canPick()) st.area = st.me.area;
  else if (st.area && !vendByArea(st.area)) st.area = '';
  if (!LIVE && !api.seeded) { seedDemo(); api.markSeeded(); }
}
function monthsBetween(ini, fim) { const o = []; let d = parse(ini); d = new Date(d.getFullYear(), d.getMonth(), 1); const e = parse(fim); while (d <= e) { o.push(d.getFullYear() + '-' + pad(d.getMonth() + 1)); d = new Date(d.getFullYear(), d.getMonth() + 1, 1); } return o; }
async function ensureVisitas(ini, fim) {
  const miss = monthsBetween(ini, fim).filter(m => !st.meses.has(m));
  if (!miss.length) return false;
  const a = miss[0] + '-01', last = parse(miss[miss.length - 1] + '-01'), b = ymd(new Date(last.getFullYear(), last.getMonth() + 1, 0));
  const rows = await api.visitas(a, b);
  rows.forEach(v => st.visitas.set(vk(v.data, v.cod), v)); miss.forEach(m => st.meses.add(m));
  return true;
}
function seedDemo() {
  // Demonstração: distribui os clientes Ativos (quinzenal) e Pré-Inativos (mensal) de cada vendedor.
  const out = [];
  routeVends().forEach(v => {
    const list = st.clientes.filter(c => c.area === v.area && /^(ativo|pre)/.test(norm(c.status))).map(c => ({ ...c, freq: norm(c.status).startsWith('ativo') ? 'Q' : 'M' }));
    out.push(...distribuir(list, [], [1, 2, 3, 4, 5]));
  });
  out.forEach(n => Object.assign(st.byCod.get(n.cod), n));
  api.saveRotas(out.map(rotaOf));
}

/* =================== distribuição automática =================== */
const wsOf = c => c.freq === 'S' ? [1, 2, 3, 4] : c.freq === 'Q' ? (c.semana === 2 ? [2, 4] : [1, 3]) : [Math.min(c.semana || 1, 4)];
function distribuir(list, existing, dias) {
  const L = {}; dias.forEach(d => L[d] = [0, 0, 0, 0, 0]);
  const add = c => { if (c.dia && L[c.dia]) wsOf(c).forEach(w => L[c.dia][w]++); };
  existing.forEach(add);
  const best = (c, d) => { // melhor semana no dia d e a carga resultante
    if (c.freq === 'S') return { semana: 0, cost: Math.max(...[1, 2, 3, 4].map(w => L[d][w])) };
    if (c.freq === 'Q') { const a = Math.max(L[d][1], L[d][3]), b = Math.max(L[d][2], L[d][4]); return a <= b ? { semana: 1, cost: a } : { semana: 2, cost: b }; }
    let w = 1; for (let k = 2; k <= 4; k++) if (L[d][k] < L[d][w]) w = k; return { semana: w, cost: L[d][w] };
  };
  const groups = new Map(); list.forEach(c => { const k = norm(c.cidade) || '—'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(c); });
  const out = [], ord = {}; dias.forEach(d => ord[d] = 0);
  [...groups.values()].sort((a, b) => b.length - a.length).forEach(g => {
    let pref = dias.reduce((m, d) => (L[d].reduce((s, x) => s + x, 0) < L[m].reduce((s, x) => s + x, 0) ? d : m), dias[0]);
    g.sort((a, b) => ({ S: 0, Q: 1, M: 2 }[a.freq] - { S: 0, Q: 1, M: 2 }[b.freq]) || String(a.nome).localeCompare(b.nome, 'pt-BR')).forEach(c => {
      let opt = dias.map(d => ({ d, ...best(c, d) })); const min = Math.min(...opt.map(o => o.cost));
      let o = opt.find(x => x.d === pref); if (o.cost > min + 1) { o = opt.find(x => x.cost === min); pref = o.d; }
      const n = { ...c, dia: o.d, semana: o.semana, ordem: ++ord[o.d] }; add(n); out.push(n);
    });
  });
  return out;
}

/* =================== gravação =================== */
const rotaOf = c => ({ cod: c.cod, freq: c.freq, semana: c.semana || 0, dia: c.dia || null, ordem: c.ordem ?? null });
async function saveRotas(list, msg) {
  if (!list.length) return;
  const prev = list.map(n => ({ ...st.byCod.get(n.cod) }));
  list.forEach(n => Object.assign(st.byCod.get(n.cod), n));
  render();
  try { await api.saveRotas(list.map(rotaOf)); if (msg) toast(msg); }
  catch (e) { prev.forEach(p => Object.assign(st.byCod.get(p.cod), p)); render(); toast(errMsg(e), 'bad'); }
}
async function saveVisita(cod, ch) {
  const ds = st.dia, k = vk(ds, cod), c = st.byCod.get(cod) || {};
  const cur = st.visitas.get(k) || { data: ds, cod, area: c.area, equipe: c.equipe, visitou: false, resultado: null, valor: 0, motivo: null, conversa: null, hora: null, extra: !visitsOn(c, parse(ds)) };
  const n = { ...cur, ...ch };
  if (ch.resultado) n.visitou = true;
  if (n.visitou && !n.hora) { const t = new Date(); n.hora = pad(t.getHours()) + ':' + pad(t.getMinutes()); }
  if (!n.visitou) { n.resultado = null; n.hora = null; n.valor = 0; n.motivo = null; }
  delete n.id; delete n.criado_por; delete n.atualizado_em;
  if (!n.visitou && !n.conversa && n.extra) { st.visitas.delete(k); renderSoft(); try { await api.delVisita(ds, cod); } catch (e) { toast(errMsg(e), 'bad'); } return; }
  st.visitas.set(k, n); renderSoft();
  try { await api.saveVisita(n); } catch (e) { toast(errMsg(e), 'bad'); }
}
function errMsg(e) { const m = (e && (e.message || e.error_description)) || ''; if (/row-level|permission|policy/i.test(m)) return 'Você não tem permissão para essa alteração.'; if (/fetch|network/i.test(m)) return 'Sem conexão. A alteração não foi salva.'; return 'Não foi possível salvar: ' + m; }

/* =================== UI básica =================== */
function toast(m, kind) { const t = document.createElement('div'); t.className = 'toast' + (kind ? ' ' + kind : ''); t.textContent = m; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3200); }
function modal({ title, sub, body, foot, wide, onMount }) {
  const root = $('#modal-root');
  root.innerHTML = `<div class="ov"><div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true"><div class="modal-h"><div><h3>${esc(title)}</h3>${sub ? `<p>${sub}</p>` : ''}</div><span class="sp"></span><button class="btn ghost icon sm" data-close aria-label="Fechar">${ico('x')}</button></div><div class="modal-b">${body}</div>${foot ? `<div class="modal-f">${foot}</div>` : ''}</div></div>`;
  const ov = $('.ov', root); const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
  $$('[data-close]', ov).forEach(b => b.addEventListener('click', close));
  onMount && onMount(ov, close);
  const f = $('input,select,textarea', $('.modal-b', ov)); f && f.focus();
  return close;
}
async function saveFile(name, blob) {
  if (window.claude && window.claude.use) { try { const dl = await window.claude.use('downloads'); if (dl) { await dl.save({ filename: name, data: blob }); return; } } catch (e) { toast('Download não concluído', 'bad'); return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function exportXlsx(name, header, rows, sheet = 'Dados') {
  if (!window.XLSX) { toast('Biblioteca de planilha não carregou', 'bad'); return; }
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]); ws['!cols'] = header.map(h => ({ wch: Math.max(10, String(h).length + 4) }));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, sheet);
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveFile(name, new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
}

/* =================== navegação / shell =================== */
const VIEWS = [
  { id: 'calendario', t: 'Calendário', i: 'cal', sec: 'Planejamento' },
  { id: 'roteiro', t: 'Roteiro do dia', i: 'route' },
  { id: 'relatorio', t: 'Relatório de visitas', i: 'table' },
  { id: 'produtividade', t: 'Produtividade', i: 'chart', sec: 'Análise' },
  { id: 'clientes', t: 'Clientes', i: 'store', sec: 'Cadastros', need: canPick },
  { id: 'usuarios', t: 'Usuários', i: 'users', need: isAdmin },
  { id: 'config', t: 'Configurações', i: 'gear', need: isAdmin }
];
const allowed = () => VIEWS.filter(v => !v.need || v.need());
function go(view) { if (!allowed().some(v => v.id === view)) view = 'calendario'; st.view = view; if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view); renderShell(); }
addEventListener('hashchange', () => { const h = location.hash.slice(1); if (h && h !== st.view && VIEWS.some(v => v.id === h)) go(h); });

function vendSelect(allowAll) {
  if (!canPick()) { const v = vendByArea(st.me.area); return `<span class="pill blue">${esc(v ? v.nome : st.me.nome)}</span>`; }
  const vs = routeVends().filter(v => isAdmin() || v.equipe === st.me.equipe);
  const groups = {}; vs.forEach(v => (groups[v.equipe || 'Sem equipe'] = groups[v.equipe || 'Sem equipe'] || []).push(v));
  return `<select class="inp" id="selVend" aria-label="Vendedor" style="min-width:200px">${allowAll ? `<option value="">Todos os vendedores</option>` : ''}${Object.entries(groups).map(([g, l]) => `<optgroup label="${esc(g)}">${l.map(v => `<option value="${esc(v.area)}"${v.area === st.area ? ' selected' : ''}>${esc(v.nome)} · ${esc(v.area)}</option>`).join('')}</optgroup>`).join('')}</select>`;
}
function needArea() { if (!st.area && canPick()) { const v = routeVends().filter(v => isAdmin() || v.equipe === st.me.equipe)[0]; if (v) st.area = v.area; } return st.area; }
function setArea(a) { st.area = a; store.set('rv.area', a); st.sel.clear(); st.bsel.clear(); st.rel.page = 0; st.cli.page = 0; render(); }

function renderShell() {
  const av = allowed();
  let nav = '', sec = '';
  av.forEach(v => { if (v.sec && v.sec !== sec) { sec = v.sec; nav += `<div class="sec">${esc(sec)}</div>`; } nav += `<a href="#${v.id}" class="${st.view === v.id ? 'on' : ''}">${ico(v.i)}<span>${esc(v.t)}</span></a>`; });
  const papel = { admin: 'Administrador', supervisor: 'Supervisor', vendedor: 'Vendedor' }[st.me.papel] || '';
  $('#app').innerHTML = `<div class="shell">
    <aside class="side"><div class="logo"><div class="mk">${ico('route')}</div><div><b>Roteiro de Visitas</b><small>Baterias Moura · Campinas</small></div></div>
      <nav class="nav">${nav}</nav>
      <div class="me"><div class="av">${esc(initials(st.me.nome))}</div><div class="who"><b>${esc(st.me.nome)}</b><small>${esc(papel)}</small></div><button class="btn ghost icon sm" id="logout" title="Sair" aria-label="Sair">${ico('out')}</button></div></aside>
    <div class="main">${LIVE ? '' : '<div class="demo-bar">Modo demonstração com a Carteira de Clientes de novembro: as alterações ficam só neste navegador até o sistema ser ligado ao banco de dados.</div>'}
      <header class="top" id="top"></header><div class="page" id="page"></div></div></div>
    <nav class="tabbar">${av.slice(0, 5).map(v => `<a href="#${v.id}" class="${st.view === v.id ? 'on' : ''}">${ico(v.i)}<span>${esc(v.t.split(' ')[0])}</span></a>`).join('')}</nav>`;
  $('#logout').addEventListener('click', async () => { await api.signOut(); location.reload(); });
  render();
}
let pendingRender = false;
const typing = () => { const a = document.activeElement; return a && /INPUT|TEXTAREA/.test(a.tagName) && a.closest('.stop'); };
function renderSoft() { if (typing()) { pendingRender = true; return; } render(); }
document.addEventListener('focusout', () => { if (pendingRender) { pendingRender = false; setTimeout(render, 0); } });
function render() {
  const fn = { calendario: vCalendario, roteiro: vRoteiro, relatorio: vRelatorio, produtividade: vProdutividade, clientes: vClientes, usuarios: vUsuarios, config: vConfig }[st.view];
  const sc = window.scrollY; fn(); window.scrollTo(0, sc);
  const s = $('#selVend'); if (s) s.addEventListener('change', e => setArea(e.target.value));
}
const top = (title, right = '') => { $('#top').innerHTML = `<h1>${esc(title)}</h1><span class="sp"></span>${right}`; };

/* =================== CALENDÁRIO =================== */
function vCalendario() {
  const area = needArea(); const m = st.mes;
  top('Calendário', vendSelect(false));
  const cls = clientsOf(area); const P = st.pool;
  const cidades = [...new Set(cls.map(c => c.cidade).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const q = norm(P.q);
  const pool = cls.filter(c => (P.modo === 'todos' || !c.dia) && (!P.status || norm(c.status) === norm(P.status)) && (!P.cidade || c.cidade === P.cidade) && (!P.freq || c.freq === P.freq) && (!q || norm(c.nome + ' ' + c.cod + ' ' + c.cidade).includes(q)))
    .sort((a, b) => String(a.cidade).localeCompare(b.cidade, 'pt-BR') || String(a.nome).localeCompare(b.nome, 'pt-BR'));
  const naoAloc = cls.filter(c => !c.dia).length;
  const cap = Number(st.cfg.cap) || 12;
  const last = new Date(m.getFullYear(), m.getMonth() + 1, 0);
  let d = addDays(m, -((m.getDay() + 6) % 7)); let cells = '';
  let monthVis = 0;
  while (d <= last) {
    for (let i = 0; i < 7; i++, d = addDays(d, 1)) {
      if (d.getDay() === 0) continue;
      const ds = ymd(d), inM = d.getMonth() === m.getMonth();
      const list = cls.filter(c => visitsOn(c, d)).sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999) || String(a.nome).localeCompare(b.nome, 'pt-BR'));
      if (inM) monthVis += list.length;
      const lim = st.expand.has(ds) ? list.length : 9;
      cells += `<div class="day${inM ? '' : ' out'}${ds === T ? ' today' : ''}${st.sel.size ? ' target' : ''}" data-date="${ds}">
        <div class="day-h"><span class="dn">${d.getDate()}</span><span class="dname">${DIAS_L[d.getDay()]}</span><span class="wk" title="Quinzena e semana do mês">Q${parity(d)} · M${nth(d)}</span><span class="load${list.length > cap ? ' full' : ''}" title="Visitas / máximo do dia">${list.length}/${cap}</span></div>
        <div class="evs">${list.slice(0, lim).map(c => `<div class="ev ${fcls(c)}${st.sel.has(c.cod) ? ' sel' : ''}" draggable="${canRoute()}" data-cod="${esc(c.cod)}" title="${esc(c.nome + ' · ' + (c.cidade || '') + ' · ' + code(c))}"><span>${esc(c.nome)}</span><em>${esc(code(c).split(' ')[0])}</em></div>`).join('')}
        ${list.length > lim ? `<button class="day-more" data-more="${ds}">+ ${list.length - lim} clientes</button>` : ''}${st.expand.has(ds) && list.length > 9 ? `<button class="day-more" data-less="${ds}">Mostrar menos</button>` : ''}</div></div>`;
    }
  }
  const selN = st.sel.size;
  $('#page').innerHTML = `
  <div class="toolbar">
    <div class="seg"><button id="mPrev" aria-label="Mês anterior">${ico('left')}</button><button id="mHoje">Hoje</button><button id="mNext" aria-label="Próximo mês">${ico('right')}</button></div>
    <h2 style="margin:0 6px;font-size:18px;font-weight:600">${esc((s => s[0].toUpperCase() + s.slice(1))(m.toLocaleDateString('pt-BR', { month: 'long' })) + ' ' + m.getFullYear())}</h2>
    <span class="pill">${num(monthVis)} visitas no mês</span>
    <span class="sp"></span>
    <div class="legend"><span><i class="dot f-S"></i>Semanal</span><span><i class="dot f-Q1"></i>Quinzenal ímpar · Q1</span><span><i class="dot f-Q2"></i>Quinzenal par · Q2</span><span><i class="dot f-M"></i>Mensal · M1–M5</span></div>
  </div>
  <div class="cal-layout">
    <aside class="card pool" id="pool">
      <div class="card-h"><h3>Clientes</h3><span class="pill ${naoAloc ? 'warn' : 'ok'}">${num(naoAloc)} não alocados</span><span class="sp"></span></div>
      <div class="card-b">
        <div class="seg" style="width:100%"><button data-modo="nao" class="${P.modo === 'nao' ? 'on' : ''}" style="flex:1">Não alocados</button><button data-modo="todos" class="${P.modo === 'todos' ? 'on' : ''}" style="flex:1">Todos</button></div>
        <div class="search">${ico('search')}<input class="inp" id="pq" placeholder="Buscar nome, código ou cidade" value="${esc(P.q)}"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <select class="inp" id="pStatus"><option value="">Status</option>${['Ativo', 'Pré-Inativo', 'Inativo'].map(s => `<option${s === P.status ? ' selected' : ''}>${s}</option>`).join('')}</select>
          <select class="inp" id="pFreq"><option value="">Frequência</option>${Object.entries(FREQ).map(([k, v]) => `<option value="${k}"${k === P.freq ? ' selected' : ''}>${v}</option>`).join('')}</select>
          <select class="inp" id="pCid" style="grid-column:1/-1"><option value="">Todas as cidades</option>${cidades.map(c => `<option${c === P.cidade ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select>
        </div>
        <div class="small muted" style="display:flex;gap:8px;align-items:center">${num(pool.length)} na lista ${pool.length && canRoute() ? `<button class="btn ghost sm" id="selAll">Selecionar todos</button>` : ''}</div>
      </div>
      ${selN ? `<div class="selbar"><span>${selN} selecionado${selN > 1 ? 's' : ''}</span><span class="sp" style="flex:1"></span>
        <div class="seg">${['S', 'Q', 'M'].map(f => `<button data-setf="${f}" title="Definir ${FREQ[f]}">${f}</button>`).join('')}</div>
        <button class="btn sm pri" id="autoDist">${ico('wand')}Distribuir</button><button class="btn sm" id="unalloc">Desalocar</button><button class="btn sm ghost icon" id="selClear" aria-label="Limpar seleção">${ico('x')}</button>
        <div class="small" style="flex-basis:100%;font-weight:500">Arraste para um dia, clique num dia do calendário ou use Distribuir.</div></div>` : ''}
      <div class="pool-list" id="plist">${pool.length ? pool.slice(0, 600).map(c => `<div class="chip${st.sel.has(c.cod) ? ' sel' : ''}" draggable="${canRoute()}" data-cod="${esc(c.cod)}"><span class="ck"></span><span class="t"><b>${esc(c.nome)}</b><small>${esc(c.cidade || '')} · ${esc(c.status || '')}${c.dia ? ' · ' + esc(code(c)) : ' · ' + esc(FREQ[c.freq])}</small></span></div>`).join('') + (pool.length > 600 ? `<p class="small muted" style="padding:8px">Mostrando 600 de ${num(pool.length)}. Use os filtros.</p>` : '') : `<div class="empty"><b>${cls.length ? 'Nada por aqui' : 'Sem clientes'}</b>${cls.length ? 'Todos os clientes deste filtro já estão no calendário.' : 'Este vendedor não tem clientes na carteira.'}</div>`}</div>
    </aside>
    <div><div class="cal" id="cal">${['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(x => `<div class="dow">${x}</div>`).join('')}${cells}</div>
    <p class="small muted" style="margin:10px 2px">Q1 = semanas ímpares e Q2 = semanas pares (pela ${st.cfg.paridade === 'mes' ? 'semana do mês' : 'semana do ano'}). M1 a M5 = em que semana do mês cai a visita mensal. Ao soltar um cliente num dia, o padrão é calculado pela data.</p></div>
  </div>`;
  bindCal(pool);
}
function bindCal(pool) {
  const P = st.pool;
  $('#mPrev').onclick = () => { st.mes = new Date(st.mes.getFullYear(), st.mes.getMonth() - 1, 1); render(); };
  $('#mNext').onclick = () => { st.mes = new Date(st.mes.getFullYear(), st.mes.getMonth() + 1, 1); render(); };
  $('#mHoje').onclick = () => { st.mes = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1); render(); };
  let tq; $('#pq').oninput = e => { P.q = e.target.value; clearTimeout(tq); tq = setTimeout(() => { render(); const i = $('#pq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 200); };
  $('#pStatus').onchange = e => { P.status = e.target.value; render(); };
  $('#pFreq').onchange = e => { P.freq = e.target.value; render(); };
  $('#pCid').onchange = e => { P.cidade = e.target.value; render(); };
  $$('[data-modo]').forEach(b => b.onclick = () => { P.modo = b.dataset.modo; render(); });
  const sa = $('#selAll'); if (sa) sa.onclick = () => { pool.forEach(c => st.sel.add(c.cod)); render(); };
  const sc = $('#selClear'); if (sc) sc.onclick = () => { st.sel.clear(); render(); };
  $$('[data-setf]').forEach(b => b.onclick = () => {
    const f = b.dataset.setf; const list = [...st.sel].map(cod => st.byCod.get(cod)).filter(Boolean).map(c => { const n = { ...c, freq: f }; if (c.dia) { n.semana = f === 'S' ? 0 : f === 'Q' ? (c.semana === 2 || c.semana === 4 ? 2 : 1) : Math.max(1, c.semana || 1); } else n.semana = f === 'S' ? 0 : 1; return n; });
    saveRotas(list, `${list.length} clientes agora com frequência ${FREQ[f].toLowerCase()}`);
  });
  const un = $('#unalloc'); if (un) un.onclick = () => { const list = [...st.sel].map(c => ({ ...st.byCod.get(c), dia: null, ordem: null })); st.sel.clear(); saveRotas(list, `${list.length} clientes voltaram para não alocados`); };
  const ad = $('#autoDist'); if (ad) ad.onclick = openDistribuir;
  const page = $('#page');
  page.onclick = e => {
    const more = e.target.closest('[data-more]'); if (more) { st.expand.add(more.dataset.more); render(); return; }
    const less = e.target.closest('[data-less]'); if (less) { st.expand.delete(less.dataset.less); render(); return; }
    const chip = e.target.closest('.chip'); if (chip) { if (!canRoute()) return; const c = chip.dataset.cod; st.sel.has(c) ? st.sel.delete(c) : st.sel.add(c); render(); return; }
    const ev = e.target.closest('.ev'); if (ev) { if (e.shiftKey || e.ctrlKey || e.metaKey) { const c = ev.dataset.cod; st.sel.has(c) ? st.sel.delete(c) : st.sel.add(c); render(); } else openCliente(ev.dataset.cod); return; }
    const day = e.target.closest('.day'); if (day && st.sel.size && canRoute()) moveTo([...st.sel], day.dataset.date);
  };
  let dragCods = [];
  page.ondragstart = e => { const el = e.target.closest('.chip,.ev'); if (!el) return; const c = el.dataset.cod; dragCods = st.sel.has(c) ? [...st.sel] : [c]; e.dataTransfer.setData('text/plain', c); e.dataTransfer.effectAllowed = 'move'; el.classList.add('dragging'); };
  page.ondragend = e => { const el = e.target.closest('.chip,.ev'); if (el) el.classList.remove('dragging'); $$('.drop').forEach(x => x.classList.remove('drop')); };
  page.ondragover = e => { const z = e.target.closest('.day,.pool'); if (!z || !dragCods.length) return; e.preventDefault(); $$('.drop').forEach(x => x !== z && x.classList.remove('drop')); z.classList.add('drop'); };
  page.ondragleave = e => { const z = e.target.closest('.day,.pool'); if (z && !z.contains(e.relatedTarget)) z.classList.remove('drop'); };
  page.ondrop = e => {
    const z = e.target.closest('.day,.pool'); $$('.drop').forEach(x => x.classList.remove('drop')); if (!z || !dragCods.length) return; e.preventDefault();
    const cods = dragCods; dragCods = [];
    if (z.classList.contains('pool')) { const list = cods.map(c => ({ ...st.byCod.get(c), dia: null, ordem: null })); st.sel.clear(); saveRotas(list, list.length > 1 ? `${list.length} clientes desalocados` : `${list[0].nome} voltou para não alocados`); }
    else moveTo(cods, z.dataset.date);
  };
}
function moveTo(cods, ds) {
  const d = parse(ds); const dayList = clientsOf(st.area).filter(c => visitsOn(c, d) && !cods.includes(c.cod));
  let ord = dayList.reduce((m, c) => Math.max(m, c.ordem || 0), 0);
  const list = cods.map(cod => { const c = st.byCod.get(cod); return { ...c, ...slotFor(c, d), ordem: ++ord }; });
  st.sel.clear();
  saveRotas(list, list.length > 1 ? `${list.length} clientes alocados em ${brDate(ds)}` : `${list[0].nome} → ${code(list[0])}`);
}
function openDistribuir(cods, onDone) {
  const sel = (cods || [...st.sel]).map(c => st.byCod.get(c)).filter(Boolean);
  modal({
    title: 'Distribuir automaticamente', sub: `${sel.length} clientes selecionados. O sistema agrupa por cidade e equilibra a carga entre os dias.`,
    body: `<div class="fld"><span>Dias de visita</span><div style="display:flex;flex-wrap:wrap;gap:6px">${[1, 2, 3, 4, 5, 6].map(d => `<label class="btn sm ${d < 6 ? 'on' : ''}" style="cursor:pointer"><input type="checkbox" value="${d}" ${d < 6 ? 'checked' : ''} hidden>${DIAS_L[d]}</label>`).join('')}</div></div>
      <div class="fld"><span>Frequência</span><select class="inp" id="dFreq"><option value="manter">Manter a frequência de cada cliente</option><option value="status">Pelo status: Ativo quinzenal, Pré-Inativo quinzenal, Inativo mensal</option><option value="S">Todos semanal</option><option value="Q">Todos quinzenal</option><option value="M">Todos mensal</option></select></div>
      <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="dKeep" checked> Considerar os clientes que já estão no calendário para equilibrar a carga</label>
      <div id="dPrev" class="card" style="padding:12px"></div>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn pri" id="dGo">${ico('wand')}Aplicar distribuição</button>`,
    onMount(ov, close) {
      const calc = () => {
        const dias = $$('input[type=checkbox][value]', ov).filter(x => x.checked).map(x => Number(x.value));
        const fm = $('#dFreq', ov).value;
        const list = sel.map(c => { let f = c.freq; if (fm === 'status') f = norm(c.status).startsWith('inativo') ? 'M' : 'Q'; else if (fm !== 'manter') f = fm; return { ...c, freq: f, dia: null }; });
        const ids = new Set(sel.map(c => c.cod)), keep = $('#dKeep', ov).checked, res = [];
        if (dias.length) [...new Set(list.map(c => c.area))].forEach(a => { const ex = keep ? clientsOf(a).filter(c => c.dia && !ids.has(c.cod)) : []; res.push(...distribuir(list.filter(c => c.area === a), ex, dias)); });
        const per = {}; res.forEach(c => per[c.dia] = (per[c.dia] || 0) + 1);
        $('#dPrev', ov).innerHTML = dias.length ? `<div class="small muted" style="margin-bottom:8px">Clientes por dia da semana</div>${dias.map(d => `<div class="hbar"><span>${DIAS_L[d]}</span><span class="t"><i style="width:${(per[d] || 0) / Math.max(1, ...Object.values(per)) * 100}%;background:var(--primary)"></i></span><span class="v">${per[d] || 0}</span></div>`).join('')}` : '<span class="muted">Escolha ao menos um dia.</span>';
        return res;
      };
      $$('label.btn', ov).forEach(l => l.addEventListener('click', e => { e.preventDefault(); const i = $('input', l); i.checked = !i.checked; l.classList.toggle('on', i.checked); calc(); }));
      $('#dFreq', ov).onchange = calc; $('#dKeep', ov).onchange = calc; calc();
      $('#dGo', ov).onclick = () => { const r = calc(); if (!r.length) return; close(); st.sel.clear(); st.bsel.clear(); saveRotas(r, `${r.length} clientes distribuídos no calendário`); onDone && onDone(); };
    }
  });
}

/* =================== cliente (modal) =================== */
function openCliente(cod) {
  const c = st.byCod.get(cod); if (!c) return;
  const hist = [...st.visitas.values()].filter(v => v.cod === cod && (v.visitou || v.conversa)).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 6);
  const ed = canRoute();
  modal({
    title: c.nome, sub: `${esc(c.cod)} · ${esc(c.cidade || '')} · ${esc(vendName(c.area))}`,
    body: `<div style="display:flex;flex-wrap:wrap;gap:6px">${statusPill(c.status)}${c.segmento ? `<span class="pill">${esc(c.segmento)}</span>` : ''}${c.ult_compra ? `<span class="pill">Última compra ${esc(brDate(c.ult_compra))}${c.dias_sem_compra != null ? ' · ' + esc(c.dias_sem_compra) + ' dias' : ''}</span>` : ''}</div>
      <div class="form">
        <label class="fld"><span>Frequência</span><select class="inp" id="mFreq" ${ed ? '' : 'disabled'}>${Object.entries(FREQ).map(([k, v]) => `<option value="${k}"${k === c.freq ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="fld"><span>Semana</span><select class="inp" id="mSem" ${ed ? '' : 'disabled'}></select></label>
        <label class="fld"><span>Dia da visita</span><select class="inp" id="mDia" ${ed ? '' : 'disabled'}><option value="">Não alocado</option>${[1, 2, 3, 4, 5, 6].map(d => `<option value="${d}"${d === c.dia ? ' selected' : ''}>${DIAS_L[d]}</option>`).join('')}</select></label>
        <div class="fld"><span>Código da visita</span><div style="height:36px;display:flex;align-items:center" id="mCode"></div></div>
        <label class="fld w"><span>Endereço (usado na rota do Maps)</span><input class="inp" id="mEnd" value="${esc(c.endereco || '')}" ${ed ? '' : 'disabled'} placeholder="Rua, número, bairro"></label>
        <label class="fld"><span>Telefone</span><input class="inp" id="mTel" value="${esc(c.telefone || '')}" ${ed ? '' : 'disabled'}></label>
      </div>
      ${hist.length ? `<div><div class="small muted" style="font-weight:600;margin-bottom:4px">Últimas visitas</div>${hist.map(v => `<div class="conv"><div class="h"><b>${esc(brDate(v.data))}</b>${v.resultado === 'vendeu' ? `<span class="pill ok">Vendeu ${esc(brl2(v.valor))}</span>` : v.resultado === 'nao' ? `<span class="pill bad">Não vendeu · ${esc(v.motivo || 'sem motivo')}</span>` : v.visitou ? '<span class="pill blue">Visitado</span>' : ''}</div>${v.conversa ? `<div>${esc(v.conversa)}</div>` : ''}</div>`).join('')}</div>` : ''}`,
    foot: ed ? `<button class="btn" data-close>Cancelar</button><button class="btn pri" id="mSave">Salvar</button>` : `<button class="btn" data-close>Fechar</button>`,
    onMount(ov, close) {
      const sem = () => { const f = $('#mFreq', ov).value, s = $('#mSem', ov), cur = Number(s.value || c.semana || 1); s.disabled = !ed || f === 'S'; s.innerHTML = f === 'Q' ? '<option value="1">Ímpar · Q1</option><option value="2">Par · Q2</option>' : f === 'M' ? [1, 2, 3, 4, 5].map(n => `<option value="${n}">${n}ª semana · M${n}</option>`).join('') : '<option value="0">Toda semana</option>'; if ([...s.options].some(o => Number(o.value) === cur)) s.value = String(cur); upd(); };
      const form = () => { const f = $('#mFreq', ov).value; return { freq: f, semana: f === 'S' ? 0 : Number($('#mSem', ov).value), dia: $('#mDia', ov).value ? Number($('#mDia', ov).value) : null }; };
      const upd = () => { $('#mCode', ov).innerHTML = codePill(form()); };
      $('#mFreq', ov).onchange = sem; $('#mSem', ov).onchange = upd; $('#mDia', ov).onchange = upd; sem();
      const sv = $('#mSave', ov); if (sv) sv.onclick = async () => {
        const n = { ...c, ...form(), endereco: $('#mEnd', ov).value.trim(), telefone: $('#mTel', ov).value.trim() };
        if (!n.dia) n.ordem = null;
        close(); const prev = { ...c }; Object.assign(c, n); render();
        try { await api.saveCliente({ cod: n.cod, freq: n.freq, semana: n.semana, dia: n.dia, ordem: n.ordem, endereco: n.endereco, telefone: n.telefone }); toast('Cliente salvo · ' + code(n)); }
        catch (e) { Object.assign(c, prev); render(); toast(errMsg(e), 'bad'); }
      };
    }
  });
}

/* =================== ROTEIRO DO DIA =================== */
function dayStops(area, ds) {
  const d = parse(ds);
  const plan = clientsOf(area).filter(c => visitsOn(c, d)).sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999) || String(a.nome).localeCompare(b.nome, 'pt-BR'));
  const ids = new Set(plan.map(c => c.cod));
  const extra = [...st.visitas.values()].filter(v => v.data === ds && !ids.has(v.cod) && (!area || v.area === area) && st.byCod.has(v.cod)).map(v => ({ ...st.byCod.get(v.cod), _extra: true }));
  return { plan, extra };
}
const vstat = v => !v || !v.visitou ? '' : v.resultado === 'vendeu' ? 'vendeu' : v.resultado === 'nao' ? 'nao' : 'vis';
async function vRoteiro() {
  const area = needArea(); const ds = st.dia;
  top('Roteiro do dia', vendSelect(false));
  if (!st.meses.has(ds.slice(0, 7))) { $('#page').innerHTML = '<div class="boot" style="height:200px"><div class="spinner"></div></div>'; try { await ensureVisitas(ds, ds); } catch (e) { toast('Não foi possível carregar as visitas', 'bad'); } if (st.view === 'roteiro') render(); return; }
  const { plan, extra } = dayStops(area, ds); const all = [...plan, ...extra];
  const V = all.map(c => st.visitas.get(vk(ds, c.cod)));
  const vis = V.filter(v => v && v.visitou).length, vend = V.filter(v => v && v.visitou && v.resultado === 'vendeu'), tot = vend.reduce((s, v) => s + Number(v.valor || 0), 0);
  const pend = all.filter((c, i) => !(V[i] && V[i].visitou));
  const addr = c => c.endereco ? c.endereco + ', ' + (c.cidade || '') + ' - SP' : c.nome + ', ' + (c.cidade || '') + ' - SP';
  const mapsLinks = chunk(pend, 9).map((g, i, a) => `<a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/dir//${g.map(c => encodeURIComponent(addr(c))).join('/')}">${ico('map')}Rota no Maps${a.length > 1 ? ' · ' + (i + 1) : ''}</a>`).join('');
  const dObj = parse(ds), mot = st.cfg.motivos || [];
  const wa = t => { const n = String(t || '').replace(/\D/g, ''); return n.length >= 10 ? 'https://wa.me/55' + n.replace(/^55/, '') : ''; };
  $('#page').innerHTML = `
  <div class="toolbar">
    <div class="seg"><button id="dPrev" aria-label="Dia anterior">${ico('left')}</button><button id="dHoje">Hoje</button><button id="dNext" aria-label="Próximo dia">${ico('right')}</button></div>
    <input type="date" class="inp" id="dPick" value="${ds}" aria-label="Data">
    <h2 style="margin:0 6px;font-size:18px;font-weight:600">${esc(DIAS_L[dObj.getDay()])}, ${dObj.getDate()} de ${esc(dObj.toLocaleDateString('pt-BR', { month: 'long' }))}</h2>
    <span class="sp"></span>${mapsLinks}<a class="btn" href="#produtividade" id="toRes">${ico('chart')}Resumo do dia</a>
  </div>
  <div class="kpis">
    <div class="kpi"><span>Planejadas</span><b>${plan.length}</b><small>${extra.length ? extra.length + ' visita(s) extra' : 'no roteiro'}</small></div>
    <div class="kpi"><span>Visitados</span><b>${vis}<span class="muted" style="font-size:16px;font-weight:600"> / ${all.length}</span></b><small>${pend.length} pendente(s)</small></div>
    <div class="kpi"><span>Vendas</span><b>${vend.length}</b><small>Positivação ${pct(vend.length, vis)}</small></div>
    <div class="kpi"><span>Vendido no dia</span><b>${brl(tot)}</b><small>${vend.length ? 'Ticket médio ' + brl(tot / vend.length) : 'Nenhuma venda ainda'}</small></div>
  </div>
  <div class="progress"><div class="meter"><i style="width:${all.length ? vis / all.length * 100 : 0}%"></i></div><span class="small muted">${pct(vis, all.length)} concluído</span></div>
  <div class="route" id="route">${all.length ? all.map((c, i) => { const v = V[i] || {}; const s = vstat(v); const w = wa(c.telefone); return `
    <article class="stop ${s}" data-cod="${esc(c.cod)}">
      <div class="n">${s === 'vendeu' || s === 'nao' || s === 'vis' ? ico('check') : i + 1}</div>
      <div><h4>${esc(c.nome)} ${c._extra ? '<span class="pill blue">Extra</span>' : codePill(c)} ${statusPill(c.status)}</h4>
        <div class="meta"><span>${esc(c.cod)}</span><span>${esc(c.cidade || '')}</span>${c.segmento ? `<span>${esc(c.segmento)}</span>` : ''}${c.dias_sem_compra != null ? `<span>${esc(c.dias_sem_compra)} dias sem compra</span>` : ''}${v.hora ? `<span>Check-in ${esc(v.hora)}</span>` : ''}${!area ? `<span>${esc(vendName(c.area))}</span>` : ''}</div>
        <div class="links">${c.telefone ? `<a class="btn sm" href="tel:${esc(String(c.telefone).replace(/[^\d+]/g, ''))}">${ico('phone')}${esc(c.telefone)}</a>` : ''}${w ? `<a class="btn sm" target="_blank" rel="noopener" href="${esc(w)}">${ico('chat')}WhatsApp</a>` : ''}<a class="btn sm" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr(c))}">${ico('map')}Mapa</a><button class="btn sm ghost" data-info="${esc(c.cod)}">Histórico</button></div></div>
      <div class="ord">${c._extra ? '' : `<button class="btn sm icon" data-a="up" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>${ico('up')}</button><button class="btn sm icon" data-a="dn" aria-label="Descer" ${i >= plan.length - 1 ? 'disabled' : ''}>${ico('down')}</button>`}</div>
      <div class="acts">
        <button class="btn c${v.visitou ? ' on' : ''}" data-a="vis">${ico('check')}${v.visitou ? 'Visitado' : 'Visitei'}</button>
        <button class="btn v${v.resultado === 'vendeu' ? ' on' : ''}" data-a="vendeu">Vendi</button>
        <button class="btn x${v.resultado === 'nao' ? ' on' : ''}" data-a="nao">Não vendi</button>
        ${v.resultado === 'vendeu' ? `<input class="inp" data-f="valor" inputmode="decimal" placeholder="Valor do pedido (R$)" value="${v.valor ? esc(String(v.valor).replace('.', ',')) : ''}" style="width:190px">` : ''}
        ${v.resultado === 'nao' ? `<select class="inp" data-f="motivo"><option value="">Por que não vendeu?</option>${mot.map(o => `<option${o === v.motivo ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>` : ''}
        <textarea class="inp" data-f="conversa" rows="1" style="min-height:40px" placeholder="Conversa de hoje: o que foi falado, combinados, próximo passo">${esc(v.conversa || '')}</textarea>
      </div></article>`; }).join('') : `<div class="card empty"><b>Nenhuma visita neste dia</b>${dObj.getDay() === 0 ? 'Domingo não tem roteiro.' : 'Não há clientes alocados para este dia. Monte o roteiro no Calendário.'}</div>`}</div>
  <div class="card" style="margin-top:16px"><div class="card-h"><h3>Visita fora do roteiro</h3></div><div class="card-b" style="display:flex;gap:8px;flex-wrap:wrap">
    <div class="search" style="flex:1;min-width:240px">${ico('search')}<input class="inp" id="xq" list="xlist" placeholder="Código ou nome do cliente"></div><datalist id="xlist">${clientsOf(area).slice(0, 3000).map(c => `<option value="${esc(c.cod + ' — ' + c.nome)}">`).join('')}</datalist>
    <button class="btn pri" id="xAdd">${ico('plus')}Registrar visita extra</button></div></div>`;
  const setD = s => { st.dia = s; render(); };
  const step = n => { let d = addDays(parse(st.dia), n); if (d.getDay() === 0) d = addDays(d, n); setD(ymd(d)); };
  $('#dPrev').onclick = () => step(-1); $('#dNext').onclick = () => step(1); $('#dHoje').onclick = () => setD(T);
  $('#dPick').onchange = e => e.target.value && setD(e.target.value);
  $('#toRes').onclick = () => { st.res.ini = st.res.fim = st.dia; };
  const R = $('#route');
  R.onclick = e => {
    const inf = e.target.closest('[data-info]'); if (inf) { openCliente(inf.dataset.info); return; }
    const b = e.target.closest('button[data-a]'); if (!b) return; const cod = b.closest('.stop').dataset.cod, a = b.dataset.a, v = st.visitas.get(vk(st.dia, cod)) || {};
    if (a === 'vis') saveVisita(cod, { visitou: !v.visitou });
    else if (a === 'vendeu' || a === 'nao') saveVisita(cod, v.resultado === a ? { resultado: null, visitou: true } : { resultado: a, visitou: true, ...(a === 'vendeu' ? { motivo: null } : { valor: 0 }) });
    else { const i = plan.findIndex(c => c.cod === cod), j = a === 'up' ? i - 1 : i + 1; if (i < 0 || j < 0 || j >= plan.length) return; const p = plan.slice(); [p[i], p[j]] = [p[j], p[i]]; saveRotas(p.map((c, k) => ({ ...c, ordem: k + 1 })).filter((c, k) => plan[k].cod !== c.cod || (plan[k].ordem ?? 0) !== k + 1)); }
  };
  R.onchange = e => {
    const f = e.target.dataset.f; if (!f) return; const cod = e.target.closest('.stop').dataset.cod; let val = e.target.value;
    if (f === 'valor') val = Number(String(val).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')) || 0;
    if (f === 'conversa') val = val.trim() || null;
    saveVisita(cod, { [f]: val, ...(f === 'conversa' ? {} : { visitou: true }) });
  };
  $('#xAdd').onclick = () => { const q = $('#xq').value.trim(); if (!q) return; const code0 = q.split(' — ')[0]; const c = st.byCod.get(code0) || clientsOf(area).find(c => norm(c.nome + ' ' + c.cod).includes(norm(q))); if (!c) { toast('Cliente não encontrado', 'bad'); return; } saveVisita(c.cod, { visitou: true }); toast(c.nome + ' adicionado ao dia'); };
}


/* =================== SELEÇÃO E ALTERAÇÃO EM MASSA =================== */
const TIPOS = [['S', 'S · Semanal'], ['Q1', 'Q1 · Quinzenal, semanas ímpares'], ['Q2', 'Q2 · Quinzenal, semanas pares'], ['M1', 'M1 · Mensal, 1ª semana'], ['M2', 'M2 · Mensal, 2ª semana'], ['M3', 'M3 · Mensal, 3ª semana'], ['M4', 'M4 · Mensal, 4ª semana'], ['M5', 'M5 · Mensal, 5ª semana']];
const ckHead = pageCods => `<th class="ck-cell"><input type="checkbox" class="bk" data-all="1" ${pageCods.length && pageCods.every(c => st.bsel.has(c)) ? 'checked' : ''} aria-label="Selecionar todos desta página"></th>`;
const ckCell = cod => `<td class="ck-cell"><input type="checkbox" class="bk" data-ck="${esc(cod)}" ${st.bsel.has(cod) ? 'checked' : ''} aria-label="Selecionar cliente"></td>`;
function bulkBar(rows) {
  const n = st.bsel.size; if (!n) return '';
  const vs = isAdmin() ? routeVends() : [];
  return `<div class="bulk"><b>${num(n)} selecionado${n > 1 ? 's' : ''}</b>${rows.length > n ? `<button class="btn ghost sm" id="bkAll">Selecionar todos os ${num(rows.length)} do filtro</button>` : ''}<span class="sp"></span>
    ${canRoute() ? `<select class="inp" id="bkTipo" aria-label="Tipo de visita"><option value="">Tipo de visita: manter</option>${TIPOS.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>
    <select class="inp" id="bkDia" aria-label="Dia"><option value="">Dia: manter</option>${[1, 2, 3, 4, 5, 6].map(d => `<option value="${d}">${DIAS_L[d]}</option>`).join('')}<option value="0">Tirar do calendário</option></select>` : ''}
    ${vs.length ? `<select class="inp" id="bkVend" aria-label="Vendedor"><option value="">Vendedor: manter</option>${vs.map(v => `<option value="${esc(v.area)}">${esc(v.nome)} · ${esc(v.area)}</option>`).join('')}</select>` : ''}
    <button class="btn pri sm" id="bkGo">Aplicar</button>${canRoute() ? `<button class="btn sm" id="bkDist">${ico('wand')}Distribuir</button>` : ''}<button class="btn ghost sm icon" id="bkClr" aria-label="Limpar seleção">${ico('x')}</button></div>`;
}
function bindBulk(rows, pageCods) {
  const pg = $('#page');
  pg.onchange = e => {
    const b = e.target.closest('.bk'); if (!b) return;
    if (b.dataset.all) { const on = b.checked; pageCods.forEach(c => on ? st.bsel.add(c) : st.bsel.delete(c)); }
    else b.checked ? st.bsel.add(b.dataset.ck) : st.bsel.delete(b.dataset.ck);
    render();
  };
  const a = $('#bkAll'); if (a) a.onclick = () => { rows.forEach(c => st.bsel.add(c.cod)); render(); };
  const c = $('#bkClr'); if (c) c.onclick = () => { st.bsel.clear(); render(); };
  const d = $('#bkDist'); if (d) d.onclick = () => openDistribuir([...st.bsel]);
  const g = $('#bkGo'); if (g) g.onclick = () => applyBulk(($('#bkTipo') || {}).value || '', ($('#bkDia') || {}).value || '', ($('#bkVend') || {}).value || '');
}
async function applyBulk(tipo, dia, vend) {
  const cods = [...st.bsel].filter(c => st.byCod.has(c));
  if (!cods.length) return;
  if (!tipo && !dia && !vend) { toast('Escolha o que alterar: tipo de visita, dia ou vendedor', 'bad'); return; }
  if (vend) {
    const v = vendByArea(vend), prev = cods.map(c => [c, st.byCod.get(c).area, st.byCod.get(c).equipe]);
    cods.forEach(c => Object.assign(st.byCod.get(c), { area: vend, equipe: v.equipe || null }));
    try { await api.moverClientes(cods, vend, v.equipe || null); }
    catch (e) { prev.forEach(([c, a, q]) => Object.assign(st.byCod.get(c), { area: a, equipe: q })); render(); toast(errMsg(e), 'bad'); return; }
  }
  st.bsel.clear();
  if (tipo || dia) {
    const list = cods.map(cod => {
      const c = st.byCod.get(cod), n = { ...c };
      if (tipo) { n.freq = tipo[0]; n.semana = tipo === 'S' ? 0 : Number(tipo[1]); }
      if (dia === '0') { n.dia = null; n.ordem = null; } else if (dia) { n.dia = Number(dia); if (c.dia !== n.dia) n.ordem = null; }
      return n;
    });
    const ex = list[0]; const ok = list.every(n => code(n) === code(ex));
    await saveRotas(list, `${num(list.length)} clientes atualizados${ok && ex.dia ? ' · ' + code(ex) : ''}${vend ? ' e transferidos para ' + vendName(vend) : ''}`);
  } else { render(); toast(`${num(cods.length)} clientes transferidos para ${vendName(vend)}`); }
}

/* =================== RELATÓRIO =================== */
function relRows() {
  const R = st.rel, q = norm(R.q);
  const tipoOf = c => !c.dia ? '' : c.freq === 'S' ? 'S' : (c.freq === 'Q' ? 'Q' : 'M') + c.semana;
  return clientsOf(st.area).filter(c => (!R.status || (R.status === 'nao' ? !c.dia : norm(c.status) === norm(R.status))) && (!R.cidade || c.cidade === R.cidade) && (!R.tipo || (R.tipo === 'nao' ? !c.dia : tipoOf(c) === R.tipo)) && (!R.dia || String(c.dia || '') === R.dia) && (!q || norm([c.nome, c.cod, c.cidade, code(c)].join(' ')).includes(q)))
    .sort((a, b) => String(a.area).localeCompare(b.area) || (a.dia || 9) - (b.dia || 9) || (a.semana || 0) - (b.semana || 0) || (a.ordem ?? 999) - (b.ordem ?? 999) || String(a.nome).localeCompare(b.nome, 'pt-BR'));
}
function vRelatorio() {
  top('Relatório de visitas', vendSelect(canPick()));
  const cls = clientsOf(st.area), m = st.mes;
  const key = c => c.freq === 'S' ? 'S' : (c.freq === 'Q' ? 'Q' : 'M') + c.semana;
  const rowsMx = [['S', 'Semanal'], ['Q1', 'Quinzenal · semanas ímpares'], ['Q2', 'Quinzenal · semanas pares'], ['M1', 'Mensal · 1ª semana'], ['M2', 'Mensal · 2ª semana'], ['M3', 'Mensal · 3ª semana'], ['M4', 'Mensal · 4ª semana'], ['M5', 'Mensal · 5ª semana']];
  const cnt = {}, mes = {}; cls.forEach(c => { if (c.dia) { const k = key(c) + '|' + c.dia; cnt[k] = (cnt[k] || 0) + 1; mes[c.dia] = (mes[c.dia] || 0) + visitsInMonth(c, m); } });
  const rows = relRows(), PG = 100, pages = Math.max(1, Math.ceil(rows.length / PG)); if (st.rel.page >= pages) st.rel.page = 0; const pg = rows.slice(st.rel.page * PG, st.rel.page * PG + PG);
  const aloc = cls.filter(c => c.dia).length;
  $('#page').innerHTML = `
  <div class="kpis">
    <div class="kpi"><span>Clientes na carteira</span><b>${num(cls.length)}</b><small>${esc(st.area ? vendName(st.area) : 'Todos os vendedores')}</small></div>
    <div class="kpi"><span>Alocados no roteiro</span><b>${num(aloc)}</b><div class="meter"><i style="width:${cls.length ? aloc / cls.length * 100 : 0}%"></i></div></div>
    <div class="kpi"><span>Visitas previstas em ${esc(m.toLocaleDateString('pt-BR', { month: 'long' }))}</span><b>${num(Object.values(mes).reduce((a, b) => a + b, 0))}</b><small>${Object.keys(mes).length ? 'média de ' + Math.round(Object.values(mes).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(mes).length * 4.3)) + ' por dia' : 'sem roteiro'}</small></div>
    <div class="kpi"><span>Semanal · Quinzenal · Mensal</span><b>${['S', 'Q', 'M'].map(f => num(cls.filter(c => c.dia && c.freq === f).length)).join(' · ')}</b><small>clientes alocados</small></div>
  </div>
  <div class="card" style="margin-bottom:16px"><div class="card-h"><h3>Carteira por dia e tipo de visita</h3><span class="sp"></span><span class="small muted">Clientes alocados</span></div><div class="tbl-wrap"><table class="tbl mx"><thead><tr><th>Visita</th>${[1, 2, 3, 4, 5, 6].map(d => `<th>${DIAS[d]}</th>`).join('')}<th>Total</th></tr></thead><tbody>
    ${rowsMx.map(([k, l]) => { const t = [1, 2, 3, 4, 5, 6].reduce((s, d) => s + (cnt[k + '|' + d] || 0), 0); return `<tr><td><span class="code ${k === 'S' ? 'f-S' : k === 'Q1' ? 'f-Q1' : k === 'Q2' ? 'f-Q2' : 'f-M'}">${k}</span> <span class="muted small">${l}</span></td>${[1, 2, 3, 4, 5, 6].map(d => `<td class="${cnt[k + '|' + d] ? '' : 'z'}">${cnt[k + '|' + d] || '—'}</td>`).join('')}<td><b>${t || '—'}</b></td></tr>`; }).join('')}
    <tr><td><b>Visitas em ${esc(m.toLocaleDateString('pt-BR', { month: 'long' }))}</b></td>${[1, 2, 3, 4, 5, 6].map(d => `<td><b>${mes[d] || '—'}</b></td>`).join('')}<td><b>${num(Object.values(mes).reduce((a, b) => a + b, 0))}</b></td></tr></tbody></table></div></div>
  <div class="card"><div class="card-h" style="flex-wrap:wrap"><h3>Clientes e código de visita</h3><span class="pill">${num(rows.length)}</span><span class="sp"></span>
    <div class="search" style="width:260px">${ico('search')}<input class="inp" id="rq" placeholder="Buscar cliente, cidade, código" value="${esc(st.rel.q)}"></div>
    <select class="inp" id="rs"><option value="">Todos os status</option>${['Ativo', 'Pré-Inativo', 'Inativo'].map(s => `<option${s === st.rel.status ? ' selected' : ''}>${s}</option>`).join('')}</select>
    <select class="inp" id="rc"><option value="">Todas as cidades</option>${[...new Set(cls.map(c => c.cidade).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')).map(x => `<option${x === st.rel.cidade ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select>
    <select class="inp" id="rt"><option value="">Todos os tipos</option><option value="nao"${st.rel.tipo === 'nao' ? ' selected' : ''}>Não alocados</option>${TIPOS.map(([k]) => `<option value="${k}"${k === st.rel.tipo ? ' selected' : ''}>${k}</option>`).join('')}</select>
    <select class="inp" id="rd"><option value="">Todos os dias</option>${[1, 2, 3, 4, 5, 6].map(d => `<option value="${d}"${String(d) === st.rel.dia ? ' selected' : ''}>${DIAS_L[d]}</option>`).join('')}</select>
    <button class="btn" id="rx">${ico('download')}Exportar Excel</button></div>
    ${bulkBar(rows)}
    <div class="tbl-wrap"><table class="tbl stack"><thead><tr>${ckHead(pg.map(c => c.cod))}<th>Visita</th><th>Código</th><th>Cliente</th><th>Cidade</th><th>Status</th>${st.area ? '' : '<th>Vendedor</th>'}<th>Frequência</th><th class="r">Visitas no mês</th></tr></thead><tbody id="rtb">
    ${pg.map(c => `<tr class="click${st.bsel.has(c.cod) ? ' picked' : ''}" data-cod="${esc(c.cod)}">${ckCell(c.cod)}<td>${codePill(c)}</td><td class="muted">${esc(c.cod)}</td><td class="nm">${esc(c.nome)}</td><td>${esc(c.cidade || '')}</td><td>${statusPill(c.status)}</td>${st.area ? '' : `<td>${esc(vendName(c.area))}</td>`}<td>${esc(FREQ[c.freq])}</td><td class="r">${c.dia ? visitsInMonth(c, m) : '—'}</td></tr>`).join('') || `<tr><td colspan="9"><div class="empty">Nenhum cliente neste filtro.</div></td></tr>`}</tbody></table></div>
    ${pages > 1 ? `<div class="pager"><span>Página ${st.rel.page + 1} de ${pages}</span><span class="sp" style="flex:1"></span><button class="btn sm" id="rpP" ${st.rel.page ? '' : 'disabled'}>Anterior</button><button class="btn sm" id="rpN" ${st.rel.page < pages - 1 ? '' : 'disabled'}>Próxima</button></div>` : ''}</div>`;
  let t; $('#rq').oninput = e => { st.rel.q = e.target.value; st.rel.page = 0; clearTimeout(t); t = setTimeout(() => { render(); const i = $('#rq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); };
  $('#rs').onchange = e => { st.rel.status = e.target.value; st.rel.page = 0; render(); };
  $('#rc').onchange = e => { st.rel.cidade = e.target.value; st.rel.page = 0; render(); };
  $('#rt').onchange = e => { st.rel.tipo = e.target.value; st.rel.page = 0; render(); };
  $('#rd').onchange = e => { st.rel.dia = e.target.value; st.rel.page = 0; render(); };
  bindBulk(rows, pg.map(c => c.cod));
  const p = $('#rpP'), n = $('#rpN'); if (p) p.onclick = () => { st.rel.page--; render(); }; if (n) n.onclick = () => { st.rel.page++; render(); };
  $('#rtb').onclick = e => { if (e.target.closest('.ck-cell')) return; const r = e.target.closest('tr[data-cod]'); if (r) openCliente(r.dataset.cod); };
  $('#rx').onclick = () => exportXlsx(`roteiro_${st.area ? vendName(st.area).replace(/\W+/g, '_') : 'todos'}_${ymd(m).slice(0, 7)}.xlsx`, ['Visita', 'Freq', 'Semana', 'Dia', 'Ordem', 'Código', 'Cliente', 'Cidade', 'Endereço', 'Telefone', 'Status', 'Segmento', 'Área', 'Vendedor', 'Equipe', 'Visitas no mês'],
    rows.map(c => [c.dia ? code(c) : '', FREQ[c.freq], c.freq === 'S' ? 'Toda' : c.freq === 'Q' ? (c.semana === 2 ? 'Par' : 'Ímpar') : c.semana + 'ª', c.dia ? DIAS_L[c.dia] : '', c.ordem ?? '', c.cod, c.nome, c.cidade || '', c.endereco || '', c.telefone || '', c.status || '', c.segmento || '', c.area || '', vendName(c.area), c.equipe || '', c.dia ? visitsInMonth(c, m) : 0]), 'Roteiro');
}

/* =================== PRODUTIVIDADE =================== */
function summary(area, ini, fim, equipe) {
  const cls = st.clientes.filter(c => (!area || c.area === area) && (!equipe || c.equipe === equipe));
  const R = { planAte: 0, real: 0, extra: 0, visit: 0, vend: 0, valor: 0, nao: 0, mot: {}, nv: [], conv: [], dia: [] };
  const byDay = {}; st.visitas.forEach(v => { if (v.data >= ini && v.data <= fim && (!area || v.area === area) && (!equipe || v.equipe === equipe)) (byDay[v.data] = byDay[v.data] || []).push(v); });
  for (let d = parse(ini), n = 0; d <= parse(fim) && n < 370; d = addDays(d, 1), n++) {
    const ds = ymd(d); if (d.getDay() === 0 && !byDay[ds]) continue;
    const p = cls.filter(c => visitsOn(c, d)), pid = new Set(p.map(c => c.cod)), xs = byDay[ds] || [];
    const D = { ds, plan: p.length, visit: 0, extra: 0, vend: 0, valor: 0, real: 0 };
    p.forEach(c => { const v = st.visitas.get(vk(ds, c.cod)); if (ds <= T) { R.planAte++; if (v && v.visitou) { R.real++; D.real++; } else R.nv.push([ds, c]); } });
    xs.forEach(v => { if (v.conversa) R.conv.push(v); if (!v.visitou) return; D.visit++; if (!pid.has(v.cod)) { D.extra++; R.extra++; } if (v.resultado === 'vendeu') { D.vend++; D.valor += Number(v.valor || 0); } if (v.resultado === 'nao') { R.nao++; const k = v.motivo || 'Sem motivo informado'; R.mot[k] = (R.mot[k] || 0) + 1; } });
    R.visit += D.visit; R.vend += D.vend; R.valor += D.valor; if (D.plan || D.visit) R.dia.push(D);
  }
  return R;
}
async function vProdutividade() {
  top('Produtividade', vendSelect(canPick()));
  const S = st.res;
  if (monthsBetween(S.ini, S.fim).some(m => !st.meses.has(m))) { $('#page').innerHTML = '<div class="boot" style="height:200px"><div class="spinner"></div></div>'; try { await ensureVisitas(S.ini, S.fim); } catch (e) { toast('Não foi possível carregar as visitas', 'bad'); } if (st.view === 'produtividade') render(); return; }
  const eqs = [...new Set(routeVends().map(v => v.equipe).filter(Boolean))].sort();
  const eq = st.area ? '' : S.equipe;
  const R = summary(st.area, S.ini, S.fim, eq);
  const vs = st.area ? [] : routeVends().filter(v => (isAdmin() || v.equipe === st.me.equipe) && (!eq || v.equipe === eq));
  const comp = vs.map(v => ({ v, r: summary(v.area, S.ini, S.fim) })).sort((a, b) => (b.r.planAte ? b.r.real / b.r.planAte : 0) - (a.r.planAte ? a.r.real / a.r.planAte : 0));
  const mt = Object.entries(R.mot).sort((a, b) => b[1] - a[1]), mx = mt.length ? mt[0][1] : 1;
  const dmax = Math.max(1, ...R.dia.map(D => Math.max(D.plan, D.visit)));
  const label = S.ini === S.fim ? brDate(S.ini) : brDate(S.ini) + ' a ' + brDate(S.fim);
  $('#page').innerHTML = `
  <div class="toolbar">
    <div class="seg">${[['hoje', 'Hoje'], ['semana', 'Semana'], ['mes', 'Mês'], ['mesant', 'Mês anterior']].map(([k, l]) => `<button data-p="${k}">${l}</button>`).join('')}</div>
    <input type="date" class="inp" id="sIni" value="${S.ini}" aria-label="De"><span class="muted">até</span><input type="date" class="inp" id="sFim" value="${S.fim}" aria-label="Até">
    ${!st.area && eqs.length > 1 && isAdmin() ? `<select class="inp" id="sEq"><option value="">Todas as equipes</option>${eqs.map(e => `<option${e === eq ? ' selected' : ''}>${esc(e)}</option>`).join('')}</select>` : ''}
    <span class="sp"></span><span class="muted">${esc(st.area ? vendName(st.area) : (eq || 'Todos os vendedores'))} · ${esc(label)}</span>
  </div>
  <div class="kpis">
    <div class="kpi"><span>Aderência ao roteiro</span><b>${pct(R.real, R.planAte)}</b><small>${num(R.real)} de ${num(R.planAte)} visitas planejadas até hoje</small><div class="meter"><i style="width:${R.planAte ? R.real / R.planAte * 100 : 0}%"></i></div></div>
    <div class="kpi"><span>Clientes visitados</span><b>${num(R.visit)}</b><small>${R.extra ? num(R.extra) + ' fora do roteiro' : 'todos dentro do roteiro'}</small></div>
    <div class="kpi"><span>Positivação</span><b>${pct(R.vend, R.visit)}</b><small>${num(R.vend)} visitas com venda</small></div>
    <div class="kpi"><span>Total vendido</span><b>${brl(R.valor)}</b><small>${R.vend ? 'Ticket médio ' + brl(R.valor / R.vend) : '—'}</small></div>
    <div class="kpi"><span>Visitas sem venda</span><b>${num(R.nao)}</b><small>${mt.length ? 'Principal: ' + esc(mt[0][0]) : '—'}</small></div>
  </div>
  ${comp.length > 1 ? `<div class="card" style="margin-bottom:16px"><div class="card-h"><h3>Comparativo por vendedor</h3><span class="sp"></span><button class="btn sm" id="cx">${ico('download')}Exportar</button></div><div class="tbl-wrap"><table class="tbl stack"><thead><tr><th>Vendedor</th><th>Equipe</th><th class="r">Planejadas</th><th class="r">Realizadas</th><th class="r">Aderência</th><th class="r">Extras</th><th class="r">Vendas</th><th class="r">Positivação</th><th class="r">Vendido</th><th class="r">Ticket médio</th></tr></thead><tbody>
    ${comp.map(({ v, r }) => `<tr class="click" data-area="${esc(v.area)}"><td class="nm">${esc(v.nome)}</td><td class="muted">${esc(v.equipe || '')}</td><td class="r">${num(r.planAte)}</td><td class="r">${num(r.real)}</td><td class="r"><b>${pct(r.real, r.planAte)}</b></td><td class="r">${num(r.extra)}</td><td class="r">${num(r.vend)}</td><td class="r">${pct(r.vend, r.visit)}</td><td class="r">${brl(r.valor)}</td><td class="r">${r.vend ? brl(r.valor / r.vend) : '—'}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
  <div class="card" style="margin-bottom:16px"><div class="card-h"><h3>Dia a dia</h3><span class="sp"></span><span class="legend"><span><i class="dot" style="--fc:var(--primary-100)"></i>Planejadas</span><span><i class="dot" style="--fc:var(--primary)"></i>Visitadas</span></span></div><div class="card-b">
    ${R.dia.length ? `<div class="bars">${R.dia.slice(-31).map(D => `<div class="b" title="${esc(brDate(D.ds))}: ${D.plan} planejadas, ${D.visit} visitadas, ${D.vend} vendas"><i style="height:${D.plan / dmax * 100}%"><u style="height:${D.plan ? Math.min(100, D.visit / D.plan * 100) : (D.visit ? 100 : 0)}%"></u></i><small>${parse(D.ds).getDate()}</small></div>`).join('')}</div>` : '<div class="empty">Sem visitas planejadas no período.</div>'}
  </div></div>
  <div class="grid2">
    <div class="card"><div class="card-h"><h3>Por que não vendeu</h3></div><div class="card-b">${mt.length ? mt.map(([k, n]) => `<div class="hbar"><span>${esc(k)}</span><span class="t"><i style="width:${n / mx * 100}%"></i></span><span class="v">${n} · ${pct(n, R.nao)}</span></div>`).join('') : '<div class="empty">Nenhuma visita sem venda no período.</div>'}</div></div>
    <div class="card"><div class="card-h"><h3>Planejados e não visitados</h3><span class="pill ${R.nv.length ? 'bad' : 'ok'}">${num(R.nv.length)}</span></div><div class="tbl-wrap" style="max-height:340px"><table class="tbl"><tbody>${R.nv.slice(0, 300).map(([ds, c]) => `<tr class="click" data-cod="${esc(c.cod)}"><td class="muted" style="white-space:nowrap">${esc(brDate(ds))}</td><td class="nm">${esc(c.nome)}${!st.area ? `<div class="small muted">${esc(vendName(c.area))}</div>` : ''}</td><td>${codePill(c)}</td></tr>`).join('') || '<tr><td><div class="empty">Todos os clientes planejados até hoje foram visitados.</div></td></tr>'}</tbody></table></div></div>
  </div>
  <div class="card" style="margin-top:16px"><div class="card-h"><h3>Conversas registradas</h3><span class="pill">${num(R.conv.length)}</span></div><div class="card-b" style="padding-top:4px">${R.conv.length ? R.conv.sort((a, b) => b.data.localeCompare(a.data)).slice(0, 150).map(v => { const c = st.byCod.get(v.cod) || {}; return `<div class="conv"><div class="h"><b>${esc(c.nome || v.cod)}</b><span>${esc(brDate(v.data))}</span>${!st.area ? `<span>· ${esc(vendName(v.area))}</span>` : ''}${v.resultado === 'vendeu' ? `<span class="pill ok">Vendeu ${esc(brl2(v.valor))}</span>` : v.resultado === 'nao' ? `<span class="pill bad">${esc(v.motivo || 'Não vendeu')}</span>` : ''}</div><div>${esc(v.conversa)}</div></div>`; }).join('') : '<div class="empty">Nenhuma conversa registrada no período.</div>'}</div></div>`;
  const setR = (a, b) => { S.ini = a; S.fim = b; render(); };
  $$('[data-p]').forEach(b => b.onclick = () => { const k = b.dataset.p; if (k === 'hoje') setR(T, T); else if (k === 'semana') setR(ymd(addDays(TODAY, -((TODAY.getDay() + 6) % 7))), T); else if (k === 'mes') setR(ymd(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)), T); else setR(ymd(new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1)), ymd(new Date(TODAY.getFullYear(), TODAY.getMonth(), 0))); });
  $('#sIni').onchange = e => { if (e.target.value) setR(e.target.value, S.fim < e.target.value ? e.target.value : S.fim); };
  $('#sFim').onchange = e => { if (e.target.value) setR(S.ini > e.target.value ? e.target.value : S.ini, e.target.value); };
  const se = $('#sEq'); if (se) se.onchange = e => { S.equipe = e.target.value; render(); };
  $('#page').onclick = e => { const a = e.target.closest('tr[data-area]'); if (a) { setArea(a.dataset.area); return; } const c = e.target.closest('tr[data-cod]'); if (c) openCliente(c.dataset.cod); };
  const cx = $('#cx'); if (cx) cx.onclick = () => exportXlsx(`produtividade_${S.ini}_a_${S.fim}.xlsx`, ['Vendedor', 'Área', 'Equipe', 'Planejadas até hoje', 'Realizadas', 'Aderência %', 'Extras', 'Visitados', 'Vendas', 'Positivação %', 'Vendido', 'Ticket médio'], comp.map(({ v, r }) => [v.nome, v.area, v.equipe || '', r.planAte, r.real, r.planAte ? Math.round(r.real / r.planAte * 100) : 0, r.extra, r.visit, r.vend, r.visit ? Math.round(r.vend / r.visit * 100) : 0, r.valor, r.vend ? Math.round(r.valor / r.vend) : 0]), 'Produtividade');
}

/* =================== CLIENTES (cadastro e importação) =================== */
function vClientes() {
  top('Clientes', vendSelect(true) + (isAdmin() ? `<button class="btn pri" id="imp">${ico('upload')}Importar carteira</button>` : ''));
  const F = st.cli, q = norm(F.q);
  const rows = clientsOf(st.area).filter(c => (!F.status || norm(c.status) === norm(F.status)) && (!F.aloc || (F.aloc === 's' ? c.dia : !c.dia)) && (!q || norm([c.nome, c.cod, c.cidade, c.telefone].join(' ')).includes(q))).sort((a, b) => String(a.nome).localeCompare(b.nome, 'pt-BR'));
  const PG = 100, pages = Math.max(1, Math.ceil(rows.length / PG)); if (F.page >= pages) F.page = 0;
  const sts = ['Ativo', 'Pré-Inativo', 'Inativo'].map(s => [s, clientsOf(st.area).filter(c => norm(c.status) === norm(s)).length]);
  $('#page').innerHTML = `
  <div class="kpis">${sts.map(([s, n]) => `<div class="kpi"><span>${s}</span><b>${num(n)}</b></div>`).join('')}<div class="kpi"><span>Sem dia de visita</span><b>${num(clientsOf(st.area).filter(c => !c.dia).length)}</b></div></div>
  <div class="card"><div class="card-h" style="flex-wrap:wrap"><h3>Carteira</h3><span class="pill">${num(rows.length)}</span><span class="sp"></span>
    <div class="search" style="width:260px">${ico('search')}<input class="inp" id="cq" placeholder="Nome, código, cidade, telefone" value="${esc(F.q)}"></div>
    <select class="inp" id="cs"><option value="">Todos os status</option>${['Ativo', 'Pré-Inativo', 'Inativo'].map(s => `<option${s === F.status ? ' selected' : ''}>${s}</option>`).join('')}</select>
    <select class="inp" id="ca"><option value="">Alocados e não alocados</option><option value="s"${F.aloc === 's' ? ' selected' : ''}>Só alocados</option><option value="n"${F.aloc === 'n' ? ' selected' : ''}>Só não alocados</option></select></div>
    ${bulkBar(rows)}
    <div class="tbl-wrap"><table class="tbl stack"><thead><tr>${ckHead(rows.slice(F.page * PG, F.page * PG + PG).map(c => c.cod))}<th>Código</th><th>Cliente</th><th>Cidade</th><th>Telefone</th><th>Segmento</th><th>Status</th><th class="r">Dias sem compra</th>${st.area ? '' : '<th>Vendedor</th>'}<th>Visita</th></tr></thead><tbody id="ctb">
    ${rows.slice(F.page * PG, F.page * PG + PG).map(c => `<tr class="click${st.bsel.has(c.cod) ? ' picked' : ''}" data-cod="${esc(c.cod)}">${ckCell(c.cod)}<td class="muted">${esc(c.cod)}</td><td class="nm">${esc(c.nome)}</td><td>${esc(c.cidade || '')}</td><td style="white-space:nowrap">${esc(c.telefone || '')}</td><td>${esc(c.segmento || '')}</td><td>${statusPill(c.status)}</td><td class="r">${c.dias_sem_compra ?? '—'}</td>${st.area ? '' : `<td>${esc(vendName(c.area))}</td>`}<td>${codePill(c)}</td></tr>`).join('') || `<tr><td colspan="10"><div class="empty"><b>Nenhum cliente</b>${st.clientes.length ? 'Ajuste os filtros.' : 'Importe a Carteira de Clientes para começar.'}</div></td></tr>`}</tbody></table></div>
    ${pages > 1 ? `<div class="pager"><span>Página ${F.page + 1} de ${pages}</span><span class="sp" style="flex:1"></span><button class="btn sm" id="cpP" ${F.page ? '' : 'disabled'}>Anterior</button><button class="btn sm" id="cpN" ${F.page < pages - 1 ? '' : 'disabled'}>Próxima</button></div>` : ''}</div>`;
  let t; $('#cq').oninput = e => { F.q = e.target.value; F.page = 0; clearTimeout(t); t = setTimeout(() => { render(); const i = $('#cq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); };
  $('#cs').onchange = e => { F.status = e.target.value; F.page = 0; render(); };
  $('#ca').onchange = e => { F.aloc = e.target.value; F.page = 0; render(); };
  const p = $('#cpP'), n = $('#cpN'); if (p) p.onclick = () => { F.page--; render(); }; if (n) n.onclick = () => { F.page++; render(); };
  $('#ctb').onclick = e => { if (e.target.closest('.ck-cell')) return; const r = e.target.closest('tr[data-cod]'); if (r) openCliente(r.dataset.cod); };
  bindBulk(rows, rows.slice(F.page * PG, F.page * PG + PG).map(c => c.cod));
  const im = $('#imp'); if (im) im.onclick = openImport;
}
const FIELDS = [
  ['cod', 'Código do cliente', /^(cod|codigo|conta|cliente id|id cliente|cod\.? ?cliente)/, true],
  ['nome', 'Nome / razão social', /(^nome|razao|^cliente$|fantasia|nome cliente)/, true],
  ['area', 'Área do vendedor', /(^area|cod.*vend|vendedor.*cod|^rca|setor)/, true],
  ['vendedor', 'Nome do vendedor', /(^vendedor$|nome.*vend|representante)/],
  ['equipe', 'Equipe', /^equipe/], ['supervisor', 'Supervisor', /supervis/], ['tipo', 'Tipo', /^tipo/],
  ['cidade', 'Cidade', /(cidade|municip)/], ['endereco', 'Endereço', /(ender|logradouro|^rua)/], ['telefone', 'Telefone', /(fone|telefone|celular|whats)/],
  ['segmento', 'Segmento', /(segment|sbs)/], ['status', 'Status', /(^status|situac)/], ['ult_compra', 'Última compra', /(ult.*compra|ultima.*compra|dt.*compra)/], ['dias_sem_compra', 'Dias sem compra', /(dias.*compra|dias sem)/],
  ['visita', 'Código de visita (ex.: Q1 Ter)', /(^visita|rota|agenda|codigo visita)/]
];
function xdate(v) { if (v == null || v === '') return null; if (v instanceof Date) return ymd(v); if (typeof v === 'number') { const d = new Date(Math.round((v - 25569) * 864e5)); return ymd(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); } const s = String(v).trim(); let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}`; m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/); if (m) return `${m[3].length === 2 ? '20' + m[3] : m[3]}-${pad(m[2])}-${pad(m[1])}`; return null; }
function openImport() {
  let wb = null, rows = [], head = [];
  modal({
    wide: true, title: 'Importar Carteira de Clientes', sub: 'Aceita .xlsx, .xlsb, .xls ou .csv. Clientes existentes têm os dados atualizados e mantêm o roteiro; clientes novos entram como não alocados.',
    body: `<label class="card" style="padding:22px;text-align:center;cursor:pointer;border-style:dashed;display:block">${ico('upload')}<div style="font-weight:600;margin-top:6px">Escolher arquivo</div><div class="small muted" id="iName">Carteira de Clientes do mês, extração do D365 ou a planilha de importação</div><input type="file" id="iFile" accept=".xlsx,.xlsb,.xls,.xlsm,.csv" hidden></label>
      <div id="iStep"></div>`,
    foot: `<span class="small muted" id="iMsg"></span><span class="sp"></span><button class="btn" data-close>Cancelar</button><button class="btn pri" id="iGo" disabled>Importar</button>`,
    onMount(ov, close) {
      const step = $('#iStep', ov);
      const loadSheet = name => {
        const ws = wb.Sheets[name]; const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
        let hi = 0, best = -1; for (let i = 0; i < Math.min(15, aoa.length); i++) { const sc = aoa[i].filter(x => FIELDS.some(f => f[2].test(norm(x)))).length; if (sc > best) { best = sc; hi = i; } }
        head = aoa[hi].map(x => String(x).trim()); rows = aoa.slice(hi + 1).filter(r => r.some(x => x !== ''));
        const guess = {}; FIELDS.forEach(([k, , re]) => { const i = head.findIndex((h, j) => re.test(norm(h)) && !Object.values(guess).includes(j)); if (i >= 0) guess[k] = i; });
        step.innerHTML = `<div class="form">
          ${wb.SheetNames.length > 1 ? `<label class="fld w"><span>Aba da planilha</span><select class="inp" id="iSheet">${wb.SheetNames.map(s => `<option${s === name ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select></label>` : ''}
          ${FIELDS.map(([k, l, , req]) => `<label class="fld"><span>${esc(l)}${req ? ' *' : ''}</span><select class="inp" data-map="${k}"><option value="">— não importar —</option>${head.map((h, i) => `<option value="${i}"${guess[k] === i ? ' selected' : ''}>${esc(h || 'Coluna ' + (i + 1))}</option>`).join('')}</select></label>`).join('')}
        </div><p class="small muted" style="margin:0">${num(rows.length)} linhas encontradas. Confira as colunas acima.</p>`;
        const sh = $('#iSheet', ov); if (sh) sh.onchange = e => loadSheet(e.target.value);
        $('#iGo', ov).disabled = !rows.length;
      };
      $('#iFile', ov).onchange = async e => {
        const f = e.target.files[0]; if (!f) return; $('#iName', ov).textContent = f.name;
        try { wb = XLSX.read(await f.arrayBuffer(), { type: 'array', cellDates: true }); const pref = wb.SheetNames.find(s => /carteira|cliente|import/i.test(s)) || wb.SheetNames[0]; loadSheet(pref); }
        catch (err) { step.innerHTML = '<div class="err">Não foi possível ler este arquivo.</div>'; }
      };
      $('#iGo', ov).onclick = async () => {
        const map = {}; $$('[data-map]', ov).forEach(s => { if (s.value !== '') map[s.dataset.map] = Number(s.value); });
        const miss = FIELDS.filter(f => f[3] && map[f[0]] == null).map(f => f[1]); if (miss.length) { $('#iMsg', ov).textContent = 'Falta indicar: ' + miss.join(', '); return; }
        const g = (r, k) => map[k] == null ? undefined : r[map[k]];
        const vends = new Map(), cl = [], rotas = [];
        rows.forEach(r => {
          const cod = String(g(r, 'cod') ?? '').trim().replace(/\.0$/, ''), nome = String(g(r, 'nome') ?? '').trim(), area = String(g(r, 'area') ?? '').trim().replace(/\.0$/, '');
          if (!cod || !nome || !area) return;
          const o = { cod, nome, area };
          ['cidade', 'endereco', 'telefone', 'segmento', 'status', 'equipe', 'tipo'].forEach(k => { const v = g(r, k); if (v !== undefined && v !== '') o[k] = String(v).trim(); });
          const uc = xdate(g(r, 'ult_compra')); if (uc) o.ult_compra = uc;
          const dsc = g(r, 'dias_sem_compra'); if (dsc !== undefined && dsc !== '' && !isNaN(Number(dsc))) o.dias_sem_compra = Math.round(Number(dsc));
          cl.push(o);
          const pc = parseCode(g(r, 'visita')); if (pc) rotas.push({ cod, ...pc, ordem: null });
          if (!vends.has(area)) { const ex = vendByArea(area); vends.set(area, { area, nome: String(g(r, 'vendedor') || (ex && ex.nome) || area).trim(), equipe: o.equipe || (ex && ex.equipe) || null, supervisor: String(g(r, 'supervisor') || (ex && ex.supervisor) || '').trim() || null, tipo: o.tipo || (ex && ex.tipo) || null }); }
        });
        if (!cl.length) { $('#iMsg', ov).textContent = 'Nenhuma linha válida (código, nome e área são obrigatórios).'; return; }
        const btn = $('#iGo', ov); btn.disabled = true;
        const novos = cl.filter(c => !st.byCod.has(c.cod)).length;
        try {
          $('#iMsg', ov).textContent = 'Atualizando vendedores…';
          await api.upsertVendedores([...vends.values()].map(v => { const ex = vendByArea(v.area); return ex ? { ...v, nome: v.nome === v.area ? ex.nome : v.nome } : { ...v, papel: 'vendedor', ativo: true }; }));
          await api.upsertClientes(cl, n => { $('#iMsg', ov).textContent = `Importando ${num(n)} de ${num(cl.length)}…`; });
          if (rotas.length) await api.saveRotas(rotas);
          await loadAll(); close(); render();
          toast(`${num(cl.length)} clientes importados · ${num(novos)} novos`);
        } catch (err) { btn.disabled = false; $('#iMsg', ov).textContent = errMsg(err); }
      };
    }
  });
}

/* =================== USUÁRIOS =================== */
function vUsuarios() {
  top('Usuários', `<button class="btn pri" id="uNew">${ico('plus')}Novo usuário</button>`);
  const list = st.vendedores.slice().sort((a, b) => ({ admin: 0, supervisor: 1, vendedor: 2 }[a.papel] - { admin: 0, supervisor: 1, vendedor: 2 }[b.papel]) || String(a.equipe || '').localeCompare(b.equipe || '') || String(a.area).localeCompare(b.area));
  const semEmail = list.filter(v => !v.email && v.ativo !== false).length;
  $('#page').innerHTML = `
  ${semEmail ? `<div class="card" style="padding:14px 16px;margin-bottom:16px;display:flex;gap:10px;align-items:center;background:var(--warn-50);border-color:transparent"><b style="color:var(--warn)">${semEmail} usuários sem e-mail.</b><span class="muted">Preencha o e-mail corporativo de cada vendedor e crie o login dele no Supabase (Authentication › Add user) com o mesmo e-mail.</span></div>` : ''}
  <div class="card"><div class="tbl-wrap"><table class="tbl stack"><thead><tr><th>Nome</th><th>Área</th><th>Equipe</th><th>E-mail de login</th><th>Perfil</th><th class="r">Clientes</th><th></th></tr></thead><tbody id="utb">
  ${list.map(v => `<tr data-area="${esc(v.area)}"><td class="nm">${esc(v.nome)}${v.ativo === false ? ' <span class="pill">inativo</span>' : ''}</td><td class="muted">${esc(v.area)}</td><td>${esc(v.equipe || '—')}</td><td>${v.email ? esc(v.email) : '<span class="pill warn">sem e-mail</span>'}</td><td>${{ admin: '<span class="pill blue">Administrador</span>', supervisor: '<span class="pill">Supervisor</span>', vendedor: 'Vendedor' }[v.papel] || ''}</td><td class="r">${num(st.clientes.filter(c => c.area === v.area).length)}</td><td class="r"><button class="btn sm" data-ed="${esc(v.area)}">Editar</button></td></tr>`).join('')}</tbody></table></div></div>`;
  $('#uNew').onclick = () => openUser(null);
  $('#utb').onclick = e => { const b = e.target.closest('[data-ed]'); if (b) openUser(b.dataset.ed); };
}
function openUser(area) {
  const v = area ? vendByArea(area) : { area: '', nome: '', equipe: '', email: '', papel: 'supervisor', ativo: true };
  const eqs = [...new Set(st.vendedores.map(x => x.equipe).filter(Boolean))].sort();
  modal({
    title: area ? 'Editar usuário' : 'Novo usuário', sub: 'O login usa o e-mail informado aqui. Crie a senha dele no Supabase em Authentication › Add user.',
    body: `<div class="form">
      <label class="fld"><span>Nome</span><input class="inp" id="uN" value="${esc(v.nome)}"></label>
      <label class="fld"><span>Área / identificador</span><input class="inp" id="uA" value="${esc(v.area)}" ${area ? 'disabled' : ''} placeholder="ex.: 1510101 ou SUP-EQ01"></label>
      <label class="fld w"><span>E-mail corporativo</span><input class="inp" id="uE" type="email" value="${esc(v.email || '')}" placeholder="nome@bateriasmoura.com"></label>
      <label class="fld"><span>Perfil</span><select class="inp" id="uP">${[['vendedor', 'Vendedor: vê só os próprios clientes'], ['supervisor', 'Supervisor: vê a equipe'], ['admin', 'Administrador: vê tudo']].map(([k, l]) => `<option value="${k}"${k === v.papel ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="fld"><span>Equipe</span><input class="inp" id="uQ" list="eqs" value="${esc(v.equipe || '')}"><datalist id="eqs">${eqs.map(e => `<option value="${esc(e)}">`).join('')}</datalist></label>
      <label style="display:flex;gap:8px;align-items:center" class="w"><input type="checkbox" id="uAt" ${v.ativo !== false ? 'checked' : ''}> Usuário ativo</label></div>`,
    foot: `${area && !st.clientes.some(c => c.area === area) && area !== st.me.area ? `<button class="btn danger" id="uDel">Excluir</button>` : ''}<span class="sp"></span><button class="btn" data-close>Cancelar</button><button class="btn pri" id="uSave">Salvar</button>`,
    onMount(ov, close) {
      $('#uSave', ov).onclick = async () => {
        const n = { area: area || $('#uA', ov).value.trim(), nome: $('#uN', ov).value.trim(), email: $('#uE', ov).value.trim().toLowerCase() || null, papel: $('#uP', ov).value, equipe: $('#uQ', ov).value.trim() || null, ativo: $('#uAt', ov).checked };
        if (!n.area || !n.nome) { toast('Preencha nome e área', 'bad'); return; }
        if (n.email && st.vendedores.some(x => x.email && x.email.toLowerCase() === n.email && x.area !== n.area)) { toast('Esse e-mail já está em outro usuário', 'bad'); return; }
        try { await api.saveVendedor({ ...(area ? v : {}), ...n }); const i = st.vendedores.findIndex(x => x.area === n.area); if (i >= 0) st.vendedores[i] = { ...st.vendedores[i], ...n }; else st.vendedores.push(n); close(); render(); toast('Usuário salvo'); } catch (e) { toast(errMsg(e), 'bad'); }
      };
      const d = $('#uDel', ov); if (d) d.onclick = async () => { if (d.dataset.ok !== '1') { d.dataset.ok = '1'; d.textContent = 'Confirmar exclusão'; return; } try { await api.delVendedor(area); st.vendedores = st.vendedores.filter(x => x.area !== area); close(); render(); toast('Usuário excluído'); } catch (e) { toast(errMsg(e), 'bad'); } };
    }
  });
}

/* =================== CONFIGURAÇÕES =================== */
function vConfig() {
  top('Configurações');
  const c = st.cfg;
  $('#page').innerHTML = `<div class="grid2">
    <div class="card"><div class="card-h"><h3>Regras do calendário</h3></div><div class="card-b" style="display:flex;flex-direction:column;gap:14px">
      <label class="fld"><span>Semana par e ímpar conta pela</span><select class="inp" id="cP"><option value="iso"${c.paridade === 'iso' ? ' selected' : ''}>Semana do ano (padrão ISO)</option><option value="mes"${c.paridade === 'mes' ? ' selected' : ''}>Semana do mês</option></select></label>
      <label class="fld"><span>Máximo de visitas por dia</span><input class="inp" id="cC" type="number" min="1" max="60" value="${esc(c.cap)}" style="width:140px"></label>
      <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="cV" ${c.vendedor_edita_roteiro ? 'checked' : ''}> Vendedores podem alterar o próprio roteiro</label>
      <p class="small muted" style="margin:0">Hoje (${esc(brDate(T))}) é semana ${isoWeek(TODAY)} do ano e ${nth(TODAY)}ª do mês: quinzena ${parity(TODAY) === 1 ? 'ímpar (Q1)' : 'par (Q2)'}.</p></div></div>
    <div class="card"><div class="card-h"><h3>Motivos de não venda</h3></div><div class="card-b"><textarea class="inp" id="cM" rows="9">${esc((c.motivos || []).join('\n'))}</textarea><p class="small muted">Um motivo por linha. Aparecem para o vendedor ao marcar "Não vendi".</p></div></div>
  </div><div style="margin-top:16px;display:flex;gap:8px"><button class="btn pri" id="cS">Salvar configurações</button>${LIVE ? '' : '<button class="btn" id="cR">Recomeçar demonstração</button>'}</div>`;
  $('#cS').onclick = async () => {
    const n = { paridade: $('#cP').value, cap: Math.max(1, Number($('#cC').value) || 12), vendedor_edita_roteiro: $('#cV').checked, motivos: $('#cM').value.split('\n').map(s => s.trim()).filter(Boolean) };
    try { await api.saveConfig(n); st.cfg = { ...st.cfg, ...n }; render(); toast('Configurações salvas'); } catch (e) { toast(errMsg(e), 'bad'); }
  };
  const r = $('#cR'); if (r) r.onclick = () => { if (r.dataset.ok !== '1') { r.dataset.ok = '1'; r.textContent = 'Confirmar: apagar alterações da demonstração'; return; } try { localStorage.removeItem('rv.demo.v2'); } catch (e) { } location.reload(); };
}

/* =================== LOGIN =================== */
function vLogin(msg) {
  $('#app').innerHTML = `<div class="login"><div class="l"><form id="lf" novalidate>
    <div class="logo" style="padding:0"><div class="mk">${ico('route')}</div><div><b>Roteiro de Visitas</b><small>Baterias Moura · Campinas</small></div></div>
    <h2>Entrar</h2><p>Use seu e-mail corporativo e a senha recebida.</p>
    ${msg ? `<div class="err">${esc(msg)}</div>` : ''}
    <label class="fld"><span>E-mail</span><input class="inp" id="le" type="email" autocomplete="username" required placeholder="nome@bateriasmoura.com"></label>
    <label class="fld"><span>Senha</span><input class="inp" id="lp" type="password" autocomplete="current-password" required></label>
    <button class="btn pri" style="height:40px" id="lb">Entrar</button>
    <p class="small">Esqueceu a senha? Fale com o administrador do sistema.</p></form></div>
    <div class="r"><svg class="art" viewBox="0 0 420 300" fill="none" aria-hidden="true"><g stroke="#ffffff" stroke-opacity=".25">${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${10 + i * 68}" y="20" width="60" height="60" rx="8"/><rect x="${10 + i * 68}" y="90" width="60" height="60" rx="8"/><rect x="${10 + i * 68}" y="160" width="60" height="60" rx="8"/>`).join('')}</g><path d="M40 250 C 110 250, 110 190, 180 190 S 250 120, 320 120 S 380 60, 380 50" stroke="#fff" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>${[[40, 250], [180, 190], [320, 120], [380, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#fff"/><circle cx="${x}" cy="${y}" r="4" fill="#1d4ed8"/>`).join('')}<rect x="146" y="98" width="60" height="16" rx="4" fill="#fff" fill-opacity=".9"/><rect x="214" y="168" width="60" height="16" rx="4" fill="#fff" fill-opacity=".9"/><rect x="10" y="28" width="60" height="16" rx="4" fill="#fff" fill-opacity=".6"/></svg>
      <h3>O roteiro de cada vendedor, montado no calendário.</h3><p>Planeje visitas semanais, quinzenais e mensais, registre o resultado de cada visita e acompanhe a produtividade da equipe.</p></div></div>`;
  $('#lf').onsubmit = async e => {
    e.preventDefault(); const b = $('#lb'); b.disabled = true; b.textContent = 'Entrando…';
    try { await api.signIn($('#le').value.trim(), $('#lp').value); await start(); }
    catch (err) { vLogin(/invalid/i.test(err.message || '') ? 'E-mail ou senha incorretos.' : 'Não foi possível entrar: ' + (err.message || 'erro')); }
  };
}
function vSemAcesso(email) {
  $('#app').innerHTML = `<div class="boot"><div class="card" style="padding:28px;max-width:440px;text-align:center"><h3 style="margin:0 0 6px">Acesso ainda não liberado</h3><p class="muted">O e-mail <b>${esc(email)}</b> entrou, mas ainda não está cadastrado como usuário do roteiro. Peça ao administrador para incluir seu e-mail na tela Usuários.</p><button class="btn" id="so">Sair</button></div></div>`;
  $('#so').onclick = async () => { await api.signOut(); location.reload(); };
}

/* =================== início =================== */
async function start() {
  if (!LIVE) await api.load();
  const me = await api.me();
  if (!me) { vLogin(); return; }
  if (me.semAcesso) { vSemAcesso(me.email); return; }
  st.me = me;
  $('#app').innerHTML = '<div class="boot"><div class="spinner"></div></div>';
  try { await loadAll(); await ensureVisitas(ymd(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)), T); }
  catch (e) { $('#app').innerHTML = `<div class="boot"><div class="card" style="padding:24px;max-width:420px"><h3 style="margin-top:0">Não foi possível carregar os dados</h3><p class="muted">${esc(e.message || e)}</p><button class="btn pri" onclick="location.reload()">Tentar de novo</button></div></div>`; return; }
  const h = location.hash.slice(1); st.view = VIEWS.some(v => v.id === h) ? h : (st.me.papel === 'vendedor' ? 'roteiro' : 'calendario');
  go(st.view);
}
start();
})();

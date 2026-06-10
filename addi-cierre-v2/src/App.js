import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const TODAY_IDX = Math.min(4, Math.max(0, (new Date().getDay() || 1) - 1));

const AC = {
  OPS: { bg: '#EEF2FF', bd: '#6366F1', tx: '#3730A3' },
  CONTABILIDAD: { bg: '#ECFDF5', bd: '#10B981', tx: '#065F46' },
  DATA: { bg: '#EFF6FF', bd: '#3B82F6', tx: '#1E40AF' },
  RIESGOS: { bg: '#FFFBEB', bd: '#F59E0B', tx: '#92400E' },
  TESORERIA: { bg: '#FFF1F2', bd: '#F43F5E', tx: '#9F1239' },
  SIREG: { bg: '#F8FAFC', bd: '#94A3B8', tx: '#475569' },
};

const SC = {
  done: { l: 'Completado', d: '#10B981', bg: '#ECFDF5', tx: '#065F46', cb: '#F0FDF4', bb: '#BBF7D0' },
  active: { l: 'En curso', d: '#3B82F6', bg: '#EFF6FF', tx: '#1E40AF', cb: '#EFF6FF', bb: '#93C5FD' },
  late: { l: 'Retrasado', d: '#EF4444', bg: '#FEE2E2', tx: '#991B1B', cb: '#FEF2F2', bb: '#FECACA' },
  pending: { l: 'Pendiente', d: '#CBD5E1', bg: '#F1F5F9', tx: '#64748B', cb: '#EEF2F7', bb: '#CBD5E1' },
};

const PHASES = [
  {
    lbl: 'T+0 — Tarde (16:00–18:00)', nodes: [
      { h: '16:00', a: 'OPS', n: 'Actualización saldos JP Morgan', r: 'Juan Esteban / Karen Caicedo', e: 'Sheets cash visibility', s: 'done', asana: 1 },
      { h: '16:15', a: 'OPS', n: 'Descarga movimientos JP Morgan', r: 'Juan Esteban / Karen Caicedo', e: 'Archivo mov bancarios CF', s: 'done', asana: 1 },
      { h: '16:30', a: 'OPS', n: 'Contabilización Netsuite', r: 'Raúl Morales / Karen Caicedo', e: 'Plano en Drive', s: 'done', asana: 1 },
      { h: '17:00', a: 'OPS', n: 'Cierre bancario JP Morgan', r: 'Jhon Carvajal / Maria Valentina', e: 'Asana + Slack confirmación', s: 'active', asana: 1 },
      { h: '17:30', a: 'CONTABILIDAD', n: 'Reexpresión USD JP Morgan', r: 'Jorge Salamanca / Vannessa', e: 'Asana aprobación + Slack', s: 'pending', asana: 1 },
    ]
  },
  {
    lbl: 'T+1 — Madrugada (03:00–07:00)', nodes: [
      { h: '03:00', a: 'DATA', n: 'Cierre de depósitos', r: 'Elmer Ortega / Julio Alfonso', e: 'Proceso automático', s: 'pending', asana: 0 },
      { h: '05:45', a: 'DATA', n: 'Tabla balance y regulatoria', r: 'Leonardo Ferreyra / Julio Alfonso', e: 'Tabla DB + tabla AWS', s: 'pending', asana: 1 },
      { h: '06:30', a: 'DATA', n: 'Recepción AWS', r: 'Julio Alfonso', e: 'Alerta recepción insumos', s: 'pending', asana: 0 },
      { h: '06:45', a: 'SIREG', n: 'Cron SIREG PROD', r: 'Yesica Nova / Stefanny Rincón', e: 'Reportes SIREG generados', s: 'pending', asana: 0 },
    ]
  },
  {
    lbl: 'T+1 — Mañana (07:00–12:00)', nodes: [
      { h: '07:00', a: 'OPS', n: 'Saldos todos los bancos', r: 'Juan Esteban / Karen Caicedo', e: 'Sheets cash visibility', s: 'pending', asana: 1 },
      { h: '07:30', a: 'OPS', n: 'Contabilización otros bancos', r: 'Juan Esteban / Karen Caicedo', e: 'Archivo plano Drive', s: 'pending', asana: 1 },
      { h: '07:45', a: 'OPS', n: 'Conciliaciones bancarias', r: 'Raúl Morales / Juan Esteban', e: 'Asana + Slack', s: 'pending', asana: 1 },
      { h: '10:00', a: 'CONTABILIDAD', n: 'Registros contables inversiones', r: 'Jorge Salamanca / Hector Ovalle', e: 'Asana + Slack', s: 'pending', asana: 1 },
      { h: '10:00', a: 'TESORERIA', n: 'Cierre conciliaciones admin.', r: 'Michael Cobos / Maribel Gonzalez', e: 'Asana + Slack', s: 'pending', asana: 1 },
    ]
  },
  {
    lbl: 'T+1 — Tarde (12:30–17:00)', nodes: [
      { h: '12:30', a: 'DATA', n: '2do cierre Netsuite DB', r: 'Leonardo Ferreyra / Julio Alfonso', e: 'Proceso automático', s: 'pending', asana: 0 },
      { h: '14:00', a: 'SIREG', n: 'Generación formatos 281/458', r: 'Reporting', e: 'Formatos SIREG generados', s: 'pending', asana: 1 },
      { h: '15:00', a: 'CONTABILIDAD', n: 'Confirmación formato 281', r: 'Contabilidad', e: 'Formato confirmado', s: 'pending', asana: 1 },
      { h: '16:00', a: 'RIESGOS', n: 'Confirmación formato 458', r: 'Riesgos', e: 'Formato confirmado', s: 'pending', asana: 1 },
      { h: '17:00', a: 'RIESGOS', n: 'Transmisión SFC ✓', r: 'Riesgos', e: 'Transmitido a SFC', s: 'pending', asana: 0 },
    ]
  },
];
const ALL_ETE = PHASES.flatMap(p => p.nodes);

const STEPS = [
  { id: 1, t: 'T+0', h: '16:00', n: 'Actualización saldos JP Morgan USD', a: 'OPS', r: 'Juan Esteban / Karen Caicedo', e: 'Sheets cash visibility', s: 'done', m: 16 * 60, bl: [2], asana: 1 },
  { id: 2, t: 'T+0', h: '16:15', n: 'Descarga movimientos JP Morgan USD', a: 'OPS', r: 'Juan Esteban / Karen Caicedo', e: 'Archivo mov bancarios CF', s: 'done', m: 16 * 60 + 15, bl: [3], asana: 1 },
  { id: 3, t: 'T+0', h: '16:30', n: 'Contabilización movimientos Netsuite', a: 'OPS', r: 'Raúl Morales / Karen Caicedo', e: 'Plano en Drive', s: 'done', m: 16 * 60 + 30, bl: [4], asana: 1 },
  { id: 4, t: 'T+0', h: '17:00', n: 'Cierre bancario JP Morgan', a: 'OPS', r: 'Jhon Carvajal / Maria Valentina', e: 'Asana + Slack confirmación', s: 'active', m: 17 * 60, bl: [5], asana: 1 },
  { id: 5, t: 'T+0', h: '17:30', n: 'Reexpresión cuenta USD JP Morgan', a: 'CONTABILIDAD', r: 'Jorge Salamanca / Vannessa Palma', e: 'Asana aprobación + Slack', s: 'pending', m: 17 * 60 + 30, bl: [6], asana: 1 },
  { id: 6, t: 'T+1', h: '03:00', n: 'Cierre de depósitos', a: 'DATA', r: 'Elmer Ortega / Julio Alfonso', e: 'Proceso automático', s: 'pending', m: 3 * 60, bl: [7], asana: 0 },
  { id: 7, t: 'T+1', h: '05:45', n: 'Generación tabla balance y regulatoria', a: 'DATA', r: 'Leonardo Ferreyra / Julio Alfonso', e: 'Tabla DB + tabla AWS', s: 'pending', m: 5 * 60 + 45, bl: [8], asana: 1 },
  { id: 8, t: 'T+1', h: '06:30', n: 'Recepción información en AWS', a: 'DATA', r: 'Julio Alfonso', e: 'Alerta recepción insumos', s: 'pending', m: 6 * 60 + 30, bl: [9], asana: 0 },
  { id: 9, t: 'T+1', h: '06:45', n: 'Cron consumo SIREG PROD', a: 'SIREG', r: 'Yesica Nova / Stefanny Rincón', e: 'Reportes SIREG generados', s: 'pending', m: 6 * 60 + 45, bl: [10], asana: 0 },
  { id: 10, t: 'T+1', h: '07:00', n: 'Actualización saldos todos los bancos', a: 'OPS', r: 'Juan Esteban / Karen Caicedo', e: 'Sheets cash visibility', s: 'pending', m: 7 * 60, bl: [11], asana: 1 },
  { id: 11, t: 'T+1', h: '07:30', n: 'Contabilización otros bancos', a: 'OPS', r: 'Juan Esteban / Karen Caicedo', e: 'Archivo plano Drive', s: 'pending', m: 7 * 60 + 30, bl: [12], asana: 1 },
  { id: 12, t: 'T+1', h: '07:45', n: 'Conciliaciones bancos operativos', a: 'OPS', r: 'Raúl Morales / Juan Esteban', e: 'Asana + Slack', s: 'pending', m: 7 * 60 + 45, bl: [13], asana: 1 },
  { id: 13, t: 'T+1', h: '10:00', n: 'Registros contables de inversiones', a: 'CONTABILIDAD', r: 'Jorge Salamanca / Hector Ovalle', e: 'Asana + Slack', s: 'pending', m: 10 * 60, bl: [15], asana: 1 },
  { id: 14, t: 'T+1', h: '10:00', n: 'Cierre conciliaciones bancarias admin.', a: 'TESORERIA', r: 'Michael Cobos / Maribel Gonzalez', e: 'Asana + Slack', s: 'pending', m: 10 * 60, bl: [15], asana: 1 },
  { id: 15, t: 'T+1', h: '12:30', n: 'Segundo cierre Netsuite DB', a: 'DATA', r: 'Leonardo Ferreyra / Julio Alfonso', e: 'Proceso automático', s: 'pending', m: 12 * 60 + 30, bl: [16], asana: 0 },
  { id: 16, t: 'T+1', h: '14:00', n: 'Generación formatos 281 y 458', a: 'SIREG', r: 'Reporting', e: 'Formatos SIREG generados', s: 'pending', m: 14 * 60, bl: [17, 18], asana: 1 },
  { id: 17, t: 'T+1', h: '15:00', n: 'Confirmación formato 281', a: 'CONTABILIDAD', r: 'Contabilidad', e: 'Formato confirmado', s: 'pending', m: 15 * 60, bl: [19], asana: 1 },
  { id: 18, t: 'T+1', h: '16:00', n: 'Confirmación formato 458', a: 'RIESGOS', r: 'Riesgos', e: 'Formato confirmado', s: 'pending', m: 16 * 60, bl: [19], asana: 1 },
  { id: 19, t: 'T+1', h: '17:00', n: 'Transmisión formato 458 a SFC', a: 'RIESGOS', r: 'Riesgos', e: 'Transmitido a SFC', s: 'pending', m: 17 * 60, bl: [], asana: 0 },
];

const WEEK_DATA = {
  0: { sla: 87, slaP: 92, ret: 3, retP: 2, avg: 42, avgP: 38, dias: 3, diasP: 2, days: [{ c: 0, rs: [] }, { c: 2, rs: [{ a: 'Reexpresión USD JP Morgan', r: 'Jorge Salamanca', m: 35 }, { a: 'Confirmación formato 458', r: 'Riesgos', m: 48 }] }, { c: 0, rs: [] }, { c: 1, rs: [{ a: 'Cierre bancario JP Morgan', r: 'Jhon Carvajal', m: 42 }] }, { c: 0, rs: [] }] },
  '-1': { sla: 74, slaP: 82, ret: 5, retP: 3, avg: 61, avgP: 44, dias: 1, diasP: 3, days: [{ c: 1, rs: [{ a: 'Generación tabla balance', r: 'Leonardo Ferreyra', m: 55 }] }, { c: 2, rs: [{ a: 'Reexpresión USD JP Morgan', r: 'Jorge Salamanca', m: 40 }, { a: 'Conciliaciones bancos', r: 'Raúl Morales', m: 38 }] }, { c: 1, rs: [{ a: 'Cierre depósitos', r: 'Elmer Ortega', m: 90 }] }, { c: 0, rs: [] }, { c: 1, rs: [{ a: 'Confirmación formato 281', r: 'Contabilidad', m: 82 }] }] },
  '-2': { sla: 95, slaP: 88, ret: 1, retP: 4, avg: 18, avgP: 52, dias: 5, diasP: 2, days: [{ c: 0, rs: [] }, { c: 0, rs: [] }, { c: 0, rs: [] }, { c: 1, rs: [{ a: 'Cierre bancario JP Morgan', r: 'Jhon Carvajal', m: 18 }] }, { c: 0, rs: [] }] },
};

const HIST = [
  { fe: '05 jun', a: 'Cierre bancario JP Morgan', ar: 'OPS', r: 'Jhon Carvajal', st: 'Retrasado', m: 42 },
  { fe: '04 jun', a: 'Confirmación formato 458', ar: 'RIESGOS', r: 'Riesgos', st: 'Retrasado', m: 48 },
  { fe: '03 jun', a: 'Actualización saldos JP Morgan', ar: 'OPS', r: 'Juan Esteban', st: 'Completado', m: 0 },
  { fe: '03 jun', a: 'Generación tabla balance', ar: 'DATA', r: 'Leonardo Ferreyra', st: 'Completado', m: 0 },
  { fe: '02 jun', a: 'Reexpresión USD JP Morgan', ar: 'CONTABILIDAD', r: 'Jorge Salamanca', st: 'Retrasado', m: 35 },
  { fe: '02 jun', a: 'Conciliaciones bancos operativos', ar: 'OPS', r: 'Raúl Morales', st: 'Retrasado', m: 38 },
  { fe: '01 jun', a: 'Cierre de depósitos', ar: 'DATA', r: 'Elmer Ortega', st: 'Retrasado', m: 90 },
  { fe: '01 jun', a: 'Confirmación formato 281', ar: 'CONTABILIDAD', r: 'Contabilidad', st: 'Retrasado', m: 82 },
  { fe: '30 may', a: 'Cierre bancario JP Morgan', ar: 'OPS', r: 'Jhon Carvajal', st: 'Retrasado', m: 18 },
  { fe: '29 may', a: 'Contabilización movimientos', ar: 'OPS', r: 'Karen Caicedo', st: 'Completado', m: 0 },
  { fe: '28 may', a: 'Generación formatos 281 y 458', ar: 'SIREG', r: 'Reporting', st: 'Completado', m: 0 },
];

function AsanaIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="18.5" cy="5.5" r="4.5" fill="#F06A35" />
      <circle cx="5.5" cy="5.5" r="4.5" fill="#F06A35" />
      <circle cx="12" cy="18.5" r="4.5" fill="#F06A35" />
    </svg>
  );
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={onChange} role="switch" aria-checked={on} tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onChange()}
      style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
      <div style={{ width: 36, height: 20, borderRadius: 99, border: `0.5px solid ${on ? '#10B981' : '#E2E8F0'}`, background: on ? '#10B981' : '#F8FAFC', position: 'relative', transition: 'all .2s', flexShrink: 0 }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: on ? 20 : 2, transition: 'left .2s', boxShadow: '0 1px 2px rgba(0,0,0,.15)' }} />
      </div>
      <span style={{ fontSize: 11, color: on ? '#10B981' : '#94A3B8', width: 64 }}>{on ? 'Completado' : 'Pendiente'}</span>
    </div>
  );
}

function Popup({ data, onClose, onStatusChange }) {
  if (!data) return null;
  const ac = AC[data.area] || AC.SIREG;
  const sc = SC[data.estado] || SC.pending;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.42)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 280, maxWidth: '94vw', border: '0.5px solid #E2E8F0', boxShadow: '0 8px 32px rgba(0,0,0,.12)', overflow: 'hidden' }}>
        <div style={{ background: '#0F172A', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#F1F5F9', lineHeight: 1.3, marginRight: 8 }}>{data.nombre}</div>
            <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{data.hora} · {data.turno} · {data.area}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: '#64748B', cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
        <div style={{ padding: '10px 12px' }}>
          {onStatusChange && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Estado</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {Object.entries(SC).map(([k, v]) => (
                  <button key={k} onClick={() => onStatusChange(k)}
                    style={{ padding: '5px 7px', borderRadius: 7, border: `0.5px solid ${data.estado === k ? v.d : '#E2E8F0'}`, background: data.estado === k ? v.bg : '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: data.estado === k ? v.tx : '#64748B', fontWeight: data.estado === k ? 500 : 400 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: v.d, flexShrink: 0 }} />{v.l}
                  </button>
                ))}
              </div>
            </div>
          )}
          {[
            ['Área', <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: ac.bg, color: ac.tx, fontWeight: 500 }}>{data.area}</span>],
            ['Responsable', data.responsable || data.resp],
            ['Entregable', data.entregable],
            data.predecesoras && ['Predecesoras', data.predecesoras],
            data.desbloquea && ['Desbloquea', data.desbloquea],
          ].filter(Boolean).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '4px 0', borderBottom: '0.5px solid #F1F5F9' }}>
              <span style={{ fontSize: 10, color: '#94A3B8', width: 70, flexShrink: 0, paddingTop: 1 }}>{k}</span>
              <span style={{ fontSize: 11, color: '#1E293B', flex: 1, lineHeight: 1.4 }}>{v}</span>
            </div>
          ))}
          {data.asana && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0' }}>
              <span style={{ fontSize: 10, color: '#94A3B8', width: 70, flexShrink: 0 }}>Tarea</span>
              <a href="#" onClick={e => e.preventDefault()} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#F06A35', fontSize: 11, fontWeight: 500, textDecoration: 'none' }}>
                <AsanaIcon />Ver en Asana
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('ete');
  const [actividades, setActividades] = useState(STEPS.map(s => ({ ...s })));
  const [activeDay, setActiveDay] = useState(TODAY_IDX);
  const [activeWeek, setActiveWeek] = useState(0);
  const [now, setNow] = useState(new Date());
  const [popup, setPopup] = useState(null);
  const [tipDay, setTipDay] = useState(null);
  const [histFiltArea, setHistFiltArea] = useState('');
  const [histFiltEst, setHistFiltEst] = useState('');
  const [dbLoaded, setDbLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await supabase.from('actividades').select('*').order('id');
      if (data && data.length > 0) {
        setActividades(data.map(d => ({ ...d, m: d.minStart || d.m || 0 })));
        setDbLoaded(true);
      }
    } catch (e) { console.log('Using local data'); }
  }, []);

  useEffect(() => {
    fetchData();
    const ch = supabase.channel('changes').on('postgres_changes', { event: '*', schema: 'public', table: 'actividades' }, fetchData).subscribe();
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => { supabase.removeChannel(ch); clearInterval(timer); };
  }, [fetchData]);

  const updateEstado = async (id, estado) => {
    setActividades(prev => prev.map(a => a.id === id ? { ...a, s: estado, estado } : a));
    try { await supabase.from('actividades').update({ estado }).eq('id', id); } catch (e) { }
    if (popup && popup.id === id) setPopup(prev => ({ ...prev, estado }));
  };

  const getDateForDay = (offset) => {
    const d = new Date(); const day = d.getDay();
    const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + offset); return mon;
  };
  const fd = d => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  const fdl = d => d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isToday = activeDay === TODAY_IDX;
  const timePct = isToday ? Math.min(100, Math.max(0, Math.round((nowMin - 7 * 60) / (19 * 60 - 7 * 60) * 100))) : 0;
  const getEst = (s) => s.estado || s.s || 'pending';
  const done = actividades.filter(a => getEst(a) === 'done').length;
  const procPct = actividades.length ? Math.round(done / actividades.length * 100) : 0;
  const expPct = isToday ? Math.min(100, Math.round(actividades.filter(s => nowMin > (s.m || s.minStart || 0) + 15).length / (actividades.length || 1) * 100)) : 0;
  const procStatus = procPct - expPct >= 0 ? 'ok' : procPct - expPct >= -20 ? 'warn' : 'danger';
  const procColor = procStatus === 'ok' ? '#10B981' : procStatus === 'warn' ? '#F59E0B' : '#EF4444';

  const pill = (label, bg, tx) => <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: bg, color: tx, fontWeight: 500 }}>{label}</span>;

  const s = { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#F1F5F9', minHeight: '100vh' };

  return (
    <div style={s}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} .scard:hover{filter:brightness(.97)} .nb:hover{color:#334155} .enode:hover .edot{transform:scale(1.1);filter:brightness(.95)} ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:3px}`}</style>

      {/* HEADER */}
      <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 50 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>ADDI CF — Monitor de procesos</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>Proceso diario Finances</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#64748B' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
            <span>En vivo</span>
            <span style={{ fontWeight: 500, color: '#0F172A' }}>{now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <span>{now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
          </div>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid #F1F5F9', overflowX: 'auto' }}>
          {[['ete', 'End to End'], ['proc', 'Flujo diario - Finanzas'], ['ind', 'Indicadores']].map(([id, lbl]) => (
            <button key={id} className="nb" onClick={() => setTab(id)}
              style={{ padding: '8px 16px', fontSize: 12, color: tab === id ? '#1D4ED8' : '#64748B', border: 'none', background: 'none', cursor: 'pointer', borderBottom: `2px solid ${tab === id ? '#3B82F6' : 'transparent'}`, whiteSpace: 'nowrap', fontWeight: tab === id ? 500 : 400 }}>{lbl}</button>
          ))}
        </div>
      </div>

      {popup && (
        <Popup data={popup} onClose={() => setPopup(null)}
          onStatusChange={popup.isProc ? (st) => { updateEstado(popup.id, st); setPopup(p => ({ ...p, estado: st })); } : null} />
      )}

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '14px 20px' }}>

        {/* ETE */}
        {tab === 'ete' && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1E293B', marginBottom: 3 }}>Flujo completo del proceso de cierre</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 14 }}>Haz clic en cualquier nodo para ver el detalle</div>
            {PHASES.map((p, pi) => (
              <div key={pi}>
                {pi > 0 && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '3px 0 5px' }}><div style={{ width: 2, height: 12, background: '#CBD5E1' }} /><div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #CBD5E1' }} /></div>}
                <div style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>{p.lbl}</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 6, marginBottom: 2 }}>
                  {p.nodes.map((n, i) => {
                    const ac = AC[n.a] || AC.SIREG; const sc2 = SC[n.s] || SC.pending;
                    const bg = n.s === 'done' ? '#F0FDF4' : n.s === 'active' ? '#EFF6FF' : ac.bg;
                    const bd = n.s === 'done' ? '#10B981' : n.s === 'active' ? '#3B82F6' : ac.bd;
                    const idx = ALL_ETE.indexOf(n);
                    return (
                      <React.Fragment key={i}>
                        <div className="enode" onClick={() => setPopup({ nombre: n.n, hora: n.h, turno: p.lbl.split('—')[0].trim(), area: n.a, responsable: n.r, entregable: n.e, estado: n.s, asana: n.asana })}
                          style={{ flexShrink: 0, width: 105, borderRadius: 8, border: `1.5px solid ${bd}`, padding: '6px 8px', cursor: 'pointer', background: bg, position: 'relative', transition: 'transform .15s' }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc2.d, position: 'absolute', top: 5, right: 5 }} />
                          <div style={{ fontSize: 9, fontWeight: 500, color: ac.tx, opacity: .8, marginBottom: 2 }}>{n.h}</div>
                          <div style={{ fontSize: 10, fontWeight: 500, color: '#1E293B', lineHeight: 1.3 }}>{n.n}</div>
                          <div style={{ fontSize: 9, color: '#64748B', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.r}</div>
                        </div>
                        {i < p.nodes.length - 1 && <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 3px', marginBottom: 14 }}><div style={{ width: 16, height: 2, background: '#CBD5E1' }} /><div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '5px solid #CBD5E1' }} /></div>}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12, paddingTop: 10, borderTop: '0.5px solid #F1F5F9' }}>
              {[['#6366F1', 'OPS'], ['#10B981', 'Contabilidad'], ['#3B82F6', 'Data'], ['#F59E0B', 'Riesgos'], ['#F43F5E', 'Tesorería'], ['#94A3B8', 'SIREG'], ['#10B981', 'Completado'], ['#3B82F6', 'En curso']].map(([c, l]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748B' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block', border: `1.5px solid ${c}` }}></span>{l}</span>
              ))}
            </div>
          </div>
        )}

        {/* PROCESO */}
        {tab === 'proc' && (
          <div>
            <div style={{ display: 'flex', gap: 5, marginBottom: 11, flexWrap: 'wrap' }}>
              {DAYS.map((d, i) => (
                <button key={i} onClick={() => setActiveDay(i)}
                  style={{ fontSize: 11, padding: '3px 11px', borderRadius: 99, border: `0.5px solid ${activeDay === i ? '#1E293B' : i === TODAY_IDX ? '#3B82F6' : '#E2E8F0'}`, background: activeDay === i ? '#1E293B' : '#fff', color: activeDay === i ? '#fff' : i === TODAY_IDX ? '#1E40AF' : '#64748B', cursor: 'pointer', fontWeight: activeDay === i ? 500 : 400 }}>
                  {d} <span style={{ opacity: .6, fontSize: 10 }}>{fd(getDateForDay(i))}</span>
                </button>
              ))}
            </div>

            {isToday && expPct > 0 && (
              <div style={{ borderRadius: 8, padding: '7px 11px', marginBottom: 10, fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5, background: procStatus === 'ok' ? '#ECFDF5' : procStatus === 'warn' ? '#FFFBEB' : '#FEF2F2', color: procStatus === 'ok' ? '#065F46' : procStatus === 'warn' ? '#92400E' : '#991B1B', border: `0.5px solid ${procStatus === 'ok' ? '#A7F3D0' : procStatus === 'warn' ? '#FDE68A' : '#FECACA'}` }}>
                {procStatus === 'ok' ? '✅' : procStatus === 'warn' ? '⚠️' : '🚨'}
                {procStatus === 'ok' ? `Proceso al día — ${done}/${actividades.length} completadas a tiempo` : procStatus === 'warn' ? `Retrasado — deberías ir en ${expPct}% pero vas en ${procPct}%` : `Alerta crítica — ${expPct - procPct}% de retraso`}
              </div>
            )}

            <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #E2E8F0', padding: '11px 13px', marginBottom: 11 }}>
              {[{ lbl: 'Hora del día (07:00 → 19:00)', pct: timePct, color: '#3B82F6', shadow: '#DBEAFE', val: now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), marker: false },
              { lbl: 'Progreso del proceso', pct: procPct, color: procColor, shadow: procStatus === 'ok' ? '#DCFCE7' : procStatus === 'warn' ? '#FEF3C7' : '#FEE2E2', val: `${procPct}%`, marker: true }].map(b => (
                <div key={b.lbl} style={{ marginBottom: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B' }}>{b.lbl}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#1E293B' }}>{b.val}</span>
                  </div>
                  <div style={{ height: 7, background: '#F1F5F9', borderRadius: 99, position: 'relative' }}>
                    <div style={{ height: '100%', width: `${b.pct}%`, background: b.color, borderRadius: 99, transition: 'width .6s', position: 'relative' }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: b.color, border: '2px solid #fff', position: 'absolute', right: -7, top: -3.5, boxShadow: `0 0 0 3px ${b.shadow}` }} />
                    </div>
                    {b.marker && isToday && expPct > 0 && <div style={{ position: 'absolute', top: -6, left: `${expPct}%`, width: 2, height: 19, background: '#94A3B8', borderRadius: 1 }}><div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: '#94A3B8', whiteSpace: 'nowrap' }}>esperado</div></div>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #E2E8F0', overflow: 'hidden' }}>
              {['T+0', 'T+1'].map(turno => {
                const steps = actividades.filter(a => a.t === turno || a.turno === turno);
                if (!steps.length) return null;
                const dt = turno === 'T+0' ? getDateForDay(activeDay) : getDateForDay(activeDay + 1);
                return (
                  <div key={turno}>
                    <div style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em', padding: '7px 12px 5px 78px', background: '#F8FAFC', borderBottom: '0.5px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {turno} <span style={{ fontSize: 10, fontWeight: 500, color: '#3B82F6', background: '#EFF6FF', padding: '2px 6px', borderRadius: 99 }}>{fdl(dt)}</span>
                    </div>
                    {steps.map((a, i) => {
                      const st = getEst(a);
                      const minStart = a.m || a.minStart || 0;
                      const isLate = isToday && st !== 'done' && nowMin > minStart + 30;
                      const isNow2 = isToday && st !== 'done' && nowMin >= minStart && nowMin <= minStart + 30;
                      const dc = st === 'done' ? 'done' : isNow2 ? 'active' : isLate ? 'late' : 'pending';
                      const sc2 = SC[dc]; const ac2 = AC[a.a || a.area_key || a.area] || AC.SIREG;
                      const isLast = i === steps.length - 1;
                      const preds = actividades.filter(x => (x.bl || x.bloquea || []).includes(a.id)).map(x => x.n || x.nombre).join(', ') || 'Ninguna';
                      const desbl = (a.bl || a.bloquea || []).map(b2 => { const f = actividades.find(x => x.id === b2); return f ? (f.n || f.nombre) : ''; }).filter(Boolean).join(', ') || 'Ninguna';
                      return (
                        <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '55px 15px 1fr', gap: '0 9px', padding: '2px 12px 0' }}>
                          <div style={{ fontSize: 10, color: '#94A3B8', textAlign: 'right', paddingTop: 7 }}>{a.h || a.hora}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${sc2.d}`, background: dc === 'done' || isNow2 ? sc2.d : '#F8FAFC', flexShrink: 0, marginTop: 6, boxShadow: isNow2 ? `0 0 0 3px ${sc2.bg}` : 'none', transition: 'all .3s' }} />
                            {!isLast && <div style={{ width: 2, flex: 1, minHeight: 9, marginTop: 2, background: dc === 'done' ? '#10B981' : isNow2 ? '#3B82F6' : isLate ? '#FECACA' : '#E2E8F0' }} />}
                          </div>
                          <div>
                            <div className="scard" onClick={() => setPopup({ id: a.id, nombre: a.n || a.nombre, hora: a.h || a.hora, turno, area: a.a || a.area_key || a.area, responsable: a.r || a.responsable, entregable: a.e || a.entregable, estado: st, predecesoras: preds, desbloquea: desbl, asana: a.asana, isProc: true })}
                              style={{ borderRadius: 7, padding: '7px 10px', marginBottom: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, cursor: 'pointer', border: `0.5px solid ${sc2.bb}`, background: sc2.cb, opacity: dc === 'done' ? .8 : 1 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 500, color: dc === 'done' ? '#94A3B8' : '#1E293B', textDecoration: dc === 'done' ? 'line-through' : 'none', lineHeight: 1.3 }}>{a.n || a.nombre}</div>
                                <div style={{ display: 'flex', gap: 3, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                                  {pill(a.a || a.area_key || a.area, ac2.bg, ac2.tx)}
                                  {pill(sc2.l, sc2.bg, sc2.tx)}
                                  <span style={{ fontSize: 10, color: '#94A3B8' }}>{a.r || a.responsable}</span>
                                </div>
                              </div>
                              <div onClick={e => e.stopPropagation()}>
                                <Toggle on={st === 'done'} onChange={() => updateEstado(a.id, st === 'done' ? 'pending' : 'done')} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* INDICADORES */}
        {tab === 'ind' && (() => {
          const d = WEEK_DATA[activeWeek];
          const sm = d.sla >= 90 ? { bg: '#ECFDF5', bc: '#A7F3D0', tc: '#065F46', i: '🟢', t: 'Proceso saludable' } : d.sla >= 75 ? { bg: '#FFFBEB', bc: '#FDE68A', tc: '#92400E', i: '🟡', t: 'Proceso con alertas' } : { bg: '#FEF2F2', bc: '#FECACA', tc: '#991B1B', i: '🔴', t: 'Proceso crítico' };
          const trend = (curr, prev, higherIsBetter, unit='', label='') => {
            const diff = curr - prev;
            const better = higherIsBetter ? diff >= 0 : diff <= 0;
            const color = diff === 0 ? '#64748B' : better ? '#10B981' : '#EF4444';
            const dir = diff === 0 ? 'Sin cambio' : (diff > 0 ? 'subió' : 'bajó');
            const text = diff === 0 ? `Sin cambio` : `${label}${dir} de ${prev}${unit} a ${curr}${unit}`;
            return { color, text, better };
          };
          const T = {
            sla: trend(d.sla, d.slaP, true, '%', 'SLA '),
            ret: trend(d.ret, d.retP, false, '', 'Retrasos '),
            avg: trend(d.avg, d.avgP, false, ' min', 'Retraso prom. '),
            dias: trend(d.dias, d.diasP, true, ' días', 'Días sin incidentes '),
          };
          const S2 = { Completado: { bg: '#ECFDF5', tx: '#065F46' }, Retrasado: { bg: '#FEE2E2', tx: '#991B1B' }, Pendiente: { bg: '#F1F5F9', tx: '#64748B' } };
          const filtHist = HIST.filter(r => (!histFiltArea || r.ar === histFiltArea) && (!histFiltEst || r.st === histFiltEst));
          const mx = Math.max(...d.days.map(x => x.c), 1);

          return (
            <div>
              <div style={{ display: 'flex', gap: 5, marginBottom: 11, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>Semana:</span>
                {[[-2, 'Hace 2 sem'], [-1, 'Sem. pasada'], [0, 'Esta semana']].map(([w, lbl]) => (
                  <button key={w} onClick={() => { setActiveWeek(w); setTipDay(null); }}
                    style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, border: '0.5px solid #E2E8F0', background: activeWeek === w ? '#1E293B' : '#fff', color: activeWeek === w ? '#fff' : '#64748B', cursor: 'pointer', fontWeight: activeWeek === w ? 500 : 400 }}>{lbl}</button>
                ))}
              </div>

              <div style={{ background: sm.bg, border: `0.5px solid ${sm.bc}`, borderRadius: 10, padding: '10px 13px', marginBottom: 11, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{sm.i}</span>
                <div style={{ fontSize: 13, fontWeight: 500, color: sm.tc }}>{sm.t} — {d.sla}% de cumplimiento SLA</div>
              </div>

              {/* Tabla reporte */}
              <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #E2E8F0', overflow: 'hidden', marginBottom: 11 }}>
                <div style={{ padding: '9px 12px', background: '#F8FAFC', borderBottom: '0.5px solid #E2E8F0', fontSize: 12, fontWeight: 500, color: '#1E293B' }}>Resumen ejecutivo — comparativo semana anterior</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      {['Indicador', 'Esta semana', 'Sem. anterior', 'Variación', 'Estado'].map(h => (
                        <th key={h} style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.04em', padding: '7px 10px', background: '#F8FAFC', borderBottom: '0.5px solid #E2E8F0', textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { ind: 'Cumplimiento SLA', curr: `${d.sla}%`, prev: `${d.slaP}%`, t: T.sla, ok: d.sla >= 90, warn: d.sla >= 75 },
                      { ind: 'Retrasos totales', curr: d.ret, prev: d.retP, t: T.ret, ok: d.ret <= 2, warn: d.ret <= 4 },
                      { ind: 'Retraso promedio', curr: `${d.avg} min`, prev: `${d.avgP} min`, t: T.avg, ok: d.avg <= 30, warn: d.avg <= 60 },
                      { ind: 'Días sin incidentes', curr: `${d.dias} días`, prev: `${d.diasP} días`, t: T.dias, ok: d.dias >= 4, warn: d.dias >= 2 },
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: '0.5px solid #F1F5F9' }}>
                        <td style={{ padding: '9px 10px', fontWeight: 500, color: '#1E293B' }}>{row.ind}</td>
                        <td style={{ padding: '9px 10px', fontWeight: 500, color: row.ok ? '#10B981' : row.warn ? '#F59E0B' : '#EF4444' }}>{row.curr}</td>
                        <td style={{ padding: '9px 10px', color: '#64748B' }}>{row.prev}</td>
                        <td style={{ padding: '9px 10px', color: row.t.color, fontWeight: 400, fontSize: 11 }}>{row.t.text}</td>
                        <td style={{ padding: '9px 10px' }}>{pill(row.ok ? 'Bien' : row.warn ? 'Alerta' : 'Crítico', row.ok ? '#DCFCE7' : row.warn ? '#FEF3C7' : '#FEE2E2', row.ok ? '#166534' : row.warn ? '#92400E' : '#991B1B')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Chart */}
              <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #E2E8F0', padding: 12, marginBottom: 11 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#1E293B', marginBottom: 10 }}>Retrasos por día — clic para ver responsables</div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 68 }}>
                  {d.days.map((x, i) => (
                    <div key={i} onClick={() => setTipDay(tipDay === i ? null : i)}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                        <div style={{ width: '100%', borderRadius: '2px 2px 0 0', height: Math.max(2, x.c / mx * 58), background: tipDay === i ? '#1E293B' : x.c === 0 ? '#10B981' : x.c === 1 ? '#F59E0B' : '#EF4444', transition: 'all .2s' }} />
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 500, color: tipDay === i ? '#1E293B' : '#64748B' }}>{x.c}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 4 }}>
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map((d2, i) => <span key={i} style={{ fontSize: 10, color: tipDay === i ? '#1E293B' : '#94A3B8', fontWeight: tipDay === i ? 500 : 400 }}>{d2}</span>)}
                </div>
                {tipDay !== null && (
                  <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '8px 10px', marginTop: 8, fontSize: 11 }}>
                    <div style={{ fontWeight: 500, color: '#1E293B', marginBottom: 4 }}>
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'][tipDay]} — {d.days[tipDay].c === 0 ? 'sin retrasos ✅' : `${d.days[tipDay].c} retraso${d.days[tipDay].c !== 1 ? 's' : ''}`}
                    </div>
                    {d.days[tipDay].rs.map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '3px 0', borderBottom: i < d.days[tipDay].rs.length - 1 ? '0.5px solid #E2E8F0' : 'none' }}>
                        <span style={{ color: '#1E293B' }}>{r.a}</span>
                        <span style={{ color: '#64748B', whiteSpace: 'nowrap' }}>{r.r} · <strong style={{ color: '#EF4444' }}>Retraso: {r.m} min</strong></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Histórico */}
              <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #E2E8F0' }}>
                <div style={{ padding: '9px 12px', borderBottom: '0.5px solid #F1F5F9', fontSize: 12, fontWeight: 500, color: '#1E293B' }}>Histórico de actividades</div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    <select value={histFiltArea} onChange={e => setHistFiltArea(e.target.value)} style={{ fontSize: 11, padding: '3px 7px', borderRadius: 7, border: '0.5px solid #E2E8F0', background: '#fff', color: '#1E293B' }}>
                      <option value="">Todas las áreas</option>
                      {['OPS', 'CONTABILIDAD', 'DATA', 'RIESGOS', 'TESORERIA', 'SIREG'].map(a => <option key={a}>{a}</option>)}
                    </select>
                    <select value={histFiltEst} onChange={e => setHistFiltEst(e.target.value)} style={{ fontSize: 11, padding: '3px 7px', borderRadius: 7, border: '0.5px solid #E2E8F0', background: '#fff', color: '#1E293B' }}>
                      <option value="">Todos los estados</option>
                      <option>Completado</option><option>Retrasado</option><option>Pendiente</option>
                    </select>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
                      <thead>
                        <tr>{['Fecha', 'Actividad', 'Área', 'Responsable', 'Estado', 'Retraso'].map((h, i) => (
                          <th key={h} style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.04em', padding: '6px 8px', background: '#F8FAFC', borderBottom: '0.5px solid #E2E8F0', textAlign: 'left', width: [65, 150, 90, 120, 80, 75][i] }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {filtHist.map((r, i) => {
                          const ac3 = AC[r.ar] || AC.SIREG; const sc3 = S2[r.st] || S2.Pendiente;
                          return (
                            <tr key={i} style={{ borderBottom: '0.5px solid #F1F5F9' }}>
                              <td style={{ padding: '6px 8px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.fe}</td>
                              <td style={{ padding: '6px 8px', color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.a}>{r.a}</td>
                              <td style={{ padding: '6px 8px' }}>{pill(r.ar, ac3.bg, ac3.tx)}</td>
                              <td style={{ padding: '6px 8px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.r}</td>
                              <td style={{ padding: '6px 8px' }}>{pill(r.st, sc3.bg, sc3.tx)}</td>
                              <td style={{ padding: '6px 8px', color: r.m > 0 ? '#EF4444' : '#10B981', fontWeight: 500 }}>{r.m > 0 ? `${r.m} min` : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
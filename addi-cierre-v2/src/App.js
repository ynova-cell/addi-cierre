import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const TODAY_IDX = Math.min(4, Math.max(0, (new Date().getDay() || 1) - 1));

const AREA_COLORS = {
  OPS: { bg: '#EEF2FF', text: '#3730A3', border: '#C7D2FE' },
  CONTABILIDAD: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  DATA: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  RIESGOS: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  TESORERIA: { bg: '#FFF1F2', text: '#9F1239', border: '#FECDD3' },
  SIREG: { bg: '#F8FAFC', text: '#475569', border: '#CBD5E1' },
};

const STATUS_CONFIG = {
  done: { label: 'Completado', bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
  active: { label: 'En curso', bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6' },
  late: { label: 'Retrasado', bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
  pending: { label: 'Pendiente', bg: '#F8FAFC', text: '#64748B', dot: '#CBD5E1' },
};

const ETE_NODES = {
  t0: [
    { label: 'Saldos JP Morgan', area: 'OPS', areaKey: 'OPS', hora: '16:00–16:15', resp: 'Juan Esteban / Karen Caicedo', entregable: 'Sheets cash visibility', estado: 'done' },
    { label: 'Descarga movimientos', area: 'OPS', areaKey: 'OPS', hora: '16:15–16:30', resp: 'Juan Esteban / Karen Caicedo', entregable: 'Archivo mov bancarios CF', estado: 'done' },
    { label: 'Contabilización Netsuite', area: 'OPS', areaKey: 'OPS', hora: '16:30–17:00', resp: 'Raúl Morales / Karen Caicedo', entregable: 'Plano en Drive', estado: 'done' },
    { label: 'Cierre JP Morgan', area: 'OPS', areaKey: 'OPS', hora: '17:00–17:30', resp: 'Jhon Carvajal / Maria Valentina', entregable: 'Asana + Slack confirmación', estado: 'active' },
    { label: 'Reexpresión USD', area: 'CONTABILIDAD', areaKey: 'CONTABILIDAD', hora: '17:30–18:00', resp: 'Jorge Salamanca / Vannessa Palma', entregable: 'Asana aprobación + Slack', estado: 'pending' },
  ],
  mad: [
    { label: 'Cierre depósitos', area: 'DATA', areaKey: 'DATA', hora: '~03:00', resp: 'Elmer Ortega / Julio Alfonso', entregable: 'Proceso automático', estado: 'pending' },
    { label: 'Tabla balance', area: 'DATA', areaKey: 'DATA', hora: '~05:45', resp: 'Leonardo Ferreyra / Julio Alfonso', entregable: 'Tabla DB + tabla AWS', estado: 'pending' },
    { label: 'Recepción AWS', area: 'DATA', areaKey: 'DATA', hora: '~06:30', resp: 'Julio Alfonso', entregable: 'Alerta recepción insumos', estado: 'pending' },
    { label: 'Cron SIREG', area: 'SIREG', areaKey: 'SIREG', hora: '~06:45', resp: 'Yesica Nova / Stefanny Rincón', entregable: 'Reportes SIREG generados', estado: 'pending' },
  ],
  man: [
    { label: 'Saldos todos bancos', area: 'OPS', areaKey: 'OPS', hora: '07:00–07:15', resp: 'Juan Esteban / Karen Caicedo', entregable: 'Sheets cash visibility', estado: 'pending' },
    { label: 'Contabilización otros', area: 'OPS', areaKey: 'OPS', hora: '07:30–07:45', resp: 'Juan Esteban / Karen Caicedo', entregable: 'Archivo plano Drive', estado: 'pending' },
    { label: 'Conciliaciones OPS', area: 'OPS', areaKey: 'OPS', hora: '07:45–08:00', resp: 'Raúl Morales / Juan Esteban', entregable: 'Asana + Slack', estado: 'pending' },
    { label: 'Inversiones CTB', area: 'CONTABILIDAD', areaKey: 'CONTABILIDAD', hora: '~10:00', resp: 'Jorge Salamanca / Hector Ovalle', entregable: 'Asana + Slack', estado: 'pending' },
    { label: 'Cierre admin.', area: 'TESORERIA', areaKey: 'TESORERIA', hora: '~10:00', resp: 'Michael Cobos / Maribel Gonzalez', entregable: 'Asana + Slack', estado: 'pending' },
  ],
  tar: [
    { label: '2do cierre Netsuite', area: 'DATA', areaKey: 'DATA', hora: '~12:30', resp: 'Leonardo Ferreyra / Julio Alfonso', entregable: 'Proceso automático', estado: 'pending' },
    { label: 'Formatos 281/458', area: 'SIREG', areaKey: 'SIREG', hora: '~14:00', resp: 'Reporting', entregable: 'Formatos generados', estado: 'pending' },
    { label: 'Confirm. 281', area: 'CONTABILIDAD', areaKey: 'CONTABILIDAD', hora: '~15:00', resp: 'Contabilidad', entregable: 'Formato confirmado', estado: 'pending' },
    { label: 'Confirm. 458', area: 'RIESGOS', areaKey: 'RIESGOS', hora: '~16:00', resp: 'Riesgos', entregable: 'Formato confirmado', estado: 'pending' },
    { label: 'Transmisión SFC ✓', area: 'RIESGOS', areaKey: 'RIESGOS', hora: '~17:00', resp: 'Riesgos', entregable: 'Transmitido a SFC', estado: 'pending' },
  ],
};

const WEEK_DATA = {
  0: { retrasos: 3, pct: 87, criticas: 1, diasOk: 3, trend: '+1', days: [0, 2, 0, 1, 0], top: [{ n: 'Reexpresión USD JP Morgan', c: 4, cl: 'red' }, { n: 'Cierre bancario JP Morgan', c: 2, cl: 'yellow' }, { n: 'Confirmación formato 458', c: 2, cl: 'yellow' }, { n: 'Generación tabla balance', c: 1, cl: 'green' }], sla: [{ a: 'OPS', p: 92 }, { a: 'Contabilidad', p: 88 }, { a: 'Data', p: 95 }, { a: 'Riesgos', p: 83 }, { a: 'Tesorería', p: 100 }] },
  '-1': { retrasos: 5, pct: 74, criticas: 3, diasOk: 1, trend: '+3', days: [1, 2, 1, 0, 1], top: [{ n: 'Reexpresión USD JP Morgan', c: 3, cl: 'red' }, { n: 'Conciliaciones bancos', c: 2, cl: 'yellow' }, { n: 'Cierre depósitos', c: 2, cl: 'yellow' }, { n: 'Confirmación formato 281', c: 1, cl: 'green' }], sla: [{ a: 'OPS', p: 78 }, { a: 'Contabilidad', p: 72 }, { a: 'Data', p: 85 }, { a: 'Riesgos', p: 70 }, { a: 'Tesorería', p: 90 }] },
  '-2': { retrasos: 1, pct: 95, criticas: 0, diasOk: 5, trend: '-2', days: [0, 0, 0, 1, 0], top: [{ n: 'Cierre bancario JP Morgan', c: 1, cl: 'green' }, { n: 'Reexpresión USD JP Morgan', c: 1, cl: 'green' }], sla: [{ a: 'OPS', p: 98 }, { a: 'Contabilidad', p: 95 }, { a: 'Data', p: 100 }, { a: 'Riesgos', p: 92 }, { a: 'Tesorería', p: 100 }] },
};

export default function App() {
  const [tab, setTab] = useState('ete');
  const [actividades, setActividades] = useState([]);
  const [activeDay, setActiveDay] = useState(TODAY_IDX);
  const [activeWeek, setActiveWeek] = useState(0);
  const [now, setNow] = useState(new Date());
  const [popup, setPopup] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from('actividades').select('*').order('id');
    if (data) setActividades(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('changes').on('postgres_changes', { event: '*', schema: 'public', table: 'actividades' }, fetchData).subscribe();
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => { supabase.removeChannel(channel); clearInterval(timer); };
  }, [fetchData]);

  const updateEstado = async (id, estado) => {
    await supabase.from('actividades').update({ estado }).eq('id', id);
    setActividades(prev => prev.map(a => a.id === id ? { ...a, estado } : a));
  };

  const getDateForDay = (offset) => {
    const d = new Date();
    const day = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + offset);
    return mon;
  };

  const fmtDate = (d) => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  const fmtDateLong = (d) => d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isToday = activeDay === TODAY_IDX;
  const timePct = isToday ? Math.min(100, Math.max(0, Math.round((nowMin - 16 * 60) / (18 * 60 - 16 * 60) * 100))) : 0;
  const done = actividades.filter(a => a.estado === 'done').length;
  const procPct = actividades.length ? Math.round(done / actividades.length * 100) : 0;
  const expPct = isToday ? Math.min(100, Math.round(actividades.filter(s => nowMin > s.minStart + 15).length / (actividades.length || 1) * 100)) : 0;
  const procStatus = procPct - expPct >= 0 ? 'ok' : procPct - expPct >= -20 ? 'warn' : 'danger';

  const s = { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#F1F5F9', minHeight: '100vh' };

  if (loading) return (
    <div style={{ ...s, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTop: '3px solid #3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#64748B', fontSize: 14 }}>Cargando...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={s}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes glow{0%{box-shadow:0 0 0 0 #DCFCE7}100%{box-shadow:0 0 0 8px transparent}}
        .step-card:hover{background:#F8FAFC!important}
        .ete-node:hover .ete-dot{transform:scale(1.12)}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:3px}
      `}</style>

      {/* HEADER */}
      <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 52 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>ADDI CF — Monitor de procesos</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>Proceso diario Finances</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
            <span>En vivo</span>
            <span style={{ fontWeight: 600, color: '#0F172A' }}>{now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>{now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
          </div>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid #F1F5F9' }}>
          {[['ete', 'End to End'], ['proceso', 'Proceso diario'], ['indicadores', 'Indicadores']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 500, color: tab === id ? '#1E40AF' : '#64748B', border: 'none', background: 'none', cursor: 'pointer', borderBottom: `2px solid ${tab === id ? '#3B82F6' : 'transparent'}`, transition: 'all .15s' }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 24px' }}>

        {/* TAB: END TO END */}
        {tab === 'ete' && (
          <div>
            {popup && (
              <div onClick={(e) => e.target === e.currentTarget && setPopup(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', borderRadius: 14, padding: 20, width: 320, maxWidth: '90vw', boxShadow: '0 20px 50px rgba(0,0,0,.18)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', flex: 1, marginRight: 8, lineHeight: 1.3 }}>{popup.label}</div>
                    <button onClick={() => setPopup(null)} style={{ background: 'none', border: 'none', fontSize: 22, color: '#94A3B8', cursor: 'pointer', lineHeight: 1 }}>×</button>
                  </div>
                  {[['Área', <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: AREA_COLORS[popup.areaKey]?.bg || '#F8FAFC', color: AREA_COLORS[popup.areaKey]?.text || '#475569', fontWeight: 500 }}>{popup.area}</span>], ['Horario', popup.hora], ['Responsable', popup.resp], ['Entregable', popup.entregable], ['Estado', <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: STATUS_CONFIG[popup.estado]?.bg, color: STATUS_CONFIG[popup.estado]?.text, fontWeight: 500 }}>{STATUS_CONFIG[popup.estado]?.label}</span>]].map(([key, val]) => (
                    <div key={key} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{key}</div>
                      <div style={{ fontSize: 13, color: '#1E293B' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20, overflowX: 'auto' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginBottom: 3 }}>Flujo completo del proceso de cierre</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 20 }}>Haz clic en cualquier nodo para ver el detalle completo</div>
              {[['T+0 Tarde', 't0'], ['T+1 Madrugada', 'mad'], ['T+1 Mañana', 'man'], ['T+1 Tarde', 'tar']].map(([label, key], pi) => (
                <div key={key}>
                  {pi > 0 && <hr style={{ border: 'none', borderTop: '1px dashed #E2E8F0', margin: '4px 0 4px 80px' }} />}
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0 16px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.04em', paddingTop: 14, textAlign: 'right', lineHeight: 1.3 }}>{label}</div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 4 }}>
                      {ETE_NODES[key].map((node, i) => {
                        const ac = AREA_COLORS[node.areaKey] || AREA_COLORS.SIREG;
                        const dotBg = node.estado === 'done' ? '#10B981' : node.estado === 'active' ? '#3B82F6' : ac.bg;
                        const dotBorder = node.estado === 'done' ? '#10B981' : node.estado === 'active' ? '#3B82F6' : ac.border;
                        const dotText = node.estado === 'done' || node.estado === 'active' ? '#fff' : ac.text;
                        const areaShort = node.area === 'CONTABILIDAD' ? 'CTB' : node.area === 'TESORERIA' ? 'TESO' : node.area;
                        return (
                          <React.Fragment key={i}>
                            <div className="ete-node" onClick={() => setPopup(node)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}>
                              <div className="ete-dot" style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${dotBorder}`, background: dotBg, color: dotText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, transition: 'transform .15s', boxShadow: node.estado === 'active' ? '0 0 0 4px #DBEAFE' : 'none' }}>{areaShort}</div>
                              <div style={{ fontSize: 9, color: '#94A3B8', textAlign: 'center', maxWidth: 60, lineHeight: 1.2 }}>{node.label}</div>
                            </div>
                            {i < ETE_NODES[key].length - 1 && <div style={{ flex: 1, height: 2, background: '#E2E8F0', minWidth: 12, marginTop: 18, position: 'relative' }}><div style={{ position: 'absolute', right: -4, top: -3, border: '4px solid transparent', borderLeftColor: '#CBD5E1' }} /></div>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
                {[['#6366F1', 'OPS'], ['#10B981', 'Contabilidad'], ['#3B82F6', 'Data'], ['#F59E0B', 'Riesgos'], ['#F43F5E', 'Tesorería'], ['#94A3B8', 'SIREG']].map(([color, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748B' }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />{label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: PROCESO DIARIO */}
        {tab === 'proceso' && (
          <div>
            {/* Day selector */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {DAYS.map((d, i) => (
                <button key={i} onClick={() => setActiveDay(i)} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 99, border: `1px solid ${activeDay === i ? '#1E293B' : i === TODAY_IDX ? '#3B82F6' : '#E2E8F0'}`, background: activeDay === i ? '#1E293B' : '#fff', color: activeDay === i ? '#fff' : i === TODAY_IDX ? '#1E40AF' : '#64748B', cursor: 'pointer', fontWeight: activeDay === i ? 600 : 400 }}>
                  {d} <span style={{ opacity: .6, fontSize: 10 }}>{fmtDate(getDateForDay(i))}</span>
                </button>
              ))}
            </div>

            {/* Alert */}
            {isToday && expPct > 0 && (
              <div style={{ borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, background: procStatus === 'ok' ? '#ECFDF5' : procStatus === 'warn' ? '#FFFBEB' : '#FEF2F2', color: procStatus === 'ok' ? '#065F46' : procStatus === 'warn' ? '#92400E' : '#991B1B', border: `1px solid ${procStatus === 'ok' ? '#A7F3D0' : procStatus === 'warn' ? '#FDE68A' : '#FECACA'}` }}>
                {procStatus === 'ok' ? '✅' : procStatus === 'warn' ? '⚠️' : '🚨'}
                {procStatus === 'ok' ? `Proceso al día — ${done}/${actividades.length} completadas` : procStatus === 'warn' ? `Retrasado — deberías ir en ${expPct}% pero vas en ${procPct}%` : `Alerta crítica — ${expPct - procPct}% de retraso`}
              </div>
            )}

            {/* Bars */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '14px 16px', marginBottom: 14 }}>
              {[
                { label: 'Hora del día', pct: timePct, color: '#3B82F6', shadow: '#DBEAFE', val: now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), showMarker: false },
                { label: 'Progreso del proceso', pct: procPct, color: procStatus === 'ok' ? '#10B981' : procStatus === 'warn' ? '#F59E0B' : '#EF4444', shadow: procStatus === 'ok' ? '#DCFCE7' : procStatus === 'warn' ? '#FEF3C7' : '#FEE2E2', val: `${procPct}%`, showMarker: true },
              ].map(bar => (
                <div key={bar.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B' }}>{bar.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>{bar.val}</span>
                  </div>
                  <div style={{ height: 8, background: '#F1F5F9', borderRadius: 99, position: 'relative' }}>
                    <div style={{ height: '100%', width: `${bar.pct}%`, background: bar.color, borderRadius: 99, transition: 'width .6s', position: 'relative' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: bar.color, border: '2px solid #fff', position: 'absolute', right: -8, top: -4, boxShadow: `0 0 0 3px ${bar.shadow}` }} />
                    </div>
                    {bar.showMarker && expPct > 0 && (
                      <div style={{ position: 'absolute', top: -6, left: `${expPct}%`, width: 2, height: 20, background: '#94A3B8', borderRadius: 1 }}>
                        <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: '#94A3B8', whiteSpace: 'nowrap' }}>esperado</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Flow */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              {['T+0', 'T+1'].map(turno => {
                const steps = actividades.filter(a => a.turno === turno);
                if (!steps.length) return null;
                const dt = turno === 'T+0' ? getDateForDay(activeDay) : getDateForDay(activeDay + 1);
                return (
                  <div key={turno}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em', padding: '10px 16px 6px 96px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {turno}
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#3B82F6', background: '#EFF6FF', padding: '2px 8px', borderRadius: 99 }}>{fmtDateLong(dt)}</span>
                    </div>
                    {steps.map((a, i) => {
                      const st = a.estado;
                      const isLate = isToday && st !== 'done' && nowMin > a.minStart + 30;
                      const isNow = isToday && st !== 'done' && nowMin >= a.minStart && nowMin <= a.minStart + 30;
                      const dotClass = st === 'done' ? 'done' : isNow ? 'active' : isLate ? 'late' : 'pending';
                      const sc = STATUS_CONFIG[dotClass] || STATUS_CONFIG.pending;
                      const ac2 = AREA_COLORS[a.area_key] || AREA_COLORS.SIREG;
                      const isLast = i === steps.length - 1;
                      return (
                        <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '64px 20px 1fr', gap: '0 12px', padding: '4px 16px 0' }}>
                          <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'right', paddingTop: 8 }}>{a.hora}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${sc.dot}`, background: st === 'done' ? sc.dot : isNow ? sc.dot : isLate ? '#FEF2F2' : '#F8FAFC', flexShrink: 0, marginTop: 7, boxShadow: isNow ? `0 0 0 3px ${sc.bg}` : 'none', transition: 'all .3s' }} />
                            {!isLast && <div style={{ width: 2, flex: 1, minHeight: 10, marginTop: 2, background: st === 'done' ? '#10B981' : isNow ? 'linear-gradient(#10B981,#3B82F6)' : isLate ? '#FECACA' : '#E2E8F0' }} />}
                          </div>
                          <div>
                            <div className="step-card" style={{ background: st === 'done' ? '#F0FDF4' : isNow ? '#EFF6FF' : isLate ? '#FEF2F2' : '#EEF2F7', border: `1px solid ${st === 'done' ? '#BBF7D0' : isNow ? '#93C5FD' : isLate ? '#FECACA' : '#CBD5E1'}`, borderRadius: 8, padding: '8px 12px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, opacity: st === 'done' ? .8 : 1, transition: 'all .2s' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: st === 'done' ? '#94A3B8' : '#1E293B', textDecoration: st === 'done' ? 'line-through' : 'none', lineHeight: 1.3 }}>{a.nombre}</div>
                                <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: ac2.bg, color: ac2.text, fontWeight: 500 }}>{a.area}</span>
                                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: sc.bg, color: sc.text, fontWeight: 500 }}>{sc.label}</span>
                                  <span style={{ fontSize: 10, color: '#94A3B8' }}>{a.responsable}</span>
                                </div>
                              </div>
                              <button onClick={() => updateEstado(a.id, st === 'done' ? 'pending' : 'done')} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, border: `1px solid ${st === 'done' ? '#94A3B8' : '#10B981'}`, background: 'transparent', color: st === 'done' ? '#64748B' : '#10B981', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{st === 'done' ? '↩' : '✓'}</button>
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

        {/* TAB: INDICADORES */}
        {tab === 'indicadores' && (() => {
          const d = WEEK_DATA[activeWeek];
          const semStatus = d.pct >= 90 ? { c: 'g', icon: '🟢', title: 'Proceso saludable', sub: `${d.pct}% de actividades completadas a tiempo` } : d.pct >= 75 ? { c: 'y', icon: '🟡', title: 'Proceso con alertas', sub: `${d.pct}% a tiempo — revisar retrasos` } : { c: 'r', icon: '🔴', title: 'Proceso crítico', sub: `Solo ${d.pct}% a tiempo — atención inmediata` };
          const semBg = d.pct >= 90 ? { bg: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', border: '#6EE7B7' } : d.pct >= 75 ? { bg: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', border: '#FCD34D' } : { bg: 'linear-gradient(135deg,#FEF2F2,#FEE2E2)', border: '#FCA5A5' };
          const maxDay = Math.max(...d.days, 1);
          return (
            <div>
              {/* Week selector */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Semana:</span>
                {[[-2, 'Hace 2 sem'], [-1, 'Semana pasada'], [0, 'Esta semana']].map(([w, label]) => (
                  <button key={w} onClick={() => setActiveWeek(w)} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 99, border: '1px solid #E2E8F0', background: activeWeek === w ? '#1E293B' : '#fff', color: activeWeek === w ? '#fff' : '#64748B', cursor: 'pointer', fontWeight: activeWeek === w ? 600 : 400 }}>{label}</button>
                ))}
              </div>

              {/* Semáforo */}
              <div style={{ borderRadius: 12, padding: '14px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, background: semBg.bg, border: `1px solid ${semBg.border}` }}>
                <div style={{ fontSize: 28 }}>{semStatus.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>{semStatus.title}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{semStatus.sub}</div>
                </div>
              </div>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'Retrasos', val: d.retrasos, color: d.retrasos <= 2 ? '#10B981' : d.retrasos <= 4 ? '#F59E0B' : '#EF4444', trend: d.trend, trendGood: !d.trend.startsWith('+') },
                  { label: 'A tiempo', val: `${d.pct}%`, color: d.pct >= 90 ? '#10B981' : d.pct >= 75 ? '#F59E0B' : '#EF4444', sub: 'SLA objetivo: 95%' },
                  { label: 'Alertas críticas', val: d.criticas, color: d.criticas === 0 ? '#10B981' : d.criticas <= 1 ? '#F59E0B' : '#EF4444', sub: 'Incidentes graves' },
                  { label: 'Días sin incidentes', val: d.diasOk, color: '#3B82F6', sub: 'de 5 días hábiles' },
                ].map((k, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.val}</div>
                    {k.trend && <div style={{ fontSize: 11, marginTop: 3, color: k.trendGood ? '#10B981' : '#EF4444' }}>{k.trendGood ? '↓' : '↑'} {k.trend.replace(/[+-]/, '')} vs sem. anterior</div>}
                    {k.sub && <div style={{ fontSize: 11, marginTop: 3, color: '#94A3B8' }}>{k.sub}</div>}
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 14, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 12 }}>Retrasos por día</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
                  {d.days.map((c, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                        <div style={{ width: '100%', borderRadius: '3px 3px 0 0', height: Math.max(4, c / maxDay * 70), background: c === 0 ? '#10B981' : c === 1 ? '#F59E0B' : '#EF4444', transition: 'height .5s' }} />
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#1E293B' }}>{c}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>{['Lun', 'Mar', 'Mié', 'Jue', 'Vie'][i]}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top actividades */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 14, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 10 }}>Actividades con más retrasos</div>
                {d.top.map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < d.top.length - 1 ? '1px solid #F8FAFC' : 'none', fontSize: 12 }}>
                    <span style={{ color: '#334155', flex: 1, marginRight: 8 }}>{t.n}</span>
                    <div style={{ flex: 1, height: 4, background: '#F1F5F9', borderRadius: 99, marginRight: 8 }}>
                      <div style={{ width: `${t.c / 4 * 100}%`, height: '100%', borderRadius: 99, background: t.cl === 'red' ? '#EF4444' : t.cl === 'yellow' ? '#F59E0B' : '#10B981' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: t.cl === 'red' ? '#FEE2E2' : t.cl === 'yellow' ? '#FEF3C7' : '#DCFCE7', color: t.cl === 'red' ? '#991B1B' : t.cl === 'yellow' ? '#92400E' : '#166534', whiteSpace: 'nowrap' }}>{t.c} retraso{t.c !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>

              {/* SLA por área */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 10 }}>Cumplimiento por área</div>
                {d.sla.map((s2, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#334155', width: 110, flexShrink: 0 }}>{s2.a}</span>
                    <div style={{ flex: 1, height: 5, background: '#F1F5F9', borderRadius: 99 }}>
                      <div style={{ width: `${s2.p}%`, height: '100%', borderRadius: 99, background: s2.p >= 90 ? '#10B981' : s2.p >= 75 ? '#F59E0B' : '#EF4444' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, width: 36, textAlign: 'right', color: s2.p >= 90 ? '#10B981' : s2.p >= 75 ? '#F59E0B' : '#EF4444' }}>{s2.p}%</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

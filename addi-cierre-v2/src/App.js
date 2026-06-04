import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

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
  blocked: { label: 'Bloqueado', bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
  pending: { label: 'Pendiente', bg: '#F8FAFC', text: '#64748B', dot: '#CBD5E1' },
};

export default function App() {
  const [actividades, setActividades] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filterArea, setFilterArea] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from('actividades').select('*').order('id');
    if (data) {
      setActividades(data);
      setLastUpdate(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('actividades-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'actividades' }, fetchData)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchData]);

  const updateEstado = async (id, estado) => {
    await supabase.from('actividades').update({ estado }).eq('id', id);
    setActividades(prev => prev.map(a => a.id === id ? { ...a, estado } : a));
    if (selected?.id === id) setSelected(prev => ({ ...prev, estado }));
  };

  const areas = ['Todos', 'OPS', 'CONTABILIDAD', 'DATA', 'RIESGOS', 'TESORERIA'];

  const visible = actividades.filter(a => {
    const aOk = filterArea === 'Todos' || a.area_key === filterArea;
    const sOk = filterStatus === 'Todos' || a.estado === filterStatus;
    return aOk && sOk;
  });

  const t0 = visible.filter(a => a.turno === 'T+0');
  const t1 = visible.filter(a => a.turno === 'T+1');

  const done = actividades.filter(a => a.estado === 'done').length;
  const active = actividades.filter(a => a.estado === 'active').length;
  const blocked = actividades.filter(a => a.estado === 'blocked').length;
  const pct = actividades.length ? Math.round(done / actividades.length * 100) : 0;

  const getPredecesor = (id) => actividades.filter(a => a.bloquea?.includes(id));
  const getBloquea = (a) => (a.bloquea || []).map(b => actividades.find(x => x.id === b)?.nombre).filter(Boolean);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8FAFC' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTop: '3px solid #3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#64748B', fontSize: 14 }}>Cargando dashboard...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .step-row:hover { background: #F8FAFC !important; }
        .step-row.sel { background: #EFF6FF !important; border-color: #BFDBFE !important; }
        select { appearance: none; cursor: pointer; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{ background: '#0F172A', borderBottom: '1px solid #1E293B', padding: '0 32px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 32, height: 32, background: '#3B82F6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>A</span>
            </div>
            <div>
              <div style={{ color: '#F1F5F9', fontSize: 15, fontWeight: 600 }}>ADDI CF — Monitor de Cierre</div>
              <div style={{ color: '#64748B', fontSize: 11 }}>Proceso diario regulatorio</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {lastUpdate && <span style={{ color: '#475569', fontSize: 12 }}>Actualizado {lastUpdate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>}
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
            <span style={{ color: '#10B981', fontSize: 12 }}>En vivo</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px', display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 24 }}>
        <div>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Avance total', val: `${pct}%`, color: pct >= 80 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444' },
              { label: 'Completadas', val: `${done} / ${actividades.length}`, color: '#10B981' },
              { label: 'En curso', val: active, color: active > 0 ? '#3B82F6' : '#64748B' },
              { label: 'Bloqueadas', val: blocked, color: blocked > 0 ? '#EF4444' : '#64748B' },
            ].map((k, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>Progreso del cierre</span>
              <span style={{ fontSize: 13, color: '#64748B' }}>{done} de {actividades.length} actividades</span>
            </div>
            <div style={{ height: 8, background: '#F1F5F9', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444', borderRadius: 99, transition: 'width .5s ease' }} />
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.dot }} />
                  <span style={{ fontSize: 12, color: '#64748B' }}>{v.label}: {actividades.filter(a => a.estado === k).length}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {areas.map(a => (
              <button key={a} onClick={() => setFilterArea(a)} style={{ fontSize: 12, padding: '5px 14px', borderRadius: 99, border: '1px solid', cursor: 'pointer', fontWeight: 500, borderColor: filterArea === a ? '#3B82F6' : '#E2E8F0', background: filterArea === a ? '#EFF6FF' : '#fff', color: filterArea === a ? '#1E40AF' : '#64748B', transition: 'all .15s' }}>{a}</button>
            ))}
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', color: '#1E293B', marginLeft: 'auto' }}>
              <option value="Todos">Todos los estados</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* Timeline T+0 */}
          <TimelineBlock title="T+0 — Cierre del día anterior" steps={t0} selected={selected} onSelect={setSelected} updateEstado={updateEstado} />
          <div style={{ marginTop: 20 }} />
          {/* Timeline T+1 */}
          <TimelineBlock title="T+1 — Proceso de cierre principal" steps={t1} selected={selected} onSelect={setSelected} updateEstado={updateEstado} />
        </div>

        {/* Detail panel */}
        {selected && (
          <DetailPanel
            act={selected}
            all={actividades}
            onClose={() => setSelected(null)}
            onUpdate={updateEstado}
            getPredecesor={getPredecesor}
            getBloquea={getBloquea}
          />
        )}
      </div>
    </div>
  );
}

function TimelineBlock({ title, steps, selected, onSelect, updateEstado }) {
  if (!steps.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{title}</span>
        <span style={{ marginLeft: 8, fontSize: 12, color: '#94A3B8' }}>{steps.length} actividades</span>
      </div>
      <div>
        {steps.map((a, i) => <StepRow key={a.id} act={a} isLast={i === steps.length - 1} isSelected={selected?.id === a.id} onSelect={onSelect} onUpdate={updateEstado} />)}
      </div>
    </div>
  );
}

function StepRow({ act, isLast, isSelected, onSelect, onUpdate }) {
  const sc = STATUS_CONFIG[act.estado] || STATUS_CONFIG.pending;
  const ac = AREA_COLORS[act.area_key] || AREA_COLORS.SIREG;
  return (
    <div className={`step-row${isSelected ? ' sel' : ''}`} onClick={() => onSelect(isSelected ? null : act)} style={{ display: 'grid', gridTemplateColumns: '80px 2px 1fr auto', gap: '0 16px', padding: '12px 20px', borderBottom: isLast ? 'none' : '1px solid #F8FAFC', cursor: 'pointer', transition: 'background .15s', border: isSelected ? '1px solid #BFDBFE' : '1px solid transparent', borderRadius: isSelected ? 8 : 0, margin: isSelected ? '2px 8px' : 0 }}>
      <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'right', paddingTop: 2, lineHeight: 1.4 }}>{act.hora}</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: sc.dot, flexShrink: 0, marginTop: 4, boxShadow: act.estado === 'active' ? `0 0 0 3px ${sc.bg}` : 'none' }} />
        {!isLast && <div style={{ width: 2, background: '#F1F5F9', flex: 1, minHeight: 24, marginTop: 2 }} />}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#1E293B', lineHeight: 1.4 }}>{act.nombre}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: ac.bg, color: ac.text, border: `1px solid ${ac.border}`, fontWeight: 500 }}>{act.area}</span>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>{act.responsable}</span>
        </div>
      </div>
      <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: sc.bg, color: sc.text, fontWeight: 500, whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>{sc.label}</div>
    </div>
  );
}

function DetailPanel({ act, all, onClose, onUpdate, getPredecesor, getBloquea }) {
  const sc = STATUS_CONFIG[act.estado] || STATUS_CONFIG.pending;
  const ac = AREA_COLORS[act.area_key] || AREA_COLORS.SIREG;
  const preds = getPredecesor(act.id);
  const bloqs = getBloquea(act);

  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 0, height: 'fit-content', position: 'sticky', top: 24, overflow: 'hidden' }}>
      <div style={{ background: '#0F172A', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, marginRight: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', lineHeight: 1.4 }}>{act.nombre}</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{act.hora} · {act.turno}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 2px' }}>×</button>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Estado selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Estado</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <button key={k} onClick={() => onUpdate(act.id, k)} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${act.estado === k ? v.dot : '#E2E8F0'}`, background: act.estado === k ? v.bg : '#fff', color: act.estado === k ? v.text : '#64748B', fontSize: 12, fontWeight: act.estado === k ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.dot, flexShrink: 0 }} />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
          {[
            { label: 'Área', val: <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: ac.bg, color: ac.text, border: `1px solid ${ac.border}`, fontWeight: 500 }}>{act.area}</span> },
            { label: 'Responsable', val: act.responsable },
            { label: 'Entregable', val: act.entregable },
            { label: 'Predecesoras', val: preds.length ? preds.map(p => p.nombre).join(' · ') : 'Ninguna' },
            { label: 'Desbloquea', val: bloqs.length ? bloqs.join(' · ') : 'Ninguna' },
            act.observacion && { label: 'Obs.', val: act.observacion, warn: true },
          ].filter(Boolean).map((row, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.label}</div>
              <div style={{ fontSize: 13, color: row.warn ? '#D97706' : '#1E293B', lineHeight: 1.5 }}>{row.val}</div>
            </div>
          ))}
        </div>

        {act.estado === 'blocked' && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 12px', marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#991B1B', marginBottom: 2 }}>⚠ Actividad bloqueada</div>
            <div style={{ fontSize: 12, color: '#DC2626' }}>Esta actividad está frenando {bloqs.length} actividad(es) dependiente(s).</div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import { getBostonHour, getBostonDate } from './lib/timeUtils'
import { getRandomPhoto } from './lib/photoUtils'
import ExerciseSet from './components/ExerciseSet'

// ─── Constants ───────────────────────────────────────────────────────────────

const _now = new Date()
const TODAY = getBostonDate()
const MONTH_START = new Date(_now.getFullYear(), _now.getMonth(), 1).toISOString().slice(0, 10)
const MONTH_END = new Date(_now.getFullYear(), _now.getMonth() + 1, 0).toISOString().slice(0, 10)
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getWeekDates() {
  const sun = new Date(_now)
  sun.setDate(_now.getDate() - _now.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sun)
    d.setDate(sun.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}
const WEEK = getWeekDates()

const C = {
  bg: '#FFFBEB', amber: '#F59E0B', amberDk: '#92400E',
  amberLt: '#FEF3C7', amberMd: '#FDE68A', green: '#10B981',
  red: '#FCA5A5', redText: '#B91C1C', gray: '#9CA3AF',
  grayLt: '#F3F4F6', white: '#FFFFFF', pt: '#7C3AED',
}

// ─── Progress Ring ────────────────────────────────────────────────────────────

function Ring({ pct, size = 88 }) {
  const sw = 8, r = (size - sw) / 2, circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(pct, 100) / 100)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.amberMd} strokeWidth={sw}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.amber} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transformOrigin:`${size/2}px ${size/2}px`, transform:'rotate(-90deg)' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka',sans-serif", fontWeight:600, fontSize:15, color:C.amberDk }}>
        {pct}%
      </div>
    </div>
  )
}

// ─── Hex ─────────────────────────────────────────────────────────────────────

function Hex({ date, status, onTap }) {
  const fills    = { done:'#A7F3D0', partial:'#FDE68A', missed:'#FEE2E2', future:C.grayLt, empty:C.white }
  const textFill = { done:'#065F46', partial:'#92400E', missed:C.redText, future:C.gray,   empty:C.gray }
  const isToday = date === TODAY
  const tappable = onTap && date < TODAY
  const d = new Date(date + 'T12:00:00')
  return (
    <svg width={30} height={34} viewBox="0 0 34 38"
      onClick={tappable ? () => onTap(date) : undefined}
      style={{ cursor: tappable ? 'pointer' : 'default' }}>
      <polygon points="17,1 33,10 33,28 17,37 1,28 1,10"
        fill={isToday ? C.white : (fills[status] ?? C.white)}
        stroke={isToday ? C.amber : 'none'} strokeWidth={isToday ? 2.5 : 0}/>
      <text x={17} y={23} textAnchor="middle" fontSize={isToday ? 12 : 11}
        fontWeight={isToday ? 'bold' : 'normal'} fill={isToday ? C.amber : (textFill[status] ?? C.gray)}
        fontFamily="Fredoka,sans-serif">
        {d.getDate()}
      </text>
    </svg>
  )
}

// ─── Month Calendar ───────────────────────────────────────────────────────────

function MonthCalendar({ dayStatus, onDayTap }) {
  const year = _now.getFullYear(), month = _now.getMonth()
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = _now.toLocaleString('default', { month:'long', year:'numeric' })
  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      `${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`
    ),
  ]
  return (
    <div style={{ background:C.white, borderRadius:16, padding:'12px 10px 10px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:15, color:C.amberDk, textAlign:'center', marginBottom:6 }}>{monthName}</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:2 }}>
        {DAY_LETTERS.map((l,i) => <div key={i} style={{ textAlign:'center', fontSize:9, fontWeight:700, color:C.gray }}>{l}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', justifyItems:'center', rowGap:2 }}>
        {cells.map((date,i) => date
          ? <Hex key={i} date={date} status={dayStatus(date)} onTap={onDayTap}/>
          : <div key={i} style={{ width:30, height:34 }}/>
        )}
      </div>
    </div>
  )
}

// ─── Day Review Modal ─────────────────────────────────────────────────────────

function DayReviewModal({ date, exercises, tracking, onClose }) {
  const dayT = tracking[date] ?? {}
  const unlocked = exercises.filter(e => e.unlocked)
  const label = new Date(date + 'T12:00:00').toLocaleDateString('default', { weekday:'long', month:'long', day:'numeric' })
  const totalSets = unlocked.reduce((s,e) => s + e.sets, 0)
  const doneSets  = unlocked.reduce((s,e) => s + (dayT[e.id]??[]).filter(Boolean).length, 0)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:100, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:C.white, borderRadius:'20px 20px 0 0', width:'100%', maxWidth:430, padding:'16px 20px 36px', maxHeight:'80vh', overflowY:'auto' }}>
        <div style={{ width:36, height:4, background:'#E5E7EB', borderRadius:2, margin:'0 auto 14px' }}/>
        <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:20, color:C.amberDk, marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:13, color:C.gray, marginBottom:16 }}>{doneSets} of {totalSets} sets completed</div>

        {unlocked.length === 0 && (
          <p style={{ fontSize:14, color:C.gray, textAlign:'center' }}>No exercises were unlocked on this day.</p>
        )}

        {unlocked.map(ex => {
          const sets = dayT[ex.id] ?? []
          const doneCount = sets.filter(Boolean).length
          const allDone = doneCount >= ex.sets
          return (
            <div key={ex.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid '+C.grayLt }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:C.amberDk }}>{ex.name}</div>
                <div style={{ fontSize:12, color:C.gray, marginTop:2 }}>{ex.sets} sets × {ex.reps} reps</div>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {Array.from({ length: ex.sets }, (_, i) => (
                  <div key={i} style={{ width:20, height:20, borderRadius:'50%', background: sets[i] ? C.green : C.grayLt, border:'2px solid '+(sets[i] ? C.green : '#E5E7EB') }}/>
                ))}
              </div>
            </div>
          )
        })}

        <button onClick={onClose} style={{ width:'100%', padding:'12px', background:C.grayLt, color:C.gray, borderRadius:12, fontWeight:600, fontSize:14, fontFamily:'inherit', marginTop:16 }}>Close</button>
      </div>
    </div>
  )
}

// ─── Garden Section (V2 — photo bg + flower sprites) ─────────────────────────

function seededRand(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function GardenSection({ exercises, tracking }) {
  const [flowerCount, setFlowerCount] = useState(0)

  useEffect(() => {
    const today = tracking[getBostonDate()] ?? {}
    let total = 0
    exercises.forEach(ex => {
      const setsDone = (today[ex.id] ?? []).filter(Boolean).length
      total += setsDone * (ex.reps || 0)
    })
    // Limit to 300 flowers for visual performance
    setFlowerCount(Math.min(today ? total : 0, 300))
  }, [exercises, tracking])

  const flowers = Array.from({ length: flowerCount }, (_, i) => ({
    x: seededRand(i * 3 + 1) * 92 + 4,
    y: seededRand(i * 3 + 2) * 32 + 56,
    rot: (seededRand(i * 3 + 3) - 0.5) * 20,
  }))

  return (
    <div style={{ background:C.white, borderRadius:16, overflow:'hidden', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ padding:'12px 14px 8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:16, color:C.amberDk }}>My Garden</span>
        <span style={{ fontSize:12, color:C.gray }}>{flowerCount} flowers</span>
      </div>
      <div style={{ padding:'0 8px 8px' }}>
        <div style={{ position:'relative', borderRadius:10, overflow:'hidden', border:'1px solid '+C.amberMd }}>
          <img src={`${import.meta.env.BASE_URL}garden-bg.jpg`} style={{ width:'100%', display:'block' }} alt="garden"/>
          {flowers.map((f, i) => (
            <img key={i} src={`${import.meta.env.BASE_URL}flower-single.png`}
              style={{ position:'absolute', left:`${f.x}%`, top:`${f.y}%`, width:16, height:'auto',
                transform:`translateX(-50%) rotate(${f.rot}deg)`, pointerEvents:'none' }}
              alt=""/>
          ))}
        </div>
      </div>
    </div>
  )
}


// ─── Exercise Modal ───────────────────────────────────────────────────────────

function ExerciseModal({ ex, mode, todayTracking, toggleSet, saveExercise, onClose }) {
  const [editSets, setEditSets] = useState(ex.sets)
  const [editReps, setEditReps] = useState(ex.reps)
  const [editNotes, setEditNotes] = useState(ex.notes || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const sets = todayTracking[ex.id] || []

  async function handleSave() {
    setSaving(true)
    await saveExercise(ex.id, { sets:editSets, reps:editReps, notes:editNotes })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:100, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:C.white, borderRadius:'20px 20px 0 0', width:'100%', maxWidth:430, padding:'16px 20px 36px', maxHeight:'88vh', overflowY:'auto' }}>
        <div style={{ width:36, height:4, background:'#E5E7EB', borderRadius:2, margin:'0 auto 16px' }}/>
        <h2 style={{ fontFamily:"'Fredoka',sans-serif", fontSize:22, color:C.amberDk, marginBottom:16 }}>{ex.name}</h2>
        {ex.video_url ? (
          <div style={{ borderRadius:12, overflow:'hidden', marginBottom:16, aspectRatio:'16/9', background:'#000' }}>
            <iframe
              src={`https://www.youtube.com/embed/${new URL(ex.video_url).searchParams.get('v')}`}
              style={{ width:'100%', height:'100%', border:'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div style={{ background:C.grayLt, borderRadius:12, height:130, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, flexDirection:'column', gap:6 }}>
            <span style={{ fontSize:32 }}>🎬</span>
            <span style={{ fontSize:13, color:C.gray }}>Video coming soon</span>
          </div>
        )}
        {mode==='pt' ? (
          <div style={{ display:'flex', gap:12, marginBottom:16 }}>
            {[{label:'Sets',val:editSets,set:setEditSets,max:10},{label:'Reps',val:editReps,set:setEditReps,max:50}].map(({label,val,set,max}) => (
              <label key={label} style={{ flex:1, display:'flex', flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:11, fontWeight:700, color:C.gray, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</span>
                <input type="number" min={1} max={max} value={val} onChange={e=>set(Math.max(1,parseInt(e.target.value)||1))}
                  style={{ border:'2px solid '+C.pt, borderRadius:8, padding:'8px 12px', fontSize:20, fontWeight:700, color:C.amberDk, textAlign:'center', fontFamily:'inherit', outline:'none', width:'100%' }}/>
              </label>
            ))}
          </div>
        ) : (
          <div style={{ display:'flex', gap:12, marginBottom:16 }}>
            {[{label:'Sets',val:ex.sets},{label:'Reps',val:ex.reps}].map(({label,val}) => (
              <div key={label} style={{ flex:1, background:C.amberLt, borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
                <div style={{ fontSize:26, fontWeight:700, color:C.amberDk, fontFamily:"'Fredoka',sans-serif" }}>{val}</div>
                <div style={{ fontSize:12, color:C.amber, fontWeight:600 }}>{label}</div>
              </div>
            ))}
          </div>
        )}
        {mode==='pt' ? (
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, fontWeight:700, color:C.gray, textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:6 }}>PT Notes</label>
            <textarea value={editNotes} onChange={e=>setEditNotes(e.target.value)} rows={3} placeholder="Instructions, tips, cautions…"
              style={{ width:'100%', border:'2px solid '+C.pt, borderRadius:10, padding:'10px 12px', fontSize:14, fontFamily:'inherit', resize:'none', outline:'none', color:C.amberDk }}/>
          </div>
        ) : ex.notes ? (
          <div style={{ background:C.amberLt, borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.amber, marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>📋 PT Notes</div>
            <p style={{ fontSize:13, color:C.amberDk, lineHeight:1.6 }}>{ex.notes}</p>
          </div>
        ) : null}
        {mode==='pt' && (
          <button onClick={handleSave} disabled={saving}
            style={{ width:'100%', padding:'13px', background:saved?C.green:C.pt, color:C.white, borderRadius:12, fontWeight:700, fontSize:15, marginBottom:16, opacity:saving?0.7:1, fontFamily:'inherit', transition:'background 0.2s' }}>
            {saving?'Saving…':saved?'✓ Saved!':'Save Changes'}
          </button>
        )}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.amberDk, marginBottom:10 }}>Today's Sets</div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {Array.from({length:ex.sets},(_,i) => (
              <button key={i} onClick={()=>toggleSet(ex.id,i)}
                style={{ padding:'10px 16px', borderRadius:12, background:sets[i]?C.amber:C.amberLt, color:sets[i]?C.white:C.amberDk, fontWeight:700, fontSize:14, boxShadow:sets[i]?'0 3px 8px rgba(245,158,11,0.4)':'none', transition:'all 0.15s', fontFamily:'inherit' }}>
                {sets[i]?'✓ ':''}Set {i+1}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose} style={{ width:'100%', padding:'12px', background:C.grayLt, color:C.gray, borderRadius:12, fontWeight:600, fontSize:14, fontFamily:'inherit' }}>Close</button>
      </div>
    </div>
  )
}

// ─── Exercise SVG Illustrations ───────────────────────────────────────────────

function ExerciseSVG({ name, color = C.amberDk }) {
  const p = { stroke:color, fill:'none', strokeLinecap:'round', strokeLinejoin:'round', strokeWidth:2.5 }
  const arr = { ...p, strokeWidth:1.8, opacity:0.55 }
  const gnd = { ...p, strokeWidth:1.2, opacity:0.3, strokeDasharray:'4,3' }

  const scenes = {
    'Straight Leg Raise': <>
      <line x1={2} y1={76} x2={98} y2={76} {...gnd}/>
      <circle cx={12} cy={62} r={7} {...p}/>
      <line x1={19} y1={66} x2={48} y2={66} {...p}/>
      <line x1={30} y1={68} x2={44} y2={74} {...p}/>
      <line x1={48} y1={66} x2={88} y2={66} {...p}/>
      <line x1={88} y1={66} x2={88} y2={76} {...p}/>
      <line x1={48} y1={66} x2={78} y2={40} {...p}/>
      <line x1={78} y1={40} x2={84} y2={44} {...p}/>
      <line x1={86} y1={46} x2={86} y2={32} {...arr}/>
      <polyline points="82,36 86,32 90,36" {...arr}/>
    </>,
    'Heel Slides': <>
      <line x1={2} y1={76} x2={98} y2={76} {...gnd}/>
      <circle cx={12} cy={62} r={7} {...p}/>
      <line x1={19} y1={66} x2={48} y2={66} {...p}/>
      <line x1={30} y1={68} x2={44} y2={74} {...p}/>
      <line x1={48} y1={66} x2={88} y2={66} {...p}/>
      <line x1={88} y1={66} x2={88} y2={76} {...p}/>
      <line x1={48} y1={66} x2={68} y2={50} {...p}/>
      <line x1={68} y1={50} x2={56} y2={68} {...p}/>
      <line x1={56} y1={68} x2={50} y2={76} {...p}/>
      <line x1={54} y1={74} x2={44} y2={74} {...arr}/>
      <polyline points="48,71 44,74 48,77" {...arr}/>
    </>,
    'TKE': <>
      <line x1={10} y1={92} x2={90} y2={92} {...gnd}/>
      <circle cx={50} cy={14} r={7} {...p}/>
      <line x1={50} y1={21} x2={50} y2={52} {...p}/>
      <line x1={50} y1={32} x2={36} y2={46} {...p}/>
      <line x1={50} y1={32} x2={64} y2={46} {...p}/>
      <line x1={50} y1={52} x2={42} y2={74} {...p}/>
      <line x1={42} y1={74} x2={40} y2={92} {...p}/>
      <line x1={50} y1={52} x2={58} y2={70} {...p}/>
      <line x1={58} y1={70} x2={62} y2={92} {...p}/>
      <path d="M 30,72 Q 50,64 58,70" {...arr} strokeDasharray="3,2"/>
      <line x1={68} y1={76} x2={75} y2={88} {...arr}/>
      <polyline points="72,88 75,88 75,84" {...arr}/>
    </>,
    'Glute Bridges': <>
      <line x1={2} y1={86} x2={98} y2={86} {...gnd}/>
      <circle cx={10} cy={72} r={7} {...p}/>
      <line x1={17} y1={76} x2={34} y2={76} {...p}/>
      <line x1={24} y1={78} x2={30} y2={86} {...p}/>
      <line x1={34} y1={76} x2={52} y2={54} {...p}/>
      <line x1={52} y1={54} x2={70} y2={74} {...p}/>
      <line x1={70} y1={74} x2={70} y2={86} {...p}/>
      <line x1={52} y1={54} x2={76} y2={74} {...p}/>
      <line x1={76} y1={74} x2={76} y2={86} {...p}/>
      <line x1={88} y1={66} x2={88} y2={50} {...arr}/>
      <polyline points="84,54 88,50 92,54" {...arr}/>
    </>,
    'Clam Shells': <>
      <line x1={2} y1={86} x2={98} y2={86} {...gnd}/>
      <circle cx={14} cy={54} r={7} {...p}/>
      <line x1={20} y1={58} x2={50} y2={72} {...p}/>
      <line x1={28} y1={54} x2={40} y2={54} {...p}/>
      <line x1={50} y1={72} x2={76} y2={74} {...p}/>
      <line x1={76} y1={74} x2={84} y2={84} {...p}/>
      <line x1={50} y1={72} x2={70} y2={52} {...p}/>
      <line x1={70} y1={52} x2={82} y2={62} {...p}/>
      <line x1={62} y1={56} x2={56} y2={48} {...arr}/>
      <polyline points="53,51 56,48 59,51" {...arr}/>
    </>,
    'Calf Raises': <>
      <line x1={20} y1={92} x2={80} y2={92} {...gnd}/>
      <circle cx={50} cy={12} r={7} {...p}/>
      <line x1={50} y1={19} x2={50} y2={50} {...p}/>
      <line x1={50} y1={30} x2={38} y2={44} {...p}/>
      <line x1={50} y1={30} x2={62} y2={44} {...p}/>
      <line x1={50} y1={50} x2={42} y2={72} {...p}/>
      <line x1={42} y1={72} x2={40} y2={88} {...p}/>
      <line x1={40} y1={88} x2={35} y2={92} {...p}/>
      <line x1={50} y1={50} x2={58} y2={72} {...p}/>
      <line x1={58} y1={72} x2={60} y2={88} {...p}/>
      <line x1={60} y1={88} x2={65} y2={92} {...p}/>
      <line x1={80} y1={52} x2={80} y2={36} {...arr}/>
      <polyline points="76,40 80,36 84,40" {...arr}/>
    </>,
    'Calf Stretch': <>
      <line x1={5} y1={92} x2={88} y2={92} {...gnd}/>
      <line x1={86} y1={18} x2={86} y2={92} {...p} strokeWidth={1.8} opacity={0.35}/>
      <circle cx={40} cy={20} r={7} {...p}/>
      <line x1={42} y1={27} x2={46} y2={52} {...p}/>
      <line x1={44} y1={36} x2={65} y2={30} {...p}/>
      <line x1={65} y1={30} x2={86} y2={28} {...p}/>
      <line x1={44} y1={36} x2={64} y2={38} {...p}/>
      <line x1={64} y1={38} x2={86} y2={38} {...p}/>
      <line x1={46} y1={52} x2={54} y2={70} {...p}/>
      <line x1={54} y1={70} x2={52} y2={92} {...p}/>
      <line x1={46} y1={52} x2={34} y2={72} {...p}/>
      <line x1={34} y1={72} x2={28} y2={92} {...p}/>
    </>,
    'Side to Side Squat': <>
      <line x1={4} y1={92} x2={96} y2={92} {...gnd}/>
      <circle cx={50} cy={26} r={7} {...p}/>
      <line x1={50} y1={33} x2={50} y2={56} {...p}/>
      <line x1={50} y1={42} x2={36} y2={52} {...p}/>
      <line x1={50} y1={42} x2={64} y2={52} {...p}/>
      <line x1={50} y1={56} x2={34} y2={72} {...p}/>
      <line x1={34} y1={72} x2={28} y2={92} {...p}/>
      <line x1={50} y1={56} x2={66} y2={72} {...p}/>
      <line x1={66} y1={72} x2={72} y2={92} {...p}/>
      <line x1={10} y1={64} x2={20} y2={64} {...arr}/>
      <polyline points="13,61 10,64 13,67" {...arr}/>
      <line x1={90} y1={64} x2={80} y2={64} {...arr}/>
      <polyline points="87,61 90,64 87,67" {...arr}/>
    </>,
    'Mini Squats': <>
      <line x1={20} y1={92} x2={80} y2={92} {...gnd}/>
      <circle cx={50} cy={18} r={7} {...p}/>
      <line x1={50} y1={25} x2={50} y2={52} {...p}/>
      <line x1={50} y1={36} x2={37} y2={46} {...p}/>
      <line x1={50} y1={36} x2={63} y2={46} {...p}/>
      <line x1={50} y1={52} x2={42} y2={68} {...p}/>
      <line x1={42} y1={68} x2={40} y2={92} {...p}/>
      <line x1={50} y1={52} x2={58} y2={68} {...p}/>
      <line x1={58} y1={68} x2={60} y2={92} {...p}/>
      <line x1={82} y1={40} x2={82} y2={56} {...arr}/>
      <polyline points="78,52 82,56 86,52" {...arr}/>
    </>,
  }

  return (
    <svg viewBox="0 0 100 100" style={{ width:'100%', height:'auto', display:'block' }}>
      {scenes[name] ?? null}
    </svg>
  )
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

function ExerciseCard({ ex, mode, onTap }) {
  const iconColor = ex.unlocked ? C.amberDk : C.gray
  return (
    <div onClick={onTap} style={{ background:ex.unlocked?C.white:C.grayLt, borderRadius:14, padding:'12px 10px 10px', textAlign:'center', cursor:'pointer', border:ex.unlocked?'2px solid '+C.amberMd:mode==='pt'?'2px dashed '+C.pt:'2px solid transparent', boxShadow:ex.unlocked?'0 1px 4px rgba(0,0,0,0.07)':'none', opacity:ex.unlocked?1:0.65, transition:'all 0.2s', userSelect:'none' }}>
      <div style={{ background:ex.unlocked?C.amberLt:C.grayLt, borderRadius:10, padding:'8px 6px', marginBottom:8 }}>
        <ExerciseSVG name={ex.name} color={iconColor}/>
      </div>
      <div style={{ fontWeight:700, fontSize:12, color:ex.unlocked?C.amberDk:C.gray, lineHeight:1.2 }}>{ex.name}</div>
      <div style={{ marginTop:4, fontSize:11, fontWeight:700, color:ex.unlocked?C.amber:C.gray }}>
        {ex.unlocked?`${ex.sets} × ${ex.reps}`:mode==='pt'?'Tap to unlock':'Locked'}
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState('home')
  const [mode, setMode] = useState('mom')
  const [selectedDay, setSelectedDay] = useState(null)
  const [exercises, setExercises] = useState([])
  const [tracking, setTracking] = useState({})
  const [completedSets, setCompletedSets] = useState(() => {
    const saved = localStorage.getItem('beesknees_completed_sets');
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('beesknees_sets_date');
    if (saved && savedDate === today) return JSON.parse(saved);
    return {};
  });
  const [equipment, setEquipment] = useState([])
  const [myEq, setMyEq] = useState(new Set())
  const [modal, setModal] = useState(null)
  
  useEffect(() => {
    localStorage.setItem('beesknees_completed_sets', JSON.stringify(completedSets));
    localStorage.setItem('beesknees_sets_date', new Date().toDateString());
  }, [completedSets]);

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const holdRef = useRef(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true); setError(null)
    const [exR, logR, eqR, myEqR] = await Promise.all([
      supabase.from('exercises').select('*').order('sort_order'),
      supabase.from('set_logs').select('*').gte('date', MONTH_START).lte('date', MONTH_END),
      supabase.from('equipment').select('*').order('sort_order'),
      supabase.from('user_equipment').select('equipment_id'),
    ])
    if (exR.error) { setError(exR.error.message); setLoading(false); return }
    setExercises(exR.data ?? [])
    if (logR.data) {
      const t = {}
      for (const r of logR.data) {
        if (!t[r.date]) t[r.date] = {}
        if (!t[r.date][r.exercise_id]) t[r.date][r.exercise_id] = []
        t[r.date][r.exercise_id][r.set_index] = true
      }
      setTracking(t)
    }
    setEquipment(eqR.data ?? [])
    setMyEq(new Set((myEqR.data ?? []).map(r => r.equipment_id)))
    setLoading(false)
  }

  function titleHoldStart(e) { e.preventDefault(); holdRef.current = setTimeout(() => setMode(m => m==='pt'?'mom':'pt'), 700) }
  function titleHoldEnd() { clearTimeout(holdRef.current) }

  async function handleBatchComplete(setKey, notes) {
    const setIdx = setKey === 'morning' ? 0 : setKey === 'afternoon' ? 1 : 2
    const toComplete = exercises.filter(e => e.unlocked && e.sets > setIdx)
    
    const inserts = []
    toComplete.forEach(ex => {
      inserts.push({ exercise_id: ex.id, date: TODAY, set_index: setIdx })
    })

    if (inserts.length > 0) {
      await supabase.from('set_logs').upsert(inserts, { onConflict: 'exercise_id,date,set_index' })
    }

    setCompletedSets(prev => ({
      ...prev,
      [setKey]: { completed: true, notes, timestamp: new Date().toISOString() }
    }))

    setTracking(prev => {
      const next = { ...prev, [TODAY]: { ...(prev[TODAY]??{}) } }
      toComplete.forEach(ex => {
        if (!next[TODAY][ex.id]) next[TODAY][ex.id] = []
        next[TODAY][ex.id][setIdx] = true
      })
      return next
    })
  }

  async function handleBatchUndo(setKey) {
    const setIdx = setKey === 'morning' ? 0 : setKey === 'afternoon' ? 1 : 2
    const toUndo = exercises.filter(e => e.unlocked)
    const exerciseIds = toUndo.map(e => e.id)
    
    if (exerciseIds.length > 0) {
      await supabase.from('set_logs')
        .delete()
        .eq('date', TODAY)
        .eq('set_index', setIdx)
        .in('exercise_id', exerciseIds)
    }

    setCompletedSets(prev => {
      const next = { ...prev }
      if (next[setKey]) {
        next[setKey] = { ...next[setKey], completed: false }
      }
      return next
    })

    setTracking(prev => {
      const next = { ...prev, [TODAY]: { ...(prev[TODAY]??{}) } }
      toUndo.forEach(ex => {
        if (next[TODAY][ex.id]) {
          const arr = [...next[TODAY][ex.id]]
          arr[setIdx] = false
          next[TODAY][ex.id] = arr
        }
      })
      return next
    })
  }

  async function toggleSet(exId, setIdx) {
    const isDone = !!(tracking[TODAY]?.[exId]?.[setIdx])
    if (isDone) {
      await supabase.from('set_logs').delete().eq('exercise_id',exId).eq('date',TODAY).eq('set_index',setIdx)
    } else {
      await supabase.from('set_logs').insert({ exercise_id:exId, date:TODAY, set_index:setIdx })
    }
    setTracking(prev => {
      const next = { ...prev, [TODAY]: { ...(prev[TODAY]??{}) } }
      const arr = [...(next[TODAY][exId]??[])]
      arr[setIdx] = !isDone
      next[TODAY][exId] = arr
      return next
    })
  }

  async function toggleEq(eqId) {
    if (myEq.has(eqId)) {
      await supabase.from('user_equipment').delete().eq('equipment_id',eqId)
      setMyEq(prev => { const s=new Set(prev); s.delete(eqId); return s })
    } else {
      await supabase.from('user_equipment').insert({ equipment_id:eqId })
      setMyEq(prev => new Set([...prev,eqId]))
    }
  }

  async function saveExercise(id, fields) {
    const { data } = await supabase.from('exercises').update(fields).eq('id',id).select().single()
    if (data) {
      setExercises(prev => prev.map(e => e.id===id?data:e))
      if (modal?.id===id) setModal(data)
    }
  }

  function dayStatus(date) {
    if (date > TODAY) return 'future'
    const ul = exercises.filter(e => e.unlocked)
    if (!ul.length) return 'empty'
    const dayT = tracking[date] ?? {}
    let total=0, done=0
    for (const ex of ul) { total+=ex.sets; done+=(dayT[ex.id]??[]).filter(Boolean).length }
    if (!total) return 'empty'
    if (!done) return date===TODAY?'empty':'missed'
    return done>=total?'done':'partial'
  }

  const unlocked = exercises.filter(e => e.unlocked)
  const todayTracking = tracking[TODAY] ?? {}
  const totalSets = unlocked.reduce((s,e)=>s+e.sets,0)
  const doneSets = unlocked.reduce((s,e)=>s+(todayTracking[e.id]??[]).filter(Boolean).length,0)
  const pct = totalSets>0 ? Math.round(doneSets/totalSets*100) : 0
  const motivation = pct===100?'You crushed it today, Mom! 🌟':pct>=75?'Almost there, Mom — keep buzzing! 🐝':pct>=50?"Halfway there, Mom! You're a star 💛":pct>=25?'Great start, Mom! Keep going! 🌸':doneSets>0?'Every rep counts, Mom! 🍯':"Ready to buzz, Mom? Let's go! 🐝"

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg, fontSize:56 }}>🐝</div>
  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:C.bg, padding:24, gap:16 }}>
      <div style={{ fontSize:40 }}>🐝</div>
      <p style={{ fontFamily:"'Fredoka',sans-serif", fontSize:18, color:C.amberDk, textAlign:'center' }}>Couldn't reach the hive 😕</p>
      <p style={{ fontSize:13, color:C.gray, textAlign:'center' }}>{error}</p>
      <button onClick={loadAll} style={{ background:C.amber, color:C.white, border:'none', borderRadius:10, padding:'10px 24px', fontWeight:700, fontSize:14, fontFamily:'inherit', cursor:'pointer' }}>Try Again</button>
    </div>
  )

  return (
    <div style={{ fontFamily:"'Quicksand',sans-serif", background:C.bg, minHeight:'100vh', maxWidth:430, margin:'0 auto', paddingBottom:80 }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        button { cursor:pointer; border:none; background:none; font-family:inherit; }
        input, textarea { font-family:inherit; }
      `}</style>

      {mode==='pt' && (
        <div style={{ background:C.pt, color:C.white, padding:'8px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, fontWeight:700 }}>
          <span>🔧 PT Mode — tap exercise cards to lock/unlock</span>
          <button onClick={()=>setMode('mom')} style={{ color:C.white, fontSize:12, fontWeight:600, opacity:0.85, fontFamily:'inherit' }}>Exit ✕</button>
        </div>
      )}

      {/* ── HOME ── */}
      {view==='home' && (
        <div style={{ padding:'16px 16px 0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ flex:1 }}>
              <h1 style={{ fontFamily:"'Fredoka',sans-serif", fontSize:26, color:C.amberDk, lineHeight:1.1, userSelect:'none', cursor:'default' }}
                onMouseDown={titleHoldStart} onMouseUp={titleHoldEnd} onMouseLeave={titleHoldEnd}
                onTouchStart={titleHoldStart} onTouchEnd={titleHoldEnd} onTouchCancel={titleHoldEnd}>
                Back in BeesKnees 🐝
              </h1>
              <p style={{ fontSize:13, color:'#78350F', marginTop:3 }}>{motivation}</p>
            </div>
            <Ring pct={pct}/>
          </div>

          <MonthCalendar dayStatus={dayStatus} onDayTap={setSelectedDay}/>
          <GardenSection exercises={exercises} tracking={tracking}/>

          <h2 style={{ fontFamily:"'Fredoka',sans-serif", fontSize:18, color:C.amberDk, marginBottom:10 }}>Today's Exercises</h2>
          {unlocked.length===0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:C.gray }}>
              <div style={{ fontSize:44, marginBottom:12 }}>🌱</div>
              <p style={{ fontSize:14, lineHeight:1.6 }}>No exercises unlocked yet.<br/>Your PT will set these up!</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <ExerciseSet 
                setKey="morning"
                exercises={unlocked}
                isCompleted={!!completedSets.morning?.completed}
                notes={completedSets.morning?.notes}
                onComplete={handleBatchComplete}
                onUndo={handleBatchUndo}
                photoUrl={`/back-in-beesknees/${getRandomPhoto('morning' + TODAY)}?v=${Date.now()}`}
              />
              <ExerciseSet 
                setKey="afternoon"
                exercises={unlocked}
                isCompleted={!!completedSets.afternoon?.completed}
                notes={completedSets.afternoon?.notes}
                onComplete={handleBatchComplete}
                onUndo={handleBatchUndo}
                photoUrl={`/back-in-beesknees/${getRandomPhoto('afternoon' + TODAY)}?v=${Date.now()}`}
              />
              <ExerciseSet 
                setKey="evening"
                exercises={unlocked}
                isCompleted={!!completedSets.evening?.completed}
                notes={completedSets.evening?.notes}
                onComplete={handleBatchComplete}
                onUndo={handleBatchUndo}
                photoUrl={`/back-in-beesknees/${getRandomPhoto('evening' + TODAY)}?v=${Date.now()}`}
              />
            </div>
          )}
        </div>
      )}

      {/* ── EXERCISES TAB ── */}
      {view==='garden' && (
        <div style={{ padding:'16px 16px 0' }}>
          <h1 style={{ fontFamily:"'Fredoka',sans-serif", fontSize:24, color:C.amberDk, marginBottom:2, userSelect:'none', cursor:'default' }}
            onMouseDown={titleHoldStart} onMouseUp={titleHoldEnd} onMouseLeave={titleHoldEnd}
            onTouchStart={titleHoldStart} onTouchEnd={titleHoldEnd} onTouchCancel={titleHoldEnd}>
            Exercises
          </h1>
          <p style={{ fontSize:13, color:C.gray, marginBottom:16 }}>
            {mode==='pt'?'Tap a card to lock or unlock it':`${unlocked.length} of ${exercises.length} unlocked`}
          </p>
          {[...new Set(exercises.map(e=>e.category))].map(cat => (
            <div key={cat} style={{ marginBottom:20 }}>
              <h3 style={{ fontFamily:"'Fredoka',sans-serif", fontSize:13, color:C.amber, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{cat}</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {exercises.filter(e=>e.category===cat).map(ex => (
                  <ExerciseCard key={ex.id} ex={ex} mode={mode}
                    onTap={()=>mode==='pt'?saveExercise(ex.id,{unlocked:!ex.unlocked}):setModal(ex)}/>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── EQUIPMENT ── */}
      {view==='equipment' && (
        <div style={{ padding:'16px 16px 0' }}>
          <h1 style={{ fontFamily:"'Fredoka',sans-serif", fontSize:24, color:C.amberDk, marginBottom:2, userSelect:'none', cursor:'default' }}
            onMouseDown={titleHoldStart} onMouseUp={titleHoldEnd} onMouseLeave={titleHoldEnd}
            onTouchStart={titleHoldStart} onTouchEnd={titleHoldEnd} onTouchCancel={titleHoldEnd}>
            My Equipment 🎒
          </h1>
          <p style={{ fontSize:13, color:C.gray, marginBottom:16 }}>Check off what you have at home</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {equipment.map(eq => {
              const has=myEq.has(eq.id)
              return (
                <div key={eq.id} onClick={()=>toggleEq(eq.id)}
                  style={{ background:has?C.amberLt:C.white, borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer', border:has?'2px solid '+C.amberMd:'2px solid '+C.grayLt, boxShadow:'0 1px 3px rgba(0,0,0,0.05)', transition:'all 0.15s' }}>
                  <div style={{ width:24, height:24, borderRadius:6, flexShrink:0, background:has?C.amber:C.white, border:'2px solid '+(has?C.amber:C.gray), display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                    {has && <span style={{ color:C.white, fontSize:14, fontWeight:700 }}>✓</span>}
                  </div>
                  <span style={{ fontWeight:600, fontSize:15, color:C.amberDk }}>{eq.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {modal && <ExerciseModal ex={modal} mode={mode} todayTracking={todayTracking} toggleSet={toggleSet} saveExercise={saveExercise} onClose={()=>setModal(null)}/>}
      {selectedDay && <DayReviewModal date={selectedDay} exercises={exercises} tracking={tracking} onClose={()=>setSelectedDay(null)}/>}

      <nav style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, background:C.white, borderTop:'1px solid '+C.amberMd, display:'flex', padding:'8px 0 14px', zIndex:50 }}>
        {[{id:'home',icon:'🐝',label:'Today'},{id:'garden',icon:'💪🏽',label:'All Exercises'},{id:'equipment',icon:'🎒',label:'Equipment'}].map(({id,icon,label}) => (
          <button key={id} onClick={()=>setView(id)}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, color:view===id?C.amber:C.gray, fontSize:10, fontWeight:700 }}>
            <span style={{ fontSize:22 }}>{icon}</span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}

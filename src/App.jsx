import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'

// ─── Constants ───────────────────────────────────────────────────────────────

const _now = new Date()
const TODAY = _now.toISOString().slice(0, 10)
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

function Hex({ date, status }) {
  const fills    = { done:C.green, partial:C.amber, missed:C.red,     future:C.grayLt, empty:C.amberLt }
  const textFill = { done:'white', partial:'white', missed:C.redText, future:C.gray,   empty:C.gray }
  const isToday = date === TODAY
  const d = new Date(date + 'T12:00:00')
  return (
    <svg width={30} height={34} viewBox="0 0 34 38">
      <polygon points="17,1 33,10 33,28 17,37 1,28 1,10"
        fill={fills[status] ?? C.amberLt}
        stroke={isToday ? C.amberDk : 'none'} strokeWidth={isToday ? 2.5 : 0}/>
      <text x={17} y={23} textAnchor="middle" fontSize={isToday ? 12 : 11}
        fontWeight={isToday ? 'bold' : 'normal'} fill={textFill[status] ?? C.gray}
        fontFamily="Fredoka,sans-serif">
        {d.getDate()}
      </text>
    </svg>
  )
}

// ─── Month Calendar ───────────────────────────────────────────────────────────

function MonthCalendar({ dayStatus }) {
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
          ? <Hex key={i} date={date} status={dayStatus(date)}/>
          : <div key={i} style={{ width:30, height:34 }}/>
        )}
      </div>
    </div>
  )
}

// ─── Garden Section (pure SVG, no PNG) ───────────────────────────────────────

function GardenSection({ exercises, tracking }) {
  const [debugMode, setDebugMode] = useState(false)
  const [debugGroup, setDebugGroup] = useState(1)

  const unlocked = exercises.filter(e => e.unlocked)
  if (unlocked.length === 0) return null

  const totalWeeklySets = unlocked.reduce((s, e) => s + e.sets, 0) * 7
  const weekDone = Object.entries(tracking)
    .filter(([date]) => date >= WEEK[0] && date <= WEEK[6])
    .reduce((sum, [, dayT]) =>
      sum + Object.values(dayT).reduce((s, sets) => s + sets.filter(Boolean).length, 0), 0)

  const filledCount = totalWeeklySets > 0 ? Math.round(24 * weekDone / totalWeeklySets) : 0
  // In debug mode only the selected group shows filled — great for visual testing
  const filled = n => debugMode ? debugGroup === n : filledCount >= n
  // SVG fill/stroke that transitions to color when group unlocks
  const fc = (n, color) => ({ fill: filled(n) ? color : 'white', transition: 'fill 0.6s ease-in' })
  const sc = (n, color) => ({ stroke: filled(n) ? color : '#ddd', transition: 'stroke 0.6s ease-in' })

  const GROUP_LABELS = ['Sky','Sun','Clouds','Ground','Grass',
    'SF stems','SF leaves','Tall SF petals','Tall SF center',
    'Short SF petals','Short SF center','Cabbages','Carrot tops',
    'Carrot bodies','Small plants','Water drops',
    'Smita can','Smita shirt','Smita pants',
    'Saavan can','Saavan shirt','Saavan pants',
    'Both hair','Both skin']

  return (
    <div style={{ background:C.white, borderRadius:16, overflow:'hidden', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ padding:'12px 14px 6px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:16, color:C.amberDk }}>Weekly Garden</span>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:12, color:C.gray }}>{weekDone}/{totalWeeklySets} sets</span>
          <button onClick={() => setDebugMode(d => !d)}
            style={{ fontSize:10, color:debugMode?C.pt:C.gray, fontWeight:debugMode?700:400, padding:'2px 7px', borderRadius:6, border:'1px solid '+(debugMode?C.pt:C.grayLt), background:debugMode?C.amberLt:'transparent' }}>
            debug
          </button>
        </div>
      </div>
      <div style={{ padding:'0 8px 8px' }}>
        <div style={{ position:'relative' }}>
          <svg viewBox="0 0 504 360" style={{ width:'100%', height:'auto', display:'block', borderRadius:8, border:'1px solid '+C.amberMd }}>

            {/* ── 1. Sky ── */}
            <rect x={0} y={0} width={504} height={242} stroke="none" style={fc(1,'#87CEEB')}/>

            {/* ── 2. Sun ── */}
            {Array.from({length:8},(_,i)=>{
              const a=i*45*Math.PI/180
              return <line key={i} x1={62+44*Math.cos(a)} y1={62+44*Math.sin(a)} x2={62+58*Math.cos(a)} y2={62+58*Math.sin(a)}
                strokeWidth={3} strokeLinecap="round" style={sc(2,'#F59E0B')}/>
            })}
            <circle cx={62} cy={62} r={36} stroke="#D97706" strokeWidth={2.5} style={fc(2,'#FCD34D')}/>

            {/* ── 3. Clouds ── */}
            {[[185,56,20],[207,43,24],[230,56,19]].map(([cx,cy,r],i)=>
              <circle key={i} cx={cx} cy={cy} r={r} stroke="#9CA3AF" strokeWidth={2} style={fc(3,'#F0F9FF')}/>
            )}
            {[[342,44,16],[362,33,20],[384,44,16]].map(([cx,cy,r],i)=>
              <circle key={i+3} cx={cx} cy={cy} r={r} stroke="#9CA3AF" strokeWidth={2} style={fc(3,'#F0F9FF')}/>
            )}

            {/* ── 4. Ground ── */}
            <rect x={0} y={238} width={504} height={122} stroke="#5D4037" strokeWidth={1.5} style={fc(4,'#C8963E')}/>
            <line x1={0} y1={238} x2={504} y2={238} stroke="#2C1810" strokeWidth={2}/>

            {/* ── 5. Grass tufts ── */}
            {[15,55,110,180,255,318,378,432,478].map((x,i)=>(
              <path key={i} d={`M${x},238 Q${x+4},222 ${x+8},238 Q${x+12},218 ${x+16},238 Q${x+20},224 ${x+24},238`}
                fill="none" strokeWidth={2.5} strokeLinecap="round" style={sc(5,'#4CAF50')}/>
            ))}

            {/* ── 6. Sunflower stems ── */}
            <rect x={452} y={112} width={14} height={130} rx={7} stroke="#1B5E20" strokeWidth={2} style={fc(6,'#388E3C')}/>
            <rect x={420} y={174} width={12} height={68} rx={6} stroke="#1B5E20" strokeWidth={2} style={fc(6,'#388E3C')}/>

            {/* ── 7. Sunflower leaves ── */}
            <ellipse cx={442} cy={164} rx={22} ry={9} transform="rotate(-38,442,164)" stroke="#2E7D32" strokeWidth={2} style={fc(7,'#4CAF50')}/>
            <ellipse cx={472} cy={140} rx={22} ry={9} transform="rotate(38,472,140)" stroke="#2E7D32" strokeWidth={2} style={fc(7,'#4CAF50')}/>
            <ellipse cx={411} cy={205} rx={17} ry={7} transform="rotate(-30,411,205)" stroke="#2E7D32" strokeWidth={2} style={fc(7,'#4CAF50')}/>
            <ellipse cx={436} cy={221} rx={15} ry={7} transform="rotate(28,436,221)" stroke="#2E7D32" strokeWidth={2} style={fc(7,'#4CAF50')}/>

            {/* ── 8. Tall SF petals ── */}
            {Array.from({length:14},(_,i)=>{
              const a=i*(360/14)*Math.PI/180, px=459+32*Math.cos(a), py=100+32*Math.sin(a)
              return <ellipse key={i} cx={px} cy={py} rx={9} ry={14} transform={`rotate(${i*360/14},${px},${py})`}
                stroke="#F59E0B" strokeWidth={1.5} style={fc(8,'#FCD34D')}/>
            })}

            {/* ── 9. Tall SF center ── */}
            <circle cx={459} cy={100} r={20} stroke="#3E2723" strokeWidth={2} style={fc(9,'#6D4C41')}/>
            <circle cx={459} cy={100} r={11} stroke="none" style={fc(9,'#4E342E')}/>

            {/* ── 10. Short SF petals ── */}
            {Array.from({length:12},(_,i)=>{
              const a=i*30*Math.PI/180, px=426+24*Math.cos(a), py=160+24*Math.sin(a)
              return <ellipse key={i} cx={px} cy={py} rx={7} ry={11} transform={`rotate(${i*30},${px},${py})`}
                stroke="#F59E0B" strokeWidth={1.5} style={fc(10,'#FCD34D')}/>
            })}

            {/* ── 11. Short SF center ── */}
            <circle cx={426} cy={160} r={16} stroke="#3E2723" strokeWidth={2} style={fc(11,'#6D4C41')}/>
            <circle cx={426} cy={160} r={9} stroke="none" style={fc(11,'#4E342E')}/>

            {/* ── 12. Cabbages ── */}
            {[0,36,72,108,144,180,216,252,288,324].map((a,i)=>
              <ellipse key={i} cx={38} cy={300} rx={34} ry={20} transform={`rotate(${a},38,300)`} stroke="#1B5E20" strokeWidth={1.5} style={fc(12,'#2E7D32')}/>
            )}
            <circle cx={38} cy={300} r={16} stroke="#2E7D32" strokeWidth={1.5} style={fc(12,'#43A047')}/>
            {[0,36,72,108,144,180,216,252,288,324].map((a,i)=>
              <ellipse key={i+10} cx={90} cy={308} rx={28} ry={16} transform={`rotate(${a},90,308)`} stroke="#1B5E20" strokeWidth={1.5} style={fc(12,'#2E7D32')}/>
            )}
            <circle cx={90} cy={308} r={13} stroke="#2E7D32" strokeWidth={1.5} style={fc(12,'#43A047')}/>

            {/* ── 13. Carrot tops ── */}
            {[[322,256],[350,250],[378,256]].map(([cx,cy],i)=>(
              <g key={i}>
                <ellipse cx={cx-3} cy={cy-8} rx={3} ry={9} transform={`rotate(-18,${cx-3},${cy-8})`} stroke="#2E7D32" strokeWidth={1.5} style={fc(13,'#388E3C')}/>
                <ellipse cx={cx+2} cy={cy-11} rx={3} ry={10} stroke="#2E7D32" strokeWidth={1.5} style={fc(13,'#388E3C')}/>
                <ellipse cx={cx+7} cy={cy-8} rx={3} ry={9} transform={`rotate(18,${cx+7},${cy-8})`} stroke="#2E7D32" strokeWidth={1.5} style={fc(13,'#388E3C')}/>
              </g>
            ))}

            {/* ── 14. Carrot bodies ── */}
            {[[322,266],[350,260],[378,266]].map(([cx,cy],i)=>(
              <path key={i} d={`M${cx-9},${cy} Q${cx},${cy+40} ${cx},${cy+44} Q${cx},${cy+40} ${cx+9},${cy} Z`}
                stroke="#E64A19" strokeWidth={2} style={fc(14,'#FF7043')}/>
            ))}

            {/* ── 15. Small plants ── */}
            {[[140,248],[162,240],[184,248],[206,241]].map(([cx,cy],i)=>(
              <g key={i}>
                <ellipse cx={cx} cy={cy} rx={8} ry={11} stroke="#2E7D32" strokeWidth={2} style={fc(15,'#66BB6A')}/>
                <ellipse cx={cx-8} cy={cy+5} rx={6} ry={9} transform={`rotate(-24,${cx-8},${cy+5})`} stroke="#2E7D32" strokeWidth={2} style={fc(15,'#66BB6A')}/>
                <ellipse cx={cx+8} cy={cy+5} rx={6} ry={9} transform={`rotate(24,${cx+8},${cy+5})`} stroke="#2E7D32" strokeWidth={2} style={fc(15,'#66BB6A')}/>
              </g>
            ))}

            {/* ── 16. Water drops ── */}
            {[[224,226],[240,240],[256,224],[272,240],[288,224],[304,240],[320,226]].map(([cx,cy],i)=>(
              <ellipse key={i} cx={cx} cy={cy} rx={4} ry={5.5} transform={`rotate(${i%2===0?-12:12},${cx},${cy})`}
                stroke="#1565C0" strokeWidth={1.5} style={fc(16,'#64B5F6')}/>
            ))}

            {/* ══ KAVITA ══ (arms drawn first — behind shirt in z-order, skin group 24) */}
            <ellipse cx={98} cy={192} rx={13} ry={36} transform="rotate(14,98,192)" stroke="#2C1810" strokeWidth={2} style={fc(24,'#FFCC99')}/>
            <ellipse cx={204} cy={196} rx={13} ry={34} transform="rotate(-16,204,196)" stroke="#2C1810" strokeWidth={2} style={fc(24,'#FFCC99')}/>

            {/* ── 17. Smita can ── */}
            <rect x={182} y={192} width={40} height={33} rx={7} stroke="#2C1810" strokeWidth={2} style={fc(17,'#81C784')}/>
            <path d="M182,200 Q163,208 155,222" fill="none" strokeWidth={7} strokeLinecap="round" style={sc(17,'#388E3C')}/>
            <path d="M222,196 Q234,203 222,214" fill="none" strokeWidth={4} strokeLinecap="round" style={sc(17,'#388E3C')}/>
            <circle cx={155} cy={222} r={5} stroke="#2E7D32" strokeWidth={1.5} style={fc(17,'#A5D6A7')}/>

            {/* ── 18. Smita shirt ── */}
            <path d="M100,152 Q94,158 96,252 L200,252 Q202,158 196,152 Q174,144 148,144 Q122,144 100,152 Z"
              stroke="#2C1810" strokeWidth={2} style={fc(18,'#F48FB1')}/>

            {/* ── 19. Smita pants + shoes ── */}
            <rect x={105} y={249} width={32} height={52} rx={6} stroke="#2C1810" strokeWidth={2} style={fc(19,'#5C9BD6')}/>
            <rect x={141} y={249} width={32} height={52} rx={6} stroke="#2C1810" strokeWidth={2} style={fc(19,'#5C9BD6')}/>
            <ellipse cx={121} cy={303} rx={21} ry={9} stroke="#2C1810" strokeWidth={2} style={fc(19,'#5D4037')}/>
            <ellipse cx={157} cy={303} rx={21} ry={9} stroke="#2C1810" strokeWidth={2} style={fc(19,'#5D4037')}/>

            {/* ══ SAAVAN ══ (arms first — group 24) */}
            <ellipse cx={274} cy={188} rx={13} ry={36} transform="rotate(-14,274,188)" stroke="#2C1810" strokeWidth={2} style={fc(24,'#FFCC99')}/>
            <ellipse cx={384} cy={196} rx={13} ry={34} transform="rotate(16,384,196)" stroke="#2C1810" strokeWidth={2} style={fc(24,'#FFCC99')}/>

            {/* ── 20. Saavan can ── */}
            <rect x={280} y={192} width={40} height={33} rx={7} stroke="#2C1810" strokeWidth={2} style={fc(20,'#4DD0E1')}/>
            <path d="M322,200 Q340,208 348,222" fill="none" strokeWidth={7} strokeLinecap="round" style={sc(20,'#00838F')}/>
            <path d="M280,196 Q268,203 280,214" fill="none" strokeWidth={4} strokeLinecap="round" style={sc(20,'#00838F')}/>
            <circle cx={348} cy={222} r={5} stroke="#006064" strokeWidth={1.5} style={fc(20,'#B2EBF2')}/>

            {/* ── 21. Saavan shirt ── */}
            <path d="M278,152 Q272,158 274,252 L378,252 Q380,158 374,152 Q352,144 328,144 Q304,144 278,152 Z"
              stroke="#2C1810" strokeWidth={2} style={fc(21,'#FFB74D')}/>

            {/* ── 22. Saavan pants + shoes ── */}
            <rect x={283} y={249} width={32} height={52} rx={6} stroke="#2C1810" strokeWidth={2} style={fc(22,'#5C9BD6')}/>
            <rect x={319} y={249} width={32} height={52} rx={6} stroke="#2C1810" strokeWidth={2} style={fc(22,'#5C9BD6')}/>
            <ellipse cx={299} cy={303} rx={21} ry={9} stroke="#2C1810" strokeWidth={2} style={fc(22,'#5D4037')}/>
            <ellipse cx={335} cy={303} rx={21} ry={9} stroke="#2C1810" strokeWidth={2} style={fc(22,'#5D4037')}/>

            {/* ── 23. Both kids' hair ── */}
            {/* Smita hair — behind face */}
            <ellipse cx={148} cy={94} rx={40} ry={38} stroke="#3E2723" strokeWidth={2.5} style={fc(23,'#7B4F2E')}/>
            <ellipse cx={114} cy={126} rx={10} ry={26} transform="rotate(10,114,126)" stroke="#3E2723" strokeWidth={2} style={fc(23,'#7B4F2E')}/>
            <circle cx={148} cy={72} r={10} stroke="#3E2723" strokeWidth={2} style={fc(23,'#7B4F2E')}/>
            {/* Saavan hair — behind face */}
            <ellipse cx={328} cy={90} rx={38} ry={34} stroke="#3E2723" strokeWidth={2.5} style={fc(23,'#5D4037')}/>
            {[[-18,-6],[-8,-13],[4,-16],[16,-10],[26,-3]].map(([dx,dy],i)=>(
              <ellipse key={i} cx={328+dx} cy={84+dy} rx={6} ry={10} transform={`rotate(${dx*1.5},${328+dx},${84+dy})`}
                stroke="#3E2723" strokeWidth={2} style={fc(23,'#5D4037')}/>
            ))}

            {/* ── 24. Both kids' skin + faces (grand finale!) ── */}
            {/* Smita face */}
            <circle cx={148} cy={108} r={35} stroke="#2C1810" strokeWidth={2.5} style={fc(24,'#FFCC99')}/>
            <circle cx={137} cy={112} r={5} fill="#2C1810"/>
            <circle cx={159} cy={112} r={5} fill="#2C1810"/>
            <path d="M136,124 Q148,134 160,124" fill="none" stroke="#2C1810" strokeWidth={2.5} strokeLinecap="round"/>
            <circle cx={127} cy={120} r={6} style={{ fill:filled(24)?'#FFAA80':'none', transition:'fill 0.6s ease-in' }}/>
            <circle cx={169} cy={120} r={6} style={{ fill:filled(24)?'#FFAA80':'none', transition:'fill 0.6s ease-in' }}/>
            {/* Saavan face */}
            <circle cx={328} cy={108} r={35} stroke="#2C1810" strokeWidth={2.5} style={fc(24,'#FFCC99')}/>
            <circle cx={317} cy={112} r={5} fill="#2C1810"/>
            <circle cx={339} cy={112} r={5} fill="#2C1810"/>
            <path d="M316,124 Q328,134 340,124" fill="none" stroke="#2C1810" strokeWidth={2.5} strokeLinecap="round"/>
            <circle cx={307} cy={120} r={6} style={{ fill:filled(24)?'#FFAA80':'none', transition:'fill 0.6s ease-in' }}/>
            <circle cx={349} cy={120} r={6} style={{ fill:filled(24)?'#FFAA80':'none', transition:'fill 0.6s ease-in' }}/>

            {/* Name labels — always visible */}
            <text x={148} y={52} textAnchor="middle" fontFamily="'Fredoka',sans-serif" fontWeight={700} fontSize={16} fill="#92400E">Smita</text>
            <text x={328} y={52} textAnchor="middle" fontFamily="'Fredoka',sans-serif" fontWeight={700} fontSize={16} fill="#92400E">Saavan</text>

          </svg>

          {/* Debug navigator */}
          {debugMode && (
            <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.8)', borderRadius:10, padding:'4px 12px', display:'flex', gap:8, alignItems:'center', whiteSpace:'nowrap' }}>
              <button onClick={()=>setDebugGroup(n=>Math.max(1,n-1))}
                style={{ color:'white', fontSize:20, lineHeight:1, padding:'0 4px', opacity:debugGroup===1?0.3:1 }}>‹</button>
              <span style={{ color:'white', fontSize:11, fontFamily:'monospace' }}>{debugGroup}/24: {GROUP_LABELS[debugGroup-1]}</span>
              <button onClick={()=>setDebugGroup(n=>Math.min(24,n+1))}
                style={{ color:'white', fontSize:20, lineHeight:1, padding:'0 4px', opacity:debugGroup===24?0.3:1 }}>›</button>
            </div>
          )}
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

// ─── Exercise Card ────────────────────────────────────────────────────────────

function ExerciseCard({ ex, mode, onTap }) {
  return (
    <div onClick={onTap} style={{ background:ex.unlocked?C.white:C.grayLt, borderRadius:14, padding:'14px 12px', textAlign:'center', cursor:'pointer', border:ex.unlocked?'2px solid '+C.amberMd:mode==='pt'?'2px dashed '+C.pt:'2px solid transparent', boxShadow:ex.unlocked?'0 1px 4px rgba(0,0,0,0.07)':'none', opacity:ex.unlocked?1:0.65, transition:'all 0.2s', userSelect:'none' }}>
      <div style={{ fontWeight:700, fontSize:13, color:ex.unlocked?C.amberDk:C.gray, lineHeight:1.2 }}>{ex.name}</div>
      <div style={{ marginTop:6, fontSize:11, fontWeight:700, color:ex.unlocked?C.amber:C.gray }}>
        {ex.unlocked?`${ex.sets} × ${ex.reps}`:mode==='pt'?'Tap to unlock':'Locked'}
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState('home')
  const [mode, setMode] = useState('mom')
  const [exercises, setExercises] = useState([])
  const [tracking, setTracking] = useState({})
  const [equipment, setEquipment] = useState([])
  const [myEq, setMyEq] = useState(new Set())
  const [modal, setModal] = useState(null)
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
  const motivation = pct===100?'You crushed it today! 🌟':pct>=75?'Almost there, keep buzzing! 🐝':pct>=50?"Halfway there! You're a star 💛":pct>=25?'Great start! Keep going! 🌸':doneSets>0?'Every rep counts! 🍯':"Ready to buzz? Let's go! 🐝"

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

          <MonthCalendar dayStatus={dayStatus}/>
          <GardenSection exercises={exercises} tracking={tracking}/>

          <h2 style={{ fontFamily:"'Fredoka',sans-serif", fontSize:18, color:C.amberDk, marginBottom:10 }}>Today's Exercises</h2>
          {unlocked.length===0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:C.gray }}>
              <div style={{ fontSize:44, marginBottom:12 }}>🌱</div>
              <p style={{ fontSize:14, lineHeight:1.6 }}>No exercises unlocked yet.<br/>Your PT will set these up!</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {unlocked.map(ex => {
                const sets=todayTracking[ex.id]??[], done=sets.filter(Boolean).length, allDone=done>=ex.sets
                return (
                  <div key={ex.id} style={{ background:C.white, borderRadius:14, padding:'12px 14px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:allDone?'2px solid '+C.green:'2px solid transparent' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, cursor:'pointer' }} onClick={()=>setModal(ex)}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15, color:C.amberDk }}>{ex.name}</div>
                        <div style={{ fontSize:12, color:C.amber, marginTop:4, fontWeight:700 }}>{ex.sets} sets × {ex.reps} reps</div>
                      </div>
                      <span style={{ fontSize:20 }}>{allDone?'✅':'›'}</span>
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {Array.from({length:ex.sets},(_,i) => (
                        <button key={i} onClick={()=>toggleSet(ex.id,i)}
                          style={{ width:38, height:38, borderRadius:10, background:sets[i]?C.amber:C.amberLt, color:sets[i]?C.white:C.amberDk, fontWeight:700, fontSize:13, boxShadow:sets[i]?'0 2px 6px rgba(245,158,11,0.4)':'none', transition:'all 0.15s' }}>
                          {sets[i]?'✓':i+1}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
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

      <nav style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, background:C.white, borderTop:'1px solid '+C.amberMd, display:'flex', padding:'8px 0 14px', zIndex:50 }}>
        {[{id:'home',icon:'🏠',label:'Home'},{id:'garden',icon:'🌸',label:'Exercises'},{id:'equipment',icon:'🎒',label:'Equipment'}].map(({id,icon,label}) => (
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

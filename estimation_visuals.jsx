import { useState, useEffect, useCallback } from "react";

// ── Palette (matches lecture deck navy/teal) ─────────────────
const C = {
  navy: "#1B3A5C", teal: "#028090", lightTeal: "#A8DADC",
  offWhite: "#F4F7F9", charcoal: "#2D3A3A", gray: "#5C6B73",
  accent: "#E63946", amber: "#E76F51", green: "#2D6A4F",
  lightGreen: "#B7E4C7", gold: "#F4C430",
};

// ── Math helpers ─────────────────────────────────────────────
const randNorm = (mu = 0, sd = 1) => {
  let u, v;
  do { u = Math.random(); } while (u === 0);
  do { v = Math.random(); } while (v === 0);
  return mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const randExp   = (rate = 1) => -Math.log(1 - Math.random()) / rate;
const randUnif  = (a, b) => a + (b - a) * Math.random();
const arrMean   = a => a.reduce((s, x) => s + x, 0) / a.length;
const arrSD     = a => { const m = arrMean(a); return Math.sqrt(a.reduce((s, x) => s + (x-m)**2, 0) / a.length); };
const normalPDF = (x, mu, sd) =>
  Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const makeHist = (data, nBins, xLo, xHi) => {
  const bw = (xHi - xLo) / nBins;
  const counts = Array(nBins).fill(0);
  data.forEach(v => { const b = clamp(Math.floor((v - xLo) / bw), 0, nBins - 1); counts[b]++; });
  return counts.map((c, i) => ({ x: xLo + i * bw, w: bw, freq: c / data.length }));
};

// ── Reusable UI ───────────────────────────────────────────────
const Card = ({ title, subtitle, accent = C.teal, children }) => (
  <div style={{ background:"white", borderRadius:12, overflow:"hidden",
    boxShadow:"0 2px 20px rgba(27,58,92,.10)", marginBottom:28 }}>
    <div style={{ background:C.navy, padding:"15px 22px", borderLeft:`5px solid ${accent}` }}>
      <div style={{ fontFamily:"Georgia,serif", fontSize:17, fontWeight:700, color:"white" }}>{title}</div>
      {subtitle && <div style={{ fontFamily:"Calibri,sans-serif", fontSize:12,
        color:C.lightTeal, marginTop:3, fontStyle:"italic" }}>{subtitle}</div>}
    </div>
    <div style={{ padding:"18px 22px" }}>{children}</div>
  </div>
);

const Btn = ({ onClick, children, active, color=C.teal }) => (
  <button onClick={onClick} style={{
    padding:"6px 14px", borderRadius:6, border:`2px solid ${color}`,
    background: active ? color : "white", color: active ? "white" : color,
    fontFamily:"Calibri,sans-serif", fontSize:13, fontWeight:600,
    cursor:"pointer", transition:"all .15s", marginRight:6, marginBottom:4,
  }}>{children}</button>
);

const Slider = ({ label, value, min, max, step=1, onChange, color=C.teal, fmt }) => (
  <div style={{ marginBottom:10 }}>
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
      <span style={{ fontFamily:"Calibri,sans-serif", fontSize:12, color:C.charcoal }}>{label}</span>
      <span style={{ fontFamily:"Georgia,serif", fontSize:13, fontWeight:700, color }}>{fmt ? fmt(value) : value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(+e.target.value)} style={{ width:"100%", accentColor:color }} />
  </div>
);

const Badge = ({ label, value, color=C.teal }) => (
  <div style={{ display:"inline-block", background:C.offWhite, border:`1.5px solid ${color}`,
    borderRadius:7, padding:"5px 12px", marginRight:8, marginBottom:6 }}>
    <span style={{ fontFamily:"Calibri,sans-serif", fontSize:11, color:C.gray }}>{label}: </span>
    <span style={{ fontFamily:"Georgia,serif", fontSize:13, fontWeight:700, color }}>{value}</span>
  </div>
);

const Note = ({ color=C.teal, children }) => (
  <div style={{ marginTop:12, padding:"9px 14px", background:color+"18",
    borderLeft:`3px solid ${color}`, borderRadius:4,
    fontFamily:"Calibri,sans-serif", fontSize:12, color:C.charcoal, lineHeight:1.65 }}>
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════
// VIZ 1 — Bias & Variance archery targets
// ═══════════════════════════════════════════════════════════
const BiasVarianceViz = () => {
  const scenarios = [
    { id:"ll", label:"Low Bias, Low Variance",   bias:0,    sd:0.10, color:C.green,   tag:"Ideal estimator" },
    { id:"lh", label:"Low Bias, High Variance",  bias:0,    sd:0.38, color:C.amber,   tag:"Unbiased but imprecise" },
    { id:"hl", label:"High Bias, Low Variance",  bias:0.55, sd:0.10, color:C.accent,  tag:"Precise but systematically wrong" },
    { id:"hh", label:"High Bias, High Variance", bias:0.55, sd:0.38, color:"#8B2FC9", tag:"Worst case" },
  ];
  const [sel, setSel] = useState("ll");
  const sc = scenarios.find(s => s.id === sel);
  const CX = 100, CY = 100, R = 85;

  const pts = Array.from({length:16}, (_, i) => {
    const angle = i * (2 * Math.PI / 16) + sc.bias * 2;
    const r = sc.sd * R * (0.5 + 0.7 * ((i * 7919) % 97) / 96);
    const bx = sc.bias * R * 0.7;
    const by = sc.bias * R * 0.25;
    return { x: CX + bx + r * Math.cos(angle), y: CY + by + r * Math.sin(angle) };
  });
  const centX = arrMean(pts.map(p => p.x));
  const centY = arrMean(pts.map(p => p.y));

  return (
    <Card title="Bias, Variance & the Bias-Variance Tradeoff"
      subtitle="The four quadrants of estimator quality — the archery analogy from the lecture">
      <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:16 }}>
        {scenarios.map(s =>
          <Btn key={s.id} onClick={() => setSel(s.id)} active={sel===s.id} color={s.color}>{s.label}</Btn>
        )}
      </div>
      <div style={{ display:"flex", gap:24, flexWrap:"wrap", alignItems:"flex-start" }}>
        <div style={{ flexShrink:0, textAlign:"center" }}>
          <svg width={200} height={200} viewBox="0 0 200 200">
            {[R, R*0.75, R*0.53, R*0.32, R*0.14].map((r, i) => (
              <circle key={r} cx={CX} cy={CY} r={r}
                fill={["#fff","#e8e8e8","#c8c8c8","#e63946","#1B3A5C"][i]}
                stroke="#aaa" strokeWidth={0.8} />
            ))}
            {[-7,7].map(dx => <line key={dx} x1={CX+dx} y1={CY} x2={CX} y2={CY} stroke="white" strokeWidth={1.5}/>)}
            {[-7,7].map(dy => <line key={dy} x1={CX} y1={CY+dy} x2={CX} y2={CY} stroke="white" strokeWidth={1.5}/>)}
            {pts.map((p, i) => (
              <g key={i}>
                <circle cx={clamp(p.x,6,194)} cy={clamp(p.y,6,194)} r={5} fill={sc.color} opacity={0.75}/>
                {[-3.5,3.5].map((d,j) =>
                  <line key={j} x1={clamp(p.x,6,194)+d} y1={clamp(p.y,6,194)}
                    x2={clamp(p.x,6,194)-d} y2={clamp(p.y,6,194)} stroke="white" strokeWidth={1}/>
                )}
              </g>
            ))}
            <circle cx={clamp(centX,6,194)} cy={clamp(centY,6,194)} r={8}
              fill="none" stroke={C.gold} strokeWidth={2.5} strokeDasharray="4,2"/>
            <circle cx={clamp(centX,6,194)} cy={clamp(centY,6,194)} r={2} fill={C.gold}/>
          </svg>
          <div style={{ fontFamily:"Calibri,sans-serif", fontSize:10, color:C.gray, marginTop:2 }}>
            ● shots &nbsp; ◎ mean estimate (centroid)
          </div>
        </div>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:17, fontWeight:700, color:sc.color, marginBottom:10 }}>{sc.tag}</div>
          <div style={{ marginBottom:12 }}>
            <Badge label="Bias" value={sc.bias===0?"Low":"High"} color={sc.bias===0?C.green:C.accent}/>
            <Badge label="Variance" value={sc.sd<0.2?"Low":"High"} color={sc.sd<0.2?C.green:C.accent}/>
          </div>
          <div style={{ fontFamily:"Calibri,sans-serif", fontSize:13, color:C.charcoal,
            lineHeight:1.65, background:C.offWhite, borderRadius:8, padding:12 }}>
            {sel==="ll" && <><strong style={{color:C.green}}>Ideal estimator.</strong> Shots cluster tightly around the bullseye. x̄ is unbiased (E[x̄]=μ) AND low-variance. The gold standard for estimators with large n.</>}
            {sel==="lh" && <><strong style={{color:C.amber}}>Unbiased but imprecise.</strong> The centroid (gold ring) sits on the bullseye — <em>on average</em> we're correct — but individual estimates scatter widely. Classic small-sample behavior: x̄ is always unbiased, but SE = σ/√n is large when n is small.</>}
            {sel==="hl" && <><strong style={{color:C.accent}}>Precise but systematically wrong.</strong> Tight cluster, off-center. Like a glucose meter that always reads 15 mg/dL too high. <strong>More data will NOT fix this.</strong> Bias must be corrected at the source — it is a property of the estimator, not the randomness.</>}
            {sel==="hh" && <><strong style={{color:"#8B2FC9"}}>Worst case.</strong> Scattered AND off-center. MSE = Bias² + Variance captures both penalties. No amount of data removes the bias term; larger n only reduces the variance term.</>}
          </div>
          <div style={{ marginTop:14 }}>
            <div style={{ fontFamily:"Calibri,sans-serif", fontSize:11, color:C.gray, marginBottom:4 }}>MSE = Bias² + Variance</div>
            <div style={{ display:"flex", height:18, borderRadius:4, overflow:"hidden", border:`1px solid ${C.lightTeal}` }}>
              {(() => {
                const b2 = sc.bias**2, v2 = sc.sd**2, total = sc.bias**2+sc.sd**2 || 1;
                return <>
                  <div style={{ width:`${b2/total*100}%`, background:C.accent, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {b2/total>0.15 && <span style={{fontSize:9,color:"white",fontWeight:700}}>Bias²</span>}
                  </div>
                  <div style={{ width:`${v2/total*100}%`, background:C.teal, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {v2/total>0.15 && <span style={{fontSize:9,color:"white",fontWeight:700}}>Variance</span>}
                  </div>
                </>;
              })()}
            </div>
          </div>
        </div>
      </div>
      <Note color={C.teal}>
        <strong>MSE = Bias² + Variance</strong> — total estimation error has two independent sources. In machine learning,
        regularization (Ridge, LASSO) deliberately introduces small bias to dramatically cut variance, reducing overall MSE.
        This tradeoff is foundational — you will see it again in the regression module.
      </Note>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════
// VIZ 2 — Sampling Distribution simulator
// ═══════════════════════════════════════════════════════════
const Histogram = ({ data, color, xLo, xHi, nBins=30, showNormal=false, mu=0, sd=1, h=130, w=280 }) => {
  if (!data || !data.length) return null;
  const bins = makeHist(data, nBins, xLo, xHi);
  const maxF  = Math.max(...bins.map(b=>b.freq)) * 1.15 || 0.05;
  const sx = v => 28 + ((v-xLo)/(xHi-xLo)) * (w-36);
  const sy = v => h-18 - (v/maxF) * (h-28);
  const normalPts = showNormal ? Array.from({length:80}, (_,i) => {
    const x = xLo + (i/79)*(xHi-xLo);
    return `${sx(x)},${clamp(sy(normalPDF(x,mu,sd)*bins[0].w), 3, h-5)}`;
  }).join(" ") : null;
  return (
    <svg width={w} height={h} style={{display:"block"}}>
      {bins.map((b,i) => (
        <rect key={i} x={sx(b.x)} y={sy(b.freq)}
          width={Math.max(0, sx(b.x+b.w)-sx(b.x)-0.8)}
          height={h-18-sy(b.freq)} fill={color} opacity={0.75}/>
      ))}
      {normalPts && <polyline points={normalPts} fill="none" stroke={C.accent} strokeWidth={2} strokeDasharray="5,3"/>}
      <line x1={28} y1={h-18} x2={w-6} y2={h-18} stroke={C.charcoal} strokeWidth={1}/>
      {[xLo, (xLo+xHi)/2, xHi].map(v => (
        <text key={v} x={sx(v)} y={h-4} textAnchor="middle" fontSize={9} fill={C.gray}>{v.toFixed(1)}</text>
      ))}
    </svg>
  );
};

const SamplingDistViz = () => {
  const [dist, setDist]     = useState("exponential");
  const [n, setN]           = useState(5);
  const [nReps, setNReps]   = useState(500);
  const [means, setMeans]   = useState([]);
  const [popSample, setPop] = useState([]);

  const drawOne = useCallback(() => {
    if (dist==="exponential") return randExp(0.5);
    if (dist==="uniform")     return randUnif(0, 10);
    if (dist==="bimodal")     return Math.random()<0.5 ? randNorm(3,0.7) : randNorm(8,0.7);
    return randNorm(5,1.5);
  }, [dist]);

  const simulate = useCallback(() => {
    setPop(Array.from({length:600}, drawOne));
    setMeans(Array.from({length:nReps}, () => arrMean(Array.from({length:n}, drawOne))));
  }, [drawOne, n, nReps]);

  useEffect(() => { simulate(); }, [simulate]);

  const trueMu  = {exponential:2, uniform:5, bimodal:5.5, normal:5}[dist];
  const trueSig = {exponential:2, uniform:2.89, bimodal:2.6, normal:1.5}[dist];
  const theorSE = trueSig / Math.sqrt(n);
  const obsMu   = means.length ? arrMean(means) : trueMu;
  const obsSE   = means.length > 1 ? arrSD(means) : theorSE;
  const mLo = means.length ? Math.min(...means)-0.3 : trueMu-3;
  const mHi = means.length ? Math.max(...means)+0.3 : trueMu+3;

  return (
    <Card title="Sampling Distributions — Population vs. Distribution of x̄"
      subtitle="The most important distinction in all of inferential statistics" accent={C.amber}>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:16 }}>
        <div style={{ flex:1, minWidth:190 }}>
          <div style={{ fontFamily:"Calibri,sans-serif", fontSize:11, color:C.gray,
            fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Population shape</div>
          {[
            {id:"exponential", label:"Exponential (right-skewed)"},
            {id:"uniform",     label:"Uniform (flat)"},
            {id:"bimodal",     label:"Bimodal (two peaks)"},
            {id:"normal",      label:"Normal"},
          ].map(d => <Btn key={d.id} onClick={()=>setDist(d.id)} active={dist===d.id} color={C.amber}>{d.label}</Btn>)}
        </div>
        <div style={{ flex:1, minWidth:180 }}>
          <Slider label="Sample size n" value={n} min={2} max={60} onChange={setN} color={C.teal}/>
          <Slider label="Number of samples" value={nReps} min={100} max={2000} step={100} onChange={setNReps} color={C.navy}/>
          <Btn onClick={simulate} color={C.green}>↺ Resimulate</Btn>
        </div>
      </div>
      <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:220 }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:14, fontWeight:700, color:C.amber, marginBottom:3 }}>Population Distribution</div>
          <div style={{ fontFamily:"Calibri,sans-serif", fontSize:11, color:C.gray, marginBottom:6 }}>Individual observations — raw data shape</div>
          <Histogram data={popSample} color={C.amber} xLo={0} xHi={dist==="uniform"?10:12}/>
          <div style={{marginTop:6}}>
            <Badge label="True μ" value={trueMu.toFixed(2)} color={C.amber}/>
            <Badge label="True σ" value={trueSig.toFixed(2)} color={C.amber}/>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", fontSize:26, color:C.teal, fontWeight:700 }}>→</div>
        <div style={{ flex:1, minWidth:220 }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:14, fontWeight:700, color:C.teal, marginBottom:3 }}>Sampling Distribution of x̄ (n={n})</div>
          <div style={{ fontFamily:"Calibri,sans-serif", fontSize:11, color:C.gray, marginBottom:6 }}>{nReps} sample means — approaches Normal by CLT</div>
          <Histogram data={means} color={C.teal} xLo={mLo} xHi={mHi}
            showNormal mu={obsMu} sd={obsSE}/>
          <div style={{marginTop:6}}>
            <Badge label="Mean(x̄)" value={obsMu.toFixed(3)} color={C.teal}/>
            <Badge label="Observed SE" value={obsSE.toFixed(3)} color={C.teal}/>
            <Badge label="σ/√n" value={theorSE.toFixed(3)} color={C.navy}/>
          </div>
        </div>
      </div>
      <Note color={C.teal}>
        <strong>Key insight:</strong> No matter how skewed or non-normal the population is (left panel), the sampling
        distribution of x̄ (right panel) always converges to the bell curve (dashed red) as n grows — this is the CLT.
        Also notice: Observed SE ≈ σ/√n, confirming Var(x̄) = σ²/n. Increase n with the slider and watch the right histogram narrow and normalize.
      </Note>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════
// VIZ 3 — CLT convergence panels n=1,5,10,30,100
// ═══════════════════════════════════════════════════════════
const CLTViz = () => {
  const [dist, setDist] = useState("exponential");
  const nVals = [1, 5, 10, 30, 100];
  const nReps = 1200;
  const colors = [C.accent, C.amber, "#F4A261", C.teal, C.navy];

  const drawOne = useCallback(() => {
    if (dist==="exponential") return randExp(0.5);
    if (dist==="bimodal")     return Math.random()<0.5 ? randNorm(3,0.8) : randNorm(8,0.8);
    return randUnif(0, 10);
  }, [dist]);

  const [allMeans, setAllMeans] = useState([]);
  useEffect(() => {
    setAllMeans(nVals.map(n =>
      Array.from({length:nReps}, () => arrMean(Array.from({length:n}, drawOne)))
    ));
  }, [dist, drawOne]);

  const trueMu  = {exponential:2, bimodal:5.5, uniform:5}[dist];
  const trueSig = {exponential:2, bimodal:2.6, uniform:2.89}[dist];
  const W=136, H=108;

  return (
    <Card title="Central Limit Theorem — Convergence Across Sample Sizes"
      subtitle="Watch the histogram transform from any population shape into a Normal curve as n increases"
      accent={C.accent}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
        {[
          {id:"exponential", label:"Exponential (heavily skewed)"},
          {id:"bimodal",     label:"Bimodal (two peaks)"},
          {id:"uniform",     label:"Uniform (flat)"},
        ].map(d => <Btn key={d.id} onClick={()=>setDist(d.id)} active={dist===d.id} color={C.accent}>{d.label}</Btn>)}
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"space-around" }}>
        {nVals.map((n, ni) => {
          const data = allMeans[ni] || [];
          if (!data.length) return null;
          const lo = Math.min(...data), hi = Math.max(...data), range = hi-lo||1;
          const xLo = lo - range*0.05, xHi = hi + range*0.05;
          const bins = makeHist(data, 28, xLo, xHi);
          const maxF = Math.max(...bins.map(b=>b.freq)) * 1.15 || 0.1;
          const bw   = bins[0]?.w || 0.1;
          const mu   = trueMu, sd = trueSig/Math.sqrt(n);
          const sx = v => 12 + ((v-xLo)/(xHi-xLo)) * (W-20);
          const sy = v => H-16 - (v/maxF) * (H-24);
          const normPts = Array.from({length:60},(_,i)=>{
            const x = xLo + (i/59)*(xHi-xLo);
            return `${sx(x)},${clamp(sy(normalPDF(x,mu,sd)*bw), 3, H-5)}`;
          }).join(" ");
          const normality = Math.min(1, 0.22 + ni * 0.20);
          return (
            <div key={n} style={{ textAlign:"center", minWidth:W }}>
              <div style={{ fontFamily:"Georgia,serif", fontSize:15, fontWeight:700, color:colors[ni] }}>n = {n}</div>
              <div style={{ fontFamily:"Calibri,sans-serif", fontSize:10, color:C.gray, marginBottom:4 }}>SE ≈ {sd.toFixed(2)}</div>
              <svg width={W} height={H} style={{ background:C.offWhite, borderRadius:6, display:"block" }}>
                {bins.map((b,i) => (
                  <rect key={i} x={sx(b.x)} y={sy(b.freq)}
                    width={Math.max(0,sx(b.x+b.w)-sx(b.x)-0.5)}
                    height={H-16-sy(b.freq)} fill={colors[ni]} opacity={0.8}/>
                ))}
                <polyline points={normPts} fill="none" stroke={C.charcoal} strokeWidth={2} strokeDasharray="3,2"/>
                <line x1={12} y1={H-16} x2={W-8} y2={H-16} stroke={C.charcoal} strokeWidth={1}/>
                <text x={sx(xLo+range*0.05)} y={H-3} fontSize={8} fill={C.gray}>{lo.toFixed(1)}</text>
                <text x={sx(xHi-range*0.05)} y={H-3} textAnchor="end" fontSize={8} fill={C.gray}>{hi.toFixed(1)}</text>
              </svg>
              <div style={{ fontFamily:"Calibri,sans-serif", fontSize:10, marginTop:3, fontWeight:600,
                color: normality>0.72?C.green : normality>0.5?C.amber : C.accent }}>
                {normality>0.72 ? "≈ Normal ✓" : normality>0.5 ? "Converging…" : "Non-normal"}
              </div>
            </div>
          );
        })}
      </div>
      <Note color={C.accent}>
        <strong>Two things happen as n grows:</strong> (1) The histogram shape converges to the dashed normal curve — CLT in action.
        (2) The distribution narrows — SE = σ/√n shrinks. The "n ≥ 30" rule reflects when normality is adequate for moderately
        skewed populations; heavily skewed biomedical data (hospital costs, viral loads) may need n ≥ 100+.
      </Note>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════
// VIZ 4 — SE vs SD
// ═══════════════════════════════════════════════════════════
const SEvsSDViz = () => {
  const [n, setN] = useState(25);
  const trueSig = 40; // LDL SD in mg/dL
  const SE = trueSig / Math.sqrt(n);
  const W=500, H=175;
  const xLo=-130, xHi=130;
  const sx = v => 22 + ((v-xLo)/(xHi-xLo)) * (W-30);
  const sy = (v, maxV) => H-22 - (v/maxV) * (H-32);
  const popMax = normalPDF(0,0,trueSig);
  const popPts = Array.from({length:100},(_,i)=>{
    const x = xLo+(i/99)*(xHi-xLo);
    return `${sx(x)},${sy(normalPDF(x,0,trueSig),popMax)}`;
  }).join(" ");
  const sampPts = Array.from({length:100},(_,i)=>{
    const x = xLo+(i/99)*(xHi-xLo);
    return `${sx(x)},${clamp(sy(normalPDF(x,0,SE),popMax*2.2),5,H-5)}`;
  }).join(" ");

  return (
    <Card title="SE vs SD — The Most Misused Pair in Biomedical Literature"
      subtitle="Standard Deviation describes your data. Standard Error describes your estimate." accent={C.green}>
      <Slider label="Sample size n" value={n} min={5} max={200} onChange={setN} color={C.teal}/>
      <div style={{ marginBottom:12 }}>
        <Badge label="SD (σ)" value={`${trueSig} mg/dL`} color={C.amber}/>
        <Badge label="SE = σ/√n" value={`${SE.toFixed(2)} mg/dL`} color={C.teal}/>
        <Badge label="n to halve SE" value={4*n} color={C.navy}/>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
        {/* Population area */}
        <polyline points={popPts} fill={C.amber} fillOpacity={0.18} stroke={C.amber} strokeWidth={2.5}/>
        {/* Sampling dist area */}
        <polyline points={sampPts} fill={C.teal} fillOpacity={0.22} stroke={C.teal} strokeWidth={2.5}/>
        {/* Centre line */}
        <line x1={sx(0)} y1={8} x2={sx(0)} y2={H-22} stroke={C.charcoal} strokeWidth={1} strokeDasharray="4,3"/>
        <text x={sx(0)} y={H-8} textAnchor="middle" fontSize={10} fill={C.charcoal}>μ</text>
        {/* SD bracket */}
        <line x1={sx(-trueSig)} y1={H-12} x2={sx(trueSig)} y2={H-12} stroke={C.amber} strokeWidth={2}/>
        {[sx(-trueSig),sx(trueSig)].map(x=>
          <line key={x} x1={x} y1={H-16} x2={x} y2={H-8} stroke={C.amber} strokeWidth={2}/>
        )}
        <text x={(sx(-trueSig)+sx(trueSig))/2} y={H-1} textAnchor="middle" fontSize={11} fontWeight="bold" fill={C.amber}>
          ±σ = ±{trueSig} mg/dL
        </text>
        {/* SE bracket */}
        <line x1={sx(-SE)} y1={H-28} x2={sx(SE)} y2={H-28} stroke={C.teal} strokeWidth={2}/>
        {[sx(-SE),sx(SE)].map(x=>
          <line key={x} x1={x} y1={H-32} x2={x} y2={H-24} stroke={C.teal} strokeWidth={2}/>
        )}
        <text x={(sx(-SE)+sx(SE))/2} y={H-36} textAnchor="middle" fontSize={11} fontWeight="bold" fill={C.teal}>
          ±SE = ±{SE.toFixed(1)}
        </text>
        {/* Legend */}
        <rect x={W-160} y={10} width={152} height={50} rx={5} fill="white" stroke={C.lightTeal} strokeWidth={1}/>
        <line x1={W-152} y1={28} x2={W-136} y2={28} stroke={C.amber} strokeWidth={2.5}/>
        <text x={W-130} y={32} fontSize={11} fill={C.charcoal}>SD — spread of data</text>
        <line x1={W-152} y1={48} x2={W-136} y2={48} stroke={C.teal} strokeWidth={2.5}/>
        <text x={W-130} y={52} fontSize={11} fill={C.charcoal}>SE — precision of x̄</text>
      </svg>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:14 }}>
        <div style={{ padding:"10px 14px", background:C.amber+"18", borderLeft:`3px solid ${C.amber}`, borderRadius:4,
          fontFamily:"Calibri,sans-serif", fontSize:12, color:C.charcoal, lineHeight:1.6 }}>
          <strong style={{color:C.amber}}>Standard Deviation (σ)</strong><br/>
          Describes spread of <strong>individual LDL values</strong>.<br/>
          Does NOT change as n increases — 50 or 5,000 patients, individual variation stays ~{trueSig} mg/dL.<br/>
          Use SD to describe your <em>data</em>.
        </div>
        <div style={{ padding:"10px 14px", background:C.teal+"18", borderLeft:`3px solid ${C.teal}`, borderRadius:4,
          fontFamily:"Calibri,sans-serif", fontSize:12, color:C.charcoal, lineHeight:1.6 }}>
          <strong style={{color:C.teal}}>Standard Error (SE = σ/√n)</strong><br/>
          Describes how precisely x̄ <strong>estimates μ</strong>.<br/>
          Current: n={n} → SE={SE.toFixed(1)}. Quadruple n → SE={(SE/2).toFixed(1)} (half).<br/>
          Use SE to describe your <em>estimate</em>.
        </div>
      </div>
      <Note color={C.green}>
        <strong>Literature warning:</strong> A 2005 review found ~40% of high-impact medical journal papers
        reported SE where SD was appropriate — making results look more precise than they are.
        Always ask: "Is this describing the data, or the estimate?"
      </Note>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════
// VIZ 5 — LLN running mean
// ═══════════════════════════════════════════════════════════
const LLNViz = () => {
  const [dist, setDist] = useState("exponential");
  const [traces, setTraces] = useState([]);
  const nMax = 400, nTraces = 5;
  const trueMu  = {exponential:2, uniform:5, normal:5}[dist];
  const trueSig = {exponential:2, uniform:2.89, normal:2}[dist];
  const traceColors = [C.teal, C.amber, C.accent, C.green, "#8B2FC9"];

  const makeTrace = useCallback(() => {
    let sum = 0;
    return Array.from({length:nMax}, (_, i) => {
      const v = dist==="exponential" ? randExp(0.5) : dist==="uniform" ? randUnif(0,10) : randNorm(5,2);
      sum += v;
      return sum / (i+1);
    });
  }, [dist]);

  useEffect(() => { setTraces(Array.from({length:nTraces}, makeTrace)); }, [dist, makeTrace]);

  const W=560, H=180, yLo=trueMu-2.8, yHi=trueMu+2.8;
  const sx = n => 36 + ((n-1)/(nMax-1)) * (W-44);
  const sy = v => H-22 - ((v-yLo)/(yHi-yLo)) * (H-32);

  return (
    <Card title="Law of Large Numbers — Running Mean Convergence"
      subtitle="Every path starts erratic; every path converges to μ — the essence of consistency"
      accent={C.green}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
        {[
          {id:"exponential", label:"Exponential (μ=2, skewed)"},
          {id:"uniform",     label:"Uniform (μ=5, flat)"},
          {id:"normal",      label:"Normal (μ=5)"},
        ].map(d => <Btn key={d.id} onClick={()=>setDist(d.id)} active={dist===d.id} color={C.green}>{d.label}</Btn>)}
        <Btn onClick={()=>setTraces(Array.from({length:nTraces}, makeTrace))} color={C.teal}>↺ New paths</Btn>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
        {[-2,-1,0,1,2].map(d => {
          const v = trueMu+d;
          return (
            <g key={d}>
              <line x1={36} y1={sy(v)} x2={W-6} y2={sy(v)}
                stroke={d===0?C.accent:"#e0e0e0"} strokeWidth={d===0?1.8:0.6}
                strokeDasharray={d===0?"6,3":"3,3"}/>
              <text x={32} y={sy(v)+4} textAnchor="end" fontSize={9}
                fill={d===0?C.accent:C.gray} fontWeight={d===0?"bold":"normal"}>{v}</text>
            </g>
          );
        })}
        <text x={W-8} y={sy(trueMu)-5} textAnchor="end" fontSize={10} fill={C.accent} fontWeight="bold">
          μ = {trueMu}
        </text>
        {/* ±2SE envelope */}
        {(() => {
          const upper = Array.from({length:nMax},(_,i)=>`${sx(i+1)},${clamp(sy(trueMu+2*trueSig/Math.sqrt(i+1)),4,H-4)}`);
          const lower = Array.from({length:nMax},(_,i)=>`${sx(nMax-i)},${clamp(sy(trueMu-2*trueSig/Math.sqrt(nMax-i)),4,H-4)}`);
          return <polygon points={[...upper,...lower].join(" ")} fill={C.teal} fillOpacity={0.07}
            stroke={C.teal} strokeOpacity={0.2} strokeWidth={0.5}/>;
        })()}
        {traces.map((trace, ti) => (
          <polyline key={ti}
            points={trace.map((v,i)=>`${sx(i+1)},${clamp(sy(v),4,H-4)}`).join(" ")}
            fill="none" stroke={traceColors[ti]} strokeWidth={1.8} opacity={0.85}/>
        ))}
        {traces.map((trace, ti) => (
          <circle key={ti} cx={sx(nMax)} cy={clamp(sy(trace[nMax-1]),4,H-4)} r={4} fill={traceColors[ti]}/>
        ))}
        <line x1={36} y1={8} x2={36} y2={H-22} stroke={C.charcoal} strokeWidth={1}/>
        <line x1={36} y1={H-22} x2={W-6} y2={H-22} stroke={C.charcoal} strokeWidth={1}/>
        {[1,50,100,200,300,400].map(v => (
          <g key={v}>
            <line x1={sx(v)} y1={H-22} x2={sx(v)} y2={H-16} stroke={C.charcoal} strokeWidth={1}/>
            <text x={sx(v)} y={H-6} textAnchor="middle" fontSize={9} fill={C.gray}>{v}</text>
          </g>
        ))}
        <text x={(W-36)/2+36} y={H} textAnchor="middle" fontSize={10} fill={C.gray}>Sample size n</text>
        <text x={10} y={H/2} textAnchor="middle" fontSize={10} fill={C.gray}
          transform={`rotate(-90,10,${H/2})`}>Running mean x̄ₙ</text>
      </svg>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
        {traces.map((t,i) => <Badge key={i} label={`Path ${i+1}`} value={t[nMax-1]?.toFixed(3)??"—"} color={traceColors[i]}/>)}
        <Badge label="True μ" value={trueMu} color={C.accent}/>
      </div>
      <Note color={C.green}>
        <strong>LLN vs Gambler's Fallacy:</strong> All five paths converge to μ through <em>dilution</em>, not compensation.
        Early runs of high/low values get swamped by later data — the coin has no memory. Hit "↺ New paths" to see different
        random walks — they all end near μ. Shaded band = ±2·SE = ±2σ/√n, narrowing as 1/√n.
      </Note>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════
// VIZ 6 — Confidence Intervals
// ═══════════════════════════════════════════════════════════
const CIViz = () => {
  const [nCI, setNCI]   = useState(60);
  const [conf, setConf] = useState(0.95);
  const [n, setN]       = useState(30);
  const [CIs, setCIs]   = useState([]);
  const trueMu = 100, trueSig = 15;

  const generate = useCallback(() => {
    const z = {0.90:1.645, 0.95:1.96, 0.99:2.576}[conf] || 1.96;
    const se = trueSig / Math.sqrt(n);
    setCIs(Array.from({length:nCI}, () => {
      const xbar = trueMu + randNorm(0, se);
      return { xbar, lo:xbar-z*se, hi:xbar+z*se, covers: xbar-z*se<=trueMu && trueMu<=xbar+z*se };
    }));
  }, [nCI, conf, n]);

  useEffect(() => { generate(); }, [generate]);

  const covering = CIs.filter(c=>c.covers).length;
  const coverage = CIs.length ? (covering/CIs.length*100).toFixed(0) : "—";
  const targetPct = (conf*100).toFixed(0);
  const SVG_W=360, ROW_H=7.5, SVG_H=nCI*ROW_H+30;
  const xLo=trueMu-36, xHi=trueMu+36;
  const sx = v => 22 + ((v-xLo)/(xHi-xLo)) * (SVG_W-30);

  return (
    <Card title="Confidence Intervals — What Does 95% Actually Mean?"
      subtitle="Each horizontal line is one CI from a different random sample. How many capture μ?"
      accent={C.navy}>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:16 }}>
        <div style={{ flex:1, minWidth:180 }}>
          <Slider label="Confidence level" value={conf} min={0.90} max={0.99} step={0.05}
            onChange={setConf} color={C.navy} fmt={v=>`${(v*100).toFixed(0)}%`}/>
          <Slider label="Sample size n" value={n} min={5} max={100} onChange={setN} color={C.teal}/>
          <Slider label="Number of CIs" value={nCI} min={20} max={100} step={5} onChange={setNCI} color={C.gray}/>
          <Btn onClick={generate} color={C.teal}>↺ New samples</Btn>
        </div>
        <div style={{ flex:1, minWidth:160 }}>
          <div style={{ background:C.offWhite, borderRadius:8, padding:12 }}>
            <div style={{ fontFamily:"Calibri,sans-serif", fontSize:11, color:C.gray,
              textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Results</div>
            <Badge label="Claimed" value={`${targetPct}%`} color={C.navy}/>
            <Badge label="Actual coverage" value={`${coverage}%`}
              color={Math.abs(Number(coverage)-Number(targetPct))<8?C.green:C.accent}/>
            <Badge label="Misses (red)" value={nCI-covering} color={C.accent}/>
            <div style={{ fontFamily:"Calibri,sans-serif", fontSize:11, color:C.gray, lineHeight:1.5, marginTop:8 }}>
              μ = {trueMu} mg/dL (true blood glucose)<br/>
              σ = {trueSig} &nbsp;|&nbsp; SE = {(trueSig/Math.sqrt(n)).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
      <div style={{ overflowY:"auto", maxHeight:480, borderRadius:8, border:`1px solid ${C.lightTeal}` }}>
        <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
          <line x1={sx(trueMu)} y1={0} x2={sx(trueMu)} y2={SVG_H}
            stroke={C.accent} strokeWidth={1.5} strokeDasharray="5,3"/>
          <text x={sx(trueMu)} y={12} textAnchor="middle" fontSize={10} fill={C.accent} fontWeight="bold">
            μ={trueMu}
          </text>
          {CIs.map((ci, i) => {
            const y = 22 + i*ROW_H + ROW_H/2;
            const col = ci.covers ? C.teal : C.accent;
            return (
              <g key={i}>
                <line x1={clamp(sx(ci.lo),4,SVG_W-4)} y1={y}
                  x2={clamp(sx(ci.hi),4,SVG_W-4)} y2={y}
                  stroke={col} strokeWidth={ROW_H*0.6} opacity={0.8}/>
                <circle cx={clamp(sx(ci.xbar),4,SVG_W-4)} cy={y} r={ROW_H*0.45} fill={col}/>
              </g>
            );
          })}
          <line x1={22} y1={SVG_H-8} x2={SVG_W-8} y2={SVG_H-8} stroke={C.charcoal} strokeWidth={1}/>
          {[xLo, trueMu-20, trueMu, trueMu+20, xHi].map(v => (
            <g key={v}>
              <line x1={sx(v)} y1={SVG_H-12} x2={sx(v)} y2={SVG_H-8} stroke={C.charcoal}/>
              <text x={sx(v)} y={SVG_H-1} textAnchor="middle" fontSize={8} fill={C.gray}>{v}</text>
            </g>
          ))}
        </svg>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:14 }}>
        <div style={{ padding:"10px 14px", background:C.green+"18", borderLeft:`3px solid ${C.green}`, borderRadius:4,
          fontFamily:"Calibri,sans-serif", fontSize:12, color:C.charcoal, lineHeight:1.65 }}>
          <strong style={{color:C.green}}>✓ Correct interpretation</strong><br/>
          "If we repeated this procedure many times, {targetPct}% of intervals constructed this way
          would contain μ." The <em>interval</em> is random; μ is fixed.
        </div>
        <div style={{ padding:"10px 14px", background:C.accent+"12", borderLeft:`3px solid ${C.accent}`, borderRadius:4,
          fontFamily:"Calibri,sans-serif", fontSize:12, color:C.charcoal, lineHeight:1.65 }}>
          <strong style={{color:C.accent}}>✗ Common misconception</strong><br/>
          "There is a {targetPct}% probability that μ is in this interval." μ is a fixed constant —
          once computed, the CI either covers μ or it doesn't. There is no probability left to assign.
        </div>
      </div>
      <Note color={C.navy}>
        <strong>Width factors (move the sliders):</strong> Higher confidence (90→99%) widens intervals — more certainty needs
        more room. Larger n narrows intervals — SE = σ/√n decreases. σ is fixed by the population.
        To halve the width you must quadruple n — precision is expensive.
      </Note>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════
const VIZZES = [
  { id:"bv",   label:"Bias & Variance",         comp: <BiasVarianceViz/> },
  { id:"sd",   label:"Sampling Distributions",  comp: <SamplingDistViz/> },
  { id:"clt",  label:"CLT Convergence",         comp: <CLTViz/> },
  { id:"sese", label:"SE vs SD",                comp: <SEvsSDViz/> },
  { id:"lln",  label:"Law of Large Numbers",    comp: <LLNViz/> },
  { id:"ci",   label:"Confidence Intervals",    comp: <CIViz/> },
];

export default function App() {
  const [active, setActive] = useState("all");
  return (
    <div style={{ minHeight:"100vh", background:C.offWhite }}>
      <div style={{ background:C.navy, padding:"18px 28px", borderBottom:`4px solid ${C.teal}` }}>
        <div style={{ fontFamily:"Georgia,serif", fontSize:21, fontWeight:700, color:"white" }}>
          BMI 6106 — Estimation I: Interactive Figures
        </div>
        <div style={{ fontFamily:"Calibri,sans-serif", fontSize:13, color:C.lightTeal, marginTop:3 }}>
          Biomedical Informatics Statistics · University of Utah
        </div>
      </div>
      <div style={{ background:"white", padding:"10px 28px", display:"flex", flexWrap:"wrap", gap:5,
        borderBottom:`1px solid ${C.lightTeal}`, position:"sticky", top:0, zIndex:10 }}>
        <Btn onClick={()=>setActive("all")} active={active==="all"} color={C.navy}>All Figures</Btn>
        {VIZZES.map(v => <Btn key={v.id} onClick={()=>setActive(v.id)} active={active===v.id} color={C.teal}>{v.label}</Btn>)}
      </div>
      <div style={{ maxWidth:940, margin:"0 auto", padding:"24px 20px" }}>
        {active==="all" ? VIZZES.map(v=><div key={v.id}>{v.comp}</div>) : VIZZES.find(v=>v.id===active)?.comp}
      </div>
      <div style={{ background:C.charcoal, padding:"12px 28px", textAlign:"center",
        fontFamily:"Calibri,sans-serif", fontSize:11, color:C.gray }}>
        All simulations run live in-browser. Adjust sliders and press ↺ to regenerate.
        Distributions: Exponential λ=0.5 (μ=2), Uniform(0,10) (μ=5), Bimodal N(3,.7)+N(8,.7), Normal(5,1.5).
      </div>
    </div>
  );
}

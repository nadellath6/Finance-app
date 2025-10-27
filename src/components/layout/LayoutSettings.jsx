import React from "react";

const STORAGE_KEY = "layoutSettingsV1";

function applyVars(vars) {
  const root = document.documentElement;
  const setOrClear = (name, val) => {
    if (val === "" || val === null || typeof val === "undefined") {
      root.style.removeProperty(name);
    } else {
      const num = Number(val);
      if (Number.isFinite(num)) root.style.setProperty(name, `${num}mm`);
    }
  };
  setOrClear("--top-right-right", vars.topRightRight);
  setOrClear("--title-left", vars.titleLeft);
  setOrClear("--sig-gap", vars.sigGap);
  setOrClear("--dual-gap", vars.dualGap);
}

export default function LayoutSettings(){
  const [open, setOpen] = React.useState(false);
  const [topRightRight, setTopRightRight] = React.useState("");
  const [titleLeft, setTitleLeft] = React.useState("");
  const [sigGap, setSigGap] = React.useState("");
  const [dualGap, setDualGap] = React.useState("");

  // load saved
  React.useEffect(() => {
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setTopRightRight(saved.topRightRight ?? "");
        setTitleLeft(saved.titleLeft ?? "");
        setSigGap(saved.sigGap ?? "");
        setDualGap(saved.dualGap ?? "");
        applyVars(saved);
      }
    }catch{}
  }, []);

  const saveAndApply = (next) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    applyVars(next);
  };

  const onChange = (key) => (e) => {
    const v = e.target.value;
    const next = { topRightRight, titleLeft, sigGap, dualGap, [key]: v };
    if (key === "topRightRight") setTopRightRight(v);
    if (key === "titleLeft") setTitleLeft(v);
    if (key === "sigGap") setSigGap(v);
    if (key === "dualGap") setDualGap(v);
    saveAndApply(next);
  };

  const reset = () => {
    setTopRightRight("");
    setTitleLeft("");
    setSigGap("");
    setDualGap("");
    localStorage.removeItem(STORAGE_KEY);
    applyVars({});
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(o=>!o)}
        title="Pengaturan Tata Letak"
        style={{position:'fixed', left:16, bottom:16, zIndex:1100, borderRadius:20, padding:'8px 10px', background:'#6c757d', color:'#fff', border:'none', boxShadow:'0 2px 6px rgba(0,0,0,0.15)'}}
      >⚙️ Tata Letak</button>
      {open && (
        <div style={{position:'fixed', left:16, bottom:64, zIndex:1100, background:'#fff', border:'1px solid #e5e5e5', borderRadius:8, padding:12, width:280, boxShadow:'0 8px 24px rgba(0,0,0,0.15)'}}>
          <div style={{fontWeight:600, marginBottom:8}}>Pengaturan Tata Letak</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 84px', gap:8, alignItems:'center'}}>
            <label>Posisi Kanan-Atas (mm)</label>
            <input type="number" step="1" value={topRightRight} onChange={onChange('topRightRight')} style={{padding:'6px 8px', border:'1px solid #ccc', borderRadius:4}} />
            <label>Geser Judul (mm)</label>
            <input type="number" step="1" value={titleLeft} onChange={onChange('titleLeft')} style={{padding:'6px 8px', border:'1px solid #ccc', borderRadius:4}} />
            <label>Jarak Tanda Tangan (mm)</label>
            <input type="number" step="1" value={sigGap} onChange={onChange('sigGap')} style={{padding:'6px 8px', border:'1px solid #ccc', borderRadius:4}} />
            <label>Jarak Antar Salinan (mm)</label>
            <input type="number" step="1" value={dualGap} onChange={onChange('dualGap')} style={{padding:'6px 8px', border:'1px solid #ccc', borderRadius:4}} />
          </div>
          <div style={{display:'flex', justifyContent:'space-between', marginTop:12}}>
            <button type="button" onClick={reset} className="btn btn-sm btn-outline-secondary">Reset</button>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-sm btn-secondary">Tutup</button>
          </div>
        </div>
      )}
    </>
  );
}

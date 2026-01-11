import React, { useState, useEffect, useMemo, useCallback } from 'react';
// URL Google Apps Script
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxbbs_hgxvTmnCWomqETbN0PgZ3li1haBnBAJIm2VNGEFSdRF9jHvTuBS6rcwSMsFtrNQ/exec"; 


const BRANCHES = ["โรงอัดรังสิต", "โรงอัด DC.วังน้อย", "โรงอัดเชียงใหม่", "โรงอัดสายไหม", "โรงอัดพานทอง", "โรงอัดพานทอง 2", "โรงอัดระยอง", "โรงอัดปทุมธานี", "โรงอัดอยุธยา", "โรงอัดบางบัวทอง", "โรงอัดเพชรบุรี", "โรงอัดโคราช", "โรงอัดขอนแก่น", "โรงอัดอุดรธานี", "โรงอัดหาดใหญ่", "โรงอัดพัทยา", "โรงอัดศรีนครินทร์", "โรงอัดมีนบุรี", "โรงอัดบ่อวิน1", "โรงอัดบ่อวิน2", "โรงอัดปิ่นทอง", "โรงอัดบางใหญ่"];

// นิยามประเภทหลัก - แยกสีให้ชัดเจนตามประเภท
const MAIN_CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด', icon: '📦', badge: 'bg-slate-100 text-slate-600' },
  { id: 'internal', label: 'ยาใช้ภายใน', icon: '💊', color: 'text-emerald-700', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' },
  { id: 'external', label: 'ยาใช้ภายนอก', icon: '🧴', color: 'text-blue-700', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
  { id: 'supplies', label: 'เวชภัณฑ์', icon: '🩹', color: 'text-amber-700', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' }
];

const SYMPTOMS_QUIZ = [
  { id: 1, question: "คุณมีไข้ หรือตัวร้อนร่วมด้วยไหม?", options: [{ label: "มีไข้", next: 2 }, { label: "ไม่มีไข้", next: 3 }] },
  { id: 2, question: "คุณต้องขับรถ หรือทำงานที่ต้องใช้สมาธิสูงไหม?", options: [{ label: "ใช่ ต้องใช้สมาธิ/ขับรถ", next: 'result', recommendation: 'ยาพาราเซตามอล', note: 'เลือกยาพาราฯ เพื่อไม่ให้ง่วงนอนขณะทำงาน' }, { label: "ไม่ พักผ่อนได้", next: 'result', recommendation: 'ทิฟฟี่ / ดีคอลเจน', note: 'ใช้ยาสูตรผสมได้แต่จะทำให้ง่วง' }] },
  { id: 3, question: "อาการหลักตอนนี้คืออะไร?", options: [{ label: "คันผิวหนัง / แมลงกัด", next: 'result', recommendation: 'คาราไมน์ / ยาทาแก้คัน' }, { label: "จาม / น้ำมูก (แต่ทำงานต่อ)", next: 'result', recommendation: 'ยาแก้แพ้ชนิดไม่ง่วง' }, { label: "ปวดฟันอย่างมาก", next: 'result', recommendation: 'ยาพาราเซตามอล' }, { label: "ท้องอืด / แแสบท้อง", next: 4 }, { label: "ท้องเสีย / ถ่ายเหลว", next: 5 }, { label: "เวียนหัว / หน้ามืด", next: 6 }, { label: "ปวดเมื่อยกล้ามเนื้อ", next: 7 }, { label: "ระคายเคืองตา / ฝุ่นเข้าตา", next: 8 }] },
  { id: 4, question: "ลักษณะอาการท้องอืดของคุณเป็นแบบไหน?", options: [{ label: "แน่นท้อง/มวนท้อง (แบบน้ำ)", next: 'result', recommendation: 'ยาธาตุน้ำขาว (กระต่ายบิน)' }, { label: "แสบท้อง/มีลมมาก (แบบเคี้ยว)", next: 'result', recommendation: 'แอนตาซิล / แอร์-เอ็กซ์' }] },
  { id: 5, question: "คุณต้องการเน้นรักษาแบบไหน?", options: [{ label: "หยุดถ่าย/ดูดซับสารพิษ", next: 'result', recommendation: 'ยาผงถ่าน (คาร์บอน)', note: 'ควรทานผงถ่านเพื่อดูดซับเชื้อโรค และทานเกลือแร่ควบคู่กัน' }, { label: "ชดเชยน้ำ (ป้องกันอ่อนเพลีย)", next: 'result', recommendation: 'ผงเกลือแร่ (ORS)', note: 'เน้นจิบเกลือแร่เรื่อยๆ เพื่อป้องกันอาการขาดน้ำ' }] },
  { id: 6, question: "ต้องการการปฐมพยาบาลแบบไหน?", options: [{ label: "ยาดมพกพาสะดวก", next: 'result', recommendation: 'ยาดมแก้วิงเวียน' }, { label: "หน้ามืดเป็นลม รุนแรง", next: 'result', recommendation: 'แอมโมเนียหอม' }] },
  { id: 7, question: "ปวดมานานแค่ไหนแล้ว?", options: [{ label: "ปวดทันที / บาดเจ็บใหม่ๆ", next: 'result', recommendation: 'เคาน์เตอร์เพน สีแดง (สูตรร้อน)' }, { label: "ปวดมาสักพัก / เรื้อรัง / มีบวม", next: 'result', recommendation: 'เคาน์เตอร์เพน สีฟ้า (สูตรเย็น)' }] },
  { id: 8, question: "อาการที่ตาของคุณเป็นอย่างไร?", options: [{ label: "ฝุ่นเข้าตา / ต้องการล้างตา", next: 'result', recommendation: 'น้ำยาล้างตาออฟซ่า' }, { label: "คันตา / ตาแดงจากอาการแพ้", next: 'result', recommendation: 'ยาแก้แพ้ระคายเคืองตา' }] }
];

const FIRST_AID_DATA = [
  {
    title: "บาดแผลสด / มีเลือดออก",
    icon: "🩸",
    steps: [
      "ใช้ผ้าสะอาดกดแผลให้เลือดหยุดไหล (ประมาณ 5-10 นาที)",
      "ล้างแผลด้วยน้ำสะอาดหรือน้ำเกลือปราศจากเชื้อ",
      "เช็ดรอบแผลด้วยแอลกอฮอล์ หรือน้ำยาฆ่าเชื้อ",
      "ปิดแผลด้วยพลาสเตอร์หรือผ้าก๊อซสะอาด"
    ],
    youtubeUrl: "https://www.youtube.com/results?search_query=วิธีปฐมพยาบาล+แผลสด" 
  },
  {
    title: "เลือดกำเดาไหล",
    icon: "👃",
    steps: [
      "ให้นั่งนิ่งๆ และก้มหน้าลงเล็กน้อย (ห้ามเงยหน้าเด็ดขาด)",
      "ใช้นิ้วชี้และนิ้วหัวแม่มือบีบจมูกทั้งสองข้างไว้ 5-10 นาที",
      "หายใจทางปากแทนในระหว่างที่บีบจมูก",
      "ใช้แผ่นประคบเย็นวางบนสันจมูกหรือหน้าผาก"
    ],
    youtubeUrl: "https://www.youtube.com/results?search_query=วิธีปฐมพยาบาล+เลือดกำเดาไหล"
  },
  {
    title: "ไฟไหม้ / น้ำร้อนลวก",
    icon: "🔥",
    steps: [
      "ล้างด้วยน้ำสะอาดอุณหภูมิห้อง 10-20 นาที (ห้ามใช้น้ำแข็ง)",
      "ห้ามใช้ยาสีฟันหรือน้ำมันทาบริเวณแผล",
      "หากมีตุ่มพอง ห้ามเจาะตุ่มพองให้แตกเองเด็ดขาด",
      "ปิดแผลด้วยผ้าสะอาดและรีบไปพบแพทย์หากแผลมีขนาดใหญ่"
    ],
    youtubeUrl: "https://www.youtube.com/results?search_query=วิธีปฐมพยาบาล+ไฟไหม้น้ำร้อนลวก"
  },
  {
    title: "เป็นลม / หน้ามืด",
    icon: "🌀",
    steps: [
      "ให้นอนราบและหนุนขาสูงกว่าระดับหัวใจ",
      "คลายเสื้อผ้าที่รัดแน่นให้หลวม",
      "ใช้พัดช่วยโบก และให้ดมยาดมหรือแอมโมเนีย",
      "หากไม่ดีขึ้นใน 5 นาที หรือหมดสติ ให้โทร 1669"
    ],
    youtubeUrl: "https://www.youtube.com/results?search_query=วิธีปฐมพยาบาล+เป็นลม"
  },
  {
    title: "การช่วยชีวิตขั้นพื้นฐาน (CPR)",
    icon: "💓",
    steps: [
      "ตรวจสอบสติและการหายใจ หากไม่ตอบสนองให้โทร 1669 ทันที",
      "วางสันมือข้างหนึ่งไว้กลางหน้าอก (ระดับราวนม)",
      "กดหน้าอกให้ลึกอย่างน้อย 2 นิ้ว จังหวะ 100-120 ครั้งต่อนาที",
      "ทำต่อเนื่องจนกว่าหน่วยกู้ชีพจะมาถึง"
    ],
    youtubeUrl: "https://www.youtube.com/results?search_query=วิธีทำ+CPR+เบื้องต้น"
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [selectedBranch, setSelectedBranch] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  
  const [medicineMaster, setMedicineMaster] = useState([]);
  const [inventory, setInventory] = useState({});

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState('all');
  const [showManageMode, setShowManageMode] = useState(false);
  const [editValues, setEditValues] = useState({ count: 0, expiry: "" });
  
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showBlessing, setShowBlessing] = useState(false); 

  const [checkerStep, setCheckerStep] = useState(1);
  const [checkerResult, setCheckerResult] = useState(null);

  // ฟังก์ชันตรวจสอบสถานะวันหมดอายุ
  const getExpiryStatus = useCallback((expiryStr) => {
    if (!expiryStr || expiryStr === "-" || !expiryStr.includes('/')) return "normal";
    try {
      const parts = expiryStr.split('/');
      const month = parseInt(parts[0]);
      const yearShort = parseInt(parts[1]);
      if (isNaN(month) || isNaN(yearShort)) return "normal";
      const fullYear = 2000 + yearShort;
      const expiryDate = new Date(fullYear, month, 0); 
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate < today) return "expired";
      const diffTime = expiryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 90) return "warning";
      return "normal";
    } catch (e) {
      return "normal";
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('savedBranch');
    if (saved) {
      setSelectedBranch(saved);
      setIsConfirmed(true);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!SHEET_API_URL) return;
    setFetchLoading(true);
    try {
      const response = await fetch(SHEET_API_URL);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (data.master) setMedicineMaster(data.master);
      if (data.inventory) setInventory(data.inventory);
    } catch (e) { 
      console.error("API Error:", e);
    } finally { 
      setFetchLoading(false); 
    }
  }, []);

  useEffect(() => { 
    if (isConfirmed) fetchData(); 
  }, [isConfirmed, fetchData]);

  useEffect(() => {
    if (selectedMed) {
      const key = `${selectedBranch}_${selectedMed.id}`;
      const stock = inventory[key] || { count: 0, expiry: "-" };
      setEditValues({ 
        count: parseInt(stock.count) || 0, 
        expiry: stock.expiry && stock.expiry !== '-' ? String(stock.expiry) : "" 
      });
    }
  }, [selectedMed, selectedBranch, inventory]);

  const performUpdate = async (medId, newCount, newExpiry, actionType) => {
    if (!selectedBranch || !medId) return;
    setLoading(true);
    const updatedCount = Math.max(0, parseInt(newCount) || 0);
    const key = `${selectedBranch}_${medId}`;
    const cleanExpiry = String(newExpiry || "-").trim();

    // Optimistic Update
    setInventory(prev => ({ 
      ...prev, 
      [key]: { count: updatedCount, expiry: cleanExpiry } 
    }));

    if (SHEET_API_URL) {
      try {
        await fetch(SHEET_API_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            branch: selectedBranch, 
            medId, 
            count: updatedCount, 
            expiry: cleanExpiry, 
            action: actionType 
          })
        });
        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
          setSelectedMed(null);
          setShowManageMode(false);
        }, 1200);
      } catch (e) { 
        console.error("Save Error:", e);
        fetchData();
      }
    }
    setLoading(false);
  };

  const handleCheckerOption = (opt) => {
    if (opt.next === 'result') {
      setCheckerResult({ med: opt.recommendation, note: opt.note });
    } else {
      setCheckerStep(opt.next);
    }
  };

  const filteredMeds = useMemo(() => {
    return (medicineMaster || []).filter(m => {
      const matchesSearch = (m.brand || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (m.category || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = currentCategoryFilter === 'all' || m.mainType === currentCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [medicineMaster, searchTerm, currentCategoryFilter]);

  const handleBranchConfirm = () => {
    if (selectedBranch) {
      localStorage.setItem('savedBranch', selectedBranch);
      setIsConfirmed(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('savedBranch');
    setSelectedBranch("");
    setIsConfirmed(false);
  };

  if (!isConfirmed && !isAdmin) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] mx-auto mb-8 flex items-center justify-center shadow-xl shadow-emerald-100/50 text-4xl">💊</div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight uppercase">Recycling Med-Care</h1>
        <p className="text-emerald-600 font-bold text-[10px] mb-12 uppercase tracking-[0.2em]">Pharma Systems Recycling Operation</p>
        <div className="space-y-4 w-full max-w-sm">
          <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="w-full h-16 bg-slate-50 border-2 border-slate-50 p-4 px-6 rounded-2xl font-bold text-lg text-slate-700 outline-none focus:border-emerald-300 transition-all appearance-none">
            <option value="" disabled>เลือกโรงอัดของคุณ...</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <button onClick={handleBranchConfirm} disabled={!selectedBranch} className={`w-full h-16 rounded-2xl font-extrabold text-xl transition-all ${selectedBranch ? 'bg-emerald-600 text-white active:scale-95 shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-300'}`}>เข้าใช้งาน</button>
        </div>
        <button onClick={() => setIsAdmin(true)} className="mt-12 text-slate-300 text-[10px] font-black uppercase tracking-[0.3em] hover:text-emerald-400 transition-colors">Admin Settings</button>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => setIsAdmin(false)} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-600 active:scale-90 transition-all">{"< ย้อนกลับ"}</button>
          <h2 className="font-extrabold text-slate-800 text-lg">รายการยาทั้งหมด</h2>
        </header>
        <div className="space-y-3 max-w-lg mx-auto">
          {(medicineMaster || []).map(m => (
            <div key={m.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center gap-5 shadow-sm">
              <div className={`w-14 h-14 rounded-2xl ${m.theme || 'bg-slate-100'} flex items-center justify-center text-2xl shadow-inner`}>{m.emoji || '📦'}</div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-base">{m.brand}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{m.id} • {m.mainType === 'internal' ? 'ยาใช้ภายใน' : m.mainType === 'external' ? 'ยาใช้ภายนอก' : 'เวชภัณฑ์'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50/20 pb-32">
      <header className="bg-white border-b border-emerald-100 px-6 py-6 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md text-sm">🏥</div>
          <div>
            <p className="text-[13px] font-black text-emerald-700 uppercase tracking-tight leading-tight mb-0.5">{selectedBranch}</p>
            <h1 className="text-[10px] font-bold text-slate-400 tracking-tight leading-none uppercase">Pharma System Recycling Operation</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} disabled={fetchLoading} className="p-2.5 rounded-lg border border-slate-100 bg-white text-emerald-500 active:scale-90 transition-all disabled:opacity-50">
            <div className={fetchLoading ? "animate-spin" : ""}>🔃</div>
          </button>
          <button onClick={handleLogout} className="p-2.5 rounded-lg border border-rose-50 bg-rose-50/30 text-rose-400 active:scale-90 transition-all">❌</button>
        </div>
      </header>

      <main className="p-6 max-w-lg mx-auto">
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex gap-3">
              <input type="text" placeholder="🔍 ค้นหายาหรือเวชภัณฑ์..." className="w-full h-14 bg-white border border-emerald-100 p-4 rounded-2xl text-base font-bold text-slate-700 outline-none shadow-sm focus:ring-4 focus:ring-emerald-50 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <button onClick={() => setIsAdmin(true)} className="w-14 h-14 bg-white border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">📂</button>
            </div>

            <div className="flex overflow-x-auto gap-2 pb-2 -mx-1 px-1 no-scrollbar">
              {MAIN_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCurrentCategoryFilter(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap text-xs font-black uppercase transition-all border ${
                    currentCategoryFilter === cat.id 
                    ? `${cat.bg} border-emerald-200 ${cat.color} shadow-sm ring-2 ring-emerald-50` 
                    : 'bg-white border-slate-100 text-slate-400'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid gap-4">
              {medicineMaster.length > 0 ? (
                filteredMeds.map(med => {
                  const stock = inventory[`${selectedBranch}_${med.id}`] || { count: 0, expiry: '-' };
                  const isLow = stock.count <= 3 && stock.count > 0;
                  const isEmpty = stock.count <= 0;
                  const expStatus = getExpiryStatus(stock.expiry);
                  const catInfo = MAIN_CATEGORIES.find(c => c.id === med.mainType) || MAIN_CATEGORIES[0];

                  return (
                    <button key={med.id} onClick={() => setSelectedMed(med)} className="bg-white p-5 rounded-[2.2rem] border border-emerald-50 flex items-center gap-5 text-left active:scale-[0.98] transition-all shadow-sm group">
                      <div className={`w-14 h-14 rounded-2xl ${med.theme || 'bg-slate-50'} flex items-center justify-center text-2xl group-active:scale-90 transition-transform shadow-inner relative`}>
                        {med.emoji || '📦'}
                        <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${catInfo.bg} flex items-center justify-center text-[10px] shadow-sm border border-white`}>
                          {catInfo.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-800 text-base leading-tight">{med.brand}</h3>
                          <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase shrink-0 ${catInfo.badge}`}>
                            {catInfo.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${isEmpty ? 'text-rose-500' : (isLow ? 'text-amber-500' : 'text-emerald-600')}`}>
                            คงเหลือ: {stock.count}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-tighter ${
                            expStatus === 'expired' ? 'text-rose-600 bg-rose-50 px-1 rounded' : 
                            expStatus === 'warning' ? 'text-amber-500 bg-amber-50 px-1 rounded' : 'text-slate-400'
                          }`}>
                            หมดอายุ: {stock.expiry} {expStatus === 'expired' ? '⚠️' : ''}
                          </span>
                        </div>
                      </div>
                      <span className="text-slate-200">
                         <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">›</div>
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-emerald-100">
                  <p className="text-slate-400 font-bold text-sm">{fetchLoading ? "กำลังเชื่อมข้อมูลเซิร์ฟเวอร์..." : "❌ ไม่พบรายการที่คุณต้องการ"}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'checker' && (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-emerald-100">
            {!checkerResult ? (
              <div className="space-y-6">
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">Medical Assessment</span>
                <h3 className="text-2xl font-extrabold text-slate-800 leading-tight tracking-tight">{SYMPTOMS_QUIZ.find(s=>s.id===checkerStep)?.question}</h3>
                <div className="grid gap-3">
                  {SYMPTOMS_QUIZ.find(s=>s.id===checkerStep)?.options.map((opt, i) => (
                    <button key={i} onClick={() => handleCheckerOption(opt)} className="w-full p-5 rounded-2xl border-2 border-emerald-50 bg-emerald-50/20 hover:border-emerald-200 text-left font-bold text-slate-700 active:scale-95 transition-all">{opt.label}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6 py-4">
                <div className="text-5xl mb-4">🩺</div>
                <h4 className="text-[11px] font-black text-slate-400 uppercase mb-1">ผลการประเมินเบื้องต้น</h4>
                <p className="text-3xl font-black text-emerald-700">{checkerResult.med}</p>
                <p className="text-sm text-slate-500 bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100">{checkerResult.note || 'กรุณาตรวจสอบวิธีการใช้ที่ข้างบรรจุภัณฑ์ทุกครั้ง'}</p>
                <div className="space-y-3 pt-4">
                  <button onClick={() => { setActiveTab('inventory'); setSearchTerm(checkerResult.med); setCheckerResult(null); setCheckerStep(1); }} className="w-full py-5 bg-emerald-600 text-white font-bold rounded-3xl shadow-lg active:scale-95 transition-transform">ตรวจสอบสต็อกยา</button>
                  <button onClick={() => { setCheckerStep(1); setCheckerResult(null); }} className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-3xl text-sm transition-all">ทำแบบประเมินใหม่</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="space-y-6">
            <div className="bg-teal-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-teal-100">
              <h2 className="text-2xl font-black uppercase leading-none">First Aid<br/>Pro-Guide</h2>
              <div className="absolute -right-4 -bottom-4 text-6xl opacity-20 rotate-12">🩹</div>
            </div>
            <div className="space-y-4">
              {FIRST_AID_DATA.map((item, idx) => (
                <div key={idx} className="bg-white rounded-[2rem] p-6 border border-emerald-50 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">{item.icon}</div>
                    <h3 className="font-extrabold text-slate-800 text-lg">{item.title}</h3>
                  </div>
                  <div className="space-y-3">
                    {item.steps.map((step, sIdx) => (
                      <div key={sIdx} className="flex gap-3 items-start">
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-[10px] font-black text-emerald-600 shrink-0 mt-0.5">{sIdx + 1}</div>
                        <p className="text-sm text-slate-600 font-medium leading-snug">{step}</p>
                      </div>
                    ))}
                  </div>
                  {item.youtubeUrl && (
                    <div className="mt-5 pt-4 border-t border-slate-50">
                      <a href={item.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-teal-50 text-teal-700 rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all">
                        <span>▶️</span> เรียนรู้วิธีจากวิดีโอ
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {selectedMed && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { if(!showSuccessToast && !showBlessing && !loading) setSelectedMed(null); }}></div>
          <div className="bg-white w-full max-w-lg rounded-t-[3.5rem] p-10 relative shadow-2xl z-10 min-h-[50vh]">
            
            {showSuccessToast && (
              <div className="absolute inset-0 bg-white z-30 flex flex-col items-center justify-center rounded-t-[3.5rem]">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-4 shadow-xl text-4xl animate-bounce">✔️</div>
                <h4 className="text-2xl font-black text-emerald-600">ทำรายการสำเร็จ</h4>
                <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest text-center">อัปเดตฐานข้อมูลคลังยาแล้ว</p>
              </div>
            )}

            {showBlessing && (
              <div className="absolute inset-0 bg-white z-40 flex flex-col items-center justify-center rounded-t-[3.5rem] p-10">
                <div className="text-7xl mb-6 animate-pulse">💚</div>
                <h4 className="text-3xl font-black text-slate-900 text-center mb-2">ขอให้หายไวๆ นะครับ</h4>
                <p className="text-slate-500 font-bold text-base text-center leading-relaxed mb-8">เราเป็นห่วงคุณเสมอ<br/>รักษาสุขภาพด้วยนะครับ</p>
                <button onClick={() => { setShowBlessing(false); setSelectedMed(null); }} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-transform">ขอบคุณครับ</button>
              </div>
            )}

            <button onClick={() => { if(!loading) { setSelectedMed(null); setShowManageMode(false); } }} className="absolute top-8 right-8 p-2 bg-slate-50 rounded-full text-slate-300 disabled:opacity-50" disabled={loading}>❌</button>
            
            <div className="flex flex-col items-center text-center mb-8">
              <div className={`w-20 h-20 rounded-[1.8rem] ${selectedMed.theme || 'bg-slate-100'} flex items-center justify-center text-4xl mb-4 shadow-lg border-4 border-white`}>{selectedMed.emoji || '📦'}</div>
              <h3 className="font-extrabold text-2xl text-slate-900 tracking-tight">{selectedMed.brand}</h3>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">{selectedMed.category}</p>
            </div>

            {!showManageMode ? (
              <div className="space-y-6">
                {getExpiryStatus(editValues.expiry) === 'expired' && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                    <span className="text-2xl">⚠️</span>
                    <p className="text-rose-600 text-xs font-black uppercase">ยานี้หมดอายุแล้ว ห้ามใช้งานเด็ดขาด!</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-center">
                    <span className="text-[9px] font-black text-emerald-600 uppercase block mb-1">คงเหลือในตู้</span>
                    <p className="text-xl font-black text-slate-800">{editValues.count}</p>
                  </div>
                  <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 text-center">
                    <span className="text-[9px] font-black text-rose-400 uppercase block mb-1">วันหมดอายุ</span>
                    <p className="text-xl font-black text-slate-800">{editValues.expiry || '-'}</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  {/* ปุ่มเบิกยา - เพิ่มสถานะโหลด */}
                  <button 
                    disabled={loading || editValues.count <= 0 || showSuccessToast || getExpiryStatus(editValues.expiry) === 'expired'} 
                    onClick={() => performUpdate(selectedMed.id, editValues.count - 1, editValues.expiry, 'take')} 
                    className={`w-full h-16 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-md ${
                      (editValues.count > 0 && getExpiryStatus(editValues.expiry) !== 'expired' && !loading) ? 'bg-emerald-600 text-white active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>กำลังบันทึกการเบิกยา...</span>
                      </>
                    ) : (
                      <span>✔️ บันทึกการเบิกยา</span>
                    )}
                  </button>

                  {/* ปุ่มขอใช้ยา */}
                  {(selectedMed.mainType === 'external' || selectedMed.mainType === 'supplies') && (
                    <button 
                      disabled={loading || editValues.count <= 0 || showSuccessToast || getExpiryStatus(editValues.expiry) === 'expired'}
                      onClick={() => setShowBlessing(true)}
                      className={`w-full h-16 rounded-2xl border-2 font-black text-lg flex items-center justify-center active:scale-95 transition-all shadow-sm ${
                        (editValues.count > 0 && getExpiryStatus(editValues.expiry) !== 'expired' && !loading) ? 'border-teal-100 bg-teal-50 text-teal-700' : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <span>🫳 ขอใช้ยาชั่วคราว</span>
                    </button>
                  )}
                </div>

                {!loading && (
                  <button onClick={() => setShowManageMode(true)} className="w-full text-center text-[10px] font-black text-emerald-600/50 uppercase tracking-widest py-2 flex items-center justify-center gap-2">⚙️ อัปเดตข้อมูล</button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase px-1 tracking-wider">จำนวนยาใหม่</label>
                    <div className="flex h-14 items-center bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                      <button onClick={() => setEditValues({...editValues, count: Math.max(0, editValues.count - 1)})} className="p-3 text-slate-400">➖</button>
                      <input type="number" value={editValues.count} onChange={(e) => setEditValues({...editValues, count: parseInt(e.target.value) || 0})} className="w-full bg-transparent text-center font-bold text-slate-700 outline-none" />
                      <button onClick={() => setEditValues({...editValues, count: editValues.count + 1})} className="p-3 text-slate-400">➕</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase px-1 tracking-wider">วันหมดอายุใหม่</label>
                    <input type="text" value={editValues.expiry} onChange={(e) => setEditValues({...editValues, expiry: e.target.value})} className="w-full h-14 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-center outline-none focus:border-emerald-300" placeholder="ดด/ปป" />
                  </div>
                </div>
                <button disabled={loading || showSuccessToast} onClick={() => performUpdate(selectedMed.id, editValues.count, editValues.expiry, 'admin_edit')} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3">
                   {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                   {loading ? "กำลังบันทึกข้อมูล..." : "💾 ยืนยันข้อมูลล่าสุด"}
                </button>
                <button onClick={() => setShowManageMode(false)} className="w-full py-2 text-slate-300 font-bold text-[10px] uppercase tracking-widest text-center">ย้อนกลับ</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-emerald-50 px-6 py-4 flex justify-around items-center z-50 shadow-[0_-10px_40px_-15px_rgba(16,185,129,0.15)] text-center">
        <button onClick={() => setActiveTab('inventory')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'inventory' ? 'text-emerald-600 scale-110 font-bold' : 'text-slate-300'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-0.5 ${activeTab === 'inventory' ? 'bg-emerald-50' : ''}`}>💊</div>
          <span className="text-[9px] font-black uppercase tracking-tighter">ตู้ยา</span>
        </button>
        <button onClick={() => setActiveTab('checker')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'checker' ? 'text-teal-600 scale-110 font-bold' : 'text-slate-300'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-0.5 ${activeTab === 'checker' ? 'bg-teal-50' : ''}`}>🩺</div>
          <span className="text-[9px] font-black uppercase tracking-tighter">วินิจฉัย</span>
        </button>
        <button onClick={() => setActiveTab('guide')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'guide' ? 'text-cyan-600 scale-110 font-bold' : 'text-slate-300'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-0.5 ${activeTab === 'guide' ? 'bg-cyan-50' : ''}`}>🆘</div>
          <span className="text-[9px] font-black uppercase tracking-tighter">ปฐมพยาบาล</span>
        </button>
      </nav>
    </div>
  );
}


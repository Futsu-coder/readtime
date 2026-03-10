import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Image as ImageIcon, Trash2, ChevronDown, ChevronUp, ChevronLeft } from 'lucide-react';
import { client, API_URL } from "../client";

export function MyDashborad() {
    const navigate = useNavigate();
    const [works, setWorks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [selectedType, setSelectedType] = useState<'novel' | 'manga' | null>(null);
    const [showManageDropdown, setShowManageDropdown] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'novel' | 'manga'>('all'); 
    
    const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);

    const typeDropdownRef = useRef<HTMLDivElement>(null);
    const manageDropdownRef = useRef<HTMLDivElement>(null);

    // --- เพิ่ม State สำหรับจัดการ Modal ป็อปอัพ ---
    const [deleteTarget, setDeleteTarget] = useState<{id: number, title: string, type: 'novel' | 'manga'} | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        const fetchAllMyWorks = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [novelsRes, mangasRes] = await Promise.all([
                    client.api.protected.novels.$get({}, { headers }),
                    client.api.protected.manga.$get({}, { headers })
                ]);

                let combined: any[] = [];
                if (novelsRes.ok) {
                    const data = await novelsRes.json() as any;
                    combined = [...combined, ...(data.novels || []).map((n: any) => ({ ...n, type: 'novel' }))];
                }
                if (mangasRes.ok) {
                    const data = await mangasRes.json() as any;
                    combined = [...combined, ...(data.mangas || []).map((m: any) => ({ ...m, type: 'manga' }))];
                }
                
                const formattedWorks = combined.map(w => ({
                    ...w,
                    status: w.status || 'published' 
                }));

                setWorks(formattedWorks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllMyWorks();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(target)) setShowTypeDropdown(false);
            if (manageDropdownRef.current && !manageDropdownRef.current.contains(target)) setShowManageDropdown(false);
            
            if (!target.closest('.status-dropdown-zone')) {
                setOpenStatusDropdownId(null); 
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- เปลี่ยนฟังก์ชัน handleDelete ให้เปิด Modal แทน window.confirm ---
    const handleDelete = (id: number, title: string, type: 'novel' | 'manga', e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteTarget({ id, title, type });
    };

    // --- สร้างฟังก์ชัน performDelete สำหรับลบข้อมูลจริงๆ เมื่อกดยืนยันบน Modal ---
    const performDelete = async (target: {id: number, title: string, type: 'novel' | 'manga'}) => {
        try {
            const token = localStorage.getItem('token');
            const url = target.type === 'manga' ? `${API_URL}/api/protected/manga/${target.id}` : `${API_URL}/api/protected/novels/${target.id}`;

            const res = await fetch(url, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setWorks(prev => prev.filter(work => !(work.id === target.id && work.type === target.type)));
                setShowSuccessModal(true); // เปิด Modal แจ้งว่าลบสำเร็จ
            } else {
                const data = await res.json() as any;
                alert(`ลบไม่สำเร็จ: ${data.error || 'เกิดข้อผิดพลาด'}`);
            }
        } catch (err) {
            console.error(err);
            alert("เชื่อมต่อ Server ไม่ได้");
        }
    };

    const handleStatusChange = async (id: number, type: 'novel' | 'manga', newStatus: 'published' | 'draft', e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); 
        
        try {
            const token = localStorage.getItem('token');
            const url = type === 'novel' 
                ? `${API_URL}/api/protected/novels/${id}/status` 
                : `${API_URL}/api/protected/manga/${id}/status`;

            const res = await fetch(url, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                setWorks(prev => prev.map(w => 
                    (w.id === id && w.type === type) ? { ...w, status: newStatus } : w
                ));
                setOpenStatusDropdownId(null); 
            } else {
                const data = await res.json() as any;
                alert(data.error || 'เปลี่ยนสถานะไม่สำเร็จ');
            }
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        }
    };

    const displayWorks = works.filter(w => activeFilter === 'all' ? true : w.type === activeFilter);
    
    const getFilterText = () => {
        if (activeFilter === 'novel') return 'นิยาย';
        if (activeFilter === 'manga') return 'มังงะ';
        return 'ทั้งหมด';
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#ffffff', color: '#9b67bd', fontSize: '1.5rem', fontFamily: "'Kanit', sans-serif" }}>
            กำลังโหลดข้อมูลงานเขียน...
        </div>
    );

    return (
        <div style={{ 
            backgroundColor: '#ffffff', 
            minHeight: '100vh', 
            width: '100%', 
            fontFamily: "'Kanit', 'Sarabun', sans-serif",
            paddingBottom: '80px' 
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 30px' }}>

                <h2 style={{ fontSize: '42px', color: '#9b67bd', fontWeight: 'bold', marginBottom: '40px' }}>My Writing ✎</h2>

                <div style={{ backgroundColor: '#fff', borderRadius: '25px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                    <div style={{ borderBottom: '1px solid #eee', marginBottom: '25px', paddingBottom: '10px' }}>
                        <h3 style={{ fontSize: '26px', margin: 0, color: '#333' }}>จัดการงานเขียน</h3>
                    </div>

                    <div style={{ backgroundColor: '#fafafa', borderRadius: '20px', padding: '25px', border: '1px solid #f5f5f5' }}>     
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
                            <div style={{ position: 'relative' }} ref={manageDropdownRef}>
                                <button 
                                    onClick={() => setShowManageDropdown(!showManageDropdown)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 25px', border: '1px solid #eee', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', color: showManageDropdown ? '#9b67bd' : '#333', transition: '0.2s' }}
                                >
                                    {getFilterText()} {showManageDropdown ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                {showManageDropdown && (
                                    <div style={{ position: 'absolute', top: '110%', left: 0, width: '180px', backgroundColor: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: '12px', zIndex: 20, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                                        <div onClick={() => { setActiveFilter('all'); setShowManageDropdown(false); }} style={{ padding: '15px 20px', fontSize: '18px', color: activeFilter === 'all' ? '#9b67bd' : '#555', cursor: 'pointer', borderBottom: '1px solid #f9f9f9', fontWeight: activeFilter === 'all' ? 'bold' : 'normal' }}>ทั้งหมด</div>
                                        <div onClick={() => { setActiveFilter('novel'); setShowManageDropdown(false); }} style={{ padding: '15px 20px', fontSize: '18px', color: activeFilter === 'novel' ? '#9b67bd' : '#555', cursor: 'pointer', borderBottom: '1px solid #f9f9f9', fontWeight: activeFilter === 'novel' ? 'bold' : 'normal' }}>นิยาย</div>
                                        <div onClick={() => { setActiveFilter('manga'); setShowManageDropdown(false); }} style={{ padding: '15px 20px', fontSize: '18px', color: activeFilter === 'manga' ? '#9b67bd' : '#555', cursor: 'pointer', fontWeight: activeFilter === 'manga' ? 'bold' : 'normal' }}>มังงะ</div>
                                    </div>
                                )}
                            </div>
                            <span style={{ fontSize: '18px', color: '#777', fontWeight: '600' }}>ทั้งหมด ( {displayWorks.length} ) เรื่อง</span>
                        </div>
                        
                        {displayWorks.length > 0 ? displayWorks.map((work) => {
                            const uniqueId = `${work.type}-${work.id}`;
                            const isDraft = work.status === 'draft';
                            const isBanned = work.status === 'banned'; 

                            return (
                            <div 
                                key={uniqueId} 
                                onClick={() => {
                                    if (isBanned) {
                                        alert('ผลงานนี้ถูกระงับ ไม่สามารถเข้าแก้ไขได้');
                                        return;
                                    }
                                    navigate(`/${work.type}/${work.id}/edit`);
                                }} 
                                style={{ 
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '15px 20px', borderRadius: '15px', marginBottom: '15px', 
                                    cursor: isBanned ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #eee', transition: '0.2s', 
                                    opacity: isBanned ? 0.6 : isDraft ? 0.75 : 1 
                                }}
                                onMouseOver={e => e.currentTarget.style.borderColor = isBanned ? '#ffa39e' : '#e0c3fc'}
                                onMouseOut={e => e.currentTarget.style.borderColor = '#eee'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ 
                                        width: '65px', height: '90px', borderRadius: '8px', marginRight: '20px', 
                                        backgroundImage: work.cover_image ? `url(${API_URL}${work.cover_image})` : 'none',
                                        backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#f0f0f0', flexShrink: 0,
                                        filter: isBanned ? 'grayscale(100%)' : isDraft ? 'grayscale(50%)' : 'none'
                                    }}>
                                        {!work.cover_image && <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#aaa' }}>No Cover</div>}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '22px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                                            {work.title} 
                                            {isDraft && <span style={{fontSize: '14px', marginLeft:'8px', color: '#888', fontWeight: 'normal'}}>(ฉบับร่าง)</span>}
                                            {isBanned && <span style={{fontSize: '14px', marginLeft:'8px', color: '#e11d48', fontWeight: 'bold'}}>(ถูกระงับ)</span>}
                                        </span>
                                        <span style={{ fontSize: '16px', color: '#888' }}>
                                            <span style={{ color: '#9b67bd', fontWeight: 'bold', marginRight: '10px' }}>
                                                {work.type === 'novel' ? ' นิยาย' : ' มังงะ'}
                                            </span>
                                            สร้างเมื่อ {new Date(work.created_at).toLocaleDateString('th-TH')}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                                    
                                    {isBanned ? (
                                        <span style={{ 
                                            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 'bold', 
                                            color: '#e11d48', background: '#fff1f0', border: '1px solid #ffa39e', 
                                            padding: '6px 16px', borderRadius: '20px', cursor: 'not-allowed'
                                        }}>
                                            🚨 ผลงานนี้ถูกแบน
                                        </span>
                                    ) : (
                                        <div style={{ position: 'relative' }} className="status-dropdown-zone">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation(); 
                                                    setOpenStatusDropdownId(openStatusDropdownId === uniqueId ? null : uniqueId);
                                                }}
                                                style={{ 
                                                    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 'bold', 
                                                    color: isDraft ? '#888' : '#4caf50', 
                                                    background: isDraft ? '#f5f5f5' : '#e8f5e9', 
                                                    border: `1px solid ${isDraft ? '#ddd' : '#c8e6c9'}`,
                                                    padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', transition: '0.2s'
                                                }}
                                            >
                                                {isDraft ? 'แบบร่าง' : 'เผยแพร่แล้ว'}
                                                <ChevronDown size={18} />
                                            </button>

                                            {openStatusDropdownId === uniqueId && (
                                                <div style={{ 
                                                    position: 'absolute', 
                                                    top: '115%', 
                                                    left: '50%', 
                                                    transform: 'translateX(-50%)', 
                                                    width: '150px', 
                                                    backgroundColor: '#fff', 
                                                    boxShadow: '0 5px 15px rgba(0,0,0,0.1)', 
                                                    borderRadius: '10px', 
                                                    zIndex: 30, 
                                                    overflow: 'hidden', 
                                                    border: '1px solid #eee' 
                                                }}>
                                                    <div 
                                                        onMouseDown={(e) => handleStatusChange(work.id, work.type, 'published', e)} 
                                                        style={{ padding: '12px 15px', fontSize: '16px', color: '#4caf50', cursor: 'pointer', fontWeight: !isDraft ? 'bold' : 'normal', backgroundColor: !isDraft ? '#f6ffed' : '#fff' }}
                                                    >
                                                          เผยแพร่
                                                    </div>
                                                    <div 
                                                        onMouseDown={(e) => handleStatusChange(work.id, work.type, 'draft', e)} 
                                                        style={{ padding: '12px 15px', fontSize: '16px', color: '#888', cursor: 'pointer', fontWeight: isDraft ? 'bold' : 'normal', backgroundColor: isDraft ? '#fafafa' : '#fff' }}
                                                    >
                                                          เก็บเป็นร่าง
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button 
                                        onClick={(e) => handleDelete(work.id, work.title, work.type, e)} 
                                        style={{ background: '#fff5f5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '10px', borderRadius: '8px', transition: '0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.background = '#ffe5e5'}
                                        onMouseOut={e => e.currentTarget.style.background = '#fff5f5'}
                                        title="ลบผลงาน"
                                    >
                                        <Trash2 size={24} color="#ff4d4f" />
                                    </button>
                                </div>
                            </div>
                        )}) : (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px', backgroundColor: '#fff', borderRadius: '15px', color: '#888', fontSize: '18px', border: '1px dashed #ccc' }}>
                                ไม่มีผลงานในหมวดหมู่นี้
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '60px', position: 'relative' }}>
                    {showTypeDropdown && (
                        <div ref={typeDropdownRef} style={{ position: 'absolute', bottom: '110px', left: '50%', transform: 'translateX(-50%)', width: '450px', backgroundColor: '#fff', padding: '35px', borderRadius: '35px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', zIndex: 100, border: '1px solid #f0f0f0' }}>
                            <h3 style={{ marginBottom: '25px', fontSize: '26px', color: '#333' }}>เลือกประเภทงานเขียน</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                <div 
                                    onClick={() => setSelectedType('novel')} 
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '25px 15px', border: '2px solid', borderRadius: '20px', cursor: 'pointer', gap: '12px', transition: '0.2s', borderColor: selectedType === 'novel' ? '#9b67bd' : '#eee', backgroundColor: selectedType === 'novel' ? '#fcf8ff' : '#fff' }}
                                >
                                    <Book color={selectedType === 'novel' ? '#9b67bd' : '#aaa'} size={40} /> 
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: selectedType === 'novel' ? '#9b67bd' : '#666' }}>นิยาย</span>
                                </div>
                                <div 
                                    onClick={() => setSelectedType('manga')} 
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '25px 15px', border: '2px solid', borderRadius: '20px', cursor: 'pointer', gap: '12px', transition: '0.2s', borderColor: selectedType === 'manga' ? '#9b67bd' : '#eee', backgroundColor: selectedType === 'manga' ? '#fcf8ff' : '#fff' }}
                                >
                                    <ImageIcon color={selectedType === 'manga' ? '#9b67bd' : '#aaa'} size={40} /> 
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: selectedType === 'manga' ? '#9b67bd' : '#666' }}>มังงะ</span>
                                </div>
                            </div>
                            <button 
                                disabled={!selectedType} 
                                onClick={() => { if (selectedType === 'novel') navigate('/createnovel'); else navigate('/createmanga'); }} 
                                style={{ width: '100%', padding: '18px', borderRadius: '30px', border: 'none', color: '#fff', fontWeight: 'bold', fontSize: '20px', cursor: selectedType ? 'pointer' : 'not-allowed', backgroundColor: selectedType ? '#9b67bd' : '#ccc', transition: '0.2s' }}
                            >
                                ยืนยัน
                            </button>
                        </div>
                    )}     
                    <button 
                        onClick={() => setShowTypeDropdown(!showTypeDropdown)} 
                        style={{ backgroundColor: '#bc7df2', color: '#fff', border: 'none', padding: '20px 65px', borderRadius: '50px', fontSize: '22px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 25px rgba(188, 125, 242, 0.4)', transition: '0.2s' }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {showTypeDropdown ? '✕ ปิดหน้าต่าง' : '+ เพิ่มงานเขียน'}
                    </button>

                    {/* --- เพิ่มส่วนของ Modal ยืนยันการลบตรงนี้ --- */}
                    {deleteTarget && (
                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                            <div style={{ backgroundColor: '#fff', padding: '35px', borderRadius: '20px', width: '450px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                                <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '24px' }}>ยืนยันการลบ</h3>
                                <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.6', fontSize: '18px' }}>
                                    แน่ใจไหมว่าจะลบ {deleteTarget.type === 'manga' ? 'มังงะ' : 'นิยาย'} เรื่อง <br/>
                                    <span style={{ fontWeight: 'bold', color: '#9b67bd' }}>"{deleteTarget.title}"</span> ?
                                    <br/>
                                    <span style={{ fontSize: '15px', color: '#ff4d4f' }}>(การลบจะทำให้ตอนทั้งหมดหายไปด้วย และไม่สามารถกู้คืนได้)</span>
                                </p>
                                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                    <button 
                                        onClick={() => setDeleteTarget(null)} 
                                        style={{ padding: '12px 30px', borderRadius: '12px', border: '1px solid #ddd', backgroundColor: '#fff', color: '#555', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', transition: '0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#fff'}
                                    >
                                        ยกเลิก
                                    </button>
                                    <button 
                                        onClick={() => { performDelete(deleteTarget); setDeleteTarget(null); }} 
                                        style={{ padding: '12px 30px', borderRadius: '12px', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', transition: '0.2s', boxShadow: '0 4px 10px rgba(255, 77, 79, 0.3)' }}
                                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#ff7875'}
                                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#ff4d4f'}
                                    >
                                        ลบผลงาน
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- เพิ่มส่วนของ Modal แจ้งเตือนลบสำเร็จตรงนี้ --- */}
                    {showSuccessModal && (
                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                            <div style={{ backgroundColor: '#fff', padding: '35px', borderRadius: '20px', width: '400px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                                <div style={{ fontSize: '50px', marginBottom: '10px' }}>✅</div>
                                <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '24px' }}>สำเร็จ!</h3>
                                <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.5', fontSize: '18px' }}>
                                    ลบผลงานเรียบร้อยแล้ว
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <button 
                                        onClick={() => setShowSuccessModal(false)} 
                                        style={{ 
                                            padding: '12px 35px', 
                                            borderRadius: '12px', 
                                            backgroundColor: '#bc7df2',
                                            color: '#fff', 
                                            border: 'none', 
                                            cursor: 'pointer', 
                                            fontWeight: 'bold', 
                                            fontSize: '18px',
                                            transition: '0.2s', 
                                            boxShadow: '0 4px 10px rgba(188, 125, 242, 0.3)' 
                                        }}
                                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#d09eff'} 
                                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#bc7df2'}
                                    >
                                        ตกลง
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
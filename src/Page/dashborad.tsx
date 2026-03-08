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

    const handleDelete = async (id: number, title: string, type: 'novel' | 'manga', e: React.MouseEvent) => {
        e.stopPropagation();
        
        const confirmDelete = window.confirm(`แน่ใจไหมว่าจะลบ ${type === 'manga' ? 'มังงะ' : 'นิยาย'} เรื่อง "${title}" ?\n(การลบจะทำให้ตอนทั้งหมดหายไปด้วย และไม่สามารถกู้คืนได้)`);
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('token');
            const url = type === 'manga' ? `${API_URL}/api/protected/manga/${id}` : `${API_URL}/api/protected/novels/${id}`;

            const res = await fetch(url, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setWorks(prev => prev.filter(work => !(work.id === id && work.type === type)));
                alert("ลบผลงานเรียบร้อยแล้ว");
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

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px', color: '#9b67bd', fontSize: '1.2rem' }}>⏳ กำลังโหลดข้อมูลงานเขียน...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 30px', fontFamily: "'Kanit', 'Sarabun', sans-serif" }}>
            
            <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', gap: '8px', marginBottom: '20px', padding: 0 }}>
                <ChevronLeft size={28} color="#bc7df2" />
                <span style={{ color: '#bc7df2', fontSize: '18px', fontWeight: '600' }}>ย้อนกลับ</span>
            </button>
            <h2 style={{ fontSize: '38px', color: '#9b67bd', fontWeight: 'bold', marginBottom: '40px' }}>Writing ✎</h2>
            <div style={{ backgroundColor: '#fcfcfc', borderRadius: '25px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}>
                <div style={{ borderBottom: '1px solid #eee', marginBottom: '25px', paddingBottom: '10px' }}>
                    <h3 style={{ fontSize: '22px', margin: 0, color: '#333' }}>จัดการงานเขียน</h3>
                </div>
                <div style={{ backgroundColor: '#f5f5f5', borderRadius: '20px', padding: '25px' }}>     
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }} ref={manageDropdownRef}>
                            <button 
                                onClick={() => setShowManageDropdown(!showManageDropdown)}
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', color: showManageDropdown ? '#9b67bd' : '#333', transition: '0.2s' }}
                            >
                                {getFilterText()} {showManageDropdown ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                            {showManageDropdown && (
                                <div style={{ position: 'absolute', top: '110%', left: 0, width: '180px', backgroundColor: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: '12px', zIndex: 20, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                                    <div onClick={() => { setActiveFilter('all'); setShowManageDropdown(false); }} style={{ padding: '15px 20px', fontSize: '15px', color: activeFilter === 'all' ? '#9b67bd' : '#555', cursor: 'pointer', borderBottom: '1px solid #f9f9f9', fontWeight: activeFilter === 'all' ? 'bold' : 'normal' }}>ทั้งหมด</div>
                                    <div onClick={() => { setActiveFilter('novel'); setShowManageDropdown(false); }} style={{ padding: '15px 20px', fontSize: '15px', color: activeFilter === 'novel' ? '#9b67bd' : '#555', cursor: 'pointer', borderBottom: '1px solid #f9f9f9', fontWeight: activeFilter === 'novel' ? 'bold' : 'normal' }}>นิยาย</div>
                                    <div onClick={() => { setActiveFilter('manga'); setShowManageDropdown(false); }} style={{ padding: '15px 20px', fontSize: '15px', color: activeFilter === 'manga' ? '#9b67bd' : '#555', cursor: 'pointer', fontWeight: activeFilter === 'manga' ? 'bold' : 'normal' }}>มังงะ</div>
                                </div>
                            )}
                        </div>
                        <span style={{ fontSize: '15px', color: '#777', fontWeight: '600' }}>ทั้งหมด ( {displayWorks.length} ) เรื่อง</span>
                    </div>
                    
                    {displayWorks.length > 0 ? displayWorks.map((work) => {
                        const uniqueId = `${work.type}-${work.id}`;
                        const isDraft = work.status === 'draft';
                        const isBanned = work.status === 'banned'; 

                        return (
                        <div 
                            key={uniqueId} 
                            // 🌟 แก้ไข: ถ้าระงับอยู่ ให้ขวางไม่ให้เข้าไปหน้า Edit
                            onClick={() => {
                                if (isBanned) {
                                    alert('ผลงานนี้ถูกระงับ ไม่สามารถเข้าแก้ไขได้');
                                    return;
                                }
                                navigate(`/${work.type}/${work.id}/edit`);
                            }} 
                            style={{ 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '15px 20px', borderRadius: '15px', marginBottom: '15px', 
                                cursor: isBanned ? 'not-allowed' : 'pointer', // 🌟 เปลี่ยน cursor เป็น 🚫 ถ้าโดนแบน
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)', border: '1px solid transparent', transition: '0.2s', 
                                opacity: isBanned ? 0.6 : isDraft ? 0.75 : 1 
                            }}
                            onMouseOver={e => e.currentTarget.style.borderColor = isBanned ? '#ffa39e' : '#e0c3fc'}
                            onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ 
                                    width: '55px', height: '75px', borderRadius: '8px', marginRight: '20px', 
                                    backgroundImage: work.cover_image ? `url(${API_URL}${work.cover_image})` : 'none',
                                    backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#eee', flexShrink: 0,
                                    filter: isBanned ? 'grayscale(100%)' : isDraft ? 'grayscale(50%)' : 'none'
                                }}>
                                    {!work.cover_image && <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#aaa' }}>No Cover</div>}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                                        {work.title} 
                                        {isDraft && <span style={{fontSize: '12px', marginLeft:'8px', color: '#888', fontWeight: 'normal'}}>(ฉบับร่าง)</span>}
                                        {isBanned && <span style={{fontSize: '12px', marginLeft:'8px', color: '#e11d48', fontWeight: 'bold'}}>(ถูกระงับ)</span>}
                                    </span>
                                    <span style={{ fontSize: '13px', color: '#888' }}>
                                        <span style={{ color: work.type === 'novel' ? '#9b67bd' : '#9b67bd', fontWeight: 'bold', marginRight: '10px' }}>
                                            {work.type === 'novel' ? ' นิยาย' : ' มังงะ'}
                                        </span>
                                        สร้างเมื่อ {new Date(work.created_at).toLocaleDateString('th-TH')}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                                
                                {/* 🌟 จัดการเงื่อนไข: ถ้าแบนให้โชว์ป้ายแดง ถ้าไม่แบนโชว์ Dropdown */}
                                {isBanned ? (
                                    <span style={{ 
                                        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', 
                                        color: '#e11d48', background: '#fff1f0', border: '1px solid #ffa39e', 
                                        padding: '6px 12px', borderRadius: '20px', cursor: 'not-allowed'
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
                                                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', 
                                                color: isDraft ? '#888' : '#4caf50', 
                                                background: isDraft ? '#f5f5f5' : '#e8f5e9', 
                                                border: `1px solid ${isDraft ? '#ddd' : '#c8e6c9'}`,
                                                padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', transition: '0.2s'
                                            }}
                                        >
                                            {isDraft ? '📝 แบบร่าง' : '🌍 เผยแพร่แล้ว'}
                                            <ChevronDown size={14} />
                                        </button>

                                        {openStatusDropdownId === uniqueId && (
                                            <div style={{ position: 'absolute', top: '110%', right: 0, width: '130px', backgroundColor: '#fff', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', borderRadius: '10px', zIndex: 30, overflow: 'hidden', border: '1px solid #eee' }}>
                                                <div 
                                                    onMouseDown={(e) => handleStatusChange(work.id, work.type, 'published', e)} 
                                                    style={{ padding: '10px 15px', fontSize: '13px', color: '#4caf50', cursor: 'pointer', fontWeight: !isDraft ? 'bold' : 'normal', backgroundColor: !isDraft ? '#f6ffed' : '#fff' }}
                                                >
                                                    🌍 เผยแพร่
                                                </div>
                                                <div 
                                                    onMouseDown={(e) => handleStatusChange(work.id, work.type, 'draft', e)} 
                                                    style={{ padding: '10px 15px', fontSize: '13px', color: '#888', cursor: 'pointer', fontWeight: isDraft ? 'bold' : 'normal', backgroundColor: isDraft ? '#fafafa' : '#fff' }}
                                                >
                                                    📝 เก็บเป็นร่าง
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button 
                                    onClick={(e) => handleDelete(work.id, work.title, work.type, e)} 
                                    style={{ background: '#fff5f5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '8px', transition: '0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#ffe5e5'}
                                    onMouseOut={e => e.currentTarget.style.background = '#fff5f5'}
                                    title="ลบผลงาน"
                                >
                                    <Trash2 size={20} color="#ff4d4f" />
                                </button>
                            </div>
                        </div>
                    )}) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px', backgroundColor: '#fff', borderRadius: '15px', color: '#888', fontSize: '16px', border: '1px dashed #ccc' }}>
                            ไม่มีผลงานในหมวดหมู่นี้
                        </div>
                    )}
                </div>
            </div>

            {/* ส่วนเลือกเพิ่มงานเขียน (ปุ่ม +) */}
            <div style={{ textAlign: 'center', marginTop: '60px', position: 'relative' }}>
                {showTypeDropdown && (
                    <div ref={typeDropdownRef} style={{ position: 'absolute', bottom: '110px', left: '50%', transform: 'translateX(-50%)', width: '420px', backgroundColor: '#fff', padding: '35px', borderRadius: '35px', boxShadow: '0 15px 50px rgba(0,0,0,0.15)', zIndex: 100, border: '1px solid #eee' }}>
                        <h3 style={{ marginBottom: '25px', fontSize: '22px', color: '#333' }}>เลือกประเภทงานเขียน</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                            <div 
                                onClick={() => setSelectedType('novel')} 
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '25px 15px', border: '2px solid', borderRadius: '20px', cursor: 'pointer', gap: '12px', transition: '0.2s', borderColor: selectedType === 'novel' ? '#9b67bd' : '#eee', backgroundColor: selectedType === 'novel' ? '#fcf8ff' : '#fff' }}
                            >
                                <Book color={selectedType === 'novel' ? '#9b67bd' : '#aaa'} size={36} /> 
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: selectedType === 'novel' ? '#9b67bd' : '#666' }}>นิยาย</span>
                            </div>
                            <div 
                                onClick={() => setSelectedType('manga')} 
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '25px 15px', border: '2px solid', borderRadius: '20px', cursor: 'pointer', gap: '12px', transition: '0.2s', borderColor: selectedType === 'manga' ? '#13c2c2' : '#eee', backgroundColor: selectedType === 'manga' ? '#f0ffff' : '#fff' }}
                            >
                                <ImageIcon color={selectedType === 'manga' ? '#13c2c2' : '#aaa'} size={36} /> 
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: selectedType === 'manga' ? '#13c2c2' : '#666' }}>การ์ตูน</span>
                            </div>
                        </div>
                        <button 
                            disabled={!selectedType} 
                            onClick={() => { if (selectedType === 'novel') navigate('/createnovel'); else navigate('/createmanga'); }} 
                            style={{ width: '100%', padding: '16px', borderRadius: '30px', border: 'none', color: '#fff', fontWeight: 'bold', fontSize: '18px', cursor: selectedType ? 'pointer' : 'not-allowed', backgroundColor: selectedType === 'novel' ? '#9b67bd' : selectedType === 'manga' ? '#13c2c2' : '#ccc', transition: '0.2s' }}
                        >
                            ยืนยัน
                        </button>
                    </div>
                )}     
                <button 
                    onClick={() => setShowTypeDropdown(!showTypeDropdown)} 
                    style={{ backgroundColor: '#bc7df2', color: '#fff', border: 'none', padding: '18px 60px', borderRadius: '50px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 25px rgba(188, 125, 242, 0.4)', transition: '0.2s' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    {showTypeDropdown ? '✕ ปิดหน้าต่าง' : '+ เพิ่มงานเขียน'}
                </button>
            </div>
            
        </div>
    );
}
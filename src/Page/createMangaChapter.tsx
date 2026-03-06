import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, ChevronLeft, GripVertical, Trash2 } from 'lucide-react'; // 🌟 เพิ่ม GripVertical กับ Trash2
import { API_URL } from "../client";


interface PageImage {
    file: File;
    preview: string;
}

export function CreateMangaChapterPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    // --- State สำหรับ API ---
    const [title, setTitle] = useState('');
    const [chapterNumber, setChapterNumber] = useState('');
    const [pages, setPages] = useState<PageImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // --- UI Control States ---
    const [isPublished, setIsPublished] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [showSuccessOption, setShowSuccessOption] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 🌟 Refs สำหรับระบบ Drag & Drop
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // 🌟 ฟังก์ชันจัดการ Drag & Drop
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
        // ทำให้ภาพที่กำลังลากดูโปร่งแสงนิดนึง
        setTimeout(() => {
            if (e.target instanceof HTMLElement) {
                e.target.style.opacity = '0.5';
            }
        }, 0);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        if (e.target instanceof HTMLElement) {
            e.target.style.opacity = '1';
        }

        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            const _pages = [...pages];
            // ดึงไอเทมที่ถูกลากออกมา
            const draggedItemContent = _pages.splice(dragItem.current, 1)[0];
            // แทรกกลับเข้าไปในตำแหน่งใหม่
            _pages.splice(dragOverItem.current, 0, draggedItemContent);
            setPages(_pages);
        }
        
        dragItem.current = null;
        dragOverItem.current = null;
    };

    // 🌟 ฟังก์ชันเลือกไฟล์ภาพมังงะ
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newPages = Array.from(files).map(file => ({
                file,
                preview: URL.createObjectURL(file)
            }));
            setPages(prev => [...prev, ...newPages]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removePage = (indexToRemove: number) => {
        setPages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleTogglePublish = () => {
        if (!isPublished) setShowPublishModal(true);
        else setIsPublished(false);
    };

    // 🌟 ฟังก์ชันส่งข้อมูลเข้า Backend
    const handleSaveAPI = async () => {
        if (!chapterNumber.trim()) {
            setShowSaveConfirm(false);
            return alert("⚠️ กรุณาระบุเลขตอน (เช่น 1 หรือ 1.5)");
        }
        if (pages.length === 0) {
            setShowSaveConfirm(false);
            return alert("⚠️ กรุณาเพิ่มรูปภาพเนื้อหามังงะอย่างน้อย 1 หน้า");
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("chapterNumber", chapterNumber);
            
            // ส่งไฟล์ตามลำดับใหม่ที่ถูกจัดเรียงแล้ว
            pages.forEach((page) => formData.append("pages[]", page.file));

            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/protected/manga/${id}/chapters`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                setShowSaveConfirm(false);
                setShowSuccessOption(true);
            } else {
                const data = await res.json() as any;
                alert(`❌ อัปโหลดไม่สำเร็จ: ${data.error}`);
                setShowSaveConfirm(false);
            }
        } catch (err) {
            console.error(err);
            alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
            setShowSaveConfirm(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={pageContainer}>
            <div style={headerNav}>
                <button onClick={() => navigate(-1)} style={backBtn}>
                    <ChevronLeft size={20} /> ย้อนกลับ
                </button>
            </div>

            <div style={formWrapper}>
                
                <div style={inputGroup}>
                    <h2 style={{ textAlign: 'center', color: '#ff7b00', marginBottom: '20px' }}>อัปโหลดตอนมังงะใหม่ 🎨</h2>
                    
                    <div style={titleRow}>
                        <span style={labelPurpleText}>เลขตอน<span style={{color: 'red'}}>*</span></span>
                        <input 
                            type="number"
                            style={{ ...titleInput, maxWidth: '100px' }} 
                            placeholder="เช่น 1"
                            value={chapterNumber} 
                            onChange={(e) => setChapterNumber(e.target.value)} 
                        />
                        
                        <span style={{ ...labelPurpleText, marginLeft: '20px' }}>ชื่อตอน</span>
                        <input 
                            type="text" 
                            style={titleInput} 
                            placeholder="ชื่อตอน (เว้นว่างได้)"
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                        />
                    </div>
                </div>

                {/* 🌟 ส่วนอัปโหลดหน้ามังงะ (แนวตั้ง + Drag & Drop) */}
                <div style={inputGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={labelPurpleText}>จัดเรียงหน้ามังงะ ({pages.length} หน้า)</span>
                        
                    </div>

                    <div style={contentListContainer}>
                        {pages.length === 0 ? (
                            <div 
                                style={{ ...uploadBoxLarge, border: '2px dashed #ffcc99', background: '#fffbf5' }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ ...plusIconCircle, borderColor: '#ff7b00', margin: '0 auto 15px auto' }}>
                                        <Plus size={40} color="#ff7b00" strokeWidth={2.5} />
                                    </div>
                                    <p style={{ color: '#ff922b', fontWeight: 'bold' }}>คลิกเพื่อเลือกรูปภาพหน้ามังงะ</p>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {pages.map((page, index) => (
                                    <div 
                                        key={index} 
                                        draggable // 🌟 เปิดใช้งานลากวาง
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragEnter={(e) => handleDragEnter(e, index)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => e.preventDefault()} // จำเป็นต้องมีเพื่อให้วางได้
                                        style={{ 
                                            display: 'flex', alignItems: 'center', gap: '20px', 
                                            background: '#fff', padding: '15px', borderRadius: '15px', 
                                            border: '1px solid #eee', boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
                                            cursor: 'grab' // เปลี่ยนเมาส์เป็นรูปมือหยิบ
                                        }}
                                    >
                                        {/* ไอคอนจับลาก */}
                                        <div style={{ cursor: 'grab', color: '#ccc', display: 'flex', alignItems: 'center' }}>
                                            <GripVertical size={24} />
                                        </div>

                                        {/* ข้อมูลลำดับหน้า */}
                                        <div style={{ width: '60px', textAlign: 'center' }}>
                                            <h3 style={{ margin: 0, color: '#ff7b00', fontSize: '1.2rem' }}>{index + 1}</h3>
                                            <span style={{ fontSize: '0.75rem', color: '#999' }}>หน้า</span>
                                        </div>

                                        {/* รูปพรีวิวแนวนอนกว้างๆ */}
                                        <div style={{ flex: 1, height: '500px', background: '#f9f9f9', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                                            <img src={page.preview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt={`page-${index}`} />
                                        </div>
                                        
                                        {/* ปุ่มลบ */}
                                        <button 
                                            onClick={() => removePage(index)}
                                            style={{ background: '#fff0f300', color: '#ff4d6d', border: 'none', borderRadius: '12px', width: '70px', height: '45px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                                            onMouseOver={e => e.currentTarget.style.background = '#ffe5e5'}
                                            onMouseOut={e => e.currentTarget.style.background = '#fff0f3'}
                                            title="ลบหน้านี้"
                                        >
                                            <Trash2 size={50} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            style={{ background: '#fff4e6', color: '#ff7b00', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginTop:'10px',justifyContent: 'center'}}
                        >
                            <Plus size={18} strokeWidth={3}  /> เพิ่มรูปภาพ
                        </button>
                        <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                    </div>
                </div>

                {/* 🌟 สถานะและปุ่มบันทึก */}
                <div style={actionSection}>
                    <div style={statusRowContainer}>
                        <span style={mainStatusLabel}>เผยแพร่ :</span>
                        <div style={whiteStatusBox}>
                            <div style={toggleRow}>
                                <span style={toggleLabel}>สถานะ</span>
                                <div style={switchContainer}>
                                    <div style={{...switchBase, backgroundColor: isPublished ? '#ff7b00' : '#ccc'}} onClick={handleTogglePublish}>
                                        <div style={{...switchThumb, left: isPublished ? '18px' : '2px'}} />
                                    </div>
                                    <span style={{...statusText, color: isPublished ? '#ff7b00' : '#999'}}>{isPublished ? 'เผยแพร่' : 'ร่าง'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style={buttonGroup}>
                        <button style={cancelBtn} onClick={() => navigate(-1)}>ยกเลิก</button>
                        <button style={saveBtn} onClick={() => setShowSaveConfirm(true)}>
                            {isLoading ? '⏳ กำลังอัปโหลด...' : 'บันทึก'}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Modals (เหมือนเดิม) --- */}
            {showPublishModal && (
                <div style={modalOverlay}>
                    <div style={{ ...modalContainer, borderColor: '#ff7b00' }}>
                        <h2 style={modalTitle}>ต้องการเผยแพร่หรือไม่</h2>
                        <div style={modalActionArea}>
                            <button style={{ ...btnPublishNow, background: '#ff7b00' }} onClick={() => { setIsPublished(true); setShowPublishModal(false); }}>เผยแพร่เลย</button>
                            <button style={btnKeepDraft} onClick={() => { setIsPublished(false); setShowPublishModal(false); }}>เป็นร่างไว้ก่อน</button>
                        </div>
                    </div>
                </div>
            )}

            {showSaveConfirm && (
                <div style={modalOverlay}>
                    <div style={{ ...modalContainer, borderColor: '#ff7b00' }}>
                        <h2 style={modalTitle}>อัปโหลดมังงะใช่หรือไม่?</h2>
                        <div style={modalActionArea}>
                            <button style={{ ...btnPublishNow, background: '#ff7b00' }} onClick={handleSaveAPI}>ตกลงอัปโหลด</button>
                            <button style={btnKeepDraft} onClick={() => setShowSaveConfirm(false)}>ยกเลิก</button>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessOption && (
                <div style={modalOverlay}>
                    <div style={{ ...modalContainer, borderColor: '#4caf50' }}>
                        <h2 style={modalTitle}>✅ อัปโหลดสำเร็จ</h2>
                        <div style={modalActionArea}>
                            <button style={{ ...btnPublishNow, background: '#4caf50' }} onClick={() => navigate(`/manga/${id}`)}>ดูหน้ารายละเอียดมังงะ</button>
                            <button style={btnKeepDraft} onClick={() => {
                                setShowSuccessOption(false);
                                setChapterNumber(""); setTitle(""); setPages([]);
                            }}>เพิ่มตอนต่อไป</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Styles ของมังงะ (ธีมสีส้ม) ---
const pageContainer: React.CSSProperties = { minHeight: '100vh', backgroundColor: '#f9f9f9', padding: '40px 20px', fontFamily: "'Kanit', 'Sarabun', sans-serif" };
const headerNav = { maxWidth: '850px', margin: '0 auto 20px auto' };
const backBtn = { background: 'none', border: 'none', color: '#ff7b00', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '16px' };
const formWrapper: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '30px', padding: '40px', width: '100%', maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '35px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' };
const inputGroup = { display: 'flex', flexDirection: 'column' as const, gap: '15px' };
const titleRow = { display: 'flex', alignItems: 'center', gap: '15px' };
const labelPurpleText = { color: '#ff7b00', fontSize: '20px', fontWeight: 'bold' };
const titleInput = { flex: 1, height: '50px', borderRadius: '15px', border: '1.5px solid #eee', backgroundColor: '#fff', outline: 'none', padding: '0 20px', fontSize: '16px' , color:'black'};

const contentListContainer = { display: 'flex', flexDirection: 'column' as const, width: '100%' };
const uploadBoxLarge: React.CSSProperties = { width: '100%', padding: '60px 0', backgroundColor: '#fdfdfd', borderRadius: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: '0.2s' };
const plusIconCircle = { width: '60px', height: '60px', borderRadius: '50%', border: '3px solid #ff7b00', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' };

const actionSection = { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '35px', marginTop: '20px' };
const statusRowContainer = { display: 'flex', alignItems: 'center', gap: '15px', width: '100%', justifyContent: 'center' };
const mainStatusLabel = { color: '#ff7b00', fontSize: '20px', fontWeight: 'bold' };
const whiteStatusBox: React.CSSProperties = { backgroundColor: '#fcfcfc', border: '1px solid #eee', borderRadius: '20px', padding: '20px 30px', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '300px' };
const toggleRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const toggleLabel = { fontSize: '16px', color: '#666', fontWeight: 'bold' };
const switchContainer = { display: 'flex', alignItems: 'center', gap: '15px' };
const switchBase: React.CSSProperties = { width: '38px', height: '22px', borderRadius: '15px', position: 'relative', cursor: 'pointer', transition: '0.3s' };
const switchThumb: React.CSSProperties = { width: '16px', height: '16px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' };
const statusText = { fontSize: '14px', width: '50px', textAlign: 'left' as const, fontWeight: 'bold' };

const buttonGroup = { display: 'flex', gap: '20px' };
const cancelBtn = { padding: '14px 40px', borderRadius: '25px', border: 'none', backgroundColor: '#eee', color: '#666', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' };
const saveBtn = { padding: '14px 50px', borderRadius: '25px', border: 'none', backgroundColor: '#ff7b00', color: '#fff', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(255, 123, 0, 0.3)' };

const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContainer: React.CSSProperties = { width: '400px', backgroundColor: '#fff', borderRadius: '35px', padding: '45px 35px', textAlign: 'center', border: '4px solid #ff7b00', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' };
const modalTitle = { fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '25px' };
const modalActionArea = { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '15px' };
const btnPublishNow: React.CSSProperties = { width: '100%', padding: '15px 0', color: '#fff', border: 'none', borderRadius: '30px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' };
const btnKeepDraft: React.CSSProperties = { width: '60%', padding: '10px 0', backgroundColor: '#f5f5f5', color: '#666', border: 'none', borderRadius: '30px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' };
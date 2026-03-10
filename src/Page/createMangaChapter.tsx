import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, ChevronLeft, GripVertical, Trash2 } from 'lucide-react'; 
import { API_URL } from "../client";

interface PageImage {
    file: File;
    preview: string;
}

export function CreateMangaChapterPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [chapterNumber, setChapterNumber] = useState('');
    const [pages, setPages] = useState<PageImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // 🌟 ค่าเริ่มต้นคือ false = 'แบบร่าง'
    const [isPublished, setIsPublished] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [showSuccessOption, setShowSuccessOption] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
        setTimeout(() => { if (e.target instanceof HTMLElement) { e.target.style.opacity = '0.5'; } }, 0);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        if (e.target instanceof HTMLElement) { e.target.style.opacity = '1'; }
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            const _pages = [...pages];
            const draggedItemContent = _pages.splice(dragItem.current, 1)[0];
            _pages.splice(dragOverItem.current, 0, draggedItemContent);
            setPages(_pages);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newPages = Array.from(files).map(file => ({ file, preview: URL.createObjectURL(file) }));
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
            
            // 🌟 แนบค่า status ไปกับ FormData
            formData.append("status", isPublished ? 'published' : 'draft');
            
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
            {/* 🌟 UI ปุ่มย้อนกลับจากไฟล์หลัก (ไม่มีใน Test) */}
            <div style={headerNav}>
            </div>

            <div style={formWrapper}>
                <div style={inputGroup}>
                    <h2 style={{ textAlign: 'center', color: '#9b67bd', marginBottom: '20px',fontSize: '40px' }}>อัปโหลดตอนมังงะใหม่</h2>
                    
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

                {/* 🌟 ส่วนแสดงหน้ามังงะ (UI จาก Test) */}
                <div style={inputGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={labelPurpleText}>จัดเรียงหน้ามังงะ ({pages.length} หน้า)</span>
                    </div>

                    <div style={contentListContainer}>
                        {pages.length === 0 ? (
                            <div 
                                style={{ ...uploadBoxLarge, border: '2px dashed #9b67bd', background: '#f8f1fb' }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ ...plusIconCircle, borderColor: '#9b67bd', margin: '0 auto 15px auto' }}>
                                        <Plus size={40} color="#9b67bd" strokeWidth={2.5} />
                                    </div>
                                    <p style={{ color: '#9b67bd', fontWeight: 'bold' }}>คลิกเพื่อเลือกรูปภาพหน้ามังงะ</p>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {pages.map((page, index) => (
                                    <div 
                                        key={index} 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragEnter={(e) => handleDragEnter(e, index)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => e.preventDefault()}
                                        style={pageItemCard}
                                    >
                                        {/* 🛠️ แถบควบคุมมุมขวาบน (เลขหน้า + ปุ่มลบ) */}
                                        <div style={controlOverlay}>
                                            <div style={pageBadge}>
                                                {index + 1} <span style={{opacity: 0.6, fontSize: '12px', marginLeft: '4px'}}>/ {pages.length}</span>
                                            </div>
                                            <div style={verticalDivider} />
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); removePage(index); }}
                                                style={deleteIconButton}
                                                title="ลบหน้านี้"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        {/* ไอคอนสำหรับลาก (มุมซ้ายบน) */}
                                        <div style={dragHandleIcon}>
                                            <GripVertical size={24} />
                                        </div>

                                        {/* รูปภาพ (ปรับให้ฟิตพอดีเฟรม) */}
                                        <div style={imageWrapper}>
                                            <img src={page.preview} style={mangaImageStyle} alt={`page-${index}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            style={addMoreBtn}
                        >
                            <Plus size={18} strokeWidth={3} /> เพิ่มรูปภาพ
                        </button>
                        <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                    </div>
                </div>

                {/* 🌟 ส่วนบันทึกข้อมูล (UI จาก Test) */}
                <div style={actionSection}>
                    <div style={statusRowContainer}>
                        <span style={mainStatusLabel}>เผยแพร่ :</span>
                        <div style={whiteStatusBox}>
                            <div style={toggleRow}>
                                <span style={toggleLabel}>สถานะ</span>
                                <div style={switchContainer}>
                                    <div style={{...switchBase, backgroundColor: isPublished ? '#9b67bd' : '#ccc'}} onClick={handleTogglePublish}>
                                        <div style={{...switchThumb, left: isPublished ? '18px' : '2px'}} />
                                    </div>
                                    <span style={{...statusText, color: isPublished ? '#9b67bd' : '#999'}}>{isPublished ? 'เผยแพร่' : 'ร่าง'}</span>
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

            {/* --- Modals --- */}
            
            {/* Modal: เผยแพร่ (UI จากไฟล์หลักเพราะไม่มีใน Test ปรับสีให้เข้าธีมม่วง) */}
            {showPublishModal && (
                <div style={modalOverlay}>
                    <div style={{ ...modalContainer, borderColor: '#9b67bd' }}>
                        <h2 style={modalTitle}>ต้องการเผยแพร่หรือไม่</h2>
                        <div style={modalActionArea}>
                            <button style={{ ...btnPublishNow, background: '#9b67bd' }} onClick={() => { setIsPublished(true); setShowPublishModal(false); }}>เผยแพร่เลย</button>
                            <button style={btnKeepDraft} onClick={() => { setIsPublished(false); setShowPublishModal(false); }}>เป็นร่างไว้ก่อน</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: ยืนยันการบันทึกตอน (ดีไซน์ใหม่จาก Test) */}
            {showSaveConfirm && (
                <div style={modalOverlay}>
                    <div style={confirmModalContainer}>
                        <h2 style={confirmModalTitle}>ยืนยันการบันทึกตอน?</h2>
                        <div style={confirmModalActionArea}>
                            <button style={btnConfirmUpload} onClick={handleSaveAPI}>
                                ตกลง
                            </button>
                            <button style={btnCancelUpload} onClick={() => setShowSaveConfirm(false)}>
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: อัปโหลดสำเร็จ (ดีไซน์เดิม) */}
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

// --- Styles ---
// Styles จากไฟล์หลักที่ไม่มีใน Test 
const headerNav = { maxWidth: '850px', margin: '0 auto 20px auto' };

// Styles ที่มาจากไฟล์ Test เป็นหลัก
const pageContainer: React.CSSProperties = { minHeight: '100vh', backgroundColor: '#f9f9f9', padding: '40px 20px', fontFamily: "'Kanit', sans-serif" };
const formWrapper: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '30px', padding: '40px', width: '100%', maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '35px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' };
const inputGroup = { display: 'flex', flexDirection: 'column' as const, gap: '15px' };
const titleRow = { display: 'flex', alignItems: 'center', gap: '15px' };
const labelPurpleText = { color: '#9b67bd', fontSize: '20px', fontWeight: 'bold' };
const titleInput = { flex: 1, height: '50px', borderRadius: '15px', border: '1.5px solid #eee', backgroundColor: '#fff', outline: 'none', padding: '0 20px', fontSize: '16px', color: 'black' };
const contentListContainer = { display: 'flex', flexDirection: 'column' as const, width: '100%' };
const uploadBoxLarge: React.CSSProperties = { width: '100%', padding: '60px 0', backgroundColor: '#fdfdfd', borderRadius: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' };
const plusIconCircle = { width: '60px', height: '60px', borderRadius: '50%', border: '3px solid #9b67bd', display: 'flex', justifyContent: 'center', alignItems: 'center' };

// 🌟 New Page Item Styles (จาก Test)
const pageItemCard: React.CSSProperties = { position: 'relative', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '20px', border: '1px solid #eee', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', cursor: 'grab', overflow: 'hidden' };
const controlOverlay: React.CSSProperties = { position: 'absolute', top: '15px', right: '15px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10, backgroundColor: 'rgba(0, 0, 0, 0.7)', padding: '6px 16px', borderRadius: '25px', backdropFilter: 'blur(4px)', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' };
const pageBadge: React.CSSProperties = { color: '#fff', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center' };
const verticalDivider: React.CSSProperties = { width: '1px', height: '15px', backgroundColor: 'rgba(255,255,255,0.3)' };
const deleteIconButton: React.CSSProperties = { background: 'none', border: 'none', color: '#ff4d6d', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' };
const dragHandleIcon: React.CSSProperties = { position: 'absolute', top: '15px', left: '15px', color: 'rgba(0,0,0,0.15)', zIndex: 5 };
const imageWrapper: React.CSSProperties = { width: '100%', display: 'flex', justifyContent: 'center', background: '#f5f5f5' };
const mangaImageStyle: React.CSSProperties = { width: '100%', height: 'auto', maxWidth: '100%', display: 'block', objectFit: 'contain' };
const addMoreBtn: React.CSSProperties = { background: '#f8f1fb', color: '#9b67bd', padding: '12px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px', justifyContent: 'center', border: 'none' };

// --- Other UI Styles ---
const actionSection = { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '35px', marginTop: '20px' };
const statusRowContainer = { display: 'flex', alignItems: 'center', gap: '15px', width: '100%', justifyContent: 'center' };
const mainStatusLabel = { color: '#9b67bd', fontSize: '20px', fontWeight: 'bold' };
const whiteStatusBox: React.CSSProperties = { backgroundColor: '#fcfcfc', border: '1px solid #eee', borderRadius: '20px', padding: '20px 30px', width: '100%', maxWidth: '300px' };
const toggleRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const toggleLabel = { fontSize: '16px', color: '#666', fontWeight: 'bold' };
const switchContainer = { display: 'flex', alignItems: 'center', gap: '15px' };
const switchBase: React.CSSProperties = { width: '38px', height: '22px', borderRadius: '15px', position: 'relative', cursor: 'pointer', transition: '0.3s' };
const switchThumb: React.CSSProperties = { width: '16px', height: '16px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', transition: '0.3s' };
const statusText = { fontSize: '14px', width: '50px', fontWeight: 'bold' };
const buttonGroup = { display: 'flex', gap: '20px' };
const cancelBtn = { padding: '14px 40px', borderRadius: '25px', border: 'none', backgroundColor: '#eee', color: '#666', fontWeight: 'bold', cursor: 'pointer' };
const saveBtn = { padding: '14px 50px', borderRadius: '25px', border: 'none', backgroundColor: '#9b67bd', color: '#fff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(155, 103, 189, 0.3)' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };

// --- Styles สำหรับ Modal ใหม่ (ยืนยันการบันทึก) ---
const confirmModalContainer: React.CSSProperties = { width: '420px', backgroundColor: '#fff', borderRadius: '35px', padding: '45px 35px', textAlign: 'center', border: '4px solid #c68bf5', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' };
const confirmModalTitle: React.CSSProperties = { fontSize: '22px', fontWeight: 'bold', marginBottom: '25px', color: '#444' };
const confirmModalActionArea: React.CSSProperties = { display: 'flex', flexDirection: 'column' as const, gap: '15px', alignItems: 'center' };
const btnConfirmUpload: React.CSSProperties = { width: '100%', padding: '15px 0', backgroundColor: '#ab66d6', color: '#fff', border: 'none', borderRadius: '30px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 20px rgba(171, 102, 214, 0.4)' };
const btnCancelUpload: React.CSSProperties = { width: '60%', padding: '12px 0', backgroundColor: '#f5f5f5', color: '#666', border: 'none', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' };

// --- Styles สำหรับ Modal เดิม (อัปโหลดสำเร็จ / เผยแพร่) ---
const modalContainer: React.CSSProperties = { width: '400px', backgroundColor: '#fff', borderRadius: '35px', padding: '45px 35px', textAlign: 'center', border: '4px solid #9b67bd' };
const modalTitle = { fontSize: '24px', fontWeight: 'bold', marginBottom: '25px',color: '#000000' };
const modalActionArea = { display: 'flex', flexDirection: 'column' as const, gap: '15px' };
const btnPublishNow: React.CSSProperties = { width: '100%', padding: '15px 0', color: '#fff', border: 'none', borderRadius: '30px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' };
const btnKeepDraft: React.CSSProperties = { width: '60%', padding: '10px 0', backgroundColor: '#f5f5f5', color: '#666', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'center' };
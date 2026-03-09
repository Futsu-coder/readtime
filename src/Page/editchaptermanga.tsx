import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, GripVertical, Trash2 } from 'lucide-react'; 
import { API_URL } from "../client";

// ปรับ Interface ให้รองรับทั้งหน้าเก่า (มี id) และหน้าใหม่ (มี file)
interface PageImage {
    id?: number;
    file?: File;
    preview: string;
}

export function EditMangaChapterPage() {
    const { id, chapterId } = useParams<{ id: string; chapterId: string }>();
    const navigate = useNavigate();

    // --- State สำหรับ API ---
    const [title, setTitle] = useState('');
    const [chapterNumber, setChapterNumber] = useState('');
    const [pages, setPages] = useState<PageImage[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // --- UI Control States ---
    const [isPublished, setIsPublished] = useState(true); // สมมติว่าตอนที่แก้ไขเผยแพร่อยู่แล้ว
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [showSuccessOption, setShowSuccessOption] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 🌟 Refs สำหรับระบบ Drag & Drop
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // --- โหลดข้อมูลเดิม (จาก editchaptermanga.tsx เดิม) ---
    useEffect(() => {
        const fetchChapterData = async () => {
            if (!id || !chapterId) return;
            try {
                const res = await fetch(`${API_URL}/api/public/mangas/${id}/chapters/${chapterId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.chapter) {
                        setTitle(data.chapter.title || "");
                        setChapterNumber(data.chapter.chapter_number.toString());
                    }
                    if (data.pages) {
                        // แปลงข้อมูลหน้ากระดาษเดิมให้อยู่ในรูปแบบที่ UI ของ Create ต้องการ
                        const existingPages = data.pages.map((p: any) => ({
                            id: p.id,
                            preview: `${API_URL}${p.image_url}`
                        }));
                        setPages(existingPages);
                    }
                } else {
                    alert("ไม่พบข้อมูลตอนมังงะ");
                    navigate(`/manga/${id}/edit`);
                }
            } catch (err) {
                console.error(err);
                alert("โหลดข้อมูลไม่สำเร็จ");
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchChapterData();
    }, [id, chapterId, navigate]);

    // 🌟 ฟังก์ชันจัดการ Drag & Drop
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
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
            const draggedItemContent = _pages.splice(dragItem.current, 1)[0];
            _pages.splice(dragOverItem.current, 0, draggedItemContent);
            setPages(_pages);
        }
        
        dragItem.current = null;
        dragOverItem.current = null;
    };

    // 🌟 ฟังก์ชันจัดการไฟล์
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
        setIsPublished(!isPublished);
    };

    // 🌟 ฟังก์ชันบันทึกข้อมูลการแก้ไข
    const handleUpdateAPI = async () => {
        if (!chapterNumber.trim()) {
            setShowSaveConfirm(false);
            return alert("⚠️ กรุณาระบุเลขตอน (เช่น 1 หรือ 1.5)");
        }
        if (pages.length === 0) {
            setShowSaveConfirm(false);
            return alert("⚠️ กรุณาให้มีรูปภาพเนื้อหามังงะอย่างน้อย 1 หน้า");
        }

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("chapterNumber", chapterNumber);
            
            // ⚠️ หมายเหตุ: เราส่ง formData เพื่อให้ Backend จัดการไฟล์ภาพที่อาจเพิ่มเข้ามาใหม่
            // หรือจัดการลำดับของภาพเก่า
            pages.forEach((page) => {
                if (page.file) {
                    formData.append("newPages[]", page.file);
                    formData.append("pageOrder[]", "new");
                } else if (page.id) {
                    formData.append("pageOrder[]", String(page.id));
                }
            });

            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/protected/manga/${id}/chapters/${chapterId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formData // เปลี่ยนจากการส่ง JSON เป็น FormData
            });

            if (res.ok) {
                setShowSaveConfirm(false);
                setShowSuccessOption(true);
            } else {
                const data = await res.json() as any;
                alert(`❌ อัปเดตไม่สำเร็จ: ${data.error || 'เกิดข้อผิดพลาด'}`);
                setShowSaveConfirm(false);
            }
        } catch (err) {
            console.error(err);
            alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
            setShowSaveConfirm(false);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingData) return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '20px', color: '#9b67bd' }}> กำลังโหลดข้อมูลตอน...</div>;

    return (
        <div style={pageContainer}>
            <div style={formWrapper}>
                <div style={inputGroup}>
                    <h2 style={{ textAlign: 'center', color: '#9b67bd', marginBottom: '20px',fontSize: '40px' }}>แก้ไขตอนมังงะ</h2>
                    
                    <div style={titleRow}>
                        <span style={labelPurpleText}>เลขตอน<span style={{color: 'red'}}>*</span></span>
                        <input 
                            type="number"
                            step="0.1"
                            style={{ ...titleInput, maxWidth: '100px' }} 
                            placeholder="เช่น 1 หรือ 1.5"
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

                {/* 🌟 ส่วนแสดงหน้ามังงะ */}
                <div style={inputGroup}>
                    <span style={labelPurpleText}>จัดเรียงหน้ามังงะ ({pages.length} หน้า)</span>
                    <p style={{ fontSize: '14px', color: '#888', margin: '0 0 10px 0' }}>
                        *สามารถลากเพื่อสลับตำแหน่ง หรือกดปุ่มถังขยะเพื่อลบหน้าได้
                    </p>

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
                                        key={page.id ? `old-${page.id}` : `new-${index}`} 
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
                                                type="button"
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

                                        {/* ป้ายกำกับหน้าใหม่ (ถ้าเพิ่งอัปโหลด) */}
                                        {!page.id && (
                                            <div style={{ position: 'absolute', top: '15px', left: '50px', background: '#4caf50', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', zIndex: 10 }}>
                                                หน้าใหม่
                                            </div>
                                        )}

                                        {/* รูปภาพ (ปรับให้ฟิตพอดีเฟรม) */}
                                        <div style={imageWrapper}>
                                            <img src={page.preview} style={mangaImageStyle} alt={`page-${index}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={addMoreBtn}
                        >
                            <Plus size={18} strokeWidth={3} /> เพิ่มรูปภาพ
                        </button>
                        <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                    </div>
                </div>

                {/* 🌟 ส่วนบันทึกข้อมูล */}
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
                        <button type="button" style={cancelBtn} onClick={() => navigate(`/manga/${id}/edit`)}>ยกเลิก</button>
                        <button type="button" style={saveBtn} onClick={() => setShowSaveConfirm(true)}>
                            {isSaving ? ' กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Modals --- */}
            
            {/* Modal: ยืนยันการบันทึกตอน */}
            {showSaveConfirm && (
                <div style={modalOverlay}>
                    <div style={confirmModalContainer}>
                        <h2 style={confirmModalTitle}>ยืนยันการบันทึกการแก้ไข?</h2>
                        <div style={confirmModalActionArea}>
                            <button type="button" style={btnConfirmUpload} onClick={handleUpdateAPI} disabled={isSaving}>
                                ตกลง
                            </button>
                            <button type="button" style={btnCancelUpload} onClick={() => setShowSaveConfirm(false)}>
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: อัปเดตสำเร็จ */}
            {showSuccessOption && (
                <div style={modalOverlay}>
                    <div style={{ ...modalContainer, borderColor: '#4caf50' }}>
                        <h2 style={modalTitle}>✅ อัปเดตสำเร็จ</h2>
                        <div style={modalActionArea}>
                            <button type="button" style={{ ...btnPublishNow, background: '#4caf50' }} onClick={() => navigate(`/manga/${id}/edit`)}>กลับไปหน้าจัดการมังงะ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Styles (จาก CreateMangaChapterPage) ---
const pageContainer: React.CSSProperties = { minHeight: '100vh', backgroundColor: '#f9f9f9', padding: '40px 20px', fontFamily: "'Kanit', sans-serif" };
const formWrapper: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '30px', padding: '40px', width: '100%', maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '35px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' };
const inputGroup = { display: 'flex', flexDirection: 'column' as const, gap: '15px' };
const titleRow = { display: 'flex', alignItems: 'center', gap: '15px' };
const labelPurpleText = { color: '#9b67bd', fontSize: '20px', fontWeight: 'bold' };
const titleInput = { flex: 1, height: '50px', borderRadius: '15px', border: '1.5px solid #eee', backgroundColor: '#fff', outline: 'none', padding: '0 20px', fontSize: '16px', color: 'black' };
const contentListContainer = { display: 'flex', flexDirection: 'column' as const, width: '100%' };
const uploadBoxLarge: React.CSSProperties = { width: '100%', padding: '60px 0', backgroundColor: '#fdfdfd', borderRadius: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' };
const plusIconCircle = { width: '60px', height: '60px', borderRadius: '50%', border: '3px solid #9b67bd', display: 'flex', justifyContent: 'center', alignItems: 'center' };

const pageItemCard: React.CSSProperties = { position: 'relative', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '20px', border: '1px solid #eee', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', cursor: 'grab', overflow: 'hidden' };
const controlOverlay: React.CSSProperties = { position: 'absolute', top: '15px', right: '15px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10, backgroundColor: 'rgba(0, 0, 0, 0.7)', padding: '6px 16px', borderRadius: '25px', backdropFilter: 'blur(4px)', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' };
const pageBadge: React.CSSProperties = { color: '#fff', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center' };
const verticalDivider: React.CSSProperties = { width: '1px', height: '15px', backgroundColor: 'rgba(255,255,255,0.3)' };
const deleteIconButton: React.CSSProperties = { background: 'none', border: 'none', color: '#ff4d6d', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' };
const dragHandleIcon: React.CSSProperties = { position: 'absolute', top: '15px', left: '15px', color: 'rgba(0,0,0,0.15)', zIndex: 5 };
const imageWrapper: React.CSSProperties = { width: '100%', display: 'flex', justifyContent: 'center', background: '#f5f5f5' };
const mangaImageStyle: React.CSSProperties = { width: '100%', height: 'auto', maxWidth: '100%', display: 'block', objectFit: 'contain' };
const addMoreBtn: React.CSSProperties = { background: '#f8f1fb', color: '#9b67bd', padding: '12px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px', justifyContent: 'center', border: 'none' };

const actionSection = { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '35px', marginTop: '20px' };
const statusRowContainer = { display: 'flex', alignItems: 'center', gap: '15px', width: '100%', justifyContent: 'center' };
const mainStatusLabel = { color: '#9b67bd', fontSize: '20px', fontWeight: 'bold' };
const whiteStatusBox: React.CSSProperties = { backgroundColor: '#fcfcfc', border: '1px solid #eee', borderRadius: '20px', padding: '20px 30px', width: '100%', maxWidth: '300px' };
const toggleRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const toggleLabel = { fontSize: '16px', color: '#666', fontWeight: 'bold' };
const switchContainer = { display: 'flex', alignItems: 'center', gap: '15px' };
const switchBase: React.CSSProperties = { width: '38px', height: '22px', borderRadius: '15px', position: 'relative', cursor: 'pointer', transition: '0.3s' };
const switchThumb: React.CSSProperties = { width: '16px', height: '16px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', transition: '0.3s' };
const statusText: React.CSSProperties = { fontSize: '14px', width: '70px', fontWeight: 'bold', whiteSpace: 'nowrap' };
const buttonGroup = { display: 'flex', gap: '20px' };
const cancelBtn = { padding: '14px 40px', borderRadius: '25px', border: 'none', backgroundColor: '#eee', color: '#666', fontWeight: 'bold', cursor: 'pointer' };
const saveBtn = { padding: '14px 50px', borderRadius: '25px', border: 'none', backgroundColor: '#9b67bd', color: '#fff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(155, 103, 189, 0.3)' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };

const confirmModalContainer: React.CSSProperties = { width: '420px', backgroundColor: '#fff', borderRadius: '35px', padding: '45px 35px', textAlign: 'center', border: '4px solid #c68bf5', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' };
const confirmModalTitle: React.CSSProperties = { fontSize: '22px', fontWeight: 'bold', marginBottom: '25px', color: '#444' };
const confirmModalActionArea: React.CSSProperties = { display: 'flex', flexDirection: 'column' as const, gap: '15px', alignItems: 'center' };
const btnConfirmUpload: React.CSSProperties = { width: '100%', padding: '15px 0', backgroundColor: '#ab66d6', color: '#fff', border: 'none', borderRadius: '30px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 20px rgba(171, 102, 214, 0.4)' };
const btnCancelUpload: React.CSSProperties = { width: '60%', padding: '12px 0', backgroundColor: '#f5f5f5', color: '#666', border: 'none', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' };

const modalContainer: React.CSSProperties = { width: '400px', backgroundColor: '#fff', borderRadius: '35px', padding: '45px 35px', textAlign: 'center', border: '4px solid #9b67bd' };
const modalTitle = { fontSize: '24px', fontWeight: 'bold', marginBottom: '25px' };
const modalActionArea = { display: 'flex', flexDirection: 'column' as const, gap: '15px' };
const btnPublishNow: React.CSSProperties = { width: '100%', padding: '15px 0', color: '#fff', border: 'none', borderRadius: '30px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' };
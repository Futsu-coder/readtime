import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Globe, FileEdit, Plus, GripVertical, Trash2, ChevronLeft } from 'lucide-react';
import { API_URL } from "../client";

// 🌟 สร้างโครงสร้างข้อมูลให้รองรับทั้งรูปเก่าและรูปใหม่ (คงเดิม)
interface PageItem {
    id?: number;
    url?: string;  // มีค่าถ้าเป็นรูปเก่า
    file?: File;   // มีค่าถ้าเป็นรูปใหม่ที่เพิ่งเลือก
    preview: string; // ใช้โชว์บนหน้าจอ
}

export function EditMangaChapterPage() {
    const { id, chapterId } = useParams<{ id: string; chapterId: string }>();
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [chapterNumber, setChapterNumber] = useState("");
    const [pages, setPages] = useState<PageItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    
    // 🌟 State สำหรับควบคุม Popup สำเร็จ
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 🌟 Refs สำหรับระบบ Drag & Drop
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        const fetchChapterData = async () => {
            if (!id || !chapterId) return;
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${API_URL}/api/protected/manga/${id}/chapters/${chapterId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    if (data.chapter) {
                        setTitle(data.chapter.title || "");
                        setChapterNumber(data.chapter.chapter_number.toString());
                    }
                    if (data.pages) {
                        // 🌟 แปลงรูปเก่าให้เข้ามาอยู่ใน State
                        setPages(data.pages.map((p: any) => ({
                            id: p.id,
                            url: p.image_url,
                            preview: `${API_URL}${p.image_url}`
                        })));
                    }
                } else {
                    alert("ไม่พบข้อมูลตอนมังงะ");
                    navigate(`/manga/${id}/edit`);
                }
            } catch (err) {
                console.error(err);
                setStatusMsg("โหลดข้อมูลไม่สำเร็จ");
            } finally {
                setIsLoading(false);
            }
        };
        fetchChapterData();
    }, [id, chapterId, navigate]);

    // 🌟 จัดการลากวาง (Drag & Drop)
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
        setTimeout(() => { if (e.target instanceof HTMLElement) e.target.style.opacity = '0.5'; }, 0);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        if (e.target instanceof HTMLElement) e.target.style.opacity = '1';
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            const _pages = [...pages];
            const draggedItemContent = _pages.splice(dragItem.current, 1)[0];
            _pages.splice(dragOverItem.current, 0, draggedItemContent);
            setPages(_pages);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    // 🌟 เลือกรูปใหม่เพิ่มเข้าไป
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

    // 🌟 บันทึกข้อมูล
    const handleUpdate = async (targetStatus: 'published' | 'draft', e: React.MouseEvent) => {
        e.preventDefault();
        if (!chapterNumber.trim()) return setStatusMsg("⚠️ กรุณาระบุเลขตอน");
        if (pages.length === 0) return setStatusMsg("⚠️ กรุณาเพิ่มรูปภาพอย่างน้อย 1 หน้า");

        setIsSaving(true);
        setStatusMsg(targetStatus === 'draft' ? 'กำลังบันทึกเป็นแบบร่าง...' : 'กำลังอัปโหลดและเผยแพร่...');

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("chapterNumber", chapterNumber);
            formData.append("status", targetStatus);

            // 🌟 สร้างแผนผังลำดับภาพส่งไปให้ Backend รู้ว่าอันไหนรูปเก่า อันไหนรูปใหม่
            const pageSequence: string[] = [];
            let newIndex = 0;

            pages.forEach((p) => {
                if (p.file) {
                    formData.append("newPages", p.file); // แนบไฟล์จริงไป
                    pageSequence.push(`NEW:${newIndex}`); // บอกว่าเป็นรูปใหม่ ลำดับที่เท่าไหร่
                    newIndex++;
                } else if (p.url) {
                    pageSequence.push(`OLD:${p.url}`); // บอกว่าเป็นรูปเก่า ใช้ URL เดิม
                }
            });

            formData.append("pageSequence", JSON.stringify(pageSequence));

            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/protected/manga/${id}/chapters/${chapterId}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }, // ❌ ไม่ต้องใส่ Content-Type ให้ Browser จัดการ Boundary ของ FormData เอง
                body: formData
            });

            if (res.ok) {
                // เปลี่ยนจากการใช้ alert() เป็นการเปิด Modal
                setShowSuccessModal(true);
            } else {
                const data = await res.json();
                setStatusMsg(`❌ อัปเดตไม่สำเร็จ: ${data.error || 'เกิดข้อผิดพลาด'}`);
            }
        } catch (err) {
            console.error(err);
            setStatusMsg("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
        } finally {
            setIsSaving(false);
            setTimeout(() => setStatusMsg(""), 3000);
        }
    };

    if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '20px', color: '#9b67bd' }}>⏳ กำลังโหลดข้อมูลตอน...</div>;

    return (
        <div style={pageContainer}>
            
            {/* 🌟 ปุ่มย้อนกลับจากไฟล์เดิม (ไม่มีใน Test แต่ยังเก็บไว้) */}
            <div style={{ maxWidth: '850px', margin: '0 auto 20px auto' }}>
            </div>

            <div style={formWrapper}>
                <div style={inputGroup}>
                    <h2 style={{ textAlign: 'center', color: '#9b67bd', marginBottom: '20px', fontSize: '40px' }}>แก้ไขตอนมังงะ </h2>
                    
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

                <hr style={{ border: 'none', borderTop: '1px dashed #eee', margin: '10px 0' }} />

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
                                        {page.file && (
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
                            <Plus size={18} strokeWidth={3} /> เพิ่มรูปภาพ / แทรกหน้าใหม่
                        </button>
                        <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                    </div>
                </div>

                {/* 🌟 Status Message จากไฟล์เดิม */}
                {statusMsg && !showSuccessModal && (
                    <div style={{ background: statusMsg.includes('✅') ? '#d4edda' : statusMsg.includes('⚠️') || statusMsg.includes('⏳') ? '#fff3cd' : '#fff0f3', color: statusMsg.includes('✅') ? '#155724' : statusMsg.includes('⚠️') || statusMsg.includes('⏳') ? '#856404' : '#d63384', padding: '15px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                        {statusMsg}
                    </div>
                )}

                {/* 🌟 ส่วนบันทึกข้อมูล */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '25px', marginTop: '10px' }}>
                    <Link to={`/manga/${id}/edit`} style={cancelBtnLink}>
                        ยกเลิก
                    </Link>
                    
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button 
                            type="button" 
                            disabled={isSaving} 
                            onClick={(e) => handleUpdate('draft', e)}
                            style={{
                                padding: '12px 25px', borderRadius: '25px', border: '2px solid #ddd', 
                                backgroundColor: '#fff', color: '#666', cursor: isSaving ? 'not-allowed' : 'pointer', 
                                fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSaving ? 0.5 : 1
                            }}
                        >
                            <FileEdit size={18} /> บันทึกเป็นร่าง
                        </button>
                        
                        <button 
                            type="button" 
                            disabled={isSaving}
                            onClick={(e) => handleUpdate('published', e)}
                            style={{
                                ...saveBtn,
                                display: 'flex', alignItems: 'center', gap: '8px', 
                                background: isSaving ? '#ccc' : '#9b67bd',
                                cursor: isSaving ? 'not-allowed' : 'pointer', 
                                boxShadow: isSaving ? 'none' : '0 4px 15px rgba(155, 103, 189, 0.4)'
                            }}
                        >
                            <Globe size={18} /> {isSaving ? "กำลังบันทึก..." : "อัปเดต & เผยแพร่"}
                        </button>
                    </div>
                </div>

            </div>

            {/* Modal: อัปเดตสำเร็จ (ดึง UI มาจากไฟล์ Test) */}
            {showSuccessModal && (
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

// --- Styles ---
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
const addMoreBtn: React.CSSProperties = { background: '#f8f1fb', color: '#9b67bd', padding: '12px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px', justifyContent: 'center', border: 'none', transition: '0.2s' };

const cancelBtnLink: React.CSSProperties = { padding: '12px 35px', borderRadius: '25px', border: 'none', backgroundColor: '#eee', color: '#666', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' };
const saveBtn: React.CSSProperties = { padding: '12px 30px', borderRadius: '25px', border: 'none', backgroundColor: '#9b67bd', color: '#fff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(155, 103, 189, 0.3)' };

// --- Styles สำหรับ Modal (ดึงมาจาก Test_editchaptermanga.tsx) ---
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContainer: React.CSSProperties = { width: '400px', backgroundColor: '#fff', borderRadius: '35px', padding: '45px 35px', textAlign: 'center', border: '4px solid #9b67bd', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' };
const modalTitle = { fontSize: '24px', fontWeight: 'bold', marginBottom: '25px', color: '#444' };
const modalActionArea = { display: 'flex', flexDirection: 'column' as const, gap: '15px' };
const btnPublishNow: React.CSSProperties = { width: '100%', padding: '15px 0', color: '#fff', border: 'none', borderRadius: '30px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 20px rgba(76, 175, 80, 0.4)' };
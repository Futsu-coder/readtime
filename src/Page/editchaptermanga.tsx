import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Globe, FileEdit, Plus, GripVertical, Trash2, ChevronLeft } from 'lucide-react';
import { API_URL } from "../client";

// 🌟 สร้างโครงสร้างข้อมูลให้รองรับทั้งรูปเก่าและรูปใหม่
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
                alert(`✅ อัปเดตตอนมังงะสำเร็จ!`);
                navigate(`/manga/${id}/edit`); 
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

    const inputStyle = { width: '100%', padding: '15px 20px', borderRadius: '15px', border: '1px solid #eee', fontSize: '16px', outline: 'none', color: '#333' };

    if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px', color: '#9b67bd', fontSize: '1.2rem' }}>⏳ กำลังโหลดข้อมูล...</div>;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9', padding: '40px 20px', fontFamily: "'Kanit', 'Sarabun', sans-serif" }}>
            
            <div style={{ maxWidth: '850px', margin: '0 auto 20px auto' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#9b67bd', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '16px', padding: 0 }}>
                    <ChevronLeft size={20} /> ย้อนกลับ
                </button>
            </div>

            <div style={{ maxWidth: '850px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                <h1 style={{ color: '#9b67bd', margin: '0 0 30px 0', fontSize: '2rem', textAlign: 'center' }}>แก้ไขตอนมังงะ ✏️</h1>
                
                <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                    <div style={{ flex: '1' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#9b67bd', fontSize: '18px' }}>เลขตอน <span style={{color: 'red'}}>*</span></label>
                        <input 
                            type="number" step="0.1" value={chapterNumber} onChange={(e) => setChapterNumber(e.target.value)}
                            placeholder="เช่น 1 หรือ 1.5" required style={inputStyle}
                        />
                    </div>
                    <div style={{ flex: '3' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#9b67bd', fontSize: '18px' }}>ชื่อตอน</label>
                        <input 
                            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                            placeholder="จุดเริ่มต้น..." style={inputStyle}
                        />
                    </div>
                </div>
                
                <hr style={{ border: 'none', borderTop: '1px dashed #eee', margin: '30px 0' }} />
                
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: '#9b67bd', fontSize: '20px' }}>จัดเรียงหน้ากระดาษ ({pages.length} หน้า)</h3>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {pages.map((page, index) => (
                            <div 
                                key={index} 
                                draggable 
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()} 
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '20px', 
                                    background: '#fff', padding: '15px', borderRadius: '15px', 
                                    border: '1px solid #eee', boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
                                    cursor: 'grab' 
                                }}
                            >
                                <div style={{ cursor: 'grab', color: '#ccc', display: 'flex', alignItems: 'center' }}>
                                    <GripVertical size={24} />
                                </div>

                                <div style={{ width: '60px', textAlign: 'center' }}>
                                    <h3 style={{ margin: 0, color: '#9b67bd', fontSize: '1.2rem' }}>{index + 1}</h3>
                                    <span style={{ fontSize: '0.75rem', color: '#999' }}>หน้า</span>
                                    {/* 🌟 ป้ายบอกว่ารูปนี้คือรูปใหม่หรือเก่า */}
                                    {page.file && <div style={{ fontSize: '10px', color: '#fff', background: '#4caf50', borderRadius: '10px', padding: '2px', marginTop: '5px' }}>New</div>}
                                </div>

                                <div style={{ flex: 1, height: '400px', background: '#f9f9f9', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                                    <img src={page.preview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt={`page-${index}`} />
                                </div>
                                
                                <button 
                                    onClick={() => removePage(index)}
                                    style={{ background: '#fff0f300', color: '#ff4d6d', border: 'none', borderRadius: '12px', width: '70px', height: '45px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#ffe5e5'}
                                    onMouseOut={e => e.currentTarget.style.background = '#fff0f3'}
                                    title="ลบหน้านี้"
                                >
                                    <Trash2 size={35} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ width: '100%', background: '#fcf8ff', color: '#9b67bd', padding: '15px', borderRadius: '15px', border: '2px dashed #e0c3fc', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginTop:'20px', justifyContent: 'center', fontSize: '16px', transition: '0.2s' }}
                        onMouseOver={e => e.currentTarget.style.background = '#f3e8ff'}
                        onMouseOut={e => e.currentTarget.style.background = '#fcf8ff'}
                    >
                        <Plus size={20} strokeWidth={3} /> เพิ่มรูปภาพ / แทรกหน้าใหม่
                    </button>
                    <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                </div>

                {statusMsg && (
                    <div style={{ background: statusMsg.includes('✅') ? '#d4edda' : statusMsg.includes('⚠️') || statusMsg.includes('⏳') ? '#fff3cd' : '#fff0f3', color: statusMsg.includes('✅') ? '#155724' : statusMsg.includes('⚠️') || statusMsg.includes('⏳') ? '#856404' : '#d63384', padding: '15px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
                        {statusMsg}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '25px' }}>
                    <Link to={`/manga/${id}/edit`} style={{ padding: '12px 35px', borderRadius: '20px', border: 'none', backgroundColor: '#eee', color: '#666', fontWeight: 'bold', fontSize: '16px', textDecoration: 'none' }}>
                        ยกเลิก
                    </Link>
                    
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button 
                            type="button" 
                            disabled={isSaving} 
                            onClick={(e) => handleUpdate('draft', e)}
                            style={{
                                padding: '12px 25px', borderRadius: '20px', border: '2px solid #ddd', 
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
                                padding: '12px 30px', background: isSaving ? '#ccc' : '#9b67bd',
                                color: 'white', border: 'none', borderRadius: '20px', fontSize: '16px', fontWeight: 'bold',
                                cursor: isSaving ? 'not-allowed' : 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: isSaving ? 'none' : '0 4px 15px rgba(155, 103, 189, 0.4)'
                            }}
                        >
                            <Globe size={18} /> {isSaving ? "กำลังบันทึก..." : "อัปเดต & เผยแพร่"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
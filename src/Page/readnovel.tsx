import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { client, API_URL } from "../client";
import { CommentSection } from "../components/comment";
import 'react-quill-new/dist/quill.snow.css';
import { Flag } from 'lucide-react';
import { ReportModal } from '../components/ReportModal';

interface ChapterContent {
    id: number;
    title: string;
    content: string;
    novel_id: number;
}

interface ChapterItem {
    id: number;
    title: string;
}

export function Readchapterpage() {
    const { id, chapterId } = useParams<{ id: string; chapterId: string }>();
    const navigate = useNavigate();
    const [chapter, setChapter] = useState<ChapterContent | null>(null);
    const [allChapters, setAllChapters] = useState<ChapterItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showReport, setShowReport] = useState(false);

    // ข้อมูลนิยายจำลอง (Mock) เพื่อให้แสดงผลได้สวยเหมือนตัวอย่าง

    useEffect(() => {
        const fetchAllChapters = async () => {
            if (!id) return;
            try {
                const res = await client.api.public.novels[':id'].$get({ 
                    param: { id } 
                });
                if (res.ok) {
                    const data = await res.json();
                    if ('chapters' in data) setAllChapters(data.chapters);
                }
            } catch (err) {
                console.error("Error fetching TOC:", err);
            }
        };
        fetchAllChapters();
    }, [id]);

    useEffect(() => {
        const fetchContent = async () => {
            if (!id || !chapterId) return;
            setLoading(true);
            setError("");
            try {
                const res = await client.api.public.novels[':id'].chapters[':chapterID'].$get({
                    param: { id, chapterID: chapterId }
                });
                if (res.ok) {
                    const data = await res.json();
                    if ('chapter' in data) setChapter(data.chapter);
                    else setError("ไม่พบข้อมูลเนื้อหา");
                } else setError("ไม่พบเนื้อหาตอน");
            } catch (err) {
                setError("เชื่อมต่อ Server ไม่ได้");
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
        window.scrollTo(0, 0);
    }, [id, chapterId]);

    useEffect(() => {
        const saveHistory = async () => {
            const token = localStorage.getItem('token');
            if (!token || !id || !chapterId) return; 
            try {
                await fetch(`${API_URL}/api/protected/history`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        work_id: parseInt(id),
                        work_type: 'novel', 
                        chapter_id: parseInt(chapterId)
                    })
                });
            } catch (err) {
                console.error('Save history failed:', err);
            }
        };
        saveHistory();
    }, [id, chapterId]);

    const currentIndex = allChapters.findIndex((c) => c.id === Number(chapterId));
    const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : undefined;
    const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : undefined;

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>กำลังโหลด...</div>;
    if (error) return <div style={{ textAlign: 'center', color: 'red', marginTop: '50px' }}>{error}</div>;
    if (!chapter) return null;

    return (
        <div style={{ background: '#fcfcfc', minHeight: '100vh', paddingTop: '40px', paddingBottom: '40px', fontFamily: "'Sarabun', sans-serif" }}>
            
            {/* กล่องเนื้อหาหลักตามรูปภาพ image_e8d395.png */}
            <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '50px 60px', borderRadius: '4px', border: '1px solid #eee' }}>
                
                {/* Header Section */}
                <div style={{ marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#333' }}>{chapter.title}</h1>
                    <div style={{ borderBottom: '1px solid #eee', marginTop: '20px' }}></div>
                </div>

                {/* ปุ่มรายงานตัวเล็กด้านซ้าย */}
                <div style={{ marginBottom: '20px' }}>
                    <button 
                        onClick={() => setShowReport(true)}
                        style={{ background: '#fff1f0', border: '1px solid #ffa39e', color: '#e11d48', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <Flag size={12} /> รายงานตอนนี้
                    </button>
                </div>

                {/* เนื้อหา (Content) จัดกึ่งกลางตามรูป image_e8d758.png */}
                <div 
                    className="ql-editor" 
                    style={{ 
                        fontSize: '1.2rem', 
                        lineHeight: '2.4', 
                        color: '#333', 
                        textAlign: 'center', 
                        padding: '40px 0 80px 0',
                        whiteSpace: 'pre-wrap' 
                    }}
                    dangerouslySetInnerHTML={{ __html: chapter.content }}
                />

                {/* ปุ่มนำทางท้ายบท (จาก image_e8d395.png และ image_e8d758.png) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '30px', borderTop: '1px solid #eee' }}>
                    <div style={{ flex: 1 }}>
                        {prevChapter && (
                            <button 
                                onClick={() => navigate(`/novel/${id}/chapters/${prevChapter.id}`)}
                                style={{ background: '#7b55c1', border: 'none', color: 'white', cursor: 'pointer', fontSize: '15px' }}
                            >
                                ตอนก่อนหน้า
                            </button>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => navigate(`/novel/${id}`)}
                        style={{ color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px' }}
                    >
                        สารบัญ
                    </button>

                    <div style={{ flex: 1, textAlign: 'right' }}>
                        {nextChapter && (
                            <button 
                                onClick={() => navigate(`/novel/${id}/chapters/${nextChapter.id}`)}
                                style={{ background: '#7b55c1', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '6px', cursor: 'pointer', fontSize: '15px' }}
                            >
                                ตอนต่อไป →
                            </button>
                        )}
                    </div>
                </div>

                {/* ส่วนของ CommentSection (รักษาระบบเดิมไว้) */}
                <div style={{ marginTop: '80px' }}>
                    {id && chapterId && (
                        <CommentSection workType="novel" workId={id!} chapterId={chapterId!} />
                    )}
                </div>
            </div>

            <ReportModal 
                isOpen={showReport} 
                onClose={() => setShowReport(false)} 
                workId={Number(id)} 
                workType="novel" 
                chapterTitle={chapter.title}
            />
        </div>
    );
}
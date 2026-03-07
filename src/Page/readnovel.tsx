import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { client, API_URL } from "../client";
import { CommentSection } from "../components/comment";
import 'react-quill-new/dist/quill.snow.css';

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

    // จำลองข้อมูลนิยาย (คุณสามารถดึงจาก API มาแทนที่ได้)
    const mockNovelInfo = {
        title: "ชื่อนิยายของคุณ",
        author: "นามปากกานักเขียน",
        coverUrl: "https://via.placeholder.com/60x80?text=Cover"
    };

    useEffect(() => {
        const fetchAllChapters = async () => {
            if (!id) return;
            try {
                const res = await client.api.public.novels[':id'].$get({ 
                    param: { id } 
                });
                
                if (res.ok) {
                    const data = await res.json();
                    if ('chapters' in data) {
                        setAllChapters(data.chapters);
                    }
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
                    param: { 
                        id: id,            
                        chapterID: chapterId 
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    if ('chapter' in data) {
                        setChapter(data.chapter);
                    } else {
                        setError("ไม่พบข้อมูลเนื้อหาใน Response");
                    }
                } else {
                    setError("ไม่พบเนื้อหาตอน");
                }

            } catch (err) {
                console.error(err);
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

    const currentIdNum = Number(chapterId);
    const currentIndex = allChapters.findIndex((c) => c.id === currentIdNum);
    const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : undefined;
    const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : undefined;

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>กำลังโหลด...</div>;
    if (error) return <div style={{ textAlign: 'center', color: 'red', marginTop: '50px' }}>{error}</div>;
    if (!chapter) return null;

    return (
        <div style={{ fontFamily: "'Sarabun', sans-serif", background: '#ffffff', minHeight: '100vh', paddingBottom: '40px' }}>
            
            {/* Top Navigation Bar (Sticky) */}
            <div style={{ 
                position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 50,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '12px 20px', borderBottom: '1px solid #f0f0f0',
                boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
            }}>
                <div style={{ color: '#9b59b6', fontSize: '18px', fontWeight: '500' }}>
                    {chapter.title}
                </div>
                
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {/* สารบัญ */}
                    <button onClick={() => navigate(`/novel/${id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9b59b6' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                        <span style={{ fontSize: '10px', marginTop: '4px' }}>สารบัญ</span>
                    </button>
                    {/* ตั้งค่าอ่าน */}
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9b59b6' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', lineHeight: '20px' }}>Aa</span>
                        <span style={{ fontSize: '10px', marginTop: '4px' }}>ตั้งค่าอ่าน</span>
                    </button>
                    {/* เพิ่มเข้าชั้น */}
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9b59b6' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                        <span style={{ fontSize: '10px', marginTop: '4px' }}>เพิ่มเข้าชั้น</span>
                    </button>
                </div>
            </div>

            {/* Main Content Container */}
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
                
                {/* Header Section (Title & Author) */}
                <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '40px' }}>
                    <div style={{ color: '#888', fontSize: '14px' }}>เรื่อง : {mockNovelInfo.title}</div>
                    <h1 style={{ color: '#9b59b6', fontSize: '24px', fontWeight: 'normal', margin: '12px 0' }}>{chapter.title}</h1>
                    <div style={{ color: '#888', fontSize: '14px' }}>โดย {mockNovelInfo.author}</div>
                </div>

                {/* Story Content */}
                <div 
                    className="ql-editor" 
                    style={{ 
                        fontSize: '1.15rem', 
                        lineHeight: '2', 
                        color: '#333333', 
                        marginBottom: '60px', 
                        padding: '0',
                        textAlign: 'center' // จัดข้อความกึ่งกลางตามแบบในรูป
                    }}
                    dangerouslySetInnerHTML={{ __html: chapter.content }}
                />

                {/* Footer Novel Info Card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '0 10px' }}>
                    <img src={mockNovelInfo.coverUrl} alt="cover" style={{ width: '60px', height: '80px', borderRadius: '4px', objectFit: 'cover' }} />
                    <div>
                        <div style={{ color: '#9b59b6', fontSize: '16px', marginBottom: '4px' }}>เรื่อง : {mockNovelInfo.title}</div>
                        <div style={{ color: '#888', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#eee', display: 'inline-block' }}></div>
                            {mockNovelInfo.author}
                        </div>
                    </div>
                </div>

                {/* Navigation Buttons (Prev / Next) */}
                <div style={{ 
                    display: 'flex', 
                    borderRadius: '8px', 
                    overflow: 'hidden', 
                    border: '1px solid #f0f0f0',
                    marginBottom: '40px'
                }}>
                    <button 
                        disabled={!prevChapter}
                        onClick={() => prevChapter && navigate(`/novel/${id}/chapters/${prevChapter.id}`)}
                        style={{ 
                            flex: 1, 
                            padding: '16px', 
                            cursor: prevChapter ? 'pointer' : 'not-allowed', 
                            background: '#f8f8f8', 
                            color: prevChapter ? '#888' : '#ccc', 
                            border: 'none',
                            fontSize: '16px'
                        }}
                    >
                        ตอนก่อนหน้า
                    </button>
                    <button 
                        disabled={!nextChapter}
                        onClick={() => nextChapter && navigate(`/novel/${id}/chapters/${nextChapter.id}`)}
                        style={{ 
                            flex: 1, 
                            padding: '16px', 
                            cursor: nextChapter ? 'pointer' : 'not-allowed', 
                            background: nextChapter ? '#c98bf2' : '#e6cbf7', 
                            color: 'white', 
                            border: 'none',
                            fontSize: '16px'
                        }}
                    >
                        ตอนต่อไป
                    </button>
                </div>

                {/* Comment Section */}
                {id && chapterId && (
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '30px' }}>
                        <CommentSection workType="novel" workId={id!} chapterId={chapterId!} />
                    </div>
                )}
            </div>
        </div>
    );
}
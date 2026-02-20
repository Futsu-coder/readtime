import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { client,API_URL } from "../client";
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
        <div style={{ fontFamily: "'Sarabun', sans-serif", background: '#f9f9f9', minHeight: '100vh' }}>
.            
            <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '40px', minHeight: '100vh', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '30px' }}>
                    <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>{chapter.title}</h1>
                    <Link to={`/novel/${id}`} style={{ textDecoration: 'none', color: '#888' }}>&larr; กลับไปที่หน้าหลัก</Link>
                </div>

                <div 
                    className="ql-editor" 
                    style={{ fontSize: '1.2rem', lineHeight: '1.8', color: '#000000', marginBottom: '50px', padding: '0' }}
                    dangerouslySetInnerHTML={{ __html: chapter.content }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '30px' }}>
                    <button 
                        disabled={!prevChapter}
                        onClick={() => prevChapter && navigate(`/novel/${id}/chapters/${prevChapter.id}`)}
                        style={{ visibility: prevChapter ? 'visible' : 'hidden', padding: '10px 20px', cursor: 'pointer', background: 'white', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                        &larr; ตอนก่อนหน้า
                    </button>

                    <button onClick={() => navigate(`/novel/${id}`)} style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: '#888' }}>
                        สารบัญ
                    </button>
                    <button 
                        disabled={!nextChapter}
                        onClick={() => nextChapter && navigate(`/novel/${id}/chapters/${nextChapter.id}`)}
                        style={{ visibility: nextChapter ? 'visible' : 'hidden', padding: '10px 20px', cursor: 'pointer', background: '#6a4c93', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        ตอนต่อไป &rarr;
                    </button>
                </div>
                    {id && chapterId && (
                        <CommentSection workType="novel" workId={id!} chapterId={chapterId!} />
                    )}
            </div>
        </div>
    );
}
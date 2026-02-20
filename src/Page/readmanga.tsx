import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { API_URL } from "../client";
import { CommentSection } from "../components/comment";

interface MangaChapter {
    id: number;
    title: string;
    chapter_number: number;
    manga_id: number;
}

interface MangaPage {
    id: number;
    page_number: number;
    image_url: string;
}

export function ReadMangaPage() {
    const { id, chapterId } = useParams<{ id: string; chapterId: string }>();
    const navigate = useNavigate();
    const [chapter, setChapter] = useState<MangaChapter | null>(null);
    const [pages, setPages] = useState<MangaPage[]>([]);
    const [allChapters, setAllChapters] = useState<MangaChapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAllChapters = async () => {
            if (!id) return;
            try {
                const res = await fetch(`${API_URL}/api/public/mangas/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.chapters) setAllChapters(data.chapters);
                }
            } catch (err) {
                console.error("Error fetching chapters:", err);
            }
        };
        fetchAllChapters();
    }, [id]);

    useEffect(() => {
        const fetchPages = async () => {
            if (!id || !chapterId) return;
            setLoading(true);
            setError("");
            
            try {
                const res = await fetch(`${API_URL}/api/public/mangas/${id}/chapters/${chapterId}`);
                if (res.ok) {
                    const data = await res.json();
                    setChapter(data.chapter);
                    setPages(data.pages || []);
                } else {
                    setError("ไม่พบข้อมูลตอนมังงะ");
                }
            } catch (err) {
                console.log(err)
                setError("เชื่อมต่อ Server ไม่ได้");
            } finally {
                setLoading(false);
            }
        };
        
        fetchPages();
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
                        work_type: 'manga',
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
    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px', color: '#555' }}>⏳ กำลังโหลดหน้ากระดาษ...</div>;
    if (error) return <div style={{ textAlign: 'center', color: 'red', marginTop: '50px' }}>❌ {error}</div>;
    if (!chapter) return null;

    return (
        <div style={{ backgroundColor: '#111', minHeight: '100vh', fontFamily: "'Sarabun', sans-serif" }}>
            <div style={{ 
                position: 'sticky', top: 0, zIndex: 50, 
                background: 'rgba(20, 20, 20, 0.95)', backdropFilter: 'blur(10px)',
                padding: '15px 20px', borderBottom: '1px solid #333',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <Link to={`/manga/${id}`} style={{ color: '#aaa', textDecoration: 'none', fontWeight: 'bold' }}>
                    &larr; กลับไปสารบัญ
                </Link>
                <div style={{ color: 'white', textAlign: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ff7b00' }}>
                        ตอนที่ {chapter.chapter_number}
                    </h3>
                    <span style={{ fontSize: '0.9rem', color: '#bbb' }}>{chapter.title}</span>
                </div>
                <div style={{ width: '100px' }}></div> 
            </div>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
                {pages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 20px', color: '#888' }}>
                        ไม่พบรูปภาพในตอนนี้...
                    </div>
                ) : (
                    pages.map((page) => (
                        <img 
                            key={page.id}
                            src={`${API_URL}${page.image_url}`} 
                            alt={`หน้าที่ ${page.page_number}`}
                            loading="lazy" 
                            style={{ 
                                width: '100%', 
                                height: 'auto', 
                                display: 'block',
                                backgroundColor: '#222' 
                            }}
                        />
                    ))
                )}
            </div>
            <div style={{ 
                maxWidth: '800px', margin: '0 auto', padding: '40px 20px', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '1px solid #333'
            }}>
                <button 
                    disabled={!prevChapter}
                    onClick={() => prevChapter && navigate(`/manga/${id}/read/${prevChapter.id}`)}
                    style={{ 
                        visibility: prevChapter ? 'visible' : 'hidden', 
                        padding: '12px 25px', cursor: 'pointer', background: '#333', 
                        color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold'
                    }}
                >
                    &larr; ตอนก่อนหน้า
                </button>

                <button 
                    disabled={!nextChapter}
                    onClick={() => nextChapter && navigate(`/manga/${id}/read/${nextChapter.id}`)}
                    style={{ 
                        visibility: nextChapter ? 'visible' : 'hidden', 
                        padding: '12px 25px', cursor: 'pointer', background: '#ff7b00', 
                        color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(255, 123, 0, 0.3)'
                    }}
                >
                    ตอนต่อไป &rarr;
                </button>
            </div>
            {id && chapterId && (
                <CommentSection workType="manga" workId={id!} chapterId={chapterId!} />
            )}
        </div>
    );
}
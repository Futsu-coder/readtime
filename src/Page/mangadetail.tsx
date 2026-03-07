import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, BookOpen, Heart } from 'lucide-react';
import { API_URL } from "../client"; 
import { NovelImage } from "../components/novelimage";

interface Manga {
    id: number;
    title: string;
    description: string;
    category: string;
    author: string;
    owner_id: number; 
    created_at: string;
    view_count: number;
    cover_image?: string | null; 
}

interface MangaChapter {
    id: number;
    title: string;
    chapter_number: number;
    created_at: string;
}

export function MangaDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [manga, setManga] = useState<Manga | null>(null);
    const [chapters, setChapters] = useState<MangaChapter[]>([]);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isHover, setIsHover] = useState(false); 
    const [currentUserId] = useState<number | null>(() => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload?.id || null;
        } catch { return null; }
    });
    const isLoggedIn = !!localStorage.getItem('token');

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const res = await fetch(`${API_URL}/api/public/mangas/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setManga(data.manga);
                    setChapters(data.chapters || []);
                }
            } catch (err) { console.error(err); }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        if (isLoggedIn && id) {
            fetch(`${API_URL}/api/protected/manga/${id}/bookmark-status`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
            .then(res => res.json())
            .then(data => setIsBookmarked(data.isBookmarked))
            .catch(err => console.error(err));
        }
    }, [id, isLoggedIn]);

    const handleBookmark = async () => {
        if (!isLoggedIn) return alert("กรุณาเข้าสู่ระบบก่อนเก็บผลงานเข้าชั้น");
        const res = await fetch(`${API_URL}/api/protected/manga/${id}/bookmark`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            setIsBookmarked(data.isBookmarked);
        }
    };

    if (!manga) return (
        <div style={{ ...pageWrapper, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ color: '#888' }}>กำลังโหลดรายละเอียด...</div>
        </div>
    );

    return (
        <div style={pageWrapper}>
            <div style={containerStyle}>
                <button onClick={() => navigate(-1)} style={backBtn}>
                    <ChevronLeft size={20} /> ย้อนกลับ
                </button>
                <div style={headerCard}>
                    <div style={coverBox}>
                        <NovelImage 
                            src={manga.cover_image} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                    </div>
                    <div style={infoBox}>
                        <div style={{ marginBottom: '10px' }}>
                            <span style={typeTag}>มังงะ</span>
                        </div>
                        <h1 style={titleText}>{manga.title}</h1>
                        <p 
                            style={{ ...authorText, cursor: 'pointer', textDecoration: isHover ? 'underline' : 'none' }} 
                            onMouseEnter={() => setIsHover(true)}
                            onMouseLeave={() => setIsHover(false)}
                        >
                            ผูวด: {manga.author || 'ไม่ระบุผู้วาด'}
                        </p>
                        <div style={tagGroup}>
                            <span style={tag}>{manga.category}</span>
                        </div>
                        <p style={{ color: '#494949', fontWeight: 'bold', marginBottom: '8px' }}>เรื่องย่อ :</p>
                        <div 
                            style={descText} 
                            dangerouslySetInnerHTML={{ __html: manga.description || '<p>ไม่มีเรื่องย่อ...</p>' }} 
                        />
                        <div style={statsRow}>
                            <span 
                                onClick={handleBookmark}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                                    color: isBookmarked ? '#ff4d6d' : '#888',
                                    fontWeight: isBookmarked ? 'bold' : 'normal',
                                    transition: '0.2s'
                                }}
                            >
                                <Heart 
                                    size={18} 
                                    color={isBookmarked ? '#ff4d6d' : '#aaa'} 
                                    fill={isBookmarked ? '#ff4d6d' : 'none'} 
                                /> 
                                {isBookmarked ? 'เก็บเข้าชั้นแล้ว' : 'เพิ่มเข้าชั้น'}
                            </span>

                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888' }}>
                                <BookOpen size={18} color="#aaa" /> 
                                {manga.view_count.toLocaleString()} ครั้ง
                            </span>
                        </div>
                    </div>
                </div>
                <div style={listSection}>
                    <h3 style={sectionTitle}>รายการตอนทั้งหมด ({chapters.length})</h3>
                    {chapters.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>ยังไม่มีตอนมังงะ...</div>
                    ) : (
                        chapters.map((chap) => (
                            <div 
                                key={chap.id} 
                                style={episodeItem} 
                                onClick={() => navigate(`/manga/${id}/chapters/${chap.id}`)}
                            >
                                <div>
                                    <div style={epTitle}>
                                        <span style={{ color: '#9b67bd', marginRight: '8px', fontWeight: 'bold' }}>
                                            ตอนที่ {chap.chapter_number}
                                        </span>
                                        {chap.title}
                                    </div>
                                    <div style={epDate}>
                                        {new Date(chap.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                                <Play size={18} color="#9b67bd" style={{ flexShrink: 0 }} />
                            </div>
                        ))
                    )}
                    {currentUserId === manga.owner_id && (
                        <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px dashed #e0e0e0', paddingTop: '25px' }}>
                            <button 
                                onClick={() => navigate(`/manga/${id}/chapters`)}
                                style={uploadBtn}
                            >
                                + อัปโหลดตอนใหม่เพิ่ม
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Styles ---
const pageWrapper: React.CSSProperties = {
    backgroundColor: '#ffffff',
    minHeight: '100vh',
    width: '100%',
    margin: 0,
    padding: '1px 0'
};
const containerStyle: React.CSSProperties = { maxWidth: '1000px', margin: '40px auto', padding: '0 30px', fontFamily: "'Kanit', 'Sarabun', sans-serif" };
const backBtn: React.CSSProperties = { border: 'none', background: 'none', color: '#9b67bd', cursor: 'pointer', display: 'flex', alignItems: 'center', marginBottom: '20px', fontWeight: 'bold', fontSize: '15px', padding: 0 };
const headerCard: React.CSSProperties = { display: 'flex', gap: '40px', backgroundColor: '#fff', padding: '35px', borderRadius: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', marginBottom: '40px', flexWrap: 'wrap', border: '1px solid #f0f0f0' };
const coverBox: React.CSSProperties = { width: '240px', height: '340px', backgroundColor: '#fff9f2', borderRadius: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #ffe8cc', overflow: 'hidden', flexShrink: 0, margin: '0 auto' };
const infoBox: React.CSSProperties = { flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' };
const typeTag: React.CSSProperties = { background: '#9b67bd', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'inline-block' };
const titleText: React.CSSProperties = { fontSize: '32px', margin: '0 0 10px 0', color: '#222', fontWeight: 800, lineHeight: 1.2 };
const authorText: React.CSSProperties = { color: '#9b67bd', fontWeight: '500', marginBottom: '20px', fontSize: '15px' };
const tagGroup: React.CSSProperties = { display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' };
const tag: React.CSSProperties = { backgroundColor: '#fff4e6', padding: '6px 18px', borderRadius: '20px', fontSize: '13px', color: '#9b67bd', fontWeight: 'bold' };
const descText: React.CSSProperties = { lineHeight: '1.7', color: '#555', marginBottom: '30px', fontSize: '15px', backgroundColor: '#fafafa', padding: '20px', borderRadius: '12px' , border: '1px solid #eee'};
const statsRow: React.CSSProperties = { display: 'flex', gap: '25px', color: '#aaa', fontSize: '15px', marginTop: 'auto' };
const listSection: React.CSSProperties = { backgroundColor: '#fffbf5', padding: '35px', borderRadius: '25px', border: '1px solid #fff4e6', marginBottom: '50px' };
const sectionTitle: React.CSSProperties = { margin: '0 0 25px 0', color: '#333', fontSize: '22px' };
const episodeItem: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 25px', backgroundColor: '#fff', borderRadius: '15px', marginBottom: '12px', cursor: 'pointer', border: '1px solid #f0f0f0', transition: '0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const epTitle: React.CSSProperties = { fontWeight: '600', color: '#444', fontSize: '16px' };
const epDate: React.CSSProperties = { fontSize: '13px', color: '#aaa', marginTop: '6px' };
const uploadBtn: React.CSSProperties = { padding: '12px 30px', background: '#9b67bd', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem', boxShadow: '0 4px 15px rgba(155, 103, 189, 0.2)' };
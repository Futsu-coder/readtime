import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../client";
import { NovelCard } from "../components/novelcard";

interface Work {
    id: number;
    title: string;
    description: string;
    category: string;
    cover_image?: string | null;
    type: 'novel' | 'manga'; 
}

export function MyBookmarksPage() {
    const [works, setWorks] = useState<Work[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const isLoggedIn = !!localStorage.getItem('token');

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        const fetchAllBookmarks = async () => {
            try {
                const token = localStorage.getItem('token')               
                const res = await fetch(`${API_URL}/api/my/bookmarks-all`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setWorks(data.works || []); 
                }
            } catch (err) {
                console.error("โหลดชั้นหนังสือไม่สำเร็จ:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllBookmarks();
    }, [isLoggedIn, navigate]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#ffffff', color: '#ff4d6d', fontSize: '1.2rem', fontFamily: "'Kanit', 'Sarabun', sans-serif" }}>
            กำลังเปิดชั้นหนังสือ...
        </div>
    );

    return (
        <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', width: '100%', fontFamily: "'Kanit', 'Sarabun', sans-serif", paddingBottom: '80px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 30px' }}>
                <div style={{ borderBottom: '2px solid #ff4d6d', paddingBottom: '15px', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: '#333' }}>ชั้นหนังสือของฉัน</h2>
                    <p style={{ color: '#888', margin: '5px 0 0 0' }}>รวมผลงานที่คุณเก็บไว้ทั้งหมด {works.length} เรื่อง</p>
                </div>

                {works.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', background: '#ffffff', border: '1px dashed #ccc', borderRadius: '15px', marginTop: '30px' }}>
                        <h3 style={{ color: '#666' }}>ไม่มีหนังสือในชั้นหนังสือ</h3>
                        <p style={{ color: '#999' }}>ลองไปหาเรื่องที่ชอบแล้วกด "เก็บเข้าชั้น" </p>
                        <Link to="/">
                            <button style={{ marginTop: '20px', padding: '12px 30px', background: '#ff4d6d', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}>
                                ไปสำรวจผลงานเลย
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px', marginTop: '30px' }}>
                        {works.map((work) => (
                            <NovelCard key={`${work.type}-${work.id}`} novel={work as any} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
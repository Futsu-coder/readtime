import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../client";
import { NovelCard, type Novel } from "../components/novelcard";

export function MyBookmarksPage() {
    const [works, setWorks] = useState<Novel[]>([]); // 🌟 ใช้ Type จาก NovelCard ได้เลย
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
                
                {/* Header */}
                <div style={{ borderBottom: '2px solid #ff4d6d', paddingBottom: '15px', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: '#333' }}>ชั้นหนังสือของฉัน</h2>
                    <p style={{ color: '#888', margin: '5px 0 0 0' }}>รวมผลงานที่คุณเก็บไว้ทั้งหมด {works.length} เรื่อง</p>
                </div>

                {works.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', background: '#ffffff', border: '1px dashed #ccc', borderRadius: '15px', marginTop: '30px' }}>
                        <h3 style={{ color: '#666', marginBottom: '10px' }}>ไม่มีหนังสือในชั้นหนังสือ </h3>
                        <p style={{ color: '#999' }}>ลองไปหาเรื่องที่ชอบแล้วกด "เก็บเข้าชั้น" ดูสิครับ</p>
                        <Link to="/">
                            <button style={{ 
                                marginTop: '20px', padding: '12px 30px', background: '#ff4d6d', color: 'white', 
                                border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(255, 77, 109, 0.3)', transition: 'transform 0.2s'
                            }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                                ไปสำรวจผลงานเลย
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px', marginTop: '30px' }}>
                        {works.map((work) => (
                            // 🌟 โยนข้อมูลให้ NovelCard จัดการเรนเดอร์ UI สวยๆ
                            <NovelCard key={`${work.type}-${work.id}`} novel={work} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
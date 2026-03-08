import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../client";
import { NovelCard, type Novel } from "../components/novelcard"; // 🌟 Import NovelCard มาใช้[cite: 8]

interface HistoryItem {
    history_id: number;
    work_id: number;
    work_type: 'novel' | 'manga';
    chapter_id: number;
    title: string;
    cover_image: string | null;
    last_read_at: string;
    // 🌟 รับสถิติจาก Backend
    category?: string;
    author?: string;
    chapter_count?: number;
    view_count?: number;
    bookmark_count?: number;
    is_completed?: number;
}

export function HistoryPage() {
    const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return navigate("/login");

                const res = await fetch(`${API_URL}/api/protected/history`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setHistoryList(data.history || []);
                }
            } catch (err) {
                console.error("Error fetching history:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [navigate]);

    if (isLoading) return <div style={{ textAlign: "center", marginTop: "50px" }}>กำลังโหลดประวัติการอ่าน...</div>;

    return (
        <div style={{ maxWidth: "1000px", margin: "40px auto", padding: "0 20px", fontFamily: "'Sarabun', sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "30px", borderBottom: "2px solid #6a4c93", paddingBottom: "15px" }}>
                <h1 style={{ color: "#7b7b7b", margin: 0 }}>ประวัติการอ่านของฉัน</h1>
            </div>
            
            {historyList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "#f9f9f9", borderRadius: "16px", color: "#888" }}>
                    <h3 style={{ margin: "0 0 10px 0" }}>ยังไม่มีประวัติการอ่าน</h3>
                    <Link to="/">
                        <button style={{ padding: "12px 30px", background: "#6a4c93", color: "white", border: "none", borderRadius: "30px", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" }}>
                            กลับหน้าแรก
                        </button>
                    </Link>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "25px" }}>
                    {historyList.map((item) => {
                        // 🌟 แปลงข้อมูล HistoryItem ให้กลายเป็นรูปแบบที่ NovelCard เข้าใจ
                        const cardData: Novel = {
                            id: item.work_id,
                            title: item.title,
                            description: "", 
                            category: item.category || "", 
                            type: item.work_type,
                            cover_image: item.cover_image,
                            created_at: item.last_read_at,
                            author: item.author,
                            chapter_count: item.chapter_count,
                            view_count: item.view_count,
                            bookmark_count: item.bookmark_count,
                            is_completed: item.is_completed,
                        };

                        return (
                            <div key={item.history_id} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                
                                {/* 🌟 เรียกใช้ NovelCard แบบสำเร็จรูป */}
                                <div style={{ flex: 1 }}>
                                    <NovelCard novel={cardData} />
                                </div>
                                
                                {/* 🌟 ส่วนปุ่มอ่านต่อด้านล่าง */}
                                <div style={{ marginTop: '10px', background: '#f8f9fa', padding: '12px', borderRadius: '12px', border: '1px solid #eee' }}>
                                    <p style={{ margin: "0 0 10px 0", fontSize: "0.8rem", color: "#666", textAlign: "center" }}>
                                        อ่านล่าสุด: {new Date(item.last_read_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                                    </p>
                                    <Link 
                                        to={`/${item.work_type === 'novel' ? 'novel' : 'manga'}/${item.work_id}/chapters/${item.chapter_id}`} 
                                        style={{ textDecoration: "none" }}
                                    >
                                        <button 
                                            style={{ 
                                                width: "100%", padding: "10px", 
                                                background: item.work_type === 'novel' ? "#6a4c93" : "#ff7b00", 
                                                color: "white", border: "none", borderRadius: "8px", 
                                                fontWeight: "bold", cursor: "pointer", transition: "transform 0.1s",
                                                boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                                            }} 
                                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} 
                                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            อ่านต่อตอนล่าสุด
                                        </button>
                                    </Link>
                                </div>
                                
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
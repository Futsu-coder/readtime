import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../client";
import { NovelImage } from "../components/novelimage";

interface HistoryItem {
    history_id: number;
    work_id: number;
    work_type: 'novel' | 'manga';
    chapter_id: number;
    title: string;
    cover_image: string | null;
    last_read_at: string;
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
                    {historyList.map((item) => (
                        <div key={item.history_id} style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.06)", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div style={{ width: "100%", height: "300px", position: "relative" }}>
                                <NovelImage src={item.cover_image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                <div style={{ position: "absolute", top: "10px", right: "10px", background: item.work_type === 'novel' ? "#6a4c93" : "#ff7b00", color: "white", padding: "5px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
                                    {item.work_type === 'novel' ? 'นิยาย' : 'มังงะ'}
                                </div>
                            </div>
                            <div style={{ padding: "15px" }}>
                                <h3 style={{ margin: "0 0 10px 0", fontSize: "1.1rem", color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.title}>
                                    {item.title}
                                </h3>            
                                <p style={{ margin: "0 0 15px 0", fontSize: "0.85rem", color: "#888" }}>
                                    อ่านล่าสุด: {new Date(item.last_read_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                                <Link 
                                    to={`/${item.work_type === 'novel' ? 'novel' : 'manga'}/${item.work_id}/chapters/${item.chapter_id}`} 
                                    style={{ textDecoration: "none" }}
                                >
                                    <button style={{ width: "100%", padding: "10px", background: item.work_type === 'novel' ? "#f3e8ff" : "#fff0e6", color: item.work_type === 'novel' ? "#6a4c93" : "#ff7b00", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }} onMouseOver={e => e.currentTarget.style.opacity = '0.8'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>
                                        อ่านต่อ
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
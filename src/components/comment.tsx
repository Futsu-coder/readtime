import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../client"; 

interface Comment {
    id: number;
    user_id: number;
    username: string;
    content: string;
    created_at: string;
    avatar_url?: string | null; // 🌟 รับ URL รูปโปรไฟล์
}

interface CommentSectionProps {
    workType: "novel" | "manga"; 
    workId: string;
    chapterId: string;
}

export function CommentSection({ workType, workId, chapterId }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isLoggedIn = !!localStorage.getItem("token");

    const themeColor = workType === "novel" ? "#6a4c93" : "#ff7b00";
    
    // 🌟 1. ดึง Path เป็นพหูพจน์ให้ตรงกับ Backend
    const apiPublicPath = workType === "novel" ? "novels" : "mangas";
    const apiProtectedPath = workType === "novel" ? "novels" : "manga";

    const fetchComments = async () => {
        try {
            const res = await fetch(`${API_URL}/api/public/${apiPublicPath}/${workId}/chapters/${chapterId}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
            }
        } catch (err) {
            console.error("Load Comments Error:", err);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [workType, workId, chapterId]);

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/protected/${apiProtectedPath}/${workId}/chapters/${chapterId}/comments`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ content: newComment, workType: workType }) 
            });

            if (res.ok) {
                setNewComment("");
                fetchComments();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ marginTop: "60px", maxWidth: "800px", margin: "60px auto 0", fontFamily: "'Sarabun', sans-serif" }}>
            <h3 style={{ borderBottom: `2px solid ${themeColor}`, paddingBottom: "10px", marginBottom: "30px", color: "#333", fontSize: '20px' }}>
                ความคิดเห็นผู้อ่าน ({comments.length})
            </h3>
            
            {/* กล่องพิมพ์คอมเมนต์ */}
            {isLoggedIn ? (
                <div style={{ marginBottom: "40px", background: "#f9f9f9", padding: "25px", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="แชร์ความรู้สึกหลังอ่านตอนนี้หน่อย..."
                        style={{ width: "100%", height: "120px", padding: "15px", borderRadius: "12px", border: "1.5px solid #ddd", fontSize: "16px", marginBottom: "15px", outline: "none", resize: "vertical", boxSizing: 'border-box' }}
                        onFocus={(e) => e.target.style.borderColor = themeColor}
                        onBlur={(e) => e.target.style.borderColor = "#ddd"}
                    />
                    <div style={{ textAlign: "right" }}>
                        <button 
                            onClick={handlePostComment}
                            disabled={isSubmitting}
                            style={{ padding: "12px 30px", background: isSubmitting ? "#ccc" : themeColor, color: "white", border: "none", borderRadius: "30px", cursor: isSubmitting ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "16px", transition: "0.2s", boxShadow: isSubmitting ? 'none' : `0 4px 10px ${themeColor}40` }}
                        >
                            {isSubmitting ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: "center", padding: "30px", background: "#f5f5f5", borderRadius: "15px", marginBottom: "40px", fontSize: '16px' }}>
                    <Link to="/login" style={{ color: themeColor, fontWeight: "bold", textDecoration: "none" }}>กรุณาเข้าสู่ระบบ</Link> เพื่อร่วมแสดงความคิดเห็น
                </div>
            )}

            {/* รายการคอมเมนต์ */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {comments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#888', background: '#fafafa', borderRadius: '15px', border: '1px dashed #ddd' }}>
                        ยังไม่มีความคิดเห็นในตอนนี้ เป็นคนแรกที่คอมเมนต์สิ!
                    </div>
                ) : (
                    comments.map((c) => (
                        <div key={c.id} style={{ padding: "25px", border: "1px solid #eee", borderRadius: "15px", background: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                            
                            {/* 🌟 จัดกลุ่ม Header: รูป + ชื่อ + เวลาให้อยู่ในแถวเดียวกัน */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                                
                                {/* 🌟 กลุ่มรูปกับชื่อ */}
                                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid #f0f0f0' }}>
                                        <img 
                                            src={c.avatar_url 
                                                ? `${API_URL}${c.avatar_url}` 
                                                : `https://api.dicebear.com/7.x/bottts/svg?seed=${c.username}`} 
                                            alt={c.username} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <div style={{ fontWeight: "bold", color: themeColor, fontSize: '18px' }}>
                                        {c.username}
                                    </div>
                                </div>

                                {/* 🌟 เวลาไว้มุมขวา */}
                                <small style={{ color: "#aaa", fontSize: '14px', marginTop: '5px' }}>
                                    {new Date(c.created_at).toLocaleString("th-TH", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </small>

                            </div>

                            {/* 🌟 เนื้อหาคอมเมนต์ เถิบให้ตรงกับชื่อ */}
                            <div style={{ paddingLeft: '65px' }}>
                                <p style={{ margin: 0, color: "#444", lineHeight: "1.6", whiteSpace: "pre-wrap", fontSize: '16px' }}>
                                    {c.content}
                                </p>
                            </div>
                            
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../client"; 

interface Comment {
    id: number;
    user_id: number;
    username: string;
    content: string;
    created_at: string;
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

    const themeColor = workType === "novel" ? "#6a4c93" : "#c98bf2";
    const apiPublicPath = workType === "novel" ? "novel" : "manga";
    const apiProtectedPath = workType === "novel" ? "novel" : "manga";

    const fetchComments = async () => {
        try {
            // ยิง api ไปที่ /api/public/novels/... หรือ /api/public/mangas/...
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
        <div style={{ marginTop: "60px", maxWidth: "800px", margin: "60px auto 0" }}>
            <h3 style={{ borderBottom: `2px solid ${themeColor}`, paddingBottom: "10px", marginBottom: "30px", color: "#333" }}>
                ความคิดเห็นผู้อ่าน ({comments.length})
            </h3>
            {isLoggedIn ? (
                <div style={{ marginBottom: "40px", background: "#f9f9f9", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="แชร์ความรู้สึกหลังอ่านตอนนี้หน่อย..."
                        style={{ width: "100%", height: "100px", padding: "5px 0px 0px 5px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem", marginBottom: "10px", outline: "none", resize: "vertical",background: "white", color: "#333" }}
                        onFocus={(e) => e.target.style.borderColor = themeColor}
                        onBlur={(e) => e.target.style.borderColor = "#ddd"}
                    />
                    <div style={{ textAlign: "right" }}>
                        <button 
                            onClick={handlePostComment}
                            disabled={isSubmitting}
                            style={{ padding: "10px 25px", background: isSubmitting ? "#ccc" : themeColor, color: "white", border: "none", borderRadius: "30px", cursor: isSubmitting ? "not-allowed" : "pointer", fontWeight: "bold", transition: "0.2s" }}
                        >
                            {isSubmitting ? "กำลังส่งคอมเมนต์..." : "ส่งคอมเมนต์แล้ว"}
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: "center", padding: "20px", background: "#eee", borderRadius: "8px", marginBottom: "30px" }}>
                    <Link to="/login" style={{ color: themeColor, fontWeight: "bold", textDecoration: "none" }}>กรุณาเข้าสู่ระบบ</Link> เพื่อร่วมแสดงความคิดเห็น
                </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {comments.map((c) => (
                    <div key={c.id} style={{ padding: "20px", border: "1px solid #f0f0f0", borderRadius: "12px", background: "white" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "center" }}>
                            <span style={{ fontWeight: "bold", color: themeColor }}>👤 {c.username}</span>
                            <small style={{ color: "#999" }}>
                                {new Date(c.created_at).toLocaleString("th-TH")}
                            </small>
                        </div>
                        <p style={{ margin: 0, color: "#444", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>{c.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
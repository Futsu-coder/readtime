import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../client"; 

interface Comment {
    id: number;
    user_id: number;
    username: string;
    content: string;
    created_at: string;
    avatar_url?: string | null; 
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

    // --- คง Logic เดิมไว้ทั้งหมด ---
    const themeColor = workType === "novel" ? "#6a4c93" : "#c98bf2"; // ปรับสีตามไฟล์ Test
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
        // ปรับ Container ตามสไตล์ไฟล์ Test
        <div style={{ marginTop: "60px", maxWidth: "800px", margin: "60px auto 0" }}>
            <h3 style={{ borderBottom: `2px solid ${themeColor}`, paddingBottom: "10px", marginBottom: "30px", color: "#333" }}>
                ความคิดเห็นผู้อ่าน ({comments.length})
            </h3>
            
            {/* กล่องพิมพ์คอมเมนต์ (UI จากไฟล์ Test) */}
            {isLoggedIn ? (
                <div style={{ marginBottom: "40px", background: "#f9f9f9", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="แชร์ความรู้สึกหลังอ่านตอนนี้หน่อย..."
                        style={{ width: "100%", height: "100px", padding: "5px 0px 0px 5px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem", marginBottom: "10px", outline: "none", resize: "vertical", background: "white", color: "#333", boxSizing: 'border-box' }}
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

            {/* รายการคอมเมนต์ (ผสมผสานสไตล์ Test + Logic รูปโปรไฟล์ของเดิม) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {comments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#888', background: '#fafafa', borderRadius: '15px', border: '1px dashed #ddd' }}>
                        ยังไม่มีความคิดเห็นในตอนนี้ เป็นคนแรกที่คอมเมนต์สิ!
                    </div>
                ) : (
                    comments.map((c) => (
                        <div key={c.id} style={{ padding: "20px", border: "1px solid #f0f0f0", borderRadius: "12px", background: "white" }}>
                            
                            {/* Header: คงความสามารถแสดงรูป (จากของเดิม) แต่ใช้ Layout ระยะห่างจากไฟล์ Test */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    {/* ส่วนรูปโปรไฟล์ที่ไฟล์ Test ไม่มี แต่ไฟล์หลักมี (ต้องเก็บไว้) */}
                                    <div style={{ width: '35px', height: '35px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid #f0f0f0' }}>
                                        <img 
                                            src={c.avatar_url 
                                                ? `${API_URL}${c.avatar_url}` 
                                                : `https://api.dicebear.com/7.x/bottts/svg?seed=${c.username}`} 
                                            alt={c.username} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <span style={{ fontWeight: "bold", color: themeColor }}>
                                        {c.username}
                                    </span>
                                </div>

                                <small style={{ color: "#999" }}>
                                    {new Date(c.created_at).toLocaleString("th-TH")}
                                </small>
                            </div>

                            {/* เนื้อหาคอมเมนต์ */}
                            <div style={{ paddingLeft: '45px' }}>
                                <p style={{ margin: 0, color: "#444", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
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
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from "../client";

export function ProfilePage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [authorName, setAuthorName] = useState("");
    const [joinDate, setJoinDate] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    navigate("/login");
                    return;
                }

                const res = await fetch(`${API_URL}/api/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setUsername(data.user.username);
                        setAuthorName(data.user.author || ""); 
                        setJoinDate(data.user.created_at);
                    }
                } else {
                    localStorage.removeItem("token");
                    navigate("/login");
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
                setStatusMsg("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        setStatusMsg("กำลังบันทึกข้อมูล...");
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/profile`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ author: authorName })
            });

            if (res.ok) {
                setStatusMsg("บันทึกนามปากกาสำเร็จ!");
            } else {
                setStatusMsg("เกิดข้อผิดพลาดในการบันทึก");
            }
        } catch (err) {
            console.error(err);
            setStatusMsg("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
        } finally {
            setIsSaving(false);
            setTimeout(() => setStatusMsg(""), 3000);
        }
    };

    const handleLogout = () => {
        const confirmLogout = confirm("แน่ใจหรือไม่ว่าต้องการออกจากระบบ?");
        if (confirmLogout) {
            localStorage.removeItem("token");
            alert("ออกจากระบบแล้ว");
            window.location.href = '/';
        }
    };

    const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem", outline: "none", backgroundColor: "#fff" , color:'#3e3e3e'};

    if (isLoading) return <div style={{ textAlign: "center", marginTop: "50px" }}>กำลังโหลดข้อมูลโปรไฟล์...</div>;

    return (
        <div style={{ maxWidth: "600px", margin: "40px auto", padding: "0 20px", fontFamily: "'Sarabun', sans-serif" }}>
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
                <h1 style={{ color: "#6a4c93", margin: "0 0 10px 0", fontSize: "2.2rem" }}>โปรไฟล์ของฉัน</h1>
                <p style={{ color: "#666" }}>จัดการข้อมูลส่วนตัวและนามปากกาของคุณ</p>
            </div>

            <div style={{ background: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
            <div style={{ textAlign: "left"}}>
                <Link to="/" style={{ color: "#888", textDecoration: "none" }}>
                    &larr; กลับหน้าหลัก
                </Link>
            </div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "30px" }}>
                    <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                        🧑‍💻
                    </div>
                </div>
                <div style={{ marginBottom: "25px" }}>
                    <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", color: "#333" }}>
                        บัญชีผู้ใช้ (Username)
                    </label>
                    <input 
                        type="text" 
                        value={username} 
                        disabled 
                        style={{ ...inputStyle, backgroundColor: "#f5f5f5", color: "#888", cursor: "not-allowed" }} 
                        title="ชื่อผู้ใช้ไม่สามารถเปลี่ยนแปลงได้"
                    />
                </div>
                <div style={{ marginBottom: "25px" }}>
                    <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", color: "#333" }}>
                        นามปากกา (Author Name)
                    </label>
                    <input 
                        type="text" 
                        value={authorName} 
                        onChange={(e) => setAuthorName(e.target.value)} 
                        placeholder="ตั้งนามปากกาสำหรับผลงานของคุณ..."
                        style={inputStyle} 
                    />
                    <small style={{ color: "#888", display: "block", marginTop: "5px" }}>
                        *ชื่อนี้จะไปปรากฏเป็นชื่อผู้แต่งในนิยายและมังงะของคุณ
                    </small>
                </div>

                <div style={{ marginBottom: "30px", borderTop: "1px dashed #eee", paddingTop: "20px" }}>
                    <p style={{ color: "#999", fontSize: "0.9rem", margin: 0 }}>
                        เข้าร่วมเมื่อ: {new Date(joinDate).toLocaleDateString("th-TH", { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                {statusMsg && (
                    <div style={{ background: statusMsg.includes("✅") ? "#d4edda" : "#fff0f3", color: statusMsg.includes("✅") ? "#155724" : "#d63384", padding: "12px", borderRadius: "8px", marginBottom: "20px", textAlign: "center", fontWeight: "bold" }}>
                        {statusMsg}
                    </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <button 
                        onClick={handleSaveProfile} 
                        disabled={isSaving}
                        style={{ width: "100%", padding: "14px", background: "#6a4c93", color: "white", border: "none", borderRadius: "30px", fontSize: "1.1rem", fontWeight: "bold", cursor: isSaving ? "not-allowed" : "pointer", transition: "0.2s" }}
                    >
                        {isSaving ? "⏳ กำลังบันทึก..." : "💾 บันทึกการเปลี่ยนแปลง"}
                    </button>
                    <button 
                        onClick={handleLogout} 
                        style={{ width: "100%", padding: "14px", background: "transparent", color: "#ff4d6d", border: "1px solid #ff4d6d", borderRadius: "30px", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#fff0f3"}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                        ออกจากระบบ
                    </button>
                </div>

            </div>
            

        </div>
    );
}
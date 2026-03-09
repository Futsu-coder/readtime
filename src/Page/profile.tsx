import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Camera } from 'lucide-react'; 
import { API_URL } from "../client";

export function ProfilePage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [authorName, setAuthorName] = useState("");
    const [joinDate, setJoinDate] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    const [showEditMenu, setShowEditMenu] = useState(false);

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
        const confirmLogout = window.confirm("แน่ใจหรือไม่ว่าต้องการออกจากระบบ?");
        if (confirmLogout) {
            localStorage.removeItem("token");
            alert("ออกจากระบบแล้ว");
            window.location.href = '/';
        }
    };

    if (isLoading) return <div style={{ textAlign: "center", marginTop: "50px" }}>กำลังโหลดข้อมูลโปรไฟล์...</div>;
    return (
        <div style={containerStyle}>
            <div style={contentWrapper}>

                <h2 style={pageTitle}>โปรไฟล์ของฉัน</h2>
                
                <div style={profileCardBg}>
                    <div style={avatarSection}>
                        <div style={avatarLargeWrapper}>
                            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${username || 'dog'}`} alt="Avatar" style={{ width: '100%' }} />
                            <div style={cameraIconBadge}><Camera size={14} /></div>
                        </div>
                    </div>
                    
                    <div style={infoBoxWhite}>
                        <h1 style={displayName}>{authorName || username}</h1>
                        <div style={infoList}>
                            <div style={infoItem}>
                                <span style={infoLabel}>Username</span> 
                                <span style={infoValue}>{username}</span>
                            </div>
                            <div style={infoItem}>
                                <span style={infoLabel}>นามปากกา</span> 
                                <span style={infoValue}>{authorName || "ยังไม่ได้ตั้งนามปากกา"}</span>
                            </div>
                            <div style={infoItem}>
                                <span style={infoLabel}>เข้าร่วมเมื่อ</span> 
                                <span style={infoValue}>
                                    {joinDate ? new Date(joinDate).toLocaleDateString("th-TH", { year: 'numeric', month: 'long', day: 'numeric' }) : "-"}
                                </span>
                            </div>
                        </div>
                        {statusMsg && (
                            <div style={{ 
                                padding: "10px", borderRadius: "8px", marginBottom: "15px", fontWeight: "bold",
                                background: statusMsg.includes("✅") ? "#d4edda" : "#fff0f3", 
                                color: statusMsg.includes("✅") ? "#155724" : "#d63384",
                            }}>
                                {statusMsg}
                            </div>
                        )}
                        <div style={{ position: 'relative', display: 'flex', gap: '15px' }}>
                            <button style={editBtn} onClick={() => setShowEditMenu(true)}>
                                ตั้งค่านามปากกา
                            </button>
                            <button style={logoutBtn} onClick={handleLogout}>
                                ออกจากระบบ
                            </button>
                            {showEditMenu && (
                                <div style={editDropdownBox}>
                                    <h3 style={editTitle}>ตั้งค่านามปากกา</h3>
                                    
                                    <div style={editField}>
                                        <label style={{display: 'block', marginBottom: '8px', color: '#666'}}>นามปากกาใหม่:</label>
                                        <input 
                                            type="text" 
                                            style={editInput} 
                                            value={authorName} 
                                            onChange={(e) => setAuthorName(e.target.value)}
                                            placeholder="ตั้งนามปากกาสำหรับผลงานของคุณ..."
                                        />
                                        <small style={{ color: "#888", display: "block", marginTop: "5px" }}>
                                            *ชื่อนี้จะไปปรากฏเป็นชื่อผู้แต่งในนิยายและมังงะของคุณ
                                        </small>
                                    </div>

                                    <div style={editActionGroup}>
                                        <button style={cancelBtn} onClick={() => setShowEditMenu(false)}>ปิด</button>
                                        <button 
                                            style={confirmBtn} 
                                            onClick={() => {
                                                handleSaveProfile();
                                                setShowEditMenu(false);
                                            }}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? "กำลังบันทึก..." : "ยืนยัน"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const containerStyle: React.CSSProperties = { minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: "'Kanit', 'Sarabun', sans-serif" };
const contentWrapper: React.CSSProperties = { maxWidth: '1000px', margin: '40px auto', padding: '0 20px' };
const pageTitle: React.CSSProperties = { color: '#9b67bd', fontSize: '32px', marginBottom: '25px', fontWeight: 'bold' };
const profileCardBg: React.CSSProperties = { backgroundColor: '#ededed', borderRadius: '25px', padding: '50px', display: 'flex', gap: '50px', alignItems: 'center' };
const avatarSection: React.CSSProperties = { position: 'relative' };
const avatarLargeWrapper: React.CSSProperties = { width: '160px', height: '160px', borderRadius: '50%', backgroundColor: '#e0c3fc', border: '3px solid #fff', overflow: 'hidden' };
const cameraIconBadge: React.CSSProperties = { position: 'absolute', bottom: '10px', right: '5px', backgroundColor: '#fff', padding: '6px', borderRadius: '50%', display: 'flex', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' };
const infoBoxWhite: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '35px', padding: '40px 60px', flex: 1 };
const displayName: React.CSSProperties = { color: '#9b67bd', fontSize: '38px', margin: '0 0 25px 0', fontWeight: 'bold' };
const infoList: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '35px' };
const infoItem: React.CSSProperties = { display: 'flex', fontSize: '18px' };
const infoLabel: React.CSSProperties = { color: '#888', width: '130px' };
const infoValue: React.CSSProperties = { color: '#333', fontWeight: 'bold' };
const editBtn: React.CSSProperties = { backgroundColor: '#bc7df2', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '12px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' };
const logoutBtn: React.CSSProperties = { backgroundColor: 'transparent', color: '#ff4d6d', border: '1px solid #ff4d6d', padding: '10px 25px', borderRadius: '12px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' };

const editDropdownBox: React.CSSProperties = { position: 'absolute', top: '50px', left: '0', width: '380px', backgroundColor: '#fff', borderRadius: '20px', padding: '25px', boxShadow: '0 10px 35px rgba(0,0,0,0.15)', zIndex: 100, border: '1px solid #f0f0f0' };
const editTitle: React.CSSProperties = { color: '#9b67bd', marginBottom: '20px', marginTop: 0, fontSize: '20px', fontWeight: 'bold' };
const editField: React.CSSProperties = { marginBottom: '20px' };
const editInput: React.CSSProperties = { display: 'block', width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', fontSize: '16px', outline: 'none', boxSizing: 'border-box', color: '#333' };
const editActionGroup: React.CSSProperties = { display: 'flex', gap: '15px', justifyContent: 'flex-end' };
const cancelBtn: React.CSSProperties = { padding: '10px 25px', borderRadius: '12px', border: 'none', backgroundColor: '#e0e0e0', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: '#666' };
const confirmBtn: React.CSSProperties = { padding: '10px 25px', borderRadius: '12px', border: 'none', backgroundColor: '#bc7df2', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' };
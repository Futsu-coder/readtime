import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Camera } from 'lucide-react'; 
import { API_URL } from "../client";

export function ProfilePage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [authorName, setAuthorName] = useState("");
    
    // 🌟 เพิ่ม State สำหรับเก็บค่าชั่วคราวตอนที่กำลังพิมพ์แก้ไข
    const [editAuthorName, setEditAuthorName] = useState(""); 
    
    // States สำหรับรูปโปรไฟล์
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                        setAvatarUrl(data.user.avatar_url || null);
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

    const [joinDate, setJoinDate] = useState(""); // ย้ายลงมาจัดกลุ่มให้เรียบร้อย

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            return alert("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
        }

        setAvatarPreview(URL.createObjectURL(file));
        setIsUploadingAvatar(true);
        setStatusMsg("กำลังอัปโหลดรูปโปรไฟล์...");

        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("avatar", file);

            const res = await fetch(`${API_URL}/api/profile/avatar`, { 
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                setStatusMsg("✅ อัปเดตรูปโปรไฟล์สำเร็จ!");
                setAvatarUrl(data.avatar_url); 
            } else {
                setStatusMsg(`❌ อัปโหลดไม่สำเร็จ: ${data.error}`);
                setAvatarPreview(null); 
            }
        } catch (err) {
            console.error(err);
            setStatusMsg("❌ เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
            setAvatarPreview(null);
        } finally {
            setIsUploadingAvatar(false);
            setTimeout(() => setStatusMsg(""), 3000);
        }
    };

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
                body: JSON.stringify({ author: editAuthorName }) // 🌟 ส่งค่าที่แก้ไขไปบันทึก
            });

            if (res.ok) {
                setStatusMsg("✅ บันทึกนามปากกาสำเร็จ! กำลังอัปเดตข้อมูล...");
                setAuthorName(editAuthorName); // 🌟 อัปเดตค่าที่แสดงผลให้ตรงกับที่บันทึก
                
                setTimeout(() => {
                    window.location.reload();
                }, 1000); // 🌟 ปรับหน่วงเวลาเป็น 1 วินาที ให้ผู้ใช้ทันอ่านข้อความ

            } else {
                setStatusMsg("❌ เกิดข้อผิดพลาดในการบันทึก");
                setIsSaving(false);
                setTimeout(() => setStatusMsg(""), 3000);
            }
        } catch (err) {
            console.error(err);
            setStatusMsg("❌ เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
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

    const getDisplayImage = () => {
        if (avatarPreview) return avatarPreview; 
        if (avatarUrl) return `${API_URL}${avatarUrl}`; 
        return `https://api.dicebear.com/7.x/bottts/svg?seed=${username || 'dog'}`; 
    };

    if (isLoading) return <div style={{ textAlign: "center", marginTop: "50px", color: '#9b67bd', fontSize: '18px', fontWeight: 'bold' }}>⏳ กำลังโหลดข้อมูลโปรไฟล์...</div>;
    
    return (
        <div style={containerStyle}>
            <div style={contentWrapper}>
                <h2 style={pageTitle}>โปรไฟล์ของฉัน</h2>
                
                <div style={profileCardBg}>
                    <div style={avatarSection}>
                        <div 
                            style={{...avatarLargeWrapper, cursor: 'pointer', opacity: isUploadingAvatar ? 0.6 : 1 }}
                            onClick={() => fileInputRef.current?.click()}
                            title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
                        >
                            <img 
                                src={getDisplayImage()} 
                                alt="Avatar" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                            <div style={cameraIconBadge}><Camera size={18} color="#666" /></div>
                        </div>
                        
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef} 
                            onChange={handleAvatarUpload} 
                            style={{ display: 'none' }} 
                        />
                        {isUploadingAvatar && <div style={{textAlign: 'center', fontSize: '13px', marginTop: '15px', color: '#888', fontWeight: 'bold'}}>กำลังอัปโหลด...</div>}
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
                                padding: "12px", borderRadius: "10px", marginBottom: "20px", fontWeight: "bold", textAlign: 'center',
                                background: statusMsg.includes("✅") ? '#d4edda' : statusMsg.includes("⏳") ? '#fff3cd' : '#fff0f3', 
                                color: statusMsg.includes("✅") ? '#155724' : statusMsg.includes("⏳") ? '#856404' : '#d63384',
                            }}>
                                {statusMsg}
                            </div>
                        )}
                        <div style={{ position: 'relative', display: 'flex', gap: '15px' }}>
                            <button 
                                style={editBtn} 
                                onClick={() => {
                                    setEditAuthorName(authorName); // 🌟 เซ็ตค่าตั้งต้นในป๊อปอัพให้เท่ากับชื่อที่บันทึกไว้
                                    setShowEditMenu(true);
                                }}
                            >
                                ตั้งค่านามปากกา
                            </button>
                            <button style={logoutBtn} onClick={handleLogout}>
                                ออกจากระบบ
                            </button>
                            {showEditMenu && (
                                <div style={editDropdownBox}>
                                    <h3 style={editTitle}>ตั้งค่านามปากกา</h3>
                                    
                                    <div style={editField}>
                                        <label style={{display: 'block', marginBottom: '8px', color: '#666', fontWeight: 'bold'}}>นามปากกาใหม่:</label>
                                        <input 
                                            type="text" 
                                            style={editInput} 
                                            value={editAuthorName} // 🌟 ใช้ state สำหรับพิมพ์
                                            onChange={(e) => setEditAuthorName(e.target.value)}
                                            placeholder="ตั้งนามปากกาสำหรับผลงานของคุณ..."
                                        />
                                        <small style={{ color: "#888", display: "block", marginTop: "8px" }}>
                                            *ชื่อนี้จะไปปรากฏเป็นชื่อผู้แต่งในนิยายและมังงะของคุณ
                                        </small>
                                    </div>

                                    <div style={editActionGroup}>
                                        <button 
                                            style={cancelBtn} 
                                            onClick={() => setShowEditMenu(false)} // 🌟 ปิดป๊อปอัพโดยไม่เปลี่ยนค่า authorName หลัก
                                        >
                                            ยกเลิก
                                        </button>
                                        <button 
                                            style={confirmBtn} 
                                            onClick={() => {
                                                handleSaveProfile();
                                                setShowEditMenu(false);
                                            }}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? "กำลังบันทึก..." : "บันทึก"}
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

const containerStyle: React.CSSProperties = { minHeight: '100vh', backgroundColor: '#f9f9f9', fontFamily: "'Kanit', 'Sarabun', sans-serif" };
const contentWrapper: React.CSSProperties = { maxWidth: '1000px', margin: '40px auto', padding: '0 20px' };
const pageTitle: React.CSSProperties = { color: '#9b67bd', fontSize: '32px', marginBottom: '25px', fontWeight: 'bold' };
const profileCardBg: React.CSSProperties = { backgroundColor: '#ededed', borderRadius: '30px', padding: '50px', display: 'flex', gap: '50px', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' };
const avatarSection: React.CSSProperties = { position: 'relative' };
const avatarLargeWrapper: React.CSSProperties = { width: '180px', height: '180px', borderRadius: '50%', backgroundColor: '#e0c3fc', border: '5px solid #fff', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', transition: '0.2s' };
const cameraIconBadge: React.CSSProperties = { position: 'absolute', bottom: '15px', right: '5px', backgroundColor: '#fff', padding: '10px', borderRadius: '50%', display: 'flex', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', cursor: 'pointer', border: '1px solid #eee' };
const infoBoxWhite: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '35px', padding: '40px 60px', flex: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' };
const displayName: React.CSSProperties = { color: '#9b67bd', fontSize: '38px', margin: '0 0 25px 0', fontWeight: 'bold' };
const infoList: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '35px' };
const infoItem: React.CSSProperties = { display: 'flex', fontSize: '18px' };
const infoLabel: React.CSSProperties = { color: '#888', width: '130px' };
const infoValue: React.CSSProperties = { color: '#333', fontWeight: 'bold' };
const editBtn: React.CSSProperties = { backgroundColor: '#bc7df2', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '15px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', transition: '0.2s', boxShadow: '0 4px 15px rgba(188, 125, 242, 0.3)' };
const logoutBtn: React.CSSProperties = { backgroundColor: '#fff0f3', color: '#ff4d6d', border: 'none', padding: '12px 30px', borderRadius: '15px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', transition: '0.2s' };

const editDropdownBox: React.CSSProperties = { position: 'absolute', top: '65px', left: '0', width: '400px', backgroundColor: '#fff', borderRadius: '25px', padding: '30px', boxShadow: '0 15px 40px rgba(0,0,0,0.15)', zIndex: 100, border: '1px solid #f0f0f0' };
const editTitle: React.CSSProperties = { color: '#9b67bd', marginBottom: '20px', marginTop: 0, fontSize: '22px', fontWeight: 'bold' };
const editField: React.CSSProperties = { marginBottom: '25px' };
const editInput: React.CSSProperties = { display: 'block', width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #eee', fontSize: '16px', outline: 'none', boxSizing: 'border-box', color: '#333' };
const editActionGroup: React.CSSProperties = { display: 'flex', gap: '15px', justifyContent: 'flex-end' };
const cancelBtn: React.CSSProperties = { padding: '12px 30px', borderRadius: '15px', border: 'none', backgroundColor: '#f5f5f5', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: '#666' };
const confirmBtn: React.CSSProperties = { padding: '12px 30px', borderRadius: '15px', border: 'none', backgroundColor: '#bc7df2', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(188, 125, 242, 0.3)' };
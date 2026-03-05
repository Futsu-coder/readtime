import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { client, API_URL } from "../client";
import { RichTextEditor } from "../components/RichtextEditor";
import { ChevronLeft, Plus } from 'lucide-react';

export function CreateNovel() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("General");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [statusMsg, setStatusMsg] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return setErrorMsg("กรุณากรอกชื่อเรื่อง");
        setIsLoading(true); setStatusMsg("กำลังสร้างนิยาย...");
        try {
            const token = localStorage.getItem('token');
            if (!token) { navigate('/login'); return; }
            const res = await client.api.protected.novels.$post(
                { json: { title, description, category } },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = await res.json() as any;
                const newNovelId = data.novel?.id || data.id;
                if (coverFile && newNovelId) {
                    setStatusMsg(" กำลังอัปโหลดหน้าปก...");
                    const formData = new FormData();
                    formData.append("cover", coverFile);
                    await fetch(`${API_URL}/api/protected/novels/${newNovelId}/cover`, {
                        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData
                    });
                }
                navigate('/dashborad');
            } else { setIsLoading(false); setErrorMsg("สร้างไม่สำเร็จ"); }
        } catch (err) { 
            console.log(err)
            setIsLoading(false); setErrorMsg("Error"); }
    };

    return (
        <div style={pageContainer}>
            <div style={headerNav}>
                <button type="button" onClick={() => navigate(-1)} style={backBtn}>
                    <ChevronLeft size={20} /> ย้อนกลับ
                </button>
            </div>
            <form onSubmit={handleCreate} style={mainContent}>
                <div style={sectionWhite}>
                    <div style={flexRow}>
                        
                        <div style={{ position: 'relative' }}>
                            <div 
                                style={{
                                    ...coverBox, 
                                    backgroundImage: coverPreview ? `url(${coverPreview})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    border: coverPreview ? 'none' : '2px dashed #bc7df2'
                                }} 
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {!coverPreview && (
                                    <div style={plusWrapper}>
                                        <div style={plusCircle}><Plus size={30} color="#bc7df2" /></div>
                                        <span style={uploadHint}>อัพโหลดรูปปก</span>
                                    </div>
                                )}
                            </div>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                            />
                        </div>

                        <div style={inputArea}>
                            <div style={fieldGroup}>
                                <label style={purpleLabel}>ชื่อเรื่อง*</label>
                                <input 
                                    type="text" 
                                    placeholder="พิมพ์ชื่อเรื่องที่นี่" 
                                    style={textInput} 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={fieldGroup}>
                                <label style={purpleLabel}>หมวดหมู่</label>
                                <select 
                                    value={category} 
                                    onChange={(e) => setCategory(e.target.value)} 
                                    style={{...textInput, appearance: 'auto'}}
                                >
                                    <option value="General">ทั่วไป</option>
                                    <option value="Fantasy">แฟนตาซี</option>
                                    <option value="Romance">รักโรแมนติก</option>
                                    <option value="Action">แอคชั่น</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{...sectionWhite, marginTop: '20px'}}>
                    <label style={purpleLabel}>เรื่องย่อ*</label>
                    <div style={{ marginTop: '10px' }}>
                        <RichTextEditor 
                            value={description} 
                            onChange={setDescription} 
                            height="300px" 
                            placeholder="เล่าข้อมูลเบื้องต้นของนิยาย..."
                        />
                    </div>

                    {errorMsg && <div style={errorMessage}>❌ {errorMsg}</div>}

                    <div style={statusRowContainer}>
                        <div style={statusWhiteCard}>
                            <div style={{ flex: 1 }}></div> 
                            <div style={actionButtons}>
                                <button type="button" style={btnGray} onClick={() => navigate(-1)} disabled={isLoading}>ยกเลิก</button>
                                <button type="submit" style={btnPurple(isLoading)} disabled={isLoading}>
                                    {isLoading ? (statusMsg || "กำลังสร้าง...") : "สร้างนิยายเลย!"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}


const pageContainer: React.CSSProperties = { minHeight: '100vh', backgroundColor: '#f9f9f9', fontFamily: "'Kanit', 'Sarabun', sans-serif", padding: '20px' };
const headerNav = { maxWidth: '900px', margin: '0 auto 20px auto' };
const backBtn = { background: 'none', border: 'none', color: '#bc7df2', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '16px' };
const mainContent = { maxWidth: '900px', margin: '0 auto' };
const sectionWhite = { backgroundColor: '#fff', padding: '30px', borderRadius: '25px', border: '1px solid #f0f0f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' };
const flexRow = { display: 'flex', gap: '40px' };
const coverBox: React.CSSProperties = { width: '240px', height: '320px', backgroundColor: '#fdfdfd', borderRadius: '40px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' };
const plusWrapper = { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '10px' };
const plusCircle = { width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #bc7df2', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const uploadHint = { color: '#bc7df2', fontSize: '14px', fontWeight: 'bold' };
const inputArea = { flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '20px' };
const fieldGroup = { display: 'flex', flexDirection: 'column' as const, gap: '8px' };
const purpleLabel = { color: '#bc7df2', fontWeight: 'bold', fontSize: '18px' };
const textInput = { padding: '15px 20px', borderRadius: '15px', border: '1.5px solid #eee', outline: 'none', fontSize: '16px', color: '#333' };

const errorMessage: React.CSSProperties = { color: '#ff4d4f', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' };
const statusRowContainer: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '20px', marginTop: '30px' };
const statusWhiteCard: React.CSSProperties = { flex: 1, backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '25px', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' };
const actionButtons = { display: 'flex', gap: '12px', width: '100%', justifyContent: 'flex-end' };
const btnGray = { padding: '10px 35px', borderRadius: '15px', border: 'none', backgroundColor: '#666', color: '#fff', cursor: 'pointer', fontWeight: 'bold' };
const btnPurple = (isLoading: boolean): React.CSSProperties => ({ padding: '10px 35px', borderRadius: '15px', border: 'none', backgroundColor: isLoading ? '#ccc' : '#bc7df2', color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s' });
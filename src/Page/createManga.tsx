import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../client"; 
import { RichTextEditor } from "../components/RichtextEditor";
import { ChevronLeft, Plus, ChevronDown } from 'lucide-react';

export function CreateMangaPage() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [statusMsg, setStatusMsg] = useState("");

    // 🌟 State เก็บรายการหมวดหมู่ที่ดึงมาจาก DB
    const [categoriesList, setCategoriesList] = useState<string[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_URL}/api/public/categories`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.categories && data.categories.length > 0) {
                        setCategoriesList(data.categories);
                        setCategory(data.categories[0]); 
                    }
                }
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };
        fetchCategories();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
         const file = e.target.files?.[0];
         if (file && file.type.startsWith("image/")) {
             setCoverFile(file);
             setCoverPreview(URL.createObjectURL(file));
         }
    };

    const handleCreate = async (saveAsDraft: boolean) => {
        if (!title.trim()) return setErrorMsg("กรุณากรอกชื่อเรื่อง");
        setIsLoading(true); 
        setStatusMsg(saveAsDraft ? "กำลังบันทึกร่าง..." : "กำลังสร้างมังงะ...");

        try {
            const token = localStorage.getItem('token');
            const targetStatus = saveAsDraft ? 'draft' : 'published';

            const res = await fetch(`${API_URL}/api/protected/manga`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ title, description, category, status: targetStatus })
            });

            if (res.ok) {
                const data = await res.json() as any;
                if (coverFile && data.id) {
                    setStatusMsg(" กำลังอัปโหลดรูปปก...");
                    const formData = new FormData();
                    formData.append("cover", coverFile);
                    await fetch(`${API_URL}/api/protected/manga/${data.id}/cover`, {
                        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData
                    });
                }
                navigate('/dashborad');
            } else { setIsLoading(false); setErrorMsg("สร้างไม่สำเร็จ"); }
        } catch (err) { 
            console.error(err)
            setIsLoading(false); setErrorMsg("เกิดข้อผิดพลาด"); }
    };

    return (
        <div style={pageContainer}>
            <div style={headerNav}>
            </div>

            <div style={mainContent}>
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
                                <label style={purpleLabel}>เพิ่มชื่อเรื่อง</label>
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
                                style={{
                                        ...textInput, 
                                        width: '100%', 
                                        appearance: 'auto', 
                                        paddingRight: '40px',
                                        color: '#333', 
                                        cursor: 'pointer'}}>
                                     <option value="Action">Action</option>
                                    <option value="Romance">Romance</option>
                                    <option value="Fantasy">Fantasy</option>
                                    <option value="Horror">Horror</option>
                                    <option value="Comedy">Comedy</option>
                                    <option value="Adventure">Adventure</option>
                                    <option value="Drama">Drama</option>
                                    <option value="General">General</option>
                                    <option value="Slice of Life">Slice of Life</option>
                                    <option value="Isekai">Isekai</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{...sectionWhite, marginTop: '20px'}}>
                    <label style={purpleLabel}>เพิ่มเนื้อเรื่องย่อ</label>
                    <div style={{ marginTop: '10px' }}>
                        <RichTextEditor 
                            value={description} 
                            onChange={setDescription} 
                            height="250px" 
                            placeholder="เริ่มเขียนเนื้อเรื่องย่อของคุณ..."
                        />
                    </div>
                    {errorMsg && <div style={errorMessage}>❌ {errorMsg}</div>}
                    <div style={statusRowContainer}>
                        <div style={statusWhiteCard}>
                            <div style={{ flex: 1, fontSize: '14px', color: '#888' }}>
                                เลือก "บันทึกเป็นร่าง" ถ้ายังไม่อยากให้ใครเห็นผลงาน
                            </div>  
                            <div style={actionButtons}>
                                 <button 
                                    type="button" 
                                    style={{...btnOutline, opacity: isLoading ? 0.5 : 1}} 
                                    onClick={() => handleCreate(true)} 
                                    disabled={isLoading}
                                >
                                    <FileEdit size={18} /> {isLoading && statusMsg.includes("ร่าง") ? "กำลังบันทึก..." : "บันทึกเป็นแบบร่าง"}
                                </button>
                                
                                <button 
                                    type="button" 
                                    style={{...btnPurple(isLoading), display: 'flex', alignItems: 'center', gap: '8px'}} 
                                    onClick={() => handleCreate(false)} 
                                    disabled={isLoading}
                                >
                                    <Globe size={18} /> {isLoading && !statusMsg.includes("ร่าง") ? "กำลังเผยแพร่..." : "เผยแพร่เลย!"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const pageContainer: React.CSSProperties = { minHeight: '100vh', backgroundColor: '#f9f9f9', fontFamily: "'Kanit', 'Sarabun', sans-serif", padding: '20px' };
const headerNav = { maxWidth: '900px', margin: '0 auto 20px auto' };
const mainContent = { maxWidth: '900px', margin: '0 auto' };
const sectionWhite = { backgroundColor: '#fff', padding: '30px', borderRadius: '20px', border: '1px solid #f0f0f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' };
const flexRow = { display: 'flex', gap: '40px' };
const coverBox: React.CSSProperties = { width: '240px', height: '320px', backgroundColor: '#fdfdfd', borderRadius: '40px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' };
const plusWrapper = { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '10px' };
const plusCircle = { width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #bc7df2', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const uploadHint = { color: '#bc7df2', fontSize: '14px', fontWeight: 'bold' };
const inputArea = { flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '20px' };
const fieldGroup = { display: 'flex', flexDirection: 'column' as const, gap: '8px' };
const purpleLabel = { color: '#bc7df2', fontWeight: 'bold', fontSize: '18px' };
const textInput = { padding: '15px 20px', borderRadius: '15px', border: '1.5px solid #eee', outline: 'none', fontSize: '16px', color: '#333',backgroundColor: '#f9f9f9' };

const errorMessage: React.CSSProperties = { color: '#ff4d4f', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' };
const statusRowContainer: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '20px', marginTop: '30px' };
const statusWhiteCard: React.CSSProperties = { flex: 1, backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '20px', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' };
const actionButtons = { display: 'flex', gap: '15px', alignItems: 'center' };
const btnOutline: React.CSSProperties = { padding: '12px 25px', borderRadius: '15px', border: '2px solid #ddd', backgroundColor: '#fff', color: '#666', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' };
const btnPurple = (isLoading: boolean): React.CSSProperties => ({ padding: '12px 30px', borderRadius: '15px', border: 'none', backgroundColor: isLoading ? '#ccc' : '#bc7df2', color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s' });
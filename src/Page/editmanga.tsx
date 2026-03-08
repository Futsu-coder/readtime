import { useState, useEffect, useRef } from "react"; 
import { useParams, useNavigate, Link } from "react-router-dom";
import { Trash2 } from "lucide-react"; 
import { API_URL } from "../client";
import { NovelImage } from "../components/novelimage"; 
import { RichTextEditor } from "../components/RichtextEditor";

interface Manga {
    id: number;
    title: string;
    description: string;
    category: string;
    owner_id: number;
    cover_image?: string | null;
    is_completed?: number; // 🌟 รับค่าสถานะจบ 0 หรือ 1[cite: 20]
}

interface MangaChapter {
    id: number;
    title: string;
    chapter_number: number;
    created_at: string;
    status?: string; 
}

interface MangaResponse {
    manga: Manga;
    chapters?: MangaChapter[];
}

export function EditMangaPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [isCompleted, setIsCompleted] = useState(0); // 🌟 State เก็บสถานะจบเนื้อเรื่อง[cite: 20]
    const [chapters, setChapters] = useState<MangaChapter[]>([]);
    const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState("");

    // 🌟 State เก็บรายการหมวดหมู่
    const [categoriesList, setCategoriesList] = useState<string[]>([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { navigate('/login'); return; }
                
                // 🌟 ดึงหมวดหมู่ทั้งหมดมาก่อน
                const catRes = await fetch(`${API_URL}/api/public/categories`);
                if (catRes.ok) {
                    const catData = await catRes.json();
                    if (catData.categories) setCategoriesList(catData.categories);
                }

                // ดึงข้อมูลมังงะ
                const res = await fetch(`${API_URL}/api/protected/manga/${id}`, {
                     headers: { Authorization: `Bearer ${token}` }
                });
                
                if (res.ok) {
                    const data = await res.json() as MangaResponse;
                    setTitle(data.manga.title);
                    setDescription(data.manga.description || "");
                    setCategory(data.manga.category || "");
                    setCurrentCoverUrl(data.manga.cover_image || null); 
                    setChapters(data.chapters || []);
                    setIsCompleted(data.manga.is_completed || 0); // 🌟 โหลดค่าจาก DB[cite: 20]
                } else {
                    alert("ไม่พบข้อมูลมังงะ (หรือคุณไม่ใช่เจ้าของผลงาน)");
                    navigate('/dashborad');
                }
            } catch (err) {
                console.error(err);
                navigate('/dashborad');
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchInitialData();
    }, [id, navigate]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) return alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUploadCover = async () => {
        if (!coverFile || !id) return;
        setIsUploading(true); setStatusMsg("กำลังอัปโหลดรูปภาพ...");
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append("cover", coverFile);
            const res = await fetch(`${API_URL}/api/protected/manga/${id}/cover`, {
                method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData
            });

            const data = await res.json();
            if (res.ok) {
                setStatusMsg("✅ อัปโหลดหน้าปกสำเร็จ!");
                setCurrentCoverUrl(data.cover_image); 
                setCoverFile(null); setCoverPreview(null);
            } else { setStatusMsg(`❌ อัปโหลดไม่สำเร็จ`); }
        } catch (err) { 
            console.error(err)
            setStatusMsg("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ"); } 
        finally { 
            setIsUploading(false); setTimeout(() => setStatusMsg(""), 3000); }
    };

    const handleSaveDetails = async () => {
        setStatusMsg("กำลังบันทึกข้อมูล...");
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/protected/manga/${id}`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title, description, category, is_completed: isCompleted }) // 🌟 ส่งค่า is_completed ไปบันทึกด้วย[cite: 20]
            });
            if (res.ok) setStatusMsg("✅ บันทึกข้อมูลสำเร็จ");
            else setStatusMsg("❌ บันทึกไม่สำเร็จ");
        } catch (err) {
            console.error(err) 
            setStatusMsg("❌ เกิดข้อผิดพลาด"); }
        setTimeout(() => setStatusMsg(""), 3000);
    };

    const handleDeleteChapter = async (chapterId: number) => {
        if (!confirm("ต้องการลบตอนนี้ใช่หรือไม่?\n(เมื่อลบแล้วจะไม่สามารถกู้คืนได้)")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/protected/manga/${id}/chapters/${chapterId}`, {
                method: "DELETE", headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setChapters(chapters.filter(ch => ch.id !== chapterId));
                setStatusMsg("✅ ลบตอนเรียบร้อยแล้ว");
                setTimeout(() => setStatusMsg(""), 3000);
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteManga = async () => {
        const confirmDelete = window.confirm(`คุณแน่ใจหรือไม่ที่จะลบเรื่อง "${title}"?\n⚠️ การกระทำนี้จะลบข้อมูลตอนและรูปภาพทั้งหมดอย่างถาวร และไม่สามารถกู้คืนได้!`);
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/protected/manga/${id}`, {
                method: "DELETE", 
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.ok) {
                alert("🗑️ ลบมังงะเรียบร้อยแล้ว");
                navigate('/dashborad'); 
            } else {
                const data = await res.json();
                alert(`❌ ลบไม่สำเร็จ: ${data.error}`);
            }
        } catch (err) { 
            console.error(err);
            alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
        }
    };

    if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>⏳ กำลังโหลดข้อมูล...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: "'Sarabun', sans-serif" }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
                <h2 style={{ margin: 0, color: '#9b67bd', fontSize: '24px' }}>แก้ไขมังงะ: {title}</h2>
                <Link to="/dashborad">
                    <button style={{ padding: '10px 20px', border: '1px solid #ddd', background: 'white', borderRadius: '8px', cursor: 'pointer', color:'#555', fontWeight: 'bold', transition: '0.2s' }}>
                        &larr; กลับหน้าจัดการ
                    </button>
                </Link>
            </div>

            {/* Cover Section */}
            <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '30px', textAlign: 'center' }}>
                <h3 style={{ marginTop: 0, color: '#9b67bd', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>หน้าปกมังงะ</h3>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    title="คลิกเพื่อเปลี่ยนรูปหน้าปก"
                    style={{ 
                        margin: '20px auto', width: '180px', height: '260px', position: 'relative',
                        cursor: 'pointer', borderRadius: '10px', overflow: 'hidden',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                        border: (coverPreview || currentCoverUrl) ? 'none' : '2px dashed #ccc'
                    }}
                >
                    {coverPreview ? (
                        <img src={coverPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> 
                    ) : currentCoverUrl ? (
                        <NovelImage src={currentCoverUrl} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#fcfcfc', color: '#aaa' }}>
                            <span style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🖼️</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>คลิกเพื่อเลือกรูป</span>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                    <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
                    <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>คลิกที่รูปเพื่อเปลี่ยนหน้าปก</p>
                    {coverFile && (
                        <button onClick={handleUploadCover} disabled={isUploading} style={{ padding: '10px 30px', background: isUploading ? '#aaa' : '#ff7b00', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
                            {isUploading ? "⏳ กำลังอัปโหลดรูปภาพ..." : "ยืนยันเปลี่ยนหน้าปก"}
                        </button>
                    )}
                </div>
            </div>

            {/* General Info Section */}
            <div style={{ background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '30px' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '15px', color:'#333', fontSize: '20px' }}>ข้อมูลทั่วไป</h3>
                
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color:'#555'}}>ชื่อเรื่อง <span style={{color: 'red'}}>*</span></label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff' , color:'#333', fontSize: '16px'}} />
                </div>
                
                {/* 🌟 จัด Dropdown หมวดหมู่และสถานะให้อยู่คู่กัน[cite: 20] */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color:'#555' }}>หมวดหมู่</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '8px' , background: '#fff' , color:'#333', fontSize: '16px'}}>
                            {categoriesList.length > 0 ? (
                                categoriesList.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))
                            ) : (
                                <option value="General">กำลังโหลดหมวดหมู่...</option>
                            )}
                        </select>
                    </div>

                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color:'#555' }}>สถานะเนื้อเรื่อง</label>
                        <select 
                            value={isCompleted} 
                            onChange={e => setIsCompleted(Number(e.target.value))} 
                            style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff' , color:'#333', fontSize: '16px' }}
                        >
                            <option value={0}>กำลังแต่ง (Ongoing)</option>
                            <option value={1}>จบแล้ว (Completed)</option>
                        </select>
                    </div>
                </div>
                
                <div style={{ marginBottom: '40px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color:'#555' }}>เรื่องย่อ</label>
                    <RichTextEditor 
                        value={description} 
                        onChange={setDescription} 
                        height="250px" 
                        placeholder="แก้ไขเรื่องย่อที่นี่..." 
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <button 
                        onClick={handleDeleteManga} 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#fff0f3', color: '#e11d48', border: '1px solid #ffccd5', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                        onMouseOver={e => e.currentTarget.style.background = '#ffe4e6'}
                        onMouseOut={e => e.currentTarget.style.background = '#fff0f3'}
                    >
                        <Trash2 size={18} /> ลบมังงะเรื่องนี้
                    </button>
                    
                    <button 
                        onClick={handleSaveDetails} 
                        style={{ padding: '12px 35px', background: '#9b67bd', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(155, 103, 189, 0.4)', transition: '0.2s' }}
                    >
                        บันทึกการเปลี่ยนแปลง
                    </button>
                </div>
            </div>

            {/* Chapters Section */}
            <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#333', fontSize: '20px' }}>สารบัญตอน</h3>
                    <Link to={`/manga/${id}/chapters`}>
                        <button style={{ padding: '10px 20px', background: '#ff7b00', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(255, 123, 0, 0.3)' }}>+ อัปโหลดตอนใหม่</button>
                    </Link>
                </div>
                
                {chapters.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', padding: '40px', background: '#fafafa', borderRadius: '10px', border: '1px dashed #ddd' }}>
                        ยังไม่มีตอนมังงะเลย! คลิกที่ปุ่มด้านบนเพื่อเพิ่มตอนแรก
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {chapters.map((ch) => (
                            <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', border: '1px solid #eee', borderRadius: '10px', alignItems: 'center', background: '#fff', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#ff7b00'} onMouseOut={e => e.currentTarget.style.borderColor = '#eee'}>
                                <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ color: '#ff7b00', fontSize: '18px' }}>ตอนที่ {ch.chapter_number}</span> 
                                    <span style={{ color: '#333' }}>{ch.title}</span>
                                    {ch.status === 'draft' && <span style={{fontSize: '12px', color: '#888', background: '#eee', padding: '4px 10px', borderRadius: '12px', fontWeight: 'normal'}}>📝 แบบร่าง</span>}
                                </span>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <Link to={`/manga/${id}/chapter/${ch.id}/edit`}>
                                        <button style={{ padding: '8px 15px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', color: '#555', fontWeight: 'bold', transition: '0.2s' }}>
                                            แก้ไข
                                        </button>
                                    </Link>
                                    <button 
                                        onClick={() => handleDeleteChapter(ch.id)} 
                                        style={{ border: 'none', background: '#fff0f3', color: '#ff4d6d', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.background = '#ffe4e6'}
                                        onMouseOut={e => e.currentTarget.style.background = '#fff0f3'}
                                    >
                                        ลบ
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Notification Toast */}
            {statusMsg && (
                <div style={{ 
                    position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', 
                    padding: '15px 30px', background: statusMsg.includes('✅') ? '#28a745' : statusMsg.includes('⏳') ? '#17a2b8' : '#dc3545', 
                    color: 'white', borderRadius: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 1000, fontWeight: 'bold', fontSize: '16px' 
                }}>
                    {statusMsg}
                </div>
            )}
        </div>
    );
}
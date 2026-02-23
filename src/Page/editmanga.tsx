import { useState, useEffect, useRef } from "react"; // 🌟 เพิ่ม useRef
import { useParams, useNavigate, Link } from "react-router-dom";
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
}

interface MangaChapter {
    id: number;
    title: string;
    chapter_number: number;
    created_at: string;
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
    const [category, setCategory] = useState("Action");
    const [chapters, setChapters] = useState<MangaChapter[]>([]);
    const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState("");

    useEffect(() => {
        const fetchManga = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { navigate('/login'); return; }
                const res = await fetch(`${API_URL}/api/public/mangas/${id}`);
                if (res.ok) {
                    const data = await res.json() as MangaResponse;
                    setTitle(data.manga.title);
                    setDescription(data.manga.description || "");
                    setCategory(data.manga.category || "Action");
                    setCurrentCoverUrl(data.manga.cover_image || null); 
                    setChapters(data.chapters || []);
                } else {
                    alert("ไม่พบข้อมูลมังงะ");
                    navigate('/dashborad');
                }
            } catch (err) {
                console.error(err);
                navigate('/dashborad');
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchManga();
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
                setStatusMsg("อัปโหลดหน้าปกสำเร็จ!");
                setCurrentCoverUrl(data.cover_image); 
                setCoverFile(null); setCoverPreview(null);
            } else { setStatusMsg(`อัปโหลดไม่สำเร็จ`); }
        } catch (err) { 
            console.log(err)
            setStatusMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ"); } 
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
                body: JSON.stringify({ title, description, category })
            });
            if (res.ok) setStatusMsg("บันทึกข้อมูลสำเร็จ");
            else setStatusMsg("บันทึกไม่สำเร็จ");
        } catch (err) {
            console.log(err) 
            setStatusMsg("เกิดข้อผิดพลาด"); }
        setTimeout(() => setStatusMsg(""), 3000);
    };

    const handleDeleteChapter = async (chapterId: number) => {
        if (!confirm("ต้องการลบตอนนี้ใช่หรือไม่?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/protected/manga/${id}/chapters/${chapterId}`, {
                method: "DELETE", headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setChapters(chapters.filter(ch => ch.id !== chapterId));
        } catch (err) { console.error(err); }
    };

    const handleDeleteManga = async () => {
        if (!confirm("จะลบมังงะเรื่องนี้จริงๆ ใช่ไหม?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/protected/manga/${id}`, {
                method: "DELETE", headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) navigate('/dashborad');
        } catch (err) { console.error(err); }
    };

    if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>กำลังโหลดข้อมูล...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: "'Sarabun', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <h2 style={{ margin: 0, color: '#9b67bd' }}>แก้ไขมังงะ: {title}</h2>
                <Link to="/dashborad">
                    <button style={{ padding: '8px 15px', border: '1px solid #ddd', background: 'white', borderRadius: '6px', cursor: 'pointer', color:'#000000'}}>กลับหน้าจัดการ</button>
                </Link>
            </div>
            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px', textAlign: 'center' }}>
                <h3 style={{ marginTop: 0, color: '#9b67bd', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>หน้าปกมังงะ</h3>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    title="คลิกเพื่อเปลี่ยนรูปหน้าปก"
                    style={{ 
                        margin: '20px auto', width: '180px', height: '260px', position: 'relative',
                        cursor: 'pointer', borderRadius: '8px', overflow: 'hidden',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        border: (coverPreview || currentCoverUrl) ? 'none' : '2px dashed #ccc'
                    }}
                >
                    {coverPreview ? (
                        <img src={coverPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> 
                    ) : currentCoverUrl ? (
                        <NovelImage src={currentCoverUrl} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f5f5f5', color: '#aaa' }}>
                            <span style={{ fontSize: '2rem' }}>🖼️</span>
                            <span style={{ fontSize: '0.9rem', marginTop: '5px' }}>คลิกเพื่อเลือกรูป</span>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                    <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
                    <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>คลิกที่รูปเพื่อเปลี่ยนหน้าปก</p>
                    {coverFile && (
                        <button onClick={handleUploadCover} disabled={isUploading} style={{ padding: '10px 30px', background: isUploading ? '#aaa' : '#ff7b00', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}>
                            {isUploading ? "กำลังอัปโหลดรูปภาพ..." : "ยืนยันเปลี่ยนหน้าปก"}
                        </button>
                    )}
                </div>
            </div>
            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '15px', color:'black' }}>ข้อมูลทั่วไป</h3>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color:'black'}}>ชื่อเรื่อง</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', background: '#fff' , color:'#000000'}} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>หมวดหมู่</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' , background: '#fff' , color:'#000000'}}>
                        <option value="Action">แอคชั่น / ต่อสู้</option>
                        <option value="Fantasy">แฟนตาซี / ต่างโลก</option>
                        <option value="Romance">รักโรแมนติก</option>
                        <option value="Comedy">ตลก / ขำขัน</option>
                        <option value="Horror">สยองขวัญ</option>
                        <option value="Slice of Life">ชีวิตประจำวัน</option>
                    </select>
                </div>
                <div style={{ marginBottom: '80px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>เรื่องย่อ</label>
                    <RichTextEditor 
                        value={description} 
                        onChange={setDescription} 
                        height="200px" 
                        placeholder="แก้ไขเรื่องย่อที่นี่..." 
                    />
                </div>
                <button onClick={handleSaveDetails} style={{ padding: '10px 30px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}>บันทึกการเปลี่ยนแปลง</button>
                <button onClick={handleDeleteManga} style={{ border: 'none', background: 'none', cursor: 'pointer', float: 'right' }}>ลบมังงะเรื่องนี้</button>
            </div>
            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>สารบัญตอน</h3>
                    <Link to={`/manga/${id}/chapters`}>
                        <button style={{ padding: '8px 20px', background: '#9b67bd', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>+ อัปโหลดตอนใหม่</button>
                    </Link>
                </div>
                {chapters.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#000000', padding: '20px' }}>ยังไม่มีตอนมังงะเลย!</div>
                ) : (
                    chapters.map((ch) => (
                        <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold' }}>
                                <span style={{ color: '#9b67bd', marginRight: '10px' }}>ตอนที่ {ch.chapter_number}</span> 
                                {ch.title}
                            </span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <Link to={`/manga/${id}/chapter/${ch.id}/edit`}>
                                    <button style={{ padding: '6px 15px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', color: '#555' }}>
                                        แก้ไขข้อมูล
                                    </button>
                                </Link>
                                    <button onClick={() => handleDeleteChapter(ch.id)} style={{ border: 'none', background: '#fff0f3', color: '#ff4d6d', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                                        ลบตอน
                                    </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {statusMsg && <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '15px 30px', background: statusMsg.includes('✅') ? '#28a745' : '#dc3545', color: 'white', borderRadius: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 1000 }}>{statusMsg}</div>}
        </div>
    );
}
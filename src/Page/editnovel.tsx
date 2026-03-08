import { useState, useEffect, useRef } from "react"; 
import { useParams, useNavigate, Link } from "react-router-dom";
import { client, API_URL } from "../client"; 
import { NovelImage } from "../components/novelimage"; 
import { RichTextEditor } from "../components/RichtextEditor";

interface Novel {
    id: number;
    title: string;
    description: string;
    category: string;
    owner_id: number;
    cover_image?: string | null;
}
interface NovelResponse {
    novel: Novel;
    chapters?: Chapter[];
}
interface Chapter {
    id: number;
    title: string;
    created_at: string;
}

export function EditNovelPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [chapters, setChapters] = useState<Chapter[]>([]); 
    const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null); 
    const [coverFile, setCoverFile] = useState<File | null>(null); 
    const [coverPreview, setCoverPreview] = useState<string | null>(null); 
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState("");

    // 🌟 State สำหรับเก็บรายการหมวดหมู่
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

                // ดึงข้อมูลนิยาย
                const res = await client.api.protected.novels[":id"].$get(
                    { param: { id: id! } },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (res.ok) {
                    const data = await res.json() as unknown as NovelResponse;
                    setTitle(data.novel.title);
                    setDescription(data.novel.description || "");
                    setCategory(data.novel.category || "");
                    setCurrentCoverUrl(data.novel.cover_image||null); 
                    setChapters(data.chapters || []);
                } else {
                    alert("ไม่พบข้อมูล");
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
            const res = await fetch(`${API_URL}/api/protected/novels/${id}/cover`, {
                method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData
            });

            const data = await res.json();
            if (res.ok) {
                setStatusMsg("อัปโหลดหน้าปกสำเร็จ!");
                setCurrentCoverUrl(data.cover_image); 
                setCoverFile(null); setCoverPreview(null);
            } else { setStatusMsg(`อัปโหลดไม่สำเร็จ`); }
        } catch (err) { 
            console.error(err)
            setStatusMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ"); } 
        finally { setIsUploading(false); setTimeout(() => setStatusMsg(""), 3000); }
    };

    const handleSaveDetails = async () => {
        setStatusMsg("กำลังบันทึกข้อมูล...");
        try {
            const token = localStorage.getItem('token');
            const res = await client.api.protected.novels[":id"].$put(
                { param: { id: id! }, json: { title, description, category } },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) setStatusMsg("บันทึกข้อมูลสำเร็จ!");
            else setStatusMsg("บันทึกไม่สำเร็จ");
        } catch (err) { 
            console.error(err)
            setStatusMsg("เกิดข้อผิดพลาด"); }
        setTimeout(() => setStatusMsg(""), 3000);
    };

    const handleDeleteChapter = async (chapterId: number) => {
        if (!confirm("ต้องการลบตอนนี้ใช่หรือไม่?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await client.api.protected.novels[":id"].chapters[":chapterID"].$delete(
                { param: { id: id!, chapterID: chapterId.toString() } },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) setChapters(chapters.filter(ch => ch.id !== chapterId));
        } catch (err) { console.error(err); }
    };

    const handleDeleteNovel = async () => {
        if (!confirm("จะลบนิยายเรื่องนี้จริงๆ ใช่ไหม?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await client.api.protected.novels[":id"].$delete(
                { param: { id: id! } },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) navigate('/dashborad');
        } catch (err) { console.error(err); }
    };

    if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>กำลังโหลดข้อมูล...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: "'Sarabun', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <h2 style={{ margin: 0, color: '#6a4c93' }}>แก้ไขนิยาย: {title}</h2>
                <Link to="/dashborad">
                    <button style={{ padding: '8px 15px', border: '1px solid #ddd', background: 'white', borderRadius: '6px', cursor: 'pointer', color:'#000000' }}>กลับ</button>
                </Link>
            </div>
            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px', textAlign: 'center' }}>
                <h3 style={{ marginTop: 0, color: '#6a4c93', borderBottom: '1px solid #eee', paddingBottom: '15px'  }}>หน้าปกนิยาย</h3>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    title="คลิกเพื่อเปลี่ยนรูปหน้าปก"
                    style={{ 
                        margin: '20px auto', width: '180px', height: '260px', position: 'relative',
                        cursor: 'pointer', borderRadius: '8px', overflow: 'hidden',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        border: (coverPreview || currentCoverUrl) ? 'none' : '2px dashed #ccc',
                        color:'#000000'
                    }}
                >
                    {coverPreview ? (
                        <img src={coverPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> 
                    ) : currentCoverUrl ? (
                        <NovelImage src={currentCoverUrl} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f5f5f5', color: '#aaa' }}>
                            <span style={{ fontSize: '0.9rem', marginTop: '5px' , color:'#000000'}}>คลิกเพื่อเลือกรูป</span>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                    <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
                    <p style={{ margin: 0, color: '#000000', fontSize: '0.9rem', }}>คลิกที่รูปเพื่อเปลี่ยนหน้าปก</p>
                    {coverFile && (
                        <button onClick={handleUploadCover} disabled={isUploading} style={{ padding: '10px 30px', background: isUploading ? '#aaa' : '#6a4c93', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}>
                            {isUploading ? "กำลังอัปโหลด..." : "ยืนยันการอัปโหลด"}
                        </button>
                    )}
                </div>
            </div>
            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '15px' , color:'#3e3e3e'}}>ข้อมูลทั่วไป</h3>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' , color:'#3e3e3e'}}>ชื่อเรื่อง</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', background: '#fff' , color:'#000000' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color:'#3e3e3e' }}>หมวดหมู่</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', background: '#fff' , color:'#000000' }}>
                        {/* 🌟 ลูปหมวดหมู่ */}
                        {categoriesList.length > 0 ? (
                            categoriesList.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))
                        ) : (
                            <option value="General">กำลังโหลดหมวดหมู่...</option>
                        )}
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

                <button onClick={handleSaveDetails} style={{ padding: '10px 30px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}>💾 บันทึกการเปลี่ยนแปลง</button>
                <button onClick={handleDeleteNovel} style={{ border: 'none', background: 'red', cursor: 'pointer', float: 'right' , color:'#3e3e3e', borderRadius: '30px'}}>🗑️ ลบนิยายเรื่องนี้</button>

            </div>

            {/* ส่วนที่ 3: สารบัญ */}
            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 , color:'#3e3e3e'}}>สารบัญตอน</h3>
                    <Link to={`/novel/${id}/chapters`}>
                        <button style={{ padding: '8px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>+ เพิ่มตอนใหม่</button>
                    </Link>
                </div>
                {chapters.length === 0 ? (
                    <div style={{ textAlign: 'center', color:'#3e3e3e', padding: '20px' }}>ยังไม่มีตอน</div>
                ) : (
                    chapters.map((ch, index) => (
                        <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee', color:'#3e3e3e' }}>
                            <span>EP.{index + 1} - {ch.title}</span>
                            <div>
                                <Link to={`/novel/${id}/chapters/${ch.id}/edit`} style={{ marginRight: '10px' ,border: 'none', background: 'orange', cursor: 'pointer' , color:'#3e3e3e' , padding: '10px', borderRadius: '6px'}}>แก้ไข</Link>
                                <button onClick={() => handleDeleteChapter(ch.id)} style={{ border: 'none', background: 'red', cursor: 'pointer' , color:'#3e3e3e'}}> ลบ </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {statusMsg && <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '15px 30px', background: statusMsg.includes('✅') ? '#28a745' : '#dc3545', color: 'white', borderRadius: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 1000 }}>{statusMsg}</div>}
        </div>
    );
}
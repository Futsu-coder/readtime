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

    // สถานะสำหรับการเผยแพร่ตามภาพตัวอย่าง
    const [isPublished, setIsPublished] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

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
            }
        } catch (err) { console.log(err) } 
        finally { setIsUploading(false); setTimeout(() => setStatusMsg(""), 3000); }
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
            if (res.ok) setStatusMsg("บันทึกข้อมูลสำเร็จ");
        } catch (err) { console.log(err) }
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

    if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>กำลังโหลด...</div>;

    return (
        <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '40px 20px', fontFamily: "'Sarabun', sans-serif" }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                

                {/* ส่วนหัวมังงะ (Card สีเทาอ่อน) */}
                <div style={{ background: '#ebebeb', borderRadius: '30px', padding: '40px', display: 'flex', gap: '40px', marginBottom: '30px', position: 'relative' }}>
                    
                    {/* รูปหน้าปก */}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        style={{ width: '280px', height: '400px', background: 'white', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', flexShrink: 0 }}
                    >
                        {coverPreview ? (
                            <img src={coverPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> 
                        ) : currentCoverUrl ? (
                            <NovelImage src={currentCoverUrl} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc' }}>เพิ่มรูปหน้าปก</div>
                        )}
                        <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
                    </div>

                    <div style={{ flex: 1 }}>
                        <h1 style={{ color: '#bc7df2', fontSize: '28px', margin: '0 0 10px 0' }}>{title || "ชื่อเรื่องมังงะ"}</h1>
                        <p style={{ color: '#666', margin: '0 0 20px 0' }}>หมวดหมู่: {category}</p>
                        

                        {/* กล่องเรื่องย่อสั้น */}
                        <div style={{ background: 'white', borderRadius: '25px', padding: '25px', minHeight: '180px' }}>
                            <h3 style={{ color: '#bc7df2', margin: '0 0 15px 0', fontSize: '18px' }}>แนะนำเนื้อเรื่อง</h3>
                            <div style={{ color: '#555', lineHeight: '1.6', fontSize: '14px' }}>
                                {description.replace(/<[^>]*>?/gm, '').substring(0, 200)}...
                            </div>
                        </div>
                    </div>

                    {/* ปุ่มอัปโหลดรูปกรณีมีการเปลี่ยน */}
                    {coverFile && (
                        <button onClick={handleUploadCover} style={{ position: 'absolute', bottom: '20px', left: '40px', padding: '8px 20px', background: '#bc7df2', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>
                            {isUploading ? "กำลังบันทึก..." : "ยืนยันเปลี่ยนปก"}
                        </button>
                    )}
                </div>

                {/* ปุ่มเพิ่มตอนใหม่ (แถบสีม่วงยาว) */}
                <Link to={`/manga/${id}/chapters`} style={{ textDecoration: 'none' }}>
                    <button style={{ width: '100%', padding: '15px', background: '#bc7df2', color: 'white', border: 'none', borderRadius: '40px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '30px', boxShadow: '0 4px 10px rgba(188, 125, 242, 0.3)' }}>
                        เพิ่มตอน +
                    </button>
                </Link>

                {/* รายการตอน (Card สีขาว) */}
                <div style={{ background: 'white', borderRadius: '20px', padding: '10px', marginBottom: '40px' }}>
                    {chapters.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>ยังไม่มีตอนที่เพิ่มเข้ามา</p>
                    ) : (
                        <div style={{ width: '100%' }}>
                            {chapters.map((ch, index) => (
                                <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', borderBottom: index === chapters.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
                                    <span style={{ color: '#555', fontWeight: 'bold' }}>
                                        <span style={{ color: '#bc7df2', marginRight: '10px' }}>ตอนที่ {ch.chapter_number}</span> {ch.title}
                                    </span>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Link to={`/manga/${id}/chapter/${ch.id}/edit`} style={{ padding: '8px 20px', background: '#f5f5f5', color: '#bc7df2', textDecoration: 'none', borderRadius: '15px', fontSize: '14px' }}>แก้ไข</Link>
                                        <button onClick={() => handleDeleteChapter(ch.id)} style={{ border: 'none', background: 'none', color: '#ff4d4d', cursor: 'pointer' }}>ลบ</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* แถบตั้งค่าการเผยแพร่ด้านล่าง */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '50px' }}>
                    <span style={{ color: '#bc7df2', fontWeight: 'bold', fontSize: '18px' }}>เผยแพร่ :</span>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '20px 40px', display: 'flex', alignItems: 'center', gap: '60px', flex: 1, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ color: '#555' }}>สถานะเรื่อง</span>
                            <div onClick={() => setIsPublished(!isPublished)} style={{ width: '50px', height: '26px', background: isPublished ? '#bc7df2' : '#ccc', borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                                <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: isPublished ? '27px' : '3px', transition: '0.3s' }} />
                            </div>
                            <span style={{ color: isPublished ? '#bc7df2' : '#aaa', fontSize: '14px' }}>{isPublished ? 'เผยแพร่' : 'ร่าง'}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ color: '#555' }}>สถานะจบ</span>
                            <div onClick={() => setIsCompleted(!isCompleted)} style={{ width: '50px', height: '26px', background: isCompleted ? '#bc7df2' : '#ccc', borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                                <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: isCompleted ? '27px' : '3px', transition: '0.3s' }} />
                            </div>
                            <span style={{ color: isCompleted ? '#bc7df2' : '#aaa', fontSize: '14px' }}>{isCompleted ? 'จบแล้ว' : 'ยังไม่จบ'}</span>
                        </div>

                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '15px' }}>
                            <button onClick={() => navigate('/dashborad')} style={{ padding: '10px 30px', background: '#666', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>ยกเลิก</button>
                            <button onClick={handleSaveDetails} style={{ padding: '10px 30px', background: '#bc7df2', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>บันทึก</button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Notification Toast */}
            {statusMsg && (
                <div style={{ position: 'fixed', bottom: '30px', right: '30px', padding: '15px 30px', background: '#333', color: 'white', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 1000 }}>
                    {statusMsg}
                </div>
            )}
        </div>
    );
}
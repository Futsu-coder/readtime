import { useState, useEffect, useRef } from "react"; 
import { useParams, useNavigate, Link } from "react-router-dom";
import { client, API_URL } from "../client"; 
import { NovelImage } from "../components/novelimage"; 

// --- ส่วน Interface สำหรับ Pop-up ---
interface ModalConfig {
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
}

interface Chapter {
    id: number;
    title: string;
    created_at: string;
}

export function EditNovelPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // States ข้อมูลนิยาย
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [isCompleted, setIsCompleted] = useState(0); 
    const [chapters, setChapters] = useState<Chapter[]>([]); 
    const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null); 
    const [coverFile, setCoverFile] = useState<File | null>(null); 
    const [coverPreview, setCoverPreview] = useState<string | null>(null); 
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState("");
    const [categoriesList, setCategoriesList] = useState<string[]>([]);
    const [isPublished, setIsPublished] = useState(true); 

    // --- State สำหรับควบคุม Pop-up ---
    const [modalConfig, setModalConfig] = useState<ModalConfig>({
        show: false,
        title: "",
        message: "",
        onConfirm: () => {},
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { navigate('/login'); return; }

                const catRes = await fetch(`${API_URL}/api/public/categories`);
                if (catRes.ok) {
                    const catData = await catRes.json();
                    if (catData.categories) setCategoriesList(catData.categories);
                }

                const res = await client.api.protected.novels[":id"].$get(
                    { param: { id: id! } },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (res.ok) {
                    const data = await res.json() as any;
                    setTitle(data.novel.title);
                    setDescription(data.novel.description || "");
                    setCategory(data.novel.category || "");
                    setCurrentCoverUrl(data.novel.cover_image || null); 
                    setChapters(data.chapters || []);
                    setIsCompleted(data.novel.is_completed || 0);
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

    // ฟังก์ชันเปิด Pop-up
    const openConfirm = (title: string, message: string, onConfirm: () => void) => {
        setModalConfig({ show: true, title, message, onConfirm });
    };

    const executeDeleteChapter = async (chapterId: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await client.api.protected.novels[":id"].chapters[":chapterID"].$delete(
                { param: { id: id!, chapterID: chapterId.toString() } },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                setChapters(chapters.filter(ch => ch.id !== chapterId));
            }
        } catch (err) { console.error(err); }
        setModalConfig(prev => ({ ...prev, show: false }));
    };

    const executeDeleteNovel = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await client.api.protected.novels[":id"].$delete(
                { param: { id: id! } },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) navigate('/dashborad');
        } catch (err) { console.error(err); }
        setModalConfig(prev => ({ ...prev, show: false }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                setStatusMsg("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
                return;
            }
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
            }
        } catch (err) { console.log(err) } 
        finally { setIsUploading(false); setTimeout(() => setStatusMsg(""), 3000); }
    };

    const handleSaveDetails = async () => {
        setStatusMsg("กำลังบันทึกข้อมูล...");
        try {
            const token = localStorage.getItem('token');
            const res = await client.api.protected.novels[":id"].$put(
                { param: { id: id! }, json: { title, description, category, is_completed: isCompleted } },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) setStatusMsg("บันทึกข้อมูลสำเร็จ!");
        } catch (err) { console.log(err) }
        setTimeout(() => setStatusMsg(""), 3000);
    };

    if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px', color: '#000' }}>กำลังโหลดข้อมูล...</div>;

    return (
        <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '40px 20px', fontFamily: "'Sarabun', sans-serif" }}>
            
            {/* --- Pop-up UI (Custom Modal) --- */}
            {modalConfig.show && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '25px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <h2 style={{ color: '#bc7df2', marginBottom: '15px', fontSize: '22px', fontWeight: 'normal' }}>{modalConfig.title}</h2>
                        <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.5' }}>{modalConfig.message}</p>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <button 
                                onClick={() => setModalConfig(prev => ({ ...prev, show: false }))}
                                style={{ padding: '10px 25px', background: '#eee', color: '#666', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'normal' }}
                            >
                                ยกเลิก
                            </button>
                            <button 
                                onClick={modalConfig.onConfirm}
                                style={{ padding: '10px 25px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'normal' }}
                            >
                                ยืนยัน
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ background: '#ebebeb', borderRadius: '30px', padding: '40px', display: 'flex', gap: '40px', marginBottom: '30px', position: 'relative' }}>
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        style={{ width: '280px', height: '400px', background: 'white', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', flexShrink: 0 }}
                    >
                        {coverPreview ? (
                            <img src={coverPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" /> 
                        ) : currentCoverUrl ? (
                            <NovelImage src={currentCoverUrl} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#000' }}>เพิ่มรูปหน้าปก</div>
                        )}
                        <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', color: '#000', fontWeight: 'normal', marginBottom: '5px' }}>ชื่อเรื่อง</label>
                            <input 
                                type="text" 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                style={{ width: '100%', padding: '12px', borderRadius: '15px', border: 'none', fontSize: '20px', color: '#000', fontWeight: 'normal', background: '#fcfcfc' }} 
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', color: '#000', fontWeight: 'normal', marginBottom: '5px' }}>หมวดหมู่</label>
                            <select 
                                value={category} 
                                onChange={e => setCategory(e.target.value)} 
                                style={{ width: '100%', padding: '10px', borderRadius: '12px', border: 'none', background: '#fcfcfc', color: '#000', fontWeight: 'normal' }}
                            >
                                {categoriesList.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ background: '#f9f9f9', borderRadius: '25px', padding: '20px', border: 'none', minHeight: '220px', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ color: '#000', margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'normal' }}>เรื่องย่อ</h3>
                            <textarea 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                style={{ 
                                    flex: 1, 
                                    width: '100%', 
                                    minHeight: '150px',
                                    padding: '15px', 
                                    borderRadius: '15px', 
                                    border: '1px solid #e0e0e0', 
                                    fontSize: '16px', 
                                    color: '#000', 
                                    background: '#fff', 
                                    resize: 'vertical', 
                                    boxSizing: 'border-box', 
                                    fontFamily: 'inherit',
                                    outline: 'none'
                                }} 
                                placeholder="เพิ่มเรื่องย่อ..."
                            />
                        </div>
                    </div>

                    {coverFile && (
                        <button onClick={handleUploadCover} style={{ position: 'absolute', bottom: '20px', left: '40px', padding: '10px 25px', background: '#bc7df2', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'normal' }}>
                            {isUploading ? "กำลังอัปโหลด..." : "บันทึกรูปหน้าปก"}
                        </button>
                    )}
                </div>

                <Link to={`/novel/${id}/chapters`} style={{ textDecoration: 'none' }}>
                    <button style={{ width: '100%', padding: '15px', background: '#bc7df2', color: 'white', border: 'none', borderRadius: '40px', fontSize: '18px', fontWeight: 'normal', cursor: 'pointer', marginBottom: '30px' }}>
                        เพิ่มตอน +
                    </button>
                </Link>

                <div style={{ background: '#ebebeb', borderRadius: '30px', padding: '15px', marginBottom: '40px' }}>
                    {chapters.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#000' }}>ยังไม่มีตอนที่เพิ่มเข้ามา</div>
                    ) : (
                        <div style={{ width: '100%' }}>
                            {chapters.map((ch, index) => (
                                <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', borderBottom: index === chapters.length - 1 ? 'none' : '1px solid #ddd' }}>
                                    <span style={{ color: '#000', fontWeight: 'normal' }}>EP.{index + 1} - {ch.title}</span>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <Link to={`/novel/${id}/chapters/${ch.id}/edit`} style={{ padding: '8px 25px', background: '#fcfcfc', color: '#bc7df2', textDecoration: 'none', borderRadius: '15px', fontSize: '14px', border: 'none', fontWeight: 'normal' }}>แก้ไข</Link>
                                        <button 
                                            onClick={() => openConfirm("ลบตอนนิยาย", "คุณแน่ใจนะว่าจะลบตอนนี้?", () => executeDeleteChapter(ch.id))} 
                                            style={{ border: 'none', background: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 'normal' }}
                                        >
                                            ลบ
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '50px' }}>
                    <span style={{ color: '#000', fontWeight: 'normal', fontSize: '18px' }}>ตั้งค่า :</span>
                    <div style={{ background: '#ebebeb', borderRadius: '30px', padding: '20px 40px', display: 'flex', alignItems: 'center', gap: '40px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ color: '#000', fontWeight: 'normal' }}>เผยแพร่</span>
                            <div onClick={() => setIsPublished(!isPublished)} style={{ width: '50px', height: '26px', background: isPublished ? '#bc7df2' : '#bbb', borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                                <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: isPublished ? '27px' : '3px', transition: '0.3s' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ color: '#000', fontWeight: 'normal' }}>สถานะจบ</span>
                            <div onClick={() => setIsCompleted(isCompleted === 1 ? 0 : 1)} style={{ width: '50px', height: '26px', background: isCompleted === 1 ? '#bc7df2' : '#bbb', borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                                <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: isCompleted === 1 ? '27px' : '3px', transition: '0.3s' }} />
                            </div>
                            <span style={{ color: isCompleted === 1 ? '#bc7df2' : '#000', fontSize: '14px', fontWeight: 'normal' }}>{isCompleted === 1 ? 'จบแล้ว' : 'ยังไม่จบ'}</span>
                        </div>

                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '15px' }}>
                            <button 
                                onClick={() => openConfirm("ลบนิยายเรื่องนี้?", "คุณแน่ใจหรือไม่ที่จะลบข้อมูลทั้งหมดถาวร?", executeDeleteNovel)} 
                                style={{ padding: '10px 20px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontSize: '14px', fontWeight: 'normal' }}
                            >
                                ลบเรื่องนี้
                            </button>
                            <button onClick={() => navigate('/dashborad')} style={{ padding: '10px 25px', background: '#888', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'normal' }}>ยกเลิก</button>
                            <button onClick={handleSaveDetails} style={{ padding: '10px 35px', background: '#bc7df2', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'normal' }}>บันทึกข้อมูล</button>
                        </div>
                    </div>
                </div>

            </div>

            {statusMsg && (
                <div style={{ position: 'fixed', bottom: '30px', right: '30px', padding: '15px 35px', background: statusMsg.includes('สำเร็จ') ? '#28a745' : '#333', color: 'white', borderRadius: '15px', zIndex: 1000, fontWeight: 'normal' }}>
                    {statusMsg}
                </div>
            )}
        </div>
    );
}
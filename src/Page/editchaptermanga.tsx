import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { API_URL } from "../client";

interface MangaPage {
    id: number;
    page_number: number;
    image_url: string;
}

export function EditMangaChapterPage() {
    const { id, chapterId } = useParams<{ id: string; chapterId: string }>();
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [chapterNumber, setChapterNumber] = useState("");
    const [pages, setPages] = useState<MangaPage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");

    useEffect(() => {
        const fetchChapterData = async () => {
            if (!id || !chapterId) return;
            try {
                const res = await fetch(`${API_URL}/api/public/mangas/${id}/chapters/${chapterId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.chapter) {
                        setTitle(data.chapter.title || "");
                        setChapterNumber(data.chapter.chapter_number.toString());
                    }
                    if (data.pages) {
                        setPages(data.pages);
                    }
                } else {
                    alert("ไม่พบข้อมูลตอนมังงะ");
                    navigate(`/manga/${id}/edit`);
                }
            } catch (err) {
                console.error(err);
                setStatusMsg("โหลดข้อมูลไม่สำเร็จ");
            } finally {
                setIsLoading(false);
            }
        };
        fetchChapterData();
    }, [id, chapterId, navigate]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chapterNumber.trim()) return setStatusMsg("กรุณาระบุเลขตอน");

        setIsSaving(true);
        setStatusMsg("กำลังบันทึกการแก้ไข...");

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/protected/manga/${id}/chapters/${chapterId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    title: title, 
                    chapterNumber: parseFloat(chapterNumber) 
                })
            });

            if (res.ok) {
                alert("บันทึกการแก้ไขสำเร็จ!");
                navigate(`/manga/${id}/edit`); 
            } else {
                const data = await res.json();
                setStatusMsg(`อัปเดตไม่สำเร็จ: ${data.error || 'เกิดข้อผิดพลาด'}`);
            }
        } catch (err) {
            console.error(err);
            setStatusMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
        } finally {
            setIsSaving(false);
            setTimeout(() => setStatusMsg(""), 3000);
        }
    };

    const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' };

    if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>⏳ กำลังโหลดข้อมูล...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', fontFamily: "'Sarabun', sans-serif" }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#ff7b00', margin: '0 0 10px 0', fontSize: '2.2rem' }}>แก้ไขตอนมังงะ</h1>
            </div>
            <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
                <form onSubmit={handleUpdate}>                    
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                        <div style={{ flex: '1' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' , color:'black' }}>เลขตอน</label>
                            <input 
                                type="number" step="0.1" value={chapterNumber} onChange={(e) => setChapterNumber(e.target.value)}
                                placeholder="เช่น 1 หรือ 1.5" required style={inputStyle}
                            />
                        </div>
                        <div style={{ flex: '3' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' , color:'black'}}>ชื่อตอน</label>
                            <input 
                                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                placeholder="จุดเริ่มต้น..." style={inputStyle}
                            />
                        </div>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px dashed #eee', margin: '30px 0' }} />
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>หน้ากระดาษปัจจุบัน ({pages.length} หน้า)</h3>
                        <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px' }}>
                            *หมายเหตุ: หากต้องการสลับลำดับหน้าหรือแทรกหน้าใหม่ กรุณาลบตอนนี้ในหน้าจัดการ แล้วทำการอัปโหลดใหม่ทั้งหมดเพื่อป้องกันข้อผิดพลาดของระบบครับ
                        </p>                   
                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px' }}>
                            {pages.map((p) => (
                                <div key={p.id} style={{ flexShrink: 0, width: '100px', textAlign: 'center' }}>
                                    <div style={{ width: '100px', height: '140px', background: '#f5f5f5', borderRadius: '6px', overflow: 'hidden', border: '1px solid #eee' }}>
                                        <img src={`${API_URL}${p.image_url}`} alt={`Page ${p.page_number}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px', display: 'block' }}>หน้า {p.page_number}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {statusMsg && (
                        <div style={{ background: statusMsg.includes('✅') ? '#d4edda' : '#fff0f3', color: statusMsg.includes('✅') ? '#155724' : '#d63384', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
                            {statusMsg}
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link to={`/manga/${id}/edit`} style={{ color: '#888', textDecoration: 'none', fontWeight: 'bold' }}>
                            &larr; ยกเลิก
                        </Link>
                        <button 
                            type="submit" disabled={isSaving}
                            style={{
                                padding: '12px 30px',
                                background: isSaving ? '#ccc' : '#ff7b00',
                                color: 'white', border: 'none', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 'bold',
                                cursor: isSaving ? 'not-allowed' : 'pointer', transition: '0.2s',
                                boxShadow: isSaving ? 'none' : '0 4px 15px rgba(255, 123, 0, 0.4)'
                            }}
                        >
                            {isSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
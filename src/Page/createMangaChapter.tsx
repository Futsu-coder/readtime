import { useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { API_URL } from "../client"; 

interface PageImage {
    file: File;
    preview: string;
}

export function CreateMangaChapterPage() {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [chapterNumber, setChapterNumber] = useState("");
    const [pages, setPages] = useState<PageImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newPages = Array.from(files).map(file => ({
                file,
                preview: URL.createObjectURL(file)
            }));
            setPages(prev => [...prev, ...newPages]);
            setErrorMsg("");
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removePage = (indexToRemove: number) => {
        setPages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const movePageUp = (index: number) => {
        if (index === 0) return; 
        setPages(prev => {
            const newPages = [...prev];
            [newPages[index - 1], newPages[index]] = [newPages[index], newPages[index - 1]]; 
            return newPages;
        });
    };

    const movePageDown = (index: number) => {
        if (index === pages.length - 1) return; 
        setPages(prev => {
            const newPages = [...prev];
            [newPages[index], newPages[index + 1]] = [newPages[index + 1], newPages[index]]; 
            return newPages;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chapterNumber.trim()) return setErrorMsg("กรุณาระบุเลขตอน");
        if (pages.length === 0) return setErrorMsg("กรุณาเพิ่มรูปภาพอย่างน้อย 1 หน้า");
        setIsLoading(true);
        setErrorMsg("");

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("chapterNumber", chapterNumber);            
            pages.forEach((page) => {
                formData.append("pages[]", page.file);
            });

            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/protected/manga/${id}/chapters`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                navigate(`/manga/${id}`); 
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = await res.json() as any;
                setErrorMsg(`อัปโหลดไม่สำเร็จ: ${data.error || 'เกิดข้อผิดพลาด'}`);
            }

        } catch (err) {
            console.error(err);
            setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Styles ---
    const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' };
    const btnStyle = { padding: '8px 15px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' as const };

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', fontFamily: "'Sarabun', sans-serif" }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#6a4c93', margin: '0 0 10px 0', fontSize: '2.2rem' }}>🖼️ เพิ่มตอนมังงะใหม่</h1>
                <p style={{ color: '#666', fontSize: '1.1rem' }}>อัปโหลดและจัดเรียงหน้ามังงะของคุณ</p>
            </div>
            <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                        <div style={{ flex: '1' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' , color:'black'}}>เลขตอน (เช่น 1 หรือ 2)</label>
                            <input 
                                type="number" value={chapterNumber} onChange={(e) => setChapterNumber(e.target.value)}
                                placeholder="1" required style={inputStyle}
                            />
                        </div>
                        <div style={{ flex: '3' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' , color:'black'}}>ชื่อตอน</label>
                            <input 
                                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                placeholder="จุดเริ่มต้นของการเดินทาง..." style={inputStyle}
                            />
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px dashed #eee', margin: '30px 0' }} />
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <label style={{ fontWeight: 'bold', fontSize: '1.2rem' , color:'black'}}>หน้ามังงะ ({pages.length} หน้า)</label>
                            <button 
                                type="button" onClick={() => fileInputRef.current?.click()}
                                style={{ ...btnStyle, background: '#e0c3fc', color: '#5a189a' }}
                            >
                                + เลือกรูปภาพ (เลือกหลายรูปได้)
                            </button>
                            <input 
                                type="file" multiple accept="image/*" 
                                ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} 
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {pages.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '50px', background: '#f9f9f9', borderRadius: '12px', color: '#999', border: '2px dashed #ddd' }}>
                                    ยังไม่ได้เลือกรูปภาพเลยครับ! กดปุ่มด้านขวาบนเพื่อเพิ่มหน้ามังงะ
                                </div>
                            ) : (
                                pages.map((page, index) => (
                                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '20px', background: '#fdfdfd', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
                                        <div style={{ width: '80px', height: '110px', background: '#ddd', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                            <img src={page.preview} alt={`Page ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>หน้าที่ {index + 1}</h4>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>{page.file.name}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button type="button" onClick={() => movePageUp(index)} disabled={index === 0} style={{ ...btnStyle, background: index === 0 ? '#eee' : '#fff', border: '1px solid #ddd', color: index === 0 ? '#aaa' : '#333' }}>
                                                ⬆️
                                            </button>
                                            <button type="button" onClick={() => movePageDown(index)} disabled={index === pages.length - 1} style={{ ...btnStyle, background: index === pages.length - 1 ? '#eee' : '#fff', border: '1px solid #ddd', color: index === pages.length - 1 ? '#aaa' : '#333' }}>
                                                ⬇️
                                            </button>
                                            <button type="button" onClick={() => removePage(index)} style={{ ...btnStyle, background: '#fff0f3', color: '#ff4d6d' }}>
                                                ❌ ลบ
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    {errorMsg && (
                        <div style={{ background: '#fff0f3', color: '#d63384', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
                            {errorMsg}
                        </div>
                    )}
                    <button 
                        type="submit" disabled={isLoading}
                        style={{
                            width: '100%', padding: '15px', marginTop: '20px',
                            background: isLoading ? '#ccc' : 'linear-gradient(135deg, #6a4c93 0%, #9067c6 100%)',
                            color: 'white', border: 'none', borderRadius: '30px', fontSize: '1.2rem', fontWeight: 'bold',
                            cursor: isLoading ? 'not-allowed' : 'pointer', transition: '0.2s',
                            boxShadow: isLoading ? 'none' : '0 4px 15px rgba(106, 76, 147, 0.4)'
                        }}
                    >
                        {isLoading ? "กำลังอัปโหลดหน้ามังงะ..." : "บันทึกและเผยแพร่ตอน!"}
                    </button>
                </form>
            </div>
        </div>
    );
}
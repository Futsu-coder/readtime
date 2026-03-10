import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Globe, FileEdit, CheckCircle2 } from 'lucide-react'; 
import { API_URL } from "../client"; 
import { RichTextEditor } from "../components/RichtextEditor";

export function EditChapterPage() {
    const { id, chapterId } = useParams<{ id: string; chapterId: string }>();
    const navigate = useNavigate();
    const [novelTitle, setNovelTitle] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [statusMsg, setStatusMsg] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // 🌟 State สำหรับควบคุมการแสดงผล Popup
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [savedStatus, setSavedStatus] = useState<'published' | 'draft'>('draft');

    useEffect(() => {
        const fetchChapterData = async () => {
            if (!id || !chapterId) return;
            try {
                const token = localStorage.getItem('token');
                const novelRes = await fetch(`${API_URL}/api/protected/novels/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (novelRes.ok) {
                    const novelData = await novelRes.json() as any;
                    setNovelTitle(novelData.novel.title);
                }

                const chapRes = await fetch(`${API_URL}/api/protected/novels/${id}/chapters/${chapterId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (chapRes.ok) {
                    const cData = await chapRes.json() as any;
                    if (cData.chapter) { 
                        setTitle(cData.chapter.title); 
                        setContent(cData.chapter.content); 
                    }
                } else { 
                    navigate(`/novel/${id}/edit`); 
                }
            } catch (err) {
                console.error(err);
                setStatusMsg('โหลดข้อมูลไม่สำเร็จ'); 
            } finally { 
                setIsLoading(false); 
            }
        };
        fetchChapterData();
    }, [id, chapterId, navigate]);

    const handleUpdate = async (targetStatus: 'published' | 'draft', e: React.MouseEvent) => {
        e.preventDefault();
        if (!title || !content || content === '<p><br></p>') {
            return setStatusMsg('⚠️ กรุณากรอกชื่อตอนและเนื้อหาให้ครบ');
        }
        
        setIsSaving(true);
        setStatusMsg(targetStatus === 'draft' ? 'กำลังบันทึกเป็นแบบร่าง...' : 'กำลังเผยแพร่...');
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/protected/novels/${id}/chapters/${chapterId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ title, content, status: targetStatus })
            });

            if (res.ok) { 
                // 🌟 เมื่อสำเร็จ ให้เปิด Modal แทนการใช้ alert
                setSavedStatus(targetStatus);
                setShowSuccessModal(true);
            } else { 
                const data = await res.json() as any;
                setStatusMsg(`❌ อัปเดตไม่สำเร็จ: ${data.error || 'เกิดข้อผิดพลาด'}`); 
            }
        } catch (err) {
            console.error(err);
            setStatusMsg('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Server'); 
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px', color: '#9b67bd', fontSize: '1.2rem' }}>⏳ กำลังโหลดข้อมูลตอน...</div>;

    return (
        <div style={pageContainer}>           
            <div style={mainContent}>
                <div style={sectionWhite}>
                    <h3 style={{ margin: '0 0 20px 0', color: '#666', fontSize: '1.2rem' }}>
                        แก้ไขเนื้อหาตอน <span style={{ color: '#bc7df2' }}>({novelTitle})</span>
                    </h3>                   
                    
                    <div style={titleRow}>
                        <span style={chapterLabel}>ชื่อตอน<span style={{color: 'red'}}>*</span></span>
                        <input 
                            type="text" 
                            placeholder="เช่น ตอนที่ 1: จุดเริ่มต้น"
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)}
                            style={titleInput} 
                        />
                    </div>
                    
                    <div style={{ marginBottom: '30px' }}>
                        <span style={{ ...chapterLabel, display: 'block', marginBottom: '10px' }}>เนื้อหานิยาย<span style={{color: 'red'}}>*</span></span>
                        <RichTextEditor 
                            value={content} 
                            onChange={setContent} 
                            height="500px" 
                            placeholder="เขียนเนื้อหานิยายที่นี่..."
                        />
                    </div>

                    {statusMsg && (
                        <div style={{ 
                            background: statusMsg.includes('✅') ? '#d4edda' : statusMsg.includes('⚠️') ? '#fff3cd' : '#fff0f3', 
                            color: statusMsg.includes('✅') ? '#155724' : statusMsg.includes('⚠️') ? '#856404' : '#d63384', 
                            padding: '15px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' 
                        }}>
                            {statusMsg}
                        </div>
                    )}

                    <div style={actionButtons}>
                        <Link to={`/dashborad`} style={btnGray}>
                            ยกเลิก
                        </Link>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                type="button" 
                                disabled={isSaving} 
                                onClick={(e) => handleUpdate('draft', e)}
                                style={{...btnOutline, opacity: isSaving ? 0.5 : 1}}
                            >
                                <FileEdit size={18} /> บันทึกเป็นร่าง
                            </button>
                            
                            <button 
                                type="button" 
                                disabled={isSaving} 
                                onClick={(e) => handleUpdate('published', e)}
                                style={{...btnPurple(isSaving), display: 'flex', alignItems: 'center', gap: '8px'}}
                            >
                                <Globe size={18} /> อัปเดต & เผยแพร่
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🌟 Custom Success Modal (ป๊อปอัพ) */}
            {showSuccessModal && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <div style={{ marginBottom: '20px' }}>
                            <CheckCircle2 size={80} color="#bc7df2" />
                        </div>
                        <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>บันทึกสำเร็จ!</h2>
                        <p style={{ color: '#666', marginBottom: '30px', fontSize: '1.1rem' }}>
                            ตอนนิยายของคุณถูกบันทึกเป็น <br/>
                            <strong style={{ color: '#bc7df2' }}>"{savedStatus === 'draft' ? 'แบบร่าง' : 'เผยแพร่'}"</strong> เรียบร้อยแล้ว
                        </p>
                        <button 
                            onClick={() => navigate('/dashborad')}
                            style={{ ...btnPurple(false), width: '100%' }}
                        >
                            ตกลง
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Styles ---
const pageContainer: React.CSSProperties = { minHeight: '100vh', backgroundColor: '#f9f9f9', padding: '40px 20px', fontFamily: "'Kanit', 'Sarabun', sans-serif" };
const mainContent = { maxWidth: '1000px', margin: '0 auto' };
const sectionWhite = { backgroundColor: '#fff', padding: '40px', borderRadius: '25px', border: '1px solid #f0f0f0', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' };
const titleRow = { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' };
const chapterLabel = { color: '#bc7df2', fontSize: '18px', fontWeight: 'bold' };
const titleInput: React.CSSProperties = { flex: 1, padding: '15px 20px', borderRadius: '15px', border: '1px solid #bfbfbf', fontSize: '16px', outline: 'none', color: '#333', background: '#fff' };
const actionButtons = { display: 'flex', justifyContent: 'space-between', marginTop: '20px', alignItems: 'center', borderTop: '1px dashed #eee', paddingTop: '25px' };
const btnGray: React.CSSProperties = { padding: '12px 35px', borderRadius: '20px', border: 'none', backgroundColor: '#eee', color: '#666', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', textDecoration: 'none', transition: '0.2s' };
const btnOutline: React.CSSProperties = { padding: '12px 25px', borderRadius: '20px', border: '2px solid #ddd', backgroundColor: '#fff', color: '#666', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' };
const btnPurple = (isLoading: boolean): React.CSSProperties => ({ 
    padding: '12px 30px', borderRadius: '20px', border: 'none', 
    backgroundColor: isLoading ? '#ccc' : '#bc7df2', 
    color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer', 
    fontWeight: 'bold', fontSize: '16px', 
    boxShadow: isLoading ? 'none' : '0 4px 15px rgba(188, 125, 242, 0.4)', transition: '0.2s' 
});

// 🌟 Modal Styles
const modalOverlay: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)' // ทำให้พื้นหลังเบลอสวยๆ
};

const modalContent: React.CSSProperties = {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '30px',
    textAlign: 'center',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    animation: 'modalFadeIn 0.3s ease-out'
};
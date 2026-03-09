import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { client } from "../client";
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
                        // ถ้า backend มีส่งสถานะ publish มาด้วย สามารถเซ็ตตรงนี้ได้เลย เช่น
                        // setIsPublished(cData.chapter.isPublished || false);
                    }
                } else { 
                    navigate(`/novel/${id}`); 
                }
            } catch (err) {
                console.error(err);
                setStatus('❌ ไม่สามารถโหลดข้อมูลได้'); 
            } finally { 
                setIsLoading(false); 
            }
        };
        fetchChapterData();
    }, [id, chapterId, navigate]);

    const handleTogglePublish = () => {
        if (!isPublished) setShowPublishModal(true);
        else setIsPublished(false);
    };

    const handleUpdate = async () => {
        if (!title || !content || content === '<p><br></p>') {
            setShowSaveConfirm(false);
            return alert('กรุณากรอกชื่อตอนและเนื้อหาให้ครบ');
        }
        
        setStatus('กำลังบันทึกการแก้ไข...');
        try {
            const token = localStorage.getItem('token');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res = await client.api.protected.novels[':id'].chapters[':chapterID'].$put(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                { param: { id: id!, chapterID: chapterId! }, json: { title, content } } as any,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (res.ok) { 
                setShowSaveConfirm(false);
                setShowSuccessOption(true);
            } else { 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setStatus(`❌ ${(await res.json() as any).error}`);
                setShowSaveConfirm(false);
            }
        } catch (err) {
            console.error(err);
            setStatus('❌ เชื่อมต่อ Server ไม่ได้');
            setShowSaveConfirm(false);
        }
    };

    if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: "'Kanit', 'Sarabun', sans-serif" }}>กำลังโหลดข้อมูล...</div>;

    return (
        <div style={pageContainer}>
            <div style={mainContent}>
                <div style={sectionWhite}>
                    <h3 style={{ margin: '0 0 20px 0', color: '#666' }}>แก้ไขเรื่อง: {novelTitle || 'กำลังโหลด...'}</h3>                   
                    <div style={titleRow}>
                        <span style={chapterLabel}>ชื่อตอน</span>
                        <input 
                            type="text" 
                            placeholder="เช่น ตอนที่ 0: prolough"
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)}
                            style={titleInput} 
                        />
                    </div>
                    <div style={{ marginBottom: '30px' }}>
                        <RichTextEditor 
                            value={content} 
                            onChange={setContent} 
                            height="500px" 
                            placeholder="แก้ไขเนื้อหานิยายที่นี่"
                        />
                    </div>

                    <div style={statusRowContainer}>
                        <span style={statusTitle}>เผยแพร่ :</span>
                        <div style={statusWhiteCard}>
                            <div style={toggleSection}>
                                <div style={toggleItem}>
                                    <span style={toggleLabel}>สถานะ</span>
                                    <div onClick={handleTogglePublish} style={{...switchBase, backgroundColor: isPublished ? '#4caf50' : '#ddd'}}>
                                        <div style={{...switchThumb, left: isPublished ? '22px' : '2px'}} />
                                    </div>
                                    <span style={{color: isPublished ? '#4caf50' : '#999', fontSize: '14px', minWidth: '60px'}}>{isPublished ? 'เผยแพร่' : 'ร่าง'}</span>
                                </div>
                            </div>
                            
                            <div style={actionButtons}>
                                <span style={{ marginRight: '15px', color: '#9b67bd', alignSelf: 'center' }}>{status}</span>
                                <button style={btnGray} onClick={() => navigate('/dashborad')}>ยกเลิก</button>
                                <button style={btnPurple} onClick={() => setShowSaveConfirm(true)}>อัปเดตเนื้อหา</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals เหมือนหน้า addchapter */}
            {showPublishModal && (
                <div style={modalOverlay}>
                    <div style={modalContainer}>
                        <h2 style={modalTitle}>ต้องการเผยแพร่หรือไม่</h2>
                        <div style={modalActionArea}>
                            <button style={btnPublishNow} onClick={() => { setIsPublished(true); setShowPublishModal(false); }}>เผยแพร่เลย</button>
                            <button style={btnKeepDraft} onClick={() => { setIsPublished(false); setShowPublishModal(false); }}>เป็นร่างไว้ก่อน</button>
                        </div>
                    </div>
                </div>
            )}

            {showSaveConfirm && (
                <div style={modalOverlay}>
                    <div style={modalContainer}>
                        <h2 style={modalTitle}>ยืนยันการบันทึกการแก้ไข?</h2>
                        <div style={modalActionArea}>
                            <button style={btnPublishNow} onClick={handleUpdate}>ตกลง</button>
                            <button style={btnKeepDraft} onClick={() => setShowSaveConfirm(false)}>ยกเลิก</button>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessOption && (
                <div style={modalOverlay}>
                    <div style={modalContainer}>
                        <h2 style={modalTitle}>อัปเดตสำเร็จ!</h2>
                        <div style={modalActionArea}>
                            <button style={btnPublishNow} onClick={() => navigate('/dashborad')}>กลับไปหน้า Dashboard</button>
                            <button style={btnKeepDraft} onClick={() => navigate(`/novel/${id}`)}>ดูรายละเอียดนิยาย</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/// --- style ---
const pageContainer: React.CSSProperties = { minHeight: '100vh', backgroundColor: '#f9f9f9', padding: '40px 20px', fontFamily: "'Kanit', 'Sarabun', sans-serif" };
const mainContent = { maxWidth: '1000px', margin: '0 auto' };
const sectionWhite = { backgroundColor: '#fff', padding: '40px', borderRadius: '25px', border: '1px solid #f0f0f0', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' };
const titleRow = { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' };
const chapterLabel = { color: '#bc7df2', fontSize: '20px', fontWeight: 'bold' };
const titleInput: React.CSSProperties = { flex: 1, padding: '15px 20px', borderRadius: '15px', border: '1px solid #bfbfbf', fontSize: '16px', outline: 'none' , color:'black' , background:'white' };
const statusRowContainer: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '20px', marginTop: '60px' };
const statusTitle = { color: '#bc7df2', fontWeight: 'bold', fontSize: '20px' };
const statusWhiteCard: React.CSSProperties = { flex: 1, backgroundColor: '#fcfcfc', border: '1px solid #eee', borderRadius: '25px', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const toggleSection = { display: 'flex', flexDirection: 'column' as const, gap: '8px' };
const toggleItem = { display: 'flex', alignItems: 'center', gap: '15px' };
const toggleLabel = { fontSize: '16px', color: '#666', width: '60px', fontWeight: 'bold' };
const switchBase: React.CSSProperties = { width: '42px', height: '22px', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' };
const switchThumb: React.CSSProperties = { width: '18px', height: '18px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' };
const actionButtons = { display: 'flex', gap: '15px' };
const btnGray = { padding: '12px 35px', borderRadius: '20px', border: 'none', backgroundColor: '#eee', color: '#666', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: '0.2s' };
const btnPurple = { padding: '12px 40px', borderRadius: '20px', border: 'none', backgroundColor: '#bc7df2', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(188, 125, 242, 0.4)', transition: '0.2s' };

const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContainer: React.CSSProperties = { width: '420px', backgroundColor: '#fff', borderRadius: '35px', padding: '45px 35px', textAlign: 'center', border: '4px solid #bc7df2', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' };
const modalTitle = { fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '25px' };
const modalActionArea = { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '15px' };
const btnPublishNow: React.CSSProperties = { width: '100%', padding: '15px 0', backgroundColor: '#bc7df2', color: '#fff', border: 'none', borderRadius: '30px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(188, 125, 242, 0.4)' };
const btnKeepDraft: React.CSSProperties = { width: '60%', padding: '12px 0', backgroundColor: '#f5f5f5', color: '#666', border: 'none', borderRadius: '30px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' };

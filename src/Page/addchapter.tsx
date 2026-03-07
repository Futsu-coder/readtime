import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { client } from "../client";
import { RichTextEditor } from "../components/RichtextEditor"; // 🌟 ดึง Editor ตัวจริงมาใช้

export function AddChapterPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [novelTitle, setNovelTitle] = useState('');
    const [status, setStatus] = useState('');
    const getSavedDraft = () => {
        if (!id) return { draftTitle: '', draftContent: '' };
        const saved = localStorage.getItem(`draft_novel_${id}`);
        return saved ? JSON.parse(saved) : { draftTitle: '', draftContent: '' };
    };
    const [title, setTitle] = useState(() => getSavedDraft().draftTitle);
    const [content, setContent] = useState(() => getSavedDraft().draftContent);
    const [isPublished, setIsPublished] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [showSuccessOption, setShowSuccessOption] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);

    useEffect(() => {
        if (!id) return;
        if (title || (content && content !== '<p><br></p>')) {
            localStorage.setItem(`draft_novel_${id}`, JSON.stringify({ draftTitle: title, draftContent: content }));
        }
    }, [title, content, id]);

    useEffect(() => {
        const fetchNovelInfo = async () => {
            if (!id) return;
            try {
                const token = localStorage.getItem('token');
                const res = await client.api.protected.novels[':id'].$get(
                    { param: { id } },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const data = await res.json();
                if (res.ok) setNovelTitle((data as any).novel.title);
            } catch (err) { console.error(err); }
        };
        fetchNovelInfo();
    }, [id]);

    const handleTogglePublish = () => {
        if (!isPublished) setShowPublishModal(true);
        else setIsPublished(false);
    };

    const handleSave = async () => {
        if (!title || !content || content === '<p><br></p>') {
            setShowSaveConfirm(false);
            return alert('กรุณากรอกชื่อตอนและเนื้อหาให้ครบ');
        }
        
        setStatus('กำลังบันทึกตอนใหม่...');
        try {
            const token = localStorage.getItem('token');
            const res = await client.api.protected.novels[':id'].chapters.$post(
                { param: { id: id! }, json: { title, content } } as any,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.ok) {
                localStorage.removeItem(`draft_novel_${id}`);
                setShowSaveConfirm(false);
                setShowSuccessOption(true); 
            } else {
                const data = await res.json();
                alert(`❌ ${(data as any).error}`);
                setShowSaveConfirm(false);
            }
        } catch (err) {
            console.error(err);
            alert('❌ เชื่อมต่อ Server ไม่ได้');
            setShowSaveConfirm(false);
        }
    };

    return (
        <div style={pageContainer}>
            <div style={mainContent}>
                <div style={sectionWhite}>
                    <h3 style={{ margin: '0 0 20px 0', color: '#666' }}>เรื่อง: {novelTitle || 'กำลังโหลด...'}</h3>                   
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
                            placeholder="เขียนเนื้อหานิยายที่นี่"
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
                                <button style={btnGray} onClick={() => navigate(-1)}>ยกเลิก</button>
                                <button style={btnPurple} onClick={() => setShowSaveConfirm(true)}>บันทึก</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
                        <h2 style={modalTitle}>ยืนยันการบันทึกตอน?</h2>
                        <div style={modalActionArea}>
                            <button style={btnPublishNow} onClick={handleSave}>ตกลง</button>
                            <button style={btnKeepDraft} onClick={() => setShowSaveConfirm(false)}>ยกเลิก</button>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessOption && (
                <div style={modalOverlay}>
                    <div style={modalContainer}>
                        <h2 style={modalTitle}>บันทึกสำเร็จ</h2>
                        <div style={modalActionArea}>
                            <button style={btnPublishNow} onClick={() => navigate(`/novel/${id}`)}>ดูรายละเอียดนิยาย</button>
                            <button style={btnKeepDraft} onClick={() => {
                                setShowSuccessOption(false);
                                setTitle(""); 
                                setContent("");
                                setStatus("");
                            }}>เขียนตอนต่อไป</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

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
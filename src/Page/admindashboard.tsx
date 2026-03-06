import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// 🌟 1. เพิ่ม MoreVertical (จุดสามจุด) และ Trash2 (ถังขยะ) เข้ามา
import { ChevronLeft, ShieldAlert, Ban, Search, CheckCircle, MoreVertical, Trash2, AlertTriangle } from 'lucide-react';import { API_URL } from "../client";

interface Report {
    id: number;
    reporter_id: number;
    target_id: number;
    target_type: 'novel' | 'manga' | 'comment' | 'user';
    reason: string;
    status: string;
    created_at: string;
    reporter_name: string;
    target_title?: string;
    novel_chapter_title?: string;
    manga_chapter_number?: number;
    comment_text?: string;
    target_username?: string;
    target_owner_name?: string;
}

export function AdminDashboard() {
    const navigate = useNavigate();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // 🌟 2. สร้าง State สำหรับเก็บ ID ของแถวที่กำลังเปิด Dropdown
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [actionModalOpen, setActionModalOpen] = useState(false);

    // 🌟 3. สร้าง useEffect สำหรับปิด Dropdown เวลากดคลิกที่อื่นบนหน้าจอ
    useEffect(() => {
        const closeMenu = () => setOpenDropdownId(null);
        document.addEventListener("click", closeMenu);
        return () => document.removeEventListener("click", closeMenu);
    }, []);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch(`${API_URL}/api/admin/reports`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const text = await response.text(); 
                try {
                    const data = JSON.parse(text); 
                    if (response.ok) {
                        setReports(data.reports || []);
                    } else {
                        setError(data.error || 'ดึงข้อมูลไม่สำเร็จ คุณอาจไม่มีสิทธิ์เข้าถึง');
                    }
                } catch (parseError) {
                    console.error(parseError)

                    setError(`เซิร์ฟเวอร์ปฏิเสธการเข้าถึง: ${text}`);
                }

            } catch (err) {
                console.error(err)
                setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [navigate]);

    // 🌟 ฟังก์ชันสำหรับกดยืนยันการลบ Report
    const handleDeleteReport = async (reportId: number) => {
        const confirmDelete = window.confirm("แน่ใจหรือไม่ว่าต้องการลบรายการแจ้งเตือนนี้ทิ้ง?");
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/admin/reports/${reportId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // ถ้าลบหลังบ้านสำเร็จ ให้เตะ reportId นั้นออกจากตารางบนหน้าจอทันที
                setReports(prevReports => prevReports.filter(report => report.id !== reportId));
                setOpenDropdownId(null); // ปิด Dropdown
            } else {
                const data = await response.json();
                alert(`ลบไม่สำเร็จ: ${data.error}`);
            }
        } catch (err) {
            console.error(err)
            alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        }
    };

    const renderTargetInfo = (report: Report) => {
        if (report.target_type === 'novel' || report.target_type === 'manga') {
            return (
                <div>
                    <span style={{ fontWeight: 'bold', color: report.target_type === 'novel' ? '#9b67bd' : '#13c2c2' }}>
                        {report.target_type === 'novel' ? '📖 นิยาย' : '🎨 มังงะ'}
                    </span>
                    <br />
                    {/* 🌟 ทำให้ชื่อเรื่องกลายเป็นลิงก์กดได้ เพื่อพุ่งไปหน้า Detail */}
                    <span 
                        onClick={() => navigate(`/${report.target_type}/${report.target_id}`)}
                        style={{ 
                            color: '#3b82f6', 
                            fontWeight: 'bold', 
                            cursor: 'pointer',
                            textDecoration: 'underline' 
                        }}
                        title="คลิกเพื่อดูหน้าผลงาน"
                    >
                        {report.target_title || `ID: ${report.target_id}`}
                    </span>

                    {/* 🌟 เพิ่มแสดงชื่อเจ้าของผลงาน */}
                    <div style={{ fontSize: '13px', color: '#888', marginTop: '6px' }}>
                        ✍️ ผู้แต่ง: <span style={{ color: '#555', fontWeight: '500' }}>{report.target_owner_name || 'ไม่ระบุ'}</span>
                    </div>

                    {report.novel_chapter_title && <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>📌 ตอน: {report.novel_chapter_title}</div>}
                    {report.manga_chapter_number && <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>📌 ตอนที่: {report.manga_chapter_number}</div>}
                </div>
            );
        }
        if (report.target_type === 'comment') {
            return (
                <div>
                    <span style={{ fontWeight: 'bold', color: '#ff7b00' }}>💬 คอมเมนต์ ID: {report.target_id}</span>
                    <div style={{ fontSize: '13px', color: '#555', background: '#f5f5f5', padding: '5px', borderRadius: '4px', marginTop: '4px' }}>
                        "{report.comment_text || 'ไม่พบข้อความ'}"
                    </div>
                </div>
            );
        }
        return <span style={{ fontWeight: 'bold', color: '#e11d48' }}>👤 ผู้ใช้: {report.target_username || report.target_id}</span>;
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px', color: '#e11d48', fontWeight: 'bold' }}>⏳ กำลังโหลดข้อมูลลับของแอดมิน...</div>;
    
    if (error) return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2 style={{ color: '#e11d48' }}>❌ เข้าถึงไม่ได้</h2>
            <p style={{ color: '#666' }}>{error}</p>
            <button onClick={() => navigate('/')} style={{ padding: '10px 20px', background: '#e11d48', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>กลับหน้าแรก</button>
        </div>
    );

    return (
        <div style={pageContainer}>
            <button onClick={() => navigate('/')} style={backBtn}>
                <ChevronLeft size={24} /> กลับหน้าหลัก
            </button>

            <div style={headerSection}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={shieldIconBg}><ShieldAlert size={32} color="#e11d48" /></div>
                    <div>
                        <h1 style={pageTitle}>Admin Dashboard</h1>
                        <p style={pageSubtitle}>ระบบจัดการคำร้องเรียนและควบคุมความประพฤติ</p>
                    </div>
                </div>
            </div>

            <div style={contentCard}>
                <div style={cardHeader}>
                    <h3 style={{ margin: 0, color: '#333', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Search size={20} color="#666" /> รายการที่ถูกรายงาน (Reports)
                    </h3>
                    <span style={{ background: '#ffe4e6', color: '#e11d48', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' }}>
                        ทั้งหมด {reports.length} รายการ
                    </span>
                </div>

                <div style={{ overflowX: 'auto', minHeight: '350px' }}>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={tableHeadRow}>
                                <th style={thStyle}>เป้าหมาย</th>
                                <th style={thStyle}>เหตุผลที่รายงาน</th>
                                <th style={thStyle}>ผู้แจ้ง / วันที่</th>
                                <th style={thStyle}>สถานะ</th>
                                <th style={{ ...thStyle, textAlign: 'center', width: '80px' }}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                                        <CheckCircle size={40} color="#4caf50" style={{ marginBottom: '10px' }} /><br/>
                                        ไม่มีรายการแจ้งเตือน ระบบสงบสุขดีเยี่ยม! 🎉
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report.id} style={tableRowStyle}>
                                        <td style={tdStyle}>{renderTargetInfo(report)}</td>
                                        <td style={{ ...tdStyle, color: '#e11d48', fontWeight: '500' }}>{report.reason}</td>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 'bold', color: '#555' }}>👤 {report.reporter_name}</div>
                                            <div style={{ fontSize: '12px', color: '#999' }}>{new Date(report.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</div>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={report.status === 'pending' ? statusPending : statusResolved}>
                                                {report.status === 'pending' ? 'รอตรวจสอบ' : 'จัดการแล้ว'}
                                            </span>
                                        </td>
                                        
                                        {/* 🌟 4. เปลี่ยนปุ่มเดิมเป็นเมนูจุดสามจุดพร้อม Dropdown */}
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                                <button 
                                                    style={btnMoreInfo} 
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // หยุดไม่ให้ event ไปกระตุ้นตัวปิดเมนูด้านนอก
                                                        setOpenDropdownId(openDropdownId === report.id ? null : report.id);
                                                    }}
                                                >
                                                    <MoreVertical size={20} />
                                                </button>

                                                {openDropdownId === report.id && (
                                                    <div style={dropdownMenu}>
                                                        <div 
                                                            style={dropdownItemGray} 
                                                            onClick={(e) => {
                                                                e.stopPropagation(); 
                                                                handleDeleteReport(report.id);
                                                                alert('ลบเนื้อรายงาน / ยกเลิกคำร้อง');
                                                                setOpenDropdownId(null); }}
                                                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#fff'}
                                                        >
                                                            <Trash2 size={16} /> ลบเนื้อรายงาน
                                                        </div>
                                                        <div 
                                                            style={dropdownItemRed} 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                setSelectedReport(report); // จำไว้ว่ากดจาก Report แถวไหน
                                                                setActionModalOpen(true);  // เปิด Pop-up
                                                                setOpenDropdownId(null);   // ปิด Dropdown เดิม
                                                            }}
                                                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#fff1f0'}
                                                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#fff'}
                                                        >
                                                            <Ban size={16} /> ระงับผู้ใช้ / ลบเนื้อหา
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* 🌟 ส่วนของ Pop-up จัดการขั้นเด็ดขาด */}
            {actionModalOpen && selectedReport && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h2 style={{ marginTop: 0, color: '#333', fontSize: '22px', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
                            จัดการรายงาน
                        </h2>
                        
                        <div style={{ marginBottom: '20px', fontSize: '14px', color: '#555', background: '#f9f9f9', padding: '15px', borderRadius: '10px' }}>
                            <span style={{ fontWeight: 'bold' }}>เป้าหมาย:</span> {selectedReport.target_type === 'novel' ? '📖 นิยาย' : selectedReport.target_type === 'manga' ? '🎨 มังงะ' : '💬 คอมเมนต์ / ผู้ใช้'} (ID: {selectedReport.target_id}) <br/>
                            <span style={{ fontWeight: 'bold' }}>ผู้ใช้ที่ทำผิด:</span> {selectedReport.target_username || 'ไม่ทราบชื่อ'}
                        </div>

                        <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
                            {/* 🟡 ตัวเลือกที่ 1: ตักเตือน (ซ่อนเนื้อหา) */}
                            <div 
                                style={actionCardWarning} 
                                onClick={() => alert('เตรียมต่อ API: ซ่อนผลงานนี้ให้เป็นสถานะ "ร่าง"')}
                                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ background: '#fff', padding: '10px', borderRadius: '50%', display: 'flex', boxShadow: '0 2px 8px rgba(212, 107, 8, 0.2)' }}>
                                    <AlertTriangle size={28} color="#d46b08" />
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 5px 0', color: '#d46b08', fontSize: '16px' }}>ตักเตือน (ซ่อนเนื้อหา)</h4>
                                    <span style={{ fontSize: '13px', color: '#888' }}>ระงับการเผยแพร่ชั่วคราว เพื่อให้เจ้าของผลงานเข้าไปแก้ไข</span>
                                </div>
                            </div>

                            {/* 🔴 ตัวเลือกที่ 2: ลงโทษ (แบนบัญชี) */}
                            <div 
                                style={actionCardDanger} 
                                onClick={() => alert('เตรียมต่อ API: แบนผู้ใช้คนนี้ (is_banned = true)')}
                                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ background: '#fff', padding: '10px', borderRadius: '50%', display: 'flex', boxShadow: '0 2px 8px rgba(225, 29, 72, 0.2)' }}>
                                    <Ban size={28} color="#e11d48" />
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 5px 0', color: '#e11d48', fontSize: '16px' }}>ลงโทษขั้นเด็ดขาด (แบนบัญชี)</h4>
                                    <span style={{ fontSize: '13px', color: '#888' }}>ระงับการใช้งานบัญชีนี้ (User จะเข้าสู่ระบบไม่ได้อีก)</span>
                                </div>
                            </div>
                        </div>

                        <button style={closeBtnStyle} onClick={() => setActionModalOpen(false)}>ยกเลิก</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Styles ---
const pageContainer: React.CSSProperties = { maxWidth: '1200px', margin: '40px auto', padding: '0 30px', fontFamily: "'Kanit', 'Sarabun', sans-serif", minHeight: '80vh' };
const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '16px', padding: 0, marginBottom: '25px' };
const headerSection: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const shieldIconBg: React.CSSProperties = { width: '60px', height: '60px', backgroundColor: '#ffe4e6', borderRadius: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const pageTitle: React.CSSProperties = { margin: 0, color: '#e11d48', fontSize: '32px', fontWeight: 900 };
const pageSubtitle: React.CSSProperties = { margin: 0, color: '#666', fontSize: '15px' };

const contentCard: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0', overflow: 'hidden', paddingBottom: '30px' };
const cardHeader: React.CSSProperties = { padding: '25px 30px', borderBottom: '1px solid #eee', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const tableHeadRow: React.CSSProperties = { backgroundColor: '#fff', borderBottom: '2px solid #eee' };
const thStyle: React.CSSProperties = { padding: '15px 20px', color: '#888', fontWeight: 'bold', fontSize: '14px' };
const tableRowStyle: React.CSSProperties = { borderBottom: '1px solid #f5f5f5', transition: '0.2s' };
const tdStyle: React.CSSProperties = { padding: '20px', verticalAlign: 'top', fontSize: '15px' };

const statusPending: React.CSSProperties = { backgroundColor: '#fff7e6', color: '#d46b08', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #ffd591' };
const statusResolved: React.CSSProperties = { backgroundColor: '#f6ffed', color: '#389e0d', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #b7eb8f' };

// 🌟 5. Styles สำหรับปุ่มจุดสามจุดและ Dropdown Menu
const btnMoreInfo: React.CSSProperties = { background: 'transparent', border: 'none', cursor: 'pointer', color: '#888', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' };
const dropdownMenu: React.CSSProperties = { position: 'absolute', right: '100%', top: '0', marginRight: '10px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.15)', border: '1px solid #eee', overflow: 'hidden', zIndex: 50, width: '210px', textAlign: 'left' };
const dropdownItemGray: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', cursor: 'pointer', fontSize: '14px', color: '#555', transition: '0.2s', backgroundColor: '#fff' };
const dropdownItemRed: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', cursor: 'pointer', fontSize: '14px', color: '#e11d48', transition: '0.2s', backgroundColor: '#fff', borderTop: '1px solid #eee', fontWeight: 'bold' };

// 🌟 Styles สำหรับ Pop-up จัดการ
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)' };
const modalContent: React.CSSProperties = { backgroundColor: '#fff', width: '90%', maxWidth: '450px', borderRadius: '25px', padding: '35px', boxShadow: '0 15px 50px rgba(0,0,0,0.2)', border: '1px solid #eee' };
const actionCardWarning: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', backgroundColor: '#fff7e6', border: '1px solid #ffd591', borderRadius: '15px', cursor: 'pointer', transition: '0.2s' };
const actionCardDanger: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', backgroundColor: '#fff1f0', border: '1px solid #ffa39e', borderRadius: '15px', cursor: 'pointer', transition: '0.2s' };
const closeBtnStyle: React.CSSProperties = { width: '100%', padding: '14px', marginTop: '25px', backgroundColor: '#f5f5f5', color: '#666', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: '0.2s' };
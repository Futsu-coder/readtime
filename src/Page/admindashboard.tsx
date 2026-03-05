import React, { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ShieldAlert, Ban, Search, CheckCircle } from "lucide-react";
import { API_URL } from "../client";

interface Report {
    id: number;
    reporter_id: number;
    target_id: number;
    target_type: 'novel'|'manga'|'comment'|'user';
    reason: string;
    status: string;
    created_at: string;
    reporter_name: string;
    target_title?: string;
    novel_chapter_title?: string;
    manga_chapter_number?: number;
    comment_text?:string;
    target_username?:string;
}

export function Admindashboard(){
    const navigate = useNavigate();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

                // 🌟 แก้ไขตรงนี้: รับเป็นข้อความมาก่อน แล้วค่อยพยายามแปลงเป็น JSON
                const text = await response.text(); 
                try {
                    const data = JSON.parse(text); // ลองแปลงเป็น JSON
                    if (response.ok) {
                        setReports(data.reports || []);
                    } else {
                        setError(data.error || 'ดึงข้อมูลไม่สำเร็จ คุณอาจไม่มีสิทธิ์เข้าถึง');
                    }
                } catch (parseError) {
                    // ถ้าแปลง JSON ไม่ได้ (แสดงว่า Backend ตอบมาเป็น Text เช่น "Unauthorized")
                    setError(`เซิร์ฟเวอร์ปฏิเสธการเข้าถึง: ${text}`);
                }

            } catch (err) {
                setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [navigate]);

    const renderTargetInfo = (report: Report) => {
        if (report.target_type === 'novel' || report.target_type === 'manga'){
            return (
                <div>
                    <span style={{ fontWeight: 'bold', color: report.target_type === 'novel' ? '#9b67bd' : '#13c2c2' }}>
                        {report.target_type === 'novel' ? '📖 นิยาย' : '🎨 มังงะ'}
                    </span>
                    <br />
                    <span style={{ color: '#333', fontWeight: 'bold' }}>{report.target_title || `ID: ${report.target_id}`}</span>
                    {report.novel_chapter_title && <div style={{ fontSize: '13px', color: '#666' }}>ตอน: {report.novel_chapter_title}</div>}
                    {report.manga_chapter_number && <div style={{ fontSize: '13px', color: '#666' }}>ตอนที่: {report.manga_chapter_number}</div>}
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

                <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={tableHeadRow}>
                                <th style={thStyle}>เป้าหมาย</th>
                                <th style={thStyle}>เหตุผลที่รายงาน</th>
                                <th style={thStyle}>ผู้แจ้ง / วันที่</th>
                                <th style={thStyle}>สถานะ</th>
                                <th style={thStyle}>จัดการ</th>
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
                                        <td style={tdStyle}>
                                            <button style={btnBan} onClick={() => alert('ฟังก์ชันแบนและลบกำลังมา! รอเขียน API เชื่อมต่อนะครับ')}>
                                                <Ban size={16} /> ระงับผู้ใช้ / ลบเนื้อหา
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
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

const contentCard: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0', overflow: 'hidden' };
const cardHeader: React.CSSProperties = { padding: '25px 30px', borderBottom: '1px solid #eee', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const tableHeadRow: React.CSSProperties = { backgroundColor: '#fff', borderBottom: '2px solid #eee' };
const thStyle: React.CSSProperties = { padding: '15px 20px', color: '#888', fontWeight: 'bold', fontSize: '14px' };
const tableRowStyle: React.CSSProperties = { borderBottom: '1px solid #f5f5f5', transition: '0.2s' };
const tdStyle: React.CSSProperties = { padding: '20px', verticalAlign: 'top', fontSize: '15px' };

const statusPending: React.CSSProperties = { backgroundColor: '#fff7e6', color: '#d46b08', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #ffd591' };
const statusResolved: React.CSSProperties = { backgroundColor: '#f6ffed', color: '#389e0d', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #b7eb8f' };

const btnBan: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 15px', backgroundColor: '#fff1f0', color: '#e11d48', border: '1px solid #ffa39e', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: '0.2s' };


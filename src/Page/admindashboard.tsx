import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, ShieldAlert, Ban, Search, CheckCircle, MoreVertical, 
    Trash2, AlertTriangle, FileText, UserX, BookX, History, ListTree, UserCog, X 
} from 'lucide-react';
import { API_URL } from "../client";

// --- Interfaces ---
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
    target_owner_id?: number;
}

interface BannedUser {
    id: number;
    username: string;
    email: string;
    role: string;
    banned_until: string;
    ban_reason: string;
}

export function AdminDashboard() {
    const navigate = useNavigate();
    
    // 🌟 State ควบคุม Sidebar
    const [activeTab, setActiveTab] = useState('reports');

    // 🌟 State สำหรับหน้ารายงาน (Reports)
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    
    // 🌟 State สำหรับ Pop-up จัดการ Report
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [banFormOpen, setBanFormOpen] = useState(false);
    const [banDays, setBanDays] = useState('7');
    const [banReason, setBanReason] = useState('');

    // 🌟 State สำหรับหน้าแบนผู้ใช้ (Banned Users)
    const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
    const [loadingBanned, setLoadingBanned] = useState(false);
    
    // 🌟 State สำหรับ Pop-up สั่งแบน Manual
    const [manualBanModalOpen, setManualBanModalOpen] = useState(false);
    const [manualBanUsername, setManualBanUsername] = useState(''); // 👈 เปลี่ยนตรงนี้
    const [manualBanDays, setManualBanDays] = useState('7');
    const [manualBanReason, setManualBanReason] = useState('');

    // --- Effects ---
    // คลิกที่อื่นเพื่อปิด Dropdown
    useEffect(() => {
        const closeMenu = () => setOpenDropdownId(null);
        document.addEventListener("click", closeMenu);
        return () => document.removeEventListener("click", closeMenu);
    }, []);

    // ดึงข้อมูลหน้ารายงาน
    useEffect(() => {
        const fetchReports = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { navigate('/login'); return; }

                const response = await fetch(`${API_URL}/api/admin/reports`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });

                const text = await response.text(); 
                try {
                    const data = JSON.parse(text); 
                    if (response.ok) {
                        setReports(data.reports || []);
                    } else {
                        setError(data.error || 'ดึงข้อมูลไม่สำเร็จ');
                    }
                } catch (parseError) {
                    setError(`เซิร์ฟเวอร์ปฏิเสธการเข้าถึง: ${text}`);
                }
            } catch (err) {
                setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'reports') {
            fetchReports();
        }
    }, [navigate, activeTab]);

    // ดึงข้อมูลคนติดแบน
    const fetchBannedUsers = async () => {
        setLoadingBanned(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/banned-users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBannedUsers(data.banned_users || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingBanned(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'banned_users') {
            fetchBannedUsers();
        }
    }, [activeTab]);

    // --- Handlers: จัดการ Reports ---
    const handleDeleteReport = async (reportId: number) => {
        const confirmDelete = window.confirm("แน่ใจหรือไม่ว่าต้องการลบรายการแจ้งเตือนนี้ทิ้ง?");
        if (!confirmDelete) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/admin/reports/${reportId}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setReports(prev => prev.filter(r => r.id !== reportId));
                setOpenDropdownId(null);
            } else {
                const data = await response.json();
                alert(`ลบไม่สำเร็จ: ${data.error}`);
            }
        } catch (err) { alert('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'); }
    };

    const handleBanUserFromReport = async () => {
        if (!banReason.trim()) return alert("กรุณาระบุเหตุผลการแบนให้ชัดเจน");
        if (!selectedReport?.target_owner_id) return alert("ไม่พบข้อมูลผู้ใช้เป้าหมาย");
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/ban`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    target_user_id: selectedReport.target_owner_id,
                    ban_days: Number(banDays),
                    reason: banReason
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                setBanFormOpen(false); setActionModalOpen(false); setBanReason('');
            } else { alert(`แบนไม่สำเร็จ: ${data.error}`); }
        } catch (err) { alert('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'); }
    };

    // --- Handlers: จัดการคุก (Banned Users) ---
    const handleManualBan = async () => {
        if (!manualBanUsername.trim() || !manualBanReason.trim()) return alert("กรุณากรอกชื่อผู้ใช้และเหตุผลให้ครบ");
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/ban`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    target_username: manualBanUsername.trim(), // 👈 ส่งชื่อผู้ใช้ไปแทน (ใส่ .trim() กันคนเผลอเคาะสเปซบาร์)
                    ban_days: Number(manualBanDays),
                    reason: manualBanReason
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                setManualBanModalOpen(false);
                setManualBanUsername(''); // 👈 เคลียร์ค่า
                setManualBanReason('');
                fetchBannedUsers(); 
            } else {
                alert(`แบนไม่สำเร็จ: ${data.error}`);
            }
        } catch (err) { alert('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'); }
    };

    const handleUnban = async (userId: number) => {
        if (!window.confirm("ต้องการปลดแบนผู้ใช้นี้ก่อนกำหนดใช่หรือไม่?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/unban`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ target_user_id: userId })
            });
            if (res.ok) {
                alert('🕊️ ปลดแบนเรียบร้อยแล้ว');
                fetchBannedUsers(); 
            }
        } catch (err) { alert('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'); }
    };

    // --- Render Helpers ---
    const renderTargetInfo = (report: Report) => {
        if (report.target_type === 'novel' || report.target_type === 'manga') {
            return (
                <div>
                    <span style={{ fontWeight: 'bold', color: report.target_type === 'novel' ? '#9b67bd' : '#13c2c2' }}>
                        {report.target_type === 'novel' ? '📖 นิยาย' : '🎨 มังงะ'}
                    </span>
                    <br />
                    <span 
                        onClick={() => navigate(`/${report.target_type}/${report.target_id}`)}
                        style={{ color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                        title="คลิกเพื่อดูหน้าผลงาน"
                    >
                        {report.target_title || `ID: ${report.target_id}`}
                    </span>
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

    if (error) return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2 style={{ color: '#e11d48' }}>❌ เข้าถึงไม่ได้</h2>
            <p style={{ color: '#666' }}>{error}</p>
            <button onClick={() => navigate('/')} style={{ padding: '10px 20px', background: '#e11d48', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>กลับหน้าแรก</button>
        </div>
    );

    const SidebarItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => {
        const isActive = activeTab === id;
        return (
            <div 
                onClick={() => setActiveTab(id)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 25px',
                    cursor: 'pointer', transition: '0.2s',
                    backgroundColor: isActive ? '#f3e8ff' : 'transparent',
                    color: isActive ? '#9b67bd' : '#666',
                    borderRight: isActive ? '4px solid #9b67bd' : '4px solid transparent',
                    fontWeight: isActive ? 'bold' : 'normal'
                }}
                onMouseOver={e => !isActive && (e.currentTarget.style.backgroundColor = '#f9f9f9')}
                onMouseOut={e => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
                <Icon size={20} />
                <span style={{ fontSize: '15px' }}>{label}</span>
            </div>
        );
    };

    return (
        <div style={layoutWrapper}>
            {/* 🌟 Sidebar ติดหนึบ (Fixed) */}
            <div style={sidebarContainer}>
                <div style={{ padding: '20px 25px', borderBottom: '1px solid #eee', marginBottom: '15px' }}>
                    <h2 style={{ margin: 0, color: '#333', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldAlert size={20} color="#e11d48" /> เมนูผู้ดูแลระบบ
                    </h2>
                </div>

                <div style={menuGroupTitle}>จัดการงานเขียน</div>
                <SidebarItem id="reports" icon={FileText} label="รายงานงานเขียน" />
                <SidebarItem id="banned_users" icon={UserX} label="แบนผู้ใช้" />
                <SidebarItem id="banned_works" icon={BookX} label="แบนงานเขียน" />
                <SidebarItem id="history" icon={History} label="ประวัติรายงาน" />

                <div style={{ ...menuGroupTitle, marginTop: '20px' }}>แก้ไข/เพิ่ม หมวดหมู่</div>
                <SidebarItem id="categories" icon={ListTree} label="จัดการหมวดหมู่" />
                <div style={{ ...menuGroupTitle, marginTop: '20px' }}>จัดการสิทธิ์</div>

                <SidebarItem id="admins" icon={UserCog} label="จัดการสิทธิ์(Admin)" />

                <div style={{ flex: 1 }}></div>
                <div style={{ padding: '20px', borderTop: '1px solid #eee' }}>
                    <button onClick={() => navigate('/')} style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#fff', border: '1px solid #ddd', borderRadius: '10px', color: '#555', cursor: 'pointer', fontWeight: 'bold' }}>
                        <ChevronLeft size={18} /> ออกจากหลังบ้าน
                    </button>
                </div>
            </div>

            {/* 🌟 Main Content */}
            <div style={mainContent}>
                
                {/* 🔴 TAB 1: รายงานงานเขียน (Reports) */}
                {activeTab === 'reports' && (
                    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                        <div style={headerSection}>
                            <div>
                                <h1 style={pageTitle}>รายงานงานเขียน</h1>
                                <p style={pageSubtitle}>จัดการคำร้องเรียนจากผู้ใช้งาน</p>
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '50px', color: '#9b67bd' }}>⏳ กำลังโหลดข้อมูล...</div>
                        ) : (
                            <div style={contentCard}>
                                <div style={cardHeader}>
                                    <h3 style={{ margin: 0, color: '#333', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        ทั้งหมด ({reports.length}) เรื่อง
                                    </h3>
                                </div>

                                <div style={{ overflowX: 'auto', minHeight: '350px' }}>
                                    <table style={tableStyle}>
                                        <thead>
                                            <tr style={tableHeadRow}>
                                                <th style={thStyle}>เป้าหมาย / เจ้าของผลงาน</th>
                                                <th style={thStyle}>เหตุผลที่รายงาน</th>
                                                <th style={thStyle}>ผู้แจ้ง / วันที่</th>
                                                <th style={thStyle}>สถานะ</th>
                                                <th style={{ ...thStyle, textAlign: 'center', width: '80px' }}>จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reports.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} style={{ padding: '50px', textAlign: 'center', color: '#888' }}>
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
                                                        
                                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                                                <button 
                                                                    style={btnMoreInfo} 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation(); 
                                                                        setOpenDropdownId(openDropdownId === report.id ? null : report.id);
                                                                    }}
                                                                >
                                                                    <MoreVertical size={20} />
                                                                </button>

                                                                {openDropdownId === report.id && (
                                                                    <div style={dropdownMenu}>
                                                                        <div 
                                                                            style={dropdownItemGray} 
                                                                            onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                                                                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                                                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#fff'}
                                                                        >
                                                                            <Trash2 size={16} /> ลบเนื้อรายงาน
                                                                        </div>
                                                                        <div 
                                                                            style={dropdownItemRed} 
                                                                            onClick={(e) => { 
                                                                                e.stopPropagation(); 
                                                                                setSelectedReport(report);
                                                                                setActionModalOpen(true);
                                                                                setOpenDropdownId(null);
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
                        )}
                    </div>
                )}

                {/* 🔴 TAB 2: จัดการแบนผู้ใช้ (Banned Users) */}
                {activeTab === 'banned_users' && (
                    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                        <div style={headerSection}>
                            <div>
                                <h1 style={pageTitle}>จัดการแบนผู้ใช้</h1>
                                <p style={pageSubtitle}>รายชื่อผู้กระทำผิดที่ถูกระงับการใช้งาน</p>
                            </div>
                            <button 
                                onClick={() => setManualBanModalOpen(true)}
                                style={{ padding: '12px 25px', background: '#e11d48', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(225, 29, 72, 0.3)' }}
                            >
                                <Ban size={18} /> สั่งแบนผู้ใช้เพิ่ม
                            </button>
                        </div>

                        {loadingBanned ? (
                            <div style={{ textAlign: 'center', padding: '50px', color: '#e11d48' }}>⏳ กำลังโหลดข้อมูลนักโทษ...</div>
                        ) : (
                            <div style={contentCard}>
                                <div style={cardHeader}>
                                    <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>กำลังติดแบนทั้งหมด ({bannedUsers.length}) บัญชี</h3>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={tableStyle}>
                                        <thead>
                                            <tr style={tableHeadRow}>
                                                <th style={thStyle}>ID / ผู้ใช้</th>
                                                <th style={thStyle}>บทบาท</th>
                                                <th style={thStyle}>เหตุผลที่โดนแบน</th>
                                                <th style={thStyle}>เวลาพ้นโทษ</th>
                                                <th style={{ ...thStyle, textAlign: 'center' }}>จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bannedUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                                                        ไม่มีผู้ใช้ที่ติดแบนในขณะนี้
                                                    </td>
                                                </tr>
                                            ) : (
                                                bannedUsers.map(user => (
                                                    <tr key={user.id} style={tableRowStyle}>
                                                        <td style={tdStyle}>
                                                            <div style={{ fontWeight: 'bold', color: '#333' }}>{user.username}</div>
                                                            <div style={{ fontSize: '12px', color: '#888' }}>ID: {user.id}</div>
                                                        </td>
                                                        <td style={tdStyle}>
                                                            <span style={{ padding: '4px 10px', background: '#eee', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>{user.role}</span>
                                                        </td>
                                                        <td style={{ ...tdStyle, color: '#e11d48' }}>{user.ban_reason}</td>
                                                        <td style={tdStyle}>
                                                            <div style={{ fontWeight: 'bold', color: '#d46b08' }}>
                                                                {new Date(user.banned_until).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                                                            </div>
                                                        </td>
                                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                            <button 
                                                                onClick={() => handleUnban(user.id)}
                                                                style={{ padding: '6px 12px', background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                                                            >
                                                                ปลดแบน
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 🔴 TAB อื่นๆ (กำลังพัฒนา) */}
                {activeTab !== 'reports' && activeTab !== 'banned_users' && (
                    <div style={{ textAlign: 'center', padding: '100px 20px', color: '#888' }}>
                        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🚧</div>
                        <h2 style={{ color: '#555' }}>กำลังพัฒนาระบบส่วนนี้...</h2>
                        <p>เมนู "{activeTab}" จะพร้อมใช้งานในอัปเดตถัดไปครับ!</p>
                    </div>
                )}
            </div>

            {/* 🌟 ---------------- POP-UPS ---------------- 🌟 */}

            {/* 1. Pop-up จัดการ Report (ซ่อน/แบน) */}
            {actionModalOpen && selectedReport && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        {/* 🌟 เพิ่ม Header แบบมีปุ่มปิด (X) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                            <h2 style={{ margin: 0, color: '#333', fontSize: '22px' }}>
                                {banFormOpen ? '🔨 กำหนดบทลงโทษ (แบนบัญชี)' : 'จัดการรายงาน'}
                            </h2>
                            <button onClick={() => { setActionModalOpen(false); setBanFormOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0, display: 'flex' }}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div style={{ marginBottom: '20px', fontSize: '14px', color: '#555', background: '#f9f9f9', padding: '15px', borderRadius: '10px' }}>
                            <span style={{ fontWeight: 'bold' }}>เป้าหมาย:</span> {selectedReport.target_type === 'novel' ? '📖 นิยาย' : selectedReport.target_type === 'manga' ? '🎨 มังงะ' : '💬 คอมเมนต์ / ผู้ใช้'} (ID: {selectedReport.target_id}) <br/>
                            <span style={{ fontWeight: 'bold' }}>เจ้าของผลงาน/ผู้กระทำผิด:</span> {selectedReport.target_owner_name || 'ไม่ทราบชื่อ'} (ID: {selectedReport.target_owner_id})
                        </div>

                        {banFormOpen ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>ระยะเวลาการแบน:</label>
                                    <select value={banDays} onChange={e => setBanDays(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc' }}>
                                        <option value="3">3 วัน (ตักเตือนรุนแรง)</option>
                                        <option value="7">7 วัน (แบนมาตรฐาน)</option>
                                        <option value="30">30 วัน (แบน 1 เดือน)</option>
                                        <option value="365">365 วัน (แบน 1 ปี)</option>
                                        <option value="36500">แบนถาวร</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>เหตุผล (ให้ผู้ใช้เห็นตอนถูกเตะ):</label>
                                    <input type="text" value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="เช่น ละเมิดกฎกติกา..." style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                                </div>
                                
                                {/* 🌟 ปรับปรุงปุ่มด้านล่างให้มีทั้ง ย้อนกลับ และ ยกเลิก */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <button style={{ padding: '12px 15px', background: '#eee', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', color: '#555' }} onClick={() => setBanFormOpen(false)}>ย้อนกลับ</button>
                                    <button style={{ flex: 1, padding: '12px', background: '#ffe4e6', color: '#e11d48', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setBanFormOpen(false); setActionModalOpen(false); }}>ยกเลิก</button>
                                    <button style={{ flex: 2, padding: '12px', background: '#e11d48', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }} onClick={handleBanUserFromReport}>ยืนยันการลงดาบ</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
                                <div style={actionCardWarning} onClick={() => alert('จะทำในเควสที่ 5: ซ่อนผลงานนี้ให้เป็นสถานะ "ร่าง"')} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                                    <div style={{ background: '#fff', padding: '10px', borderRadius: '50%', display: 'flex', boxShadow: '0 2px 8px rgba(212, 107, 8, 0.2)' }}>
                                        <AlertTriangle size={28} color="#d46b08" />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: '0 0 5px 0', color: '#d46b08', fontSize: '16px' }}>ตักเตือน (ซ่อนเนื้อหา)</h4>
                                        <span style={{ fontSize: '13px', color: '#888' }}>ระงับการเผยแพร่ชั่วคราว เพื่อให้เจ้าของผลงานเข้าไปแก้ไข</span>
                                    </div>
                                </div>
                                <div style={actionCardDanger} onClick={() => setBanFormOpen(true)} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                                    <div style={{ background: '#fff', padding: '10px', borderRadius: '50%', display: 'flex', boxShadow: '0 2px 8px rgba(225, 29, 72, 0.2)' }}>
                                        <Ban size={28} color="#e11d48" />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: '0 0 5px 0', color: '#e11d48', fontSize: '16px' }}>ลงโทษขั้นเด็ดขาด (แบนบัญชี)</h4>
                                        <span style={{ fontSize: '13px', color: '#888' }}>ระงับการใช้งานบัญชีนี้ (User จะเข้าสู่ระบบไม่ได้อีก)</span>
                                    </div>
                                </div>
                                <button style={closeBtnStyle} onClick={() => { setActionModalOpen(false); setBanFormOpen(false); }}>ยกเลิก</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 2. Pop-up สั่งแบน Manual (เพิ่มเองจากหน้า Banned Users) */}
            {manualBanModalOpen && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        {/* 🌟 เพิ่ม Header แบบมีปุ่มปิด (X) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                            <h2 style={{ margin: 0, color: '#e11d48', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Ban size={24} /> สั่งแบนบัญชีผู้ใช้
                            </h2>
                            <button onClick={() => setManualBanModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0, display: 'flex' }}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>ระบุ ID ผู้ใช้เป้าหมาย:</label>
                                <input type="number" value={manualBanUsername} onChange={e => setManualBanUsername(e.target.value)} placeholder="เช่น 5" style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>ระยะเวลาการแบน:</label>
                                <select value={manualBanDays} onChange={e => setManualBanDays(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc' }}>
                                    <option value="3">3 วัน (ตักเตือนรุนแรง)</option>
                                    <option value="7">7 วัน (แบนมาตรฐาน)</option>
                                    <option value="30">30 วัน (แบน 1 เดือน)</option>
                                    <option value="365">365 วัน (แบน 1 ปี)</option>
                                    <option value="36500">แบนถาวร</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>เหตุผล (ให้ผู้ใช้เห็นตอนถูกเตะ):</label>
                                <input type="text" value={manualBanReason} onChange={e => setManualBanReason(e.target.value)} placeholder="เช่น ก่อกวนผู้อื่น..." style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button style={{ flex: 1, padding: '12px', background: '#eee', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', color: '#555' }} onClick={() => setManualBanModalOpen(false)}>ยกเลิก</button>
                                <button style={{ flex: 1, padding: '12px', background: '#e11d48', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }} onClick={handleManualBan}>ยืนยันการลงดาบ</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Pop-up สั่งแบน Manual (เพิ่มเองจากหน้า Banned Users) */}
            {manualBanModalOpen && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h2 style={{ marginTop: 0, color: '#e11d48', fontSize: '22px', borderBottom: '2px solid #eee', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Ban size={24} /> สั่งแบนบัญชีผู้ใช้
                        </h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                            <div>
                                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>ระบุชื่อผู้ใช้เป้าหมาย (Username):</label>
                                <input 
                                    type="text" // 👈 เปลี่ยนเป็น text
                                    value={manualBanUsername} // 👈 ใช้ตัวแปรใหม่
                                    onChange={e => setManualBanUsername(e.target.value)} 
                                    placeholder="เช่น somchai123" 
                                    style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
                                />
                            </div>
                            <div>
                                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>ระยะเวลาการแบน:</label>
                                <select value={manualBanDays} onChange={e => setManualBanDays(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc' }}>
                                    <option value="3">3 วัน (ตักเตือนรุนแรง)</option>
                                    <option value="7">7 วัน (แบนมาตรฐาน)</option>
                                    <option value="30">30 วัน (แบน 1 เดือน)</option>
                                    <option value="365">365 วัน (แบน 1 ปี)</option>
                                    <option value="36500">แบนถาวร</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>เหตุผล (ให้ผู้ใช้เห็นตอนถูกเตะ):</label>
                                <input 
                                    type="text" 
                                    value={manualBanReason} 
                                    onChange={e => setManualBanReason(e.target.value)} 
                                    placeholder="เช่น ก่อกวนผู้อื่น..." 
                                    style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button style={{ flex: 1, padding: '12px', background: '#eee', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setManualBanModalOpen(false)}>ยกเลิก</button>
                                <button style={{ flex: 1, padding: '12px', background: '#e11d48', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }} onClick={handleManualBan}>ยืนยันการลงดาบ</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Styles รองรับ Layout แบบ Sidebar ติดหนึบ ---
const layoutWrapper: React.CSSProperties = { 
    display: 'flex', 
    minHeight: 'calc(100vh - 75px)', // เผื่อความสูงให้ Navbar ด้านบน
    backgroundColor: '#f9f9f9', 
    fontFamily: "'Kanit', 'Sarabun', sans-serif",
    alignItems: 'flex-start' // 🌟 สำคัญ: ป้องกันไม่ให้ Sidebar โดนยืดตามเนื้อหา
};

const sidebarContainer: React.CSSProperties = { 
    width: '260px', 
    backgroundColor: '#fff', 
    borderRight: '1px solid #eee', 
    display: 'flex', 
    flexDirection: 'column', 
    flexShrink: 0, 
    boxShadow: '2px 0 10px rgba(0,0,0,0.02)',
    // 🌟 4 บรรทัดล่างนี้คือเวทมนตร์ที่ทำให้มันติดหนึบ!
    position: 'sticky', 
    top: '75px', // ระยะที่เว้นไว้ให้ Navbar ด้านบน (ปรับตัวเลขได้ถ้ามันทับกัน)
    height: 'calc(100vh - 75px)', // ล็อกความสูงให้พอดีจอ
    overflowY: 'auto' // เผื่ออนาคตเมนูยาวเกินจอ จะได้เลื่อนเฉพาะแถบเมนูได้
};

const menuGroupTitle: React.CSSProperties = { padding: '10px 25px', fontSize: '13px', fontWeight: 'bold', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' };
const mainContent: React.CSSProperties = { flex: 1, padding: '40px', overflowY: 'auto' };

const headerSection: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' };
const pageTitle: React.CSSProperties = { margin: 0, color: '#333', fontSize: '28px', fontWeight: 900 };
const pageSubtitle: React.CSSProperties = { margin: '5px 0 0 0', color: '#666', fontSize: '15px' };

const contentCard: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 5px 20px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0', overflow: 'hidden' };
const cardHeader: React.CSSProperties = { padding: '20px 30px', borderBottom: '1px solid #eee', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const tableHeadRow: React.CSSProperties = { backgroundColor: '#fdfdfd', borderBottom: '2px solid #eee' };
const thStyle: React.CSSProperties = { padding: '15px 25px', color: '#888', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' };
const tableRowStyle: React.CSSProperties = { borderBottom: '1px solid #f5f5f5', transition: '0.2s' };
const tdStyle: React.CSSProperties = { padding: '20px 25px', verticalAlign: 'top', fontSize: '15px' };

const statusPending: React.CSSProperties = { backgroundColor: '#fff7e6', color: '#d46b08', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #ffd591' };
const statusResolved: React.CSSProperties = { backgroundColor: '#f6ffed', color: '#389e0d', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #b7eb8f' };

const btnMoreInfo: React.CSSProperties = { background: 'transparent', border: 'none', cursor: 'pointer', color: '#888', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' };
const dropdownMenu: React.CSSProperties = { position: 'absolute', right: '100%', top: '0', marginRight: '10px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.15)', border: '1px solid #eee', overflow: 'hidden', zIndex: 50, width: '210px', textAlign: 'left' };
const dropdownItemGray: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', cursor: 'pointer', fontSize: '14px', color: '#555', transition: '0.2s', backgroundColor: '#fff' };
const dropdownItemRed: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', cursor: 'pointer', fontSize: '14px', color: '#e11d48', transition: '0.2s', backgroundColor: '#fff', borderTop: '1px solid #eee', fontWeight: 'bold' };

const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)' };
const modalContent: React.CSSProperties = { backgroundColor: '#fff', width: '90%', maxWidth: '450px', borderRadius: '25px', padding: '35px', boxShadow: '0 15px 50px rgba(0,0,0,0.2)', border: '1px solid #eee' };
const actionCardWarning: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', backgroundColor: '#fff7e6', border: '1px solid #ffd591', borderRadius: '15px', cursor: 'pointer', transition: '0.2s' };
const actionCardDanger: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', backgroundColor: '#fff1f0', border: '1px solid #ffa39e', borderRadius: '15px', cursor: 'pointer', transition: '0.2s' };
const closeBtnStyle: React.CSSProperties = { width: '100%', padding: '14px', marginTop: '25px', backgroundColor: '#f5f5f5', color: '#666', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: '0.2s' };
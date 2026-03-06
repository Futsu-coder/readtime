import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// 🌟 1. นำเข้าไอคอน Shield มาใช้สำหรับปุ่มแอดมิน
import { Search, Bell, Pencil, User, BookOpen, Settings, LogOut, Bookmark, Shield } from 'lucide-react';
import { client, API_URL } from "../client"; 

interface SearchResult {
    id: number;
    title: string;
    type: 'novel' | 'manga';
    cover_image?: string;
}

export function Navbar() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    // 🌟 2. เพิ่ม State สำหรับเก็บสถานะว่าเป็น Admin ไหม
    const [isAdmin, setIsAdmin] = useState(false); 

    const [showProfile, setShowProfile] = useState(false);
    const [showNoti, setShowNoti] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notiRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // 🌟 3. เพิ่ม useEffect เพื่อแกะ Token ดูสิทธิ์ (Role) ตอนเปิดเว็บ
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // แกะข้อมูลที่ซ่อนอยู่ใน Token (Payload)
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log("แกะกล่อง Token ดูหน่อย:", payload);
                // ถ้า Role เป็น admin หรือ super_admin ให้เปิดโหมดแอดมิน!
                if (payload.role === 'admin' || payload.role === 'super_admin') {
                    setIsAdmin(true);
                }
            } catch (e) {
                console.error("Token parse error", e);
            }
        }
    }, [isLoggedIn]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.trim().length > 1) {
                setIsSearching(true);
                try {
                    const [novelsRes, mangasRes] = await Promise.all([
                        client.api.public.novels.$get(),
                        client.api.public.mangas.$get()
                    ]);

                    let results: SearchResult[] = [];
                    if (novelsRes.ok) {
                        const data = await novelsRes.json() as any;
                        results = [...results, ...(data.novels || []).map((n: any) => ({ ...n, type: 'novel' }))];
                    }
                    if (mangasRes.ok) {
                        const data = await mangasRes.json() as any;
                        results = [...results, ...(data.mangas || []).map((m: any) => ({ ...m, type: 'manga' }))];
                    }

                    const filtered = results.filter(item => 
                        item.title.toLowerCase().includes(searchTerm.toLowerCase())
                    ).slice(0, 5);

                    setSearchResults(filtered);
                    setShowSearchDropdown(true);
                } catch (err) {
                    console.error("Search Error:", err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowSearchDropdown(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowProfile(false);
            }
            if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
                setShowNoti(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNavigate = (path: string) => {
        navigate(path);
        setShowProfile(false);
        setShowNoti(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setIsAdmin(false); // เคลียร์สิทธิ์แอดมินตอนล็อกเอาต์ด้วย
        setShowProfile(false);
        window.location.reload();
        navigate('/');
    };

    return (
        <nav style={navbarStyle}>
            <div style={navInner}>
                
                <div style={navLeftSide}>
                    <div style={logoContainer} onClick={() => handleNavigate('/')}>
                        <div style={homeGroup}>
                        </div>
                        <h1 style={logoStyle}>READTIME</h1>
                    </div>
                </div>
                <div style={searchContainer} ref={searchRef}>
                    <Search size={18} style={searchIconInside} />
                    <input 
                        type="text" 
                        placeholder="ค้นหานิยาย การ์ตูน..." 
                        style={searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => { if(searchTerm.length > 1) setShowSearchDropdown(true); }}
                    />
                    {isSearching && <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: '#aaa' }}>⏳</span>}

                    {showSearchDropdown && (
                        <div style={searchResultDropdown}>
                            {searchResults.length > 0 ? (
                                searchResults.map((result) => (
                                    <div 
                                        key={`${result.type}-${result.id}`} 
                                        onClick={() => { 
                                            handleNavigate(`/${result.type === 'novel' ? 'novels' : 'mangas'}/${result.id}`);
                                            setSearchTerm('');
                                            setShowSearchDropdown(false);
                                        }}
                                        style={searchResultItem}
                                        onMouseOver={e => e.currentTarget.style.background = '#f9f9f9'}
                                        onMouseOut={e => e.currentTarget.style.background = 'white'}
                                    >
                                        <img 
                                            src={result.cover_image ? `${API_URL}${result.cover_image}` : 'https://via.placeholder.com/40x55'} 
                                            alt={result.title} 
                                            style={searchResultImg}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#333', fontSize: '0.95rem' }}>{result.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: result.type === 'novel' ? '#9b67bd' : '#ff7b00' }}>
                                                {result.type === 'novel' ? '📖 นิยาย' : '🎨 การ์ตูน'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                !isSearching && searchTerm.length > 1 && (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>ไม่พบผลงานที่ค้นหา... 😅</div>
                                )
                            )}
                        </div>
                    )}
                </div>
                
                <div style={navRightSide}>
                    {isLoggedIn ? (
                        <>
                            {/* 🌟 4. ปุ่มเข้าห้องลับแอดมิน (โชว์เฉพาะคนที่มีสิทธิ์) */}
                            {isAdmin && (
                                <div style={iconBadge} onClick={() => handleNavigate('/admin')} title="Admin Dashboard">
                                    <Shield size={22} strokeWidth={1.5} color="#e11d48" />
                                </div>
                            )}

                            <div style={{ position: 'relative' }} ref={notiRef}>
                                <div style={iconBadge} onClick={() => { setShowNoti(!showNoti); setShowProfile(false); }}>
                                    <Bell size={22} strokeWidth={1.5} color="#333" />
                                    <div style={redDot}></div>
                                </div>
                                {showNoti && (
                                    <div style={notiDropdown}>
                                        <div style={dropdownHeader}>การแจ้งเตือน</div>
                                        <div style={notiItem}>
                                            <div style={notiCircle}></div>
                                            <div style={notiTextGroup}>
                                                <p style={notiMainText}><b>ระบบ</b> ยินดีต้อนรับสู่ READTIME!</p>
                                                <p style={notiSubText}>เพิ่งจะ</p>
                                            </div>
                                        </div>
                                        <div style={dropdownFooter} onClick={() => setShowNoti(false)}>ดูทั้งหมด</div>
                                    </div>
                                )}
                            </div>                           
                            <div style={iconBadge} onClick={() => handleNavigate('/dashborad')} title="จัดการงานเขียน">
                                <Pencil size={22} strokeWidth={1.5} color="#333" />
                            </div>                            
                            <div style={{ position: 'relative' }} ref={dropdownRef}>
                                <div style={avatarWrapper} onClick={() => { setShowProfile(!showProfile); setShowNoti(false); }}>
                                    <User size={20} color="#fff" />
                                </div>
                                {showProfile && (
                                    <div style={profileDropdown}>
                                        <div style={profileHeader}>
                                            <div style={profileImgCircle}><User size={18} color="#fff" /></div>
                                            <span style={profileNameText}>นักอ่าน</span>
                                        </div>
                                        <div style={divider}></div>                                        
                                        <div style={menuItem} onClick={() => handleNavigate('/dashborad')}>
                                            <Pencil size={18} color="#666" /> จัดการงานเขียน
                                        </div>
                                        <div style={menuItem} onClick={() => handleNavigate('/my-bookmarks')}>
                                            <Bookmark size={18} color="#666" /> ชั้นหนังสือของฉัน
                                        </div>
                                        <div style={menuItem} onClick={() => handleNavigate('/history')}>
                                            <BookOpen size={18} color="#666" /> ประวัติการอ่าน
                                        </div>
                                        <div style={menuItem} onClick={() => handleNavigate('/profile')}>
                                            <Settings size={18} color="#666" /> ตั้งค่าโปรไฟล์
                                        </div>                                        
                                        <div style={divider}></div>
                                        <div style={logoutBtn} onClick={handleLogout}>
                                            <LogOut size={18} /> ออกจากระบบ
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => handleNavigate('/login')} style={loginBtn}>เข้าสู่ระบบ</button>
                            <button onClick={() => handleNavigate('/register')} style={registerBtn}>สมัครสมาชิก</button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

// ... (Styles ด้านล่างคงเดิมทั้งหมดครับ ไม่ได้แก้เลย) ...
const navbarStyle: React.CSSProperties = { padding: '12px 0', borderBottom: '1px solid #f3f3f3', backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 1000, fontFamily: "'Kanit', sans-serif" };
const navInner: React.CSSProperties = { maxWidth: '100%', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 50px' };
const navLeftSide: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '40px', flexShrink: 0 };
const logoContainer: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' };
const homeGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' };
const logoStyle: React.CSSProperties = { color: '#9b67bd', fontSize: '32px', fontWeight: 900, letterSpacing: '-1px', margin: 0, fontFamily: 'Arial Black, sans-serif' };

const searchContainer: React.CSSProperties = { position: 'relative', flex: 1, maxWidth: '600px', marginRight: '40px', marginLeft: '40px' };
const searchIconInside: React.CSSProperties = { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' };
const searchInput: React.CSSProperties = { width: '100%', padding: '12px 45px', borderRadius: '25px', border: 'none', backgroundColor: '#f5f5f5', fontSize: '15px', outline: 'none', transition: '0.2s' };
const searchResultDropdown: React.CSSProperties = { position: 'absolute', top: '55px', left: 0, right: 0, background: 'white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #eee', overflow: 'hidden', zIndex: 1001 };
const searchResultItem: React.CSSProperties = { padding: '12px 15px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #f5f5f5', transition: '0.2s', cursor: 'pointer' };
const searchResultImg: React.CSSProperties = { width: '40px', height: '55px', objectFit: 'cover', borderRadius: '4px' };

const navRightSide: React.CSSProperties = { display: 'flex', gap: '15px', alignItems: 'center', flexShrink: 0 };
const iconBadge: React.CSSProperties = { position: 'relative', cursor: 'pointer', padding: '8px', transition: '0.2s', borderRadius: '50%' };
const redDot: React.CSSProperties = { position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', backgroundColor: '#ff4d4f', borderRadius: '50%', border: '2px solid white' };
const avatarWrapper: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#9b67bd', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(155, 103, 189, 0.3)' };

const notiDropdown: React.CSSProperties = { position: 'absolute', top: '55px', right: '-10px', width: '280px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 2000, overflow: 'hidden', border: '1px solid #f0f0f0' };
const dropdownHeader: React.CSSProperties = { padding: '12px 15px', fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid #f5f5f5', color: '#333' };
const notiItem: React.CSSProperties = { display: 'flex', padding: '12px 15px', gap: '12px', cursor: 'pointer', borderBottom: '1px solid #fafafa' };
const notiCircle: React.CSSProperties = { width: '8px', height: '8px', backgroundColor: '#9b67bd', borderRadius: '50%', marginTop: '6px', flexShrink: 0 };
const notiTextGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2px' };
const notiMainText: React.CSSProperties = { margin: 0, fontSize: '13px', color: '#444', lineHeight: '1.4' };
const notiSubText: React.CSSProperties = { margin: 0, fontSize: '11px', color: '#aaa' };
const dropdownFooter: React.CSSProperties = { padding: '10px', textAlign: 'center', fontSize: '12px', color: '#9b67bd', cursor: 'pointer', fontWeight: '500' };

const profileDropdown: React.CSSProperties = { position: 'absolute', top: '55px', right: '0', width: '230px', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 2000, overflow: 'hidden', border: '1px solid #f0f0f0' };
const profileHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '15px', gap: '12px', backgroundColor: '#fafafa' };
const profileImgCircle: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#9b67bd', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const profileNameText: React.CSSProperties = { fontSize: '16px', color: '#333', fontWeight: 'bold' };
const divider: React.CSSProperties = { height: '1px', backgroundColor: '#f0f0f0' };
const menuItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', color: '#444', cursor: 'pointer', fontSize: '14px', transition: '0.2s' };
const logoutBtn: React.CSSProperties = { padding: '15px', textAlign: 'center', color: '#ff4d4f', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: '0.2s' };

const loginBtn: React.CSSProperties = { padding: '10px 20px', backgroundColor: 'transparent', color: '#555', border: '1px solid #ddd', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };
const registerBtn: React.CSSProperties = { padding: '10px 20px', backgroundColor: '#9b67bd', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 10px rgba(155, 103, 189, 0.3)' };
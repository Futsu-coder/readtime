import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Pencil, User, BookOpen, Settings, LogOut, Bookmark, Shield } from 'lucide-react';
import { client, API_URL } from "../client"; 

interface SearchResult {
    id: number;
    title: string;
    type: 'novel' | 'manga';
    cover_image?: string;
}

// 🌟 สร้าง Interface มารับข้อมูล User
interface UserProfile {
    username: string;
    author: string | null;
    avatar_url: string | null;
}

export function Navbar() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [isAdmin, setIsAdmin] = useState(false); 

    // 🌟 State เก็บข้อมูลโปรไฟล์ผู้ใช้
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    const [showProfile, setShowProfile] = useState(false);
    const [showNoti, setShowNoti] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notiRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // 🌟 ดึงข้อมูล User & เช็ค Token ตอนโหลดหน้า
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // แกะ Token เช็คสิทธิ์
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.role === 'admin' || payload.role === 'super_admin') {
                    setIsAdmin(true);
                }

                // 🌟 ยิง API ไปดึงข้อมูลโปรไฟล์ (รูป & นามปากกา)
                fetch(`${API_URL}/api/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        setUserProfile({
                            username: data.user.username,
                            author: data.user.author,
                            avatar_url: data.user.avatar_url
                        });
                    }
                })
                .catch(err => console.error("ไม่สามารถดึงข้อมูลโปรไฟล์มาโชว์ Navbar ได้:", err));

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
        setIsAdmin(false); 
        setUserProfile(null); // เคลียร์ Profile ด้วย
        setShowProfile(false);
        window.location.reload();
        navigate('/');
    };

    // 🌟 ฟังก์ชันหา Source ของรูปที่จะแสดงบน Navbar
    const getNavAvatarUrl = () => {
        if (userProfile?.avatar_url) return `${API_URL}${userProfile.avatar_url}`;
        if (userProfile?.username) return `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile.username}`;
        return null;
    };

    // 🌟 ฟังก์ชันหาชื่อที่จะแสดง (ถ้านามปากกาไม่มี ให้ใช้ Username)
    const getDisplayName = () => {
        if (!userProfile) return "กำลังโหลด...";
        return userProfile.author || userProfile.username;
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
                                            handleNavigate(`/${result.type === 'novel' ? 'novel' : 'manga'}/${result.id}`);
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
                                
                                {/* 🌟 ตรงนี้คือปุ่มกลมๆ มุมขวาบน (เปลี่ยนให้โชว์รูปแทนตัวการ์ตูนขาวดำ) */}
                                <div style={avatarWrapper} onClick={() => { setShowProfile(!showProfile); setShowNoti(false); }}>
                                    {getNavAvatarUrl() ? (
                                        <img src={getNavAvatarUrl()!} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                    ) : (
                                        <User size={20} color="#fff" />
                                    )}
                                </div>
                                
                                {showProfile && (
                                    <div style={profileDropdown}>
                                        <div style={profileHeader}>
                                            {/* 🌟 รูป และ ชื่อ ในกล่อง Dropdown */}
                                            <div style={profileImgCircle}>
                                                 {getNavAvatarUrl() ? (
                                                    <img src={getNavAvatarUrl()!} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                ) : (
                                                    <User size={18} color="#fff" />
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={profileNameText}>{getDisplayName()}</span>
                                                {/* ถ้ามีนามปากกา โชว์ username เล็กๆ ไว้ข้างใต้ด้วย */}
                                                {userProfile?.author && <span style={{ fontSize: '12px', color: '#999' }}>@{userProfile.username}</span>}
                                            </div>
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
                                        <div style={{...menuItem, color: '#ff4d4f', fontWeight: 'bold'}} onClick={handleLogout}>
                                            <LogOut size={18} color="#ff4d4f" /> ออกจากระบบ
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

// ... Styles เดิม ...
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
const profileHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '15px', gap: '15px', backgroundColor: '#fafafa' };
const profileImgCircle: React.CSSProperties = { width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#9b67bd', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const profileNameText: React.CSSProperties = { fontSize: '16px', color: '#333', fontWeight: 'bold' };
const divider: React.CSSProperties = { height: '1px', backgroundColor: '#f0f0f0' };
const menuItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', color: '#444', cursor: 'pointer', fontSize: '14px', transition: '0.2s' };

const loginBtn: React.CSSProperties = { padding: '10px 20px', backgroundColor: 'transparent', color: '#555', border: '1px solid #ddd', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };
const registerBtn: React.CSSProperties = { padding: '10px 20px', backgroundColor: '#9b67bd', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 10px rgba(155, 103, 189, 0.3)' };
import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "../client"; 
import { NovelCard } from "../components/novelcard"; 

// 🌟 ตัวแปรระยะเวลาในการวนลูป (มิลลิวินาที)
const LOOP_DURATION = 300; 

export function HomePage() {
    const [works, setWorks] = useState<any[]>([]); 
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<'all' | 'novel' | 'manga'>('all');
    const [activeGenre, setActiveGenre] = useState<string>('All');
    
    const [genres, setGenres] = useState<string[]>(['All']);
    const [banners, setBanners] = useState<any[]>([]); 
    
    // 🌟 States และ Refs สำหรับจัดการวงกลม (Circular Scroll)
    const [isTransitioning, setIsTransitioning] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [extendedBanners, setExtendedBanners] = useState<any[]>([]);

    useEffect(() => {
        const fetchAllWorks = async () => {
            try {
                const [novelsRes, mangasRes, categoriesRes, bannersRes] = await Promise.all([
                    fetch(`${API_URL}/api/public/novels`),
                    fetch(`${API_URL}/api/public/mangas`),
                    fetch(`${API_URL}/api/public/categories`),
                    fetch(`${API_URL}/api/public/banners`)
                ]);
                
                let combined: any[] = [];
                if (novelsRes.ok) {
                    const data = await novelsRes.json() as any;
                    combined = [...combined, ...(data.novels || []).map((n: any) => ({ ...n, type: 'novel' }))];
                }
                if (mangasRes.ok) {
                    const data = await mangasRes.json() as any;
                    combined = [...combined, ...(data.mangas || []).map((m: any) => ({ ...m, type: 'manga' }))];
                }
                combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setWorks(combined);

                if (categoriesRes.ok) {
                    const catData = await categoriesRes.json();
                    if (catData.categories && catData.categories.length > 0) {
                        setGenres(['All', ...catData.categories]);
                    }
                }

                if (bannersRes.ok) {
                    const banData = await bannersRes.json();
                    const realBanners = banData.banners || [];
                    setBanners(realBanners);
                    
                    // 🌟 สร้าง Array ใหม่สำหรับวงกลม: [รูปสุดท้าย] + [รูปทั้งหมด] + [รูปแรก]
                    if (realBanners.length > 1) {
                        setExtendedBanners([
                            realBanners[realBanners.length - 1],
                            ...realBanners,
                            realBanners[0]
                        ]);
                    } else {
                        setExtendedBanners(realBanners);
                    }
                }

            } catch (err) {
                console.error("Failed to load content:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllWorks();
    }, []);

    // 🌟 วาร์ปกลับจุดเริ่มต้นเมื่อโหลดเสร็จ (เพื่อให้โชว์รูปที่ 1 จริงๆ ไม่ใช่รูปสุดท้ายที่ก๊อปปี้ไว้)
    useEffect(() => {
        if (!loading && banners.length > 1 && scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.offsetWidth + 20; // 20 คือ gap
        }
    }, [loading, banners.length]);

    const handleScroll = () => {
        if (!scrollRef.current || isTransitioning || banners.length <= 1) return;
        
        const container = scrollRef.current;
        const width = container.offsetWidth;
        const gap = 20;
        const itemWithGap = width + gap;
        const lastRealItemIndex = extendedBanners.length - 2; // ดัชนีของรูปสุดท้ายจริงๆ

        // 🌟 วาร์ปกลับรูปสุดท้ายจริง (เมื่อสไลด์ไปโดนรูปสุดท้ายที่ก๊อปปี้ไว้หน้าสุด)
        if (container.scrollLeft <= 0) {
            setIsTransitioning(true);
            setTimeout(() => {
                container.style.scrollBehavior = 'auto'; // ปิดแอนิเมชันชั่วคราว
                container.scrollLeft = lastRealItemIndex * itemWithGap;
                container.style.scrollBehavior = 'smooth'; // เปิดแอนิเมชันคืน
                setIsTransitioning(false);
            }, LOOP_DURATION);
        }
        // 🌟 วาร์ปกลับรูปแรกจริง (เมื่อสไลด์ไปโดนรูปแรกที่ก๊อปปี้ไว้ท้ายสุด)
        else if (container.scrollLeft >= itemWithGap * (extendedBanners.length - 1)) {
            setIsTransitioning(true);
            setTimeout(() => {
                container.style.scrollBehavior = 'auto';
                container.scrollLeft = itemWithGap;
                container.style.scrollBehavior = 'smooth';
                setIsTransitioning(false);
            }, LOOP_DURATION);
        }
    };

    const displayedWorks = works.filter(w => {
        const matchType = activeCategory === 'all' ? true : w.type === activeCategory;
        const matchGenre = activeGenre === 'All' ? true : w.category === activeGenre;
        return matchType && matchGenre;
    });

    const handleCategoryToggle = (type: 'novel' | 'manga') => {
        if (activeCategory === type) setActiveCategory('all');
        else setActiveCategory(type);
        setActiveGenre('All');
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>กำลังโหลดข้อมูลหนังสือ...</div>;

    return (
        <div style={containerStyle}>
            <div style={wideContent}>
                
                {/* 🌟 แสดงแบนเนอร์แบบสไลด์วงกลม ( Circular Scroll) */}
                {extendedBanners.length > 0 ? (
                    <div 
                        ref={scrollRef}
                        style={bannerScrollContainer}
                        onScroll={handleScroll} // 🌟 จับ event การสไลด์
                    >
                        {extendedBanners.map((b, index) => (
                            <div key={`${b.id}-${index}`} style={bannerScrollItem}>
                                <img src={`${API_URL}${b.image_url}`} alt="Banner" style={bannerImage} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={bannerGrid}>
                        <div style={{ ...bannerCard, background: '#eee', color: '#aaa' }}>รอแบนเนอร์ใหม่...</div>
                        <div style={{ ...bannerCard, background: '#eee', color: '#aaa' }}>รอแบนเนอร์ใหม่...</div>
                        <div style={{ ...bannerCard, background: '#eee', color: '#aaa' }}>รอแบนเนอร์ใหม่...</div>
                        <div style={{ ...bannerCard, background: '#eee', color: '#aaa' }}>รอแบนเนอร์ใหม่...</div>
                    </div>
                )}

                <div style={tabBar}>
                    {/* Novel/Manga Tabs */}
                    <span style={activeCategory === 'novel' ? activeTab : inactiveTab} onClick={() => handleCategoryToggle('novel')}>นิยาย</span>
                    <span style={activeCategory === 'manga' ? activeTab : inactiveTab} onClick={() => handleCategoryToggle('manga')}>การ์ตูน</span>
                </div>

                <section style={genreSectionTop}>
                    {/* Genre List */}
                    <div style={titleGroup}><div style={purpleLine}></div><h3 style={sectionTitle}>หมวดหมู่</h3></div>
                    <div style={genreList}>
                        {genres.map((genre) => (
                            <span key={genre} style={activeGenre === genre ? activeGenreTag : genreTag} onClick={() => setActiveGenre(genre)}>{genre}</span>
                        ))}
                    </div>
                </section>

                <section style={sectionMargin}>
                    {/* Works Grid */}
                    <div style={sectionHeader}><div style={titleGroup}><div style={purpleLine}></div><h3 style={sectionTitle}>ผลงานล่าสุด</h3></div><span style={viewMore}>ดูทั้งหมด {'>'}</span></div>
                    {displayedWorks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>ยังไม่มีผลงานในหมวดหมู่นี้ 😅</div>
                    ) : (
                        <div style={bookGrid}>{displayedWorks.map((work) => (<NovelCard key={`${work.type}-${work.id}`} novel={work} />))}</div>
                    )}
                </section>
            </div>
        </div>
    );
}

// --- Styles ---
const containerStyle: React.CSSProperties = { backgroundColor: '#fff', minHeight: '100vh', fontFamily: "'Kanit', 'Sarabun', sans-serif" };
const wideContent: React.CSSProperties = { maxWidth: '1440px', margin: '0 auto ', padding: '0 50px 10px' }; 
const tabBar: React.CSSProperties = { display: 'flex', gap: '40px', marginBottom: '25px', borderBottom: '1px solid #eee', userSelect: 'none' }; 
const activeTab: React.CSSProperties = { color: '#9b67bd', borderBottom: '3px solid #9b67bd', paddingBottom: '12px', fontWeight: '600', fontSize: '18px', cursor: 'pointer' };
const inactiveTab: React.CSSProperties = { color: '#aaa', paddingBottom: '12px', fontSize: '18px', cursor: 'pointer', transition: '0.2s' };
const genreSectionTop: React.CSSProperties = { marginBottom: '40px' };
const genreList: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px' };
const genreTag: React.CSSProperties = { padding: '8px 20px', backgroundColor: '#efefef', borderRadius: '25px', fontSize: '14px', color: '#555', cursor: 'pointer', fontWeight: '500', transition: '0.2s', userSelect: 'none' };
const activeGenreTag: React.CSSProperties = { ...genreTag, backgroundColor: '#9b67bd', color: 'white' };
const sectionMargin: React.CSSProperties = { marginBottom: '50px' };
const sectionHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' };
const titleGroup: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' };
const purpleLine: React.CSSProperties = { width: '5px', height: '24px', backgroundColor: '#9b67bd', borderRadius: '4px' };
const sectionTitle: React.CSSProperties = { fontSize: '22px', margin: 0, fontWeight: 'bold', color: '#222' };
const viewMore: React.CSSProperties = { color: '#9b67bd', fontSize: '14px', cursor: 'pointer' };
const bookGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '25px' };

const bannerGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px', paddingTop: '20px' };
const bannerCard: React.CSSProperties = { height: '200px', borderRadius: '16px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '22px' };

// 🌟 สไตล์แบนเนอร์สไลด์แบบวงกลม
const bannerScrollContainer: React.CSSProperties = { 
    display: 'flex', 
    gap: '20px', // ระยะห่าง
    marginBottom: '40px', 
    paddingTop: '20px',
    overflowX: 'auto', 
    scrollBehavior: 'smooth', // 🌟 สไลด์ลื่นไหล
    scrollSnapType: 'x mandatory', 
    scrollbarWidth: 'none', 
    msOverflowStyle: 'none'
};
const bannerScrollItem: React.CSSProperties = {
    flex: '0 0 auto',
    width: '100%', 
    maxWidth: '1200px', // 🌟 ปรับหน้าจอให้เต็มสวยงาม (เท่าขนาด wideContent)
    height: '350px', // ปรับความสูง
    borderRadius: '20px',
    scrollSnapAlign: 'start',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    backgroundColor: '#f5f5f5',
    marginRight: '10px' // ระยะห่างเล็กน้อยเพื่อความต่อเนื่อง
};
const bannerImage: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover' // รูปเต็มสวยงาม
};
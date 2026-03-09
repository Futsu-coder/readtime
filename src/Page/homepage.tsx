import React, { useState, useEffect } from "react";
import { client } from "../client";
import { NovelCard } from "../components/novelcard";

export function HomePage() {
    const [works, setWorks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<'all' | 'novel' | 'manga'>('all');
    const [activeGenre, setActiveGenre] = useState<string>('All');

    const genreColors: { [key: string]: string } = {
        'Action': '#B5C4FF',     
        'Romance': '#F7A8E0',     
        'Fantasy': '#D4B5FF',     
        'Horror': '#F99F95',      
        'Comedy': '#E4EF8B',      
        'Adventure': '#8CC1F7',  
        'Drama': '#F7E18C',       
        'General': '#B2F2D0',     
        'Slice of Life': '#F4B183',
        'Isekai': '#D291E4'      
        
    };

    const genres = [
        'All', 'Action', 'Romance', 'Fantasy', 'Horror', 'Comedy', 
        'Adventure', 'Drama', 'General', 'Slice of Life', 'Isekai'
    ];

    useEffect(() => {
        const fetchAllWorks = async () => {
            try {
                const [novelsRes, mangasRes] = await Promise.all([
                    client.api.public.novels.$get(),
                    client.api.public.mangas.$get()
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
            } catch (err) {
                console.error("Failed to load content:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllWorks();
    }, []);

    const displayedWorks = works.filter(w => {
        const matchType = activeCategory === 'all' ? true : w.type === activeCategory;
        const matchGenre = activeGenre === 'All' ? true : w.category === activeGenre;
        return matchType && matchGenre;
    });

    const handleCategoryToggle = (type: 'novel' | 'manga') => {
        if (activeCategory === type) {
            setActiveCategory('all');
        } else {
            setActiveCategory(type);
        }
        setActiveGenre('All');
    };

    const getGenreTagStyle = (genre: string, isActive: boolean) => {
        const baseStyle = isActive ? activeGenreTag : genreTag;
        
        // ดึงสีตามหมวดหมู่ ถ้าไม่มีให้ใช้สีเทาอ่อนตามค่าเริ่มต้น
        const genreColor = genreColors[genre] || '#efefef';
        
        let backgroundColor = genreColor;
        if (genre === 'All' && isActive) {
            backgroundColor = '#9b67bd'; 
        }

        const color = (genre === 'All' && isActive) ? 'white' : '#222';

        return {
            ...baseStyle,
            backgroundColor: backgroundColor,
            color: color
        };
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>กำลังโหลดข้อมูลหนังสือ...</div>;

    return (
        <div style={containerStyle}>
            <div style={wideContent}>
                <div style={bannerGrid}>
                    <div style={{ ...bannerCard, background: '#FF6B6B' }}>Chainsaw man</div>
                    <div style={{ ...bannerCard, background: '#4ECDC4' }}>Frieren</div>
                    <div style={{ ...bannerCard, background: '#45B7D1' }}>Gundam GQuuux</div>
                    <div style={{ ...bannerCard, background: '#9B67BD' }}>Dandadan</div>
                </div>
                <div style={tabBar}>
                    <span 
                        style={activeCategory === 'novel' ? activeTab : inactiveTab} 
                        onClick={() => handleCategoryToggle('novel')}
                    >
                        นิยาย
                    </span>
                    <span 
                        style={activeCategory === 'manga' ? activeTab : inactiveTab} 
                        onClick={() => handleCategoryToggle('manga')}
                    >
                        การ์ตูน
                    </span>
                </div>
                <section style={genreSectionTop}>
                    <div style={titleGroup}>
                        <div style={purpleLine}></div>
                        <h3 style={sectionTitle}>
                            หมวดหมู่{activeCategory === 'novel' ? 'นิยาย' : activeCategory === 'manga' ? 'การ์ตูน' : 'ทั้งหมด'}
                        </h3>
                    </div>
                    <div style={genreList}>
                        {genres.map((genre) => (
                            <span 
                                key={genre} 
                                style={getGenreTagStyle(genre, activeGenre === genre)}
                                onClick={() => setActiveGenre(genre)}
                            >
                                {genre}
                            </span>
                        ))}
                    </div>
                </section>
                <section style={sectionMargin}>
                    <div style={sectionHeader}>
                        <div style={titleGroup}>
                            <div style={purpleLine}></div>
                            <h3 style={sectionTitle}>
                                {activeCategory === 'all' ? 'ผลงานล่าสุด' 
                                 : activeCategory === 'novel' ? 'Novel / นิยาย' 
                                 : 'Manga / การ์ตูน'}
                                {activeGenre !== 'All' && <span style={{ color: '#9b67bd', fontSize: '18px', marginLeft: '10px' }}>({activeGenre})</span>}
                            </h3>
                        </div>
                        <span style={viewMore}>ดูทั้งหมด {'>'}</span>
                    </div>
                    
                    {displayedWorks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>ยังไม่มีผลงานในหมวดหมู่นี้ </div>
                    ) : (
                        <div style={bookGrid}>
                            {displayedWorks.map((work) => (
                                <NovelCard key={`${work.type}-${work.id}`} novel={work} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

const containerStyle: React.CSSProperties = { backgroundColor: '#fff', minHeight: '100vh', fontFamily: "'Kanit', 'Sarabun', sans-serif" };

const wideContent: React.CSSProperties = { maxWidth: '1440px', margin: '0 auto ', padding: '0 50px 10px' }; 

const bannerGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px', paddingTop: '20px' };
const bannerCard: React.CSSProperties = { height: '200px', borderRadius: '16px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '22px' };

const tabBar: React.CSSProperties = { display: 'flex', gap: '40px', marginBottom: '25px', borderBottom: '1px solid #eee', userSelect: 'none' }; 
const activeTab: React.CSSProperties = { color: '#9b67bd', borderBottom: '3px solid #9b67bd', paddingBottom: '12px', fontWeight: '600', fontSize: '18px', cursor: 'pointer' };
const inactiveTab: React.CSSProperties = { color: '#aaa', paddingBottom: '12px', fontSize: '18px', cursor: 'pointer', transition: '0.2s' };

const genreSectionTop: React.CSSProperties = { marginBottom: '40px' };
const genreList: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px' };
const genreTag: React.CSSProperties = { 
    padding: '8px 20px', borderRadius: '25px', //backgroundColor: '#efefef', 
    fontSize: '14px', /* color: '#555', */ cursor: 'pointer', fontWeight: '500', transition: '0.2s', userSelect: 'none'
};
const activeGenreTag: React.CSSProperties = { 
    ...genreTag, 
};

const sectionMargin: React.CSSProperties = { marginBottom: '50px' };
const sectionHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' };
const titleGroup: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' };
const purpleLine: React.CSSProperties = { width: '5px', height: '24px', backgroundColor: '#9b67bd', borderRadius: '4px' };
const sectionTitle: React.CSSProperties = { fontSize: '22px', margin: 0, fontWeight: 'bold', color: '#222' };
const viewMore: React.CSSProperties = { color: '#9b67bd', fontSize: '14px', cursor: 'pointer' };

const bookGrid: React.CSSProperties = { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '25px' 
};
import React from "react";
import { Link } from "react-router-dom";
import { List, Eye, Heart } from "lucide-react";
import { NovelImage } from "./novelimage"; 

export interface Novel {
    created_at: string | number | Date;
    id: number;
    title: string;
    description: string;
    category: string;
    author?: string; 
    cover_image?: string | null; 
    type: 'novel' | 'manga'; 
    chapter_count?: number;
    view_count?: number;
    bookmark_count?: number;
    is_completed?: number; // 🌟 รับค่า 0 (กำลังแต่ง) หรือ 1 (จบแล้ว)[cite: 18, 19]
}

interface NovelCardProps {
    novel: Novel;
}

export function NovelCard({ novel }: NovelCardProps) {
    const isManga = novel.type === 'manga';
    const linkPath = isManga ? `/manga/${novel.id}` : `/novel/${novel.id}`;
    
    // 🌟 กำหนดสีและข้อความของป้ายประเภท[cite: 19]
    const typeBadgeColor = isManga ? '#ef4444' : '#3b82f6'; // แดงสำหรับมังงะ น้ำเงินสำหรับนิยาย
    const typeText = isManga ? 'Manga' : 'Novel';

    return (
        <Link to={linkPath} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div 
                style={bookCard}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
                {/* 🌟 หุ้มรูปด้วย container ที่มี position: relative เพื่อแปะป้าย absolute ได้ */}
                <div style={{ position: 'relative', width: '100%', height: '280px', marginBottom: '12px' }}>
                    <div style={bookCover}>
                        {novel.cover_image ? (
                            <NovelImage 
                                src={novel.cover_image} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} 
                            />
                        ) : (
                            <span style={{ color: '#ccc', fontWeight: '500', fontSize: '14px' }}>No Cover</span>
                        )}
                    </div>
                    <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: typeBadgeColor,
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        textTransform: 'uppercase'
                    }}>
                        {typeText}
                    </div>
                </div>

                <h4 style={bookName} title={novel.title}>
                    {novel.title}
                </h4>
                <p style={authorName}>
                    {novel.author || 'ไม่ระบุผู้แต่ง'}
                </p>               
                <div style={statsContainer}>
                    <div style={statItem} title="จำนวนตอน">
                        <List size={14} color="#999" />
                        <span style={statText}>{Number(novel.chapter_count || 0).toLocaleString()}</span>
                    </div>
                    <div style={statItem} title="ยอดเข้าชม">
                        <Eye size={14} color="#999" />
                        <span style={statText}>{Number(novel.view_count || 0).toLocaleString()}</span>
                    </div>
                    <div style={statItem} title="ยอดเก็บเข้าชั้น">
                        <Heart size={14} color="#999" />
                        <span style={statText}>{Number(novel.bookmark_count || 0).toLocaleString()}</span>
                    </div>
                </div>
                
                {/* 🌟 ป้ายสถานะจบเนื้อเรื่อง (ไว้ด้านล่างสุด)[cite: 19] */}
                <div style={{ marginTop: '8px' }}>
                    {novel.is_completed === 1 ? (
                        <span style={{ fontSize: '12px', padding: '3px 8px', backgroundColor: '#10b981', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>✓ Completed</span>
                    ) : (
                        <span style={{ fontSize: '12px', padding: '3px 8px', backgroundColor: '#f59e0b', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>• Ongoing</span>
                    )}
                </div>
            </div>
        </Link>
    );
}

const bookCard: React.CSSProperties = { cursor: 'pointer', transition: 'transform 0.2s ease-in-out', width: '100%' };
const bookCover: React.CSSProperties = { width: '100%', height: '100%', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f0f0f0', backgroundColor: '#f5f5f5', overflow: 'hidden' };
const bookName: React.CSSProperties = { margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const authorName: React.CSSProperties = { margin: '0 0 10px 0', fontSize: '13px', color: '#999', textTransform: 'uppercase' };
const statsContainer: React.CSSProperties = { display: 'flex', gap: '12px' };
const statItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '4px' };
const statText: React.CSSProperties = { fontSize: '12px', color: '#999' };
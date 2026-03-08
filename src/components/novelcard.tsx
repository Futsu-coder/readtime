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
    // 🌟 เพิ่ม 3 ค่านี้เข้ามารับข้อมูลสถิติ
    chapter_count?: number;
    view_count?: number;
    bookmark_count?: number;
}

interface NovelCardProps {
    novel: Novel;
}

export function NovelCard({ novel }: NovelCardProps) {
    const isManga = novel.type === 'manga';
    const linkPath = isManga ? `/manga/${novel.id}` : `/novel/${novel.id}`;
    
    return (
        <Link to={linkPath} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div 
                style={bookCard}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
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
            </div>
        </Link>
    );
}

const bookCard: React.CSSProperties = { cursor: 'pointer', transition: 'transform 0.2s ease-in-out', width: '100%' };
const bookCover: React.CSSProperties = { width: '100%', height: '280px', borderRadius: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f0f0f0', backgroundColor: '#f5f5f5', overflow: 'hidden' };
const bookName: React.CSSProperties = { margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const authorName: React.CSSProperties = { margin: '0 0 10px 0', fontSize: '13px', color: '#999', textTransform: 'uppercase' };
const statsContainer: React.CSSProperties = { display: 'flex', gap: '12px' };
const statItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '4px' };
const statText: React.CSSProperties = { fontSize: '12px', color: '#999' };
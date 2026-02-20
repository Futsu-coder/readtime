// นำเข้า API_URL มาจากไฟล์ client ของเราแค่ที่เดียว!
import { API_URL } from "../client";

// กำหนดว่าตอนเรียกใช้ ต้องส่งอะไรมาบ้าง (เหมือนการตั้งค่าให้แท็ก img)
interface NovelImageProps {
    src?: string | null;
    alt?: string;
    style?: React.CSSProperties;
    className?: string;
}
export function NovelImage({ src, alt = "Novel Cover", style, className }: NovelImageProps) {
    const imageUrl = src ? `${API_URL}${src}` : null;
    if (!imageUrl) {
        return (
            <div style={{ 
                background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '2rem', color: 'white', ...style 
            }} className={className}>
                📖
            </div>
        );
    }
    return (
        <img 
            src={imageUrl} 
            alt={alt} 
            style={{ objectFit: 'fill', ...style }} 
            className={className}
        />
    );
}
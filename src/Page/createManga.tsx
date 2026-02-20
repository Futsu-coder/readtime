import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../client"; 

// 🌟 นำเข้า
import { RichTextEditor } from "../components/RichtextEditor";

export function CreateMangaPage() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Action");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [errorMsg, setErrorMsg] = useState("");
    const [statusMsg, setStatusMsg] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* เหมือนเดิม */
         const file = e.target.files?.[0];
         if (file && file.type.startsWith("image/")) {
             setCoverFile(file);
             setCoverPreview(URL.createObjectURL(file));
         }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return setErrorMsg("กรุณากรอกชื่อเรื่อง");
        setIsLoading(true); setStatusMsg("กำลังสร้างมังงะใหม่...");

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/protected/manga`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ title, description, category })
            });

            if (res.ok) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = await res.json() as any;
                if (coverFile && data.id) {
                    const formData = new FormData();
                    formData.append("cover", coverFile);
                    await fetch(`${API_URL}/api/protected/manga/${data.id}/cover`, {
                        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData
                    });
                }
                navigate('/dashborad');
            } else { setIsLoading(false); setErrorMsg("สร้างไม่สำเร็จ"); }
        } catch (err) { 
            console.log(err)
            setIsLoading(false); setErrorMsg("Error"); }
    };
    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', fontFamily: "'Sarabun', sans-serif" }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#ff7b00', margin: '0 0 10px 0', fontSize: '2.2rem' }}>สร้างเรื่องมังงะใหม่</h1>
            </div>
            <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
                <form onSubmit={handleCreate}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px', paddingBottom: '25px', borderBottom: '1px dashed #eee' }}>
                         <div onClick={() => fileInputRef.current?.click()} style={{ width: '160px', height: '220px', background: '#f5f5f5', borderRadius: '12px', border: coverPreview ? 'none' : '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}>
                            {coverPreview ? <img src={coverPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : "เลือกรูป"}
                        </div>
                        <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
                    </div>
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{fontWeight:'bold'}}>ชื่อเรื่อง</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{width:'100%', padding:'14px', borderRadius:'8px', border:'1px solid #e0e0e0', backgroundColor:'#fcfcfc' , color:'black'}} required />
                    </div>
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{fontWeight:'bold'}}>หมวดหมู่</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{width:'100%', padding:'14px', borderRadius:'8px', border:'1px solid #e0e0e0' , color:'black'}}>
                            <option value="Action">แอคชั่น</option>
                            <option value="Fantasy">แฟนตาซี</option>
                            <option value="Comedy">ตลก</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '80px' }}> 
                        <label style={{fontWeight:'bold', display:'block', marginBottom:'10px'}}>📝 เรื่องย่อ</label>
                        <RichTextEditor 
                            value={description} 
                            onChange={setDescription} 
                            height="200px" 
                            placeholder="เล่าข้อมูลเบื้องต้น..."
                        />
                    </div>
                    <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '15px', background: isLoading ? '#ccc' : '#ff7b00', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {isLoading ? (statusMsg || "กำลังสร้างมังงะเรื่องใหม่...") : "สร้างมังงะเลย"}
                    </button>
                </form>
            </div>
        </div>
    );
}
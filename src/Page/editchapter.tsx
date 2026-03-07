import { useState, useEffect } from "react"
import { useNavigate, useParams } from 'react-router-dom'
import { client } from "../client"
import { RichTextEditor } from "../components/RichtextEditor"

export function EditChapterPage() {
    const { id, chapterId } = useParams<{ id: string; chapterId: string }>()
    const navigate = useNavigate()
    const [novelTitle, setNovelTitle] = useState('')
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [status, setStatus] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchChapterData = async () => {
            if (!id || !chapterId) return
            try {
                const novelRes = await client.api.public.novels[':id'].$get({ param: { id } })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (novelRes.ok) setNovelTitle((await novelRes.json() as any).novel.title)

                const chapRes = await client.api.public.novels[':id'].chapters[':chapterID'].$get({ param: { id: id, chapterID: chapterId } })
                if (chapRes.ok) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const cData = await chapRes.json() as any
                    if (cData.chapter) { setTitle(cData.chapter.title); setContent(cData.chapter.content); }
                } else { navigate(`/novel/${id}`) }
            } catch (err) {
                console.log(err)
                setStatus('Error') } finally { setIsLoading(false) }
        }
        fetchChapterData()
    }, [id, chapterId, navigate])

    const handleUpdate = async () => {
        if (!title || !content || content === '<p><br></p>') return alert('กรอกข้อมูลไม่ครบ')
        setStatus('กำลังบันทึก...')
        try {
            const token = localStorage.getItem('token')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res = await client.api.protected.novels[':id'].chapters[':chapterID'].$put(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                { param: { id: id!, chapterID: chapterId! }, json: { title, content } } as any,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            if (res.ok) { alert('✅ สำเร็จ!'); navigate(`/dashborad`); }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            else { setStatus(` ${(await res.json() as any).error}`) }
        } catch (err) {
            console.log(err)
            setStatus('Error') }
    }
    if (isLoading) return <div style={{textAlign:'center'}}>Loading...</div>
    return (
        <div style={{ maxWidth: '800px', margin: '20px auto', padding: '30px', background: 'white', borderRadius: '8px' }}>
            <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px', color: '#bc7df2' }}>
                แก้ไขเนื้อหาตอน <span style={{ fontSize: '0.6em', color: '#666' }}>({novelTitle})</span>
            </h2>
            <label style={{ fontWeight: 'bold' }}>ชื่อตอน:</label>
            <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px' }} />
            <label style={{ fontWeight: 'bold' }}>เนื้อหาไส้ใน:</label>
            <div style={{ marginBottom: '60px' }}>
                <RichTextEditor 
                    value={content} 
                    onChange={setContent} 
                    height="400px" 
                />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: status.includes('❌') ? 'red' : 'green' }}>{status}</span>
                <div>
                    <button onClick={() => navigate(`/dashborad`)} style={{ padding: '10px 20px', marginRight: '10px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>ยกเลิก</button>
                    <button onClick={() => navigate(`/dashborad`)} style={{ padding: '10px 30px', background: '9b67bd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}> อัปเดตเนื้อหา</button>
                </div>
            </div>
        </div>
    )
}
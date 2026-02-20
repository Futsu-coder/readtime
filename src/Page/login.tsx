import { useState } from "react";
import { Link } from 'react-router-dom'
import { client } from "../client";

interface ApiRespone {
    message?: string
    token?: string
    error?: string
}

export function Login(){
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    
    const handleLogin = async() => {
        setLoading(true)
        setMessage('')
        if(!username.trim() || !password.trim()){
            setMessage('กรุณากรอกข้อมูลให้ครับ')
            setLoading(false)
            return
        }
        try {
            const res = await client.api.login.$post({
                json: { username, password}
            })
            const data = await res.json() as ApiRespone
            if (res.ok && data.token){
                localStorage.setItem('token',data.token)
                alert('ยินดีต้อนรับครับ')
                window.location.href = '/'
            }
            else{
                setMessage(`${data.error}`)
            }
        }catch(err){
            console.log(err)
            setMessage('เชื่อมต่อ Server ไม่ได้')
        }finally{
            setLoading(false)
        }
    }
    const containerStyle = { maxWidth: '400px', margin: '50px auto', padding: '30px', textAlign: 'center' as const, border: '1px solid #ddd', borderRadius: '8px', background: 'white' }
    const inputStyle = { width: '100%', padding: '12px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ccc' }

    return (
        <div style={containerStyle}>
        <h2 style={{ color: '#333' }}>เข้าสู่ระบบ</h2>
        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
        <button onClick={handleLogin} disabled={loading} style={{ marginTop: 20, padding: '12px', width: '100%', background: '#6a4c93', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
        </button>
        <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>
        <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />
        <p style={{ color: '#666' }}>ยังไม่มีบัญชี?</p>
        <Link to="/register">
            <button style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #6a4c93', color: '#6a4c93', borderRadius: '4px', cursor: 'pointer' }}>
                สมัครสมาชิกที่นี่
            </button>
        </Link>
        </div>
    )
}
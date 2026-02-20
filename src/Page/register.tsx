import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { client } from "../client";

interface ApiRespone{
    message?: string
    token?: string
    error?: string
}

export function Register(){
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confrimPssword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    
    const handleRegister = async () => {
        setLoading(true)
        setMessage('')
        if (!username.trim() || !password.trim() || !confrimPssword.trim()){
            setMessage('กรุณกรอกข้อมูลให้ครบ')
            setLoading(false)
            return
        }
        if (password !== confrimPssword){
            setMessage('รหัสผ่านไม่ตรงกัน')
            setLoading(false)
            return
        }
        try{
            const res = await client.api.register.$post({
                json: { username,password}
            })
            const data = await res.json()as ApiRespone
            if(res.ok){
                alert('สมัครสมาชิกสำเร็จ')
                navigate('/login')
            }
            else{
                setMessage(`${data.error || 'เกิดข้อผิดพลาด'}`)
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
        <h2 style={{ color: '#333' }}>สมัครสมาชิกใหม่</h2>
        
        <input placeholder="Username (ตั้งชื่อผู้ใช้)" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="Password (รหัสผ่าน)" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="ConfrimPassword (ยืนยันรหัสผ่าน)" value={confrimPssword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />
        <button onClick={handleRegister} disabled={loading} style={{ marginTop: 20, padding: '12px', width: '100%', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'กำลังบันทึก...' : 'สมัครสมาชิก'}
        </button>
        
        <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>
        
        <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />
        
        <p style={{ color: '#666' }}>มีบัญชีอยู่แล้ว?</p>
        <Link to="/login" style={{ textDecoration: 'none', color: '#6a4c93', fontWeight: 'bold' }}>
            เข้าสู่ระบบเลย
        </Link>
        </div>
    )
}
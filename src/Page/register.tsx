import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { client } from "../client";

interface ApiRespone {
    message?: string
    token?: string
    error?: string
}

export function Register() {
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
            setMessage('กรุณากรอกข้อมูลให้ครบ')
            setLoading(false)
            return
        }
        if (password !== confrimPssword){
            setMessage('รหัสผ่านไม่ตรงกัน')
            setLoading(false)
            return
        }
        try {
            const res = await client.api.register.$post({
                json: { username,password}
            })
            const data = await res.json() as ApiRespone
            if(res.ok){
                alert('สมัครสมาชิกสำเร็จ')
                navigate('/login')
            }
            else {
                setMessage(`${data.error || 'เกิดข้อผิดพลาด'}`)
            }
        } catch(err) {
            console.log(err)
            setMessage('เชื่อมต่อ Server ไม่ได้')
        } finally {
            setLoading(false)
        }
    }

    // --- Styles (ปรับให้เหมือน Login) ---
    const containerStyle = {
        maxWidth: '450px',
        margin: '80px auto',
        padding: '20px',
        textAlign: 'center' as const,
        fontFamily: "'Inter', 'Kanit', sans-serif",
    }

    const logoStyle = {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#A865B5', // สีม่วงตามโลโก้
        marginBottom: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '5px'
    }

    const subTitleStyle = {
        fontSize: '18px',
        color: '#333',
        margin: '0 0 5px 0'
    }

    const descriptionStyle = {
        fontSize: '14px',
        color: '#555',
        marginBottom: '30px'
    }

    const inputGroupStyle = {
        textAlign: 'left' as const,
        background: '#F0F0F0',
        borderRadius: '10px',
        padding: '10px 15px',
        marginBottom: '15px',
        border: '1px solid #CCC'
    }

    const labelStyle = {
        display: 'block',
        fontSize: '12px',
        color: '#666',
        marginBottom: '2px'
    }

    const inputStyle = {
        width: '100%',
        border: 'none',
        background: 'transparent',
        fontSize: '16px',
        outline: 'none',
        padding: '5px 0'
    }

    const registerButtonStyle = {
        width: '100%',
        padding: '14px',
        background: '#9163B6', 
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '16px',
        cursor: 'pointer',
        marginTop: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }

    const footerLinksStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '15px',
        fontSize: '14px',
        color: '#333'
    }

    const linkActionStyle = {
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        fontWeight: 'bold'
    }

    return (
        <div style={containerStyle}>
            {/* Logo Section */}
            <div style={logoStyle}>
                READTIME <span style={{ fontSize: '24px' }}>✎</span>
            </div>
            <h3 style={subTitleStyle}>Register</h3>
            <p style={descriptionStyle}>สมัครสมาชิกใหม่ ReadTime!</p>
            
            {/* Input Fields */}
            <div style={inputGroupStyle}>
                <label style={labelStyle}>บัญชี</label>
                <input 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    style={inputStyle} 
                />
            </div>

            <div style={inputGroupStyle}>
                <label style={labelStyle}>รหัสผ่าน</label>
                <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    style={inputStyle} 
                />
            </div>

            <div style={inputGroupStyle}>
                <label style={labelStyle}>ยืนยันรหัสผ่าน</label>
                <input 
                    type="password" 
                    value={confrimPssword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    style={inputStyle} 
                />
            </div>
            
            {/* Error Message */}
            {message && <p style={{ color: 'red', fontSize: '14px', margin: '10px 0' }}>{message}</p>}
            
            {/* Register Button */}
            <button 
                onClick={handleRegister} 
                disabled={loading} 
                style={registerButtonStyle}
            >
                {loading ? 'กำลังบันทึก...' : 'สมัครสมาชิก'}
            </button>
            
            {/* Footer Links */}
            <div style={footerLinksStyle}>
                <span style={{ color: '#666' }}>มีบัญชีอยู่แล้ว?</span>
                <Link to="/login" style={linkActionStyle}>
                    Log in เลย
                </Link>
            </div>
        </div>
    )
}
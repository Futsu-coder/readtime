import { useState } from "react";
import { Link } from 'react-router-dom';
import { client } from "../client";

interface ApiRespone {
    message?: string
    token?: string
    error?: string
}

export function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false) 

    // 🌟 แก้ไขฟังก์ชันแล้ว: เอา Alert ออก เปลี่ยนมาเรียกใช้ UI Popup แทน 🌟
    const handleLogin = async () => {
        setLoading(true)
        setMessage('')
        if (!username.trim() || !password.trim()) {
            setMessage('กรุณากรอกข้อมูลให้ครบถ้วน')
            setLoading(false)
            return
        }
        try {
            const res = await client.api.login.$post({
                json: { username, password }
            })
            const data = await res.json() as ApiRespone
            if (res.ok && data.token) {
                localStorage.setItem('token', data.token)
                
                // เปิด UI Popup สำเร็จ
                setShowSuccess(true)
                
                // หน่วงเวลา 1.5 วินาทีให้ผู้ใช้เห็น Popup ก่อนเปลี่ยนหน้าไปหน้าแรก
                setTimeout(() => {
                    window.location.href = '/'
                }, 1500)
            }
            else {
                setMessage(`${data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'}`)
            }
        } catch (err) {
            console.log(err)
            setMessage('เชื่อมต่อ Server ไม่ได้')
        } finally {
            setLoading(false)
        }
    }

    // --- Styles ---
    const pageWrapperStyle = {
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#FFFFFF', 
        paddingTop: '80px' 
    }

    const containerStyle = {
        maxWidth: '450px',
        margin: '0 auto', 
        padding: '20px',
        textAlign: 'center' as const,
        fontFamily: "'Inter', 'Kanit', sans-serif",
    }

    const logoStyle = {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#A865B5',
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
        padding: '5px 0',
        color: '#333' 
    }

    const loginButtonStyle = {
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
        cursor: 'pointer'
    }

    const modalOverlayStyle = {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease'
    }

    const modalContentStyle = {
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        textAlign: 'center' as const,
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        minWidth: '280px'
    }

    return (
        <div style={pageWrapperStyle}>
            <div style={containerStyle}>
                <div style={logoStyle}>
                    READTIME <span style={{ fontSize: '24px' }}>✎</span>
                </div>
                <h3 style={subTitleStyle}>Log in</h3>
                <p style={descriptionStyle}>เข้าสู่ระบบด้วยสมาชิก ReadTime!</p>

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

                {message && <p style={{ color: 'red', fontSize: '14px', margin: '10px 0' }}>{message}</p>}

                <button 
                    onClick={handleLogin} 
                    disabled={loading} 
                    style={loginButtonStyle}
                >
                    {loading ? 'กำลังตรวจสอบ...' : 'Log in'}
                </button>

                <div style={footerLinksStyle}>
                    <Link to="/forgetpassword" style={linkActionStyle}>ลืมรหัสผ่าน?</Link>
                    <Link to="/register" style={linkActionStyle}>สมัครสมาชิก</Link>
                </div>

                {/* 🌟 Success Popup 🌟 */}
                {showSuccess && (
                    <div style={modalOverlayStyle}>
                        <div style={modalContentStyle}>
                            <h2 style={{ color: '#9163B6', margin: '0 0 10px 0' }}>สำเร็จ!</h2>
                            <p style={{ color: '#555' }}>ยินดีต้อนรับเข้าสู่ระบบ</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
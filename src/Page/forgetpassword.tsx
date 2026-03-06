import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function ForgotPassword() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    const handleConfirm = async () => {
        if (!email.trim()) {
            setMessage('กรุณากรอกอีเมลของท่าน')
            return
        }
        
        setLoading(true)
        setMessage('')
        
        try {
            // จำลองการเชื่อมต่อ API
            setTimeout(() => {
                setShowSuccess(true)
                setLoading(false)
                setTimeout(() => {
                    navigate('/login')
                }, 2500)
            }, 1000)

        } catch (err) {
            console.log(err)
            setLoading(false)
            setMessage('เกิดข้อผิดพลาด ไม่สามารถส่งอีเมลได้')
        }
    }

    const handleCancel = () => {
        navigate('/login')
    }

    // --- Styles ---
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
        color: '#A865B5',
        marginBottom: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '5px'
    }

    const titleStyle = {
        fontSize: '20px',
        color: '#333',
        margin: '0 0 30px 0',
        fontWeight: 'normal'
    }

    const instructionStyle = {
        fontSize: '12px',
        color: '#B22222',
        marginBottom: '10px',
        textAlign: 'left' as const,
        fontWeight: 'bold'
    }

    const inputStyle = {
        width: '100%',
        padding: '16px',
        background: '#D9D9D9',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box' as const,
        marginBottom: '25px',
        color: '#333'
    }

    const buttonContainerStyle = {
        display: 'flex',
        gap: '15px',
        justifyContent: 'space-between'
    }

    const cancelButtonStyle = {
        flex: 1,
        padding: '14px',
        background: '#E2DDDC',
        color: '#555',
        border: 'none',
        borderRadius: '30px',
        fontSize: '18px',
        cursor: 'pointer',
    }

    const confirmButtonStyle = {
        flex: 1,
        padding: '14px',
        background: '#9163B6',
        color: 'white',
        border: 'none',
        borderRadius: '30px',
        fontSize: '18px',
        cursor: 'pointer',
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
        zIndex: 1000
    }

    const modalContentStyle = {
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        textAlign: 'center' as const,
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        maxWidth: '320px'
    }

    return (
        <div style={containerStyle}>
            <div style={logoStyle}>
                READTIME <span style={{ fontSize: '24px' }}>✎</span>
            </div>
            
            <h2 style={titleStyle}>ลืมรหัสผ่าน</h2>
            
            <p style={instructionStyle}>
                *กรุณาใส่อีเมลของคุณเราจะทำการส่งลิงก์เพื่อตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณ*
            </p>
            
            <input 
                type="email" 
                placeholder="ใส่อีเมลที่นี่" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                style={inputStyle} 
            />

            {message && <p style={{ color: 'red', fontSize: '14px', margin: '-10px 0 15px 0' }}>{message}</p>}

            <div style={buttonContainerStyle}>
                <button onClick={handleCancel} style={cancelButtonStyle}>
                    ยกเลิก
                </button>
                <button onClick={handleConfirm} disabled={loading} style={confirmButtonStyle}>
                    {loading ? 'กำลังส่ง...' : 'ยืนยัน'}
                </button>
            </div>

            {/* Success Popup */}
            {showSuccess && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>z
                        <h2 style={{ color: '#9163B6', margin: '0 0 10px 0' }}>ส่งเรียบร้อย!</h2>
                        <p style={{ color: '#555', fontSize: '14px' }}>
                            เราได้ส่งลิงก์กู้คืนรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบในกล่องจดหมาย
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
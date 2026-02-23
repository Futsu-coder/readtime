import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { client } from "../client"; // นำคอมเมนต์ออกเมื่อต้องการเชื่อมต่อ API

export function ForgotPassword() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleConfirm = async () => {
        if (!email.trim()) {
            setMessage('กรุณากรอกอีเมลของท่าน')
            return
        }
        
        setLoading(true)
        setMessage('')
        
        try {
            setTimeout(() => {
                alert('ส่งลิงก์เพื่อตั้งรหัสผ่านใหม่ไปยังอีเมลของท่านแล้ว')
                navigate('/login')
            }, 1000)

        } catch (err) {
            console.log(err)
            setMessage('เกิดข้อผิดพลาด ไม่สามารถส่งอีเมลได้')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        // เมื่อกดยกเลิก จะกลับไปหน้า Login
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
        color: '#A865B5', // สีม่วงตามหน้าอื่น
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
        color: '#B22222', // สีแดงเข้มตามแบบรูปภาพ
        marginBottom: '10px',
        textAlign: 'left' as const,
        fontWeight: 'bold'
    }

    const inputStyle = {
        width: '100%',
        padding: '16px',
        background: '#D9D9D9', // สีเทากล่อง input
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
        gap: '15px', // ระยะห่างระหว่างปุ่ม
        justifyContent: 'space-between'
    }

    const cancelButtonStyle = {
        flex: 1, // ขยายปุ่มให้กว้างเท่ากัน
        padding: '14px',
        background: '#E2DDDC', // สีเทาอมครีม
        color: '#555',
        border: 'none',
        borderRadius: '30px', // ขอบมนมากแบบแคปซูล
        fontSize: '18px',
        cursor: 'pointer',
    }

    const confirmButtonStyle = {
        flex: 1, // ขยายปุ่มให้กว้างเท่ากัน
        padding: '14px',
        background: '#9163B6', // สีม่วง ReadTime
        color: 'white',
        border: 'none',
        borderRadius: '30px', // ขอบมนมากแบบแคปซูล
        fontSize: '18px',
        cursor: 'pointer',
    }

    return (
        <div style={containerStyle}>
            {/* Logo Section */}
            <div style={logoStyle}>
                READTIME <span style={{ fontSize: '24px' }}>✎</span>
            </div>
            
            <h2 style={titleStyle}>ลืมรหัสผ่าน</h2>
            
            {/* คำอธิบายตัวสีแดง */}
            <p style={instructionStyle}>
                *กรุณาใส่อีเมลของคุณเราจะทำการส่งลิงก์เพื่อตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณ*
            </p>
            
            {/* กล่องกรอกอีเมล */}
            <input 
                type="email" 
                placeholder="ใส่อีเมลที่นี่" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                style={inputStyle} 
            />

            {/* ส่วนแสดงข้อความแจ้งเตือน */}
            {message && <p style={{ color: 'red', fontSize: '14px', margin: '-10px 0 15px 0' }}>{message}</p>}

            {/* ส่วนของปุ่ม ยกเลิก / ยืนยัน */}
            <div style={buttonContainerStyle}>
                <button onClick={handleCancel} style={cancelButtonStyle}>
                    ยกเลิก
                </button>
                <button onClick={handleConfirm} disabled={loading} style={confirmButtonStyle}>
                    {loading ? 'กำลังส่ง...' : 'ยืนยัน'}
                </button>
            </div>
        </div>
    )
}

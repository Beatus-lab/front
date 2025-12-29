import { useEffect, useState } from 'react'
import './App.css'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BACKEND}/api/user`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data && data.ok) setUser(data.user)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleLogin() {
    window.location.href = `${BACKEND}/auth/google`
  }

  async function handleLogout() {
    await fetch(`${BACKEND}/auth/logout`, { method: 'POST', credentials: 'include' })
    setUser(null)
  }

  if (loading) return <div className="app">Loading...</div>

  if (!user) {
    return (
      <div className="app">
        <h1>실험실 사용신청 — 로그인</h1>
        <p>학교 구글 계정으로 로그인해야 합니다.</p>
        <button onClick={handleLogin}>Google로 로그인</button>
      </div>
    )
  }

  return (
    <div className="app">
      <h1>메인 화면</h1>
      <p>안녕하세요, {user.displayName || user.email}</p>
      <p>이메일: {user.email}</p>
      <button onClick={handleLogout}>로그아웃</button>
      <section>
        <h2>신청서 목록 (임시)</h2>
        <p>여기에 실험실 사용신청 기능이 들어갑니다.</p>
      </section>
    </div>
  )
}

export default App

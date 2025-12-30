import { useEffect, useState } from 'react'
import './App.css'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    lab: '',
    date: '',
    time: { ET: false, EP1: false },
    students: [
      { grade: '', class: '', name: '' },
      { grade: '', class: '', name: '' },
      { grade: '', class: '', name: '' }
    ],
    teacher: '',
    purpose: {
      research: false,
      classActivity: false,
      club: false,
      clubName: '',
      other: false,
      otherText: ''
    },
    researchPlan: ''
  })
  const [tab, setTab] = useState('user') // 'user' or 'admin'
  const [adminApps, setAdminApps] = useState([])

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

  function handleCreateForm() {
    setShowForm(true)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleTimeChange(timeType) {
    setForm(prev => ({
      ...prev,
      time: { ...prev.time, [timeType]: !prev.time[timeType] }
    }))
  }

  function handleStudentChange(idx, field, value) {
    setForm(prev => {
      const newStudents = [...prev.students]
      newStudents[idx] = { ...newStudents[idx], [field]: value }
      return { ...prev, students: newStudents }
    })
  }

  function handlePurposeChange(type, value) {
    setForm(prev => ({
      ...prev,
      purpose: { ...prev.purpose, [type]: value }
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      // 검증: 학생 및 시간 선택 확인
      const selectedStudents = form.students.filter(s => s.name.trim())
      const selectedTimes = Object.values(form.time).some(v => v)
      const selectedPurpose = Object.keys(form.purpose)
        .filter(k => k !== 'clubName' && k !== 'otherText')
        .some(k => form.purpose[k])
      
      if (!selectedStudents.length) {
        alert('최소 1명 이상의 학생을 입력해주세요.')
        return
      }
      if (!selectedTimes) {
        alert('사용 시간을 선택해주세요.')
        return
      }
      if (!selectedPurpose) {
        alert('사용 목적을 선택해주세요.')
        return
      }

      const res = await fetch(`${BACKEND}/api/applications`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data && data.ok) {
        alert('신청이 제출되었습니다.')
        setShowForm(false)
        setForm({
          lab: '',
          date: '',
          time: { ET: false, EP1: false },
          students: [
            { grade: '', class: '', name: '' },
            { grade: '', class: '', name: '' },
            { grade: '', class: '', name: '' }
          ],
          teacher: '',
          purpose: {
            research: false,
            classActivity: false,
            club: false,
            clubName: '',
            other: false,
            otherText: ''
          },
          researchPlan: ''
        })
      } else {
        alert(data.message || '제출에 실패했습니다.')
      }
    } catch (err) {
      console.error(err)
      alert('네트워크 오류')
    }
  }

  async function handleLogout() {
    await fetch(`${BACKEND}/auth/logout`, { method: 'POST', credentials: 'include' })
    setUser(null)
    setTab('user')
  }

  async function loadAdminApps() {
    try {
      const res = await fetch(`${BACKEND}/api/admin/applications`, { credentials: 'include' })
      const data = await res.json()
      if (data && data.ok) setAdminApps(data.applications)
    } catch (err) {
      console.error(err)
    }
  }

  function handleTabChange(newTab) {
    setTab(newTab)
    if (newTab === 'admin') {
      loadAdminApps()
    }
  }

  async function handleUpdateStatus(id, status) {
    try {
      const res = await fetch(`${BACKEND}/api/admin/applications/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.message || '권한이 없습니다. 다시 로그인해주세요.')
        // 권한 에러시 사용자 정보 다시 확인
        if (res.status === 403) {
          const checkRes = await fetch(`${BACKEND}/api/user`, { credentials: 'include' })
          const checkData = await checkRes.json()
          if (!checkData.ok) {
            setUser(null)
            setTab('user')
          }
        }
        return
      }
      if (data && data.ok) {
        setAdminApps(prev => prev.map(a => a.id === id ? data.application : a))
        alert('상태가 업데이트되었습니다.')
      }
    } catch (err) {
      console.error(err)
      alert('업데이트 실패')
    }
  }

  async function handleDeleteApp(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      const res = await fetch(`${BACKEND}/api/admin/applications/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.message || '권한이 없습니다. 다시 로그인해주세요.')
        if (res.status === 403) {
          const checkRes = await fetch(`${BACKEND}/api/user`, { credentials: 'include' })
          const checkData = await checkRes.json()
          if (!checkData.ok) {
            setUser(null)
            setTab('user')
          }
        }
        return
      }
      if (data && data.ok) {
        setAdminApps(prev => prev.filter(a => a.id !== id))
        alert('삭제되었습니다.')
      }
    } catch (err) {
      console.error(err)
      alert('삭제 실패')
    }
  }

  async function handleExport() {
    try {
      const res = await fetch(`${BACKEND}/api/admin/applications/export`, { credentials: 'include' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.message || '내보내기 실패')
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'applications.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('내보내기 중 오류가 발생했습니다.')
    }
  }

  if (loading) return <div className="app-container"><div className="loading">로딩 중...</div></div>

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>실험실 사용신청 시스템</h1>
      </header>

      <main className="app-main">
        {!user ? (
          <div className="login-section">
            <p className="login-subtitle">학교 구글 계정으로 로그인하세요</p>
            <button className="btn btn-primary" onClick={handleLogin}>
              Google로 로그인
            </button>
          </div>
        ) : (
          <>
            {user.isAdmin && (
              <div className="tabs">
                <button
                  className={`tab-btn ${tab === 'user' ? 'active' : ''}`}
                  onClick={() => handleTabChange('user')}
                >
                  내 신청서
                </button>
                <button
                  className={`tab-btn ${tab === 'admin' ? 'active' : ''}`}
                  onClick={() => handleTabChange('admin')}
                >
                  관리
                </button>
              </div>
            )}

            {tab === 'user' && (
              <>
                <div className="form-section">
                  <button className="btn btn-primary" onClick={handleCreateForm}>
                    신청서 작성
                  </button>
                </div>

                <div className="user-info-section">
                  <p className="user-greeting">
                    안녕하세요, <strong>{user.displayName || user.email}</strong>
                  </p>
                  <p className="user-email">{user.email}</p>
                  <button className="btn btn-secondary" onClick={handleLogout}>
                    로그아웃
                  </button>
                </div>
              </>
            )}

            {tab === 'admin' && user.isAdmin && (
              <div className="admin-section">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h2 style={{margin:0}}>신청서 관리</h2>
                  <div>
                    <button className="btn btn-primary" onClick={handleExport} style={{marginRight: '0.75rem'}}>엑셀로 내보내기</button>
                    <button className="btn btn-secondary" onClick={loadAdminApps}>새로고침</button>
                  </div>
                </div>
                {adminApps.length === 0 ? (
                  <p>신청서가 없습니다.</p>
                ) : (
                  <div className="admin-table">
                    {adminApps.map(app => (
                      <div key={app.id} className="admin-row">
                        <div className="admin-info">
                          <p><strong>사용자:</strong> {app.userName} ({app.userEmail})</p>
                          <p><strong>실험실:</strong> {app.lab}</p>
                          <p><strong>날짜:</strong> {app.date}</p>
                          <p><strong>시간:</strong> {app.time && (app.time.ET || app.time.EP1) ? [app.time.ET ? 'ET' : '', app.time.EP1 ? 'EP1' : ''].filter(Boolean).join(', ') : '-'}</p>
                          <p><strong>활동 학생:</strong> {app.students && app.students.filter(s => s.name).length ? app.students.filter(s => s.name).map(s => `${s.grade}학년 ${s.class}반 ${s.name}`).join('; ') : '-'}</p>
                          <p><strong>지도 선생님:</strong> {app.teacher || '-'}</p>
                          <p><strong>사용 목적:</strong> {app.purpose && (app.purpose.research || app.purpose.classActivity || app.purpose.club || app.purpose.other) ? [
                            app.purpose.research && '과제 연구',
                            app.purpose.classActivity && '학급 활동',
                            app.purpose.club && `동아리 활동(${app.purpose.clubName || ''})`,
                            app.purpose.other && `기타(${app.purpose.otherText || ''})`
                          ].filter(Boolean).join('; ') : '-'}</p>
                          <p><strong>연구 계획:</strong> {app.researchPlan ? app.researchPlan.substring(0, 100) + (app.researchPlan.length > 100 ? '...' : '') : '-'}</p>
                          <p><strong>상태:</strong> <span className={`status status-${app.status || 'pending'}`}>{app.status || 'pending'}</span></p>
                        </div>
                        <div className="admin-actions">
                          <button
                            className="btn btn-small btn-success"
                            onClick={() => handleUpdateStatus(app.id, 'approved')}
                          >
                            승인
                          </button>
                          <button
                            className="btn btn-small btn-warning"
                            onClick={() => handleUpdateStatus(app.id, 'rejected')}
                          >
                            거절
                          </button>
                          <button
                            className="btn btn-small btn-danger"
                            onClick={() => handleDeleteApp(app.id)}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button className="btn btn-secondary" onClick={handleLogout} style={{ marginTop: '2rem' }}>
                  로그아웃
                </button>
              </div>
            )}
          </>
        )}
      </main>
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <h3>신청서 작성</h3>
            <form onSubmit={handleSubmit} className="form-large">
              {/* 기본 정보 */}
              <fieldset>
                <legend>기본 정보</legend>
                
                <label>실험실/장소 *</label>
                <input name="lab" value={form.lab} onChange={handleChange} required />

                <label>날짜 *</label>
                <input name="date" type="date" value={form.date} onChange={handleChange} required />

                <label>사용 시간 *</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.time.ET}
                      onChange={() => handleTimeChange('ET')}
                    />
                    ET
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.time.EP1}
                      onChange={() => handleTimeChange('EP1')}
                    />
                    EP1
                  </label>
                </div>
              </fieldset>

              {/* 학생 정보 */}
              <fieldset>
                <legend>활동 학생 정보 (최대 3명) *</legend>
                {form.students.map((student, idx) => (
                  <div key={idx} className="student-row">
                    <label>학생 {idx + 1}</label>
                    <div className="student-inputs">
                      <input
                        type="text"
                        placeholder="학년"
                        value={student.grade}
                        onChange={(e) => handleStudentChange(idx, 'grade', e.target.value)}
                        className="student-field"
                      />
                      <input
                        type="text"
                        placeholder="반"
                        value={student.class}
                        onChange={(e) => handleStudentChange(idx, 'class', e.target.value)}
                        className="student-field"
                      />
                      <input
                        type="text"
                        placeholder="이름"
                        value={student.name}
                        onChange={(e) => handleStudentChange(idx, 'name', e.target.value)}
                        className="student-field"
                      />
                    </div>
                  </div>
                ))}
              </fieldset>

              {/* 지도 선생님 */}
              <label>지도 선생님</label>
              <input name="teacher" value={form.teacher} onChange={handleChange} />

              {/* 사용 목적 */}
              <fieldset>
                <legend>사용 목적 *</legend>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.purpose.research}
                      onChange={(e) => handlePurposeChange('research', e.target.checked)}
                    />
                    과제 연구
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.purpose.classActivity}
                      onChange={(e) => handlePurposeChange('classActivity', e.target.checked)}
                    />
                    학급 활동
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.purpose.club}
                      onChange={(e) => handlePurposeChange('club', e.target.checked)}
                    />
                    동아리 활동
                  </label>
                  {form.purpose.club && (
                    <input
                      type="text"
                      placeholder="동아리명"
                      value={form.purpose.clubName}
                      onChange={(e) => handlePurposeChange('clubName', e.target.value)}
                      className="conditional-input"
                    />
                  )}
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.purpose.other}
                      onChange={(e) => handlePurposeChange('other', e.target.checked)}
                    />
                    기타
                  </label>
                  {form.purpose.other && (
                    <input
                      type="text"
                      placeholder="기타 내용"
                      value={form.purpose.otherText}
                      onChange={(e) => handlePurposeChange('otherText', e.target.value)}
                      className="conditional-input"
                    />
                  )}
                </div>
              </fieldset>

              {/* 연구 계획 */}
              <label>연구 계획</label>
              <textarea
                name="researchPlan"
                value={form.researchPlan}
                onChange={handleChange}
                placeholder="활동 내용을 자세히 작성해주세요"
                className="textarea-large"
              />

              <div className="modal-actions">
                <button className="btn btn-primary" type="submit">제출</button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

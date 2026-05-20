import React from 'react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import RankedList from './pages/RankedList.jsx'
import RecordInspector from './pages/RecordInspector.jsx'
import Methodology from './pages/Methodology.jsx'
import KnowledgeBase from './pages/KnowledgeBase.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <div className="header-inner">
            <span className="logo">
              <span className="logo-accent">BDR</span> Readiness Score
            </span>
            <nav className="nav">
              <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Queue</NavLink>
              <NavLink to="/methodology" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Methodology</NavLink>
              <NavLink to="/knowledge-base" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Knowledge Base</NavLink>
            </nav>
          </div>
        </header>
        <main className="main">
          <Routes>
            <Route path="/" element={<RankedList />} />
            <Route path="/record/:id" element={<RecordInspector />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

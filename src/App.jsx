import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import './App.css'

// Import demo components
import HomeDemo from './demos/HomeDemo'
import ScissorsDemo from './demos/ScissorsDemo'
import EmbeddingsDemo from './demos/EmbeddingsDemo'
import KnowledgeUnderstandingDemo from './demos/KnowledgeUnderstandingDemo'
import ContextSlingshotDemo from './demos/ContextSlingshotDemo'

function App() {
  return (
    <Router>
      <div className="app">
        <AppBar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomeDemo />} />
            <Route path="/scissors" element={<ScissorsDemo />} />
            <Route path="/embeddings" element={<EmbeddingsDemo />} />
            <Route path="/knowledge-understanding" element={<KnowledgeUnderstandingDemo />} />
            <Route path="/context-slingshot" element={<ContextSlingshotDemo />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <p>A Cozy AI Kitchen 🍰 Recipe</p>
        </footer>
      </div>
    </Router>
  )
}

function AppBar() {
  const location = useLocation()
  
  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/scissors', label: 'Scissors', icon: '✂️' },
    { path: '/embeddings', label: 'Embeddings', icon: '🧑‍🍳' },
    { path: '/knowledge-understanding', label: 'Knowledge', icon: '🤔' },
    { path: '/context-slingshot', label: 'Sponge', icon: '🧽' }
  ]

  return (
    <nav className="app-bar">
      <div className="app-bar-content">
        <div className="app-bar-title">
          <h1>🍰 Cozy AI Kitchenette (CAIK)</h1>
        </div>
        <div className="app-bar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default App 
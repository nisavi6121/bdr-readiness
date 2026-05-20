import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { api } from '../api/client.js'

function formatName(slug) {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function KnowledgeBase() {
  const [docs, setDocs] = useState([])
  const [selected, setSelected] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.kbList().then(data => {
      setDocs(data.docs)
      if (data.docs.length > 0) setSelected(data.docs[0])
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    api.kbDoc(selected).then(data => setContent(data.content))
      .catch(e => setContent(`Error loading document: ${e.message}`))
      .finally(() => setLoading(false))
  }, [selected])

  return (
    <div>
      <h1 className="page-title">Knowledge Base</h1>
      <p className="page-subtitle">Design decisions, issue catalogue, and discovery notes</p>
      <div className="kb-layout">
        <nav className="kb-nav">
          {docs.map(doc => (
            <div
              key={doc}
              className={`kb-nav-item${selected === doc ? ' active' : ''}`}
              onClick={() => setSelected(doc)}
            >
              {formatName(doc)}
            </div>
          ))}
        </nav>
        <div className="kb-content">
          {loading
            ? <div className="loading">Loading…</div>
            : <ReactMarkdown>{content}</ReactMarkdown>
          }
        </div>
      </div>
    </div>
  )
}

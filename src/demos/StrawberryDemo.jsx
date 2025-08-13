import React, { useState, useEffect, useRef } from 'react'
import { encoding_for_model, get_encoding } from '@dqbd/tiktoken'

function StrawberryDemo() {
  const [selectedModels, setSelectedModels] = useState(['mistral-ai/mistral-small-2503', 'openai/gpt-4o-mini'])
  const [customQuery, setCustomQuery] = useState("How many Rs are in strawberry?")
  const [tokenizedQuery, setTokenizedQuery] = useState([])
  const [showTokenIds, setShowTokenIds] = useState(false)
  const [reasoningResults, setReasoningResults] = useState({})
  const [culturalResults, setCulturalResults] = useState({})
  const [reasoningLoading, setReasoningLoading] = useState({})
  const [culturalLoading, setCulturalLoading] = useState({})
  const [tokenCounts, setTokenCounts] = useState({})
  const [isReasoningProcessing, setIsReasoningProcessing] = useState(false)
  const [isCulturalProcessing, setIsCulturalProcessing] = useState(false)

  // Reusable encoder instance for the component lifecycle
  const encoderRef = useRef(null)
  const textDecoderRef = useRef(typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null)

  const loadEncoding = (model = 'gpt-4o-mini') => {
    try { return encoding_for_model(model) } catch { return get_encoding('cl100k_base') }
  }

  const ensureEncoder = () => {
    if (!encoderRef.current) {
      encoderRef.current = loadEncoding('gpt-4o-mini')
    }
    return encoderRef.current
  }

  // Count code points (user-visible characters may differ for some emojis)
  const codePointLength = (str) => [...str].length

  const availableModels = [
    { id: 'mistral-ai/mistral-small-2503', name: 'Mistral Small', flag: '🇫🇷', provider: 'Mistral AI' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', flag: '🇺🇸', provider: 'OpenAI' },
    { id: 'openai/gpt-5', name: 'GPT-5', flag: '🇺🇸', provider: 'OpenAI' },
    { id: 'deepseek/DeepSeek-R1', name: 'DeepSeek R1', flag: '🇨🇳', provider: 'DeepSeek' },
    { id: 'meta/Meta-Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B', flag: '🇺🇸', provider: 'Meta' },
    { id: 'xai/grok-3-mini', name: 'Grok 3 Mini', flag: '🇺🇸', provider: 'xAI' },
    { id: 'cohere/Cohere-command-r-08-2024', name: 'Command R', flag: '🇨🇦', provider: 'Cohere' },
    { id: 'ai21-labs/AI21-Jamba-1.5-Mini', name: 'Jamba 1.5 Mini', flag: '🇮🇱', provider: 'AI21 Labs' },
    { id: 'microsoft/Phi-3-medium-128k-instruct', name: 'Phi-3 Medium 128K', flag: '🇺🇸', provider: 'Microsoft' }
  ]

  const countTokens = (text) => {
    try {
      const enc = ensureEncoder()
      return enc.encode(text).length
    } catch (error) {
      console.error('Error counting tokens:', error)
      return 0
    }
  }

  const tokenizeWithCharOffsets = (text) => {
    try {
      const enc = ensureEncoder()
      const ids = enc.encode(text)
      const decoder = textDecoderRef.current || new TextDecoder('utf-8')
      const pieces = []
      for (let i = 0; i < ids.length; i++) {
        let bytes
        try {
          bytes = enc.decode_single_token_bytes(ids[i])
        } catch (_) {
          try {
            bytes = enc.decode(new Uint32Array([ids[i]]))
          } catch (_) {
            bytes = new Uint8Array()
          }
        }
        let textPiece = ''
        try {
          textPiece = decoder.decode(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
        } catch (_) {
          textPiece = ''
        }
        if (textPiece === undefined || textPiece === null) textPiece = ''
        pieces.push(textPiece)
      }
      const result = []
      let pos = 0
      for (let i = 0; i < ids.length; i++) {
        const piece = pieces[i]
        const len = codePointLength(piece)
        const start = pos
        const end = pos + len
        result.push({ id: ids[i], text: piece, start_char: start, end_char: end })
        pos = end
      }
      const reconstructed = pieces.join('')
      if (reconstructed !== text) {
        console.warn('Reconstruction mismatch: per-token decode may be lossy for some tokens.')
      }
      return result
    } catch (error) {
      console.error('Error tokenizing text:', error)
      return []
    }
  }

  const tokenizeQuery = (text) => {
    const tokens = tokenizeWithCharOffsets(text)
    return tokens.map((t, i) => ({ text: t.text, id: t.id, color: getTokenColor(i) }))
  }

  const getTokenColor = (index) => {
    // Light pastel palette for good contrast with black text
    const colors = [
      '#FFE4E6', '#D1FAE5', '#BFDBFE', '#FEF3C7', '#FDE68A',
      '#FAD2E1', '#C7D2FE', '#E9D5FF', '#FFD9E8', '#FFE8A3',
      '#A7F3D0', '#BAE6FD', '#E0E7FF', '#FCE7F3', '#F1F5F9'
    ]
    return colors[index % colors.length]
  }

  const handleQueryChange = (newQuery) => {
    setCustomQuery(newQuery)
    const tokens = tokenizeQuery(newQuery)
    setTokenizedQuery(tokens)
  }

  const handleModelSelection = (modelId) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(m => m !== modelId)
        : [...prev, modelId]
    )
  }

  const runReasoningComparison = async () => {
    const newResults = {}
    const newLoading = {}
    const newTokenCounts = {}

    setIsReasoningProcessing(true)
    
    // Initialize loading state for all selected models
    selectedModels.forEach(modelId => {
      newLoading[modelId] = true
    })
    setReasoningLoading(newLoading)
    setReasoningResults({})
    setTokenCounts({})

    // Process each model
    for (const modelId of selectedModels) {
      try {
        console.log(`Running ${modelId} on reasoning question...`)
        const response = await fetch('/api/github-models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelId,
            question: customQuery,
            temperature: 0.1 // Low temperature for more consistent answers
          })
        })

        if (response.ok) {
          const data = await response.json()
          newResults[modelId] = data.response
          newTokenCounts[modelId] = {
            input: countTokens(customQuery),
            output: countTokens(data.response),
            total: countTokens(customQuery + data.response)
          }
        } else {
          newResults[modelId] = 'Error: Unable to get response'
        }

        setReasoningLoading(prev => ({ ...prev, [modelId]: false }))
        setReasoningResults({ ...newResults })
        setTokenCounts({ ...newTokenCounts })

      } catch (error) {
        console.error(`Error with model ${modelId}:`, error)
        newResults[modelId] = 'Error: Request failed'
        setReasoningLoading(prev => ({ ...prev, [modelId]: false }))
        setReasoningResults({ ...newResults })
      }
    }
    
    setIsReasoningProcessing(false)
  }

  const runCulturalComparison = async () => {
    const newResults = {}
    const newLoading = {}
    const culturalQuestion = "How do you make morango do amor?"

    setIsCulturalProcessing(true)
    
    // Initialize loading state for all selected models
    selectedModels.forEach(modelId => {
      newLoading[modelId] = true
    })
    setCulturalLoading(newLoading)
    setCulturalResults({})

    // Process each model
    for (const modelId of selectedModels) {
      try {
        console.log(`Running ${modelId} on cultural question...`)
        const response = await fetch('/api/github-models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelId,
            question: culturalQuestion,
            temperature: 0.3 // Slightly higher for creative responses
          })
        })

        if (response.ok) {
          const data = await response.json()
          newResults[modelId] = data.response
        } else {
          newResults[modelId] = 'Error: Unable to get response'
        }

        setCulturalLoading(prev => ({ ...prev, [modelId]: false }))
        setCulturalResults({ ...newResults })

      } catch (error) {
        console.error(`Error with model ${modelId}:`, error)
        newResults[modelId] = 'Error: Request failed'
        setCulturalLoading(prev => ({ ...prev, [modelId]: false }))
        setCulturalResults({ ...newResults })
      }
    }
    
    setIsCulturalProcessing(false)
  }

  // Initialize tokenization on component mount
  useEffect(() => {
    // Prime encoder and initial tokenization
    try {
      ensureEncoder()
      handleQueryChange(customQuery)
    } catch (e) {
      console.error('Tokenizer init failed', e)
    }
    return () => {
      try {
        if (encoderRef.current) {
          encoderRef.current.free()
          encoderRef.current = null
        }
      } catch {}
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getModelByID = (modelId) => {
    return availableModels.find(m => m.id === modelId)
  }

  const getProviderColor = (provider) => {
    const colors = {
      'Mistral AI': '#ff7b00',
      'OpenAI': '#10a37f', 
      'DeepSeek': '#2563eb',
      'Meta': '#4267b2',
      'xAI': '#1d4ed8',
      'Cohere': '#d97706',
      'AI21 Labs': '#6366f1',
      'Microsoft': '#0078d4'
    }
    return colors[provider] || '#6b7280'
  }

  return (
    <div className="strawberry-demo">
      <section className="section">
        <h2>🍓 Model Comparison via GitHub</h2>
        <p className="section-description">
          Break down tokens and compare model outputs.
        </p>

        <div className="model-selection">
          <h3>Available GitHub Models</h3>
          <div className="model-grid">
            {availableModels.map(model => (
              <label key={model.id} className="model-checkbox">
                <input
                  type="checkbox"
                  checked={selectedModels.includes(model.id)}
                  onChange={() => handleModelSelection(model.id)}
                />
                <span className="model-label">
                  <div className="model-provider">
                    {model.flag} {model.provider}
                  </div>
                  <div className="model-name">{model.name}</div>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Reasoning Section with Token Visualization */}
        <div className="reasoning-section">
          <h3>We Don't Input Words. We Input Tokens.</h3><br />
          
          <div className="query-input">
            <input
              id="custom-query"
              type="text"
              value={customQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="query-input-field"
              placeholder="Enter your reasoning question..."
            />
          </div>

          {tokenizedQuery.length > 0 && (
            <div className="token-visualization">
              <div className="token-header">
                <h4>What the model "sees" is {tokenizedQuery.length} "tokens" as INPUT ...</h4>
                <div className="token-switch">
                  <label className="switch-label">
                    <input
                      type="checkbox"
                      checked={showTokenIds}
                      onChange={(e) => setShowTokenIds(e.target.checked)}
                      className="switch-input"
                    />
                    <span className="switch-text">
                      Show IDs
                    </span>
                  </label>
                </div>
              </div>
              <div className="token-container">
                {tokenizedQuery.map((token, index) => (
                  <span 
                    key={index} 
                    className="token"
                    style={{ backgroundColor: token.color, color: '#000000' }}
                    title={showTokenIds ? `Text: "${token.text}"` : `Token ID: ${token.id}`}
                  >
                    {showTokenIds ? token.id : token.text.replace(/^\u0020/, '')}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button 
            onClick={runReasoningComparison}
            disabled={selectedModels.length === 0 || isReasoningProcessing}
            className="action-button"
          >
            {isReasoningProcessing ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              'Comparing Model Outputs'
            )}
          </button>

          {Object.keys(reasoningResults).length > 0 && (
            <div className="reasoning-results">
              <div className="model-responses-grid">
                {selectedModels.map(modelId => {
                  const model = getModelByID(modelId)
                  return (
                    <div key={modelId} className="model-response">
                      <div className="model-header">
                        <span className="model-badge">
                          {model.flag} {model.name}
                        </span>
                        {tokenCounts[modelId] && (
                          <div className="token-info">
                            <span className="token-count">
                              📝 {tokenCounts[modelId].input} in → 
                              {tokenCounts[modelId].output} out → 
                              {tokenCounts[modelId].total} total tokens
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="response-content">
                        {reasoningLoading[modelId] ? (
                          <div className="loading">🤔 Thinking...</div>
                        ) : (
                          <div className="response-text">
                            {reasoningResults[modelId] || 'No response yet'}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Cultural Knowledge Section */}
        <div className="cultural-section">
          <h3>Some Tokens Are Known. Some Are Foreign.</h3><br />
          <p className="question-text">"How do you make morango do amor?"</p>

          <button 
            onClick={runCulturalComparison}
            disabled={selectedModels.length === 0 || isCulturalProcessing}
            className="action-button"
          >
            {isCulturalProcessing ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              'What do the AI chefs say?'
            )}
          </button>

          {Object.keys(culturalResults).length > 0 && (
            <div className="cultural-results">
              <div className="model-responses-grid">
                {selectedModels.map(modelId => {
                  const model = getModelByID(modelId)
                  return (
                    <div key={modelId} className="model-response">
                      <div className="model-header">
                        <span className="model-badge">
                          {model.flag} {model.name}
                        </span>
                      </div>
                      <div className="response-content">
                        {culturalLoading[modelId] ? (
                          <div className="loading">🤔 Thinking...</div>
                        ) : (
                          <div className="response-text">
                            {culturalResults[modelId] || 'No response yet'}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Token Analysis Summary */}
        {Object.keys(tokenCounts).length > 0 && (
          <div className="token-analysis">
            <h3>Token Usage Analysis</h3>
            
            <div className="token-summary">
              {selectedModels.map(modelId => {
                const model = getModelByID(modelId)
                const tokens = tokenCounts[modelId]
                
                return tokens ? (
                  <div key={modelId} className="model-token-summary">
                    <span 
                      className="model-name"
                      style={{ color: getProviderColor(model.provider) }}
                    >
                      {model.flag} {model.name}
                    </span>
                    <span className="total-tokens">{tokens.total} total tokens</span>
                  </div>
                ) : null
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default StrawberryDemo

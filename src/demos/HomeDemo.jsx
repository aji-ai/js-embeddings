import React, { useEffect, useMemo, useRef, useState } from 'react'

function HomeDemo() {
  const [selectedCountry, setSelectedCountry] = useState('USA')
  const [namesData, setNamesData] = useState({
    '1970s': { male: [], female: [] },
    '2000s': { male: [], female: [] }
  })
  const [show1970sMale, setShow1970sMale] = useState(false)
  const [show1970sFemale, setShow1970sFemale] = useState(false)
  const [show2000sMale, setShow2000sMale] = useState(false)
  const [show2000sFemale, setShow2000sFemale] = useState(false)
  const [showContext, setShowContext] = useState(false)

  useEffect(() => {
    const prefix = selectedCountry === 'USA' ? 'usa' : 'brazil'
    const load = async () => {
      try {
        const [d70, d00] = await Promise.all([
          fetch(`/data/${prefix}-1970s.json`).then(r => r.json()),
          fetch(`/data/${prefix}-2000s.json`).then(r => r.json())
        ])
        setNamesData({
          '1970s': { male: d70.male || [], female: d70.female || [] },
          '2000s': { male: d00.male || [], female: d00.female || [] }
        })
      } catch (e) {
        setNamesData({ '1970s': { male: [], female: [] }, '2000s': { male: [], female: [] } })
      }
    }
    load()
  }, [selectedCountry])

  return (
    <div className="home-demo">
      <section className="section">
        <h2>🍳 Welcome to the Cozy AI Kitchenette</h2>
        <div className="welcome-content">
            This kitchen serves up interactive demonstrations of key AI concepts, 
            each presented as a hands-on recipe you can experiment with. 
            From embeddings to retrieval-augmented generation, we'll explore the ingredients 
            that make modern AI systems work through live, interactive demos.
        </div>

        <div className="accordion" style={{ marginTop: '.25rem' }}>
          <div className="accordion-header">
            <button className="accordion-toggle" onClick={() => setShowContext(v => !v)}>
              {showContext ? 'Hide Context Photos ⬆️' : 'Show Context Photos ⬇️'}
            </button>
          </div>
          {showContext ? (
            <div className="accordion-body">
              <h3 style={{ marginBottom: '1rem' }}>Context For These Recipes ...</h3>
              <div className="image-sequence">
                <p style={{ textAlign: 'center', marginBottom: '1rem' }}>Harvard Coop Shopping Trip, July 15, 2025</p>
                <img src="/p00.JPG" alt="Image 00" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p01.JPG" alt="Image 01" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p02.JPG" alt="Image 02" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p03.JPG" alt="Image 03" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p04.JPG" alt="Image 04" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p05.JPG" alt="Image 05" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p06.JPG" alt="Image 06" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p07.JPG" alt="Image 07" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p09.JPG" alt="Image 09" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p11.JPG" alt="Image 11" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p12.JPG" alt="Image 12" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p13.JPG" alt="Image 13" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p14.JPG" alt="Image 14" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p15.JPG" alt="Image 15" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p16.JPG" alt="Image 16" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p17.JPG" alt="Image 17" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p18.JPG" alt="Image 18" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p19.JPG" alt="Image 19" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="repo-link" style={{ textAlign: 'center', margin: '20px 0' }}>
          <p style={{ marginBottom: '1rem' }}>
            🔗 <strong>Explore the code:</strong> <a href="https://github.com/aji-ai/js-embeddings" target="_blank" rel="noopener noreferrer" style={{ color: '#ff6b35', textDecoration: 'none', fontWeight: 'bold' }}>github.com/aji-ai/js-embeddings</a>
          </p>
          <p><img src="/design-co-code.png" alt="Design Co" style={{ width: '400px', maxWidth: '400px', borderRadius: '8px', marginBottom: '16px' }} /></p>
        </div>
        <h2>The Cozy AI Kitchen via YouTube</h2>
        <div className="welcome-video" style={{ marginBottom: '5rem' }}>
          <video 
            controls 
            width="100%" 
            height="auto"
            style={{ maxWidth: '800px', borderRadius: '12px' }}
          >
            <source src="/caikopener.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <h2>The Wiser You Are, The Better You Can Bet</h2>
        <p className="section-description">Top 25 male and female names by era. Reveal each list to peek under the curtain.</p>
        <div className="names-section">
          <div className="names-controls">
            <label htmlFor="country-select" style={{ color: 'white' }}>Country:</label>
            <select id="country-select" value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}>
              <option value="USA">🇺🇸 United States</option>
              <option value="Brazil">🇧🇷 Brazil</option>
            </select>
          </div>

          <div className="names-grids">
            <div className="names-era">
              <h4 style={{ margin: '0 0 0.5rem 0' }}>1970s</h4>
              <div className="names-columns">
                <div className="names-list male">
                  <h5>Male</h5>
                  <div className="names-toggle-row">
                    <button className="names-toggle" onClick={() => setShow1970sMale(v => !v)}>
                      {show1970sMale ? 'Hide ⬆️' : 'Reveal ⬇️'}
                    </button>
                  </div>
                  {show1970sMale ? (
                    <div className="names-scroll">
                      <ol className="names-ol">
                        {namesData['1970s'].male.slice(0, 25).map(item => (
                          <li key={`70m-${item.rank}`}>
                            <span className="names-rank">{item.rank}.</span>
                            <span className="names-name male">{item.name}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : (
                    <div className="names-curtain">Hidden. Tap Reveal.</div>
                  )}
                </div>
                <div className="names-list female">
                  <h5>Female</h5>
                  <div className="names-toggle-row">
                    <button className="names-toggle" onClick={() => setShow1970sFemale(v => !v)}>
                      {show1970sFemale ? 'Hide ⬆️' : 'Reveal ⬇️'}
                    </button>
                  </div>
                  {show1970sFemale ? (
                    <div className="names-scroll">
                      <ol className="names-ol">
                        {namesData['1970s'].female.slice(0, 25).map(item => (
                          <li key={`70f-${item.rank}`}>
                            <span className="names-rank">{item.rank}.</span>
                            <span className="names-name female">{item.name}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : (
                    <div className="names-curtain">Hidden. Tap Reveal.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="names-era">
              <h4 style={{ margin: '0 0 0.5rem 0' }}>2000s</h4>
              <div className="names-columns">
                <div className="names-list male">
                  <h5>Male</h5>
                  <div className="names-toggle-row">
                    <button className="names-toggle" onClick={() => setShow2000sMale(v => !v)}>
                      {show2000sMale ? 'Hide ⬆️' : 'Reveal ⬇️'}
                    </button>
                  </div>
                  {show2000sMale ? (
                    <div className="names-scroll">
                      <ol className="names-ol">
                        {namesData['2000s'].male.slice(0, 25).map(item => (
                          <li key={`00m-${item.rank}`}>
                            <span className="names-rank">{item.rank}.</span>
                            <span className="names-name male">{item.name}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : (
                    <div className="names-curtain">Hidden. Tap Reveal.</div>
                  )}
                </div>
                <div className="names-list female">
                  <h5>Female</h5>
                  <div className="names-toggle-row">
                    <button className="names-toggle" onClick={() => setShow2000sFemale(v => !v)}>
                      {show2000sFemale ? 'Hide ⬆️' : 'Reveal ⬇️'}
                    </button>
                  </div>
                  {show2000sFemale ? (
                    <div className="names-scroll">
                      <ol className="names-ol">
                        {namesData['2000s'].female.slice(0, 25).map(item => (
                          <li key={`00f-${item.rank}`}>
                            <span className="names-rank">{item.rank}.</span>
                            <span className="names-name female">{item.name}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : (
                    <div className="names-curtain">Hidden. Tap Reveal.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: '5rem' }}>
        <h2>LLMs Are Prediction Machines</h2>
        <p className="section-description">Every prediction is a series of guesses about what comes next.</p>
          <LogprobDemo />
        </div>
        

      </section>

      
    </div>
  )
}

function LogprobDemo() {
  const [input, setInput] = useState('Finish this phrase as a short rhyme:\nRoses are red,');
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(1);
  const [maxTokens, setMaxTokens] = useState(16);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const resp = await fetch('/api/complete-logprobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, temperature, top_p: topP, max_tokens: maxTokens, top_logprobs: 5 })
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      setResult(data);
    } catch (e) {
      setError(typeof e === 'string' ? e : e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const positions = useMemo(() => {
    if (!result?.steps) return [];
    return result.steps.map((pos, i) => {
      const emitted = pos.token;
      const emittedLogprob = pos.logprob;
      const alts = pos.top_logprobs || [];
      const entries = (alts.length ? alts : [{ token: emitted, logprob: emittedLogprob }]).map(a => ({
        token: a.token,
        logprob: a.logprob,
        p: Math.exp(a.logprob)
      }));
      const Z = entries.reduce((s, e) => s + e.p, 0) || 1;
      entries.forEach(e => e.p = e.p / Z);
      entries.sort((a,b)=>b.p-a.p);
      return { index: i, emitted, emittedLogprob, dist: entries };
    });
  }, [result]);

  return (
    <div className="controls" style={{ marginTop: '1rem' }}>
      <div className="input-group">
        <label>Prompt</label>
        <textarea className="query-input-field" rows={3} value={input} onChange={e => setInput(e.target.value)} />
      </div>
      <div className="input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label>Temperature: {temperature.toFixed(2)}</label>
          <input type="range" min="0" max="1" step="0.01" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} />
        </div>
        <div>
          <label>Top-p: {topP.toFixed(2)}</label>
          <input type="range" min="0" max="1" step="0.01" value={topP} onChange={e => setTopP(parseFloat(e.target.value))} />
        </div>
      </div>
      <div className="input-group" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
        <div>
          <label>Max tokens: {maxTokens}</label>
          <input type="range" min="1" max="64" step="1" value={maxTokens} onChange={e => setMaxTokens(parseInt(e.target.value))} />
        </div>
        <div style={{ display: 'flex' }}>
          <button className="action-button" onClick={handleRun} disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Sampling…' : 'Sample with Logprobs'}
          </button>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}

      {result ? (
        <div className="embedding-vectors">
          <h3 style={{ marginTop: 0 }}>Generated completion</h3>
          <div className="completion-result" style={{ marginBottom: '1rem' }}>
            <div className="completion-text">{result.content}</div>
          </div>
          <div className="accordion">
            <div className="accordion-header">
              <button className="accordion-toggle" onClick={() => setShowDetails(v => !v)}>
                {showDetails ? 'Hide Probability Details ⬆️' : 'Show Probability Details ⬇️'}
              </button>
            </div>
            {showDetails ? (
              <div className="accordion-body">
                <div className="logprob-grid">
                  {positions.map(p => (
                    <div key={p.index} className="logprob-card">
                      <div className="score logprob-header" style={{ marginBottom: '0.25rem' }}>
                        <div className="model-label">Position {p.index}</div>
                        <div className="score-value logprob-emitted">{p.emitted}</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.25rem' }}>
                        {p.dist.map((e, idx) => (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ color: 'white', fontFamily: 'SF Mono, Monaco, monospace', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.token}</div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.max(2, e.p*100)}%`, height: '100%', background: '#90CAF9' }} />
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'SF Mono, Monaco, monospace', fontSize: '0.8rem', textAlign: 'right' }}>{e.p.toFixed(3)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default HomeDemo 
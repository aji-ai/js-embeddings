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
  // Proverbs state
  const [proverbLang, setProverbLang] = useState('USA')
  const [currentProverb, setCurrentProverb] = useState(null) // {text} or {pt,en,meaning}
  const stageRef = useRef(null)
  const [revealPx, setRevealPx] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  // Dice demo state
  const diceCanvasRef = useRef(null)
  const diceAnimRef = useRef(null)
  const [diceRolling, setDiceRolling] = useState(false)
  const [diceValue, setDiceValue] = useState(null)

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

  // Proverbs data
  const usProverbs = useMemo(() => ([
    'Many hands make light work',
    'Strike while the iron is hot',
    'Honesty is the best policy',
    'The grass is always greener on the other side of the fence',
    "Don’t judge a book by its cover",
    'An apple a day keeps the doctor away',
    'Better late than never',
    "Don’t bite the hand that feeds you",
    "Rome wasn’t built in a day",
    'Actions speak louder than words',
    "It’s no use crying over spilled milk",
    'Still waters run deep',
    'Curiosity killed the cat',
    'My hands are tied',
    'Out of sight, out of mind',
    'Easy come, easy go',
    "You can’t make an omelette without breaking a few eggs",
    'The forbidden fruit is always the sweetest',
    "If you scratch my back, I’ll scratch yours",
    "It’s the tip of the iceberg",
    'Learn to walk before you run',
    'First things first',
    "Don’t bite off more than you can chew",
    "It’s better to be safe than sorry",
    'The early bird catches the worm',
    "Don’t make a mountain out of an anthill (or molehill)",
    "Where there’s a will, there’s a way",
    'Always put your best foot forward',
    'The squeaky wheel gets the grease',
    'A rolling stone gathers no moss'
  ]), [])

  const brProverbs = useMemo(() => ([
    { pt: 'De grão em grão, a galinha enche o papo.', en: 'Little by little, the hen fills its belly.', meaning: 'Small efforts add up to achieve a big goal.' },
    { pt: 'Cada macaco no seu galho.', en: 'Each monkey on its branch.', meaning: 'To each his own.' },
    { pt: 'Quem não tem cão, caça com gato.', en: "Those who don’t have a dog hunt with a cat.", meaning: 'Make the most of what you have.' },
    { pt: 'À noite todos os gatos são pardos.', en: 'At night, all cats are gray.', meaning: 'In the dark, appearances are not distinguishable.' },
    { pt: 'Caiu na rede, é peixe.', en: "Once caught in the net, it's a fish.", meaning: 'Everything can be made useful.' },
    { pt: 'Mais vale um pássaro na mão do que dois voando.', en: 'A bird in the hand is worth two in flight.', meaning: 'Better a sure thing than risking for uncertainty.' },
    { pt: 'Cachorro que ladra não morde.', en: "A barking dog doesn't bite.", meaning: 'Those who make the most noise often pose no real threat.' },
    { pt: 'A cavalo dado não se olha o dente.', en: "Don't look at the teeth of a gift horse.", meaning: "Don't question the value of a gift or favor." },
    { pt: 'A pressa é inimiga da perfeição.', en: 'Haste is the enemy of perfection.', meaning: 'Rushing can lead to mistakes.' },
    { pt: 'Quem espera sempre alcança.', en: 'Whoever waits always achieves.', meaning: 'Patience pays off in the end.' },
    { pt: 'Devagar se vai ao longe.', en: 'Slowly one goes far.', meaning: 'Take your time to achieve lasting success.' },
    { pt: 'Água mole em pedra dura tanto bate até que fura.', en: 'Soft water dripping on hard stone will eventually pierce it', meaning: 'Persistence overcomes tough obstacles.' },
    { pt: 'Quem não arrisca, não petisca.', en: "Those who don't take risks don't get to have a snack.", meaning: "If you don't take risks, you won't achieve anything." },
    { pt: 'Quem não se comunica, se trumbica.', en: 'Those who don’t communicate get into trouble.', meaning: 'Lack of communication leads to problems.' },
    { pt: 'Quem tem boca vai a Roma.', en: 'Those who have a mouth go to Rome.', meaning: 'Speaking can take you places.' },
    { pt: 'Quem não chora, não mama.', en: "Those who don't cry, don't get breastfed.", meaning: 'Express needs to get what you want.' },
    { pt: 'Melhor prevenir do que remediar.', en: 'It’s better to prevent than to cure.', meaning: 'Avoid problems rather than fix them.' },
    { pt: 'O seguro morreu de velho.', en: 'Safety died of old age.', meaning: 'Better safe than sorry.' },
    { pt: 'Não adianta chorar pelo leite derramado.', en: "There's no use crying over spilled milk.", meaning: "Don't dwell on past mistakes." },
    { pt: 'Quem semeia vento, colhe tempestade.', en: 'Those who sow wind reap the storm.', meaning: 'You reap what you sow.' },
    { pt: 'Antes tarde do que nunca.', en: 'Better late than never.', meaning: '' },
    { pt: 'A esperança é a última que morre.', en: 'Hope is the last one to die.', meaning: 'Hope remains in difficult times.' },
    { pt: 'Quem com ferro fere, com ferro será ferido.', en: 'Those who strike with iron will be struck by iron.', meaning: 'Harm others and face retaliation.' },
    { pt: 'Quem vê cara, não vê coração.', en: 'Those who see the face don’t see the heart.', meaning: 'Appearances can be deceiving.' },
    { pt: 'As aparências enganam.', en: 'Appearances deceive.', meaning: '' },
    { pt: 'Nem tudo que reluz é ouro.', en: 'Not everything that glitters is gold.', meaning: 'All that glitters is not gold.' },
    { pt: 'Em terra de cego, quem tem um olho é rei.', en: 'In the land of the blind, the one-eyed man is king.', meaning: 'A small advantage can be decisive.' },
    { pt: 'O pior cego é o que não quer ver.', en: "The worst blind person is the one who doesn't want to see.", meaning: 'Willful ignorance is worst.' },
    { pt: 'Quem fala o que quer ouve o que não quer.', en: "Whoever says whatever they want hears what they don't want.", meaning: 'Speak freely, face consequences.' },
    { pt: 'Cada cabeça, uma sentença.', en: 'Each head has its own judgment.', meaning: 'Different people have different opinions.' }
  ]), [])

  const pickRandomProverb = (lang) => {
    if (lang === 'Brazil') {
      const item = brProverbs[Math.floor(Math.random() * brProverbs.length)]
      setCurrentProverb(item)
    } else {
      const text = usProverbs[Math.floor(Math.random() * usProverbs.length)]
      setCurrentProverb({ text })
    }
    setRevealPx(0)
  }

  useEffect(() => {
    pickRandomProverb(proverbLang)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proverbLang])

  const onDragStart = (e) => {
    setIsDragging(true)
  }
  const onDragEnd = () => setIsDragging(false)
  const onDragMove = (e) => {
    if (!isDragging || !stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min((e.clientX || (e.touches && e.touches[0]?.clientX) || 0) - rect.left, rect.width))
    setRevealPx(x)
  }

  // Dice drawing helpers
  const drawDie = (ctx, x, y, size, face, angle) => {
    ctx.save()
    ctx.translate(x + size/2, y + size/2)
    ctx.rotate(angle)
    ctx.translate(-size/2, -size/2)
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'
    ctx.lineWidth = 3
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(0, 0, size, size, 10); else ctx.rect(0,0,size,size)
    ctx.fill(); ctx.stroke()
    const pip = (px, py) => { ctx.beginPath(); ctx.fillStyle = '#111'; ctx.arc(px, py, size*0.06, 0, Math.PI*2); ctx.fill() }
    const m = size/6
    const coords = {1:[[3*m,3*m]],2:[[2*m,2*m],[4*m,4*m]],3:[[2*m,2*m],[3*m,3*m],[4*m,4*m]],4:[[2*m,2*m],[2*m,4*m],[4*m,2*m],[4*m,4*m]],5:[[2*m,2*m],[2*m,4*m],[3*m,3*m],[4*m,2*m],[4*m,4*m]],6:[[2*m,2*m],[2*m,3*m],[2*m,4*m],[4*m,2*m],[4*m,3*m],[4*m,4*m]]}
    ;(coords[face]||[]).forEach(([px,py])=>pip(px,py))
    ctx.restore()
  }

  const drawCup = (ctx, x, y, w, h) => {
    ctx.save(); ctx.fillStyle='rgba(120,120,120,0.35)'; ctx.strokeStyle='rgba(220,220,220,0.5)'; ctx.lineWidth=2
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x,y,w,h,12); else ctx.rect(x,y,w,h); ctx.fill(); ctx.stroke(); ctx.restore()
  }

  const startDiceRoll = () => {
    if (diceRolling) return
    setDiceRolling(true); setDiceValue(null)
    const canvas = diceCanvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); const W=canvas.width, H=canvas.height
    const cup = { x: 20, y: H/2-45, w: 90, h: 90 }
    let t0 = performance.now(); let phase = 'shake'
    let die = { x: cup.x+cup.w/2-20, y: cup.y+cup.h/2-20, size: 40, angle: 0, face: 1, vx: 4, vy: -3, spin: 0.25 }
    let settleStart = 0
    const startTime = performance.now()
    const loop = (t) => {
      const dt=(t-t0)/1000; t0=t
      ctx.clearRect(0,0,W,H); ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(0,0,W,H);
      // cup jitter during shake
      let cupX = cup.x, cupY = cup.y
      if (phase==='shake') {
        cupX += (Math.random()-0.5) * 10
        cupY += (Math.random()-0.5) * 8
      }
      drawCup(ctx,cupX,cupY,cup.w,cup.h)
      if (phase==='shake') { die.face=(Math.floor(Math.random()*6)+1); die.x=cupX+20+Math.random()*(cup.w-40); die.y=cupY+20+Math.random()*(cup.h-40); die.angle+=(Math.random()-0.5)*0.6; if ((performance.now()-startTime)>900) phase='pour' }
      if (phase==='pour') {
        die.x+=die.vx; die.y+=die.vy; die.vy+=0.4; die.angle+=die.spin;
        // keep angle bounded and reduce spin to avoid excessive rotations
        if (die.angle > Math.PI) die.angle -= Math.PI*2;
        if (die.angle < -Math.PI) die.angle += Math.PI*2;
        die.spin *= 0.99;
        if (die.y+die.size>H-16) { die.y=H-16-die.size; die.vy*=-0.45; die.vx*=0.92; die.spin*=0.85 }
        if (Math.abs(die.vx)<0.2 && Math.abs(die.vy)<0.2) {
          phase='settle'; settleStart=performance.now();
          // keep current face; do not change it at the end
        }
      }
      if (phase==='settle') {
        // Ease orientation and position to lie flat on the ground (minimal rotation)
        const groundY = H - 16 - die.size
        const dy = groundY - die.y
        die.y += dy * 0.2
        die.vx *= 0.85; die.vy *= 0.85; die.spin *= 0.8
        // Rotate toward nearest 90° orientation to avoid multiple spins
        const quarter = Math.PI/2
        const target = Math.round(die.angle / quarter) * quarter
        const diff = target - die.angle
        die.angle += diff * 0.35
        if (Math.abs(diff) < 0.01) die.angle = target
      }
      drawDie(ctx, die.x, die.y, die.size, die.face, die.angle)
      if (phase==='settle') {
        const groundY = H - 16 - die.size
        const settled = Math.abs(die.y - groundY) < 0.5 && die.angle === 0 && Math.abs(die.vx) < 0.02 && Math.abs(die.vy) < 0.02
        if (settled || (performance.now() - settleStart > 1500)) {
          cancelAnimationFrame(diceAnimRef.current); setDiceRolling(false); setDiceValue(die.face); return
        }
      }
      diceAnimRef.current=requestAnimationFrame(loop)
    }
    diceAnimRef.current=requestAnimationFrame(loop)
  }

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
                { /*
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
               */ }
                <img src="/p15.JPG" alt="Image 15" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p16.JPG" alt="Image 16" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                { /* <img src="/p17.JPG" alt="Image 17" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p18.JPG" alt="Image 18" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                <img src="/p19.JPG" alt="Image 19" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
                  */ }
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
        <h1 style = {{ margin: '0 0 3rem 0 '}}>🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳 &nbsp;L E T ' S  &nbsp; C O O K&nbsp; 🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳🧑‍🍳</h1>

        {/* Dice prediction demo */}
        <div className="dice-section" style={{ marginTop: '5rem', marginBottom: '10rem' }}>
          <h2>We Are Prediction Engines</h2>
          <p className="section-description">Does anyone want to bet on a 7 or 9?</p>
          <div className="dice-controls" style={{ marginBottom: '0.75rem' }}>
            <button className="action-button" onClick={startDiceRoll} disabled={diceRolling}>
              {diceRolling ? <span className="spinner" /> : null}
              {diceRolling ? 'Shaking & Pouring…' : 'Shake & Pour'}
            </button>
          </div>
          <div className="dice-canvas-wrap">
            <canvas ref={diceCanvasRef} className="dice-canvas" width={680} height={160} />
          </div>
          {diceValue != null ? (
            <div className="dice-caption">Result: <strong>{diceValue}</strong></div>
          ) : null}
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
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Born in the 1970s</h3>
              <div className="names-columns">
                <div className="names-list male">
                  <h4>Boy Names</h4>
                  <div className="names-toggle-row">
                    <button className="names-toggle" onClick={() => setShow1970sMale(v => !v)}>
                      {show1970sMale ? 'Hide ↑' : 'Reveal ↓'}
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
                  <h4>Girl Names</h4>
                  <div className="names-toggle-row">
                    <button className="names-toggle" onClick={() => setShow1970sFemale(v => !v)}>
                      {show1970sFemale ? 'Hide ↑' : 'Reveal ↓'}
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
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Born in the 2000s</h3>
              <div className="names-columns">
                <div className="names-list male">
                  <h4>Boy Names</h4>
                  <div className="names-toggle-row">
                    <button className="names-toggle" onClick={() => setShow2000sMale(v => !v)}>
                      {show2000sMale ? 'Hide ↑' : 'Reveal ↓'}
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
                  <h4>Girl Names</h4>
                  <div className="names-toggle-row">
                    <button className="names-toggle" onClick={() => setShow2000sFemale(v => !v)}>
                      {show2000sFemale ? 'Hide ↑' : 'Reveal ↓'}
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

        <div className="names-section" style={{ marginTop: '10rem' }}>
        {/* Proverbs Peek Section */}
        <h2>Guess The Saying</h2>
        <p className="section-description">Common knowledge comes from lived experience.</p>
        <div className="proverbs-section">
          <div className="names-controls" style={{ marginBottom: '0.75rem' }}>
            <label htmlFor="prov-lang" style={{ color: 'white' }}>Country:</label>
            <select id="prov-lang" value={proverbLang} onChange={(e) => setProverbLang(e.target.value)}>
              <option value="USA">🇺🇸 United States</option>
              <option value="Brazil">🇧🇷 Brazil</option>
            </select>
            <button className="names-toggle" onClick={() => pickRandomProverb(proverbLang)}>Next Proverb</button>
          </div>
          <div 
            className="proverb-stage" 
            ref={stageRef}
            onMouseMove={onDragMove}
            onMouseUp={onDragEnd}
            onMouseLeave={onDragEnd}
            onTouchMove={onDragMove}
            onTouchEnd={onDragEnd}
          >
            <div className="proverb-text">
              {proverbLang === 'Brazil' ? currentProverb?.pt : currentProverb?.text}
            </div>
            <div className="proverb-mask" style={{ width: `calc(100% - ${Math.max(0, revealPx)}px)` }} />
            <div 
              className="proverb-handle" 
              style={{ left: revealPx }} 
              onMouseDown={onDragStart}
              onTouchStart={onDragStart}
            >
              ⇆
            </div>
          </div>
          {proverbLang === 'Brazil' && currentProverb ? (
            <div className="proverb-meta">
              <div className="proverb-translation"><strong>Translation:</strong> {currentProverb.en}</div>
              <div className="proverb-meaning"><strong>Meaning:</strong> {currentProverb.meaning || currentProverb.en}</div>
            </div>
          ) : null}
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
  const [temperature, setTemperature] = useState(0.1);
  const [topP, setTopP] = useState(.1);
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

  const displayTok = (t) => {
    if (t == null) return '';
    try {
      if (/^\s*$/.test(t)) return '<sp>';
    } catch {}
    return t;
  };

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
          <div className="completion-result logprob-dark" style={{ marginBottom: '1rem' }}>
            <div className="completion-text logprob-text">{result.content}</div>
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
                        <div className="score-value logprob-emitted">{displayTok(p.emitted)}</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.25rem' }}>
                        {p.dist.map((e, idx) => (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px', gap: '0.5rem', alignItems: 'center' }}>
                            <div className="token-chip" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayTok(e.token)}</div>
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
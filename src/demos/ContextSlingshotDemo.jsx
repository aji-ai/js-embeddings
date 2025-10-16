import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

function ContextSlingshotDemo() {
  const [unstructuredText, setUnstructuredText] = useState(`Hey Sarah! Just wanted to update you on my recent move. I finally found a place in downtown Seattle - it's a 2-bedroom apartment on Pine Street, unit 4B. The rent is $2,400 a month which is pretty steep but worth it for the location. My new phone number is 206-555-0123 in case you need to reach me. The lease started on March 15th and I'll be here for at least a year. 

  Oh, and I started a new job at TechFlow Solutions as a Senior Software Engineer. The pay is great - $145,000 annually plus benefits. My manager is Jennifer Chen and she seems really cool. The office is just a 10-minute walk from my apartment which is perfect!

  By the way, my birthday is coming up on August 22nd - I'm turning 29 this year. Maybe we can plan something? Also, I need to update my emergency contact info everywhere. Can you help me remember to change it to my brother Mike? His number is 415-555-0987.

  Talk soon!
  Alex`);

  const [extractionPrompt, setExtractionPrompt] = useState("Extract personal and professional information to fill out a contact form");
  
  const [structuredResult, setStructuredResult] = useState(null);
  const [jsonResult, setJsonResult] = useState(null);
  const [executableCode, setExecutableCode] = useState(null);
  const [loading, setLoading] = useState({ structured: false, json: false, executable: false });
  const [showResults, setShowResults] = useState(false);

  // ==== Simulated Agent Tools & Planner State ====
  const [simDb, setSimDb] = useState({ customers: [], events: [], messages: [], weather_logs: [] });
  const [agentLogs, setAgentLogs] = useState([]); // general audit log entries

  // Tool picker state
  const [enabledTools, setEnabledTools] = useState({ simDB: true, messenger: true, clock: true, weather: true });
  const [taskInput, setTaskInput] = useState("Add a new customer named Alex Chen");
  const [pickerLoading, setPickerLoading] = useState(false);
  const [selectionResult, setSelectionResult] = useState(null); // { toolName, parameters, rationale }
  const [executionResult, setExecutionResult] = useState(null); // { ok, data }

  // Planner state
  const scenarios = [
    {
      id: 'customer_welcome',
      title: 'Add customer and send welcome',
      text: 'Add a new customer named Jordan Lee with email jordan@example.com to the customers table and send a brief welcome message introducing the premium plan.'
    },
    {
      id: 'standup_reminder',
      title: "Schedule today's standup and notify",
      text: "Schedule a reminder for today's 3 PM standup and notify the #eng channel with a short note."
    },
    {
      id: 'picnic_planner',
      title: 'Plan Seattle picnic on Saturday',
      text: 'For a Saturday picnic in Seattle, check weather, schedule a 9 AM reminder for shopping, and notify the #friends channel.'
    },
    {
      id: 'log_weather_and_notify',
      title: 'Log weather and notify me',
      text: 'Log the current temperature for Boston in the weather_logs table, then notify me at me@example.com with the temperature.'
    }
  ];
  const [selectedScenario, setSelectedScenario] = useState(scenarios[0].id);
  const [planLoading, setPlanLoading] = useState(false);
  const [planObject, setPlanObject] = useState(null); // { planTitle, steps: [...] }
  const [planLogs, setPlanLogs] = useState([]); // per-step execution logs
  const [planRunning, setPlanRunning] = useState(false);
  const [logExpanded, setLogExpanded] = useState({}); // { indexKey: boolean }
  const [showDbState, setShowDbState] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(true);

  useEffect(() => {
    // ensure logs do not grow unbounded in demo
    if (agentLogs.length > 500) {
      setAgentLogs(prev => prev.slice(-400));
    }
  }, [agentLogs]);

  // ==== Simulated Tools Registry ====
  const toolsRegistry = {
    simDB: {
      id: 'simDB',
      name: 'simDB',
      description: 'In-memory database with tables: customers, events, messages, weather_logs. Supports insert, find, update.',
      paramsSchema: {
        action: "insert | find | update",
        table: "customers | events | messages | weather_logs",
        data: { note: 'object for insert' },
        query: { note: 'object for find/update match' },
        update: { note: 'object for update fields' }
      },
      execute: async (params) => {
        const { action, table, data, query, update } = params || {};
        const validTables = ['customers', 'events', 'messages', 'weather_logs'];
        if (!validTables.includes(table)) throw new Error(`Invalid table: ${table}`);

        let opResult = null;

        setSimDb(prev => {
          const next = { ...prev, [table]: [...(prev[table] || [])] };
          if (action === 'insert') {
            const record = { id: `${table}-${Date.now()}`, ...data, created_at: new Date().toISOString() };
            next[table].push(record);
            opResult = { inserted: 1, record };
          } else if (action === 'find') {
            const rows = next[table].filter(r => matchesQuery(r, query));
            opResult = { rows, rowCount: rows.length };
          } else if (action === 'update') {
            let count = 0;
            next[table] = next[table].map(r => {
              if (matchesQuery(r, query)) { count++; return { ...r, ...update, updated_at: new Date().toISOString() }; }
              return r;
            });
            opResult = { updated: count };
          } else {
            throw new Error(`Unsupported action: ${action}`);
          }
          return next;
        });

        appendLog(`[simDB] ${action} on ${table}`, { params, result: opResult });
        return { ok: true, data: opResult };
      }
    },
    messenger: {
      id: 'messenger',
      name: 'messenger',
      description: 'Message sender simulator for email/SMS/Slack. Logs messages with timestamps.',
      paramsSchema: {
        to: 'email | phone | #channel',
        subject: 'string (optional)',
        message: 'string',
        channel: 'email | sms | slack (optional)',
        priority: 'low | normal | high (optional)'
      },
      execute: async (params) => {
        const entry = { id: `msg-${Date.now()}`, ...params, sent_at: new Date().toISOString() };
        setSimDb(prev => ({ ...prev, messages: [...(prev.messages || []), entry] }));
        appendLog('[messenger] sent', entry);
        return { ok: true, data: { messageId: entry.id } };
      }
    },
    clock: {
      id: 'clock',
      name: 'clock',
      description: 'Clock and scheduler. Returns current time or schedules reminders as events.',
      paramsSchema: {
        when: "'now' | natural text like 'tomorrow 9 AM' | ISO string",
        title: 'string (optional)',
        note: 'string (optional)'
      },
      execute: async (params) => {
        const { when, title = 'Reminder', note } = params || {};
        const scheduledFor = parseWhen(when);
        const event = { id: `evt-${Date.now()}`, title, note, scheduled_for: scheduledFor.toISOString() };
        setSimDb(prev => ({ ...prev, events: [...(prev.events || []), event] }));
        appendLog('[clock] scheduled', event);
        return { ok: true, data: { eventId: event.id, scheduled_for: event.scheduled_for } };
      }
    },
    weather: {
      id: 'weather',
      name: 'weather',
      description: 'Random-weather oracle. Deterministic per location+date seed.',
      paramsSchema: {
        location: 'city or place name',
        date: 'ISO date (optional, defaults today)'
      },
      execute: async (params) => {
        const { location, date } = params || {};
        if (!location) throw new Error('location is required');
        const d = date ? new Date(date) : new Date();
        const seed = hashString(`${location}:${d.toISOString().slice(0,10)}`);
        const temp = Math.round(10 + (seed % 2000) / 100); // 10..30 C
        const conditions = ['Sunny', 'Partly Cloudy', 'Overcast', 'Showers', 'Thunderstorms', 'Windy'];
        const condition = conditions[Math.abs(seed) % conditions.length];
        const record = { id: `wx-${Date.now()}`, location, date: d.toISOString().slice(0,10), temp_c: temp, condition };
        setSimDb(prev => ({ ...prev, weather_logs: [...(prev.weather_logs || []), record] }));
        appendLog('[weather] queried', record);
        return { ok: true, data: record };
      }
    }
  };

  function appendLog(message, payload) {
    setAgentLogs(prev => [...prev, { ts: new Date().toISOString(), message, payload }]);
  }

  function matchesQuery(row, query) {
    if (!query || typeof query !== 'object') return true;
    return Object.keys(query).every(k => row[k] === query[k]);
  }

  function parseWhen(spec) {
    if (!spec || spec === 'now') return new Date();
    const lower = String(spec).toLowerCase();
    if (lower.includes('tomorrow')) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const m = lower.match(/(\d{1,2})\s*(am|pm)/);
      if (m) {
        let hour = parseInt(m[1], 10) % 12;
        if (m[2] === 'pm') hour += 12;
        d.setHours(hour, 0, 0, 0);
      } else {
        d.setHours(9, 0, 0, 0);
      }
      return d;
    }
    const dt = new Date(spec);
    return isNaN(dt.getTime()) ? new Date() : dt;
  }

  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return h >>> 0;
  }

  function toggleTool(key) {
    setEnabledTools(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function resetDatabase() {
    setSimDb({ customers: [], events: [], messages: [], weather_logs: [] });
    appendLog('[simDB] reset', { tables: ['customers', 'events', 'messages', 'weather_logs'] });
  }

  function renderDbTables(db) {
    const tables = [
      { name: 'customers', rows: db.customers },
      { name: 'events', rows: db.events },
      { name: 'messages', rows: db.messages },
      { name: 'weather_logs', rows: db.weather_logs },
    ];
    return (
      <div className="db-tables" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {tables.map(t => (
          <div key={t.name} className="db-table">
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{t.name} ({t.rows.length})</div>
            {t.rows.length === 0 ? (
              <div className="muted">empty</div>
            ) : (
              <div className="vectors-scroll" style={{ maxHeight: '200px' }}>
                <table className="simple-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '0.85rem', lineHeight: 1.2 }}>
                  <thead>
                    <tr>
                      {Object.keys(t.rows[0]).map(col => (
                        <th
                          key={col}
                          style={{
                            textAlign: 'left',
                            padding: '3px 5px',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            fontSize: '0.85rem',
                            letterSpacing: '0.01em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={col}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((row, i) => (
                      <tr key={i}>
                        {Object.keys(t.rows[0]).map(col => {
                          const value = String(row[col]);
                          return (
                            <td
                              key={col}
                              style={{
                                padding: '3px 5px',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                fontSize: '0.8rem',
                                lineHeight: 1.2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={value}
                            >
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // ==== Agent Tool Picker handlers ====
  const handleSelectToolAndRun = async () => {
    try {
      setPickerLoading(true);
      setSelectionResult(null);
      setExecutionResult(null);

      const enabledKeys = Object.keys(enabledTools).filter(k => enabledTools[k]);
      if (enabledKeys.length === 0) {
        setSelectionResult({ error: 'No tools enabled' });
        setPickerLoading(false);
        return;
      }

      const enabledDefs = enabledKeys.map(k => toolsRegistry[k]);
      const enabledDesc = enabledDefs.map(t => `- ${t.name}: ${t.description}. Parameters: ${JSON.stringify(t.paramsSchema)}`).join('\n');
      const prompt = `You are an agent router. Given this user request, choose EXACTLY ONE tool from the enabled list and fill parameters.\n\nEnabled tools:\n${enabledDesc}\n\nOutput ONLY this JSON object with no extra text:\n{"toolName": string, "parameters": object, "rationale": string}`;

      const raw = await handleExtractJSON({ text: taskInput, prompt });
      let parsed = null;
      try { parsed = JSON.parse(raw); } catch (e) { /* keep null */ }
      if (!parsed || typeof parsed !== 'object') {
        setSelectionResult({ error: 'Model did not return valid JSON', raw });
        setPickerLoading(false);
        return;
      }

      setSelectionResult(parsed);
      const { toolName, parameters } = parsed;
      if (!toolName || !toolsRegistry[toolName]) {
        setExecutionResult({ ok: false, error: `Unknown tool: ${toolName}` });
        setPickerLoading(false);
        return;
      }
      if (!enabledTools[toolName]) {
        setExecutionResult({ ok: false, error: `Tool disabled: ${toolName}` });
        setPickerLoading(false);
        return;
      }

      try {
        const result = await toolsRegistry[toolName].execute(parameters || {});
        setExecutionResult(result);
      } catch (err) {
        setExecutionResult({ ok: false, error: String(err && err.message ? err.message : err) });
      }
      setPickerLoading(false);
    } catch (e) {
      setPickerLoading(false);
      setSelectionResult({ error: String(e) });
    }
  };

  // ==== Planner handlers ====
  const handleCreatePlan = async () => {
    try {
      setPlanLoading(true);
      setPlanObject(null);
      setPlanLogs([]);

      const scenario = scenarios.find(s => s.id === selectedScenario) || scenarios[0];
      const enabledKeys = Object.keys(enabledTools).filter(k => enabledTools[k]);
      const enabledDefs = enabledKeys.map(k => toolsRegistry[k]);
      const enabledDesc = enabledDefs.map(t => `- ${t.name}: ${t.description}. Parameters: ${JSON.stringify(t.paramsSchema)}`).join('\n');
      const schemaLine = '{"planTitle": string, "steps": [{"step": number, "description": string, "toolName": string, "parameters": object}] }';

      const prompt = `You are an expert planner. Task: "${scenario.text}"\nEnabled tools:\n${enabledDesc}\n\nProduce a minimal, correct plan as STRICT JSON with this schema only:\n${schemaLine}\nNo prose, no markdown, JSON only.`;

      const raw = await handleExtractJSON({ text: scenario.text, prompt });
      let parsed = null;
      try { parsed = JSON.parse(raw); } catch (e) { /* keep null */ }
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.steps)) {
        setPlanObject(null);
        setPlanLogs([{ step: 0, status: 'error', message: 'Invalid plan JSON', data: { raw } }]);
        setPlanLoading(false);
        return;
      }
      setPlanObject(parsed);
      setPlanLoading(false);
    } catch (e) {
      setPlanObject(null);
      setPlanLogs([{ step: 0, status: 'error', message: String(e) }]);
      setPlanLoading(false);
    }
  };

  const runPlan = async () => {
    if (!planObject || !Array.isArray(planObject.steps)) return;
    setPlanRunning(true);
    setPlanLogs([]);
    try {
      // Execute steps in ascending order of step number
      const steps = [...planObject.steps].sort((a, b) => (a.step || 0) - (b.step || 0));
      for (const s of steps) {
        const toolName = s.toolName;
        if (!toolName || !toolsRegistry[toolName]) {
          setPlanLogs(prev => [...prev, { step: s.step, status: 'skipped', message: `Unknown tool: ${toolName}` }]);
          continue;
        }
        if (!enabledTools[toolName]) {
          setPlanLogs(prev => [...prev, { step: s.step, status: 'skipped', message: `Tool disabled: ${toolName}` }]);
          continue;
        }
        try {
          const res = await toolsRegistry[toolName].execute(s.parameters || {});
          setPlanLogs(prev => [...prev, { step: s.step, status: res.ok ? 'ok' : 'error', message: s.description || toolName, data: res }]);
        } catch (err) {
          setPlanLogs(prev => [...prev, { step: s.step, status: 'error', message: s.description || toolName, data: { error: String(err && err.message ? err.message : err) } }]);
        }
      }
    } finally {
      setPlanRunning(false);
    }
  };

  const demonstrateContextSlingshot = async () => {
    setLoading({ structured: true, json: true, executable: true });
    setStructuredResult(null);
    setJsonResult(null);
    setExecutableCode(null);
    setShowResults(true);

    try {
      // Step 1: Extract structured information in human-readable format
      console.log("Step 1: Extracting structured information...");
      const structuredResponse = await fetch('/api/extract-structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: unstructuredText,
          prompt: extractionPrompt,
          format: 'structured'
        })
      });

      if (structuredResponse.ok) {
        const structuredData = await structuredResponse.json();
        setStructuredResult(structuredData.extraction);
        setLoading(prev => ({ ...prev, structured: false }));
      }

      // Step 2: Extract same information as JSON
      console.log("Step 2: Converting to JSON format...");
      const jsonResponse = await fetch('/api/extract-structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: unstructuredText,
          prompt: extractionPrompt,
          format: 'json'
        })
      });

      if (jsonResponse.ok) {
        const jsonData = await jsonResponse.json();
        setJsonResult(jsonData.extraction);
        setLoading(prev => ({ ...prev, json: false }));
      }

      // Step 3: Generate executable code
      console.log("Step 3: Generating executable code...");
      const executableResponse = await fetch('/api/extract-structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: unstructuredText,
          prompt: extractionPrompt,
          format: 'executable'
        })
      });

      if (executableResponse.ok) {
        const executableData = await executableResponse.json();
        setExecutableCode(executableData.extraction);
        setLoading(prev => ({ ...prev, executable: false }));
      }

    } catch (error) {
      console.error('Error in context slingshot demonstration:', error);
      setLoading({ structured: false, json: false, executable: false });
      alert('Error during demonstration. Please check the console.');
    }
  };

  const examples = [
    {
      title: "Personal Contact Information",
      text: `Hey Sarah! Just wanted to update you on my recent move. I finally found a place in downtown Seattle - it's a 2-bedroom apartment on Pine Street, unit 4B. The rent is $2,400 a month which is pretty steep but worth it for the location. My new phone number is 206-555-0123 in case you need to reach me. The lease started on March 15th and I'll be here for at least a year. 

Oh, and I started a new job at TechFlow Solutions as a Senior Software Engineer. The pay is great - $145,000 annually plus benefits. My manager is Jennifer Chen and she seems really cool. The office is just a 10-minute walk from my apartment which is perfect!

By the way, my birthday is coming up on August 22nd - I'm turning 29 this year. Maybe we can plan something? Also, I need to update my emergency contact info everywhere. Can you help me remember to change it to my brother Mike? His number is 415-555-0987.

Talk soon!
Alex`,
      extractionGoal: "Extract personal and professional information to fill out a contact form"
    },
    {
      title: "Customer Support Ticket",
      text: `Customer called in frustrated about their recent order. Jane Morrison from Portland, Oregon placed order #ORD-789123 on December 3rd for a wireless headset (model WH-2000) priced at $299.99. She paid with her Visa ending in 4567. The item was supposed to arrive by December 10th but never showed up. Tracking shows it's stuck in transit since December 8th. Customer wants either a full refund to her original payment method or immediate replacement with expedited shipping at no extra cost. Her phone number is 503-555-0156 and email is jane.morrison@email.com. She mentioned she's a Premium member since 2019 and this is her first issue. Very apologetic tone, clearly values the relationship.`,
      extractionGoal: "Extract customer service ticket details for support system database"
    },
    {
      title: "Email Function Calling",
      text: `Please send an email to john.doe@company.com with the subject 'Project Update' and tell him that the Q2 roadmap is complete and ready for review. CC sarah.manager@company.com on this email. Also, set the priority to high and schedule it to be sent tomorrow at 9 AM.`,
      extractionGoal: "Extract email parameters to call sendEmail() function with proper API parameters"
    },
    {
      title: "Calendar API Scheduling",
      text: `I need to schedule a team meeting for next Tuesday from 2 PM to 4 PM in Conference Room B. The meeting is about Q3 planning and I need to invite the product team: emma@company.com, david@company.com, and sarah@company.com. Please set a reminder 15 minutes before the meeting and make it a recurring weekly meeting for the next 8 weeks.`,
      extractionGoal: "Extract calendar event details to call Google Calendar API for meeting creation"
    },
    {
      title: "Database User Registration",
      text: `New customer registration: Mary Johnson, age 34, lives at 123 Oak Street, Denver CO 80203. Email is mary.j@email.com, phone number 303-555-0199. She's interested in our premium plan and mentioned she found us through Google ads. Her preferred contact method is email and she wants to receive our weekly newsletter.`,
      extractionGoal: "Extract customer information to insert new record into users database table"
    },
    {
      title: "Expense Report Processing",
      text: `Trip to San Francisco for the tech conference last week. Flew out Tuesday morning on United flight 1247, returned Thursday evening. Hotel was the Marriott downtown, stayed 2 nights at $189 per night plus taxes. Conference registration was $450. Had dinner meetings with clients - Tuesday at Zuni Cafe ($127 including tip), Wednesday at State Bird Provisions ($156). Took Uber from airport both ways - $45 to hotel, $52 back to SFO. Picked up some office supplies at Staples while there - $23 for notebooks and pens.`,
      extractionGoal: "Extract expense items to create database records and call accounting API for reimbursement processing"
    },
    {
      title: "Slack Bot Commands",
      text: `Hey everyone! Can someone please update the #general channel topic to say 'Welcome to Q4 - Let's make it great!' and also pin the message I just posted about the new vacation policy. Also, remind @sarah and @mike about the 3 PM standup meeting today. Thanks!`,
      extractionGoal: "Extract Slack commands to call Slack API methods for channel management and notifications"
    }
  ];

  const handleExampleChange = (exampleIndex) => {
    if (exampleIndex !== "") {
      const selectedExample = examples[exampleIndex];
      setUnstructuredText(selectedExample.text);
      setExtractionPrompt(selectedExample.extractionGoal);
    }
  };



  return (
    <div className="context-slingshot-demo">
      <section className="section">
        <h2>🧽 Unstructured to Structured Data</h2>
        <p className="section-description">
          Watch AI absorb messy, unstructured text and squeeze out perfectly organized data - 
          powering forms, databases, function calls, and more.
        </p>

        <div className="slingshot-explanation">
          <div className="transformation-flow">
            <div className="flow-step unstructured">
              <h3>🫠 Unstructured Text</h3>
              <p>Messy, human-written content with information scattered throughout</p>
            </div>
            <div className="slingshot-arrow">🧽</div>
            <div className="flow-step structured">
              <h3>👔 Structured Data</h3>
              <p>Organized, machine-readable format ready for systems integration</p>
            </div>
          </div>
        </div>

        <div className="demo-controls">
          <div className="input-section">
            <div className="input-group">
            <h3>Unstructured Text Input</h3>
            <div className="section-header">
                <label htmlFor="unstructuredInput">Input:</label>
                <select 
                  onChange={(e) => handleExampleChange(e.target.value)}
                  className="example-selector"
                >
                  <option value="">Load Example...</option>
                  {examples.map((example, index) => (
                    <option key={index} value={index}>{example.title}</option>
                  ))}
                </select>
              </div>
              <textarea
                id="unstructuredInput"
                rows="8"
                value={unstructuredText}
                onChange={(e) => setUnstructuredText(e.target.value)}
                placeholder="Enter unstructured text that contains information you want to extract..."
                className="unstructured-input"
                style={{ backgroundColor: '#000', color: '#fff', fontSize: '1.1rem', padding: '4rem 5.25rem 4rem 5.25rem' }}
              />
            </div>
<h3>Extraction Goal</h3>
            <div className="input-group">
              <input
                type="text"
                id="extractionPromptInput"
                value={extractionPrompt}
                onChange={(e) => setExtractionPrompt(e.target.value)}
                placeholder="Describe what information you want to extract..."
                className="extraction-input"
                style={{ backgroundColor: '#000', color: '#fff', fontSize: '1.1rem', padding: '1rem 1.25rem' }}
              />
            </div>
          </div>
        </div>

        <button onClick={demonstrateContextSlingshot} className="action-button slingshot-button" disabled={loading.structured || loading.json || loading.executable}>
          {(loading.structured || loading.json || loading.executable) ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : (
            'Squeeze the Sponge'
          )}
        </button>

        {showResults && (
          <div className="slingshot-results">
            <div className="results-comparison two-column">
              <div className="result-section form-result">
                <h3>📋 Human-Readable Structure</h3>
                <p className="explanation">Perfect for forms, reports, and human review</p>
                
                <div className="result-container">
                  {loading.structured ? (
                    <div className="loading">Extracting structured information...</div>
                  ) : (
                    <div className="structured-output">
                      {structuredResult ? (
                        <div className="markdown-content">
                          <ReactMarkdown>{structuredResult}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="waiting">Waiting for extraction...</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="result-section json-result">
                <h3>🔧 JSON Format</h3>
                <p className="explanation">Ready for APIs, databases, and function calls</p>
                
                <div className="result-container">
                  {loading.json ? (
                    <div className="loading">Converting to JSON...</div>
                  ) : (
                    <div className="json-output">
                      {jsonResult ? (
                        <pre className="json-text">{typeof jsonResult === 'string' ? jsonResult : JSON.stringify(jsonResult, null, 2)}</pre>
                      ) : (
                        <div className="waiting">Waiting for JSON conversion...</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="executable-section">
              <div className="result-section executable-result">
                <h3>⚡ Executable Code</h3>
                <p className="explanation">Actual SQL queries, API calls, and function invocations</p>
                
                <div className="result-container">
                  {loading.executable ? (
                    <div className="loading">Generating executable code...</div>
                  ) : (
                    <div className="executable-output">
                      {executableCode ? (
                        <div className="markdown-content executable-markdown">
                          <ReactMarkdown>{executableCode}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="waiting">Waiting for code generation...</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lilian Weng quote to introduce Agent world */}
        <div className="einstein-quote" style={{ marginTop: '1.5rem' }}>
          <blockquote>
            Agent 🤖️ = LLM 💬 + memory 🧠 + planning skills 📝 + Tool use 🧰
          </blockquote>
          <cite>—Lilian Weng, Co-founder @ Thinking Machines Lab</cite>
        </div>

        {/* === Agent Tool Picker === */}
        <div className="result-section" style={{ marginTop: '2rem' }}>
          <h3>🧰 Agent Tool Picker</h3>
          <p className="explanation">Enable tools, let AI pick one via structured JSON, then execute it safely.</p>

          <div className="controls">
            <div className="input-group">
              <label>Enabled Tools:</label>
              <div className="tool-toggles" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {Object.keys(toolsRegistry).map(key => {
                  const tool = toolsRegistry[key];
                  const checked = !!enabledTools[key];
                  return (
                    <div
                      key={key}
                      className="tool-card"
                      style={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '0.75rem 0.9rem',
                        background: 'rgba(255,255,255,0.03)',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleTool(key)}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="tool-name" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', textTransform: 'none', letterSpacing: 'normal' }}>
                          <tt>{tool.name}</tt>
                        </div>
                        <input
                          id={`toggle-${key}`}
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setEnabledTools(prev => ({ ...prev, [key]: e.target.checked }))}
                          aria-label={`Enable ${tool.name}`}
                          onClick={(e) => { e.stopPropagation(); }}
                        />
                      </div>
                      <div className="tool-desc" style={{ opacity: 0.85, marginTop: '0.35rem', textTransform: 'none', letterSpacing: 'normal' }}>
                        {tool.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="agentTask">User Request:</label>
              <input
                id="agentTask"
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Describe what you want the agent to do..."
                style={{ backgroundColor: '#000', color: '#fff', fontSize: '1.1rem', padding: '1rem 1.25rem' }}
              />
            </div>

            <button className="action-button" onClick={handleSelectToolAndRun} disabled={pickerLoading}>
              {pickerLoading ? (<><span className="spinner"></span> Selecting & Running...</>) : 'Select Tool & Run'}
            </button>
          </div>

          {(selectionResult || executionResult) && (
            <div className="result-container" style={{ marginTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="json-output">
                  <h4>Selection</h4>
                  <pre className="json-text">{JSON.stringify(selectionResult || {}, null, 2)}</pre>
                </div>
                <div className="json-output">
                  <h4>Execution Result</h4>
                  <pre className="json-text">{JSON.stringify(executionResult || {}, null, 2)}</pre>
                </div>
              </div>
              <div className="json-output" style={{ marginTop: '1rem' }}>
                <div className="input-group" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="action-button" onClick={resetDatabase}>Reset Database</button>
                  <button
                    type="button"
                    onClick={() => setShowDbState(v => !v)}
                    style={{
                      background: 'transparent',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.25)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    {showDbState ? 'Hide Database State' : 'Show Database State'}
                  </button>
                </div>

                {showDbState && (
                  <>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', margin: '1rem 0' }}></div>
                    <div className="json-output" style={{ marginTop: '0.25rem' }}>
                      <h4>Database State</h4>
                      {renderDbTables(simDb)}
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', margin: '1rem 0' }}></div>
                  </>
                )}

                {agentLogs && agentLogs.length > 0 && (
                  <div className="json-output" style={{ marginTop: '0.75rem' }}>
                    <div className="section-header" style={{ marginBottom: '0.75rem' }}>
                      <h4 style={{ margin: 0 }}>Audit Log</h4>
                      <button
                        type="button"
                        onClick={() => setShowAuditLog(v => !v)}
                        style={{
                          background: 'transparent',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.25)',
                          borderRadius: '6px',
                          padding: '0.35rem 0.6rem',
                          cursor: 'pointer'
                        }}
                      >
                        {showAuditLog ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {showAuditLog && (
                      <div className="vectors-scroll">
                        {agentLogs.slice(-20).map((l, i) => {
                          const key = `${l.ts}-${i}`;
                          const expanded = !!logExpanded[key];
                          return (
                            <div key={key} className="result-item" style={{ marginBottom: '0.5rem' }}>
                              <div className="result-header clickable" onClick={() => setLogExpanded(prev => ({ ...prev, [key]: !expanded }))} title={expanded ? 'Collapse' : 'Expand'}>
                                <span className="result-rank">{new Date(l.ts).toLocaleTimeString()}</span>
                                <div className="result-meta"><span className="result-similarity">{l.message}</span></div>
                              </div>
                              {expanded && (
                                <pre className="json-text" style={{ marginTop: '0.25rem' }}>{JSON.stringify(l.payload, null, 2)}</pre>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* === Agent Multi-step Planner === */}
        <div className="result-section" style={{ marginTop: '2rem' }}>
          <h3>🧭 Agent Multi-step Planner</h3>
          <p className="explanation">Create a plan (strict JSON) and execute steps sequentially with the enabled tools.</p>

          <div className="controls">
            <div className="input-group">
              <label htmlFor="scenarioSelect">Scenario:</label>
              <select
                id="scenarioSelect"
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="example-selector"
              >
                {scenarios.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ display: 'flex', gap: '1rem' }}>
              <button className="action-button" onClick={handleCreatePlan} disabled={planLoading}>
                {planLoading ? (<><span className="spinner"></span> Creating Plan...</>) : 'Create Plan'}
              </button>
              <button className="action-button" onClick={runPlan} disabled={!planObject || planRunning}>
                {planRunning ? (<><span className="spinner"></span> Running...</>) : 'Run Plan'}
              </button>
            </div>
          </div>

          {(planObject || planLogs.length > 0) && (
            <div className="result-container" style={{ marginTop: '1rem' }}>
              {planObject && (
                <div className="json-output" style={{ marginBottom: '1rem' }}>
                  <h4>Plan</h4>
                  <pre className="json-text">{JSON.stringify(planObject, null, 2)}</pre>
                </div>
              )}
              {planLogs.length > 0 && (
                <div className="json-output">
                  <h4>Execution Log</h4>
                  <div className="vectors-scroll">
                    {planLogs.map((l, i) => (
                      <div key={i} className="result-item" style={{ marginBottom: '0.5rem' }}>
                        <div className="result-header"><span className="result-rank">Step {l.step}</span> <span className="result-similarity">{l.status}</span></div>
                        <div className="result-content">{l.message}</div>
                        {l.data && <pre className="json-text" style={{ marginTop: '0.25rem' }}>{JSON.stringify(l.data, null, 2)}</pre>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default ContextSlingshotDemo 

// ==== Helper actions: Tool Picker and Planner handlers ====
async function handleExtractJSON({ text, prompt }) {
  const response = await fetch('/api/extract-structured', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, prompt, format: 'json' })
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return typeof data.extraction === 'string' ? data.extraction : JSON.stringify(data.extraction);
}

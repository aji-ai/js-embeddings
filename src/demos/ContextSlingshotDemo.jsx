import { useState } from 'react'
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
      </section>
    </div>
  )
}

export default ContextSlingshotDemo 
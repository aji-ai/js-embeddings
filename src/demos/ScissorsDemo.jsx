import { useState, useRef } from 'react'

function ScissorsDemo() {
  const [chatHistory, setChatHistory] = useState([
    "I've been working on a machine learning project about image recognition for medical diagnostics.",
    "The dataset includes X-ray images of lungs with various conditions like pneumonia and COVID-19.",
    "We're using convolutional neural networks (CNNs) to classify the different conditions.",
    "The accuracy has improved from 78% to 92% after data augmentation and transfer learning.",
    "One challenge is dealing with class imbalance - we have many more normal cases than abnormal ones.",
    "We implemented SMOTE (Synthetic Minority Oversampling Technique) to balance the dataset.",
    "The radiologists are excited about the potential for this tool to assist in diagnosis.",
    "Next week we're presenting our findings to the hospital administration for potential deployment."
  ]);
  const [currentSentence, setCurrentSentence] = useState("The most challenging aspect of our medical AI project was");
  const [withoutContext, setWithoutContext] = useState("");
  const [withContext, setWithContext] = useState("");
  const [relevantContext, setRelevantContext] = useState([]);
  const [loading, setLoading] = useState({ without: false, with: false });
  const [embeddings, setEmbeddings] = useState(null);
  const [hasCompletedWithoutContext, setHasCompletedWithoutContext] = useState(false);

  // Helper function to remove the original sentence from AI completion
  const cleanCompletion = (completion, originalSentence) => {
    if (!completion) return "";
    
    // Remove the original sentence if it appears at the beginning
    if (completion.toLowerCase().startsWith(originalSentence.toLowerCase())) {
      return completion.substring(originalSentence.length).trim();
    }
    
    return completion;
  };

  const completeWithoutContext = async () => {
    setLoading({ without: true, with: false });
    setWithoutContext("");
    setWithContext("");
    setRelevantContext([]);
    setHasCompletedWithoutContext(false);

    try {
      console.log("Completing sentence without any context...");
      const response = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentSentence,
          context: null
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setWithoutContext(result.completion);
        setHasCompletedWithoutContext(true);
      }
    } catch (error) {
      console.error('Error completing without context:', error);
      alert('Error completing sentence. Please check the console.');
    } finally {
      setLoading(prev => ({ ...prev, without: false }));
    }
  };

  const demonstrateScissors = async () => {
    if (!hasCompletedWithoutContext) {
      alert('Please complete the sentence first to see the comparison!');
      return;
    }

    setLoading(prev => ({ ...prev, with: true }));
    setWithContext("");
    setRelevantContext([]);

    try {
      // Step 1: Get embeddings for sentence and chat history
      console.log("Step 1: Getting embeddings for context matching...");
      const embeddingsResponse = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: [currentSentence, ...chatHistory],
          models: ['text-embedding-3-small']
        })
      });

      if (embeddingsResponse.ok) {
        const embeddingsData = await embeddingsResponse.json();
        setEmbeddings(embeddingsData);

        // Step 2: Find most relevant context using similarity
        console.log("Step 2: Finding relevant context using embeddings...");
        const similarityResponse = await fetch('/api/similarity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: currentSentence,
            documents: chatHistory,
            model: 'text-embedding-3-small'
          })
        });

        if (similarityResponse.ok) {
          const similarityData = await similarityResponse.json();
          // Get top 3 most relevant pieces of context
          const topRelevant = similarityData.slice(0, 3).map(item => ({
            text: item.document,
            similarity: item.similarity
          }));
          setRelevantContext(topRelevant);

          // Step 3: Complete with relevant context (Both blades working together)
          console.log("Step 3: Completing with relevant context...");
          const contextText = topRelevant.map(item => item.text).join('\n');
          const withContextResponse = await fetch('/api/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: currentSentence,
              context: contextText
            })
          });

          if (withContextResponse.ok) {
            const withResult = await withContextResponse.json();
            setWithContext(withResult.completion);
          }
        }
      }

    } catch (error) {
      console.error('Error in scissors demonstration:', error);
      alert('Error during demonstration. Please check the console.');
    } finally {
      setLoading(prev => ({ ...prev, with: false }));
    }
  };

  const addToChatHistory = () => {
    const newMessage = prompt("Add a message to the chat history:");
    if (newMessage && newMessage.trim()) {
      setChatHistory([...chatHistory, newMessage.trim()]);
    }
  };

  const removeChatMessage = (index) => {
    setChatHistory(chatHistory.filter((_, i) => i !== index));
  };

  return (
    <div className="scissors-demo">
      <section className="section">
        <h2>✂️ Herbert Simon's Scissors Model</h2>
        <p className="section-description">
          Demonstrating how cognition and context work together like the two blades of scissors.
        </p>

        <div className="simon-quote">
          <blockquote>
            "Human rational behavior is shaped by a scissors whose two blades are the structure of task environments and the computational capabilities of the actor."
          </blockquote>
          <cite>— Herbert Simon</cite>
        </div>

        <div className="scissors-explanation">
          <div className="blade-explanation">
            <div className="blade cognition-blade">
              <h3>🧠 Cognition Blade</h3>
              <p>The model's computational capabilities - what it can do with the information it receives.</p>
            </div>
            <div className="scissors-symbol">✂️</div>
            <div className="blade context-blade">
              <h3>🌍 Context Blade</h3>
              <p>The structure of the environment - relevant information from past conversations.</p>
            </div>
          </div>
        </div>

        <div className="demo-controls">
          <div className="input-group">
            <label htmlFor="sentenceInput">Sentence to Complete:</label>
            <input
              type="text"
              id="sentenceInput"
              value={currentSentence}
              onChange={(e) => setCurrentSentence(e.target.value)}
              placeholder="Enter a sentence for the model to complete..."
            />
          </div>

          <button onClick={completeWithoutContext} className="action-button">
            Use Just The 🧠 Cognition Blade
          </button>

          {hasCompletedWithoutContext && (
            <div className="initial-completion">
              <h4>🧠 Cognition Only (No Context)</h4>
              <p className="explanation">Model attempts completion with only its training knowledge</p>
              
              <div className="completion-result prominent">
                {loading.without ? (
                  <div className="loading">Thinking without context...</div>
                ) : (
                  <div className="completion-text highlighted">
                    <strong>{currentSentence}</strong> {cleanCompletion(withoutContext, currentSentence)}
                  </div>
                )}
              </div>

              {!loading.without && (
                <div className="scissors-prompt">
                  <p>👆 It's not hallucination when there's no context. It's more 'non sequitur.'</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="chat-history-section">
          <div className="section-header">
            <h3>📚 Chat History (Context Repository)</h3>
            <button onClick={addToChatHistory} className="add-button">+ Add Message</button>
          </div>
          <div className="chat-history">
            {chatHistory.map((message, index) => (
              <div key={index} className="chat-message">
                <span className="message-text">{message}</span>
                <button 
                  onClick={() => removeChatMessage(index)} 
                  className="remove-button"
                  title="Remove message"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {hasCompletedWithoutContext && (
          <button onClick={demonstrateScissors} className="action-button scissors-compare">
            Use Both Blades: 🌍 Context + 🧠 Cognition
          </button>
        )}

        {withContext && (
          <div className="scissors-comparison">
            <div className="comparison-header">
              <h3>✂️ The Scissors Effect: Before vs After</h3>
              <p className="explanation">See how context transforms the completion</p>
            </div>

            <div className="result-comparison">
              <div className="result-section without-context">
                <h4>🧠 Without Context</h4>
                <div className="completion-result">
                  <div className="completion-text">
                    <strong>{currentSentence}</strong> {cleanCompletion(withoutContext, currentSentence)}
                  </div>
                </div>
              </div>

              <div className="result-section with-context">
                <h4>✂️ With Context</h4>
                {relevantContext.length > 0 && (
                  <div className="relevant-context">
                    <h5>🎯 Retrieved Context:</h5>
                    {relevantContext.slice(0, 2).map((item, index) => (
                      <div key={index} className="context-item">
                        <div className="similarity-score">
                          Similarity: {item.similarity.toFixed(3)}
                        </div>
                        <div className="context-text">{item.text}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="completion-result prominent">
                  {loading.with ? (
                    <div className="loading">Thinking with context...</div>
                  ) : (
                    <div className="completion-text highlighted">
                      <strong>{currentSentence}</strong> {cleanCompletion(withContext, currentSentence)}
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

export default ScissorsDemo 
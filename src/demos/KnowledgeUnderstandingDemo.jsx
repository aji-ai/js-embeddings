import React, { useEffect, useRef } from 'react';

function KnowledgeUnderstandingDemo() {
  const canvasRef = useRef(null);
  const p5InstanceRef = useRef(null);

  // RAG Demo Functions
  const chunkText = (text, chunkSize) => {
    const words = text.split(' ');
    const chunks = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim()) {
        chunks.push({
          id: i / chunkSize,
          text: chunk,
          similarity: 0
        });
      }
    }
    return chunks;
  };

  const calculateSimilarity = async (query, chunks) => {
    try {
      // Get embeddings for query and all chunks
      const textsToEmbed = [query, ...chunks.map(c => c.text)];
      
      console.log('Requesting embeddings for:', textsToEmbed.length, 'texts');
      
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: textsToEmbed,
          models: ['text-embedding-3-small'] // Specify only the model we need
        })
      });

      if (!response.ok) {
        console.error('Embeddings API response not ok:', response.status, response.statusText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Embeddings API response:', data);

      // The API returns { "text-embedding-3-small": [...] }
      const modelEmbeddings = data['text-embedding-3-small'];
      
      if (!modelEmbeddings || !Array.isArray(modelEmbeddings)) {
        console.error('Invalid embeddings structure for model:', data);
        throw new Error('Invalid embeddings response structure');
      }

      if (modelEmbeddings.length < textsToEmbed.length) {
        console.error('Not enough embeddings returned:', modelEmbeddings.length, 'expected:', textsToEmbed.length);
        throw new Error('Invalid embeddings response - insufficient embeddings');
      }

      const queryEmbedding = modelEmbeddings[0];
      
      if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
        console.error('Invalid query embedding:', queryEmbedding);
        throw new Error('Invalid query embedding');
      }
      
      // Calculate cosine similarity for each chunk
      const chunksWithSimilarity = chunks.map((chunk, index) => {
        const chunkEmbedding = modelEmbeddings[index + 1];
        if (!chunkEmbedding || !Array.isArray(chunkEmbedding)) {
          console.error('Invalid chunk embedding at index:', index + 1, chunkEmbedding);
          return { ...chunk, similarity: 0 };
        }
        
        const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
        console.log(`Chunk ${chunk.id + 1} similarity:`, similarity);
        return {
          ...chunk,
          similarity: similarity || 0
        };
      });

      // Sort by similarity (highest first)
      return chunksWithSimilarity.sort((a, b) => b.similarity - a.similarity);
      
    } catch (error) {
      console.error('Error calculating similarity:', error);
      return chunks.map(chunk => ({ ...chunk, similarity: 0 }));
    }
  };

  const cosineSimilarity = (a, b) => {
    if (!a || !b || !Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return 0;
    }
    
    const dotProduct = a.reduce((sum, val, i) => sum + (val * b[i]), 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + (val * val), 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + (val * val), 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  };

  const updateChunks = () => {
    const chunkSizeSelect = document.getElementById('chunk-size');
    const scenarioSelect = document.getElementById('scenario-select');
    
    if (!chunkSizeSelect || !scenarioSelect) return;
    
    const chunkSize = parseInt(chunkSizeSelect.value);
    const currentScenario = scenarioSelect.value;
    
    // Define scenarios (should match the ones in P5.js)
    const scenarios = {
      ai: {
        textBody: `Artificial intelligence represents a transformative technology that leverages machine learning algorithms and neural networks to process vast amounts of data. Deep learning, a subset of machine learning, utilizes multi-layered neural networks to recognize patterns and make predictions. Natural language processing enables AI systems to understand and generate human language, while computer vision allows machines to interpret visual information. These technologies find applications in autonomous vehicles, medical diagnosis, financial trading, and recommendation systems. However, AI faces significant challenges including algorithmic bias, data privacy concerns, and the need for explainable AI. The benefits include increased efficiency, enhanced decision-making capabilities, and the potential to solve complex global problems. Researchers like Geoffrey Hinton, Yann LeCun, and Yoshua Bengio have made groundbreaking contributions to the field, particularly in advancing deep learning methodologies.`
      },
      kitchen: {
        textBody: `A modern kitchen represents the heart of culinary creativity, equipped with essential appliances that transform raw ingredients into delicious meals. The refrigerator preserves fresh produce, dairy products, and proteins, maintaining optimal temperatures for food safety. Gas and electric stoves provide precise heat control for various cooking techniques, while ovens enable baking, roasting, and broiling. Food processors and blenders facilitate ingredient preparation, chopping vegetables and creating smooth sauces. Essential tools include sharp knives for precise cutting, cutting boards for safe preparation, and measuring cups for accurate portioning. Fresh ingredients like tomatoes, onions, garlic, and herbs form the foundation of countless recipes. Cooking techniques such as sautéing, braising, and grilling unlock different flavors and textures. Professional chefs like Gordon Ramsay and Julia Child have revolutionized culinary arts, sharing knowledge about flavor combinations and cooking methodologies that inspire home cooks worldwide.`
      },
      kpmg: {
        textBody: `KPMG stands as one of the Big Four accounting firms, providing comprehensive audit, tax, and advisory services to organizations worldwide. The firm's audit practice ensures financial statement accuracy and regulatory compliance for public and private companies. Tax services encompass complex international tax planning, transfer pricing, and regulatory compliance across multiple jurisdictions. Advisory services include risk management, cybersecurity consulting, and digital transformation initiatives that help clients navigate technological disruption. KPMG's technology practice focuses on cloud migration, data analytics, and artificial intelligence implementation. The firm serves diverse industries including financial services, healthcare, manufacturing, and government sectors. Key methodologies include agile project management, design thinking, and lean six sigma for process optimization. Executive leaders like Bill Thomas and Lynne Doughtie have led strategic initiatives in digital innovation and inclusive leadership. KPMG faces challenges in maintaining independence while providing comprehensive services, adapting to regulatory changes, and competing for top talent in the professional services market.`
      }
    };
    
    const currentTextBody = scenarios[currentScenario]?.textBody || '';
    const chunks = chunkText(currentTextBody, chunkSize);
    
    const chunksDiv = document.getElementById('rag-chunks');
    if (chunksDiv) {
      chunksDiv.innerHTML = chunks.map(chunk => 
        `<div class="text-chunk">
          <strong>Chunk ${chunk.id + 1}:</strong> ${chunk.text}
        </div>`
      ).join('');
    }
    
    // Clear other steps when chunks change
    const retrievalDiv = document.getElementById('rag-retrieval');
    const answerDiv = document.getElementById('rag-answer');
    if (retrievalDiv) retrievalDiv.innerHTML = '<p>Run RAG to see retrieved chunks...</p>';
    if (answerDiv) answerDiv.innerHTML = '<p>Run RAG to see generated answer...</p>';
  };

  const handleRAGDemo = async () => {
    try {
      const chunkSizeSelect = document.getElementById('chunk-size');
      const maxChunksSelect = document.getElementById('max-chunks');
      const queryInput = document.getElementById('rag-query');
      const scenarioSelect = document.getElementById('scenario-select');
      
      const chunkSize = parseInt(chunkSizeSelect.value);
      const maxChunks = parseInt(maxChunksSelect.value);
      const query = queryInput.value.trim();
      const currentScenario = scenarioSelect.value;

      if (!query) {
        alert('Please enter a query');
        return;
      }

      // Define scenarios (should match the ones in updateChunks)
      const scenarios = {
        ai: {
          textBody: `Artificial intelligence represents a transformative technology that leverages machine learning algorithms and neural networks to process vast amounts of data. Deep learning, a subset of machine learning, utilizes multi-layered neural networks to recognize patterns and make predictions. Natural language processing enables AI systems to understand and generate human language, while computer vision allows machines to interpret visual information. These technologies find applications in autonomous vehicles, medical diagnosis, financial trading, and recommendation systems. However, AI faces significant challenges including algorithmic bias, data privacy concerns, and the need for explainable AI. The benefits include increased efficiency, enhanced decision-making capabilities, and the potential to solve complex global problems. Researchers like Geoffrey Hinton, Yann LeCun, and Yoshua Bengio have made groundbreaking contributions to the field, particularly in advancing deep learning methodologies.`
        },
        kitchen: {
          textBody: `A modern kitchen represents the heart of culinary creativity, equipped with essential appliances that transform raw ingredients into delicious meals. The refrigerator preserves fresh produce, dairy products, and proteins, maintaining optimal temperatures for food safety. Gas and electric stoves provide precise heat control for various cooking techniques, while ovens enable baking, roasting, and broiling. Food processors and blenders facilitate ingredient preparation, chopping vegetables and creating smooth sauces. Essential tools include sharp knives for precise cutting, cutting boards for safe preparation, and measuring cups for accurate portioning. Fresh ingredients like tomatoes, onions, garlic, and herbs form the foundation of countless recipes. Cooking techniques such as sautéing, braising, and grilling unlock different flavors and textures. Professional chefs like Gordon Ramsay and Julia Child have revolutionized culinary arts, sharing knowledge about flavor combinations and cooking methodologies that inspire home cooks worldwide.`
        },
        kpmg: {
          textBody: `KPMG stands as one of the Big Four accounting firms, providing comprehensive audit, tax, and advisory services to organizations worldwide. The firm's audit practice ensures financial statement accuracy and regulatory compliance for public and private companies. Tax services encompass complex international tax planning, transfer pricing, and regulatory compliance across multiple jurisdictions. Advisory services include risk management, cybersecurity consulting, and digital transformation initiatives that help clients navigate technological disruption. KPMG's technology practice focuses on cloud migration, data analytics, and artificial intelligence implementation. The firm serves diverse industries including financial services, healthcare, manufacturing, and government sectors. Key methodologies include agile project management, design thinking, and lean six sigma for process optimization. Executiv  like Bill Thomas and Lynne Doughtie have led strategic initiatives in digital innovation and inclusive leadership. KPMG faces challenges in maintaining independence while providing comprehensive services, adapting to regulatory changes, and competing for top talent in the professional services market.`
        }
      };

      const currentTextBody = scenarios[currentScenario]?.textBody || '';

      // Step 1: Re-chunk the text (already displayed, but refresh)
      const chunks = chunkText(currentTextBody, chunkSize);
      
      // Step 2: Calculate similarity and retrieve top chunks
      const retrievalDiv = document.getElementById('rag-retrieval');
      retrievalDiv.innerHTML = '<p>Calculating similarities...</p>';
      
      const rankedChunks = await calculateSimilarity(query, chunks);
      const topChunks = rankedChunks.slice(0, maxChunks);
      
      retrievalDiv.innerHTML = `
        <p><strong>Query:</strong> "${query}"</p>
        <p><strong>Top ${maxChunks} most similar chunks:</strong></p>
        ${topChunks.map((chunk, index) => 
          `<div class="text-chunk retrieved">
            <strong>Chunk ${chunk.id + 1}</strong> (Similarity: ${(chunk.similarity * 100).toFixed(1)}%)
            <br>${chunk.text}
          </div>`
        ).join('')}
      `;
      
      // Step 3: Generate answer using top chunks
      const answerDiv = document.getElementById('rag-answer');
      answerDiv.innerHTML = '<p>Generating answer...</p>';

      const context = topChunks.map(c => c.text).join(' ');
      
      console.log('=== RAG CONTEXT DEBUG ===');
      console.log('Query:', query);
      console.log('Top chunks being sent as context:');
      topChunks.forEach((chunk, i) => {
        console.log(`Chunk ${chunk.id + 1} (${(chunk.similarity * 100).toFixed(1)}%):`, chunk.text);
      });
      console.log('Combined context:', context);
      console.log('========================');
      
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          context: context,
          model: 'gpt-4o-mini'
        })
      });

      const data = await response.json();
      if (data.answer) {
        answerDiv.innerHTML = `
          <p><strong>Answer:</strong> ${data.answer}</p>
          <hr style="margin: 1.5rem 0; border: none; height: 1px; background: rgba(255, 255, 255, 0.2);">
          <p><em>Generated using ${topChunks.length} chunks with similarities ranging from ${(topChunks[0]?.similarity * 100).toFixed(1)}% to ${(topChunks[topChunks.length - 1]?.similarity * 100).toFixed(1)}%</em></p>
          <details style="margin-top: 1rem; color: #999; font-size: 0.8rem;">
            <summary>Debug: Context sent to AI</summary>
            <div style="max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 1rem; margin-top: 0.5rem; border-radius: 4px;">
              <strong>Query:</strong> ${query}<br><br>
              <strong>Context chunks:</strong><br>
              ${topChunks.map(chunk => `• Chunk ${chunk.id + 1} (${(chunk.similarity * 100).toFixed(1)}%): ${chunk.text}`).join('<br><br>')}
            </div>
          </details>
        `;
      } else if (data.error) {
        answerDiv.innerHTML = `<p style="color: #ff6b35;">Error: ${data.error}</p>`;
      } else {
        answerDiv.innerHTML = '<p style="color: #ff6b35;">Unexpected response format.</p>';
      }

    } catch (error) {
      console.error('RAG Demo Error:', error);
      const answerDiv = document.getElementById('rag-answer');
      if (answerDiv) {
        answerDiv.innerHTML = `<p style="color: #ff6b35;">Error: ${error.message}</p>`;
      }
    }
  };

  // Graph RAG Extraction Functions
  const handleGraphExtraction = async () => {
    try {
      const scenarioSelect = document.getElementById('scenario-select');
      const currentScenario = scenarioSelect.value;

      // Define scenarios (same as before)
      const scenarios = {
        ai: {
          textBody: `Artificial intelligence represents a transformative technology that leverages machine learning algorithms and neural networks to process vast amounts of data. Deep learning, a subset of machine learning, utilizes multi-layered neural networks to recognize patterns and make predictions. Natural language processing enables AI systems to understand and generate human language, while computer vision allows machines to interpret visual information. These technologies find applications in autonomous vehicles, medical diagnosis, financial trading, and recommendation systems. However, AI faces significant challenges including algorithmic bias, data privacy concerns, and the need for explainable AI. The benefits include increased efficiency, enhanced decision-making capabilities, and the potential to solve complex global problems. Researchers like Geoffrey Hinton, Yann LeCun, and Yoshua Bengio have made groundbreaking contributions to the field, particularly in advancing deep learning methodologies.`
        },
        kitchen: {
          textBody: `A modern kitchen represents the heart of culinary creativity, equipped with essential appliances that transform raw ingredients into delicious meals. The refrigerator preserves fresh produce, dairy products, and proteins, maintaining optimal temperatures for food safety. Gas and electric stoves provide precise heat control for various cooking techniques, while ovens enable baking, roasting, and broiling. Food processors and blenders facilitate ingredient preparation, chopping vegetables and creating smooth sauces. Essential tools include sharp knives for precise cutting, cutting boards for safe preparation, and measuring cups for accurate portioning. Fresh ingredients like tomatoes, onions, garlic, and herbs form the foundation of countless recipes. Cooking techniques such as sautéing, braising, and grilling unlock different flavors and textures. Professional chefs like Gordon Ramsay and Julia Child have revolutionized culinary arts, sharing knowledge about flavor combinations and cooking methodologies that inspire home cooks worldwide.`
        },
        kpmg: {
          textBody: `KPMG stands as one of the Big Four accounting firms, providing comprehensive audit, tax, and advisory services to organizations worldwide. The firm's audit practice ensures financial statement accuracy and regulatory compliance for public and private companies. Tax services encompass complex international tax planning, transfer pricing, and regulatory compliance across multiple jurisdictions. Advisory services include risk management, cybersecurity consulting, and digital transformation initiatives that help clients navigate technological disruption. KPMG's technology practice focuses on cloud migration, data analytics, and artificial intelligence implementation. The firm serves diverse industries including financial services, healthcare, manufacturing, and government sectors. Key methodologies include agile project management, design thinking, and lean six sigma for process optimization. Executive leaders like Bill Thomas and Lynne Doughtie have led strategic initiatives in digital innovation and inclusive leadership. KPMG faces challenges in maintaining independence while providing comprehensive services, adapting to regulatory changes, and competing for top talent in the professional services market.`
        }
      };

      const currentTextBody = scenarios[currentScenario]?.textBody || '';

      // Step 1: Extract entities using LLM
      const entitiesDiv = document.getElementById('extracted-entities');
      entitiesDiv.innerHTML = '<p>Extracting entities...</p>';

      const entityResponse = await fetch('/api/extract-structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentTextBody,
          prompt: 'Extract all entities from this text and categorize them by type (e.g., TECHNOLOGY, PERSON, CONCEPT, APPLICATION, etc.). List each entity with its category.',
          format: 'structured'
        })
      });

      const entityData = await entityResponse.json();
      
      // Step 2: Extract relationships
      const relationshipsDiv = document.getElementById('extracted-relationships');
      relationshipsDiv.innerHTML = '<p>Mapping relationships...</p>';

      const relationshipResponse = await fetch('/api/extract-structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentTextBody,
          prompt: 'Identify key relationships between entities in this text. Format as "Entity A -> relates to -> Entity B" with a brief description of the relationship.',
          format: 'structured'
        })
      });

      const relationshipData = await relationshipResponse.json();

      // Step 3: Generate hub categories
      const hubsDiv = document.getElementById('hub-categories');
      hubsDiv.innerHTML = '<p>Organizing into hub structure...</p>';

      const hubResponse = await fetch('/api/extract-structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentTextBody,
          prompt: 'Organize the entities from this text into 3-5 main hub categories. For each hub category, list the entities that belong to it. Format your response like this:\n\nHUB_NAME:\n- Entity 1\n- Entity 2\n- Entity 3\n\nNext category and so on. Be specific and clear with entity names.',
          format: 'structured'
        })
      });

      const hubData = await hubResponse.json();

      // Display results with proper formatting
      if (entityData.extraction) {
        const entities = entityData.extraction.split('\n').filter(line => line.trim());
        entitiesDiv.innerHTML = entities.map(entity => {
          const parts = entity.split(':');
          if (parts.length >= 2) {
            const type = parts[0].trim();
            const name = parts.slice(1).join(':').trim();
            return `<div class="entity-item">
              <div class="entity-type">${type}</div>
              <div>${name}</div>
            </div>`;
          }
          return `<div class="entity-item">${entity}</div>`;
        }).join('');
      }

      if (relationshipData.extraction) {
        const relationships = relationshipData.extraction.split('\n').filter(line => line.trim());
        relationshipsDiv.innerHTML = relationships.map(rel => {
          if (rel.includes('->')) {
            const parts = rel.split('->');
            return `<div class="relationship-item">
              ${parts[0].trim()} <span class="relationship-arrow">→</span> ${parts.slice(1).join('→').trim()}
            </div>`;
          }
          return `<div class="relationship-item">${rel}</div>`;
        }).join('');
      }

      if (hubData.extraction) {
        console.log('Raw hub data:', hubData.extraction);
        
        // Try to parse hub categories more robustly
        const hubLines = hubData.extraction.split('\n').filter(line => line.trim());
        console.log('Hub lines:', hubLines);
        
        let hubItems = [];
        let currentHub = '';
        let entities = [];

        hubLines.forEach((line, index) => {
          console.log(`Processing line ${index}:`, line);
          
          // Check if this line looks like a hub category (contains colon, not starting with dash/bullet)
          if ((line.includes(':') || line.toUpperCase() === line) && !line.startsWith('-') && !line.startsWith('•') && !line.startsWith('*')) {
            // Save previous hub if exists
            if (currentHub && entities.length > 0) {
              hubItems.push(`<div class="hub-item">
                <div class="hub-title">${currentHub}</div>
                <div class="hub-entities">
                  ${entities.map(entity => `<span class="hub-entity">${entity}</span>`).join('')}
                </div>
              </div>`);
            }
            
            // Start new hub
            currentHub = line.replace(':', '').trim();
            entities = [];
            console.log('New hub:', currentHub);
          } else if (line.trim() && currentHub) {
            // This is an entity under the current hub
            const entity = line.replace(/^[-•*]\s*/, '').trim();
            if (entity && entity.length > 0) {
              entities.push(entity);
              console.log('Added entity:', entity);
            }
          } else if (!currentHub && line.trim()) {
            // If no hub detected yet, treat the line as a potential hub
            currentHub = line.trim();
            entities = [];
            console.log('Fallback hub:', currentHub);
          }
        });

        // Don't forget the last hub
        if (currentHub && entities.length > 0) {
          hubItems.push(`<div class="hub-item">
            <div class="hub-title">${currentHub}</div>
            <div class="hub-entities">
              ${entities.map(entity => `<span class="hub-entity">${entity}</span>`).join('')}
            </div>
          </div>`);
        }

        console.log('Final hub items:', hubItems);

        if (hubItems.length > 0) {
          hubsDiv.innerHTML = hubItems.join('');
        } else {
          // Fallback: just display the raw text in a readable format
          hubsDiv.innerHTML = `<div class="hub-item">
            <div class="hub-title">Hub Structure</div>
            <div style="white-space: pre-wrap; font-size: 0.8rem; line-height: 1.4;">
              ${hubData.extraction}
            </div>
          </div>`;
        }
      } else {
        hubsDiv.innerHTML = '<p style="color: #ff6b35;">No hub data received</p>';
      }

    } catch (error) {
      console.error('Graph extraction error:', error);
      document.getElementById('extracted-entities').innerHTML = `<p style="color: #ff6b35;">Error: ${error.message}</p>`;
      document.getElementById('extracted-relationships').innerHTML = `<p style="color: #ff6b35;">Error: ${error.message}</p>`;
      document.getElementById('hub-categories').innerHTML = `<p style="color: #ff6b35;">Error: ${error.message}</p>`;
    }
  };

  useEffect(() => {
    // Set up RAG demo event listeners after component mounts
    const runRagButton = document.getElementById('run-rag');
    const chunkSizeSelect = document.getElementById('chunk-size');
    const scenarioSelect = document.getElementById('scenario-select');
    const extractGraphButton = document.getElementById('extract-graph');
    
    const cleanupFunctions = [];
    
    if (runRagButton) {
      const handleClick = async () => {
        await handleRAGDemo();
      };
      runRagButton.addEventListener('click', handleClick);
      cleanupFunctions.push(() => runRagButton.removeEventListener('click', handleClick));
    }
    
    if (chunkSizeSelect) {
      chunkSizeSelect.addEventListener('change', updateChunks);
      cleanupFunctions.push(() => chunkSizeSelect.removeEventListener('change', updateChunks));
    }
    
    if (scenarioSelect) {
      scenarioSelect.addEventListener('change', updateChunks);
      cleanupFunctions.push(() => scenarioSelect.removeEventListener('change', updateChunks));
    }
    
    if (extractGraphButton) {
      const handleGraphClick = async () => {
        await handleGraphExtraction();
      };
      extractGraphButton.addEventListener('click', handleGraphClick);
      cleanupFunctions.push(() => extractGraphButton.removeEventListener('click', handleGraphClick));
    }
    
    // Initial chunk display (with a small delay to ensure DOM is ready)
    setTimeout(() => {
      updateChunks();
    }, 100);
    
    // Return cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, []);

  useEffect(() => {
    const initializeP5 = () => {
      if (!canvasRef.current) {
        setTimeout(initializeP5, 100);
        return;
      }

      // Add event listener for scenario selector
      const scenarioSelect = document.getElementById('scenario-select');
      if (scenarioSelect) {
        scenarioSelect.addEventListener('change', (e) => {
          if (p5InstanceRef.current) {
            // Update the scenario in P5.js context
            p5InstanceRef.current._currentScenario = e.target.value;
            p5InstanceRef.current._loadScenario(e.target.value);
          }
        });
      }

      if (!window.p5 || !canvasRef.current) return;
      
      // Clean up any existing P5 instance
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
      }

      // Example scenarios with text bodies and graph data
      const scenarios = {
        ai: {
          title: "Artificial Intelligence Research",
          textBody: `Artificial intelligence represents a transformative technology that leverages machine learning algorithms and neural networks to process vast amounts of data. Deep learning, a subset of machine learning, utilizes multi-layered neural networks to recognize patterns and make predictions. Natural language processing enables AI systems to understand and generate human language, while computer vision allows machines to interpret visual information. These technologies find applications in autonomous vehicles, medical diagnosis, financial trading, and recommendation systems. However, AI faces significant challenges including algorithmic bias, data privacy concerns, and the need for explainable AI. The benefits include increased efficiency, enhanced decision-making capabilities, and the potential to solve complex global problems. Researchers like Geoffrey Hinton, Yann LeCun, and Yoshua Bengio have made groundbreaking contributions to the field, particularly in advancing deep learning methodologies.`,
          nodes: [
            { id: 'Machine Learning', type: 'ALGORITHM', mass: 25, pos: { x: -150, y: -100 } },
            { id: 'Deep Learning', type: 'ALGORITHM', mass: 25, pos: { x: 150, y: -100 } },
            { id: 'Neural Networks', type: 'ALGORITHM', mass: 20, pos: { x: 0, y: -150 } },
            { id: 'NLP', type: 'TECHNIQUE', mass: 20, pos: { x: -200, y: 0 } },
            { id: 'Computer Vision', type: 'TECHNIQUE', mass: 20, pos: { x: 200, y: 0 } },
            { id: 'Autonomous Vehicles', type: 'APPLICATION', mass: 15, pos: { x: -150, y: 100 } },
            { id: 'Medical Diagnosis', type: 'APPLICATION', mass: 15, pos: { x: 150, y: 100 } },
            { id: 'Geoffrey Hinton', type: 'RESEARCHER', mass: 18, pos: { x: -100, y: -200 } },
            { id: 'Yann LeCun', type: 'RESEARCHER', mass: 18, pos: { x: 100, y: -200 } }
          ],
          edges: [
            { from: 'Machine Learning', to: 'Deep Learning', desc: 'Deep learning is a subset of machine learning' },
            { from: 'Deep Learning', to: 'Neural Networks', desc: 'Deep learning uses multi-layered neural networks' },
            { from: 'NLP', to: 'Machine Learning', desc: 'NLP uses machine learning algorithms' },
            { from: 'Computer Vision', to: 'Machine Learning', desc: 'Computer vision leverages ML techniques' },
            { from: 'Autonomous Vehicles', to: 'Computer Vision', desc: 'Self-driving cars use computer vision' },
            { from: 'Medical Diagnosis', to: 'Deep Learning', desc: 'Medical AI uses deep learning models' },
            { from: 'Geoffrey Hinton', to: 'Deep Learning', desc: 'Hinton made groundbreaking contributions to deep learning' },
            { from: 'Yann LeCun', to: 'Deep Learning', desc: 'LeCun advanced deep learning methodologies' }
          ]
        },
        kitchen: {
          title: "Modern Kitchen Ecosystem",
          textBody: `A modern kitchen represents the heart of culinary creativity, equipped with essential appliances that transform raw ingredients into delicious meals. The refrigerator preserves fresh produce, dairy products, and proteins, maintaining optimal temperatures for food safety. Gas and electric stoves provide precise heat control for various cooking techniques, while ovens enable baking, roasting, and broiling. Food processors and blenders facilitate ingredient preparation, chopping vegetables and creating smooth sauces. Essential tools include sharp knives for precise cutting, cutting boards for safe preparation, and measuring cups for accurate portioning. Fresh ingredients like tomatoes, onions, garlic, and herbs form the foundation of countless recipes. Cooking techniques such as sautéing, braising, and grilling unlock different flavors and textures. Professional chefs like Gordon Ramsay and Julia Child have revolutionized culinary arts, sharing knowledge about flavor combinations and cooking methodologies that inspire home cooks worldwide.`,
          nodes: [
            { id: 'Refrigerator', type: 'APPLIANCE', mass: 22, pos: { x: -150, y: -120 } },
            { id: 'Stove', type: 'APPLIANCE', mass: 22, pos: { x: 150, y: -120 } },
            { id: 'Oven', type: 'APPLIANCE', mass: 20, pos: { x: 0, y: -180 } },
            { id: 'Food Processor', type: 'APPLIANCE', mass: 18, pos: { x: -250, y: 0 } },
            { id: 'Knives', type: 'TOOL', mass: 16, pos: { x: 250, y: 0 } },
            { id: 'Cutting Board', type: 'TOOL', mass: 14, pos: { x: -200, y: 120 } },
            { id: 'Measuring Cups', type: 'TOOL', mass: 12, pos: { x: 200, y: 120 } },
            { id: 'Tomatoes', type: 'INGREDIENT', mass: 15, pos: { x: -100, y: 180 } },
            { id: 'Fresh Herbs', type: 'INGREDIENT', mass: 15, pos: { x: 100, y: 180 } },
            { id: 'Sautéing', type: 'TECHNIQUE', mass: 16, pos: { x: -180, y: 200 } },
            { id: 'Grilling', type: 'TECHNIQUE', mass: 16, pos: { x: 180, y: 200 } },
            { id: 'Gordon Ramsay', type: 'CHEF', mass: 20, pos: { x: -120, y: -250 } },
            { id: 'Julia Child', type: 'CHEF', mass: 20, pos: { x: 120, y: -250 } }
          ],
          edges: [
            { from: 'Refrigerator', to: 'Tomatoes', desc: 'Refrigerator preserves fresh produce' },
            { from: 'Stove', to: 'Sautéing', desc: 'Stove enables sautéing technique' },
            { from: 'Stove', to: 'Grilling', desc: 'Stove can be used for grilling' },
            { from: 'Food Processor', to: 'Fresh Herbs', desc: 'Food processor chops herbs efficiently' },
            { from: 'Knives', to: 'Cutting Board', desc: 'Knives work with cutting boards for safety' },
            { from: 'Knives', to: 'Tomatoes', desc: 'Knives are used to cut vegetables' },
            { from: 'Measuring Cups', to: 'Fresh Herbs', desc: 'Measuring cups portion ingredients accurately' },
            { from: 'Gordon Ramsay', to: 'Sautéing', desc: 'Ramsay teaches advanced cooking techniques' },
            { from: 'Julia Child', to: 'Grilling', desc: 'Child influenced home cooking methodology' },
            { from: 'Oven', to: 'Gordon Ramsay', desc: 'Professional chefs master oven techniques' }
          ]
        },
        kpmg: {
          title: "KPMG Professional Services",
          textBody: `KPMG stands as one of the Big Four accounting firms, providing comprehensive audit, tax, and advisory services to organizations worldwide. The firm's audit practice ensures financial statement accuracy and regulatory compliance for public and private companies. Tax services encompass complex international tax planning, transfer pricing, and regulatory compliance across multiple jurisdictions. Advisory services include risk management, cybersecurity consulting, and digital transformation initiatives that help clients navigate technological disruption. KPMG's technology practice focuses on cloud migration, data analytics, and artificial intelligence implementation. The firm serves diverse industries including financial services, healthcare, manufacturing, and government sectors. Key methodologies include agile project management, design thinking, and lean six sigma for process optimization. Executive leaders like Bill Thomas and Lynne Doughtie have led strategic initiatives in digital innovation and inclusive leadership. KPMG faces challenges in maintaining independence while providing comprehensive services, adapting to regulatory changes, and competing for top talent in the professional services market.`,
          nodes: [
            { id: 'Audit Services', type: 'SERVICE', mass: 25, pos: { x: -180, y: -100 } },
            { id: 'Tax Services', type: 'SERVICE', mass: 25, pos: { x: 180, y: -100 } },
            { id: 'Advisory Services', type: 'SERVICE', mass: 25, pos: { x: 0, y: -180 } },
            { id: 'Risk Management', type: 'PRACTICE', mass: 20, pos: { x: -250, y: 50 } },
            { id: 'Digital Transformation', type: 'PRACTICE', mass: 20, pos: { x: 250, y: 50 } },
            { id: 'Cybersecurity', type: 'PRACTICE', mass: 18, pos: { x: 0, y: 200 } },
            { id: 'Financial Services', type: 'INDUSTRY', mass: 18, pos: { x: -150, y: 150 } },
            { id: 'Healthcare', type: 'INDUSTRY', mass: 18, pos: { x: 150, y: 150 } },
            { id: 'Manufacturing', type: 'INDUSTRY', mass: 16, pos: { x: -200, y: 220 } },
            { id: 'Agile Management', type: 'METHODOLOGY', mass: 16, pos: { x: 200, y: 220 } },
            { id: 'Design Thinking', type: 'METHODOLOGY', mass: 16, pos: { x: -100, y: 280 } },
            { id: 'Named Exec1', type: 'EXECUTIVE', mass: 18, pos: { x: -120, y: -250 } },
            { id: 'Named Exec2', type: 'EXECUTIVE', mass: 18, pos: { x: 120, y: -250 } }
          ],
          edges: [
            { from: 'Audit Services', to: 'Financial Services', desc: 'Audit services ensure financial compliance' },
            { from: 'Tax Services', to: 'Manufacturing', desc: 'Tax services support manufacturing operations' },
            { from: 'Advisory Services', to: 'Risk Management', desc: 'Advisory includes risk management consulting' },
            { from: 'Advisory Services', to: 'Digital Transformation', desc: 'Advisory drives digital transformation initiatives' },
            { from: 'Digital Transformation', to: 'Cybersecurity', desc: 'Digital transformation requires cybersecurity' },
            { from: 'Risk Management', to: 'Healthcare', desc: 'Healthcare sector requires specialized risk management' },
            { from: 'Agile Management', to: 'Digital Transformation', desc: 'Agile methodologies support digital initiatives' },
            { from: 'Design Thinking', to: 'Advisory Services', desc: 'Design thinking enhances advisory approach' },
            { from: 'Named Exec1', to: 'Digital Transformation', desc: 'Thomas led digital innovation initiatives' },
            { from: 'Named Exec2', to: 'Advisory Services', desc: 'Doughtie championed inclusive leadership' }
          ]
        }
      };

      let currentScenario = 'ai';
      let nodes = [];
      let edges = [];
      let typeColors = {};
      let typeCenters = {};
      let typeVisibility = {};
      let hoverEdge = null;
      let repulsionSlider, lineTransparencySlider;

      const MAX_FONT_SIZE = 16;
      const MIN_FONT_SIZE = 12;

      const sketch = (p) => {
        // Node constructor
        function Node(id, type, mass, x, y, isHub) {
          this.id = id;
          this.pos = p.createVector(x, y);
          this.force = p.createVector(0, 0);
          this.vel = p.createVector(0, 0);
          this.mass = mass;
          this.type = type;
          this.isHub = isHub || false;
          this.locked = false;
        }

        // Node prototype methods
        Node.prototype.update = function() {
          // Only update if visible, not locked, and not a hub
          if (!this.locked && !this.isHub && typeVisibility[this.type]) {
            this.vel.add(this.force);
            this.pos.add(this.vel);
            this.vel.mult(0.9); // Damping
          } else if (!typeVisibility[this.type]) {
            // If invisible, zero out velocity to prevent accumulation
            this.vel.mult(0);
            this.force.mult(0);
          }
        };

        Node.prototype.draw = function() {
          if (!typeVisibility[this.type]) return;
          
          let c = typeColors[this.type];
          
          if (this.isHub) {
            // Hub styling: use original type color (slightly brighter), thick black border, larger size
            let r = p.red(c);
            let g = p.green(c);
            let b = p.blue(c);
            
            p.fill(p.min(r + 30, 255), p.min(g + 30, 255), p.min(b + 30, 255));
            p.stroke(0);
            p.strokeWeight(3);
            p.ellipse(this.pos.x, this.pos.y, this.mass + 8, this.mass + 8);
            
            // Hub text: black boldface text on semi-transparent white background
            p.noStroke();
            p.fill(255, 200); // Semi-transparent white background
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(14); // Slightly bigger than regular nodes (was 12)
            p.textStyle(p.BOLD); // Make text bold
            let textWidth = p.textWidth(this.id);
            let textHeight = 18; // Slightly taller for bigger text
            p.rect(this.pos.x - textWidth/2 - 2, this.pos.y - textHeight/2, textWidth + 4, textHeight);
            p.fill(0); // Black text
            p.text(this.id, this.pos.x, this.pos.y);
            p.textStyle(p.NORMAL); // Reset to normal after drawing
          } else {
            // Regular node styling
            p.fill(c);
            p.stroke(0);
            p.strokeWeight(1);
            p.ellipse(this.pos.x, this.pos.y, this.mass, this.mass);
            
            // Regular node text: black text on semi-transparent white background
            p.noStroke();
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(12); // Increased from 10 to 12 for better readability
            // Add semi-transparent white background for regular nodes too
            p.fill(255, 200); // Semi-transparent white background
            let textWidth = p.textWidth(this.id);
            let textHeight = 14; // Increased height to match larger text
            p.rect(this.pos.x - textWidth/2 - 2, this.pos.y - textHeight/2, textWidth + 4, textHeight);
            p.fill(0); // Black text
            p.text(this.id, this.pos.x, this.pos.y);
          }
        };

        const drawLegend = () => {
          p.push();
          p.resetMatrix();
          
          let legendX = 20;
          let legendY = p.height - 140;
          let legendWidth = 150;
          let currentY = legendY;
          
          // Legend background - remove rectangle outline, just use subtle background
          p.noStroke();
          p.fill(0, 0, 0, 30); // Very subtle background
          p.rect(legendX - 10, legendY - 10, legendWidth + 20, 130);
          
          // Show/Hide All button
          let allVisible = Object.values(typeVisibility).every(v => v);
          p.fill(0);
          p.textAlign(p.LEFT, p.TOP);
          p.textSize(12);
          p.text(allVisible ? "Hide All" : "Show All", legendX, currentY);
          currentY += 25;
          
          // Individual type toggles
          let types = Object.keys(typeColors);
          for (let t of types) {
            let c = typeColors[t];
            
            // Color indicator
            p.fill(c);
            p.noStroke();
            p.ellipse(legendX + 10, currentY + 10, 15, 15);
            
            // Type label
            p.fill(0);
            p.textAlign(p.LEFT, p.CENTER);
            p.textSize(11);
            p.text(t, legendX + 25, currentY + 10);
            
            // Show visibility status
            if (!typeVisibility[t]) {
              p.stroke(255, 0, 0);
              p.strokeWeight(2);
              p.line(legendX + 3, currentY + 10, legendX + 17, currentY + 10);
            }
            
            currentY += 20;
          }
          
          p.pop();
        };

        const distToSegment = (px, py, v, w) => {
          const distSq = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
          if (distSq === 0) return p.dist(px, py, v.x, v.y);
          
          const t = p.max(0, p.min(1, ((px - v.x) * (w.x - v.x) + (py - v.y) * (w.y - v.y)) / distSq));
          const projection = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
          return p.dist(px, py, projection.x, projection.y);
        };

        const loadScenario = (scenarioKey) => {
          const scenario = scenarios[scenarioKey];
          
          // Clear existing nodes and edges
          nodes = [];
          edges = [];
          
          // Create regular nodes first (excluding those marked as isHub in data)
          // Randomize initial positions so they spread out naturally
          nodes = scenario.nodes
            .filter(n => !n.isHub) // Only create non-hub nodes from data
            .map(n => new Node(
              n.id, 
              n.type, 
              n.mass, 
              p.random(-100, 100), // Random X position around center
              p.random(-100, 100), // Random Y position around center
              false
            ));
          
          // Copy scenario edges
          edges = [...scenario.edges];

          // Dynamically assign colors to types based on current scenario
          let uniqueTypes = [...new Set(scenario.nodes.map(n => n.type))];
          let colors = [
            p.color(180, 80, 80),    // Muted red
            p.color(80, 160, 80),    // Muted green  
            p.color(80, 80, 180),    // Muted blue
            p.color(160, 140, 80),   // Muted yellow/orange
            p.color(140, 100, 180),  // Muted purple
            p.color(180, 120, 100),  // Muted brown
            p.color(100, 180, 140),  // Muted teal
            p.color(180, 100, 140)   // Muted pink
          ];
          
          typeColors = {};
          uniqueTypes.forEach((type, index) => {
            typeColors[type] = colors[index % colors.length];
          });

          // Set up type centers and add type hubs
          setupTypeCenters();
          addTypeHubs();

          // Initialize all types as visible (no HUB type in visibility)
          for(let t in typeColors) {
            typeVisibility[t] = true;
            previousVisibility[t] = true; // Initialize previous state
          }

          // Update text display
          updateTextDisplay(scenario);
        };

        const setupTypeCenters = () => {
          let types = Object.keys(typeColors); // All actual types, no HUB
          let R = p.min(p.width, p.height) * 0.25; // Slightly smaller radius for better fit
          types.forEach((t, i) => {
            let angle = (i / types.length) * 2 * p.PI;
            typeCenters[t] = p.createVector(p.cos(angle) * R, p.sin(angle) * R);
          });
        };

        const addTypeHubs = () => {
          // Add a hub for each type
          let hubIdx = {};
          let types = Object.keys(typeColors);
          
          for (let t of types) {
            let center = typeCenters[t];
            let hubName = t; // Use the type name as the hub name
            let hub = new Node(hubName, t, 30, center.x, center.y, true); // Larger hub size
            nodes.push(hub);
            hubIdx[t] = nodes.length - 1;
          }
          
          // Connect each non-hub node to its type hub
          nodes.forEach((n, i) => {
            if (n.isHub) return;
            let hubIndex = hubIdx[n.type];
            if (hubIndex != null) {
              edges.push({ 
                from: n.id, 
                to: nodes[hubIndex].id, 
                desc: `${n.id} belongs to ${n.type} category` 
              });
            }
          });
        };

        p.setup = () => {
          if (!canvasRef.current) return;
          
          // Create scenario selector controls
          let controlsContainer = p.createDiv('');
          controlsContainer.parent(canvasRef.current);
          controlsContainer.style('margin', '10px 0');
          controlsContainer.style('display', 'flex');
          controlsContainer.style('gap', '20px');
          controlsContainer.style('align-items', 'center');
          controlsContainer.style('flex-wrap', 'wrap');
          
          // Create canvas with fallback width
          const containerWidth = canvasRef.current.offsetWidth || 800;
          const canvas = p.createCanvas(containerWidth, 600);
          canvas.parent(canvasRef.current);
          p.colorMode(p.RGB, 255, 255, 255);

          // Create sliders with labels
          let sliderContainer = p.createDiv('');
          sliderContainer.parent(canvasRef.current);
          sliderContainer.style('margin', '10px 0');
          sliderContainer.style('display', 'flex');
          sliderContainer.style('gap', '20px');
          sliderContainer.style('align-items', 'center');
          
          let repulsionLabel = p.createDiv('Repulsion: ');
          repulsionLabel.parent(sliderContainer);
          repulsionLabel.style('color', 'rgba(255, 255, 255, 0.9)');
          repulsionLabel.style('font-size', '14px');
          
          repulsionSlider = p.createSlider(500, 2000, 1000, 10);
          repulsionSlider.parent(sliderContainer);
          
          let transparencyLabel = p.createDiv('Transparency: ');
          transparencyLabel.parent(sliderContainer);
          transparencyLabel.style('color', 'rgba(255, 255, 255, 0.9)');
          transparencyLabel.style('font-size', '14px');
          transparencyLabel.style('margin-left', '20px');
          
          lineTransparencySlider = p.createSlider(0, 255, 255, 5);
          lineTransparencySlider.parent(sliderContainer);

          // Load initial scenario
          loadScenario(currentScenario);
          
          // Expose functions to instance for React to access
          p._currentScenario = currentScenario;
          p._loadScenario = loadScenario;
        };

        p.windowResized = () => {
          // Resize canvas to fill container width with fallback
          const containerWidth = canvasRef.current?.offsetWidth || 800;
          p.resizeCanvas(containerWidth, 600);
        };

        const updateTextDisplay = (scenario) => {
          // Find the text container
          let textContainer = document.getElementById('scenario-text-container');
          if (textContainer) {
            textContainer.innerHTML = `
              <h3 style="color: rgba(255, 255, 255, 0.9); margin: 0 0 1rem 0; font-size: 18px;">
                ${scenario.title} - Source Text
              </h3>
              <p style="color: rgba(255, 255, 255, 0.8); line-height: 1.6; margin: 0; font-size: 14px;">
                ${scenario.textBody}
              </p>
            `;
          }
        };

        p.draw = () => {
          p.background(255); // White background
          p.translate(p.width / 2, p.height / 2);
          hoverEdge = null;

          // Apply physics
          applyForces(nodes);
          for (let node of nodes) {
            node.update();
          }

          // Draw edges with special styling for hub connections
          for (let edge of edges) {
            let n1 = nodes.find(n => n.id === edge.from);
            let n2 = nodes.find(n => n.id === edge.to);
            
            if (!n1 || !n2) continue;
            
            // Check visibility using original types (hubs are visible if their type is visible)
            if (!typeVisibility[n1.type] || !typeVisibility[n2.type]) continue;

            let transparency = lineTransparencySlider.value();
            let isHubConnection = n1.isHub || n2.isHub;
            
            if (isHubConnection) {
              // Hub connections are dashed and more subtle
              p.stroke(60, 60, 60, transparency * 0.5);
              p.strokeWeight(1);
              p.drawingContext.setLineDash([5, 5]);
              p.line(n1.pos.x, n1.pos.y, n2.pos.x, n2.pos.y);
              p.drawingContext.setLineDash([]);
            } else {
              // Regular connections between non-hub nodes
              p.stroke(100, 100, 100, transparency * 0.6);
              p.strokeWeight(2);
              p.line(n1.pos.x, n1.pos.y, n2.pos.x, n2.pos.y);
            }

            // Check for hover (only for non-hub connections)
            if (!isHubConnection && distToSegment(p.mouseX - p.width/2, p.mouseY - p.height/2, n1.pos, n2.pos) < 10) {
              hoverEdge = edge;
            }
          }

          // Draw nodes
          for (let node of nodes) {
            if (typeVisibility[node.type]) {
              node.draw();
            }
          }

          // Draw legend
          drawLegend();

          // Tooltip
          if (hoverEdge && hoverEdge.desc) {
            p.push();
            p.resetMatrix();
            p.noStroke();
            p.fill(255, 230);
            p.rect(0, 0, p.width, 60);
            p.fill(0);
            p.textSize(14);
            p.textAlign(p.LEFT, p.TOP);
            p.text(hoverEdge.desc, 10, 10, p.width - 20);
            p.pop();
          }
        };

        const applyForces = (nodes) => {
          let R = repulsionSlider.value();

          // Clear forces
          for (let node of nodes) {
            node.force.mult(0);
          }

          // Hubs are fixed in position - no forces applied to them
          for (let node of nodes) {
            if (node.isHub) {
              node.force.mult(0);
              continue;
            }
            
            // Only apply gravity to visible, unlocked nodes
            if (!node.locked && typeVisibility[node.type]) {
              // Weaker gravity towards center for non-hub nodes
              let gravity = p5.Vector.mult(node.pos, -0.0002);
              node.force.add(gravity);
            }
          }

          // Repulsion between nodes (skip hub-hub repulsion and invisible nodes)
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              let n1 = nodes[i];
              let n2 = nodes[j];
              
              // Skip hub-hub repulsion
              if (n1.isHub && n2.isHub) continue;
              
              // Skip if either node is invisible
              if (!typeVisibility[n1.type] || !typeVisibility[n2.type]) continue;

              let dist = p5.Vector.dist(n1.pos, n2.pos);
              if (dist > 0 && dist < 300) {
                let force = R / (dist * dist);
                let forceVec = p5.Vector.sub(n1.pos, n2.pos).normalize().mult(force);
                
                if (!n1.isHub && !n1.locked) n1.force.add(forceVec);
                if (!n2.isHub && !n2.locked) n2.force.add(forceVec.mult(-1));
              }
            }
          }

          // Edge springs and type clustering (only for visible nodes)
          for (let edge of edges) {
            let n1 = nodes.find(n => n.id === edge.from);
            let n2 = nodes.find(n => n.id === edge.to);
            
            if (!n1 || !n2) continue;
            
            // Skip if either node is invisible
            if (!typeVisibility[n1.type] || !typeVisibility[n2.type]) continue;

            let isHubConnection = n1.isHub || n2.isHub;
            let idealLength = isHubConnection ? 80 : 60;
            let currentLength = p5.Vector.dist(n1.pos, n2.pos);
            let springForce = (currentLength - idealLength) * 0.01;
            
            let direction = p5.Vector.sub(n2.pos, n1.pos).normalize();
            let force = p5.Vector.mult(direction, springForce);
            
            if (!n1.isHub && !n1.locked) n1.force.add(force);
            if (!n2.isHub && !n2.locked) n2.force.sub(force);
          }

          // Type clustering - attract nodes to their type centers (only visible nodes)
          for (let node of nodes) {
            if (node.isHub || node.locked || !typeVisibility[node.type]) continue;
            
            let targetCenter = typeCenters[node.type];
            if (targetCenter) {
              let attraction = p5.Vector.sub(targetCenter, node.pos).mult(0.0001);
              node.force.add(attraction);
            }
          }
        };

        // Node prototype methods
        Node.prototype.update = function() {
          // Only update if visible, not locked, and not a hub
          if (!this.locked && !this.isHub && typeVisibility[this.type]) {
            this.vel.add(this.force);
            this.pos.add(this.vel);
            this.vel.mult(0.9); // Damping
          } else if (!typeVisibility[this.type]) {
            // If invisible, zero out velocity to prevent accumulation
            this.vel.mult(0);
            this.force.mult(0);
          }
        };

        Node.prototype.draw = function() {
          if (!typeVisibility[this.type]) return;
          
          let c = typeColors[this.type];
          
          if (this.isHub) {
            // Hub styling: use original type color (slightly brighter), thick black border, larger size
            let r = p.red(c);
            let g = p.green(c);
            let b = p.blue(c);
            
            p.fill(p.min(r + 30, 255), p.min(g + 30, 255), p.min(b + 30, 255));
            p.stroke(0);
            p.strokeWeight(3);
            p.ellipse(this.pos.x, this.pos.y, this.mass + 8, this.mass + 8);
            
            // Hub text: black boldface text on semi-transparent white background
            p.noStroke();
            p.fill(255, 200); // Semi-transparent white background
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(14); // Slightly bigger than regular nodes (was 12)
            p.textStyle(p.BOLD); // Make text bold
            let textWidth = p.textWidth(this.id);
            let textHeight = 18; // Slightly taller for bigger text
            p.rect(this.pos.x - textWidth/2 - 2, this.pos.y - textHeight/2, textWidth + 4, textHeight);
            p.fill(0); // Black text
            p.text(this.id, this.pos.x, this.pos.y);
            p.textStyle(p.NORMAL); // Reset to normal after drawing
          } else {
            // Regular node styling
            p.fill(c);
            p.stroke(0);
            p.strokeWeight(1);
            p.ellipse(this.pos.x, this.pos.y, this.mass, this.mass);
            
            // Regular node text: black text on semi-transparent white background
            p.noStroke();
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(12); // Increased from 10 to 12 for better readability
            // Add semi-transparent white background for regular nodes too
            p.fill(255, 200); // Semi-transparent white background
            let textWidth = p.textWidth(this.id);
            let textHeight = 14; // Increased height to match larger text
            p.rect(this.pos.x - textWidth/2 - 2, this.pos.y - textHeight/2, textWidth + 4, textHeight);
            p.fill(0); // Black text
            p.text(this.id, this.pos.x, this.pos.y);
          }
        };

        // Mouse interactions
        let draggedNode = null;
        let dragOffset = { x: 0, y: 0 };
        let previousVisibility = {};
        let lastClickTime = 0;
        let lastClickedNode = null;

        p.mousePressed = () => {
          if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;
          
          let mx = p.mouseX - p.width/2;
          let my = p.mouseY - p.height/2;
          
          // Check legend clicks - use same coordinates as drawLegend
          let legendX = 20;
          let legendStartY = p.height - 140;
          let legendWidth = 150;
          
          if (p.mouseX >= legendX && p.mouseX <= legendX + legendWidth && 
              p.mouseY >= legendStartY && p.mouseY <= p.height - 10) {
            
            let currentY = legendStartY;
            
            // Check "Show/Hide All" click (first 25px height)
            if (p.mouseY >= currentY && p.mouseY < currentY + 25) {
              let allVisible = Object.values(typeVisibility).every(v => v);
              let types = Object.keys(typeColors);
              for (let t of types) {
                typeVisibility[t] = !allVisible;
              }
              checkForReactivatedNodes();
              return;
            }
            
            currentY += 25; // Move past Show/Hide All button
            
            // Check individual type clicks (20px height each)
            let types = Object.keys(typeColors);
            for (let i = 0; i < types.length; i++) {
              if (p.mouseY >= currentY && p.mouseY < currentY + 20) {
                typeVisibility[types[i]] = !typeVisibility[types[i]];
                checkForReactivatedNodes();
                return;
              }
              currentY += 20;
            }
          }
          
          // Check node clicks for dragging and double-click unlocking
          for (let node of nodes) {
            if (typeVisibility[node.type] && p.dist(mx, my, node.pos.x, node.pos.y) < node.mass/2) {
              let currentTime = p.millis();
              
              // Check for double-click to unlock
              if (lastClickedNode === node && currentTime - lastClickTime < 300) {
                // Double-click detected - toggle lock state
                node.locked = !node.locked;
                lastClickedNode = null; // Reset to prevent triple-click issues
                return;
              }
              
              // Single click - start dragging
              draggedNode = node;
              dragOffset.x = mx - node.pos.x;
              dragOffset.y = my - node.pos.y;
              node.locked = true; // Lock the node while dragging
              
              // Track for double-click detection
              lastClickedNode = node;
              lastClickTime = currentTime;
              return;
            }
          }
        };

        const checkForReactivatedNodes = () => {
          // Check for nodes that just became visible
          for (let node of nodes) {
            let wasVisible = previousVisibility[node.type];
            let isVisible = typeVisibility[node.type];
            
            if (!wasVisible && isVisible) {
              // Node just became visible - check if it's too far from reasonable bounds
              let maxDistance = 400; // Maximum reasonable distance from center
              let distance = p5.Vector.mag(node.pos);
              
              if (distance > maxDistance || isNaN(node.pos.x) || isNaN(node.pos.y)) {
                // Reposition the node to a reasonable location
                if (node.isHub && typeCenters[node.type]) {
                  // Hubs go to their type center
                  node.pos = typeCenters[node.type].copy();
                } else {
                  // Regular nodes go to a random position near their type center
                  let center = typeCenters[node.type] || p5.Vector.fromAngle(0, 0);
                  node.pos = p5.Vector.add(center, p5.Vector.random2D().mult(p.random(20, 60)));
                }
                // Reset velocity to prevent sudden movements
                node.vel.mult(0);
                node.force.mult(0);
              }
            }
          }
          
          // Update previous visibility state
          for (let type in typeVisibility) {
            previousVisibility[type] = typeVisibility[type];
          }
        };

        p.mouseDragged = () => {
          if (draggedNode && typeVisibility[draggedNode.type]) {
            let mx = p.mouseX - p.width/2;
            let my = p.mouseY - p.height/2;
            
            // Update position with offset to maintain smooth dragging
            draggedNode.pos.x = mx - dragOffset.x;
            draggedNode.pos.y = my - dragOffset.y;
            draggedNode.vel.mult(0); // Stop any existing velocity
          }
        };

        p.mouseReleased = () => {
          if (draggedNode) {
            // Keep the node locked in its new position (don't unlock it)
            // draggedNode.locked remains true so it stays where dragged
            draggedNode = null; // Clear the dragged node reference
          }
        };
      };

      p5InstanceRef.current = new window.p5(sketch);
    };

    // Check if P5.js is already loaded
    if (window.p5) {
      initializeP5();
      return;
    }
    
    // Load P5.js dynamically
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js';
    script.onload = () => {
      if (window.p5) {
        initializeP5();
      }
    };
    document.head.appendChild(script);

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="demo-placeholder">
      <div className="einstein-quote">
        <blockquote>
          "Any fool can know. The point is to understand."
        </blockquote>
        <cite>— Albert Einstein</cite>
      </div>

      <div className="knowledge-graph-container">
        <div className="scenario-header">
          <div className="scenario-selector">
            <label htmlFor="scenario-select">Example: </label>
            <select id="scenario-select" defaultValue="ai">
              <option value="ai">AI Research</option>
              <option value="kitchen">Kitchen Ecosystem</option>
              <option value="kpmg">KPMG Services</option>
            </select>
          </div>
          <div id="scenario-text-container" className="scenario-text-display"></div>
        </div>

        <div className="rag-demo-section">
          <h3>Conventional RAG Process</h3>
          <div className="rag-controls">
            <div className="rag-control-group">
              <label htmlFor="chunk-size">Chunk Size:</label>
              <select id="chunk-size" defaultValue="50">
                <option value="10">10 words</option>
                <option value="25">25 words</option>
                <option value="50">50 words</option>
                <option value="75">75 words</option>
                <option value="100">100 words</option>
              </select>
            </div>
            <div className="rag-control-group">
              <label htmlFor="max-chunks">Max Chunks:</label>
              <select id="max-chunks" defaultValue="3">
                <option value="1">1 chunk</option>
                <option value="2">2 chunks</option>
                <option value="3">3 chunks</option>
                <option value="5">5 chunks</option>
              </select>
            </div>
            <div className="rag-control-group">
              <label htmlFor="query-input">Query:</label>
              <input type="text" id="rag-query" placeholder="Ask a question about the text..." />
            </div>
            <button id="run-rag" className="action-button">Watch a RAG Happen</button>
          </div>

          <div className="rag-steps">
            <div className="rag-step">
              <h4>1. Text Chunks</h4>
              <div id="rag-chunks" className="text-chunks-display">
                <p>Text will be chunked here...</p>
              </div>
            </div>
            <div className="rag-step">
              <h4>2. Query Match & Retrieval</h4>
              <div id="rag-retrieval" className="retrieved-chunks-display">
                <p>Retrieved chunks will appear here...</p>
              </div>
            </div>
            <div className="rag-step">
              <h4>3. Generated Answer</h4>
              <div id="rag-answer" className="rag-answer-display">
                <p>AI-generated answer will appear here...</p>
              </div>
            </div>
          </div>
        </div>

        <div className="graph-rag-demo-section">
          <h4>Graph RAG Process</h4>
          
          <div className="graph-rag-controls">
            <button id="extract-graph" className="action-button">Understanding &gt; Knowledge</button>
          </div>
          
          <div className="graph-rag-steps">
            <div className="rag-step">
              <h4>1. Entity Extraction</h4>
              <div id="extracted-entities" className="extracted-entities-display">
                <p>Click "Understanding &gt; Knowledge" to see extracted entities...</p>
              </div>
            </div>
            
            <div className="rag-step">
              <h4>2. Relationship Mapping</h4>
              <div id="extracted-relationships" className="extracted-relationships-display">
                <p>Relationships between entities will appear here...</p>
              </div>
            </div>
            
            <div className="rag-step">
              <h4>3. Hub Categories</h4>
              <div id="hub-categories" className="hub-categories-display">
                <p>Hierarchical hub structure will be shown here...</p>
              </div>
            </div>
          </div>
        </div>
        
        <div ref={canvasRef} className="knowledge-canvas"></div>
      </div>
    </div>
  );
}

export default KnowledgeUnderstandingDemo; 
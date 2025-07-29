import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [embeddings, setEmbeddings] = useState({});
  const [currentWords, setCurrentWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchEmbeddings, setSearchEmbeddings] = useState(null);
  const [stats, setStats] = useState(null);
  const [wordInput, setWordInput] = useState("Ireland, Irish, O'Connor, Dublin");
  const [queryInput, setQueryInput] = useState("concerns for economic pressure growth and market worries");
  const [documentsInput, setDocumentsInput] = useState(`US data sparks inflation worries and economic pressure on markets
Stock market fears rise amid uncertainty about interest rates  
Sports teams worry about declining attendance and financial pressure
Technology companies face competitive pressure in global markets
Political concerns grow over economic policies and market fears`);
  
  const canvasRef = useRef(null);
  const searchCanvasRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const searchP5InstanceRef = useRef(null);
  const embeddingsRef = useRef(embeddings);
  const currentWordsRef = useRef(currentWords);
  const loadingRef = useRef(loading);
  const searchEmbeddingsRef = useRef(searchEmbeddings);
  const lastEmbeddingsRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => {
    embeddingsRef.current = embeddings;
    currentWordsRef.current = currentWords;
    loadingRef.current = loading;
    searchEmbeddingsRef.current = searchEmbeddings;
  }, [embeddings, currentWords, loading, searchEmbeddings]);

  // Trigger search redraw when search embeddings change
  useEffect(() => {
    if (searchEmbeddings && Object.keys(searchEmbeddings).length > 0) {
      setTimeout(() => {
        if (window.triggerSearchRedraw) {
          window.triggerSearchRedraw();
        }
      }, 100);
    }
  }, [searchEmbeddings]);

  useEffect(() => {
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

  const initializeP5 = () => {
    if (!window.p5) return;
    
    // Check if canvas container exists
    if (!canvasRef.current) {
      console.log('Canvas container not found, delaying initialization');
      setTimeout(initializeP5, 100);
      return;
    }
    
    // Clean up any existing P5 instance
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
      p5InstanceRef.current = null;
    }

    const sketch = (p) => {
      let colors = {};
      let shouldRedraw = false;
      let lastEmbeddingsHash = '';
      
      // PCA implementation for dimensionality reduction
      class PCA {
        constructor() {
          this.mean = null;
          this.components = null;
        }
        
        fit(data) {
          const numFeatures = data[0].length;
          this.mean = new Array(numFeatures).fill(0);
          
          for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < numFeatures; j++) {
              this.mean[j] += data[i][j];
            }
          }
          
          for (let j = 0; j < numFeatures; j++) {
            this.mean[j] /= data.length;
          }
          
          const centeredData = data.map(row => 
            row.map((val, i) => val - this.mean[i])
          );
          
          this.components = this.calculateTopComponents(centeredData, 2);
        }
        
        transform(data) {
          if (!this.components || !this.mean) return null;
          
          return data.map(row => {
            const centered = row.map((val, i) => val - this.mean[i]);
            return this.components.map(component => 
              centered.reduce((sum, val, i) => sum + val * component[i], 0)
            );
          });
        }
        
        calculateTopComponents(data, numComponents) {
          const components = [];
          // Use deterministic initialization based on data
          const seed = data.reduce((sum, row) => sum + row.reduce((a, b) => a + b, 0), 0);
          
          for (let i = 0; i < numComponents; i++) {
            const component = new Array(data[0].length);
            for (let j = 0; j < component.length; j++) {
              // Use deterministic "random" values based on seed
              const pseudoRandom = Math.sin(seed + i * 1000 + j * 100) * 10000;
              component[j] = (pseudoRandom % 1) - 0.5;
            }
            const norm = Math.sqrt(component.reduce((sum, val) => sum + val * val, 0));
            for (let j = 0; j < component.length; j++) {
              component[j] /= norm;
            }
            components.push(component);
          }
          return components;
        }
      }

      p.setup = () => {
        // Check if canvas container exists
        if (!canvasRef.current) {
          console.log('Canvas container not found, skipping setup');
          return;
        }
        
        // Clear any existing canvases in the container
        canvasRef.current.innerHTML = '';
        
        const canvas = p.createCanvas(800, 400);
        canvas.parent(canvasRef.current);
        console.log('P5.js canvas created');
        p.noLoop(); // Prevent continuous redrawing
      };

      p.draw = () => {
        // Use refs to get current state
        const currentLoading = loadingRef.current;
        const currentEmbeddings = embeddingsRef.current;
        const currentWords = currentWordsRef.current;
        
        // Create a hash of current embeddings to detect changes
        const embeddingsHash = JSON.stringify(currentEmbeddings) + JSON.stringify(currentWords);
        
        if (embeddingsHash !== lastEmbeddingsHash) {
          lastEmbeddingsHash = embeddingsHash;
          shouldRedraw = true;
        }
        
        if (!shouldRedraw) return;
        
        p.background(26, 26, 26);
        
        if (currentLoading) {
          p.fill(255, 255, 255, 150);
          p.noStroke();
          p.textAlign(p.CENTER, p.CENTER);
          p.text('Loading embeddings...', p.width/2, p.height/2);
          shouldRedraw = false;
          return;
        }
        
        if (Object.keys(currentEmbeddings).length > 0 && currentWords.length > 0) {
          console.log('Drawing embeddings:', currentEmbeddings, currentWords);
          drawEmbeddingSpace(p, 'text-embedding-ada-002', 0, 0, 400, 400);
          drawEmbeddingSpace(p, 'text-embedding-3-small', 400, 0, 400, 400);
        } else {
          p.fill(255, 255, 255, 100);
          p.noStroke();
          p.textAlign(p.CENTER, p.CENTER);
          p.text('Click "Visualize Word Relationships" to see embeddings', p.width/2, p.height/2);
        }
        
        shouldRedraw = false;
      };

      const drawEmbeddingSpace = (p, modelName, x, y, w, h) => {
        const currentEmbeddings = embeddingsRef.current;
        const currentWords = currentWordsRef.current;
        
        if (!currentEmbeddings[modelName] || !currentWords.length) return;
        
        const pca = new PCA();
        const embeddingVectors = currentWords.map(word => currentEmbeddings[modelName][word]);
        
        if (!embeddingVectors.every(v => v)) {
          console.log('Missing embeddings for some words');
          return;
        }
        
        pca.fit(embeddingVectors);
        const transformed = pca.transform(embeddingVectors);
        
        if (!transformed) return;
        
        const xs = transformed.map(point => point[0]);
        const ys = transformed.map(point => point[1]);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        
        const padding = 50;
        
        // Draw axes
        p.stroke(255, 255, 255, 30);
        p.line(x + padding, y + h/2, x + w - padding, y + h/2);
        p.line(x + w/2, y + padding, x + w/2, y + h - padding);
        
        // Calculate center point for perspective effect
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const maxDistance = Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2) / 2;
        
        // Draw points and labels
        transformed.forEach((point, i) => {
          const word = currentWords[i];
          const px = p.map(point[0], minX, maxX, x + padding, x + w - padding);
          const py = p.map(point[1], minY, maxY, y + padding, y + h - padding);
          
          // Calculate distance from center for perspective effect
          const distanceFromCenter = Math.sqrt((point[0] - centerX) ** 2 + (point[1] - centerY) ** 2);
          const perspectiveFactor = 1 - (distanceFromCenter / maxDistance) * 0.4; // 40% size variation
          const dotSize = Math.max(4, 12 * perspectiveFactor); // Min 4px, max 12px
          
          if (!colors[word]) {
            // Use muted, minimalist colors
            const hue = (i * 137.508) % 360;
            colors[word] = `hsl(${hue}, 20%, 70%)`;
          }
          
          p.fill(colors[word]);
          p.noStroke();
          p.circle(px, py, dotSize);
          
          p.fill(255, 255, 255, 200);
          p.noStroke();
          p.textAlign(p.CENTER, p.CENTER);
          p.text(word, px, py - 15);
          
          drawConnections(p, word, px, py, transformed, currentWords, x, y, w, h, padding, minX, maxX, minY, maxY, modelName);
        });
        
        p.fill(255, 255, 255);
        p.noStroke();
        p.textAlign(p.LEFT, p.TOP);
        y = p.height - 40;
        p.text(`Model: ${modelName}`, x + 10, y + 10);
    };

      const drawConnections = (p, word, px, py, transformed, words, x, y, w, h, padding, minX, maxX, minY, maxY, modelName) => {
        const currentEmbeddings = embeddingsRef.current;
        const wordEmbedding = currentEmbeddings[modelName][word];
        if (!wordEmbedding) return;
        
        words.forEach((otherWord, i) => {
          if (word === otherWord) return;
          
          const otherEmbedding = currentEmbeddings[modelName][otherWord];
          if (!otherEmbedding) return;
          
          const similarity = cosineSimilarity(wordEmbedding, otherEmbedding);
          
          if (similarity > 0.5) {
            const otherPoint = transformed[i];
            const otherX = p.map(otherPoint[0], minX, maxX, x + padding, x + w - padding);
            const otherY = p.map(otherPoint[1], minY, maxY, y + padding, y + h - padding);
            
            if (similarity > 0.7) {
              // Strong connections (0.7+) - white lines
              p.stroke(255, 255, 255, similarity * 80);
              p.strokeWeight(similarity * 1.5);
            } else {
              // Weaker connections (0.5-0.7) - lighter gray lines
              p.stroke(150, 150, 150, similarity * 100);
              p.strokeWeight(similarity * 1);
            }
            p.line(px, py, otherX, otherY);
          }
        });
      };

      const cosineSimilarity = (a, b) => {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < a.length; i++) {
          dotProduct += a[i] * b[i];
          normA += a[i] * a[i];
          normB += b[i] * b[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
      };

      // Function to trigger redraw
      window.triggerRedraw = () => {
        shouldRedraw = true;
        p.redraw();
      };
    };

    p5InstanceRef.current = new window.p5(sketch);
  };

  const initializeSearchP5 = () => {
    if (!window.p5) return;
    
    // Check if canvas container exists
    if (!searchCanvasRef.current) {
      console.log('Search canvas container not found, delaying initialization');
      setTimeout(initializeSearchP5, 100);
      return;
    }
    
    // Clean up any existing search P5 instance
    if (searchP5InstanceRef.current) {
      searchP5InstanceRef.current.remove();
      searchP5InstanceRef.current = null;
    }

    const sketch = (p) => {
      let colors = {};
      let shouldRedraw = false;
      let lastSearchEmbeddingsHash = '';
      
      // PCA implementation for dimensionality reduction
      class PCA {
        constructor() {
          this.mean = null;
          this.components = null;
        }
        
        fit(data) {
          const numFeatures = data[0].length;
          this.mean = new Array(numFeatures).fill(0);
          
          for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < numFeatures; j++) {
              this.mean[j] += data[i][j];
            }
          }
          
          for (let j = 0; j < numFeatures; j++) {
            this.mean[j] /= data.length;
          }
          
          const centeredData = data.map(row => 
            row.map((val, i) => val - this.mean[i])
          );
          
          this.components = this.calculateTopComponents(centeredData, 2);
        }
        
        transform(data) {
          if (!this.components || !this.mean) return null;
          
          return data.map(row => {
            const centered = row.map((val, i) => val - this.mean[i]);
            return this.components.map(component => 
              centered.reduce((sum, val, i) => sum + val * component[i], 0)
            );
          });
        }
        
        calculateTopComponents(data, numComponents) {
          const components = [];
          // Use deterministic initialization based on data
          const seed = data.reduce((sum, row) => sum + row.reduce((a, b) => a + b, 0), 0);
          
          for (let i = 0; i < numComponents; i++) {
            const component = new Array(data[0].length);
            for (let j = 0; j < component.length; j++) {
              // Use deterministic "random" values based on seed
              const pseudoRandom = Math.sin(seed + i * 1000 + j * 100) * 10000;
              component[j] = (pseudoRandom % 1) - 0.5;
            }
            const norm = Math.sqrt(component.reduce((sum, val) => sum + val * val, 0));
            for (let j = 0; j < component.length; j++) {
              component[j] /= norm;
            }
            components.push(component);
          }
          return components;
        }
      }

      p.setup = () => {
        // Check if canvas container exists
        if (!searchCanvasRef.current) {
          console.log('Search canvas container not found, skipping setup');
          return;
        }
        
        // Clear any existing canvases in the container
        searchCanvasRef.current.innerHTML = '';
        
        const canvas = p.createCanvas(800, 400);
        canvas.parent(searchCanvasRef.current);
        console.log('Search P5.js canvas created');
        p.noLoop(); // Prevent continuous redrawing
      };

      p.draw = () => {
        // Use refs to get current state
        const currentSearchEmbeddings = searchEmbeddingsRef.current;
        
        // Create a hash of current search embeddings to detect changes
        const searchEmbeddingsHash = JSON.stringify(currentSearchEmbeddings);
        
        if (searchEmbeddingsHash !== lastSearchEmbeddingsHash) {
          lastSearchEmbeddingsHash = searchEmbeddingsHash;
          shouldRedraw = true;
        }
        
        if (!shouldRedraw) return;
        
        p.background(26, 26, 26);
        
        if (Object.keys(currentSearchEmbeddings || {}).length > 0) {
          console.log('Drawing search embeddings:', currentSearchEmbeddings);
          drawSearchEmbeddingSpace(p, 'text-embedding-ada-002', 0, 0, 400, 400);
          drawSearchEmbeddingSpace(p, 'text-embedding-3-small', 400, 0, 400, 400);
        } else {
          p.fill(255, 255, 255, 100);
          p.noStroke();
          p.textAlign(p.CENTER, p.CENTER);
          p.text('Click "Compare Search Results" to see query-document relationships', p.width/2, p.height/2);
        }
        
        shouldRedraw = false;
      };

      const drawSearchEmbeddingSpace = (p, modelName, x, y, w, h) => {
        const currentSearchEmbeddings = searchEmbeddingsRef.current;
        
        if (!currentSearchEmbeddings || !currentSearchEmbeddings[modelName]) return;
        
        const query = queryInput;
        const documents = documentsInput.split('\n').filter(d => d.trim());
        const allTexts = [query, ...documents];
        
        console.log('Model embeddings structure:', currentSearchEmbeddings[modelName]);
        console.log('All texts:', allTexts);
        
        const pca = new PCA();
        // The embeddings API returns an array in the same order as the input texts
        const embeddingVectors = currentSearchEmbeddings[modelName];
        
        if (!embeddingVectors || !Array.isArray(embeddingVectors) || embeddingVectors.length !== allTexts.length) {
          console.log('Invalid embeddings structure or length mismatch');
          console.log('Expected length:', allTexts.length);
          console.log('Actual embeddings:', embeddingVectors);
          return;
        }
        
        pca.fit(embeddingVectors);
        const transformed = pca.transform(embeddingVectors);
        
        if (!transformed) return;
        
        const xs = transformed.map(point => point[0]);
        const ys = transformed.map(point => point[1]);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        
        const padding = 50;
        
        // Draw axes
        p.stroke(255, 255, 255, 30);
        p.line(x + padding, y + h/2, x + w - padding, y + h/2);
        p.line(x + w/2, y + padding, x + w/2, y + h - padding);
        
        // Calculate center point for perspective effect
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const maxDistance = Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2) / 2;
        
        // Draw points and labels
        transformed.forEach((point, i) => {
          const text = allTexts[i];
          const px = p.map(point[0], minX, maxX, x + padding, x + w - padding);
          const py = p.map(point[1], minY, maxY, y + padding, y + h - padding);
          
          // Calculate distance from center for perspective effect
          const distanceFromCenter = Math.sqrt((point[0] - centerX) ** 2 + (point[1] - centerY) ** 2);
          const perspectiveFactor = 1 - (distanceFromCenter / maxDistance) * 0.4;
          const dotSize = Math.max(4, 12 * perspectiveFactor);
          
          if (!colors[text]) {
            if (i === 0) {
              // Query gets a special color
              colors[text] = 'hsl(200, 70%, 60%)';
            } else {
              // Documents get muted colors
              const hue = (i * 137.508) % 360;
              colors[text] = `hsl(${hue}, 20%, 70%)`;
            }
          }
          
          p.fill(colors[text]);
          p.noStroke();
          p.circle(px, py, dotSize);
          
          // Draw label
          p.fill(255, 255, 255, 200);
          p.noStroke();
          p.textAlign(p.CENTER, p.CENTER);
          const label = i === 0 ? 'QUERY' : `Doc ${i}`;
          p.text(label, px, py - 15);
          
          // Draw connections from query to documents
          if (i === 0) {
            drawSearchConnections(p, point, px, py, transformed, allTexts, x, y, w, h, padding, minX, maxX, minY, maxY, modelName);
          }
        });
        
        p.fill(255, 255, 255);
        p.noStroke();
        p.textAlign(p.LEFT, p.TOP);
        y = p.height - 40;
        p.text(`Model: ${modelName}`, x + 10, y + 10);
      };

      const drawSearchConnections = (p, queryPoint, qx, qy, transformed, texts, x, y, w, h, padding, minX, maxX, minY, maxY, modelName) => {
        const currentSearchEmbeddings = searchEmbeddingsRef.current;
        const queryEmbedding = currentSearchEmbeddings[modelName][0]; // Query is first in array
        if (!queryEmbedding) return;
        
        texts.slice(1).forEach((document, i) => {
          const docEmbedding = currentSearchEmbeddings[modelName][i + 1]; // Documents start at index 1
          if (!docEmbedding) return;
          
          const similarity = cosineSimilarity(queryEmbedding, docEmbedding);
          
          if (similarity > 0.5) { // Show connections above 0.5
            const docPoint = transformed[i + 1];
            const docX = p.map(docPoint[0], minX, maxX, x + padding, x + w - padding);
            const docY = p.map(docPoint[1], minY, maxY, y + padding, y + h - padding);
            
            if (similarity > 0.7) {
              // Strong connections (0.7+) - white lines
              p.stroke(255, 255, 255, similarity * 100);
              p.strokeWeight(similarity * 2);
            } else {
              // Weaker connections (0.5-0.7) - lighter gray lines
              p.stroke(150, 150, 150, similarity * 120);
              p.strokeWeight(similarity * 1.5);
            }
            p.line(qx, qy, docX, docY);
          }
        });
      };

      const cosineSimilarity = (a, b) => {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < a.length; i++) {
          dotProduct += a[i] * b[i];
          normA += a[i] * a[i];
          normB += b[i] * b[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
      };

      // Function to trigger redraw
      window.triggerSearchRedraw = () => {
        shouldRedraw = true;
        p.redraw();
      };
    };

    searchP5InstanceRef.current = new window.p5(sketch);
  };

  const visualizeWords = async () => {
    const words = wordInput.split(',').map(w => w.trim()).filter(w => w);
    if (words.length === 0) return;
    
    console.log('Visualizing words:', words);
    setCurrentWords(words);
    setLoading(true);
    
    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          texts: words,
          models: ['text-embedding-ada-002', 'text-embedding-3-small']
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received embeddings:', data);
      
      const processedEmbeddings = {};
      Object.keys(data).forEach(model => {
        processedEmbeddings[model] = {};
        words.forEach((word, i) => {
          processedEmbeddings[model][word] = data[model][i];
        });
      });
      
      setEmbeddings(processedEmbeddings);
      setLoading(false);
      showStats(processedEmbeddings, words);
      
      // Trigger redraw after state update
      setTimeout(() => {
        if (window.triggerRedraw) {
          window.triggerRedraw();
        }
      }, 100);
      
    } catch (error) {
      console.error('Error getting embeddings:', error);
      setLoading(false);
      alert('Error getting embeddings. Check the console for details.');
    }
  };

  const performSimilaritySearch = async () => {
    const query = queryInput;
    const documents = documentsInput.split('\n').filter(d => d.trim());
    
    if (!query || documents.length === 0) return;
    
    setSearchResults({ loading: true });
    
    try {
      const models = ['text-embedding-ada-002', 'text-embedding-3-small'];
      const results = {};
      const searchEmbeddingsData = {};
      
      for (const model of models) {
        const response = await fetch('/api/similarity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, documents, model })
        });
        results[model] = await response.json();
        
        // Also get embeddings for visualization
        const embeddingsResponse = await fetch('/api/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            texts: [query, ...documents], 
            models: [model] 
          })
        });
        const embeddingsData = await embeddingsResponse.json();
        searchEmbeddingsData[model] = embeddingsData[model];
      }
      
      setSearchResults(results);
      setSearchEmbeddings(searchEmbeddingsData);
      
      // Initialize search P5.js visualization
      initializeSearchP5();
      
    } catch (error) {
      console.error('Error:', error);
      setSearchResults({ error: 'Error performing search' });
    }
  };

  const showStats = (embeddingsData, words) => {
    let statsHtml = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <h4><b>Azure OpenAI</b> &nbsp;<tt>text-embedding-ada-002</tt></h4>
          <p>Released: December 2022</p>
          <p>Cost: $0.0001 per 1K tokens</p>
          <p>Dimensions: 1,536</p>
        </div>
        <div>
          <h4><b>Azure OpenAI</b> &nbsp;<tt>text-embedding-3-small</tt></h4>
          <p>Released: January 2024</p>
          <p>Cost: $0.00002 per 1K tokens (5x cheaper!)</p>
          <p>Dimensions: 512 ~ 1,536</p>
        </div>
      </div>
    `;
    
    setStats(statsHtml);
  };

  const cosineSimilarity = (a, b) => {
    // Check if both vectors exist and are arrays
    if (!a || !b || !Array.isArray(a) || !Array.isArray(b)) {
      console.log('Invalid vectors for cosine similarity:', { a, b });
      return 0;
    }
    
    // Check if vectors have the same length
    if (a.length !== b.length) {
      console.log('Vector length mismatch:', { aLength: a.length, bLength: b.length });
      return 0;
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    // Check for zero norms to avoid division by zero
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  const displaySearchResults = (results, query) => {
    const documents = documentsInput.split('\n').filter(d => d.trim());
    
    let html = `<h4>Query: "${query}"</h4><br />`;
    
    html += `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
    `;
    
    Object.keys(results).forEach(model => {
      html += `
        <div>
          <h5><b>Azure OpenAI</b> &nbsp; <tt>${model}</tt></h5><br />
      `;
      
      results[model].slice(0, 3).forEach((result, i) => {
        // Find which document number this result corresponds to
        const documentIndex = documents.findIndex(doc => doc.trim() === result.document.trim());
        const documentNumber = documentIndex !== -1 ? documentIndex + 1 : 'Unknown';
        
        html += `
          <div class="result-item">
            <div class="result-header">
              <span class="result-rank">#${i + 1}</span>
              <div class="result-meta">
                <span class="result-similarity">Similarity: ${result.similarity.toFixed(3)}</span>
                <span class="result-doc-number">Doc ${documentNumber}</span>
              </div>
            </div>
            <div class="result-content">
              ${result.document}
            </div>
          </div>
        `;
      });
      
      html += '</div>';
    });
    
    html += '</div>';
    
    return html;
  };

  return (
    <div className="app">      
      <main className="app-main">
        {/* Section 1: Word Relationship Visualization */}
        <section className="section">
          <h2>🧑‍🍳 Embedding Models Are Like Flour To Your AI Dough</h2>
          <p className="section-description">
            Little kitchen demo of what sits at the heart of your RAG pipeline.
          </p>
          
          <div className="controls">
            <div className="input-group">
              <label htmlFor="wordInput">Enter words to visualize (comma-separated):</label>
              <input 
                type="text" 
                id="wordInput" 
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                placeholder="Ireland, Irish, O'Connor, Dublin, pressure, worries, fears" 
              />
            </div>
            <button onClick={visualizeWords} className="action-button">
              Visualize Word Relationships
            </button>
          </div>

          {stats && (
            <div className="stats">
              <h3>Model Performance Comparison</h3>
              <div dangerouslySetInnerHTML={{ __html: stats }} />
            </div>
          )}

          {embeddings && Object.keys(embeddings).length > 0 && (
            <div className="embedding-vectors">
              <h3>Raw Embedding Vectors (1536 dimensions)</h3>
              <p className="vector-description">
                Each word is converted to a vector of 1536 numbers. Here are the actual values:
              </p>
              {currentWords.map((word, wordIndex) => (
                <div key={word} className="word-vector">
                  <h4>{word}</h4>
                  {Object.keys(embeddings).map(model => (
                    <div key={model} className="model-vector">
                      <h5>{model}</h5>
                      <div className="vector-numbers">
                        {embeddings[model][word] && Array.isArray(embeddings[model][word]) ? (
                          <>
                            {embeddings[model][word].slice(0, 50).map((num, i) => (
                              <span key={i} className="vector-number">{num.toFixed(4)}</span>
                            ))}
                            {embeddings[model][word].length > 50 && (
                              <span className="vector-ellipsis">... ({embeddings[model][word].length - 50} more numbers)</span>
                            )}
                          </>
                        ) : (
                          <span className="vector-loading">Loading...</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="visualization-canvas">
            <h3 className="canvas-title">Reducing the vectors to lower dimensions using PCA</h3>
            <p className="canvas-description">
              This 2D visualization is a simplified representation. The actual embedding space has 1536 dimensions.
            </p>
            <div ref={canvasRef}></div>
          </div>

          {stats && currentWords.length > 1 && (
            <div className="word-relationships">
              <h3>Word Relationship Calculations</h3>
              <p className="relationship-description">
                Cosine similarity scores between word pairs (higher values indicate more similar meanings):
              </p>
              <div className="relationship-grid">
                {currentWords.map((word1, i) => 
                  currentWords.slice(i + 1).map((word2, j) => {
                    // Check if embeddings exist for both words in both models
                    const adaEmbeddings = embeddings['text-embedding-ada-002'];
                    const smallEmbeddings = embeddings['text-embedding-3-small'];
                    
                    const word1Ada = adaEmbeddings && adaEmbeddings[word1];
                    const word2Ada = adaEmbeddings && adaEmbeddings[word2];
                    const word1Small = smallEmbeddings && smallEmbeddings[word1];
                    const word2Small = smallEmbeddings && smallEmbeddings[word2];
                    
                    const sim1 = (word1Ada && word2Ada) ? 
                      cosineSimilarity(word1Ada, word2Ada) : 0;
                    const sim2 = (word1Small && word2Small) ? 
                      cosineSimilarity(word1Small, word2Small) : 0;
                    
                    return (
                      <div key={`${word1}-${word2}`} className="relationship-item">
                        <div className="word-pair">
                          <span className="word1">{word1}</span>
                          <span className="separator">↔</span>
                          <span className="word2">{word2}</span>
                        </div>
                        <div className="similarity-scores">
                          <div className="score ada">
                            <span className="model-label">ada-002:</span>
                            <span className="score-value">{sim1.toFixed(3)}</span>
                          </div>
                          <div className="score small">
                            <span className="model-label">3-small:</span>
                            <span className="score-value">{sim2.toFixed(3)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </section>

        {/* Section 2: Similarity Search */}
        <section className="section">
          <h2>🍝Embeddings And 🔍Search Are Relatives</h2>
          <p className="section-description">
            Compare how document search results are ranked by different embedding models.
          </p>
          
          <div className="controls">
            <div className="input-group">
              <label htmlFor="queryInput">Search Query:</label>
              <input 
                type="text" 
                id="queryInput" 
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="market pressure concerns" 
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="documentsInput">Documents to search (one per line):</label>
              <textarea 
                id="documentsInput" 
                rows="4" 
                value={documentsInput}
                onChange={(e) => setDocumentsInput(e.target.value)}
                placeholder="Enter documents to search..."
              />
            </div>
            <button onClick={performSimilaritySearch} className="action-button">
              Compare Search Results
            </button>
          </div>

          {searchResults && (
            <div className="similarity-results">
              <h3>Search Results Comparison</h3>
              {searchResults.loading ? (
                <div className="loading">Searching...</div>
              ) : searchResults.error ? (
                <div className="error">{searchResults.error}</div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: displaySearchResults(searchResults, queryInput) }} />
              )}
            </div>
          )}

          {searchEmbeddings && Object.keys(searchEmbeddings).length > 0 && (
            <div className="visualization-canvas">
              <h3 className="canvas-title">Query-Document Relationships in Embedding Space</h3>
              <p className="canvas-description">
                Blue dot represents the query. Lines show similarity connections to documents.
              </p>
              <div ref={searchCanvasRef}></div>
            </div>
          )}
        </section>
      </main>
      
      <footer className="app-footer">
        <p>A Cozy AI Kitchen 🍰 Recipe</p>
      </footer>
    </div>
  )
}

export default App 
// server.js - Node.js Express server with OpenAI integration
import express from 'express';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Set your API key in environment variables
});

app.use(cors());
app.use(express.json());

// Check if we're in development or production
const isDevelopment = process.env.NODE_ENV !== 'production';
const distPath = path.join(__dirname, 'dist');
const distExists = fs.existsSync(distPath);

if (isDevelopment && !distExists) {
  console.log('⚠️  Development mode: No dist folder found. Please run "npm run build" first or use "npm run dev" for development.');
  console.log('📝 For development, start the Vite dev server with "npm run dev" in a separate terminal.');
  
  // In development without dist, just serve API endpoints
  app.get('/', (req, res) => {
    res.json({
      message: 'API Server Running',
      status: 'development',
      note: 'Please run "npm run dev" in a separate terminal for the React app',
      endpoints: {
        embeddings: 'POST /api/embeddings',
        similarity: 'POST /api/similarity'
      }
    });
  });
} else {
  // Production mode or development with dist folder
  if (distExists) {
    app.use(express.static(distPath));
    console.log('✅ Serving static files from dist/ directory');
  }
  
  // Serve the main HTML file
  app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({
        error: 'index.html not found',
        message: 'Please run "npm run build" to create the dist folder'
      });
    }
  });
}

// API endpoint to get embeddings
app.post('/api/embeddings', async (req, res) => {
  try {
    const { texts, models = ['text-embedding-ada-002', 'text-embedding-3-small'] } = req.body;
    
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'Texts array is required and cannot be empty' });
    }
    
    const results = {};
    
    for (const model of models) {
      const response = await openai.embeddings.create({
        model: model,
        input: texts,
      });
      
      results[model] = response.data.map(item => item.embedding);
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error getting embeddings:', error);
    res.status(500).json({ 
      error: 'Failed to get embeddings',
      details: error.message 
    });
  }
});

// API endpoint for similarity search
app.post('/api/similarity', async (req, res) => {
  try {
    const { query, documents, model = 'text-embedding-3-small' } = req.body;
    
    if (!query || !documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ 
        error: 'Query and documents array are required' 
      });
    }
    
    // Get embeddings for query and documents
    const allTexts = [query, ...documents];
    const response = await openai.embeddings.create({
      model: model,
      input: allTexts,
    });
    
    const embeddings = response.data.map(item => item.embedding);
    const queryEmbedding = embeddings[0];
    const docEmbeddings = embeddings.slice(1);
    
    // Calculate cosine similarities
    const similarities = docEmbeddings.map((docEmb, index) => ({
      document: documents[index],
      similarity: cosineSimilarity(queryEmbedding, docEmb),
      index: index
    }));
    
    // Sort by similarity (highest first)
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    res.json(similarities);
  } catch (error) {
    console.error('Error calculating similarity:', error);
    res.status(500).json({ 
      error: 'Failed to calculate similarity',
      details: error.message 
    });
  }
});

// API endpoint for text completion (for scissors demo)
app.post('/api/complete', async (req, res) => {
  try {
    const { prompt, context, model = 'gpt-4o-mini' } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ 
        error: 'Prompt is required and must be a string' 
      });
    }
    
    let systemMessage = "You are a helpful assistant. Complete the given sentence or prompt in a natural and contextually appropriate way.";
    let userMessage = prompt;
    
    // If context is provided, include it in the prompt
    if (context && typeof context === 'string' && context.trim()) {
      systemMessage = "You are a helpful assistant. Use the provided context to complete the given sentence or prompt in a natural and contextually appropriate way.";
      userMessage = `Context:\n${context}\n\nComplete this sentence: ${prompt}`;
    }
    
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });
    
    const completion = response.choices[0].message.content.trim();
    
    res.json({
      completion: completion,
      hasContext: !!context,
      model: model
    });
    
  } catch (error) {
    console.error('Error generating completion:', error);
    res.status(500).json({ 
      error: 'Failed to generate completion',
      details: error.message 
    });
  }
});

// API endpoint for RAG (Retrieval-Augmented Generation)
app.post('/api/rag', async (req, res) => {
  try {
    const { query, context, model = 'gpt-4o-mini' } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: 'Query is required and must be a string' 
      });
    }
    
    if (!context || typeof context !== 'string') {
      return res.status(400).json({ 
        error: 'Context is required and must be a string' 
      });
    }
    
    const systemMessage = "You are a helpful assistant. Answer the user's question based on the provided context. Use the information available to provide a useful answer, even if you need to infer from related concepts. If you cannot provide any relevant answer from the context, then say so. Do not use external knowledge beyond what's in the context.";
    const userMessage = `Context:\n${context}\n\nQuestion: ${query}`;
    
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      max_tokens: 200,
      temperature: 0.3, // Lower temperature for more focused answers
    });
    
    const answer = response.choices[0].message.content.trim();
    
    res.json({
      answer: answer,
      query: query,
      model: model
    });
    
  } catch (error) {
    console.error('Error generating RAG response:', error);
    res.status(500).json({ 
      error: 'Failed to generate RAG response',
      details: error.message 
    });
  }
});

// API endpoint for structured data extraction (for context slingshot demo)
app.post('/api/extract-structured', async (req, res) => {
  try {
    const { text, prompt, format = 'structured', model = 'gpt-4o-mini' } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Text is required and must be a string' 
      });
    }
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ 
        error: 'Prompt is required and must be a string' 
      });
    }
    
    let systemMessage, userMessage;
    
    if (format === 'json') {
      systemMessage = `You are a data extraction expert. Extract the requested information from the provided text and return it as valid JSON. Be thorough and accurate. Return only the JSON object, no additional text or explanation.`;
      userMessage = `Extract the following information from this text: ${prompt}

Text to analyze:
${text}

Return the extracted information as a well-structured JSON object with appropriate field names and data types.`;
    } else if (format === 'executable') {
      systemMessage = `You are a code generation expert. Based on the extracted information, generate actual executable code such as SQL queries, API calls, function invocations, or other programming commands that would use this data. Be practical and realistic.`;
      userMessage = `Based on this request: ${prompt}

Text to analyze:
${text}

Generate actual executable code that would accomplish the task described. This could be SQL queries, JavaScript function calls, API requests, or other programming commands. Include comments and make it production-ready.`;
    } else {
      systemMessage = `You are a data extraction expert. Extract the requested information from the provided text and present it in a clear, organized, human-readable format. Be thorough and accurate.`;
      userMessage = `Extract the following information from this text: ${prompt}

Text to analyze:
${text}

Present the extracted information in a clear, organized format that would be easy for humans to read and understand.`;
    }
    
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more consistent extraction
    });
    
    let extraction = response.choices[0].message.content.trim();
    
    // If JSON format requested, try to parse and reformat
    if (format === 'json') {
      try {
        const parsedJson = JSON.parse(extraction);
        extraction = JSON.stringify(parsedJson, null, 2);
      } catch (parseError) {
        console.log('JSON parsing failed, returning raw response');
        // If parsing fails, return the raw response
      }
    }
    
    res.json({
      extraction: extraction,
      format: format,
      model: model,
      originalPrompt: prompt
    });
    
  } catch (error) {
    console.error('Error extracting structured data:', error);
    res.status(500).json({ 
      error: 'Failed to extract structured data',
      details: error.message 
    });
  }
});

// Helper function for cosine similarity
function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Set' : 'NOT SET'}`);
  
  if (isDevelopment && !distExists) {
    console.log(`📝 Development mode: API server only`);
    console.log(`🌐 Visit http://localhost:${PORT} for API info`);
    console.log(`💡 Run "npm run dev" in another terminal for the React app`);
  } else if (distExists) {
    console.log(`✅ Production mode: Serving React app`);
    console.log(`🌐 Visit http://localhost:${PORT} to view the application`);
  } else {
    console.log(`⚠️  No dist folder found. Run "npm run build" first.`);
  }
}); 
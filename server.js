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
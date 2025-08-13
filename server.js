// server.js - Node.js Express server with OpenAI integration
import express from 'express';
import OpenAI, { AzureOpenAI } from 'openai';
import ModelClient from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Use latest stable API version for all models (per Azure OpenAI documentation)
const AZURE_API_VERSION = '2024-10-21'; // Latest GA version from Microsoft docs

// Initialize OpenAI clients
const openai = process.env.USE_AZURE_OPENAI === 'true' 
  ? null // We'll create Azure clients per request with correct API version
  : new OpenAI({
      apiKey: process.env.OPENAI_API_KEY // Set your API key in environment variables
    });

// Create Azure OpenAI client for a specific deployment
function createAzureOpenAIClient(model) {
  if (process.env.USE_AZURE_OPENAI !== 'true') {
    return openai;
  }
  
  // Use the official AzureOpenAI constructor with deployment name
  return new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    deployment: model, // Use model name as deployment name
    apiVersion: getApiVersion()
  });
}

// Helper function to get the API version (same for all models)
function getApiVersion() {
  if (process.env.USE_AZURE_OPENAI === 'true') {
    return process.env.AZURE_OPENAI_API_VERSION || AZURE_API_VERSION;
  }
  return undefined; // Standard OpenAI doesn't need API version
}

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
      const client = createAzureOpenAIClient(model);
      
      // Debug: Log the API version being used
      if (process.env.USE_AZURE_OPENAI === 'true') {
        console.log(`🔧 Using API version ${getApiVersion()} for model ${model}`);
      }
      
      const response = await client.embeddings.create({
        model: process.env.USE_AZURE_OPENAI === 'true' ? "" : model, // Empty string for Azure OpenAI
        input: texts,
      });
      
      results[model] = response.data.map(item => item.embedding);
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error getting embeddings:', error);
    
    // Get models from request body for debugging (models variable is out of scope here)
    const requestedModels = req.body.models || ['text-embedding-ada-002', 'text-embedding-3-small'];
    
    // Enhanced debugging for Azure OpenAI
    if (process.env.USE_AZURE_OPENAI === 'true') {
      console.error('=== AZURE OPENAI DEBUG INFO ===');
      console.error('Requested models:', requestedModels);
      console.error('API version:', getApiVersion());
      console.error('Azure endpoint:', process.env.AZURE_OPENAI_ENDPOINT);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      if (error.status === 404) {
        console.error('❌ DEPLOYMENT NOT FOUND!');
        console.error('Expected deployment names to exist in Azure OpenAI Studio:');
        requestedModels.forEach(model => {
          console.error(`   - ${model}`);
        });
        console.error('Make sure deployment names in Azure match model names exactly!');
      }
      console.error('===============================');
    }
    
    res.status(500).json({ 
      error: 'Failed to get embeddings',
      details: error.message,
      models: requestedModels,
      isAzure: process.env.USE_AZURE_OPENAI === 'true'
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
    const client = createAzureOpenAIClient(model);
    
    // Debug: Log the API version being used
    if (process.env.USE_AZURE_OPENAI === 'true') {
      console.log(`🔧 Using API version ${getApiVersion()} for similarity model ${model}`);
    }
    
    const response = await client.embeddings.create({
      model: process.env.USE_AZURE_OPENAI === 'true' ? "" : model, // Empty string for Azure OpenAI
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
    
    // Get model from request body for debugging (model variable is out of scope here)
    const requestedModel = req.body.model || 'text-embedding-3-small';
    
    // Enhanced debugging for Azure OpenAI
    if (process.env.USE_AZURE_OPENAI === 'true') {
      console.error('=== AZURE OPENAI SIMILARITY DEBUG INFO ===');
      console.error('Requested model:', requestedModel);
      console.error('API version:', getApiVersion());
      console.error('Azure endpoint:', process.env.AZURE_OPENAI_ENDPOINT);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      if (error.status === 404) {
        console.error('❌ SIMILARITY DEPLOYMENT NOT FOUND!');
        console.error(`Expected deployment name to exist in Azure OpenAI Studio: ${requestedModel}`);
        console.error('Make sure deployment name in Azure matches model name exactly!');
      }
      console.error('==========================================');
    }
    
    res.status(500).json({ 
      error: 'Failed to calculate similarity',
      details: error.message,
      model: requestedModel,
      isAzure: process.env.USE_AZURE_OPENAI === 'true'
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
    
    const client = createAzureOpenAIClient(model);
    
    // Debug: Log the API version being used
    if (process.env.USE_AZURE_OPENAI === 'true') {
      console.log(`🔧 Using API version ${getApiVersion()} for completion model ${model}`);
    }
    
    const response = await client.chat.completions.create({
      model: process.env.USE_AZURE_OPENAI === 'true' ? "" : model, // Empty string for Azure OpenAI
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
    
    // Get model from request body for debugging (model variable is out of scope here)
    const requestedModel = req.body.model || 'gpt-4o-mini';
    
    // Enhanced debugging for Azure OpenAI
    if (process.env.USE_AZURE_OPENAI === 'true') {
      console.error('=== AZURE OPENAI COMPLETION DEBUG INFO ===');
      console.error('Requested model:', requestedModel);
      console.error('API version:', getApiVersion());
      console.error('Azure endpoint:', process.env.AZURE_OPENAI_ENDPOINT);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      if (error.status === 404) {
        console.error('❌ COMPLETION DEPLOYMENT NOT FOUND!');
        console.error(`Expected deployment name to exist in Azure OpenAI Studio: ${requestedModel}`);
        console.error('Make sure deployment name in Azure matches model name exactly!');
      }
      console.error('===========================================');
    }
    
    res.status(500).json({ 
      error: 'Failed to generate completion',
      details: error.message,
      model: requestedModel,
      isAzure: process.env.USE_AZURE_OPENAI === 'true'
    });
  }
});

// API endpoint for RAG (Retrieval-Augmented Generation)
app.post('/api/rag', async (req, res) => {
  try {
    const { query, context, model = 'gpt-4o-mini', idkMode = false } = req.body;
    
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
    
    // Choose system message based on IDK mode
    const systemMessage = idkMode 
      ? "You are a helpful assistant. Answer the user's question based ONLY on the provided context. If the context does not contain enough information to answer the question accurately, clearly state 'I don't have enough information to answer this question.' Do not infer, guess, or use external knowledge beyond what's explicitly in the context. Keep the answer succinct (2–3 sentences)."
      : "You are a helpful assistant. Answer the user's question based on the provided context. Use the information available to provide a useful answer, even if you need to infer from related concepts. If you cannot provide any relevant answer from the context, then say so. Do not use external knowledge beyond what's in the context. Keep the answer succinct (2–3 sentences).";
    const userMessage = `Context:\n${context}\n\nQuestion: ${query}`;
    
    const client = createAzureOpenAIClient(model);
    
    // Debug: Log the API version being used
    if (process.env.USE_AZURE_OPENAI === 'true') {
      console.log(`🔧 Using API version ${getApiVersion()} for RAG model ${model}`);
    }
    
    const response = await client.chat.completions.create({
      model: process.env.USE_AZURE_OPENAI === 'true' ? "" : model, // Empty string for Azure OpenAI
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      max_tokens: 120,
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
    
    // Get model from request body for debugging (model variable is out of scope here)
    const requestedModel = req.body.model || 'gpt-4o-mini';
    
    // Enhanced debugging for Azure OpenAI
    if (process.env.USE_AZURE_OPENAI === 'true') {
      console.error('=== AZURE OPENAI RAG DEBUG INFO ===');
      console.error('Requested model:', requestedModel);
      console.error('API version:', getApiVersion());
      console.error('Azure endpoint:', process.env.AZURE_OPENAI_ENDPOINT);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      if (error.status === 404) {
        console.error('❌ RAG DEPLOYMENT NOT FOUND!');
        console.error(`Expected deployment name to exist in Azure OpenAI Studio: ${requestedModel}`);
        console.error('Make sure deployment name in Azure matches model name exactly!');
      }
      console.error('=======================================');
    }
    
    res.status(500).json({ 
      error: 'Failed to generate RAG response',
      details: error.message,
      model: requestedModel,
      isAzure: process.env.USE_AZURE_OPENAI === 'true'
    });
  }
});

// API endpoint for chat completion with logprobs (OpenAI only)
app.post('/api/complete-logprobs', async (req, res) => {
  try {
    const {
      prompt,
      model = 'gpt-4o',
      max_tokens = 32,
      temperature = 0.7,
      top_p = 1,
      top_logprobs = 5
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string' });
    }

    // Force standard OpenAI for reliability per requirement
    if (!openai) {
      return res.status(500).json({
        error: 'OpenAI client not configured',
        details: 'Set OPENAI_API_KEY and ensure USE_AZURE_OPENAI is not true for this endpoint.'
      });
    }

    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens,
      temperature,
      top_p,
      logprobs: true,
      top_logprobs
    });

    const choice = response.choices?.[0];
    const content = choice?.message?.content || '';
    const steps = choice?.logprobs?.content || [];

    res.json({
      content,
      steps,
      model,
      temperature,
      top_p,
      max_tokens,
      top_logprobs
    });
  } catch (error) {
    console.error('Error generating completion with logprobs:', error);
    res.status(500).json({
      error: 'Failed to generate completion with logprobs',
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
    
    const client = createAzureOpenAIClient(model);
    
    // Debug: Log the API version being used
    if (process.env.USE_AZURE_OPENAI === 'true') {
      console.log(`🔧 Using API version ${getApiVersion()} for extraction model ${model}`);
    }
    
    const response = await client.chat.completions.create({
      model: process.env.USE_AZURE_OPENAI === 'true' ? "" : model, // Empty string for Azure OpenAI
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
    
    // Get model from request body for debugging (model variable is out of scope here)
    const requestedModel = req.body.model || 'gpt-4o-mini';
    
    // Enhanced debugging for Azure OpenAI
    if (process.env.USE_AZURE_OPENAI === 'true') {
      console.error('=== AZURE OPENAI EXTRACTION DEBUG INFO ===');
      console.error('Requested model:', requestedModel);
      console.error('API version:', getApiVersion());
      console.error('Azure endpoint:', process.env.AZURE_OPENAI_ENDPOINT);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      if (error.status === 404) {
        console.error('❌ EXTRACTION DEPLOYMENT NOT FOUND!');
        console.error(`Expected deployment name to exist in Azure OpenAI Studio: ${requestedModel}`);
        console.error('Make sure deployment name in Azure matches model name exactly!');
      }
      console.error('============================================');
    }
    
    res.status(500).json({ 
      error: 'Failed to extract structured data',
      details: error.message,
      model: requestedModel,
      isAzure: process.env.USE_AZURE_OPENAI === 'true'
    });
  }
});

// API endpoint for GitHub Models (for strawberry demo)
app.post('/api/github-models', async (req, res) => {
  try {
    const { model, question, temperature = 0.3 } = req.body;
    
    if (!model || typeof model !== 'string') {
      return res.status(400).json({ 
        error: 'Model is required and must be a string' 
      });
    }
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ 
        error: 'Question is required and must be a string' 
      });
    }
    
    // Check if GitHub token is available
    if (!process.env.GITHUB_TOKEN) {
      return res.status(500).json({ 
        error: 'GitHub token not configured',
        details: 'Please set GITHUB_TOKEN environment variable'
      });
    }
    
    console.log(`🔍 GitHub Models API: Running ${model} on question: ${question.substring(0, 50)}...`);
    
    // Initialize GitHub Models client
    const client = ModelClient(
      "https://models.github.ai/inference",
      new AzureKeyCredential(process.env.GITHUB_TOKEN)
    );
    
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: "You are a helpful assistant. Please answer the question accurately and concisely." },
          { role: "user", content: question }
        ],
        model: model,
        temperature: temperature,
        max_tokens: 2048,
        top_p: 1
      }
    });
    
    // Check if response is unexpected
    if (response.status !== "200") {
      console.error('GitHub Models API error:', response);
      return res.status(500).json({
        error: 'GitHub Models API error',
        details: response.body?.error?.message || 'Unknown error',
        status: response.status
      });
    }
    
    const completion = response.body.choices[0].message.content;
    
    console.log(`✅ GitHub Models API: ${model} responded successfully`);
    
    res.json({
      response: completion,
      model: model,
      question: question,
      temperature: temperature
    });
    
  } catch (error) {
    console.error('Error with GitHub Models API:', error);
    
    // Get model from request body for debugging
    const requestedModel = req.body.model || 'unknown';
    
    console.error('=== GITHUB MODELS DEBUG INFO ===');
    console.error('Requested model:', requestedModel);
    console.error('GitHub token available:', !!process.env.GITHUB_TOKEN);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    console.error('=================================');
    
    res.status(500).json({ 
      error: 'Failed to get response from GitHub Models',
      details: error.message,
      model: requestedModel,
      hasToken: !!process.env.GITHUB_TOKEN
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
  
  // Log OpenAI configuration
  const isAzure = process.env.USE_AZURE_OPENAI === 'true';
  if (isAzure) {
    console.log(`🤖 Using Azure OpenAI`);
    console.log(`🔑 Azure OpenAI API Key: ${process.env.AZURE_OPENAI_API_KEY ? 'Set' : 'NOT SET'}`);
    console.log(`🌐 Azure OpenAI Endpoint: ${process.env.AZURE_OPENAI_ENDPOINT || 'NOT SET'}`);
    console.log(`📅 Azure OpenAI API Version: ${process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview (default)'}`);
    
    // List required deployments
    console.log(`🔧 Required Azure OpenAI Deployments:`);
    console.log(`   - text-embedding-ada-002 (for embeddings)`);
    console.log(`   - text-embedding-3-small (for embeddings)`);  
    console.log(`   - gpt-4o-mini (for chat completions)`);
    console.log(`⚠️  Each deployment name must exactly match the model name above!`);
    console.log(`🔧 Using API version: ${getApiVersion()} (latest stable)`);
    console.log(`💡 If you get 404 DeploymentNotFound errors, check your deployment names in Azure OpenAI Studio`);
  } else {
    console.log(`🤖 Using OpenAI`);
    console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Set' : 'NOT SET'}`);
  }
  
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
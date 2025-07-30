# 🧑‍🍳 A Cozy AI Kitchenette

A little app that started off as a way to teach embeddings and then it became a lot of other things all at once.

## 💁 About @johnmaeda

![design.co](public/design-co.png)

## 🛠️ Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- OpenAI API key OR Azure OpenAI resource (with appropriate model deployments)

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up your OpenAI API key:**

**For standard OpenAI:**
```bash
# On macOS/Linux:
export OPENAI_API_KEY="your-openai-api-key-here"

# On Windows (Command Prompt):
set OPENAI_API_KEY=your-openai-api-key-here

# On Windows (PowerShell):
$env:OPENAI_API_KEY="your-openai-api-key-here"
```

**For Azure OpenAI (optional):**
```bash
# On macOS/Linux:
export USE_AZURE_OPENAI="true"
export AZURE_OPENAI_API_KEY="your-azure-api-key-here"
export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
export AZURE_OPENAI_API_VERSION="2024-10-21"  # or "2025-01-01-preview" for preview features

# On Windows (Command Prompt):
set USE_AZURE_OPENAI=true
set AZURE_OPENAI_API_KEY=your-azure-api-key-here
set AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
set AZURE_OPENAI_API_VERSION=2024-10-21

# On Windows (PowerShell):
$env:USE_AZURE_OPENAI="true"
$env:AZURE_OPENAI_API_KEY="your-azure-api-key-here"
$env:AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
$env:AZURE_OPENAI_API_VERSION="2024-10-21"
```

3. **Start the development environment:**

   **Option A: Development mode (recommended)**
   ```bash
   # Start both frontend and backend servers simultaneously
   npm run dev:full
   ```

   **Option B: Separate terminals (for debugging)**
   ```bash
   # Terminal 1: Start the Express server
   npm run server
   
   # Terminal 2: Start the Vite dev server
   npm run dev
   ```

   **Option C: Production mode**
   ```bash
   # Build the React app
   npm run build
   
   # Start the server (serves built files)
   npm run server
   ```

4. **Open your browser:**
   - Development: `http://localhost:5173`
   - Production: `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start Vite development server with hot reload
- `npm run server` - Start Express server with OpenAI API endpoints
- `npm run dev:full` - Start both frontend and backend servers simultaneously (recommended)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

## 🎯 How to Use

### 🏠 Home - AI Kitchen Welcome
Start here to see an overview of all available AI recipes and demonstrations.

### 🧑‍🍳 Embeddings - "Spin the Centrifuge!" & "Search the Cupboards!"

**Word Relationship Visualization:**
1. **Enter words** separated by commas (e.g., "Ireland, Irish, O'Connor, Dublin")
2. **Click "Visualize Word Relationships"** to generate embeddings
3. **View results**: Model comparison, raw vectors, 2D PCA visualization, similarity scores

**Similarity Search:**
1. **Enter a search query** (e.g., "economic pressure concerns")  
2. **Add documents** to search through (one per line)
3. **Click "Compare Search Results"** to see ranked results with similarity scores

### ✂️ Scissors - Herbert Simon's Model
Explore how context and cognition work together in AI completions:
1. **Enter a prompt** to complete
2. **Add context** (optional) to guide the completion
3. **Compare results** with and without context to see the "scissors" effect

### 🤔 Knowledge - RAG Comparison  
Compare two approaches to knowledge retrieval:
1. **"Watch a RAG Happen"** - See conventional chunking-based RAG in action
2. **"Understanding > Knowledge"** - Experience graph-based knowledge extraction
3. **Ask questions** about AI topics and compare the quality of responses

### 🧽 Sponge - "Squeeze the Sponge"
Transform unstructured text into structured data:
1. **Enter unstructured text** (emails, documents, etc.)
2. **Specify what to extract** (names, dates, actions, etc.)
3. **Choose output format** (structured, JSON, or executable code)
4. **Watch the transformation** from chaos to order

## 📁 Project Structure

```
js-embeddings/
├── server.js              # Express server with OpenAI/Azure OpenAI API endpoints
├── src/                   # React application source
│   ├── App.jsx           # Main application component
│   ├── App.css           # Component styles
│   ├── main.jsx          # Application entry point
│   ├── index.css         # Global styles
│   └── demos/            # Interactive AI demonstration components
│       ├── HomeDemo.jsx          # Welcome page with demo overview
│       ├── EmbeddingsDemo.jsx    # Word relationship visualization
│       ├── ScissorsDemo.jsx      # Context vs cognition in AI completions
│       ├── KnowledgeUnderstandingDemo.jsx  # RAG comparison demo
│       └── ContextSlingshotDemo.jsx       # Structured data extraction
├── public/               # Static assets and demo images
├── dist/                 # Built files (generated)
├── index.html            # HTML template
├── vite.config.js        # Vite configuration with API proxy
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

**Standard OpenAI:**
- `OPENAI_API_KEY` - Your OpenAI API key (required)

**Azure OpenAI (optional):**
- `USE_AZURE_OPENAI` - Set to `true` to use Azure OpenAI instead of standard OpenAI (default: `false`)
- `AZURE_OPENAI_API_KEY` - Your Azure OpenAI API key (required when using Azure)
- `AZURE_OPENAI_ENDPOINT` - Your Azure OpenAI endpoint (e.g., `https://your-resource.openai.azure.com`)
- `AZURE_OPENAI_API_VERSION` - Azure OpenAI API version (e.g., `2024-10-21` for stable or `2025-01-01-preview` for preview features)

**Required Azure OpenAI Model Deployments:**
When using Azure OpenAI, you must deploy the following models in your Azure OpenAI resource with **exact deployment names** matching the model names:

1. **`text-embedding-ada-002`** - For legacy embedding comparisons
2. **`text-embedding-3-small`** - For modern embedding generation
3. **`gpt-4o-mini`** - For text completion, RAG, and structured data extraction

⚠️ **Important**: 
- The deployment names in Azure OpenAI Studio must exactly match the model names above
- The application uses your specified `AZURE_OPENAI_API_VERSION` - both stable and preview versions are supported
- All required models (embeddings and chat completions) work with modern Azure OpenAI API versions
- The application creates separate client instances for each deployment using the official Azure OpenAI JavaScript library
- Based on the [official Azure OpenAI JavaScript documentation](https://learn.microsoft.com/en-us/javascript/api/overview/azure/openai-readme?view=azure-node-latest) and [API reference](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/reference)

**Server:**
- `PORT` - Server port (default: 3000)

### API Endpoints

- `POST /api/embeddings` - Get embeddings for multiple texts and models
- `POST /api/similarity` - Perform similarity search between query and documents
- `POST /api/complete` - Generate text completions (for Scissors demo)
- `POST /api/rag` - Retrieval-Augmented Generation responses
- `POST /api/extract-structured` - Extract structured data from unstructured text

### Models Supported

- `text-embedding-ada-002` - Legacy model (December 2022)
- `text-embedding-3-small` - Latest model (January 2024)

## 🎨 Features Explained

### Embedding Visualization
- **PCA Reduction**: Uses Principal Component Analysis to reduce 1536-dimensional embeddings to 2D
- **Interactive P5.js**: Smooth, responsive visualizations with perspective effects
- **Color-coded Relationships**: Different colors for each word with similarity connections
- **Two-tier Connections**: Strong connections (0.7+) in white, weaker connections (0.5-0.7) in gray
- **Perspective Effects**: Dot sizes vary based on distance from center for depth perception

### Model Comparison
- **Side-by-side Analysis**: Compare text-embedding-ada-002 vs text-embedding-3-small
- **Performance Metrics**: Release dates, costs, and dimensions
- **Real-time Calculations**: Live cosine similarity scores between word pairs
- **Search Ranking**: Compare how different models rank the same documents
- **Cost Analysis**: 5x cost difference between models

## 🔍 API Usage Examples

### Get Embeddings
```javascript
const response = await fetch('/api/embeddings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    texts: ['Ireland', 'Irish', 'Dublin'],
    models: ['text-embedding-ada-002', 'text-embedding-3-small']
  })
});
```

### Similarity Search
```javascript
const response = await fetch('/api/similarity', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'economic pressure',
    documents: ['Document 1', 'Document 2'],
    model: 'text-embedding-3-small'
  })
});
```

## 🚨 Important Notes

1. **API Key Security**: Never commit your OpenAI API key to version control
2. **Rate Limits**: Be aware of OpenAI API rate limits and costs
3. **Costs**: Each embedding request incurs API costs (ada-002: $0.0001/1K tokens, 3-small: $0.00002/1K tokens)
4. **Model Differences**: Different models may produce different similarity scores and rankings
5. **Browser Compatibility**: Requires modern browser with ES6+ support
6. **Network**: Requires internet connection for OpenAI API calls

## 🎨 Customization

Feel free to customize the application by:

- Modifying the styling in `src/App.css`
- Adding new embedding models in `server.js`
- Updating the visualization in `src/App.jsx`
- Adding new API endpoints in `server.js`

## 📝 License

This project is open source and available under the [MIT License](LICENSE).


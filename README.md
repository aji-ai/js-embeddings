# 🧑‍🍳 JS Embeddings - A Cozy AI Kitchen Recipe

A modern React application that visualizes and compares OpenAI embedding models with interactive word relationship visualization and similarity search capabilities. Built with Vite, React, and P5.js for beautiful, responsive visualizations.

## 🚀 Features

- ⚡ **Lightning Fast Hot Reload** - See changes instantly as you edit
- 🎨 **Modern React** - Built with React 18 and hooks
- 📦 **Vite Build Tooling** - Ultra-fast development server and optimized builds
- 🤖 **OpenAI Integration** - Compare text-embedding-ada-002 and text-embedding-3-small models
- 📊 **Interactive Visualizations** - P5.js powered 2D embedding space visualization with perspective effects
- 🔍 **Similarity Search** - Compare search results across different embedding models
- 🎯 **ESLint Configuration** - Code quality and consistency
- 📱 **Responsive Design** - Beautiful minimalist UI that works on all devices
- 🌈 **Modern Styling** - Muted dark theme with clean typography

## 🛠️ Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up your OpenAI API key:**
```bash
# On macOS/Linux:
export OPENAI_API_KEY="your-openai-api-key-here"

# On Windows (Command Prompt):
set OPENAI_API_KEY=your-openai-api-key-here

# On Windows (PowerShell):
$env:OPENAI_API_KEY="your-openai-api-key-here"
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

### Word Relationship Visualization

1. **Enter words** separated by commas in the "Enter words to visualize" field (e.g., "Ireland, Irish, O'Connor, Dublin")
2. **Click "Visualize Word Relationships"** to generate embeddings
3. **View the results**:
   - Model performance comparison
   - Raw embedding vectors (1536 numbers per word)
   - 2D PCA visualization with perspective effects
   - Word relationship calculations with similarity scores

### Similarity Search

1. **Enter a search query** (e.g., "economic pressure concerns")
2. **Add documents** to search through (one per line)
3. **Click "Compare Search Results"** to perform similarity search
4. **View the results**:
   - Ranked search results with similarity scores
   - Document mapping (Doc 1, Doc 2, etc.)
   - Query-document relationship visualization
   - Model comparison for search accuracy

## 📁 Project Structure

```
js-embeddings/
├── server.js              # Express server with OpenAI API endpoints
├── src/                   # React application source
│   ├── App.jsx           # Main application component
│   ├── App.css           # Component styles
│   ├── main.jsx          # Application entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── dist/                 # Built files (generated)
├── index.html            # HTML template
├── vite.config.js        # Vite configuration with API proxy
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `PORT` - Server port (default: 3000)

### API Endpoints

- `POST /api/embeddings` - Get embeddings for multiple texts
- `POST /api/similarity` - Perform similarity search

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


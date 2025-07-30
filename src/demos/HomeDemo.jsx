import React from 'react'

function HomeDemo() {
  return (
    <div className="home-demo">
      <section className="section">
        <h2>🍳 Welcome to the AI Kitchen</h2>
        <p className="section-description">
          A cozy place to explore AI concepts through interactive cooking demonstrations.
        </p>
        
        <div className="repo-link" style={{ textAlign: 'center', margin: '20px 0' }}>
          <p>
            🔗 <strong>Explore the code:</strong> <a href="https://github.com/aji-ai/js-embeddings" target="_blank" rel="noopener noreferrer" style={{ color: '#ff6b35', textDecoration: 'none', fontWeight: 'bold' }}>github.com/aji-ai/js-embeddings</a>
          </p>
        </div>
        
        <div className="welcome-video">
          <video 
            controls 
            width="100%" 
            height="auto"
            style={{ maxWidth: '800px', borderRadius: '12px' }}
          >
            <source src="/caikopener.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        
        <div className="image-sequence">
          <img src="/p00.JPG" alt="Image 00" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
          <img src="/p01.JPG" alt="Image 01" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
          <img src="/p02.JPG" alt="Image 02" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
          <img src="/p03.JPG" alt="Image 03" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
          <img src="/p04.JPG" alt="Image 04" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
          <img src="/p05.JPG" alt="Image 05" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
          <img src="/p06.JPG" alt="Image 06" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
          <img src="/p07.JPG" alt="Image 07" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
          <img src="/p09.JPG" alt="Image 09" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
          <img src="/p11.JPG" alt="Image 11" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
          <img src="/p12.JPG" alt="Image 12" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
          <img src="/p13.JPG" alt="Image 13" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
          <img src="/p14.JPG" alt="Image 14" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
          <img src="/p15.JPG" alt="Image 15" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
          <img src="/p16.JPG" alt="Image 16" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
          <img src="/p17.JPG" alt="Image 17" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
          <img src="/p18.JPG" alt="Image 18" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
          <img src="/p19.JPG" alt="Image 19" style={{ width: '100%', maxWidth: '800px', borderRadius: '8px', marginBottom: '16px' }} />
        </div>
        
        <div className="welcome-content">
          <h3>What's Cooking?</h3>
          <p>
            This kitchen serves up interactive demonstrations of key AI concepts, 
            each presented as a hands-on recipe you can experiment with. 
            From embeddings to retrieval-augmented generation, we'll explore the ingredients 
            that make modern AI systems work through live, interactive demos.
          </p>
          
          <h3>Available Recipes</h3>
          <ul className="recipe-list">
            <li><strong>✂️ Scissors:</strong> Herbert Simon's scissors model - how context and cognition work together in AI completions</li>
            <li><strong>🧑‍🍳 Embeddings:</strong> "Spin the Centrifuge!" and "Search the Cupboards!" - word relationship visualization and semantic similarity search</li>
            <li><strong>🤔 Knowledge:</strong> Two-part RAG comparison - "Watch a RAG Happen" with conventional chunking vs "Understanding &gt; Knowledge" with graph-based extraction</li>
            <li><strong>🧽 Sponge:</strong> "Squeeze the Sponge" - transform unstructured text into structured data for function calling and database operations</li>
          </ul>
          
          <p className="welcome-note">
            Each demo includes interactive controls, real-time AI processing, and educational explanations. 
            Choose a recipe from the navigation bar above to start cooking with AI!
          </p>
        </div>
      </section>
    </div>
  )
}

export default HomeDemo 
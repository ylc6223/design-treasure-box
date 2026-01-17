const { config } = require('dotenv');
config({ path: '.env.local' });

async function testEmbeddingDimension() {
  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZHIPU_AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'embedding-2',
        input: 'test text',
      }),
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    
    if (data.data && data.data[0] && data.data[0].embedding) {
      console.log('Embedding dimension:', data.data[0].embedding.length);
      console.log('First few values:', data.data[0].embedding.slice(0, 5));
    } else {
      console.log('Full response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEmbeddingDimension();
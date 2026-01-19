export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const { model, messages } = req.body;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': req.headers.referer || 'https://flux-ai.vercel.app',
                'X-Title': 'Flux AI'
            },
            body: JSON.stringify({
                model: model || 'bytedance-seed/seed-1.6-flash',
                messages: messages
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

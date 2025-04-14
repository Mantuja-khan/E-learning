// This is a server-side API endpoint for handling chat requests
// In a real implementation, this would be deployed to a server or serverless function

import { Configuration, OpenAIApi } from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body;
  const apiKey = req.headers.authorization?.split(' ')[1];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const configuration = new Configuration({
      apiKey: apiKey,
    });
    const openai = new OpenAIApi(configuration);

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful AI study assistant for the LearnSmart e-learning platform. You help students with their academic questions, explain concepts, and provide learning guidance. Keep your answers educational, accurate, and helpful.' },
        { role: 'user', content: question }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.data.choices[0].message.content;
    return res.status(200).json({ response });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return res.status(500).json({ 
      error: 'Failed to get response from AI',
      details: error.message 
    });
  }
}
import React, { useState, useEffect } from 'react';
import { FaRobot, FaPaperPlane, FaUser, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const Chatbot = ({ onBack }) => {
  const [messages, setMessages] = useState([
    { text: "Hello! How can I help you today?", isBot: true }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    // Check if API key is stored in localStorage
    const storedApiKey = localStorage.getItem('chatbot_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage = { text: input, isBot: false };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    if (!apiKey) {
      setShowApiKeyInput(true);
      toast.error("Please enter your API key to use the AI assistant");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Call the AI API
      const response = await fetchAIResponse(input, apiKey);
      
      // Add AI response to chat
      setMessages(prev => [...prev, { text: response, isBot: true }]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast.error("Failed to get a response from the AI. Please try again.");
      setMessages(prev => [...prev, { 
        text: "Sorry, I encountered an error. Please try again later.", 
        isBot: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAIResponse = async (question, key) => {
    // This is a simple implementation using a Python script on the backend
    // In a real implementation, you would call your AI API endpoint
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({ question })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Error in fetchAIResponse:", error);
      
      // Fallback response if API call fails
      return "I'm currently experiencing some technical difficulties. As a fallback, I can tell you that this is a demo chatbot for the LearnSmart platform. For specific questions about your courses or learning materials, please check the Notes section or take a Quiz to test your knowledge.";
    }
  };

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('chatbot_api_key', apiKey);
      setShowApiKeyInput(false);
      toast.success("API key saved successfully");
    } else {
      toast.error("Please enter a valid API key");
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-lg h-full flex flex-col">
      <div className="flex items-center space-x-4 mb-6">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
          >
            <FaArrowLeft className="text-blue-600" />
          </button>
        )}
        <FaRobot className="text-4xl text-blue-600" />
        <h2 className="text-3xl font-bold text-gray-800">AI Study Assistant</h2>
      </div>

      <div className="flex-1 overflow-y-auto mb-6 space-y-4 bg-white p-6 rounded-lg shadow-inner">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start space-x-2 ${
              message.isBot ? '' : 'flex-row-reverse space-x-reverse'
            }`}
          >
            <div className={`p-2 rounded-full ${
              message.isBot ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {message.isBot ? <FaRobot className="text-blue-600" /> : <FaUser className="text-gray-600" />}
            </div>
            <div
              className={`p-4 rounded-lg max-w-[80%] ${
                message.isBot
                  ? 'bg-blue-100 text-gray-800'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start space-x-2">
            <div className="p-2 rounded-full bg-blue-100">
              <FaRobot className="text-blue-600" />
            </div>
            <div className="p-4 rounded-lg bg-blue-100 text-gray-800 flex items-center">
              <FaSpinner className="animate-spin mr-2" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      {showApiKeyInput && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">API Key Required</h3>
          <p className="text-xs text-yellow-700 mb-3">
            To use the AI assistant, please enter your API key. This will be stored locally on your device.
          </p>
          <div className="flex space-x-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your API key"
            />
            <button
              onClick={saveApiKey}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="flex gap-4 bg-white p-4 rounded-lg shadow-md">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50"
        >
          <span>Send</span>
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleIcon, XIcon, SendIcon, RobotIcon, UserIcon } from './Icons';
import { sendMessageToChatbot } from '../services/gemini';
import { Tool } from '../types';
import { marked } from 'marked';

interface ChatbotProps {
    tools: Tool[];
}

interface Message {
    sender: 'user' | 'bot';
    text: string;
}

// Basic markdown sanitization
const renderer = new marked.Renderer();
const originalLink = renderer.link;
renderer.link = (href, title, text) => {
    // Only allow http/https protocols
    if (href && href.startsWith('http')) {
        return originalLink.call(renderer, href, title, text);
    }
    return `<span>${text}</span>`; // Render as plain text if protocol is not allowed
};
marked.setOptions({ renderer });


export const Chatbot: React.FC<ChatbotProps> = ({ tools }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // FIX: Call the Gemini service to get a response.
            const response = await sendMessageToChatbot(input, tools);
            // FIX: Extract text from the response object.
            const botMessage: Message = { sender: 'bot', text: response.text };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: Message = { sender: 'bot', text: "Sorry, I'm having trouble connecting. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-cyan-600 text-white p-4 rounded-full shadow-lg hover:bg-cyan-500 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 z-50"
                aria-label="Toggle chatbot"
            >
                {isOpen ? <XIcon className="w-8 h-8" /> : <ChatBubbleIcon className="w-8 h-8" />}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-full max-w-md h-3/4 max-h-[600px] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl flex flex-col z-50 animate-fade-in-up">
                    <header className="flex items-center justify-between p-4 border-b border-gray-700">
                        <h3 className="text-lg font-bold text-white">Findora AI Assistant</h3>
                        <button onClick={() => setIsOpen(false)} className="p-1 text-gray-400 rounded-full hover:bg-gray-700">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </header>
                    <main className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                        {messages.length === 0 && (
                             <div className="text-center text-gray-400 p-4">
                                <RobotIcon className="w-12 h-12 mx-auto mb-2 text-cyan-400"/>
                                <p>Hi! I'm Findora. Ask me to find the best AI tool for your needs!</p>
                                <p className="text-xs mt-2">e.g., "Which tool is best for creating videos?"</p>
                            </div>
                        )}
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-cyan-500 flex-shrink-0 flex items-center justify-center"><RobotIcon className="w-5 h-5 text-white"/></div>}
                                <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-300'}`}>
                                    <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) as string }}></div>
                                </div>
                                {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center"><UserIcon className="w-5 h-5 text-white"/></div>}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-cyan-500 flex-shrink-0 flex items-center justify-center"><RobotIcon className="w-5 h-5 text-white"/></div>
                                <div className="max-w-xs md:max-w-sm px-4 py-2 rounded-lg bg-gray-900 text-gray-300">
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.4s]"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </main>
                    <footer className="p-4 border-t border-gray-700">
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center bg-gray-700 rounded-lg">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about AI tools..."
                                className="flex-1 w-full bg-transparent p-3 text-white placeholder-gray-400 focus:outline-none"
                                disabled={isLoading}
                            />
                            <button type="submit" disabled={isLoading || input.trim() === ''} className="p-3 text-cyan-400 disabled:text-gray-500 hover:text-cyan-300 disabled:hover:text-gray-500 transition-colors">
                                <SendIcon className="w-6 h-6" />
                            </button>
                        </form>
                    </footer>
                </div>
            )}
        </>
    );
};

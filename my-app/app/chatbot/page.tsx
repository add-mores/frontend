'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from "next/link";
import { Menu, ArrowRight } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatPage() {
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([
        { role: 'bot', content: '안녕하세요! 무엇을 도와드릴까요?' },
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async () => {
        if (!input.trim()) return

        const userMessage = { role: 'user', content: input }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsTyping(true)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_CHATBOT_API}/llm/amedi`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: input }),
            })

            const data = await response.json()
            const botMessage = { role: 'bot', content: data.answer }

            setMessages(prev => [...prev, botMessage])
        } catch (err) {
            setMessages(prev => [...prev, { role: 'bot', content: '에러가 발생했습니다. 다시 시도해 주세요' }])
        } finally {
            setIsTyping(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <div className="relative h-screen overflow-hidden bg-gradient-to-br from-white via-sky-50 to-blue-100">
            {/* Sidebar Toggle Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`fixed top-4 left-4 z-50 transition-colors ${sidebarOpen ? "text-white" : "text-gray-800"}`}
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full w-64 z-40 transform transition-transform duration-300 bg-gradient-to-br from-sky-500 to-sky-700 text-white px-6 pt-20 space-y-6 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <h2 className="text-2xl font-bold">메뉴</h2>
                <nav className="space-y-4">
                    <Link href="/" className="block hover:underline font-medium">🏠 홈</Link>
                    <Link href="/disease" className="block hover:underline font-medium">🦠 질병</Link>
                    <Link href="/hospital" className="block hover:underline font-medium">🏥 병원</Link>
                    <Link href="/medicine" className="block hover:underline font-medium">💊 의약품</Link>
                    <Link href="/chatbot" className="block hover:underline font-medium">📱 AI챗봇</Link>
                </nav>
            </div>

            {/* 헤더 */}
            <div className="text-center pt-16 pb-4 px-4">
                <h1 className="text-3xl md:text-5xl font-extrabold text-sky-700 tracking-tight">📱 AI 챗봇 상담 서비스</h1>
                <p className="mt-4 text-lg text-gray-600">질의 응답을 통해 맞춤형 서비스를 제공 받아보세요.</p>
            </div>

            {/* 채팅 창 */}
            <div className="flex flex-col h-[calc(100%-160px)] px-4 pb-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[55%] px-4 py-2 rounded-2xl relative text-lg shadow-md ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none mr-7'
                                : 'bg-white text-gray-900 rounded-bl-none ml-10'}`}>
                                <div className={`absolute top-2 w-0 h-0 border-y-6 border-y-transparent ${msg.role === 'user'
                                    ? 'right-[-12px] border-l-8 border-l-blue-500'
                                    : 'left-[-12px] border-r-8 border-r-white'}`} />

                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="relative max-w-xs px-4 py-2 rounded-2xl bg-white text-gray-800 text-sm shadow-md rounded-bl-none ml-10 animate-pulse">
                                <div className="absolute top-2 left-[-12px] w-0 h-0 border-y-6 border-y-transparent border-r-8 border-r-white" />
                                ...
                            </div>
                        </div>
                    )}

                    <div ref={scrollRef} />
                </div>

                {/* 입력창 */}
                <div className="mt-2 flex items-center gap-2">
                    <textarea
                        rows={1}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 resize-none rounded-full border border-gray-300 text-black px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                        onClick={sendMessage}
                        className="bg-blue-500 hover:bg-blue-600 p-2 rounded-full text-white flex items-center justify-center"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

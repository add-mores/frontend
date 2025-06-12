'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

interface ChatModalProps {
    onClose: () => void;
    apiEndpoint: string;
}

export default function ChatModal({ onClose }: ChatModalProps) {
    const [question, setQuestion] = useState('')
    const [messages, setMessages] = useState<{ type: 'user' | 'bot', text: string }[]>([])
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!question.trim()) return

        const userMessage = { type: 'user', text: question }
        setMessages((prev) => [...prev, userMessage])
        setQuestion('')
        setLoading(true)

        try {
            const res = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userMessage.text }),
            })

            const data = await res.json()
            setMessages((prev) => [...prev, { type: 'bot', text: data.answer }])
        } catch (err) {
            setMessages((prev) => [...prev, { type: 'bot', text: '⚠️ 오류가 발생했습니다.' }])
        } finally {
            setLoading(false)
        }
    }

    // 항상 최신 메시지로 스크롤
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    return (
        <div className="fixed bottom-20 right-4 w-[500px] max-h-[500px] bg-white border border-gray-300 rounded-2xl shadow-xl flex flex-col z-50 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2 border-b">
                <span className="font-semibold text-gray-700">챗봇</span>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm bg-gray-50">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`px-3 py-2 rounded-xl max-w-[80%] ${msg.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'
                                }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="px-3 py-2 rounded-xl bg-gray-200 text-gray-900">
                            답변 중...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="border-t p-2 flex gap-2">
                <input
                    type="text"
                    placeholder="메시지를 입력하세요"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-black"
                />
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm"
                >
                    전송
                </button>
            </form>
        </div>
    )
}

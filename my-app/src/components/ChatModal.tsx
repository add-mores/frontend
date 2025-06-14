'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

interface ChatModalProps {
  onClose: () => void
  apiEndpoint: string
  location: { lat: number; lon: number; accuracy?: number }
  radius: number
  onReRequestLocation: () => void
}

interface Message {
  type: 'user' | 'bot'
  text: string
  isError?: boolean
}

export default function ChatModal({
  onClose,
  apiEndpoint,
  location,
  radius,
  onReRequestLocation
}: ChatModalProps) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    const userMessage: Message = { type: 'user', text: question }
    setMessages((prev) => [...prev, userMessage])
    setQuestion('')
    setLoading(true)

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage.text,
          lat: location.lat,
          lon: location.lon,
          radius
        }),
      })

      const data = await res.json()
      const summary = data.llm_summary

      if (!Array.isArray(summary)) {
        setMessages((prev) => [...prev, { type: 'bot', text: '⚠️ 예상치 못한 응답 형식입니다.', isError: true }])
        return
      }

      if (summary.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            type: 'bot',
            text: '추천할 병원이 없습니다. 위치가 정확한지 다시 확인해주세요.',
          },
        ])
        return
      }

      const formatted = summary
        .map((item: any) => `🏥 ${item.hos_nm}\n📌 ${item.reason}\n📍 [지도 보기](${item.map_url})`)
        .join('\n\n')

      setMessages((prev) => [...prev, { type: 'bot', text: formatted }])
    } catch (err) {
      setMessages((prev) => [...prev, { type: 'bot', text: '⚠️ 오류가 발생했습니다.', isError: true }])
    } finally {
      setLoading(false)
    }
  }

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
              className={`px-3 py-2 rounded-xl max-w-[80%] whitespace-pre-wrap ${msg.type === 'user'
                ? 'bg-blue-600 text-white'
                : msg.isError
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-200 text-gray-900'
                }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-xl bg-gray-200 text-gray-900">답변 중...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 위치 재요청 버튼 */}
      {location.accuracy !== undefined && location.accuracy > 500 && (
        <div className="p-2 border-t text-center text-sm bg-yellow-100 text-yellow-800">
          현재 위치 정확도가 낮습니다.{' '}
          <button
            onClick={onReRequestLocation}
            className="underline text-blue-600 hover:text-blue-800"
          >
            위치 다시 요청
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t p-2 flex gap-2">
        <input
          type="text"
          placeholder="증상 또는 질문을 입력하세요"
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

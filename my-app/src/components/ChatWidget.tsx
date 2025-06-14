'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import ChatModal from './ChatModal'

 interface ChatWidgetProps {
   apiEndpoint: string;
   location: { lat: number; lon: number; accuracy?: number };
   radius: number;
   onReRequestLocation: () => void;
 }

export default function ChatWidget({
  apiEndpoint,
  location,
  radius,
  onReRequestLocation  
}: ChatWidgetProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
             {open && (
   <ChatModal
     onClose={() => setOpen(false)}
     apiEndpoint={apiEndpoint}
     location={location}
     radius={radius}
     onReRequestLocation={onReRequestLocation}
   />
 )}
            <button
                onClick={() => setOpen(!open)}
                className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg"
            >
                <MessageCircle size={24} />
            </button>
        </>
    )
}

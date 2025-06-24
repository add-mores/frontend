'use client';

import Link from 'next/link';
import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100 py-16 px-6 md:px-12">
      <div className="text-center mb-10 animate-fadein">
        <h1 className="text-4xl md:text-5xl font-extrabold text-sky-700 tracking-tight mb-5">
           AmedI 나만의 의료 AI 서비스
        </h1>
        <p className="text-lg md:text-xl text-gray-700">
          <strong className="text-teal-700 font-semibold">입력한 증상으로 AI가 유사한 질병을 예측하고,</strong><br />
          <strong className="text-teal-700 font-semibold">관련 병원과 약품 정보를 통합적으로 추천해드립니다.</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
        <Link href="/disease" className="block p-6 bg-white rounded-2xl shadow-md hover:scale-[1.02] transition-transform animate-fadein">
          <h3 className="text-xl font-semibold mb-2 text-black">🔍 질병 예측</h3>
          <p className="text-gray-700">증상을 기반으로 유사한 질병을 예측합니다.</p>
        </Link>
        <Link href="/hospital" className="block p-6 bg-white rounded-2xl shadow-md hover:scale-[1.02] transition-transform animate-fadein">
          <h3 className="text-xl font-semibold mb-2 text-black">🏥 병원 찾기</h3>
          <p className="text-gray-700">현 위치 또는 지역 기반 병원 정보를 제공합니다.</p>
        </Link>
        <Link href="/medicine" className="block p-6 bg-white rounded-2xl shadow-md hover:scale-[1.02] transition-transform animate-fadein">
          <h3 className="text-xl font-semibold mb-2 text-black">💊 의약품 추천</h3>
          <p className="text-gray-700">증상에 맞는 의약품 정보를 제공합니다.</p>
        </Link>
        <Link href="/chatbot" className="block p-6 bg-white rounded-2xl shadow-md hover:scale-[1.02] transition-transform animate-fadein">
          <h3 className="text-xl font-semibold mb-2 text-black">📱 AI 챗봇 상담</h3>
          <p className="text-gray-700">질의응답을 통해 맞춤형 서비스를 제공합니다</p>
        </Link>
      </div>

      <div className="text-sm text-gray-600 leading-relaxed animate-fadein">
        <div className="mt-auto text-center">
          <p className="mb-1 font-semibold">❗ 이용 시 유의사항</p>
          <p>
            이 웹사이트에서 제공하는 모든 정보는 학습 및 일반적인 정보 제공을 목적으로 하며,<br />
            의학적 진단이나 치료를 대체하지 않습니다. 건강에 관한 의문이 있을 경우,<br />
            반드시 의료 전문가인 의사의 진단을 받으시기 바랍니다.<br />
            또한 당사는 의약품 및 건강 관련 정보의 정확성을 보장하지 않으며,<br />
            의약품 사용과 관련된 모든 결정은 의료 전문가의 지도 아래에서 이루어져야 합니다.<br />
            이 웹사이트는 의료 서비스를 제공하지 않으며, 의약품 판매를 목적으로 하지 않습니다.
          </p>
        </div>
      </div>

      <style jsx>{`
        .animate-fadein {
          animation: fadein 1.2s ease-in-out forwards;
          opacity: 0;
        }
        @keyframes fadein {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}

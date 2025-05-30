'use client';

import { useState } from 'react';

export default function DiseasePage() {
    const [userInput, setUserInput] = useState('');
    const [ageGroup, setAgeGroup] = useState('');
    const [isPregnant, setIsPregnant] = useState(false);
    const [diseases, setDiseases] = useState('');
    const [result, setResult] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        const res = await fetch('http://localhost:8000/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_input: userInput,
                age_group: ageGroup,
                is_pregnant: isPregnant,
                has_disease: diseases.split(',').map(d => d.trim()).filter(Boolean),
            }),
        });
        const data = await res.json();
        setResult(data);
        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">💊 의약품 추천</h1>

            <input
                type="text"
                placeholder="📝 증상 또는 질환 입력"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                className="w-full p-2 border rounded mb-2"
            />

            <select
                value={ageGroup}
                onChange={e => setAgeGroup(e.target.value)}
                className="w-full p-2 border rounded mb-2"
            >
                <option value="">연령대 선택</option>
                <option value="소아">소아</option>
                <option value="청소년">청소년</option>
                <option value="성인">성인</option>
                <option value="노인">노인</option>
            </select>

            <label className="flex items-center mb-2">
                <input
                    type="checkbox"
                    checked={isPregnant}
                    onChange={e => setIsPregnant(e.target.checked)}
                    className="mr-2"
                />
                임신 중
            </label>

            <input
                type="text"
                placeholder="🏥 피하고 싶은 질병명 (쉼표로 구분)"
                value={diseases}
                onChange={e => setDiseases(e.target.value)}
                className="w-full p-2 border rounded mb-2"
            />

            <button
                onClick={handleSearch}
                disabled={!userInput}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                🔍 의약품 검색
            </button>

            {loading && <p className="mt-4">검색 중...</p>}

            {result.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-xl font-bold mb-4">📋 추천 의약품 목록</h2>
                    {result.map((item, idx) => (
                        <div key={idx} className="p-4 border rounded mb-4 bg-gray-50">
                            <h3 className="font-bold text-lg">{item.ph_nm_c} ({item.ph_c_nm})</h3>
                            <p><strong>✔️ 주요 효능:</strong> {item.ph_effect.slice(0, 100)}{item.ph_effect.length > 100 ? '...' : ''}</p>
                            <p><strong>🔗 관련도 점수:</strong> {item.total_score}</p>
                            <details className="mt-2">
                                <summary className="cursor-pointer text-blue-500">🔍 상세 보기</summary>
                                <p><strong>📌 효능 설명:</strong> {item.ph_effect}</p>
                                <p><strong>⚠️ 주의사항:</strong> {item.ph_anti_warn || '정보 없음'}</p>
                                <p><strong>⚠️ 경고:</strong> {item.ph_warn || '정보 없음'}</p>
                                <p><strong>🚫 부작용:</strong> {item.ph_s_effect || '정보 없음'}</p>
                            </details>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

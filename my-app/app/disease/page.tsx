'use client';

import { useState } from "react";
import { Input, Label } from "@/components/ui/";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from 'next/navigation';


export default function DiseaseSearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const router = useRouter();

    const handleSearch = async () => {
        if (!query.trim()) return;

        try {
            // 1. insert API 호출
            const insertRes = await fetch('http://localhost:8000/api/insert', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: query
                }),
            });

            const insertData = await insertRes.json();

            // 2. disease API 호출 (insert 응답 그대로 사용)
            const diseaseRes = await fetch('http://localhost:8000/api/disease', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(insertData),
            });

            const diseaseData = await diseaseRes.json();
            setResults(diseaseData.recommendations || []);
        } catch (error) {
            console.error("API 호출 중 오류:", error);
            alert("검색 중 문제가 발생했습니다.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-sky-700 tracking-tight">🏥 질병 정보 서비스</h1>
                <p className="mt-4 text-lg text-gray-600">증상이나 질병명을 입력하여 관련 질병 정보를 찾아보세요.</p>
            </div>

            <Card className="p-6 backdrop-blur-lg bg-white/70 border border-sky-100 rounded-2xl shadow-md w-full max-w-md mx-auto mb-8">
            <CardContent className="space-y-4">
                {/* Label */}
                <Label htmlFor="symptomQuery" className="block text-sm font-medium text-gray-700">
                증상 검색
                </Label>

                {/* Input */}
                <Input
                id="symptomQuery"
                placeholder="예: 두통, 감기, 발열..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full"
                />

                {/* Button */}
                <div className="flex justify-center">
                <Button
                className="w-full mt-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition duration-300"
                onClick={handleSearch}
                >
                🔍 질병 검색
                </Button>
                </div>
            </CardContent>
            </Card>

            {results.length > 0 && (
                <>
                    {/* 🔗 의약품/병원 추천 버튼 추가 */}
                    <div className="flex justify-center gap-4 mt-8">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/medicine?query=${encodeURIComponent(query)}`)}
                        >
                            💊 의약품 추천 보기
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.location.href = "/hospital"}
                        >
                            🏥 병원 추천 보기
                        </Button>
                    </div>
                    <h2 className="text-xl font-semibold mt-6 mb-2">🔍 검색 결과</h2>
                    <div className="space-y-4">
                        {results.map((item, index) => (
                            <Card key={index} className="bg-white dark:bg-gray-900">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-bold">
                                            {index + 1}. {item.disease_name_ko} ({item.disease_name_en})
                                        </h3>
                                        <span className="bg-blue-500 text-white text-sm rounded-full px-2 py-1">
                                            관련도: {item.final_score.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-blue-500 font-semibold">📋 진료과</p>
                                        <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">{item.department || '정보 없음'}</p>
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-blue-500 font-semibold">📝 정의</p>
                                        <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">{item.definition || '정보 없음'}</p>
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-blue-500 font-semibold">🔍 주요 증상</p>
                                        <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">{item.symptoms || '정보 없음'}</p>
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-blue-500 font-semibold">🩺 치료법</p>
                                        <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">{item.therapy || '정보 없음'}</p>
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-blue-500 font-semibold">🔑 관련 키워드</p>
                                        <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">
                                            {item.matched_tokens.length > 0 ? item.matched_tokens.join(", ") : "정보 없음"}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

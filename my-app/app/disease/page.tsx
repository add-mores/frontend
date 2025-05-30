'use client';

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from 'next/navigation';

import Link from "next/link";
import { Menu } from "lucide-react";


export default function DiseaseSearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const router = useRouter();

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;

        try {
            // 1. insert API 호출
            const insertRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/insert`, {
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
            const diseaseRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/disease`, {
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

    const handleHospitalClick = () => {
        // results 배열에서 모든 department 문자열 가져와서,
        // 쉼표 기준으로 분리 → 공백/특수문자 제거 → 중복 제거
        const allDepartments = results.flatMap(item =>
            item.department
                ? item.department.split(",").map((dept: string) => dept.trim().replace(/[^\w가-힣]/g, "")) // 한글+영문, 특수문자 제거
                : []
        );

        const uniqueDepartments = Array.from(new Set(allDepartments.filter(Boolean)));

        const queryStr = uniqueDepartments.join(",");

        router.push(`/hospital?departments=${encodeURIComponent(queryStr)}`);
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100 py-16 px-6 md:px-12">
            {/* Sidebar Toggle Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`fixed top-4 left-4 z-50 transition-colors ${sidebarOpen ? "text-white" : "text-gray-800"}`}
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full w-64 z-40 transform transition-transform duration-300 bg-gradient-to-br from-sky-500 to-sky-700 text-white px-6 pt-20 space-y-6 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <h2 className="text-2xl font-bold">메뉴</h2>
                <nav className="space-y-4">
                    <Link href="/" className="block hover:underline font-medium">
                        🏠 홈
                    </Link>
                    <Link href="/disease" className="block hover:underline font-medium">
                        🦠 질병
                    </Link>
                    <Link href="/hospital" className="block hover:underline font-medium">
                        🏥 병원
                    </Link>
                    <Link href="/medicine" className="block hover:underline font-medium">
                        💊 의약품
                    </Link>
                </nav>
            </div>
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
                        className="w-full text-black"
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
                    <div className="flex justify-center gap-4 mt-8 text-black">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/medicine?query=${encodeURIComponent(query)}`)}
                        >
                            💊 의약품 추천 보기
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleHospitalClick}
                        >
                            🏥 병원 추천 보기
                        </Button>
                    </div>
                    <h2 className="text-xl font-semibold mt-6 mb-2 text-black">🔍 검색 결과</h2>
                    <div className="space-y-4">
                        {results.map((item, index) => (
                            <Card key={index} className="bg-white dark:bg-gray-900">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-center text-black">
                                        <h3 className="text-lg font-bold">
                                            {index + 1}. {item.disease_name_ko} ({item.disease_name_en})
                                        </h3>
                                        <span className="bg-blue-500 text-white text-sm rounded-full px-2 py-1">
                                            관련도: {item.final_score.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-blue-500 font-semibold">📋 진료과</p>
                                        <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm text-black leading-relaxed">{item.department || '정보 없음'}</p>
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-blue-500 font-semibold">📝 정의</p>
                                        <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm text-black leading-relaxed">{item.definition || '정보 없음'}</p>
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-blue-500 font-semibold">🔍 주요 증상</p>
                                        <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm text-black leading-relaxed">{item.symptoms || '정보 없음'}</p>
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-blue-500 font-semibold">🩺 치료법</p>
                                        <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm text-black leading-relaxed">{item.therapy || '정보 없음'}</p>
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-blue-500 font-semibold">🔑 관련 키워드</p>
                                        <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm text-black">
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

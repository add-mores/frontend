'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function MedicineSearchPage() {
    const [symptoms, setSymptoms] = useState('');
    const [ageGroup, setAgeGroup] = useState('');
    const [isPregnant, setIsPregnant] = useState(false);
    const [disease, setDisease] = useState('');
    const [result, setResult] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('query');
    
    // 컴포넌트 mount 시, query가 있으면 자동 실행
    useEffect(() => {
        if (initialQuery) {
            setSymptoms(initialQuery);
            handleSearchWithValue(initialQuery);
        }
    }, [initialQuery]);

    // insert API → positive → medicine API
    const handleSearchWithValue = async (symptomText: string) => {
        setLoading(true);
        try {
            // 1. insert API 호출
            const insertRes = await fetch("http://localhost:8000/api/insert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: symptomText }),
            });

            const insertData = await insertRes.json();
            const positiveList: string[] = insertData?.positive;

            if (!positiveList || positiveList.length === 0) {
                alert("긍정적인 증상이 감지되지 않았습니다.");
                setResult([]);
                setLoading(false);
                return;
            }

            // 2. 마침표 없이 공백으로 연결
            const positiveText = positiveList.map(s => s.trim()).join(" ");

            // 3. medicine API 호출
            const response = await fetch("http://localhost:8000/api/medicine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    symptom: positiveText,
                    age_group: ageGroup === "none" ? "" : ageGroup,
                    is_pregnant: isPregnant,
                    has_disease: disease ? disease.split(",").map(d => d.trim()) : [],
                    top_n: 5,
                }),
            });

            const data = await response.json();
            setResult(data.result || []);
        } catch (err) {
            console.error("의약품 추천 에러:", err);
            alert("의약품 추천 중 문제가 발생했습니다.");
        }
        setLoading(false);
    };

    // 🔍 버튼 클릭용 핸들러
    const handleSearch = () => {
        handleSearchWithValue(symptoms);
    };
    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100 py-16 px-6 md:px-12">
            <div className="max-w-6xl mx-auto space-y-16">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-sky-700 tracking-tight">💊 의약품 추천 서비스</h1>
                    <p className="mt-4 text-lg text-gray-600">입력한 증상과 조건을 기반으로 최적의 의약품을 추천해드립니다.</p>
                </div>

                <Card className="p-8 backdrop-blur-lg bg-white/70 border border-sky-100 rounded-2xl shadow-lg">
                    <CardContent className="space-y-6">
                        {/* <div className="space-y-2">
                            <Label htmlFor="symptoms" className="font-medium">📝 증상 또는 질환 입력</Label>
                            <Input
                                id="symptoms"
                                placeholder="예: 소화불량, 기침, 위염"
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                            />
                        </div> */}

                        <form className="max-w-md mx-auto">
                            <label
                                htmlFor="symptoms"
                                className="mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                증상 검색
                            </label>
                            <div className="relative">
                                {/* 왼쪽 돋보기 아이콘 */}
                                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                    <svg
                                        className="w-4 h-4 text-gray-500 dark:text-gray-400"
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            stroke="currentColor"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                                        />
                                    </svg>
                                </div>

                                {/* 입력 필드 */}
                                <input
                                    type="search"
                                    id="symptoms"
                                    className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                                    placeholder="예: 소화불량, 기침, 위염"
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                />

                            </div>
                        </form>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label className="font-medium">연령대 선택</Label>
                                <Select onValueChange={setAgeGroup} defaultValue="">
                                    <SelectTrigger>
                                        <SelectValue placeholder="연령대 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">선택 없음</SelectItem>
                                        <SelectItem value="소아">소아</SelectItem>
                                        <SelectItem value="청소년">청소년</SelectItem>
                                        <SelectItem value="성인">성인</SelectItem>
                                        <SelectItem value="고령자">고령자</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* <div>
                                <Label className="flex items-center justify-between font-medium">
                                    임신 여부
                                    <Switch checked={isPregnant} onCheckedChange={setIsPregnant} />
                                </Label>
                            </div> */}

                            <div className="space-y-1">
                            <Label className="text-sm font-semibold text-gray-700">임신 여부</Label>
                            <div className="flex gap-2">
                                <Button
                                type="button"
                                variant={isPregnant ? "outline" : "default"}
                                onClick={() => setIsPregnant(false)}
                                >
                                아니오
                                </Button>
                                <Button
                                type="button"
                                variant={isPregnant ? "default" : "outline"}
                                onClick={() => setIsPregnant(true)}
                                >
                                예
                                </Button>
                            </div>
                            </div>

                            <div>
                                <Label className="font-medium">피하고 싶은 질병</Label>
                                <Input
                                    placeholder="예: 간질환, 신장병"
                                    value={disease}
                                    onChange={(e) => setDisease(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full mt-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition duration-300"
                            onClick={handleSearch}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin w-4 h-4" />
                                    검색 중...
                                </div>
                            ) : '🔍 의약품 검색'}
                        </Button>
                    </CardContent>
                </Card>

                {result.length > 0 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-700">📋 추천 의약품 목록</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {result.map((med, idx) => (
                                <Card key={idx} className="hover:shadow-xl transition-shadow border border-sky-100 rounded-xl">
                                    <CardContent className="p-6 space-y-3">
                                        <h3 className="text-xl font-semibold text-sky-800">{med.ph_nm_c} ({med.ph_c_nm})</h3>
                                        <p className="text-sm text-gray-600">✔️ 주요 효능: {med.ph_effect.slice(0, 100)}{med.ph_effect.length > 100 ? '...' : ''}</p>
                                        <p className="text-sm text-blue-700 font-semibold">🔗 관련도: {med.total_score}</p>
                                        <Tabs defaultValue="효능" className="mt-4">
                                            <TabsList>
                                                <TabsTrigger value="효능">📌 효능</TabsTrigger>
                                                <TabsTrigger value="주의사항">⚠️ 주의사항</TabsTrigger>
                                                <TabsTrigger value="부작용">🚫 부작용</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="효능">{med.ph_effect}</TabsContent>
                                            <TabsContent value="주의사항">
                                                {med.ph_anti_warn || '정보 없음'}<br />{med.ph_warn || ''}
                                            </TabsContent>
                                            <TabsContent value="부작용">{med.ph_s_effect || '정보 없음'}</TabsContent>
                                        </Tabs>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {result.length === 0 && !loading && (
                    <p className="text-center text-gray-500">검색 결과가 없습니다. 조건을 변경하거나 다른 증상을 입력해보세요.</p>
                )}
            </div>
        </div>
    );
}

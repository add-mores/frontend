import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DiseaseSearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [method, setMethod] = useState("tfidf");

    const handleSearch = async () => {
        if (!query.trim()) return;

        const res = await fetch(`/api/disease?method=${method}&query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-2">🏥 질병 정보 검색</h1>
            <p className="text-gray-600 mb-4">증상이나 질병명을 입력하여 관련 질병 정보를 찾아보세요.</p>

            <div className="flex gap-2 mb-4">
                <Input
                    placeholder="예: 두통, 감기, 발열..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <Button onClick={handleSearch}>검색</Button>
            </div>

            <Tabs defaultValue="tfidf" onValueChange={(val) => setMethod(val)} className="mb-4">
                <TabsList>
                    <TabsTrigger value="tfidf">TF-IDF 기반 검색</TabsTrigger>
                    <TabsTrigger value="match">단순 매칭 검색</TabsTrigger>
                </TabsList>
            </Tabs>

            {results.length > 0 && (
                <>
                    <h2 className="text-xl font-semibold mt-6 mb-2">🔍 검색 결과</h2>
                    <div className="space-y-4">
                        {results.map((item, index) => (
                            <Card key={index} className="bg-white dark:bg-gray-900">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-bold">{index + 1}. {item.disnm_ko} ({item.disnm_en})</h3>
                                        <span className="bg-blue-500 text-white text-sm rounded-full px-2 py-1">관련도: {item.score.toFixed(2)}</span>
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-blue-500 font-semibold">📋 진료과</p>
                                        <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">{item.dep || '정보 없음'}</p>
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
                                        <p className="text-blue-500 font-semibold">🔑 관련 키워드</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {item.tokens.map(([token, weight]) => (
                                                <span key={token} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full px-2 py-1">
                                                    {token} ({weight.toFixed(2)})
                                                </span>
                                            ))}
                                        </div>
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

"use client";

import React, { useState } from "react";
import axios from "axios";

interface AIAssistantProps {
  weather: string;
  temperature: number;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ weather, temperature }) => {
  const [suggestion, setSuggestion] = useState<string>(""); // 提案内容
  const [loading, setLoading] = useState<boolean>(false);  // ローディング状態

  // AIによるスケジュール提案を取得する関数
  const fetchScheduleSuggestion = async () => {
    setLoading(true); // ローディング開始
    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("APIキーが設定されていません");
      }

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "あなたは天気に合わせたスケジュールを提案するアシスタントです。",
            },
            {
              role: "user",
              content: `今日の天気は「${weather}」、気温は${temperature}°Cです。適した1日のスケジュールを提案してください。`,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      setSuggestion(response.data.choices[0].message.content); // 提案をセット
    } catch (error) {
      console.error("AIの応答取得に失敗しました", error);
      setSuggestion("AIから提案を取得できませんでした。"); // エラーハンドリング
    } finally {
      setLoading(false); // ローディング終了
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-100 shadow-md rounded-lg text-center max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold text-center sm:text-xl">AIアシスタントの提案</h2>

      {loading ? (
        <p>提案を生成中...</p> // ローディング中の表示
      ) : suggestion ? (
        <p className="text-sm sm:text-base">{suggestion}</p> // 提案内容の表示
      ) : (
        <button
          onClick={fetchScheduleSuggestion} // ボタンで提案を取得
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md shadow-md sm:px-6 sm:py-3"
        >
          スケジュールを取得
        </button>
      )}
    </div>
  );
};

export default AIAssistant;

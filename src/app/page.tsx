"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import AIAssistant from "./components/AIAssistant";

// 天気データ取得
const fetchWeatherData = async (lat: number, lon: number) => {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error("APIキーが設定されていません");
  }

  const response = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`
  );
  return response.data;
};

// 逆ジオコーディング（地名取得）
const fetchLocationName = async (lat: number, lon: number) => {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  const response = await axios.get(
    `https://api.openweathermap.org/data/2.5/reverse?lat=${lat}&lon=${lon}&appid=${apiKey}&lang=ja`
  );
  return response.data[0]?.name || "不明";
};

const CalendarPage = () => {
  const [weather, setWeather] = useState<string>("");
  const [temperature, setTemperature] = useState<number>(0);
  const [maxTemperature, setMaxTemperature] = useState<number>(0);
  const [minTemperature, setMinTemperature] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newEventTitle, setNewEventTitle] = useState<string>("");

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // どの環境でも大阪の天気情報を取得（固定）
        const data = await fetchWeatherData(34.6937, 135.5023);
        setWeather(data.weather[0].description);
        setTemperature(data.main.temp);
        setMaxTemperature(data.main.temp_max);
        setMinTemperature(data.main.temp_min);
        setLocationName("大阪府");
        setLoading(false);
      } catch (error) {
        console.error("天気情報の取得に失敗しました", error);
        setLoading(false);
      }
    };
    
    fetchWeather();

    const storedEvents = localStorage.getItem("events");
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents));
    }
  }, []);

  const handleDateClick = (info: any) => {
    setSelectedDate(info.dateStr);
  };

  const handleSaveEvent = () => {
    if (selectedDate && newEventTitle) {
      const newEvent = { title: newEventTitle, date: selectedDate };
      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
      localStorage.setItem("events", JSON.stringify(updatedEvents));
      setNewEventTitle("");
      setSelectedDate(null);
    }
  };

  const handleDeleteEvent = (date: string) => {
    const updatedEvents = events.filter((event) => event.date !== date);
    setEvents(updatedEvents);
    localStorage.setItem("events", JSON.stringify(updatedEvents));
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 今日の情報 */}
      <section className="today-info bg-white shadow-md rounded-lg p-4 mb-6">
        <h2 className="text-2xl font-semibold text-center sm:text-3xl">
          {new Date().toLocaleDateString("ja-JP")}
        </h2>
        <div className="weather-info mt-4">
          <p className="weather-description text-lg sm:text-xl">
            {loading ? "天気情報を取得中..." : weather}
          </p>
          <p className="temperature text-xl sm:text-2xl">
            {loading ? "..." : temperature}°C
          </p>
          <p className="temperature-range text-sm sm:text-base">
            {loading ? "" : `最高: ${maxTemperature}°C / 最低: ${minTemperature}°C`}
          </p>
        </div>
        <p className="location mt-2 text-sm sm:text-base">
          {latitude && longitude ? `現在地: ${locationName}` : ""}
        </p>
        {!loading && <AIAssistant weather={weather} temperature={temperature} />}
      </section>

      {/* 今日の予定 */}
      <section className="events-section mb-6">
        <h3 className="text-xl sm:text-2xl font-semibold">予定リスト</h3>
        <ul className="events mt-4">
          {events.map((event, index) => (
            <li key={index} className="flex justify-between items-center mb-2">
              <span>{event.title} ({event.date})</span>
              <button
                onClick={() => handleDeleteEvent(event.date)}
                className="bg-red-500 text-white px-2 py-1 rounded-md"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* カレンダー */}
      <section className="calendar-section mb-6">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          headerToolbar={{
            left: "dayGridMonth,timeGridWeek,timeGridDay",
            center: "title",
            right: "prev,next today",
          }}
          events={events}
          dateClick={handleDateClick}
          height="auto"
          aspectRatio={1.5}
          contentHeight="auto"
        />
      </section>

      {/* 予定入力フォーム */}
      {selectedDate && (
        <section className="event-input-form bg-white shadow-md rounded-lg p-4">
          <h3 className="text-lg sm:text-xl font-semibold">予定を入力</h3>
          <input
            type="text"
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            placeholder="予定を入力"
            className="mt-2 p-2 border border-gray-300 rounded-md w-full"
          />
          <button
            onClick={handleSaveEvent}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md"
          >
            保存
          </button>
        </section>
      )}
    </div>
  );
};

export default CalendarPage;

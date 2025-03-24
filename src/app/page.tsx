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
    const isProduction = process.env.NODE_ENV === "production";
    const fetchWeather = async () => {
      try {
        if (isProduction) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              setLatitude(latitude);
              setLongitude(longitude);
              const data = await fetchWeatherData(latitude, longitude);
              setWeather(data.weather[0].description);
              setTemperature(data.main.temp);
              setMaxTemperature(data.main.temp_max);
              setMinTemperature(data.main.temp_min);
              setLoading(false);

              const location = await fetchLocationName(latitude, longitude);
              setLocationName(location);
            },
            () => {
              alert("位置情報を取得できませんでした");
              setLoading(false);
            }
          );
        } else {
          const data = await fetchWeatherData(34.6937, 135.5023); // 大阪府の緯度経度
          setWeather(data.weather[0].description);
          setTemperature(data.main.temp);
          setMaxTemperature(data.main.temp_max);
          setMinTemperature(data.main.temp_min);
          setLoading(false);
          setLocationName("大阪府");
        }
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
    <div className="container">
      {/* 今日の情報 */}
      <section className="today-info">
        <h2>{new Date().toLocaleDateString("ja-JP")}</h2>
        <div className="weather-info">
          <p className="weather-description">
            {loading ? "天気情報を取得中..." : weather}
          </p>
          <p className="temperature">
            {loading ? "..." : temperature}°C
          </p>
          <p className="temperature-range">
            {loading ? "" : `最高: ${maxTemperature}°C / 最低: ${minTemperature}°C`}
          </p>
        </div>
        <p>{latitude && longitude ? `現在地: ${locationName}` : ""}</p>
        {!loading && <AIAssistant weather={weather} temperature={temperature} />}
      </section>

      {/* 今日の予定 */}
      <section>
        <h3>予定リスト</h3>
        <ul className="events">
          {events.map((event, index) => (
            <li key={index}>
              <span>{event.title} ({event.date})</span>
              <button onClick={() => handleDeleteEvent(event.date)}>削除</button>
            </li>
          ))}
        </ul>
      </section>

      {/* カレンダー */}
      <section>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          headerToolbar={{
            left: "title",
            center: "dayGridMonth,timeGridWeek,timeGridDay",
            right: "prev,next today",
          }}
          events={events}
          dateClick={handleDateClick}
          height="auto"
          aspectRatio={1.5}  // 画面幅に合わせて縦横比を調整
          contentHeight="auto"  // 高さを自動調整
        />
      </section>

      {/* 予定入力フォーム */}
      {selectedDate && (
        <section>
          <h3>予定を入力</h3>
          <input
            type="text"
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            placeholder="予定を入力"
          />
          <button onClick={handleSaveEvent}>保存</button>
        </section>
      )}
    </div>
  );
};

export default CalendarPage;

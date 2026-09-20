# Biblia Audio Christian Culture Studio

Studio produkcyjne Christian Culture do analizy tekstu biblijnego, podziału na role, syntezy Gemini TTS oraz eksportu WAV, MP3 i MP4.

## Wymagania

- Node.js 22+
- FFmpeg i FFprobe dostępne w `PATH`
- klucz Gemini API

## Uruchomienie

```bash
cp .env.example .env
npm install
npm run dev
```

Uzupełnij `GEMINI_API_KEY` w `.env`. Sekretu nie wolno dodawać do repozytorium.

## Kontrola jakości

```bash
npm run lint
npm test
npm run build
```

Bezpośrednia publikacja YouTube jest świadomie wyłączona do czasu wdrożenia OAuth i YouTube Data API. Aplikacja nie pokazuje pozornego sukcesu publikacji.

## Ważne ograniczenie wdrożeniowe

Pliki renderowane są obecnie przechowywane w katalogu tymczasowym procesu. Przed publicznym wdrożeniem należy podłączyć trwały magazyn obiektowy i autoryzację użytkowników.

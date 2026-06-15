# Mapify 🗺️🎵

Mapify to mobilna aplikacja stworzona w **React Native (Expo)**, która łączy Twoją bieżącą lokalizację z aktualnie odtwarzaną muzyką w serwisie Spotify. 

Aplikacja wyświetla pełnoekranową mapę z Twoją pozycją oraz elegancką nakładkę, w której widzisz, jakiego utworu właśnie słuchasz. Dzięki nowo dodanym przyciskom, możesz płynnie sterować muzyką bezpośrednio z ekranu nawigacji!

## Funkcje
- 📍 **Śledzenie lokalizacji:** Pokazuje Twoją bieżącą pozycję na mapie na żywo.
- 🎶 **Integracja ze Spotify API:** Wyświetla aktualnie odtwarzany utwór (tytuł, wykonawcę, okładkę albumu oraz status odtwarzania).
- ⏯️ **Sterowanie muzyką:** Wbudowane przyciski *Play*, *Pause*, *Następny utwór* oraz *Poprzedni utwór* pozwalające na zarządzanie odtwarzaczem ze Spotify z poziomu aplikacji.
- 🎨 **Nowoczesny design:** Interfejs zaprojektowany w trybie ciemnym, wykorzystujący estetyczne komponenty.

## Wymagania wstępne
- Zainstalowane środowisko Node.js
- Aplikacja Expo Go na Twoim telefonie (lub emulator iOS/Android)
- Posiadanie darmowego konta programisty na [Spotify Developer](https://developer.spotify.com/)

## Instrukcja uruchomienia

### 1. Klonowanie i instalacja
Pobierz repozytorium i zainstaluj zależności w folderze z projektem:
```bash
npm install
```

### 2. Konfiguracja w Spotify Developer Dashboard
1. Przejdź do [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/) i utwórz nową aplikację.
2. Z głównego panelu skopiuj swoje **Client ID** (będzie potrzebne w aplikacji).
3. W ustawieniach tej aplikacji Spotify wejdź w **Redirect URIs** i dodaj adres, który wyświetli się na początkowym ekranie konfiguracji aplikacji Mapify w Twoim telefonie. Będzie on wyglądać podobnie do:
   `exp://192.168.1.10:8081` lub `spotifymapapp://` w zależności od konfiguracji Expo.

### 3. Uruchomienie aplikacji
Aby włączyć środowisko, wpisz:
```bash
npm start
```
Następnie zeskanuj kod QR za pomocą aplikacji **Expo Go** (Android) lub wbudowanej **Aplikacji Aparat** (iOS).

### 4. Pierwsze kroki w aplikacji
1. Podaj swoje **Client ID**.
2. Kliknij **Połącz ze Spotify**, aby autoryzować aplikację na swoim koncie.
3. Gdy autoryzacja się powiedzie, zobaczysz mapę i odtwarzacz muzyki!

## Technologie
- **React Native** (framework mobilny)
- **Expo** (zarządzanie projektem i autoryzacją)
- **React Native Maps** (obsługa map)
- **Spotify Web API** (pobieranie informacji o utworach i sterowanie odtwarzaniem)

# FakeTok 🎬

Darmowy edytor wideo po polsku: oś czasu, efekty, przejścia, filtry, animowane napisy, naklejki, usuwanie tła AI i eksport do MP4. Działa bez internetu, a Twoje filmy nie są nigdzie wysyłane.

## ⬇️ Pobierz

| | Plik | |
|---|---|---|
| 🪟 **Windows 10/11** | [**FakeTok-Setup.exe**](https://github.com/maxioo21/kadr-studio/raw/main/pobierz/FakeTok-Setup.exe) (26 MB) | instalator: ikona na pulpicie i w menu Start |
| 🤖 **Android** | [**FakeTok.apk**](https://github.com/maxioo21/kadr-studio/raw/main/pobierz/FakeTok.apk) (5,4 MB) | gotowe filmy trafiają do galerii |
| 🌐 **Przeglądarka** (telefon i komputer) | **https://maxioo21.github.io/kadr-studio/** | przycisk „Zainstaluj” dodaje aplikację na ekran główny |
| 🎬 **FakeTok Animacje** | **https://maxioo21.github.io/kadr-studio/animacje/** | 27 gotowych animacji do montażu: nakładki (światło, wypalenie kliszy, glitch, REC, strzałki, iskry, dym), przejścia, postać 3D z Twoim skinem, intro i napisy |

**Windows:** uruchom pobrany plik. Jeśli pojawi się „System Windows ochronił ten komputer”, kliknij *Więcej informacji*, a potem *Uruchom mimo to*. Program otwiera się we własnym oknie (używa Microsoft Edge, który jest w każdym Windowsie). Gotowe filmy zapisują się w folderze *Pobrane*.

**Android:** dotknij pobranego pliku, zezwól na instalację z tego źródła, a przy ostrzeżeniu Play Protect wybierz *Zainstaluj mimo to*. Wymagany Android 7 lub nowszy.

**iPhone:** otwórz link do wersji w przeglądarce w Safari, dotknij *Udostępnij*, a potem *Do ekranu początkowego*.

## Co potrafi (wersja 1.1)

- **Gotowe presety do editów** (zakładka *Gotowe*): phonk wstrząs, zoom na bit, błysk na bit, RGB uderzenia, czarno-białe uderzenia, glitch montaż, stroboskop, velocity (szybko–wolno–szybko), kinowy dramat, wspomnienie, edit 3D i inne. Jedno kliknięcie nakłada je na cały film, a gdy jest muzyka, uderzenia trafiają w jej rytm.
- **62 efekty** z podglądem na żywo po najechaniu: uderzenia (zoom, wstrząs, błyski), glitch, VHS, śnieg, deszcz, bokeh, konfetti, serduszka, poświata, hologram, kinowe pasy i inne. Efekty to osobne paski na osi czasu, jak w profesjonalnych edytorach.
- **45 przejść** i **39 filtrów** w kategoriach, z animowanym podglądem.
- **Animacje klipów i tekstu z podglądem na postaci:** najedź na kafelek, a postać pokaże ruch. Ponad 20 animacji wejścia, wyjścia i w pętli dla klipów i drugie tyle dla napisów (deszcz liter, rozsypanie, glitch, galaretka…).
- **Napisy:** 26 stylów i 12 gotowych etykiet (SUBSKRYBUJ, LIKE, WOW!…), ponad 130 naklejek.
- **Oś czasu:** miniatury klatek i fala dźwięku na klipach, przycinanie, dzielenie, cofanie zmian.
- **Biblioteka ruchomych klipów** do testowania efektów i 3 własne podkłady muzyczne oraz 9 efektów dźwiękowych.
- **Usuwanie tła AI**, zielony ekran, obraz w obrazie, prędkość 0,1×–5×, filtry i korekcja koloru.
- **Płynny podgląd:** na słabszym komputerze edytor sam obniża jakość podglądu, a eksport zawsze jest w pełnej jakości.
- **Magia:** auto-montaż, cięcie do rytmu, szybkie napisy, intro 3-2-1, stop-klatka, zapis miniaturki.

## Dla programistów

Cały edytor to jeden plik `src/kadr.html` (HTML, CSS, JavaScript i shadery WebGL 2), bez frameworków. Wymagany Node.js 22+.

```bash
npm install
```

```bash
npm run fonts        # pobiera czcionki do docs/fonts (raz)
npm run build:web    # buduje docs/ (GitHub Pages, praca offline)
npm run build:installer   # dist/FakeTok.exe i dist/FakeTok-Setup.exe (wymaga makensis)
npm run build:android     # dist/FakeTok.apk (wymaga android-sdk-platform-23 aapt apksigner dalvik-exchange zipalign i JDK)
npm start            # uruchamia wersję na komputer z folderu docs/
```

Usuwanie tła korzysta z modelu MediaPipe Selfie Segmentation (Apache 2.0), czcionki pochodzą z Google Fonts (SIL Open Font License).

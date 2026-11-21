# Kadr Studio 🎬

Darmowy edytor wideo po polsku: oś czasu, efekty, przejścia, filtry, animowane napisy, naklejki, usuwanie tła AI i eksport do MP4. Działa bez internetu, a Twoje filmy nie są nigdzie wysyłane.

## ⬇️ Pobierz

| | Plik | |
|---|---|---|
| 🪟 **Windows 10/11** | [**KadrStudio-Setup.exe**](https://github.com/maxioo21/kadr-studio/raw/main/pobierz/KadrStudio-Setup.exe) (26 MB) | instalator: ikona na pulpicie i w menu Start |
| 🤖 **Android** | [**KadrStudio.apk**](https://github.com/maxioo21/kadr-studio/raw/main/pobierz/KadrStudio.apk) (4,4 MB) | gotowe filmy trafiają do galerii |
| 🌐 **Przeglądarka** (telefon i komputer) | **https://maxioo21.github.io/kadr-studio/** | przycisk „Zainstaluj” dodaje aplikację na ekran główny |

**Windows:** uruchom pobrany plik. Jeśli pojawi się „System Windows ochronił ten komputer”, kliknij *Więcej informacji*, a potem *Uruchom mimo to*. Program otwiera się we własnym oknie (używa Microsoft Edge, który jest w każdym Windowsie). Gotowe filmy zapisują się w folderze *Pobrane*.

**Android:** dotknij pobranego pliku, zezwól na instalację z tego źródła, a przy ostrzeżeniu Play Protect wybierz *Zainstaluj mimo to*. Wymagany Android 7 lub nowszy.

**iPhone:** otwórz link do wersji w przeglądarce w Safari, dotknij *Udostępnij*, a potem *Do ekranu początkowego*.

## Co potrafi

- **Oś czasu:** ścieżka filmów, warstwy z tekstami i naklejkami, muzyka i dźwięki. Przeciąganie, przycinanie, dzielenie, duplikowanie, cofanie zmian.
- **28 przejść, 30 efektów, 25 filtrów** z podglądami, do tego jasność, kontrast, nasycenie, temperatura, winieta i ziarno.
- **Animacje klipów** na wejście, wyjście i w pętli oraz prędkość od 0,1× do 5×.
- **Napisy:** 14 stylów, animacje (maszyna do pisania, litera po literze, fala…), obrys, cień, poświata, ponad 80 naklejek.
- **Usuwanie tła AI** (osoba na kolorze, rozmyciu albo zdjęciu) oraz zielony ekran z pipetą.
- **Obraz w obrazie** z kształtami i trybami mieszania.
- **Magia:** auto-montaż, cięcie do rytmu muzyki, szybkie napisy z tekstu, intro 3-2-1, stop-klatka, zapis miniaturki.
- **Format:** 9:16, 16:9, 1:1, 4:5 i inne, do 1080p i 60 klatek na sekundę.

## Dla programistów

Cały edytor to jeden plik `src/kadr.html` (HTML, CSS, JavaScript i shadery WebGL 2), bez frameworków. Wymagany Node.js 22+.

```bash
npm install
```

```bash
npm run fonts        # pobiera czcionki do docs/fonts (raz)
npm run build:web    # buduje docs/ (GitHub Pages, praca offline)
npm run build:installer   # dist/KadrStudio.exe i dist/KadrStudio-Setup.exe (wymaga makensis)
npm run build:android     # dist/KadrStudio.apk (wymaga android-sdk-platform-23 aapt apksigner dalvik-exchange zipalign i JDK)
npm start            # uruchamia wersję na komputer z folderu docs/
```

Usuwanie tła korzysta z modelu MediaPipe Selfie Segmentation (Apache 2.0), czcionki pochodzą z Google Fonts (SIL Open Font License).

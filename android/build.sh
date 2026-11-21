#!/usr/bin/env bash
# Buduje FakeTok na Androida: dist/FakeTok.apk  (najpierw: npm run build:web)
# Wymaga (Ubuntu/Debian): android-sdk-platform-23 aapt apksigner dalvik-exchange zipalign oraz JDK.
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(cd .. && pwd)"
SDK_JAR=/usr/lib/android-sdk/platforms/android-23/android.jar
OUT="$ROOT/dist"
B=build
KEYSTORE="${KADR_KEYSTORE:-$PWD/kadr-release.jks}"
KEYPASS="${KADR_KEYPASS:-kadr-studio}"

rm -rf "$B" && mkdir -p "$B/classes" "$B/assets" "$OUT"
echo "1/5 Pliki edytora"
cp -r "$ROOT/docs" "$B/assets/www" && rm -f "$B/assets/www/sw.js" "$B/assets/www/.nojekyll"
echo "2/5 Kompilacja Java"
javac --release 8 -nowarn -Xlint:none -classpath "$SDK_JAR" -d "$B/classes" $(find src -name '*.java') 2>&1 | grep -v "^warning\|^Note\|JAVA_OPTIONS\|JAVA_TOOL_OPTIONS" || true
[ -n "$(find "$B/classes" -name '*.class')" ] || { echo "Błąd kompilacji Java"; exit 1; }
echo "3/5 Dalvik (classes.dex)"
dalvik-exchange --dex --min-sdk-version=24 --output="$B/classes.dex" "$B/classes"
echo "4/5 Pakowanie APK"
aapt package -f -M AndroidManifest.xml -S res -A "$B/assets" -I "$SDK_JAR" -F "$B/unsigned.apk"
(cd "$B" && aapt add unsigned.apk classes.dex >/dev/null)
zipalign -f -p 4 "$B/unsigned.apk" "$B/aligned.apk"
echo "5/5 Podpisywanie"
if [ ! -f "$KEYSTORE" ]; then
  keytool -genkeypair -keystore "$KEYSTORE" -storepass "$KEYPASS" -keypass "$KEYPASS" -alias kadr \
    -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Kadr Studio, O=Kadr Studio, C=PL" >/dev/null 2>&1
fi
apksigner sign --ks "$KEYSTORE" --ks-pass "pass:$KEYPASS" --ks-key-alias kadr --out "$OUT/FakeTok.apk" "$B/aligned.apk"
apksigner verify "$OUT/FakeTok.apk"
echo "Gotowe: $OUT/FakeTok.apk ($(du -h "$OUT/FakeTok.apk" | cut -f1))"

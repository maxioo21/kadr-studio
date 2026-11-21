; FakeTok – instalator dla Windows (NSIS). Budowanie: npm run build:installer
Target amd64-unicode
!include "MUI2.nsh"

!define APPNAME "FakeTok"
!define APPVERSION "1.1.0"
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\FakeTok"

Name "${APPNAME}"
OutFile "..\dist\FakeTok-Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\FakeTok"
InstallDirRegKey HKCU "Software\FakeTok" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
BrandingText "FakeTok ${APPVERSION}"

VIProductVersion "1.1.0.0"
VIAddVersionKey /LANG=1045 "ProductName" "FakeTok"
VIAddVersionKey /LANG=1045 "FileDescription" "Instalator FakeTok"
VIAddVersionKey /LANG=1045 "FileVersion" "${APPVERSION}"
VIAddVersionKey /LANG=1045 "ProductVersion" "${APPVERSION}"
VIAddVersionKey /LANG=1045 "CompanyName" "FakeTok"
VIAddVersionKey /LANG=1045 "LegalCopyright" "FakeTok"

!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Witaj w instalatorze FakeTok"
!define MUI_WELCOMEPAGE_TEXT "FakeTok to darmowy edytor wideo: efekty, przejścia, filtry, animowane napisy i usuwanie tła.$\r$\n$\r$\nInstalator doda program do menu Start i na pulpit, a starszą wersję o nazwie Kadr Studio usunie. Nie są potrzebne uprawnienia administratora.$\r$\n$\r$\nKliknij Dalej, aby kontynuować."
!define MUI_FINISHPAGE_RUN "$INSTDIR\FakeTok.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Uruchom FakeTok"
!define MUI_FINISHPAGE_TITLE "Gotowe!"
!define MUI_FINISHPAGE_TEXT "FakeTok został zainstalowany. Uruchomisz je ikoną na pulpicie lub z menu Start.$\r$\n$\r$\nGotowe filmy trafiają do folderu Pobrane."

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "Polish"

Section "FakeTok" SecMain
  SectionIn RO
  nsExec::Exec 'taskkill /F /IM FakeTok.exe'
  nsExec::Exec 'taskkill /F /IM KadrStudio.exe'
  Sleep 500
  ; poprzednia nazwa programu: Kadr Studio – usuń ją po cichu
  IfFileExists "$LOCALAPPDATA\Programs\KadrStudio\Odinstaluj.exe" 0 +2
    ExecWait '"$LOCALAPPDATA\Programs\KadrStudio\Odinstaluj.exe" /S _?=$LOCALAPPDATA\Programs\KadrStudio'
  Delete "$LOCALAPPDATA\Programs\KadrStudio\Odinstaluj.exe"
  RMDir "$LOCALAPPDATA\Programs\KadrStudio"
  SetOutPath "$INSTDIR"
  File "..\dist\FakeTok.exe"
  File "/oname=FakeTok.ico" "icon.ico"
  WriteUninstaller "$INSTDIR\Odinstaluj.exe"

  CreateShortcut "$DESKTOP\FakeTok.lnk" "$INSTDIR\FakeTok.exe" "" "$INSTDIR\FakeTok.exe" 0 SW_SHOWNORMAL "" "Edytor wideo FakeTok"
  CreateDirectory "$SMPROGRAMS\FakeTok"
  CreateShortcut "$SMPROGRAMS\FakeTok\FakeTok.lnk" "$INSTDIR\FakeTok.exe" "" "$INSTDIR\FakeTok.exe" 0 SW_SHOWNORMAL "" "Edytor wideo FakeTok"
  CreateShortcut "$SMPROGRAMS\FakeTok\Odinstaluj FakeTok.lnk" "$INSTDIR\Odinstaluj.exe"

  WriteRegStr HKCU "Software\FakeTok" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayName" "FakeTok – edytor wideo"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayVersion" "${APPVERSION}"
  WriteRegStr HKCU "${UNINSTKEY}" "Publisher" "FakeTok"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayIcon" "$INSTDIR\FakeTok.exe"
  WriteRegStr HKCU "${UNINSTKEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTKEY}" "UninstallString" '"$INSTDIR\Odinstaluj.exe"'
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoRepair" 1
  WriteRegDWORD HKCU "${UNINSTKEY}" "EstimatedSize" 98000
SectionEnd

Section "Uninstall"
  nsExec::Exec 'taskkill /F /IM FakeTok.exe'
  Sleep 500
  Delete "$INSTDIR\FakeTok.exe"
  Delete "$INSTDIR\FakeTok.ico"
  Delete "$INSTDIR\Odinstaluj.exe"
  RMDir "$INSTDIR"
  Delete "$DESKTOP\FakeTok.lnk"
  Delete "$SMPROGRAMS\FakeTok\FakeTok.lnk"
  Delete "$SMPROGRAMS\FakeTok\Odinstaluj FakeTok.lnk"
  RMDir "$SMPROGRAMS\FakeTok"
  DeleteRegKey HKCU "${UNINSTKEY}"
  DeleteRegKey HKCU "Software\FakeTok"
SectionEnd

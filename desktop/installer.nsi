; Kadr Studio – instalator dla Windows (NSIS). Budowanie: npm run build:installer
Target amd64-unicode
!include "MUI2.nsh"

!define APPNAME "Kadr Studio"
!define APPVERSION "1.0.0"
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\KadrStudio"

Name "${APPNAME}"
OutFile "..\dist\KadrStudio-Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\KadrStudio"
InstallDirRegKey HKCU "Software\KadrStudio" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
BrandingText "Kadr Studio ${APPVERSION}"

VIProductVersion "1.0.0.0"
VIAddVersionKey /LANG=1045 "ProductName" "Kadr Studio"
VIAddVersionKey /LANG=1045 "FileDescription" "Instalator Kadr Studio"
VIAddVersionKey /LANG=1045 "FileVersion" "${APPVERSION}"
VIAddVersionKey /LANG=1045 "ProductVersion" "${APPVERSION}"
VIAddVersionKey /LANG=1045 "CompanyName" "Kadr Studio"
VIAddVersionKey /LANG=1045 "LegalCopyright" "Kadr Studio"

!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Witaj w instalatorze Kadr Studio"
!define MUI_WELCOMEPAGE_TEXT "Kadr Studio to darmowy edytor wideo: efekty, przejścia, filtry, animowane napisy i usuwanie tła.$\r$\n$\r$\nInstalator doda program do menu Start i na pulpit. Nie są potrzebne uprawnienia administratora.$\r$\n$\r$\nKliknij Dalej, aby kontynuować."
!define MUI_FINISHPAGE_RUN "$INSTDIR\KadrStudio.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Uruchom Kadr Studio"
!define MUI_FINISHPAGE_TITLE "Gotowe!"
!define MUI_FINISHPAGE_TEXT "Kadr Studio zostało zainstalowane. Uruchomisz je ikoną na pulpicie lub z menu Start.$\r$\n$\r$\nGotowe filmy trafiają do folderu Pobrane."

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "Polish"

Section "Kadr Studio" SecMain
  SectionIn RO
  nsExec::Exec 'taskkill /F /IM KadrStudio.exe'
  Sleep 500
  SetOutPath "$INSTDIR"
  File "..\dist\KadrStudio.exe"
  File "/oname=KadrStudio.ico" "icon.ico"
  WriteUninstaller "$INSTDIR\Odinstaluj.exe"

  CreateShortcut "$DESKTOP\Kadr Studio.lnk" "$INSTDIR\KadrStudio.exe" "" "$INSTDIR\KadrStudio.exe" 0 SW_SHOWNORMAL "" "Edytor wideo Kadr Studio"
  CreateDirectory "$SMPROGRAMS\Kadr Studio"
  CreateShortcut "$SMPROGRAMS\Kadr Studio\Kadr Studio.lnk" "$INSTDIR\KadrStudio.exe" "" "$INSTDIR\KadrStudio.exe" 0 SW_SHOWNORMAL "" "Edytor wideo Kadr Studio"
  CreateShortcut "$SMPROGRAMS\Kadr Studio\Odinstaluj Kadr Studio.lnk" "$INSTDIR\Odinstaluj.exe"

  WriteRegStr HKCU "Software\KadrStudio" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayName" "Kadr Studio – edytor wideo"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayVersion" "${APPVERSION}"
  WriteRegStr HKCU "${UNINSTKEY}" "Publisher" "Kadr Studio"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayIcon" "$INSTDIR\KadrStudio.exe"
  WriteRegStr HKCU "${UNINSTKEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTKEY}" "UninstallString" '"$INSTDIR\Odinstaluj.exe"'
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoRepair" 1
  WriteRegDWORD HKCU "${UNINSTKEY}" "EstimatedSize" 98000
SectionEnd

Section "Uninstall"
  nsExec::Exec 'taskkill /F /IM KadrStudio.exe'
  Sleep 500
  Delete "$INSTDIR\KadrStudio.exe"
  Delete "$INSTDIR\KadrStudio.ico"
  Delete "$INSTDIR\Odinstaluj.exe"
  RMDir "$INSTDIR"
  Delete "$DESKTOP\Kadr Studio.lnk"
  Delete "$SMPROGRAMS\Kadr Studio\Kadr Studio.lnk"
  Delete "$SMPROGRAMS\Kadr Studio\Odinstaluj Kadr Studio.lnk"
  RMDir "$SMPROGRAMS\Kadr Studio"
  DeleteRegKey HKCU "${UNINSTKEY}"
  DeleteRegKey HKCU "Software\KadrStudio"
SectionEnd

@echo off

echo Cleaning old files...
del /q *.exe *.dll *.obj *.lib *.exp *.res *.tlb *.h *.c 2>nul

echo.
echo [1/5] Compiling IDL → TLB
midl vault.idl
if %errorlevel% neq 0 (
    echo MIDL failed
    exit /b %errorlevel%
)

echo.
echo [2/5] Compiling resource (embed TLB)
rc vault.rc
if %errorlevel% neq 0 (
    echo Resource compilation failed
    exit /b %errorlevel%
)

echo.
echo [3/5] Building server.dll (with embedded TLB)
cl /LD /EHsc /Zi /Ob0 server.cpp vault.res ole32.lib /link /DEF:server.def
if %errorlevel% neq 0 (
    echo Server build failed
    exit /b %errorlevel%
)

echo.
echo [4/5] Building client.exe
cl /EHsc /Zi /Ob0 client.cpp ole32.lib
if %errorlevel% neq 0 (
    echo Client build failed
    exit /b %errorlevel%
)

echo.
echo [5/5] Done
echo =========================
echo Output:
echo   server.dll  (contains embedded TLB)
echo   client.exe
echo =========================
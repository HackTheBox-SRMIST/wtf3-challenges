#include <stdio.h>
#include <windows.h>
#include <objbase.h>
#include <cstdint>

// Same CLSID
const CLSID CLSID_Vault =
{ 0x8F1C2A10, 0x9B34, 0x4F21, {0xAB,0xCD,0x99,0x88,0x77,0x66,0x55,0x44} };

// Public IID
const IID IID_IPublic =
{ 0xCA700001, 0x1111, 0x2222, {0xAA,0xAA,0x01,0x02,0x03,0x04,0x05,0x06} };

// Interface definitions
struct IPublic : IUnknown {
    virtual void PublicMethod() = 0;
};

struct IHidden : IUnknown {
    virtual void GetFood() = 0;
    virtual void GetCat() = 0;
    virtual void GetFlag(char* out) = 0;
};

// Function pointer type
typedef HRESULT (__stdcall *PFN_DllGetClassObject)(
    REFCLSID, REFIID, void**);

int main() {
    CoInitialize(NULL);

    // manual load (no registry dependency)
    HMODULE h = LoadLibraryA("server.dll");
    if (!h) {
        printf("Failed to load server.dll\n");
        return 1;
    }

    PFN_DllGetClassObject DllGetClassObject =
        (PFN_DllGetClassObject)GetProcAddress(h, "DllGetClassObject");

    if (!DllGetClassObject) {
        printf("Failed to resolve DllGetClassObject\n");
        return 1;
    }

    IClassFactory* cf = NULL;

    HRESULT hr = DllGetClassObject(
        CLSID_Vault,
        IID_IClassFactory,
        (void**)&cf
    );

    if (FAILED(hr)) {
        printf("Failed to get class factory\n");
        return 1;
    }

    IPublic* pub = NULL;

    hr = cf->CreateInstance(
        NULL,
        IID_IPublic,
        (void**)&pub
    );

    if (FAILED(hr)) {
        printf("Failed to create COM object\n");
        return 1;
    }

    pub->PublicMethod();

    // INTENTIONALLY BROKEN IID

    IID hidden = {};
    uint8_t* bytes = (uint8_t*)&hidden;

    const uint8_t KEY = 0x11;

    // stored = real ^ (KEY + index)
    const uint8_t stored[16] = {
        0xD5, 0xB5, 0x13, 0x16,
        0x26, 0x25,
        0x53, 0x52,
        0x54, 0x5F, 0x2B, 0x4B,
        0x5E, 0x5F, 0x4B, 0x2D
    };

    for (int i = 0; i < 16; i++) {
        bytes[i] = stored[i] ^ (KEY + i);
    }

    // player must reconstruct correct IID

    IUnknown* unk = (IUnknown*)pub;
    IHidden* hiddenPtr = NULL;

    hr = unk->QueryInterface(hidden, (void**)&hiddenPtr);

    if (SUCCEEDED(hr) && hiddenPtr) {
        char flag[128];

        hiddenPtr->GetFlag(flag);

        printf("Flag: %s\n", flag);

        hiddenPtr->Release();
    } else {
        printf("Hidden interface not found\n");
    }

    pub->Release();
    cf->Release();

    CoUninitialize();
    return 0;
}
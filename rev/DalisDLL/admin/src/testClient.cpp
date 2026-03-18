#include <stdio.h>
#include <windows.h>
#include <objbase.h>

// Same CLSID

const CLSID CLSID_Vault =
{ 0x8F1C2A10, 0x9B34, 0x4F21, {0xAB,0xCD,0x99,0x88,0x77,0x66,0x55,0x44} };

// Public IID
const IID IID_IPublic =
{ 0xCA700001, 0x1111, 0x2222, {0xAA,0xAA,0x01,0x02,0x03,0x04,0x05,0x06} };

// Hidden IID (correct for testing)
const IID IID_IHidden =
{ 0xC4A70002, 0x3333, 0x4444, {0x4D,0x45,0x30,0x57,0x43,0x41,0x54,0x31} };

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

    // Load DLL manually
    HMODULE h = LoadLibraryA("server.dll");
    if (!h) {
        printf("Failed to load server.dll\n");
        return 1;
    }

    // Resolve DllGetClassObject
    PFN_DllGetClassObject DllGetClassObject =
        (PFN_DllGetClassObject)GetProcAddress(h, "DllGetClassObject");

    if (!DllGetClassObject) {
        printf("Failed to resolve DllGetClassObject\n");
        return 1;
    }

    // Get class factory
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

    // Create COM object
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

    // Call public interface
    pub->PublicMethod();

    // Query hidden interface
    IHidden* hidden = NULL;
    IUnknown* unk = (IUnknown*)pub;

    hr = unk->QueryInterface(IID_IHidden, (void**)&hidden);

    if (SUCCEEDED(hr) && hidden) {
        char flag[128];

        hidden->GetFlag(flag);

        printf("Flag: %s\n", flag);

        hidden->Release();
    } else {
        printf("Hidden interface not found\n");
    }

    pub->Release();
    cf->Release();

    CoUninitialize();
    return 0;
}

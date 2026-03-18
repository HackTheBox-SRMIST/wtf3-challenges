#include <stdio.h>
#include <windows.h>
#include <objbase.h>

// {C411C471-1234-4321-ABCD-112233445566}
// clsid identifies the com class
// iid identifies the interface contract

const CLSID CLSID_Vault =
{ 0x8F1C2A10, 0x9B34, 0x4F21, {0xAB,0xCD,0x99,0x88,0x77,0x66,0x55,0x44} };



// {CA700001-1111-2222-AAAA-010203040506}
const IID IID_IPublic =
{ 0xCA700001, 0x1111, 0x2222, {0xAA,0xAA,0x01,0x02,0x03,0x04,0x05,0x06} };

// Hidden: {C4A70002-3333-4444-4D45-305743415431}
const IID IID_IHidden =
{ 0xC4A70002, 0x3333, 0x4444, {0x4D,0x45,0x30,0x57,0x43,0x41,0x54,0x31} };

// small pivot without overhelping
const char* g_Banner = "Vault COM Server Loaded";

struct IPublic : IUnknown {
    virtual void PublicMethod() = 0;
};

struct IHidden : IUnknown {
    virtual void GetFood() = 0;
    virtual void GetCat() = 0;
    virtual void GetFlag(char* out) = 0;
};

class Vault : public IPublic, public IHidden {
    ULONG refCount;

public:
    Vault() : refCount(1) {}
    //core com interface 3 methods

    HRESULT __stdcall QueryInterface(REFIID riid, void** ppv) {
        //ref to interface id and output pointer
        if (riid == IID_IUnknown || riid == IID_IPublic) {
            *ppv = (IPublic*)this;
        } else if (riid == IID_IHidden) {
            *ppv = (IHidden*)this;
        } else {
            *ppv = NULL;
            return E_NOINTERFACE;
        }
        AddRef();
        return S_OK;
    }

    ULONG __stdcall AddRef() { return ++refCount; }

    ULONG __stdcall Release() {
        if (--refCount == 0) delete this;
        return refCount;
    }

    void PublicMethod() {
        printf("Public interface executed.\n");
    }

    void GetFood() {}
    void GetCat() {}

void GetFlag(char* out) {
    const unsigned char enc[] = {
        0x1D,0x01,0x17,0x2E,0x16,0x65,0x18,0x0A,
        0x64,0x1B,0x01,0x66,0x07,0x13,0x61,0x16,
        0x66,0x0A,0x65,0x17,0x13,0x00,0x60,0x16,
        0x61,0x01,0x64,0x65,0x1B,0x28
    };

    for (int i = 0; i < sizeof(enc); i++)
        out[i] = enc[i] ^ 0x55;

    out[sizeof(enc)] = 0;
}
};

class Factory : public IClassFactory {
public:
    HRESULT __stdcall QueryInterface(REFIID riid, void** ppv) {
        if (riid == IID_IUnknown || riid == IID_IClassFactory) {
            *ppv = this;
            return S_OK;
        }
        return E_NOINTERFACE;
    }

    ULONG __stdcall AddRef() { return 1; }
    ULONG __stdcall Release() { return 1; }

    HRESULT __stdcall CreateInstance(IUnknown*, REFIID riid, void** ppv) {
        Vault* obj = new Vault();
        return obj->QueryInterface(riid, ppv);
        //com object
    }

    HRESULT __stdcall LockServer(BOOL) { return S_OK; }
};

// entry point
extern "C" HRESULT __stdcall DllGetClassObject(
    REFCLSID clsid,
    REFIID riid,
    void** ppv
)
{
    OutputDebugStringA(g_Banner);

    if (clsid == CLSID_Vault) {
        Factory* factory = new Factory();
        HRESULT hr = factory->QueryInterface(riid, ppv);
        factory->Release();
        return hr;
    }

    return CLASS_E_CLASSNOTAVAILABLE;
}


BOOL APIENTRY DllMain(HMODULE, DWORD, LPVOID) {
    return TRUE;
}

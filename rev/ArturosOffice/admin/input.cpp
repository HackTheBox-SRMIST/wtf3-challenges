#include <iostream>
#include <string>
#include <fstream>
#include <cstdint>

using namespace std;

void align_dials(const string &code, uint32_t &d1, uint32_t &d2, uint32_t &d3) {
    d1 = d2 = d3 = 0;

    for (int i = 0; i < 7; ++i)
        d1 = d1 * 10u + static_cast<uint32_t>(code[i] - '0');
    for (int i = 7; i < 13; ++i)
        d2 = d2 * 10u + static_cast<uint32_t>(code[i] - '0');
    for (int i = 13; i < 20; ++i)
        d3 = d3 * 10u + static_cast<uint32_t>(code[i] - '0');
}

int vault_lock_alpha(uint32_t d1, uint32_t d2, uint32_t d3) {
    uint32_t t = (d1 ^ 0xA5A5A5A5u) + (d2 % 10007) + (d3 & 0xFFF);
    return t == ((1039711 ^ 0xA5A5A5A5u) + (610511 % 10007) + (6111115 & 0xFFF));
}

int vault_lock_beta(uint32_t d1, uint32_t d2, uint32_t d3) {
    uint32_t t = ((d2 * 7) ^ (d1 >> 3)) + (d3 % 65521);
    return t == (((610511 * 7) ^ (1039711 >> 3)) + (6111115 % 65521));
}

int vault_lock_gamma(uint32_t d1, uint32_t d2, uint32_t d3) {
    uint32_t t = (d3 ^ (d1 * 3)) + (d2 << 2);
    return t == ((6111115 ^ (1039711 * 3)) + (610511 << 2));
}

void open_vault() {
    ifstream f("flag.txt");

    if (!f.is_open()) {
        cout << "[ERROR] flag inaccessible. Contact CTF Author\n" << endl;
        return;
    }

    string treasure;
    getline(f, treasure);

    cout << "[VAULT OPENED] " << treasure << endl;
}

int main() {
    string code;

    cout << "Enter vault access code: " << flush;

    if (!(cin >> code)) {
        cout << "[ACCESS DENIED] failed to read input\n";
        return 0;
    }

    if (code.length() != 20) {
        cout << "[ACCESS DENIED] invalid code length\n";
        return 0;
    }

    for (char c : code) {
        if (c < '0' || c > '9') {
            cout << "[ACCESS DENIED] invalid code format\n";
            return 0;
        }
    }

    uint32_t d1 = 0, d2 = 0, d3 = 0;
    align_dials(code, d1, d2, d3);

    if (vault_lock_alpha(d1,d2,d3) &&
        vault_lock_beta(d1,d2,d3) &&
        vault_lock_gamma(d1,d2,d3)) {

        open_vault();
    } else {
        cout << "[ACCESS DENIED] vault integrity compromised\n";
        cout << "[ALERT] alarms engaged\n";
    }

    return 0;
}

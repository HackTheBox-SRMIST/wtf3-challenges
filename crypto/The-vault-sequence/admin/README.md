This challenge gives a bunch of certificates. At first glance they all look normal, but there’s hidden data spread across different fields.

The idea is basically:

* extract stuff from different places (CN, OU, serial, extensions)
* decode it step by step
* figure out the right order
* get the final flag

get the certificate details:
openssl x509 -in <file>.crt -text -noout


### berlin-gateway.crt
CN: aiNMfyNlIEx+IA==  
base64 decode → XOR (key = 13)  
decoded to: y0_l0v3_m3


### moscow-cache.crt
Serial:
64:79:4d:67:59:45:78:6e:49:33:67:3d  

hex → ASCII → base64 decode → XOR (key = 13)  
decoded to: d03s_t0k


### archive-robbery.crt
Custom OID:
FllcLB4xYzQUUSwYVQRsNA==  

* base64 decode  
* XOR with: d03s_t0ky0_l0v3_m3  

gives: rio_AES_master_k  


### vault-access.crt (final part)
SAN field:
AAhXSjxHAlIcCW1YCU5Sbl0HUAEEQT4VUl9JCT4IAUYAZgsLV1YDEj4WBApPCToNVBNXPAkEVQcBEDlEUVtJUToNU05VPFwEUwJSSztAVFNNBmtdBUACPFgKVgdVEG9M  

Process:
1. base64 decode  
2. XOR (d03s_t0ky0_l0v3_m3)  
3. AES decrypt (key = rio_AES_master_k, IV = 00000000000000)  

flag:
HTB{00_ri0_kn0ws_h0w_t0_hid3_s7uff}


## Hints

### professor-terminal.crt
OU:
legacy systems still rely on simple transformations  

→ tells you to try base64 / XOR first  


### mastermind-root.crt
contains base64 string →  
"The Professor always starts with the obvious move."  

→ reinforces base64 first  


### intel.log
- baker’s dozen → XOR key = 13  
- The sequence matters → order of decoding is important  
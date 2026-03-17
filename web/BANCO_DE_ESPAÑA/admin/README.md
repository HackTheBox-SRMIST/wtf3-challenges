# BANCO DE ESPAÑA

**Author:** Heisenberg

> The Professor was using a notes app to coordinate the heist. Intelligence found the backend to be open & he left a backdoor in the authentication system. Can you break in and find where the gold is hidden? 

> > User forges an admin JWT by exploiting algorithm confusion — the server accepts HS256 tokens signed with the public key as the secret because it trusts the alg field from the token header instead of enforcing RS256.

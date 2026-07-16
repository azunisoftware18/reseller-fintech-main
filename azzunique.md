🔁 OVERALL FLOW (END-TO-END)
AZZUNIQUE
↓
RESELLER
↓
WHITELABEL
↓
USER

Tumhara system upar se neeche control aur neeche se upar commission pe chalta hai.

🧠 FLOW-1: AZZUNIQUE SETUP FLOW (ONE TIME / ADMIN FLOW)
Step 1️⃣ — AZZUNIQUE service define karta hai

“Platform pe kaunsi service hogi?”

Platform Service: DMT

✔ Sirf AZZUNIQUE
✔ Global definition

Step 2️⃣ — AZZUNIQUE service ke features define karta hai

“Is service me kya-kya allowed hai?”

DMT → IMPS, NEFT

✔ Sirf AZZUNIQUE
✔ Feature = capability

Step 3️⃣ — AZZUNIQUE provider register karta hai

“Is service ko kaunsi company handle karegi?”

Provider: PAYTM
Handler: paytm.dmt.handler

✔ Sirf AZZUNIQUE
✔ Abhi secrets nahi

Step 4️⃣ — AZZUNIQUE provider ko service ke saath map karta hai

“PAYTM DMT ke IMPS feature ko support karega”

✔ Capability mapping
✔ Ab system jaanta hai:

“Kaun kya handle karega”

Step 5️⃣ — AZZUNIQUE provider ka actual config deta hai

“Vendor API key, secret, env kya hoga”

merchantId
secret
env

✔ Sirf AZZUNIQUE
❌ Tenant ka koi role nahi

👉 Yahin pe API ownership lock hoti hai

🧠 FLOW-2: SERVICE DISTRIBUTION FLOW (CONTROL FLOW)
Step 6️⃣ — AZZUNIQUE reseller ko service enable karta hai

“Tum DMT use kar sakte ho”

AZZUNIQUE → RESELLER

✔ Agar AZZUNIQUE disable kare → sab niche band

Step 7️⃣ — RESELLER whitelabel ko service deta hai

“Jo service mujhe mili, wahi main aage de sakta hoon”

RESELLER → WHITELABEL

❌ Agar reseller ke paas DMT nahi → whitelabel ko nahi milegi

Step 8️⃣ — WHITELABEL apne users ke liye decide karta hai

“Mera kaunsa user DMT use karega”

WHITELABEL → USERS

✔ User-level permission
✔ Business rule

🧠 FLOW-3: RUNTIME TRANSACTION FLOW (MOST IMPORTANT)
Jab USER DMT karta hai 👇
USER clicks "Send Money"

System ye sequence follow karta hai:

Step 1️⃣ — User ka tenant kaun?
User → WHITELABEL

Step 2️⃣ — WHITELABEL ke paas DMT enabled hai?

❌ Nahi → STOP
✅ Haan → next

Step 3️⃣ — RESELLER ke paas DMT enabled hai?

❌ Nahi → STOP
✅ Haan → next

Step 4️⃣ — Platform pe DMT active hai?

❌ Nahi → STOP
✅ Haan → next

Step 5️⃣ — Is service ka provider active hai?

❌ Nahi → STOP
✅ Haan → next

Step 6️⃣ — Provider ka config load hota hai
merchantId
secret
env

👉 Ye AZZUNIQUE ka config hota hai
👉 Tenant ko kabhi dikhta hi nahi

Step 7️⃣ — Provider handler call hota hai
paytm.dmt.handler.execute()

Step 8️⃣ — Vendor response aata hai
SUCCESS / FAILED

💰 FLOW-4: COMMISSION FLOW (BOTTOM → TOP)

User ne transaction ki 👇

User pays

Commission distribution:

USER
↓
WHITELABEL margin
↓
RESELLER margin
↓
AZZUNIQUE margin
↓
Vendor cost

✔ Automatic
✔ Hierarchy-safe
✔ No leakage

🔒 IMPORTANT SECURITY FLOW

❌ WHITELABEL provider change nahi kar sakta

❌ RESELLER secret nahi de sakta

❌ Tenant API replace nahi kar sakta

✅ AZZUNIQUE full control me

🧠 ONE-LINE SUMMARY (YAAD RAKHO)

AZZUNIQUE system banata hai,
services neeche distribute hoti hain,
transactions upar control hoti hain,
aur commissions neeche se upar jaati hain.

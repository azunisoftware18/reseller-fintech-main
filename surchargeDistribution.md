# Surcharge & GST (Whitelabel Collects All Downstream GST)

## Structure:

```
Provider → Azzunique → Reseller → Whitelabel (upstream)
Whitelabel collects GST on:
  State Head
  Master Distributor
  Distributor
  Retailer
Whitelabel's own surcharge GST also collected by Whitelabel

```

---

## Step 0: Provider (Base)

```
Provider Surcharge = ₹2.00
GST @18% on Provider Surcharge = ₹0.36
Total = ₹2.36 (paid by Azzunique to Provider)

```

---

## Step 1: Azzunique → Provider (Outgoing Surcharge)

```
Provider Surcharge = ₹2.00
GST Rate = 18% (charged by Provider)
GST Amount = (₹2.00 × 18%) = ₹0.36
Total Payable to Provider = ₹2.36
```

### Azzunique → Reseller (Incoming from Reseller)

```
Provider Surcharge = ₹2.00
GST on Provider = ₹0.36
Azzunique Surcharge = ₹2.00
GST on Azzunique = ₹0.36
Total Received from Reseller = ₹4.72
```

### Azzunique GST Liability & Earnings

```
GST Collected on Azzunique Surcharge = ₹0.36
Total Received = ₹4.72
Less: Paid to Provider = ₹2.36
Less: GST Payable (on Azzunique surcharge) = ₹0.36

Net Azzunique Earning = ₹2.00
```

---

## Step 2: Reseller → Azzunique (Incoming Surcharge)

```
Provider Surcharge = ₹2.00
GST on Provider = ₹0.36

Azzunique Surcharge = ₹2.00
GST on Azzunique = ₹0.36

Total Paid to Azzunique = ₹4.72
```

### Reseller → Whitelabel (Incoming from Whitelabel)

```
Provider Surcharge = ₹2.00
GST on Provider = ₹0.36

Azzunique Surcharge = ₹2.00
GST on Azzunique = ₹0.36

Reseller Surcharge = ₹2.00
GST on Reseller = ₹0.36

Total Received from Whitelabel = ₹7.08
```

### Reseller GST Liability & Earnings

```
GST Collected on Reseller Surcharge = ₹0.36
Total Received = ₹7.08
Less: Paid to Azzunique = ₹4.72
Less: GST Payable (on Reseller surcharge) = ₹0.36

Net Reseller Earning = ₹2.00
```

---

## Step 3: Whitelabel Level — COLLECTS ALL DOWNSTREAM GST

### Whitelabel → Reseller (Outgoing)

```
Provider Surcharge = ₹2.00
GST on Provider = ₹0.36

Azzunique Surcharge = ₹2.00
GST on Azzunique = ₹0.36

Reseller Surcharge = ₹2.00
GST on Reseller = ₹0.36

Total Paid to Reseller = ₹7.08
```

### Whitelabel → State Head (Incoming from State Head)

```
Provider Surcharge = ₹2.00
Azzunique Surcharge = ₹2.00
Reseller Surcharge = ₹2.00
Whitelabel Surcharge = ₹2.00

GST on Provider (collected by Whitelabel) = ₹0.36
GST on Azzunique (collected by Whitelabel) = ₹0.36
GST on Reseller (collected by Whitelabel) = ₹0.36
GST on Whitelabel (collected by Whitelabel) = ₹0.36

Total Received from State Head = ₹9.44
```

### Whitelabel → Master Distributor (Incoming from Master Distributor)

```
Provider Surcharge = ₹2.00
Azzunique Surcharge = ₹2.00
Reseller Surcharge = ₹2.00
Whitelabel Surcharge = ₹2.00
State Head Surcharge = ₹2.00

GST on Provider (collected by Whitelabel) = ₹0.36
GST on Azzunique (collected by Whitelabel) = ₹0.36
GST on Reseller (collected by Whitelabel) = ₹0.36
GST on Whitelabel (collected by Whitelabel) = ₹0.36
GST on State Head (collected by Whitelabel) = ₹0.36

Total Received from Master Distributor = ₹11.80
```

### Whitelabel → Distributor (Incoming from Distributor)

```
Provider Surcharge = ₹2.00
Azzunique Surcharge = ₹2.00
Reseller Surcharge = ₹2.00
Whitelabel Surcharge = ₹2.00
State Head Surcharge = ₹2.00
Master Distributor Surcharge = ₹2.00

GST on Provider (collected by Whitelabel) = ₹0.36
GST on Azzunique (collected by Whitelabel) = ₹0.36
GST on Reseller (collected by Whitelabel) = ₹0.36
GST on Whitelabel (collected by Whitelabel) = ₹0.36
GST on State Head (collected by Whitelabel) = ₹0.36
GST on Master Distributor (collected by Whitelabel) = ₹0.36

Total Received from Distributor = ₹14.16
```

### Whitelabel → Retailer (Incoming from Retailer)

```
Provider Surcharge = ₹2.00
Azzunique Surcharge = ₹2.00
Reseller Surcharge = ₹2.00
Whitelabel Surcharge = ₹2.00
State Head Surcharge = ₹2.00
Master Distributor Surcharge = ₹2.00
Distributor Surcharge = ₹2.00

GST on Provider (collected by Whitelabel) = ₹0.36
GST on Azzunique (collected by Whitelabel) = ₹0.36
GST on Reseller (collected by Whitelabel) = ₹0.36
GST on Whitelabel (collected by Whitelabel) = ₹0.36
GST on State Head (collected by Whitelabel) = ₹0.36
GST on Master Distributor (collected by Whitelabel) = ₹0.36
GST on Distributor (collected by Whitelabel) = ₹0.36

Total Received from Retailer = ₹16.52
```

### Whitelabel GST Liability & Earnings

```
Total GST Collected from all downstream levels:

From State Head = ₹0.36 (on Whitelabel) + ₹0.36 (on Provider) + ₹0.36 (on Azzunique) + ₹0.36 (on Reseller) = ₹1.44
From Master Distributor = Additional ₹0.36 (on State Head) = ₹0.36
From Distributor = Additional ₹0.36 (on Master Distributor) = ₹0.36
From Retailer = Additional ₹0.36 (on Distributor) = ₹0.36

Total GST Collected = ₹2.52
Total Received from all downstream = ₹16.52
Less: Paid to Reseller = ₹7.08
Less: GST Payable to Government (on all collected GST) = ₹2.52
Less: Whitelabel's own surcharge base passed = Already included

Net Whitelabel Earning = ₹2.00 (surcharge profit)
```

---

## Step 4: State Head Level — NO GST COLLECTION (Whitelabel collects)

### State Head → Whitelabel (Outgoing)

```
Provider Surcharge = ₹2.00
Azzunique Surcharge = ₹2.00
Reseller Surcharge = ₹2.00
Whitelabel Surcharge = ₹2.00

Total Paid to Whitelabel = ₹8.00 (no GST — Whitelabel collects)
```

### State Head → Master Distributor (Incoming from Master Distributor)

```
Provider Surcharge = ₹2.00
Azzunique Surcharge = ₹2.00
Reseller Surcharge = ₹2.00
Whitelabel Surcharge = ₹2.00
State Head Surcharge = ₹2.00

Total Received from Master Distributor = ₹10.00 (no GST — Whitelabel collects)
```

### State Head Earnings

```
Total Received = ₹10.00
Less: Paid to Whitelabel = ₹8.00
Net State Head Earning = ₹2.00
```

---

## Step 5: Master Distributor Level — NO GST COLLECTION (Whitelabel collects)

### Master Distributor → State Head (Outgoing)

```
Provider Surcharge = ₹2.00
Azzunique Surcharge = ₹2.00
Reseller Surcharge = ₹2.00
Whitelabel Surcharge = ₹2.00
State Head Surcharge = ₹2.00

Total Paid to State Head = ₹10.00
```

### Master Distributor → Distributor (Incoming from Distributor)

```
Provider Surcharge = ₹2.00
Azzunique Surcharge = ₹2.00
Reseller Surcharge = ₹2.00
Whitelabel Surcharge = ₹2.00
State Head Surcharge = ₹2.00
Master Distributor Surcharge = ₹2.00

Total Received from Distributor = ₹12.00
```

### Master Distributor Earnings

```
Total Received = ₹12.00
Less: Paid to State Head = ₹10.00
Net Master Distributor Earning = ₹2.00
```

---

## Step 6: Distributor Level — NO GST COLLECTION (Whitelabel collects)

### Distributor → Master Distributor (Outgoing)

```
Provider Surcharge = ₹2.00
Azzunique Surcharge = ₹2.00
Reseller Surcharge = ₹2.00
Whitelabel Surcharge = ₹2.00
State Head Surcharge = ₹2.00
Master Distributor Surcharge = ₹2.00

Total Paid to Master Distributor = ₹12.00
```

### Distributor → Retailer (Incoming from Retailer)

```
Provider Surcharge = ₹2.00
Azzunique Surcharge = ₹2.00
Reseller Surcharge = ₹2.00
Whitelabel Surcharge = ₹2.00
State Head Surcharge = ₹2.00
Master Distributor Surcharge = ₹2.00
Distributor Surcharge = ₹2.00

Total Received from Retailer = ₹14.00
```

### Distributor Earnings

```
Total Received = ₹14.00
Less: Paid to Master Distributor = ₹12.00
Net Distributor Earning = ₹2.00
```

---

## Step 7: Retailer Level — NO GST COLLECTION (Whitelabel collects)

### Retailer → Distributor (Outgoing)

```
Provider Surcharge = ₹2.00
Azzunique Surcharge = ₹2.00
Reseller Surcharge = ₹2.00
Whitelabel Surcharge = ₹2.00
State Head Surcharge = ₹2.00
Master Distributor Surcharge = ₹2.00
Distributor Surcharge = ₹2.00

Total Paid to Distributor = ₹14.00
```

---

---

## Final: GST Collection Summary

```

| Level              | GST Collected                                      | GST Paid to Government |
| ------------------ | -------------------------------------------------- | ---------------------- |
| Provider           | ₹0.36 (from Azzunique)                             | ₹0.36                  |
| Azzunique          | ₹0.36 (from Reseller)                              | ₹0.36                  |
| Reseller           | ₹0.36 (from Whitelabel)                            | ₹0.36                  |
| Whitelabel         | ₹2.52 (from State Head, MD, Distributor, Retailer) | ₹2.52                  |
| State Head         | ₹0                                                 | ₹0                     |
| Master Distributor | ₹0                                                 | ₹0                     |
| Distributor        | ₹0                                                 | ₹0                     |
| Retailer           | ₹0                                                 | ₹0                     |

**Total GST Collected = ₹3.96**
**Total GST Paid to Government = ₹3.96**
```

### ✅ Ab Whitelabel collects GST on all downstream surcharges

```

- State Head, Master Distributor, Distributor, Retailer — in sab ka GST **Whitelabel collect karega**
- Upstream levels (Provider, Azzunique, Reseller) — apna GST khud collect karte hain
- Har level ko **₹2 surcharge profit** milta hai
- GST ka total match ho raha hai
```

```
💰 Earnings Summary (Per Transaction)
Level Role Surcharge Profit (₹) GST Collected (₹) GST Paid to Govt (₹) Net Earnings (₹)
1 Provider 2.00 0.36 0.36 2.00
2 Azzunique 2.00 0.36 0.36 2.00
3 Reseller 2.00 0.36 0.36 2.00
4 Whitelabel 2.00 2.52 2.52 2.00
5 State Head 2.00 0.00 0.00 2.00
6 Master Distributor 2.00 0.00 0.00 2.00
7 Distributor 2.00 0.00 0.00 2.00
8 Retailer (Pays to upstream) 0.00 0.00 0.00
```

---

provider surcharge lega Azzunique se = 1 + 18% gst

Azzunique ne Reseller per surcharge set kiya Reseller pay krega Azzunique ko = 2 + 18% gst
Azzunique ko mila from resler = 2.36
Azzunique pay krega provider ko = 1.18
Azzunique ko margin mila = 1
Azzunique ko gst mila = 0.18

Reseller ne Whitelabel per surcharge set kiya Whitelabel pay krega Reseller ko = 3 + 18% gst
Reseller ko mila from Whitelabel = 3.54
Reseller pay krega Azzunique ko = 2.36
Reseller ko margin mila = 1 - 2% tds cut ke = 0.98
Azzunique ko tds mila = 1 % 2 = 0.02
Reseller ko gst mila = 0.18

Whitelabel ne State Head per surcharge set kiya State Head pay krega Whitelabel ko = 4 + 18% gst
Whitelabel ko mila from State Head = 4.72
Whitelabel pay krega Reseller ko = 3.54
Whitelabel ko margin mila = 1 - 2% tds cut ke = 0.98
Reseller ko tds mila = 1 % 2 = 0.02
Whitelabel ko gst mila = 0.18

Whitelabel ne Master Distributor per surcharge set kiya Master Distributor pay krega Whitelabel ko = 5 + 18% gst
State Head ko mila from Master Distributor = 5.9
State Head pay krega Whitelabel ko = 4.72
State head ko margin mila = 1 - 2% tds cut ke = 0.98
Whitelabel ko tds mila = 1 % 2 = 0.02
Whitelabel ko gst mila = 0.18

Whitelabel ne Distributor per surcharge set kiya Distributor pay krega Whitelabel ko = 6 + 18% gst
Master Distributor ko mila from Distributor = 7.08
Master Distributor pay krega Whitelabel ko = 5.9
Master Distributor ko margin mila = 1 - 2% tds cut ke = 0.98
Whitelabel ko tds mila = 1 % 2 = 0.02
Whitelabel ko gst mila = 0.18

Whitelabel ne Retailer per surcharge set kiya Retailer pay krega Whitelabel ko = 7 + 18% gst
Distributor ko mila from Retailer = 8.26
Distributor pay krega Whitelabel ko = 7.08
Distributor ko margin mila = 1 - 2% tds cut ke = 0.98
Whitelabel ko tds mila = 1 % 2 = 0.02
Whitelabel ko gst mila = 0.18

Note: gst 3 time cut hoga

1. : Ek to jab in 4 (State head, Master Distributor, Distributor, Retailer) me see koi bhi api use krega tab sab ka gst nahi ktega sirf use krene wale ka ktega

2. : Second in 4 (State head, Master Distributor, Distributor, Retailer) me see koi bhi api use krega tab her bar Whitelabel ka gst cutega her bar

3. : Third in 4 (State head, Master Distributor, Distributor, Retailer) me see koi bhi api use krega tab her bar Reseller ka gst cutega her bar

Note: Tds her margin per cutega sab ka jesa ki upper example diya hai

| Level           | Surcharge | Margin | TDS (2%) → Parent   | GST (18%) → Receiver    |
| --------------- | --------- | ------ | ------------------- | ----------------------- |
| **Retailer**    | ₹7        | ₹1     | ₹0.02 → White Label | ₹1.26 → **White Label** |
| **Distributor** | ₹6        | ₹1     | ₹0.02 → White Label | ₹1.08 → **White Label** |
| **Master Dist** | ₹5        | ₹1     | ₹0.02 → White Label  | ₹0.90 → **White Label** |
| **State Head**  | ₹4        | ₹1     | ₹0.02 → White Label | ₹0.72 → **White Label** |
| **White Label** | ₹3        | ₹1     | ₹0.02 → Reseller    | ₹0.54 → **Reseller**    |
| **Reseller**    | ₹2        | ₹1     | ₹0.02 → Azzunique   | ₹0.36 → **Azzunique**   |
| **Azzunique**   | ₹1        | ₹1     | ₹0.02 → Platform    | ₹0.18 → **Azzunique**   |

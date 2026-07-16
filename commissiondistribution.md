# Commission & TDS Calculation (Corrected — Accounting Safe)

## Step 0: Provider → Azzunique (Incoming Commission)

```
- Commission = ₹3
- TDS Rate = 2%  → Collected by Provider
- TDS Amount = (₹3 × 2) / 100 = ₹0.06
```

### Net Amount (After TDS)

```
- Net Received = ₹3 - ₹0.06 = ₹2.94
- Final Amount Received by Azzunique = ₹2.94
```

---

## Step 1: Azzunique → Reseller (Outgoing Commission)

```
- Commission = ₹1.94
- TDS Rate = 2% → Collected by Azzunique
- TDS Amount = (₹1.94 × 2) / 100 = ₹0.0388
```

## Margin Calculation (Azzunique)

```
- Net Paid = Commission (₹1.94) – TDS (₹0.0388) = ₹1.9012
- Total Paid to Reseller (after TDS) = ₹1.9012

- Total Received from Provider = ₹2.94
- Margin (Actual Profit) = ₹2.94 – ₹1.94 = ₹1

- TDS Collected (Liability) = ₹0.0388
```

---

## Step 2: Reseller → Whitelabel

```
- Commission = ₹1.50
- TDS Rate = 2% → Collected by Reseller
- TDS Amount = (₹1.50 × 2) / 100 = ₹0.03
```

## Margin Calculation (Reseller)

```
- Net Paid = ₹1.50 – ₹0.03 = ₹1.47
- Total Paid to Whitelabel = ₹1.47

- Total Received from Azzunique = ₹1.9012
- Margin (Actual Profit) = ₹1.9012 – ₹1.50 = ₹0.4012

- TDS Collected (Liability) = ₹0.03
```

---

## Margin Calculation (Whitelabel) — TDS of all lower levels collected here

## Step 3: Whitelabel → State Head

```
- Commission = ₹0.48
- TDS = ₹0.0096
- Net Paid = ₹0.4704

- State Head Margin = ₹0.4704
```

---

## Step 4: Whitelabel → Master Distributor

```
- Commission = ₹0.36
- TDS = ₹0.0072
- Net Paid = ₹0.3528

- Master Distributor Margin = ₹0.3528
```

---

## Step 5: Whitelabel → Distributor

```
- Commission = ₹0.24
- TDS = ₹0.0048
- Net Paid = ₹0.2352

- Distributor Margin = ₹0.2352
```

---

## Step 6: Whitelabel → Retailer

```
- Commission = ₹0.096
- TDS = ₹0.00192
- Net Paid = ₹0.09408

- Retailer Margin = ₹0.09408
```

---

## Margin Calculation (Whitelabel)

```
- Total Received from Reseller = ₹1.47

- Total Commission Paid:
    State Head = ₹0.48
    Master Distributor = ₹0.36
    Distributor = ₹0.24
    Retailer = ₹0.096

- Total Commission = ₹1.176

- Margin (Actual Profit) = ₹1.47 – ₹1.176 = ₹0.294

- Total TDS Collected (Liability):
    State Head = ₹0.0096
    Master Distributor = ₹0.0072
    Distributor = ₹0.0048
    Retailer = ₹0.00192

- Total TDS = ₹0.02352
```

---

## Final: Margin Summary (Corrected)

```
- Azzunique Margin = ₹1
- Reseller Margin = ₹0.4012
- Whitelabel Margin = ₹0.294

- State Head Margin = ₹0.4704
- Master Distributor Margin = ₹0.3528
- Distributor Margin = ₹0.2352
- Retailer Margin = ₹0.09408
```

---

## System Note (IMPORTANT)

```
- TDS is NOT income
- Treat TDS as payable (liability ledger)
- Only "Margin" is real profit

- Total Flow Check:
    Total Provider Commission = ₹3
    Total Distributed + Margins + TDS ≈ ₹3 (minor rounding diff possible)
```

---

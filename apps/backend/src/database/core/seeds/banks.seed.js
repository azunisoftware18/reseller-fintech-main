import { db } from "../core-db.js";
import { banksTable } from "../../../models/core/index.js";

const BANK_CODES = [
  "SBIN",
  "HDFC",
  "ICIC",
  "UTIB",
  "PUNB",
  "BARB",
  "CNRB",
  "UBIN",
  "IDIB",
  "BKID",
  "CBIN",
  "UCBA",
  "PSIB",
  "IOBA",
  "IBKL",
  "KKBK",
  "INDB",
  "YESB",
  "FDRL",
  "SIBL",
  "AUBL",
  "IDFB",
];

export async function seedBanks() {
  console.log("🏦 Starting Bank Seed...");

  let bankId = 1;

  for (const code of BANK_CODES) {
    try {
      // Default / head-office IFSC
      const res = await fetch(`https://ifsc.razorpay.com/${code}0000001`);

      if (!res.ok) {
        console.log(`⚠️ ${code} not found`);
        continue;
      }

      const bank = await res.json();

      await db
        .insert(banksTable)
        .values({
          bankId: bankId++,
          name: bank.BANK,
          ifscAlias: bank.BANKCODE,
          ifscGlobal: bank.IFSC,

          rtgsEnabled: bank.RTGS ?? true,
          rtgsFailureRate: "0",

          neftEnabled: bank.NEFT ?? true,
          neftFailureRate: "0",

          impsEnabled: bank.IMPS ?? true,
          impsFailureRate: "0",

          upiEnabled: bank.UPI ?? true,
          upiFailureRate: "0",

          visaDirectCredit: "ACTIVE",
          visaDirectDebit: "ACTIVE",

          mastercardSendCredit: "ACTIVE",
          mastercardSendDebit: "ACTIVE",

          creditCardUpi: true,
          creditCardImps: true,
          creditCardNeft: true,

          isActive: true,
        })
        .onDuplicateKeyUpdate({
          set: {
            name: bank.BANK,
            ifscAlias: bank.BANKCODE,
            ifscGlobal: bank.IFSC,
            updatedAt: new Date(),
          },
        });

      console.log(`✅ ${bank.BANK}`);
    } catch (err) {
      console.log(`❌ Failed for ${code}`, err.message);
    }
  }

  console.log("🎉 Bank seeding completed.");
}
"use client";

import { useState, useMemo } from "react";
import { CheckCircle } from "lucide-react";

export default function PlansAndOffersList({
  offers = [],
  plans = {},
  selectedPlan,
  onSelect,
}) {
  const [search, setSearch] = useState("");

  const isArrayPlans = Array.isArray(plans);

  const hasOffers = offers?.length > 0;
  const hasPlans = isArrayPlans
    ? plans.length > 0
    : plans && Object.keys(plans).length > 0;

  // 🔍 SEARCH FILTER
  const filterPlans = (planList) => {
    if (!search) return planList;

    const query = search.toLowerCase();

    return planList.filter((plan) => {
      const normalized = normalizePlan(plan);

      return (
        String(normalized.amount).includes(query) ||
        normalized.desc?.toLowerCase().includes(query) ||
        normalized.validity?.toLowerCase().includes(query)
      );
    });
  };

  if (!hasOffers && !hasPlans) {
    return (
      <div className="text-sm text-muted-foreground text-center py-6">
        No plans available for selected operator & circle.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ================= SEARCH FIELD ================= */}
      <div>
        <input
          type="text"
          placeholder="Search plans (₹, data, validity...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* ================= OFFERS ================= */}
      {hasOffers && (
        <SectionWrapper title="Special Offers">
          {filterPlans(offers).map((offer, i) => {
            const normalized = normalizePlan(offer);

            return (
              <PlanCard
                key={`offer-${i}`}
                plan={normalized}
                selected={selectedPlan?.amount === normalized.amount}
                onClick={() => onSelect(normalized)}
                highlight
              />
            );
          })}
        </SectionWrapper>
      )}

      {/* ================= ARRAY PLANS ================= */}
      {isArrayPlans && (
        <SectionWrapper title="All Plans">
          {filterPlans(plans).map((plan, i) => {
            const normalized = normalizePlan(plan);

            return (
              <PlanCard
                key={i}
                plan={normalized}
                selected={selectedPlan?.amount === normalized.amount}
                onClick={() => onSelect(normalized)}
              />
            );
          })}
        </SectionWrapper>
      )}

      {/* ================= GROUPED PLANS ================= */}
      {!isArrayPlans &&
        Object.entries(plans).map(([category, planList]) => {
          if (!Array.isArray(planList)) return null;

          const filtered = filterPlans(planList);

          if (filtered.length === 0) return null; // hide empty category

          return (
            <SectionWrapper key={category} title={category}>
              {filtered.map((plan, i) => {
                const normalized = normalizePlan(plan);

                return (
                  <PlanCard
                    key={`${category}-${i}`}
                    plan={normalized}
                    selected={selectedPlan?.amount === normalized.amount}
                    onClick={() => onSelect(normalized)}
                  />
                );
              })}
            </SectionWrapper>
          );
        })}
    </div>
  );
}

////////////////////////////////////////////////////////////////////////////////
// 🔧 NORMALIZE PLAN
////////////////////////////////////////////////////////////////////////////////

function normalizePlan(plan) {
  return {
    ...plan,
    rs: plan.rs ?? plan.amount,
    amount: plan.amount ?? plan.rs,
    desc: plan.desc ?? plan.description,
    validity: plan.validity,
  };
}

////////////////////////////////////////////////////////////////////////////////
// SECTION WRAPPER
////////////////////////////////////////////////////////////////////////////////

function SectionWrapper({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

////////////////////////////////////////////////////////////////////////////////
// PLAN CARD
////////////////////////////////////////////////////////////////////////////////

function PlanCard({ plan, selected, onClick, highlight = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : highlight
            ? "border-warning/40 bg-warning/5 hover:shadow-sm"
            : "border-border hover:border-primary/40 hover:shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="text-lg font-bold text-primary">₹{plan.rs}</div>

          {plan.validity && (
            <div className="text-xs text-muted-foreground mt-1">
              Validity: {plan.validity}
            </div>
          )}
        </div>

        {selected && <CheckCircle size={18} className="text-primary mt-1" />}
      </div>

      <div className="text-sm mt-3 leading-relaxed text-muted-foreground whitespace-pre-line">
        {plan.desc}
      </div>
    </button>
  );
}

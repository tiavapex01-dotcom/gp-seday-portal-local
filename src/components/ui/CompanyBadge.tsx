/**
 * @context CompanyBadge.tsx
 * @what    Pill badge displaying a company name with brand colour
 * @purpose Centralise the company→colour mapping used in Sidebar and any future admin tables
 * @depends permissions (COMPANIES constant for type safety)
 * @usedby  Sidebar, anywhere a company label needs a coloured badge
 * @layer   component
 */
const COMPANY_COLORS: Record<string, string> = {
  AVAPEX:   "bg-orange-500 text-white",
  SEDAY:    "bg-blue-700 text-white",
  INNOMACH: "bg-emerald-600 text-white",
};

export default function CompanyBadge({ company }: { company: string }) {
  const cls = COMPANY_COLORS[company] ?? "bg-gray-600 text-white";
  return (
    <span className={`text-xs font-semibold inline-block px-2 py-0.5 rounded-full ${cls}`}>
      {company}
    </span>
  );
}

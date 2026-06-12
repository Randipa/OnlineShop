export type PaymentMethod = "STRIPE" | "PAYHERE";

const LABELS: Record<PaymentMethod, { title: string; description: string }> = {
  STRIPE: {
    title: "Stripe",
    description: "Card payment (Visa, Mastercard, Amex)",
  },
  PAYHERE: {
    title: "PayHere",
    description: "Sri Lankan cards, eZ Cash, mCash, bank transfer",
  },
};

export default function PaymentMethodSelector({
  methods,
  selected,
  onSelect,
}: {
  methods: PaymentMethod[];
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}) {
  if (methods.length === 0) {
    return (
      <p className="text-sm text-red-600">
        No payment methods are configured on the server.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Choose payment method</p>
      <div className="grid gap-3">
        {methods.map((method) => {
          const info = LABELS[method];
          const active = selected === method;
          return (
            <button
              key={method}
              type="button"
              onClick={() => onSelect(method)}
              className={`w-full text-left p-4 rounded-xl border transition ${
                active
                  ? "border-brand bg-brand/5 ring-2 ring-brand/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="font-semibold">{info.title}</p>
              <p className="text-sm text-gray-500 mt-1">{info.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

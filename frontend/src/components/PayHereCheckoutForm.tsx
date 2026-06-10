"use client";

import { useEffect, useRef } from "react";

export default function PayHereCheckoutForm({
  actionUrl,
  fields,
}: {
  actionUrl: string;
  fields: Record<string, string>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, [actionUrl, fields]);

  return (
    <div className="text-center space-y-4">
      <p className="text-sm text-gray-600">Redirecting to PayHere secure checkout...</p>
      <form ref={formRef} method="POST" action={actionUrl} className="hidden">
        {Object.entries(fields).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      </form>
      <div className="animate-pulse text-brand font-medium">Please wait</div>
    </div>
  );
}

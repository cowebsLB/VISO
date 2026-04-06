export type BakerName = "Vicky" | "Sonig";

export type AssignableOrderItem = {
  product_id: string;
  option_id: string | null;
  title_snapshot: string;
};

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function fallbackFromTitle(titleSnapshot: string): BakerName {
  const title = normalize(titleSnapshot);
  const isBriochePlain = title.includes("brioche") && !title.includes("chocolate");
  const isBriocheChocolate = title.includes("brioche") && title.includes("chocolate");
  const isMaamoul = title.includes("maamoul") || title.includes("mamoul") || title.includes("معمول");
  const isArmenianGata = title.includes("armenian gata") || title.includes("غاتا");

  if (isBriochePlain || isBriocheChocolate || isMaamoul || isArmenianGata) {
    return "Vicky";
  }
  return "Sonig";
}

export function assignBakerForOrderItem(item: AssignableOrderItem): BakerName {
  const productId = normalize(item.product_id);
  const optionId = normalize(item.option_id);

  if (productId === "brioche") {
    if (optionId === "plain" || optionId === "chocolate") {
      return "Vicky";
    }
    return "Sonig";
  }

  if (productId.startsWith("maamoul") || productId.startsWith("mamoul")) {
    return "Vicky";
  }

  if (productId === "armenian-gata") {
    return "Vicky";
  }

  return fallbackFromTitle(item.title_snapshot);
}

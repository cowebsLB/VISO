import type { LocaleCode } from "@/lib/locale";

/** Category slug from DB (e.g. cakes, bread) or static seed data. */
export type ProductCategory = string;

export type Localized = Record<LocaleCode, string>;

export type ProductOption = {
  id: string;
  price: number;
  names: Localized;
  descriptions: Localized;
};

export type Product = {
  id: string;
  category: ProductCategory;
  price: number;
  image: string;
  names: Localized;
  descriptions: Localized;
  options: ProductOption[];
};

export const products: Product[] = [
  {
    id: "kaak",
    category: "bread",
    price: 15.0,
    image: "/images/products/plain-kaak.webp",
    names: {
      en: "Kaak",
      ar: "كعك",
      hy: "Քաաք",
    },
    descriptions: {
      en: "Traditional kaak available with multiple fillings.",
      ar: "كعك تقليدي متوفر بعدة حشوات.",
      hy: "Ավանդական քաաք՝ տարբեր միջուկներով։",
    },
    options: [
      {
        id: "salty",
        price: 15.0,
        names: {
          en: "1 KG Salty Kaak",
          ar: "1 كغ كعك مالح",
          hy: "1 կգ աղի քաաք",
        },
        descriptions: {
          en: "Classic salty kaak.",
          ar: "كعك مالح كلاسيكي.",
          hy: "Դասական աղի քաաք։",
        },
      },
      {
        id: "sweet",
        price: 20.0,
        names: {
          en: "1 KG Sweet Kaak",
          ar: "1 كغ كعك حلو",
          hy: "1 կգ քաղցր քաաք",
        },
        descriptions: {
          en: "Sweet kaak version.",
          ar: "نسخة الكعك الحلو.",
          hy: "Քաղցր քաաք տարբերակ։",
        },
      },
      {
        id: "dates",
        price: 22.0,
        names: {
          en: "1 KG Kaak Dates",
          ar: "1 كغ كعك بالتمر",
          hy: "1 կգ քաաք արմավով",
        },
        descriptions: {
          en: "Kaak filled with date paste.",
          ar: "كعك محشو بمعجون التمر.",
          hy: "Արմավի միջուկով քաաք։",
        },
      },
    ],
  },
  {
    id: "maamoul-pistachio",
    category: "cookies",
    price: 22.0,
    image: "/images/products/maamoul-pistachio.webp",
    names: {
      en: "Maamoul",
      ar: "معمول",
      hy: "Մամուլ",
    },
    descriptions: {
      en: "Traditional maamoul with multiple fillings.",
      ar: "معمول تقليدي بعدة حشوات.",
      hy: "Ավանդական մամուլ՝ տարբեր միջուկներով։",
    },
    options: [
      {
        id: "dates",
        price: 22.0,
        names: {
          en: "1 KG Maamoul Dates",
          ar: "1 كغ معمول تمر",
          hy: "1 կգ մամուլ արմավով",
        },
        descriptions: {
          en: "Maamoul with date filling.",
          ar: "معمول بحشوة تمر.",
          hy: "Մամուլ արմավի միջուկով։",
        },
      },
      {
        id: "pistachio",
        price: 26.0,
        names: {
          en: "1 KG Maamoul Pistachio",
          ar: "1 كغ معمول فستق",
          hy: "1 կգ մամուլ պիստակով",
        },
        descriptions: {
          en: "Maamoul with pistachio filling.",
          ar: "معمول بحشوة فستق.",
          hy: "Մամուլ պիստակի միջուկով։",
        },
      },
      {
        id: "walnut",
        price: 24.0,
        names: {
          en: "1 KG Maamoul Walnut",
          ar: "1 كغ معمول جوز",
          hy: "1 կգ մամուլ ընկույզով",
        },
        descriptions: {
          en: "Maamoul with walnut filling.",
          ar: "معمول بحشوة جوز.",
          hy: "Մամուլ ընկույզի միջուկով։",
        },
      },
    ],
  },
  {
    id: "brioche",
    category: "bread",
    price: 22.0,
    image: "/images/products/brioche.webp",
    names: {
      en: "Brioche",
      ar: "بريوش",
      hy: "Բրիոշ",
    },
    descriptions: {
      en: "Soft and rich brioche with flavor options.",
      ar: "بريوش طري وغني مع خيارات نكهة.",
      hy: "Փափուկ և հարուստ բրիոշ՝ տարբերակներով։",
    },
    options: [
      {
        id: "plain",
        price: 22.0,
        names: {
          en: "1 KG Brioche",
          ar: "1 كغ بريوش",
          hy: "1 կգ բրիոշ",
        },
        descriptions: {
          en: "Classic plain brioche.",
          ar: "بريوش سادة كلاسيكي.",
          hy: "Դասական պարզ բրիոշ։",
        },
      },
      {
        id: "raisin",
        price: 24.0,
        names: {
          en: "1 KG Brioche Raisin",
          ar: "1 كغ بريوش زبيب",
          hy: "1 կգ բրիոշ չամիչով",
        },
        descriptions: {
          en: "Brioche with raisins.",
          ar: "بريوش مع الزبيب.",
          hy: "Բրիոշ չամիչով։",
        },
      },
      {
        id: "chocolate",
        price: 28.0,
        names: {
          en: "1 KG Brioche Chocolate",
          ar: "1 كغ بريوش شوكولا",
          hy: "1 կգ շոկոլադե բրիոշ",
        },
        descriptions: {
          en: "Brioche with chocolate filling.",
          ar: "بريوش بحشوة شوكولا.",
          hy: "Բրիոշ շոկոլադե միջուկով։",
        },
      },
    ],
  },
  {
    id: "armenian-gata",
    category: "cakes",
    price: 30.0,
    image: "/images/products/armenian-gata.webp",
    names: {
      en: "Armenian Gata",
      ar: "غاتا أرمينية",
      hy: "Հայկական գաթա",
    },
    descriptions: {
      en: "Traditional Armenian sweet bread with a rich buttery filling.",
      ar: "خبز حلو أرمني تقليدي بحشوة زبدية غنية.",
      hy: "Ավանդական հայկական քաղցր խմորեղեն՝ հարուստ կարագային միջուկով։",
    },
    options: [
      {
        id: "classic",
        price: 30.0,
        names: {
          en: "1 KG Armenian Gata",
          ar: "1 كغ غاتا أرمينية",
          hy: "1 կգ հայկական գաթա",
        },
        descriptions: {
          en: "Classic Armenian gata.",
          ar: "غاتا أرمينية كلاسيكية.",
          hy: "Դասական հայկական գաթա։",
        },
      },
    ],
  },
];

export function productById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function productStartingPrice(product: Product): number {
  if (product.options.length === 0) return product.price;
  return Math.min(...product.options.map((option) => option.price));
}

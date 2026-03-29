import type { LocaleCode } from "@/lib/locale";

export type ProductCategory =
  | "cakes"
  | "cupcakes"
  | "cookies"
  | "bread"
  | "seasonal";

export type Localized = Record<LocaleCode, string>;

export type Product = {
  id: string;
  category: ProductCategory;
  price: number;
  image: string;
  names: Localized;
  descriptions: Localized;
};

export const products: Product[] = [
  {
    id: "sourdough-loaf",
    category: "bread",
    price: 6.5,
    image: "/images/products/bread.svg",
    names: {
      en: "Country sourdough loaf",
      ar: "رغيف خبز مخمر ريفي",
      hy: "Գյուղական սուրճով հաց",
    },
    descriptions: {
      en: "Slow-fermented with a crackly crust—perfect for breakfast.",
      ar: "مخمر ببطء مع قشرة مقرمشة—مثالي للفطور.",
      hy: "Խմորում դանդաղ, խրթին կեղևով՝ հիանալի նախաճաշի համար։",
    },
  },
  {
    id: "chocolate-cake-slice",
    category: "cakes",
    price: 5.0,
    image: "/images/products/cake-chocolate.svg",
    names: {
      en: "Chocolate fudge slice",
      ar: "شريحة كيك شوكولاتة فدج",
      hy: "Շոկոլադե ֆաժ կտոր",
    },
    descriptions: {
      en: "Rich layers with dark cocoa ganache.",
      ar: "طبقات غنية مع غاناش كاكاو داكن.",
      hy: "Համեղ շերտեր մուգ կակաոյի գանաշով։",
    },
  },
  {
    id: "vanilla-cupcakes-6",
    category: "cupcakes",
    price: 18.0,
    image: "/images/products/cupcakes.svg",
    names: {
      en: "Vanilla cupcakes (box of 6)",
      ar: "كاب كيك فانيليا (علبة 6)",
      hy: "Վանիլային կապքեյքներ (6 հատ)",
    },
    descriptions: {
      en: "Fluffy sponge with silky buttercream.",
      ar: "إسفنجة خفيفة مع كريمة زبدة حريرية.",
      hy: "Փափուկ բիսկվիթ և մետաքսային կրեմ։",
    },
  },
  {
    id: "almond-croissant",
    category: "seasonal",
    price: 4.25,
    image: "/images/products/croissant.svg",
    names: {
      en: "Almond croissant",
      ar: "كرواسون لوز",
      hy: "Նուշով կրուասան",
    },
    descriptions: {
      en: "Buttery layers with toasted almond filling.",
      ar: "طبقات زبدية مع حشوة لوز محمص.",
      hy: "Կարագային շերտեր ծոտացված նուշով։",
    },
  },
  {
    id: "lemon-tart",
    category: "cakes",
    price: 4.75,
    image: "/images/products/tart.svg",
    names: {
      en: "Lemon tart",
      ar: "تارت ليمون",
      hy: "Կիտրոնով տարտ",
    },
    descriptions: {
      en: "Zesty curd in a crisp pastry shell.",
      ar: "كريمة ليمون لاذعة في عجينة مقرمشة.",
      hy: "Թարմ կիտրոնի կրեմ խրթին խմորապատյանում։",
    },
  },
  {
    id: "oat-cookies",
    category: "cookies",
    price: 12.0,
    image: "/images/products/cookies.svg",
    names: {
      en: "Oat & raisin cookies (dozen)",
      ar: "بسكويت الشوفان والزبيب (12 قطعة)",
      hy: "Բրնձով և չամիչով թխվածքաբլիթներ (12 հատ)",
    },
    descriptions: {
      en: "Chewy, lightly spiced—great with tea.",
      ar: "مضغي ومتبل قليلاً—رائع مع الشاي.",
      hy: "Թեթև համեմված, փափուկ՝ թեյի հետ հիանալի։",
    },
  },
  {
    id: "fruit-danish",
    category: "seasonal",
    price: 3.75,
    image: "/images/products/danish.svg",
    names: {
      en: "Seasonal fruit Danish",
      ar: "دانيش فواكه موسمية",
      hy: "Սեզոնային մրգային դանիշ",
    },
    descriptions: {
      en: "Pastry cream and fresh fruit on flaky dough.",
      ar: "كريمة معجنات وفواكه طازجة على عجينة رقيقة.",
      hy: "Կրեմ և թարմ մրգեր փխրուն խմորի վրա։",
    },
  },
  {
    id: "carrot-cake-mini",
    category: "cakes",
    price: 22.0,
    image: "/images/products/carrot.svg",
    names: {
      en: "Mini carrot cake (8\")",
      ar: "كيك جزر صغير (8 بوصة)",
      hy: "Փոքր գազարով տորթ (8\" )",
    },
    descriptions: {
      en: "Spiced layers with cream cheese frosting.",
      ar: "طبقات متبلة مع تثليج جبن كريمي.",
      hy: "Կրեմ-չիզ փրոստինգով համեմված շերտեր։",
    },
  },
  {
    id: "sesame-bagel",
    category: "bread",
    price: 2.5,
    image: "/images/products/bagel.svg",
    names: {
      en: "Sesame bagel",
      ar: "بيغل بالسمسم",
      hy: "Սեսամով բեյգլ",
    },
    descriptions: {
      en: "Boiled-then-baked with a golden crust.",
      ar: "مسلوق ثم مخبوز بقشرة ذهبية.",
      hy: "Եփած, հետո թխած՝ ոսկեգույն կեղևով։",
    },
  },
  {
    id: "brownie-box",
    category: "cookies",
    price: 16.0,
    image: "/images/products/brownie.svg",
    names: {
      en: "Fudge brownie box (9 pcs)",
      ar: "علبة براوني فدج (9 قطع)",
      hy: "Ֆաժ բրաունի տուփ (9 հատ)",
    },
    descriptions: {
      en: "Dense, glossy squares—shareable joy.",
      ar: "مربعات كثيفة ولامعة—فرحة للمشاركة.",
      hy: "Խիտ, փայլուն քառակուսիներ՝ կիսելու ուրախությամբ։",
    },
  },
];

export const categoryKeys = [
  "all",
  "cakes",
  "cupcakes",
  "cookies",
  "bread",
  "seasonal",
] as const;

export type CategoryFilter = (typeof categoryKeys)[number];

export function productById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

import { storage } from "./storage";
import { hashPassword } from "./lib/auth";
import { pathToFileURL } from "url";

const products = [
  // Cairo Streetwear Products
  { titleEn: "Black Hoodie", titleAr: "هودي أسود", price: 799, brand: "Cairo Streetwear", colors: ["Black", "Gray"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "unisex", tags: ["hoodie", "casual", "streetwear"] },
  { titleEn: "White T-Shirt", titleAr: "تيشيرت أبيض", price: 299, brand: "Cairo Streetwear", colors: ["White", "Black", "Navy"], sizes: ["S", "M", "L", "XL"], fit: "slim", gender: "male", tags: ["t-shirt", "basic", "cotton"] },
  { titleEn: "Blue Jeans", titleAr: "جينز أزرق", price: 899, brand: "Cairo Streetwear", colors: ["Blue", "Black"], sizes: ["28", "30", "32", "34", "36"], fit: "slim", gender: "male", tags: ["jeans", "denim", "pants"] },
  { titleEn: "Cargo Pants", titleAr: "بنطلون كارغو", price: 999, brand: "Cairo Streetwear", colors: ["Khaki", "Black", "Olive"], sizes: ["S", "M", "L", "XL"], fit: "relaxed", gender: "unisex", tags: ["pants", "cargo", "utility"] },
  { titleEn: "Bomber Jacket", titleAr: "جاكيت بومبر", price: 1499, brand: "Cairo Streetwear", colors: ["Black", "Green"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "male", tags: ["jacket", "bomber", "outerwear"] },
  { titleEn: "Graphic Tee", titleAr: "تيشيرت مطبوع", price: 399, brand: "Cairo Streetwear", colors: ["White", "Black", "Gray"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "unisex", tags: ["t-shirt", "graphic", "print"] },
  { titleEn: "Track Pants", titleAr: "بنطلون رياضي", price: 699, brand: "Cairo Streetwear", colors: ["Black", "Navy", "Gray"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "unisex", tags: ["pants", "athletic", "sports"] },
  { titleEn: "Windbreaker", titleAr: "جاكيت واقي من الرياح", price: 1299, brand: "Cairo Streetwear", colors: ["Black", "Red", "Blue"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "unisex", tags: ["jacket", "windbreaker", "sport"] },
  { titleEn: "Polo Shirt", titleAr: "قميص بولو", price: 499, brand: "Cairo Streetwear", colors: ["White", "Navy", "Black"], sizes: ["S", "M", "L", "XL"], fit: "slim", gender: "male", tags: ["polo", "shirt", "casual"] },
  { titleEn: "Shorts", titleAr: "شورت", price: 599, brand: "Cairo Streetwear", colors: ["Black", "Khaki", "Navy"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "male", tags: ["shorts", "summer", "casual"] },

  // Alexandria Fashion Products
  { titleEn: "Denim Jacket", titleAr: "جاكيت جينز", price: 1399, brand: "Alexandria Fashion", colors: ["Blue", "Black"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "unisex", tags: ["jacket", "denim", "classic"] },
  { titleEn: "Leather Jacket", titleAr: "جاكيت جلد", price: 2499, brand: "Alexandria Fashion", colors: ["Black", "Brown"], sizes: ["S", "M", "L", "XL"], fit: "slim", gender: "unisex", tags: ["jacket", "leather", "premium"] },
  { titleEn: "Chino Pants", titleAr: "بنطلون شينو", price: 799, brand: "Alexandria Fashion", colors: ["Beige", "Navy", "Black"], sizes: ["28", "30", "32", "34", "36"], fit: "slim", gender: "male", tags: ["pants", "chino", "formal"] },
  { titleEn: "Flannel Shirt", titleAr: "قميص فانيلا", price: 699, brand: "Alexandria Fashion", colors: ["Red", "Blue", "Green"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "male", tags: ["shirt", "flannel", "casual"] },
  { titleEn: "Sweater", titleAr: "سويتر", price: 899, brand: "Alexandria Fashion", colors: ["Gray", "Navy", "Black"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "unisex", tags: ["sweater", "knitwear", "warm"] },
  { titleEn: "Dress Shirt", titleAr: "قميص رسمي", price: 799, brand: "Alexandria Fashion", colors: ["White", "Blue", "Black"], sizes: ["S", "M", "L", "XL"], fit: "slim", gender: "male", tags: ["shirt", "formal", "dress"] },
  { titleEn: "Blazer", titleAr: "بليزر", price: 1899, brand: "Alexandria Fashion", colors: ["Black", "Navy", "Gray"], sizes: ["S", "M", "L", "XL"], fit: "slim", gender: "male", tags: ["blazer", "formal", "jacket"] },
  { titleEn: "Cardigan", titleAr: "كارديجان", price: 799, brand: "Alexandria Fashion", colors: ["Gray", "Beige", "Black"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "unisex", tags: ["cardigan", "knitwear", "layering"] },
  { titleEn: "Turtleneck", titleAr: "قميص بياقة عالية", price: 599, brand: "Alexandria Fashion", colors: ["Black", "Gray", "Navy"], sizes: ["S", "M", "L", "XL"], fit: "slim", gender: "unisex", tags: ["shirt", "turtleneck", "winter"] },
  { titleEn: "Suit Pants", titleAr: "بنطلون بدلة", price: 999, brand: "Alexandria Fashion", colors: ["Black", "Navy", "Gray"], sizes: ["28", "30", "32", "34", "36"], fit: "slim", gender: "male", tags: ["pants", "formal", "suit"] },

  // Giza Style Products
  { titleEn: "Varsity Jacket", titleAr: "جاكيت جامعي", price: 1799, brand: "Giza Style", colors: ["Black-White", "Navy-Gray"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "unisex", tags: ["jacket", "varsity", "sporty"] },
  { titleEn: "Sweatshirt", titleAr: "سويت شيرت", price: 699, brand: "Giza Style", colors: ["Gray", "Black", "Navy"], sizes: ["S", "M", "L", "XL"], fit: "oversized", gender: "unisex", tags: ["sweatshirt", "casual", "comfort"] },
  { titleEn: "Joggers", titleAr: "بنطلون جوجرز", price: 799, brand: "Giza Style", colors: ["Black", "Gray", "Navy"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "unisex", tags: ["pants", "joggers", "athletic"] },
  { titleEn: "Puffer Jacket", titleAr: "جاكيت منفوخ", price: 1999, brand: "Giza Style", colors: ["Black", "Navy", "Red"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "unisex", tags: ["jacket", "puffer", "winter"] },
  { titleEn: "Henley Shirt", titleAr: "قميص هينلي", price: 499, brand: "Giza Style", colors: ["White", "Gray", "Navy"], sizes: ["S", "M", "L", "XL"], fit: "slim", gender: "male", tags: ["shirt", "henley", "casual"] },
  { titleEn: "Zip Hoodie", titleAr: "هودي بسحاب", price: 899, brand: "Giza Style", colors: ["Black", "Gray", "Navy"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "unisex", tags: ["hoodie", "zip", "athleisure"] },
  { titleEn: "Tank Top", titleAr: "تانك توب", price: 299, brand: "Giza Style", colors: ["White", "Black", "Gray"], sizes: ["S", "M", "L", "XL"], fit: "slim", gender: "male", tags: ["tank", "summer", "gym"] },
  { titleEn: "Long Sleeve Tee", titleAr: "تيشيرت بأكمام طويلة", price: 399, brand: "Giza Style", colors: ["Black", "White", "Gray"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "unisex", tags: ["t-shirt", "long-sleeve", "basic"] },
  { titleEn: "Crew Neck Sweater", titleAr: "سويتر بياقة دائرية", price: 799, brand: "Giza Style", colors: ["Gray", "Navy", "Burgundy"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "unisex", tags: ["sweater", "crew-neck", "knitwear"] },
  { titleEn: "Training Shorts", titleAr: "شورت تدريب", price: 499, brand: "Giza Style", colors: ["Black", "Gray", "Navy"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "male", tags: ["shorts", "athletic", "training"] },

  // Luxor Boutique Products
  { titleEn: "Silk Scarf", titleAr: "وشاح حرير", price: 599, brand: "Luxor Boutique", colors: ["Burgundy", "Navy", "Green"], sizes: ["One Size"], fit: "regular", gender: "female", tags: ["scarf", "silk", "accessory"] },
  { titleEn: "Maxi Dress", titleAr: "فستان ماكسي", price: 1499, brand: "Luxor Boutique", colors: ["Black", "Navy", "Floral"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "female", tags: ["dress", "maxi", "elegant"] },
  { titleEn: "Blouse", titleAr: "بلوزة", price: 699, brand: "Luxor Boutique", colors: ["White", "Beige", "Pink"], sizes: ["S", "M", "L", "XL"], fit: "slim", gender: "female", tags: ["blouse", "shirt", "formal"] },
  { titleEn: "Pencil Skirt", titleAr: "تنورة ضيقة", price: 799, brand: "Luxor Boutique", colors: ["Black", "Navy", "Gray"], sizes: ["S", "M", "L", "XL"], fit: "slim", gender: "female", tags: ["skirt", "pencil", "formal"] },
  { titleEn: "Trench Coat", titleAr: "معطف ترينش", price: 2299, brand: "Luxor Boutique", colors: ["Beige", "Black"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "female", tags: ["coat", "trench", "outerwear"] },
  { titleEn: "Wide Leg Pants", titleAr: "بنطلون واسع", price: 899, brand: "Luxor Boutique", colors: ["Black", "White", "Navy"], sizes: ["S", "M", "L", "XL"], fit: "relaxed", gender: "female", tags: ["pants", "wide-leg", "casual"] },
  { titleEn: "Wrap Dress", titleAr: "فستان لف", price: 1299, brand: "Luxor Boutique", colors: ["Red", "Navy", "Floral"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "female", tags: ["dress", "wrap", "elegant"] },
  { titleEn: "Cashmere Sweater", titleAr: "سويتر كشمير", price: 1999, brand: "Luxor Boutique", colors: ["Beige", "Gray", "Navy"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "female", tags: ["sweater", "cashmere", "luxury"] },
  { titleEn: "Jumpsuit", titleAr: "جمبسوت", price: 1399, brand: "Luxor Boutique", colors: ["Black", "Navy", "Olive"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "female", tags: ["jumpsuit", "one-piece", "casual"] },
  { titleEn: "Midi Skirt", titleAr: "تنورة ميدي", price: 699, brand: "Luxor Boutique", colors: ["Black", "Floral", "Plaid"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "female", tags: ["skirt", "midi", "versatile"] },

  // Aswan Collection Products
  { titleEn: "Linen Shirt", titleAr: "قميص كتان", price: 899, brand: "Aswan Collection", colors: ["White", "Beige", "Blue"], sizes: ["S", "M", "L", "XL"], fit: "regular", gender: "male", tags: ["shirt", "linen", "summer"] },
  { titleEn: "Panama Hat", titleAr: "قبعة بنما", price: 499, brand: "Aswan Collection", colors: ["Beige", "White"], sizes: ["One Size"], fit: "regular", gender: "unisex", tags: ["hat", "panama", "accessory"] },
  { titleEn: "Leather Sandals", titleAr: "صندل جلد", price: 799, brand: "Aswan Collection", colors: ["Brown", "Black"], sizes: ["40", "41", "42", "43", "44"], fit: "regular", gender: "male", tags: ["sandals", "leather", "footwear"] },
  { titleEn: "Canvas Tote", titleAr: "حقيبة كانفاس", price: 399, brand: "Aswan Collection", colors: ["Beige", "Navy", "Black"], sizes: ["One Size"], fit: "regular", gender: "unisex", tags: ["bag", "tote", "canvas"] },
  { titleEn: "Straw Bag", titleAr: "حقيبة قش", price: 599, brand: "Aswan Collection", colors: ["Natural", "Brown"], sizes: ["One Size"], fit: "regular", gender: "female", tags: ["bag", "straw", "summer"] },
  { titleEn: "Sunglasses", titleAr: "نظارة شمسية", price: 699, brand: "Aswan Collection", colors: ["Black", "Tortoise", "Blue"], sizes: ["One Size"], fit: "regular", gender: "unisex", tags: ["sunglasses", "accessory", "eyewear"] },
  { titleEn: "Beach Cover-Up", titleAr: "غطاء شاطئ", price: 499, brand: "Aswan Collection", colors: ["White", "Beige", "Coral"], sizes: ["S", "M", "L"], fit: "relaxed", gender: "female", tags: ["cover-up", "beach", "summer"] },
  { titleEn: "Espadrilles", titleAr: "حذاء إسبادريل", price: 599, brand: "Aswan Collection", colors: ["Navy", "Beige", "Red"], sizes: ["36", "37", "38", "39", "40"], fit: "regular", gender: "female", tags: ["shoes", "espadrilles", "summer"] },
];

export async function seedDatabase() {
  console.log("🌱 Starting database seed...");

  try {
    // Create owner user
    console.log("Creating owner user...");
    const ownerPassword = await hashPassword("Owner#123");
    const owner = await storage.createUser({
      email: "owner@outfred.com",
      name: "System Owner",
      role: "owner",
      passwordHash: ownerPassword,
    });
    console.log("✅ Owner created:", owner.email);

    // Create demo users
    console.log("Creating demo users...");
    const demoPassword = await hashPassword("Demo#123");
    
    const merchant1Owner = await storage.createUser({
      email: "merchant1@outfred.com",
      name: "Ahmed Hassan",
      role: "merchant",
      passwordHash: demoPassword,
    });

    const merchant2Owner = await storage.createUser({
      email: "merchant2@outfred.com",
      name: "Sara Mohamed",
      role: "merchant",
      passwordHash: demoPassword,
    });

    const regularUser = await storage.createUser({
      email: "user@outfred.com",
      name: "John Doe",
      role: "user",
      passwordHash: demoPassword,
    });

    console.log("✅ Demo users created");

    // Create brands
    console.log("Creating brands...");
    const brandData = [
      { name: "Cairo Streetwear", city: "Cairo" },
      { name: "Alexandria Fashion", city: "Alexandria" },
      { name: "Giza Style", city: "Giza" },
      { name: "Luxor Boutique", city: "Luxor" },
      { name: "Aswan Collection", city: "Aswan" },
    ];

    const brands: any = {};
    for (const brand of brandData) {
      const created = await storage.createBrand(brand);
      brands[brand.name] = created;
      console.log(`✅ Brand created: ${brand.name}`);
    }

    // Create merchants
    console.log("Creating merchants...");
    const merchant1 = await storage.createMerchant({
      ownerUserId: merchant1Owner.id,
      name: "Cairo Fashion Store",
      city: "Cairo",
      status: "active",
      contact: "contact@cairofashion.com",
    });

    const merchant2 = await storage.createMerchant({
      ownerUserId: merchant2Owner.id,
      name: "Alexandria Boutique",
      city: "Alexandria",
      status: "active",
      contact: "contact@alexboutique.com",
    });

    console.log("✅ Merchants created");

    // Create products
    console.log("Creating products...");
    let createdCount = 0;

    for (const prod of products) {
      const brand = brands[prod.brand];
      if (!brand) continue;

      const merchant = createdCount % 2 === 0 ? merchant1 : merchant2;

      await storage.createProduct({
        merchantId: merchant.id,
        brandId: brand.id,
        title: `${prod.titleEn} / ${prod.titleAr}`,
        description: `Premium quality ${prod.titleEn.toLowerCase()} from ${prod.brand}`,
        priceCents: prod.price * 100,
        currency: "EGP",
        colors: prod.colors,
        sizes: prod.sizes,
        fit: prod.fit as any,
        gender: prod.gender as any,
        tags: prod.tags,
        images: ["/placeholder-product.png"],
        published: true,
      });

      createdCount++;
      if (createdCount % 10 === 0) {
        console.log(`Created ${createdCount}/${products.length} products...`);
      }
    }

    console.log(`✅ Created ${createdCount} products`);

    // Initialize system config
    console.log("Initializing system config...");
    await storage.updateSystemConfig({
      embeddingsProvider: "local",
      imageGenerationProvider: "off",
      enableSpellCorrection: true,
      enableOutfitAI: true,
      enableImageSearch: true,
      enableMultilingual: true,
      synonyms: {
        "هودي": "hoodie",
        "جينز": "jeans",
        "تيشيرت": "t-shirt",
        "جاكيت": "jacket",
        "hodie": "hoodie",
        "hoddie": "hoodie",
        "tshirt": "t-shirt",
      },
    });

    console.log("✅ System config initialized");
    console.log("\n🎉 Database seed completed successfully!");
    console.log("\nDefault credentials:");
    console.log("  Owner: owner@outfred.com / Owner#123");
    console.log("  Merchant 1: merchant1@outfred.com / Demo#123");
    console.log("  Merchant 2: merchant2@outfred.com / Demo#123");
    console.log("  User: user@outfred.com / Demo#123");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

// Run if called directly (ESM equivalent of require.main === module)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedDatabase };

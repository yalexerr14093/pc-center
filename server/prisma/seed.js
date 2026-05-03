import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
const products = [
    {
        name: "Intel Core i5-13400F",
        description: "Отличный процессор для игр и работы: 10 ядер (6P+4E), высокий IPC.",
        category: "CPU",
        priceRub: 17990,
        imageUrl: "/uploads/__missing-cpu.png",
        stock: 12,
        specs: { socket: "LGA1700", cores: "10 (6P+4E)", threads: 16, tdpW: 65 }
    },
    {
        name: "AMD Ryzen 5 7600",
        description: "Современная платформа AM5, отличная производительность в играх.",
        category: "CPU",
        priceRub: 19990,
        imageUrl: "/uploads/__missing-cpu.png",
        stock: 9,
        specs: { socket: "AM5", cores: 6, threads: 12, igpu: "RDNA2", tdpW: 65 }
    },
    {
        name: "NVIDIA GeForce RTX 4070 SUPER 12GB",
        description: "1440p ультра, DLSS 3, отличная энергоэффективность.",
        category: "GPU",
        priceRub: 82990,
        imageUrl: "/uploads/__missing-gpu.png",
        stock: 5,
        specs: { vram: "12GB GDDR6X", rayTracing: true, powerW: 220 }
    },
    {
        name: "AMD Radeon RX 7800 XT 16GB",
        description: "Сильная карта для 1440p, 16GB VRAM, хороший запас по памяти.",
        category: "GPU",
        priceRub: 71990,
        imageUrl: "/uploads/__missing-gpu.png",
        stock: 6,
        specs: { vram: "16GB GDDR6", rayTracing: true, powerW: 263 }
    },
    {
        name: "MSI B650 Tomahawk WiFi",
        description: "Надёжная AM5 плата с хорошим VRM и Wi‑Fi.",
        category: "MOTHERBOARD",
        priceRub: 24990,
        imageUrl: "/uploads/__missing-motherboard.png",
        stock: 7,
        specs: { socket: "AM5", chipset: "B650", wifi: true, formFactor: "ATX" }
    },
    {
        name: "ASUS TUF Gaming B760-Plus WiFi",
        description: "LGA1700, B760, стабильность и хороший набор портов.",
        category: "MOTHERBOARD",
        priceRub: 21990,
        imageUrl: "/uploads/__missing-motherboard.png",
        stock: 8,
        specs: { socket: "LGA1700", chipset: "B760", wifi: true, formFactor: "ATX" }
    },
    {
        name: "Kingston Fury Beast DDR5 32GB (2x16) 6000",
        description: "Отличный комплект DDR5 для современных сборок.",
        category: "RAM",
        priceRub: 12490,
        imageUrl: "/uploads/__missing-ram.png",
        stock: 18,
        specs: { type: "DDR5", capacityGb: 32, speedMt: 6000, xmpExpo: true }
    },
    {
        name: "Corsair Vengeance DDR4 16GB (2x8) 3200",
        description: "Проверенная DDR4 память для бюджетных и средних сборок.",
        category: "RAM",
        priceRub: 5490,
        imageUrl: "/uploads/__missing-ram.png",
        stock: 25,
        specs: { type: "DDR4", capacityGb: 16, speedMt: 3200 }
    },
    {
        name: "Samsung 990 PRO 1TB NVMe",
        description: "Топовый NVMe SSD PCIe 4.0 для ОС и игр.",
        category: "SSD",
        priceRub: 12990,
        imageUrl: "/uploads/__missing-ssd.png",
        stock: 14,
        specs: { interface: "NVMe PCIe 4.0", capacityTb: 1, readMb: 7450, writeMb: 6900 }
    },
    {
        name: "WD Blue SN570 1TB NVMe",
        description: "Надёжный SSD для повседневных задач и игр.",
        category: "SSD",
        priceRub: 7490,
        imageUrl: "/uploads/__missing-ssd.png",
        stock: 20,
        specs: { interface: "NVMe PCIe 3.0", capacityTb: 1, readMb: 3500, writeMb: 3000 }
    }
];
async function main() {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.product.createMany({
        data: products.map((p) => ({
            name: p.name,
            description: p.description,
            category: p.category,
            priceRub: p.priceRub,
            imageUrl: p.imageUrl,
            imageUrls: [],
            stock: p.stock,
            specs: p.specs
        }))
    });
    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@pc-center.local";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "adminadmin";
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.upsert({
        where: { email: adminEmail },
        create: {
            email: adminEmail,
            passwordHash,
            name: "Администратор",
            role: UserRole.ADMIN
        },
        update: { role: UserRole.ADMIN, passwordHash }
    });
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});

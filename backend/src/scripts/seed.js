import User from "../models/User.js";
import Agent from "../models/Agent.js";
import Zone from "../models/Zone.js";
import RateCard from "../models/RateCard.js";
import bcrypt from "bcryptjs";

export async function seedData() {
  console.log("Seeding database...");

  await User.deleteMany({});
  await Agent.deleteMany({});
  await Zone.deleteMany({});
  await RateCard.deleteMany({});

  const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || "Admin@123", 10);
  const admin = await User.create({
    name: process.env.SEED_ADMIN_NAME || "Admin",
    email: process.env.SEED_ADMIN_EMAIL || "admin@deliverytracker.com",
    phone: process.env.SEED_ADMIN_PHONE || "9000000000",
    passwordHash: adminPassword,
    role: "ADMIN",
  });
  console.log("Admin created:", admin.email);

  const agentPassword = await bcrypt.hash("Agent@123", 10);
  const agentUser = await User.create({
    name: "Ravi Kumar",
    email: "ravi@deliverytracker.com",
    phone: "9111111111",
    passwordHash: agentPassword,
    role: "AGENT",
  });
  const agent = await Agent.create({
    userId: agentUser._id,
    vehicleType: "BIKE",
    phone: "9111111111",
    status: "AVAILABLE",
    currentLocation: { latitude: 16.3067, longitude: 80.4365 },
  });
  console.log("Agent created:", agentUser.email);

  const customerPassword = await bcrypt.hash("Customer@123", 10);
  const customer = await User.create({
    name: "Karthik",
    email: "karthik@gmail.com",
    phone: "9876543210",
    passwordHash: customerPassword,
    role: "CUSTOMER",
  });
  console.log("Customer created:", customer.email);

  const gunturZone = await Zone.create({
    name: "Guntur Zone",
    code: "GNT",
    areas: ["Guntur", "Tenali", "Mangalagiri"],
    pincodes: ["522001", "522002", "522201", "522202"],
    isActive: true,
  });

  const vijayawadaZone = await Zone.create({
    name: "Vijayawada Zone",
    code: "VJA",
    areas: ["Vijayawada", "Gannavaram", "Benz Circle"],
    pincodes: ["520001", "520002", "520003", "520004"],
    isActive: true,
  });

  agent.currentZoneId = gunturZone._id;
  await agent.save();
  console.log("Zones created: GNT, VJA");

  const rateCards = [
    { orderType: "B2C", rateType: "INTRA_ZONE", minWeight: 0, maxWeight: 5, ratePerKg: 20, baseCharge: 50, codSurcharge: 20, isActive: true },
    { orderType: "B2C", rateType: "INTRA_ZONE", minWeight: 5, maxWeight: 20, ratePerKg: 18, baseCharge: 90, codSurcharge: 20, isActive: true },
    { orderType: "B2C", rateType: "INTER_ZONE", minWeight: 0, maxWeight: 5, ratePerKg: 50, baseCharge: 100, codSurcharge: 30, isActive: true },
    { orderType: "B2C", rateType: "INTER_ZONE", minWeight: 5, maxWeight: 20, ratePerKg: 45, baseCharge: 200, codSurcharge: 30, isActive: true },
    { orderType: "B2B", rateType: "INTRA_ZONE", minWeight: 0, maxWeight: 10, ratePerKg: 15, baseCharge: 80, codSurcharge: 15, isActive: true },
    { orderType: "B2B", rateType: "INTRA_ZONE", minWeight: 10, maxWeight: 50, ratePerKg: 12, baseCharge: 150, codSurcharge: 15, isActive: true },
    { orderType: "B2B", rateType: "INTER_ZONE", minWeight: 0, maxWeight: 10, ratePerKg: 40, baseCharge: 150, codSurcharge: 25, isActive: true },
    { orderType: "B2B", rateType: "INTER_ZONE", minWeight: 10, maxWeight: 50, ratePerKg: 35, baseCharge: 300, codSurcharge: 25, isActive: true },
  ];
  await RateCard.insertMany(rateCards);
  console.log("Rate cards created:", rateCards.length);

  console.log("\nSeed complete. Credentials:");
  console.log("Admin   - admin@deliverytracker.com / Admin@123");
  console.log("Agent   - ravi@deliverytracker.com / Agent@123");
  console.log("Customer- karthik@gmail.com / Customer@123");
}

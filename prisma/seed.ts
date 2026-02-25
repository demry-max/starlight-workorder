import { PrismaClient, Priority, StaffRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

const prisma = new PrismaClient();

function generateWorkOrderNumber(): string {
  return "WO-" + crypto.randomBytes(5).toString("hex").toUpperCase();
}

async function main() {
  console.log("Seeding database...");

  // Seed status configs
  const statusConfigs = [
    {
      key: "DRAFT",
      labelEn: "Draft",
      labelZh: "草稿",
      color: "#6B7280",
      bgColor: "#F3F4F6",
      textColor: "#374151",
      sortOrder: 0,
      defaultProgress: 0,
      isTerminal: false,
      isDefault: true,
    },
    {
      key: "RECEIVED",
      labelEn: "Received",
      labelZh: "已接收",
      color: "#3B82F6",
      bgColor: "#DBEAFE",
      textColor: "#1D4ED8",
      sortOrder: 1,
      defaultProgress: 5,
      isTerminal: false,
      isDefault: false,
    },
    {
      key: "IN_PROGRESS",
      labelEn: "In Progress",
      labelZh: "进行中",
      color: "#F59E0B",
      bgColor: "#FEF3C7",
      textColor: "#92400E",
      sortOrder: 2,
      defaultProgress: 50,
      isTerminal: false,
      isDefault: false,
    },
    {
      key: "WAITING_FOR_CLIENT",
      labelEn: "Waiting for Client",
      labelZh: "等待客户",
      color: "#F97316",
      bgColor: "#FFEDD5",
      textColor: "#9A3412",
      sortOrder: 3,
      defaultProgress: -1,
      isTerminal: false,
      isDefault: false,
    },
    {
      key: "WAITING_FOR_THIRD_PARTY",
      labelEn: "Waiting for Third Party",
      labelZh: "等待第三方",
      color: "#8B5CF6",
      bgColor: "#EDE9FE",
      textColor: "#5B21B6",
      sortOrder: 4,
      defaultProgress: -1,
      isTerminal: false,
      isDefault: false,
    },
    {
      key: "COMPLETED",
      labelEn: "Completed",
      labelZh: "已完成",
      color: "#10B981",
      bgColor: "#D1FAE5",
      textColor: "#065F46",
      sortOrder: 5,
      defaultProgress: 100,
      isTerminal: true,
      isDefault: false,
    },
    {
      key: "CLOSED",
      labelEn: "Closed",
      labelZh: "已关闭",
      color: "#4B5563",
      bgColor: "#E5E7EB",
      textColor: "#1F2937",
      sortOrder: 6,
      defaultProgress: 100,
      isTerminal: true,
      isDefault: false,
    },
    {
      key: "CANCELLED",
      labelEn: "Cancelled",
      labelZh: "已取消",
      color: "#EF4444",
      bgColor: "#FEE2E2",
      textColor: "#991B1B",
      sortOrder: 7,
      defaultProgress: -1,
      isTerminal: true,
      isDefault: false,
    },
  ];

  for (const config of statusConfigs) {
    await prisma.statusConfig.upsert({
      where: { key: config.key },
      update: config,
      create: config,
    });
  }
  console.log("Status configs seeded.");

  // Seed status transitions
  const transitions = [
    { fromStatusKey: "DRAFT", toStatusKey: "RECEIVED" },
    { fromStatusKey: "DRAFT", toStatusKey: "CANCELLED" },
    { fromStatusKey: "RECEIVED", toStatusKey: "IN_PROGRESS" },
    { fromStatusKey: "RECEIVED", toStatusKey: "CANCELLED" },
    { fromStatusKey: "IN_PROGRESS", toStatusKey: "WAITING_FOR_CLIENT" },
    { fromStatusKey: "IN_PROGRESS", toStatusKey: "WAITING_FOR_THIRD_PARTY" },
    { fromStatusKey: "IN_PROGRESS", toStatusKey: "COMPLETED" },
    { fromStatusKey: "IN_PROGRESS", toStatusKey: "CANCELLED" },
    { fromStatusKey: "WAITING_FOR_CLIENT", toStatusKey: "IN_PROGRESS" },
    { fromStatusKey: "WAITING_FOR_CLIENT", toStatusKey: "CANCELLED" },
    { fromStatusKey: "WAITING_FOR_THIRD_PARTY", toStatusKey: "IN_PROGRESS" },
    { fromStatusKey: "WAITING_FOR_THIRD_PARTY", toStatusKey: "CANCELLED" },
    { fromStatusKey: "COMPLETED", toStatusKey: "CLOSED" },
  ];

  // Clear existing transitions and re-create
  await prisma.statusTransition.deleteMany({});
  for (const t of transitions) {
    await prisma.statusTransition.create({ data: t });
  }
  console.log("Status transitions seeded.");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.staffUser.upsert({
    where: { email: "admin@starlight.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@starlight.com",
      passwordHash: adminPassword,
      role: StaffRole.ADMIN,
    },
  });

  // Create staff users
  const staffPassword = await bcrypt.hash("staff123", 12);
  const staff1 = await prisma.staffUser.upsert({
    where: { email: "zhang.wei@starlight.com" },
    update: {},
    create: {
      name: "Zhang Wei",
      email: "zhang.wei@starlight.com",
      passwordHash: staffPassword,
      role: StaffRole.STAFF,
    },
  });

  const staff2 = await prisma.staffUser.upsert({
    where: { email: "li.na@starlight.com" },
    update: {},
    create: {
      name: "Li Na",
      email: "li.na@starlight.com",
      passwordHash: staffPassword,
      role: StaffRole.MANAGER,
    },
  });

  // Create sample work orders
  const sampleOrders = [
    {
      workorderNumber: generateWorkOrderNumber(),
      passwordHash: await bcrypt.hash("client001", 12),
      clientName: "John Smith",
      clientCompany: "Acme Corp",
      clientEmail: "john@acme.com",
      clientPhone: "+1-555-0100",
      status: "IN_PROGRESS",
      progressPercentage: 45,
      priority: Priority.HIGH,
      assignedStaffId: staff1.id,
      description:
        "Company registration and business license application for Acme Corp Shanghai branch.",
      dueDate: new Date("2026-03-15"),
    },
    {
      workorderNumber: generateWorkOrderNumber(),
      passwordHash: await bcrypt.hash("client002", 12),
      clientName: "Wang Fang",
      clientCompany: "TechStart Ltd",
      clientEmail: "wang@techstart.cn",
      status: "WAITING_FOR_CLIENT",
      progressPercentage: 30,
      priority: Priority.MEDIUM,
      assignedStaffId: staff2.id,
      description: "Annual tax filing and audit preparation for FY2025.",
      dueDate: new Date("2026-04-01"),
    },
    {
      workorderNumber: generateWorkOrderNumber(),
      passwordHash: await bcrypt.hash("client003", 12),
      clientName: "Sarah Chen",
      clientCompany: "Global Trade Inc",
      clientEmail: "sarah@globaltrade.com",
      clientPhone: "+86-138-0000-1234",
      status: "COMPLETED",
      progressPercentage: 100,
      priority: Priority.LOW,
      assignedStaffId: staff1.id,
      description: "Import/export license renewal and customs documentation.",
      dueDate: new Date("2026-02-20"),
    },
    {
      workorderNumber: generateWorkOrderNumber(),
      passwordHash: await bcrypt.hash("client004", 12),
      clientName: "David Liu",
      clientCompany: "Innovation Labs",
      status: "RECEIVED",
      progressPercentage: 5,
      priority: Priority.URGENT,
      assignedStaffId: admin.id,
      description: "Emergency visa application and work permit processing.",
      dueDate: new Date("2026-02-28"),
    },
  ];

  for (const order of sampleOrders) {
    const created = await prisma.workOrder.create({ data: order });

    // Add initial status history
    await prisma.workOrderStatusHistory.create({
      data: {
        workOrderId: created.id,
        oldStatus: null,
        newStatus: "DRAFT",
        changedBy: admin.id,
        note: "Work order created",
      },
    });

    if (order.status !== "DRAFT") {
      await prisma.workOrderStatusHistory.create({
        data: {
          workOrderId: created.id,
          oldStatus: "DRAFT",
          newStatus: order.status,
          changedBy: admin.id,
          note: `Status updated to ${order.status}`,
        },
      });
    }

    // Add sample comments
    await prisma.comment.create({
      data: {
        workOrderId: created.id,
        authorType: "STAFF",
        authorId: admin.id,
        authorName: "System Admin",
        content: "Work order has been received and assigned.",
        isInternal: false,
      },
    });
  }

  console.log("Seed completed successfully.");
  console.log("---");
  console.log("Admin login: admin@starlight.com / admin123");
  console.log("Staff login: zhang.wei@starlight.com / staff123");
  console.log("Staff login: li.na@starlight.com / staff123");
  console.log("---");
  console.log(
    "Sample work orders created. Use the workorder numbers printed above with their respective passwords (client001-004).",
  );

  const orders = await prisma.workOrder.findMany({
    select: { workorderNumber: true, clientName: true },
  });
  orders.forEach((o) => {
    console.log(`  ${o.workorderNumber} - ${o.clientName}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import {
  PrismaClient,
  WorkOrderStatus,
  Priority,
  StaffRole,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

const prisma = new PrismaClient();

function generateWorkOrderNumber(): string {
  return "WO-" + crypto.randomBytes(5).toString("hex").toUpperCase();
}

async function main() {
  console.log("Seeding database...");

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
      status: WorkOrderStatus.IN_PROGRESS,
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
      status: WorkOrderStatus.WAITING_FOR_CLIENT,
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
      status: WorkOrderStatus.COMPLETED,
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
      status: WorkOrderStatus.RECEIVED,
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
        newStatus: WorkOrderStatus.DRAFT,
        changedBy: admin.id,
        note: "Work order created",
      },
    });

    if ((order.status as string) !== "DRAFT") {
      await prisma.workOrderStatusHistory.create({
        data: {
          workOrderId: created.id,
          oldStatus: WorkOrderStatus.DRAFT,
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

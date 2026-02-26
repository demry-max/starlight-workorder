import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);
    const scoreFilter = url.searchParams.get("score");
    const search = url.searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (scoreFilter) {
      where.score = parseInt(scoreFilter, 10);
    }

    if (search) {
      where.workOrder = {
        OR: [
          { workorderNumber: { contains: search, mode: "insensitive" } },
          { clientName: { contains: search, mode: "insensitive" } },
          { clientCompany: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Paginated ratings list
    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where,
        include: {
          workOrder: {
            select: {
              id: true,
              workorderNumber: true,
              clientName: true,
              clientCompany: true,
              status: true,
              salesRepId: true,
              salesRep: { select: { name: true } },
              assignedStaffId: true,
              assignedStaff: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.rating.count({ where }),
    ]);

    // Fetch ALL ratings with work order relations for analytics
    const allRatingsWithOrders = await prisma.rating.findMany({
      select: {
        score: true,
        comment: true,
        createdAt: true,
        id: true,
        workOrder: {
          select: {
            id: true,
            workorderNumber: true,
            clientName: true,
            clientCompany: true,
            salesRepId: true,
            salesRep: { select: { name: true } },
            assignedStaffId: true,
            assignedStaff: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // --- Overall summary ---
    const totalRatings = allRatingsWithOrders.length;
    const averageScore =
      totalRatings > 0
        ? allRatingsWithOrders.reduce((sum, r) => sum + r.score, 0) /
          totalRatings
        : 0;
    const distribution = [1, 2, 3, 4, 5].map((score) => ({
      score,
      count: allRatingsWithOrders.filter((r) => r.score === score).length,
    }));

    // --- Ratings by Sales Rep ---
    const salesRepMap = new Map<
      string,
      { name: string; scores: number[]; count: number }
    >();
    for (const r of allRatingsWithOrders) {
      const repId = r.workOrder.salesRepId || "unassigned";
      const repName = r.workOrder.salesRep?.name || "Unassigned";
      if (!salesRepMap.has(repId)) {
        salesRepMap.set(repId, { name: repName, scores: [], count: 0 });
      }
      const entry = salesRepMap.get(repId)!;
      entry.scores.push(r.score);
      entry.count += 1;
    }
    const bySalesRep = Array.from(salesRepMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        averageScore:
          Math.round(
            (data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10,
          ) / 10,
        totalRatings: data.count,
        distribution: [1, 2, 3, 4, 5].map((s) => ({
          score: s,
          count: data.scores.filter((sc) => sc === s).length,
        })),
      }))
      .sort((a, b) => b.totalRatings - a.totalRatings);

    // --- Ratings by Assigned Staff ---
    const staffMap = new Map<
      string,
      { name: string; scores: number[]; count: number }
    >();
    for (const r of allRatingsWithOrders) {
      const staffId = r.workOrder.assignedStaffId || "unassigned";
      const staffName = r.workOrder.assignedStaff?.name || "Unassigned";
      if (!staffMap.has(staffId)) {
        staffMap.set(staffId, { name: staffName, scores: [], count: 0 });
      }
      const entry = staffMap.get(staffId)!;
      entry.scores.push(r.score);
      entry.count += 1;
    }
    const byStaff = Array.from(staffMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        averageScore:
          Math.round(
            (data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10,
          ) / 10,
        totalRatings: data.count,
        distribution: [1, 2, 3, 4, 5].map((s) => ({
          score: s,
          count: data.scores.filter((sc) => sc === s).length,
        })),
      }))
      .sort((a, b) => b.totalRatings - a.totalRatings);

    // --- Bad ratings (1-2 stars) for alert ---
    const badRatings = allRatingsWithOrders
      .filter((r) => r.score <= 2)
      .map((r) => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        workOrder: {
          id: r.workOrder.id,
          workorderNumber: r.workOrder.workorderNumber,
          clientName: r.workOrder.clientName,
          clientCompany: r.workOrder.clientCompany,
          salesRepName: r.workOrder.salesRep?.name || null,
          assignedStaffName: r.workOrder.assignedStaff?.name || null,
        },
      }));

    // --- Monthly trend (last 12 months) ---
    const now = new Date();
    const monthlyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthRatings = allRatingsWithOrders.filter((r) => {
        const d = new Date(r.createdAt);
        return d >= monthStart && d <= monthEnd;
      });
      const monthAvg =
        monthRatings.length > 0
          ? Math.round(
              (monthRatings.reduce((s, r) => s + r.score, 0) /
                monthRatings.length) *
                10,
            ) / 10
          : null;
      monthlyTrend.push({
        month: monthStart.toISOString().slice(0, 7),
        count: monthRatings.length,
        averageScore: monthAvg,
      });
    }

    // --- Unrated completed orders count ---
    const unratedCompleted = await prisma.workOrder.count({
      where: {
        status: "COMPLETED",
        rating: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: ratings.map((r) => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        workOrder: {
          id: r.workOrder.id,
          workorderNumber: r.workOrder.workorderNumber,
          clientName: r.workOrder.clientName,
          clientCompany: r.workOrder.clientCompany,
          status: r.workOrder.status,
          salesRepName: r.workOrder.salesRep?.name || null,
          assignedStaffName: r.workOrder.assignedStaff?.name || null,
        },
      })),
      analytics: {
        overall: {
          totalRatings,
          averageScore: Math.round(averageScore * 10) / 10,
          distribution,
          unratedCompleted,
        },
        bySalesRep,
        byStaff,
        badRatings,
        monthlyTrend,
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get ratings error:", error);
    return NextResponse.json(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }
}

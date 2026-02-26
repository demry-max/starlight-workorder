import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workOrderId, score, comment } = body;

    if (!workOrderId || typeof workOrderId !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing workOrderId" },
        { status: 400 },
      );
    }

    if (!score || typeof score !== "number" || score < 1 || score > 5) {
      return NextResponse.json(
        { success: false, error: "Score must be between 1 and 5" },
        { status: 400 },
      );
    }

    // Check work order exists
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { id: true, status: true },
    });

    if (!workOrder) {
      return NextResponse.json(
        { success: false, error: "Work order not found" },
        { status: 404 },
      );
    }

    // Check if already rated
    const existingRating = await prisma.rating.findUnique({
      where: { workOrderId },
    });

    if (existingRating) {
      return NextResponse.json(
        { success: false, error: "Already rated" },
        { status: 409 },
      );
    }

    const sanitizedComment = comment ? sanitizeInput(String(comment).substring(0, 1000)) : null;

    const rating = await prisma.rating.create({
      data: {
        workOrderId,
        score: Math.round(score),
        comment: sanitizedComment,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: rating.id,
        score: rating.score,
        comment: rating.comment,
        createdAt: rating.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Submit rating error:", error);
    return NextResponse.json(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }
}

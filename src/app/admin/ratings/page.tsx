"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/context";
import { Pagination } from "@/components/Pagination";

interface RatingItem {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  workOrder: {
    id: string;
    workorderNumber: string;
    clientName: string;
    clientCompany: string | null;
    status: string;
    salesRepName: string | null;
    assignedStaffName: string | null;
  };
}

interface DistEntry {
  score: number;
  count: number;
}

interface PersonRating {
  id: string;
  name: string;
  averageScore: number;
  totalRatings: number;
  distribution: DistEntry[];
}

interface BadRating {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  workOrder: {
    id: string;
    workorderNumber: string;
    clientName: string;
    clientCompany: string | null;
    salesRepName: string | null;
    assignedStaffName: string | null;
  };
}

interface MonthlyTrend {
  month: string;
  count: number;
  averageScore: number | null;
}

interface Analytics {
  overall: {
    totalRatings: number;
    averageScore: number;
    distribution: DistEntry[];
    unratedCompleted: number;
  };
  bySalesRep: PersonRating[];
  byStaff: PersonRating[];
  badRatings: BadRating[];
  monthlyTrend: MonthlyTrend[];
}

export default function AdminRatingsPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const isZh = locale === "zh";

  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [scoreFilter, setScoreFilter] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "list">("overview");

  const fetchRatings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
      });
      if (scoreFilter) params.set("score", scoreFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/ratings?${params}`);
      const data = await res.json();
      if (data.success) {
        setRatings(data.data);
        setAnalytics(data.analytics);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, scoreFilter, search]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const renderStars = (score: number, size: "sm" | "md" | "lg" = "sm") => {
    const sizeClass =
      size === "lg" ? "h-8 w-8" : size === "md" ? "h-5 w-5" : "h-4 w-4";
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${sizeClass} ${star <= score ? "text-amber-400" : "text-gray-200"}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return "text-green-600";
    if (score >= 3.5) return "text-amber-600";
    if (score >= 2.5) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 4.5) return "bg-green-50 border-green-200";
    if (score >= 3.5) return "bg-amber-50 border-amber-200";
    if (score >= 2.5) return "bg-orange-50 border-orange-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isZh ? "评价分析" : "Ratings Analytics"}
        </h1>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {isZh ? "概览" : "Overview"}
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "list"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {isZh ? "全部评价" : "All Ratings"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">
          {t("common.loading")}
        </div>
      ) : activeTab === "overview" && analytics ? (
        <OverviewTab
          analytics={analytics}
          ratings={ratings}
          isZh={isZh}
          renderStars={renderStars}
          getScoreColor={getScoreColor}
          getScoreBg={getScoreBg}
          router={router}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      ) : (
        <ListTab
          ratings={ratings}
          isZh={isZh}
          renderStars={renderStars}
          router={router}
          page={page}
          totalPages={totalPages}
          total={total}
          search={search}
          scoreFilter={scoreFilter}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onScoreFilterChange={(v) => {
            setScoreFilter(v);
            setPage(1);
          }}
          onPageChange={setPage}
          t={t}
        />
      )}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({
  analytics,
  ratings,
  isZh,
  renderStars,
  getScoreColor,
  getScoreBg,
  router,
  page,
  totalPages,
  total,
  onPageChange,
}: {
  analytics: Analytics;
  ratings: RatingItem[];
  isZh: boolean;
  renderStars: (score: number, size?: "sm" | "md" | "lg") => React.ReactNode;
  getScoreColor: (score: number) => string;
  getScoreBg: (score: number) => string;
  router: ReturnType<typeof import("next/navigation").useRouter>;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  const { overall, bySalesRep, byStaff, badRatings, monthlyTrend } = analytics;

  return (
    <div className="space-y-6">
      {/* Row 1: KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Average */}
        <div className="card text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
            {isZh ? "总体平均评分" : "Overall Average"}
          </p>
          <div className="flex items-center justify-center gap-2">
            <span
              className={`text-4xl font-bold ${getScoreColor(overall.averageScore)}`}
            >
              {overall.averageScore || "-"}
            </span>
            <span className="text-lg text-gray-400">/5</span>
          </div>
          <div className="flex justify-center mt-2">
            {renderStars(Math.round(overall.averageScore), "md")}
          </div>
        </div>

        {/* Total Ratings */}
        <div className="card text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
            {isZh ? "评价总数" : "Total Ratings"}
          </p>
          <span className="text-4xl font-bold text-gray-900">
            {overall.totalRatings}
          </span>
        </div>

        {/* Bad Ratings Count */}
        <div className="card text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
            {isZh ? "差评数量 (1-2星)" : "Bad Ratings (1-2★)"}
          </p>
          <span
            className={`text-4xl font-bold ${badRatings.length > 0 ? "text-red-600" : "text-green-600"}`}
          >
            {badRatings.length}
          </span>
          {overall.totalRatings > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {Math.round((badRatings.length / overall.totalRatings) * 100)}%{" "}
              {isZh ? "差评率" : "of total"}
            </p>
          )}
        </div>

        {/* Unrated Completed */}
        <div className="card text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
            {isZh ? "待评价工单" : "Awaiting Rating"}
          </p>
          <span
            className={`text-4xl font-bold ${overall.unratedCompleted > 0 ? "text-amber-600" : "text-gray-900"}`}
          >
            {overall.unratedCompleted}
          </span>
          <p className="text-xs text-gray-400 mt-1">
            {isZh ? "已完成但未评价" : "Completed, no rating"}
          </p>
        </div>
      </div>

      {/* Row 2: Distribution + Monthly Trend */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score Distribution */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {isZh ? "评分分布" : "Score Distribution"}
          </h3>
          <div className="space-y-3">
            {[...overall.distribution].reverse().map((d) => {
              const percentage =
                overall.totalRatings > 0
                  ? (d.count / overall.totalRatings) * 100
                  : 0;
              return (
                <div key={d.score} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium text-gray-700 w-3">
                      {d.score}
                    </span>
                    <svg
                      className="h-4 w-4 text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-4 bg-amber-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-500 w-12 text-right">
                    {d.count} ({Math.round(percentage)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {isZh ? "月度趋势（近12个月）" : "Monthly Trend (Last 12 Months)"}
          </h3>
          <div className="space-y-2">
            {monthlyTrend
              .filter((m) => m.count > 0)
              .map((m) => {
                const label = isZh
                  ? `${m.month.split("-")[0]}年${parseInt(m.month.split("-")[1])}月`
                  : new Date(m.month + "-01").toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    });
                return (
                  <div
                    key={m.month}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-sm text-gray-600">{label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {m.count} {isZh ? "条" : "ratings"}
                      </span>
                      {m.averageScore !== null && (
                        <div className="flex items-center gap-1">
                          {renderStars(Math.round(m.averageScore), "sm")}
                          <span
                            className={`text-sm font-semibold ${getScoreColor(m.averageScore)}`}
                          >
                            {m.averageScore}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            {monthlyTrend.filter((m) => m.count > 0).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                {isZh ? "暂无数据" : "No data yet"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: By Sales Rep + By Staff */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Sales Rep */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {isZh ? "按销售代表" : "By Sales Rep"}
          </h3>
          {bySalesRep.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              {isZh ? "暂无数据" : "No data"}
            </p>
          ) : (
            <div className="space-y-3">
              {bySalesRep.map((rep) => (
                <div
                  key={rep.id}
                  className={`rounded-lg border p-3 ${getScoreBg(rep.averageScore)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {rep.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-bold ${getScoreColor(rep.averageScore)}`}
                      >
                        {rep.averageScore}
                      </span>
                      <span className="text-xs text-gray-400">/5</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {renderStars(Math.round(rep.averageScore), "sm")}
                    <span className="text-xs text-gray-500">
                      {rep.totalRatings} {isZh ? "条评价" : "ratings"}
                    </span>
                  </div>
                  {/* Mini distribution bar */}
                  <div className="flex gap-0.5 mt-2">
                    {rep.distribution.map((d) => (
                      <div
                        key={d.score}
                        className="h-1.5 rounded-full"
                        style={{
                          flex: d.count || 0.1,
                          backgroundColor:
                            d.score >= 4
                              ? "#10B981"
                              : d.score === 3
                                ? "#F59E0B"
                                : "#EF4444",
                          opacity: d.count > 0 ? 1 : 0.15,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Assigned Staff */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {isZh ? "按负责员工" : "By Assigned Staff"}
          </h3>
          {byStaff.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              {isZh ? "暂无数据" : "No data"}
            </p>
          ) : (
            <div className="space-y-3">
              {byStaff.map((staff) => (
                <div
                  key={staff.id}
                  className={`rounded-lg border p-3 ${getScoreBg(staff.averageScore)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {staff.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-bold ${getScoreColor(staff.averageScore)}`}
                      >
                        {staff.averageScore}
                      </span>
                      <span className="text-xs text-gray-400">/5</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {renderStars(Math.round(staff.averageScore), "sm")}
                    <span className="text-xs text-gray-500">
                      {staff.totalRatings} {isZh ? "条评价" : "ratings"}
                    </span>
                  </div>
                  <div className="flex gap-0.5 mt-2">
                    {staff.distribution.map((d) => (
                      <div
                        key={d.score}
                        className="h-1.5 rounded-full"
                        style={{
                          flex: d.count || 0.1,
                          backgroundColor:
                            d.score >= 4
                              ? "#10B981"
                              : d.score === 3
                                ? "#F59E0B"
                                : "#EF4444",
                          opacity: d.count > 0 ? 1 : 0.15,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Bad Ratings Alert */}
      <div className="card border-red-200 bg-red-50/30">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="h-5 w-5 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-red-800">
            {isZh
              ? `需要关注的差评 (${badRatings.length})`
              : `Bad Ratings Alert (${badRatings.length})`}
          </h3>
        </div>
        {badRatings.length === 0 ? (
          <div className="text-center py-6">
            <span className="text-2xl">🎉</span>
            <p className="text-sm text-green-700 mt-2 font-medium">
              {isZh ? "没有差评，继续保持！" : "No bad ratings — keep it up!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {badRatings.map((rating) => (
              <div
                key={rating.id}
                className="rounded-lg bg-white border border-red-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() =>
                  router.push(`/admin/workorders/${rating.workOrder.id}`)
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {renderStars(rating.score, "sm")}
                      <span className="text-sm font-bold text-red-600">
                        {rating.score}/5
                      </span>
                    </div>
                    {rating.comment && (
                      <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">
                        {rating.comment}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span className="font-mono font-medium text-gray-500">
                        {rating.workOrder.workorderNumber}
                      </span>
                      <span>{rating.workOrder.clientName}</span>
                      {rating.workOrder.salesRepName && (
                        <span>
                          {isZh ? "销售:" : "Rep:"}{" "}
                          {rating.workOrder.salesRepName}
                        </span>
                      )}
                      {rating.workOrder.assignedStaffName && (
                        <span>
                          {isZh ? "负责:" : "Staff:"}{" "}
                          {rating.workOrder.assignedStaffName}
                        </span>
                      )}
                      <span>
                        {new Date(rating.createdAt).toLocaleDateString(
                          isZh ? "zh-CN" : "en-US",
                        )}
                      </span>
                    </div>
                  </div>
                  <svg
                    className="h-4 w-4 text-gray-300 shrink-0 mt-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row 5: All Ratings List */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          {isZh ? `所有评价 (${total})` : `All Ratings (${total})`}
        </h3>
        {ratings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            {isZh ? "暂无评价" : "No ratings yet"}
          </p>
        ) : (
          <div className="space-y-3">
            {ratings.map((rating) => (
              <div
                key={rating.id}
                className="rounded-lg border border-gray-100 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() =>
                  router.push(`/admin/workorders/${rating.workOrder.id}`)
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      {renderStars(rating.score, "sm")}
                      <span className="text-sm font-semibold text-gray-700">
                        {rating.score}/5
                      </span>
                    </div>
                    {rating.comment && (
                      <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap line-clamp-2">
                        {rating.comment}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span className="font-mono font-medium text-gray-500">
                        {rating.workOrder.workorderNumber}
                      </span>
                      <span>{rating.workOrder.clientName}</span>
                      {rating.workOrder.clientCompany && (
                        <span>{rating.workOrder.clientCompany}</span>
                      )}
                      {rating.workOrder.salesRepName && (
                        <span>
                          {isZh ? "销售:" : "Rep:"}{" "}
                          {rating.workOrder.salesRepName}
                        </span>
                      )}
                      {rating.workOrder.assignedStaffName && (
                        <span>
                          {isZh ? "负责:" : "Staff:"}{" "}
                          {rating.workOrder.assignedStaffName}
                        </span>
                      )}
                      <span>
                        {new Date(rating.createdAt).toLocaleDateString(
                          isZh ? "zh-CN" : "en-US",
                        )}
                      </span>
                    </div>
                  </div>
                  <svg
                    className="h-4 w-4 text-gray-300 shrink-0 mt-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={20}
                onPageChange={onPageChange}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── List Tab ────────────────────────────────────────────────────────────────

function ListTab({
  ratings,
  isZh,
  renderStars,
  router,
  page,
  totalPages,
  total,
  search,
  scoreFilter,
  onSearchChange,
  onScoreFilterChange,
  onPageChange,
  t,
}: {
  ratings: RatingItem[];
  isZh: boolean;
  renderStars: (score: number, size?: "sm" | "md" | "lg") => React.ReactNode;
  router: ReturnType<typeof import("next/navigation").useRouter>;
  page: number;
  totalPages: number;
  total: number;
  search: string;
  scoreFilter: string;
  onSearchChange: (v: string) => void;
  onScoreFilterChange: (v: string) => void;
  onPageChange: (p: number) => void;
  t: (key: string) => string;
}) {
  return (
    <div>
      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              isZh
                ? "按工单号或客户名搜索..."
                : "Search by order number or client name..."
            }
            className="input-field flex-1"
          />
          <select
            value={scoreFilter}
            onChange={(e) => onScoreFilterChange(e.target.value)}
            className="input-field sm:w-48"
          >
            <option value="">{isZh ? "所有评分" : "All Scores"}</option>
            {[5, 4, 3, 2, 1].map((s) => (
              <option key={s} value={s}>
                {"★".repeat(s)}
                {"☆".repeat(5 - s)} ({s})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ratings List */}
      {ratings.length === 0 ? (
        <div className="card py-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
            <svg
              className="h-8 w-8 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </div>
          <p className="text-gray-400">
            {isZh ? "暂无评价" : "No ratings yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div
              key={rating.id}
              className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() =>
                router.push(`/admin/workorders/${rating.workOrder.id}`)
              }
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {renderStars(rating.score, "sm")}
                    <span className="text-sm font-semibold text-gray-700">
                      {rating.score}/5
                    </span>
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                      {rating.comment}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span className="font-mono font-medium text-gray-500">
                      {rating.workOrder.workorderNumber}
                    </span>
                    <span>{rating.workOrder.clientName}</span>
                    {rating.workOrder.clientCompany && (
                      <span>{rating.workOrder.clientCompany}</span>
                    )}
                    {rating.workOrder.salesRepName && (
                      <span>
                        {isZh ? "销售:" : "Rep:"}{" "}
                        {rating.workOrder.salesRepName}
                      </span>
                    )}
                    {rating.workOrder.assignedStaffName && (
                      <span>
                        {isZh ? "负责:" : "Staff:"}{" "}
                        {rating.workOrder.assignedStaffName}
                      </span>
                    )}
                    <span>
                      {new Date(rating.createdAt).toLocaleDateString(
                        isZh ? "zh-CN" : "en-US",
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={20}
              onPageChange={onPageChange}
            />
          )}
        </div>
      )}
    </div>
  );
}

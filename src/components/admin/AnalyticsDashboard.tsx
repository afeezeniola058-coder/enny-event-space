import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth } from "date-fns";
import {
  TrendingUp, Calendar, Building2, CreditCard, RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(38 92% 50%)",       // amber
  confirmed: "hsl(var(--primary))", // brand gold
  completed: "hsl(142 71% 45%)",    // green
  cancelled: "hsl(var(--destructive))",
};

interface BookingRow {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  event_date: string;
  hall_id: string | null;
  catering_package_id: string | null;
  decoration_package_id: string | null;
  created_at: string;
}

const AnalyticsDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const [bookingsRes, hallsRes, cateringRes, decorRes] = await Promise.all([
        supabase.from("bookings").select("id, status, payment_status, total_amount, event_date, hall_id, catering_package_id, decoration_package_id, created_at"),
        supabase.from("halls").select("id, name"),
        supabase.from("catering_packages").select("id, name"),
        supabase.from("decoration_packages").select("id, name"),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (hallsRes.error) throw hallsRes.error;
      if (cateringRes.error) throw cateringRes.error;
      if (decorRes.error) throw decorRes.error;

      return {
        bookings: (bookingsRes.data ?? []) as BookingRow[],
        halls: hallsRes.data ?? [],
        catering: cateringRes.data ?? [],
        decorations: decorRes.data ?? [],
      };
    },
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const { bookings, halls, catering, decorations } = data;

    const paidBookings = bookings.filter((b) => b.payment_status === "paid");
    const totalRevenue = paidBookings.reduce((s, b) => s + Number(b.total_amount || 0), 0);
    const activeBookings = bookings.filter((b) => b.status !== "cancelled").length;
    const occupancyByHall = halls.map((h) => ({
      name: h.name,
      bookings: bookings.filter((b) => b.hall_id === h.id && b.status !== "cancelled").length,
    })).sort((a, b) => b.bookings - a.bookings);

    // Revenue by month — last 6 months
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(startOfMonth(new Date()), i);
      months.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM") });
    }
    const revenueByMonth = months.map(({ key, label }) => {
      const monthRevenue = paidBookings
        .filter((b) => b.created_at.slice(0, 7) === key)
        .reduce((s, b) => s + Number(b.total_amount || 0), 0);
      const bookingCount = bookings.filter((b) => b.created_at.slice(0, 7) === key).length;
      return { month: label, revenue: monthRevenue, bookings: bookingCount };
    });

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    bookings.forEach((b) => { statusCounts[b.status] = (statusCounts[b.status] ?? 0) + 1; });
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      key: name,
    }));

    // Top catering and decoration
    const cateringCount: Record<string, number> = {};
    const decorCount: Record<string, number> = {};
    bookings.forEach((b) => {
      if (b.catering_package_id) cateringCount[b.catering_package_id] = (cateringCount[b.catering_package_id] ?? 0) + 1;
      if (b.decoration_package_id) decorCount[b.decoration_package_id] = (decorCount[b.decoration_package_id] ?? 0) + 1;
    });
    const topCatering = catering
      .map((c) => ({ name: c.name, count: cateringCount[c.id] ?? 0 }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const topDecor = decorations
      .map((d) => ({ name: d.name, count: decorCount[d.id] ?? 0 }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRevenue,
      totalBookings: bookings.length,
      activeBookings,
      paidCount: paidBookings.length,
      occupancyByHall,
      revenueByMonth,
      statusData,
      topCatering,
      topDecor,
    };
  }, [data]);

  if (isLoading || !stats) {
    return (
      <div className="flex justify-center py-16">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From {stats.paidCount} paid bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">{stats.activeBookings} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Top Hall</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{stats.occupancyByHall[0]?.name ?? "—"}</div>
            <p className="text-xs text-muted-foreground">{stats.occupancyByHall[0]?.bookings ?? 0} bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalBookings > 0
                ? Math.round((stats.paidCount / stats.totalBookings) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Paid vs total bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue over time */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue (Last 6 Months)</CardTitle>
          <CardDescription>Confirmed paid revenue per month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--popover-foreground))",
                }}
                formatter={(v: number) => formatPrice(v)}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hall occupancy */}
        <Card>
          <CardHeader>
            <CardTitle>Hall Occupancy</CardTitle>
            <CardDescription>Active bookings per venue</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.occupancyByHall}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                />
                <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status pie */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status</CardTitle>
            <CardDescription>Distribution by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {stats.statusData.map((s) => (
                    <Cell key={s.key} fill={STATUS_COLORS[s.key] ?? "hsl(var(--muted))"} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top catering */}
        <Card>
          <CardHeader>
            <CardTitle>Top Catering Packages</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topCatering.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>
            ) : (
              <ul className="space-y-3">
                {stats.topCatering.map((c) => (
                  <li key={c.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-sm text-muted-foreground">{c.count} bookings</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Top decorations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Decoration Packages</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topDecor.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>
            ) : (
              <ul className="space-y-3">
                {stats.topDecor.map((d) => (
                  <li key={d.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{d.name}</span>
                    <span className="text-sm text-muted-foreground">{d.count} bookings</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, CreditCard, Clock, BarChart3, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Booking {
  id: string;
  event_name: string;
  event_date: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
}

interface UserAnalyticsProps {
  bookings: Booking[];
}

const UserAnalytics = ({ bookings }: UserAnalyticsProps) => {
  const stats = useMemo(() => {
    const now = new Date();
    const totalSpent = bookings
      .filter((b) => b.payment_status === "paid")
      .reduce((sum, b) => sum + b.total_amount, 0);
    const upcoming = bookings.filter(
      (b) => new Date(b.event_date) >= now && b.status !== "cancelled"
    ).length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;

    // Monthly spending for last 6 months
    const monthlySpending: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const year = d.getFullYear();
      const month = d.getMonth();
      const amount = bookings
        .filter((b) => {
          const bd = new Date(b.created_at);
          return bd.getFullYear() === year && bd.getMonth() === month && b.payment_status === "paid";
        })
        .reduce((sum, b) => sum + b.total_amount, 0);
      monthlySpending.push({ month: label, amount });
    }

    const maxMonthly = Math.max(...monthlySpending.map((m) => m.amount), 1);

    return { totalSpent, upcoming, completed, cancelled, monthlySpending, maxMonthly };
  }, [bookings]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);

  const statCards = [
    { label: "Total Spent", value: formatPrice(stats.totalSpent), icon: CreditCard, color: "text-primary" },
    { label: "Upcoming Events", value: stats.upcoming, icon: Calendar, color: "text-blue-500" },
    { label: "Completed", value: stats.completed, icon: TrendingUp, color: "text-green-500" },
    { label: "Cancelled", value: stats.cancelled, icon: Clock, color: "text-destructive" },
  ];

  if (bookings.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-semibold text-foreground">Your Analytics</h2>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Spending Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" />
            Spending (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {stats.monthlySpending.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex justify-center">
                  {m.amount > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatPrice(m.amount)}
                    </span>
                  )}
                </div>
                <div
                  className="w-full rounded-t-md bg-primary/80 transition-all duration-500 min-h-[4px]"
                  style={{ height: `${Math.max((m.amount / stats.maxMonthly) * 100, 4)}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-xs">
          {bookings.length} total bookings
        </Badge>
        {stats.completed > 0 && (
          <Badge variant="outline" className="text-xs text-green-600 border-green-200 dark:border-green-800 dark:text-green-400">
            {stats.completed} completed
          </Badge>
        )}
        {stats.upcoming > 0 && (
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 dark:border-blue-800 dark:text-blue-400">
            {stats.upcoming} upcoming
          </Badge>
        )}
      </div>
    </div>
  );
};

export default UserAnalytics;

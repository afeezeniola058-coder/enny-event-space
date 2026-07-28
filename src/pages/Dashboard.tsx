import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, CreditCard, Clock, Plus, X } from "lucide-react";
import UserAnalytics from "@/components/dashboard/UserAnalytics";
import MyWaitlist from "@/components/dashboard/MyWaitlist";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const paymentVerified = useRef(false);
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Handle payment verification on return from Paystack
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const reference = searchParams.get("reference") || searchParams.get("trxref");

    if (paymentStatus === "success" && reference && !paymentVerified.current) {
      paymentVerified.current = true;
      
      const verifyPayment = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('paystack-verify', {
            body: { reference },
          });

          if (error) throw error;

          if (data?.success) {
            toast({
              title: "Payment successful!",
              description: "Your booking has been confirmed.",
            });
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
          } else {
            toast({
              title: "Payment verification failed",
              description: data?.message || "Please contact support if you were charged.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Payment verification error:", error);
          toast({
            title: "Verification error",
            description: "Could not verify payment. Please contact support.",
            variant: "destructive",
          });
        }

        // Clean up URL params
        setSearchParams({});
      };

      verifyPayment();
    }
  }, [searchParams, setSearchParams, queryClient]);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          hall:halls(name, price_per_hour),
          catering_package:catering_packages(name, price_per_person, pricing_type, flat_price),
          decoration_package:decoration_packages(name, price, style)
        `)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  const today = new Date().toISOString().split("T")[0];
  const upcomingBookings = bookings.filter(
    (b: any) => b.event_date >= today && b.status !== "cancelled"
  );
  const pastBookings = bookings.filter(
    (b: any) => b.event_date < today || b.status === "cancelled"
  );

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" as const })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", user?.id] });
      toast({
        title: "Booking cancelled",
        description: "Your booking has been successfully cancelled.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePayNow = async (booking: any) => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "Could not retrieve your email. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setPayingBookingId(booking.id);

    try {
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('paystack-initialize', {
        body: {
          bookingId: booking.id,
          email: user.email,
          amount: booking.total_amount,
        },
      });

      if (paymentError) throw paymentError;

      if (paymentData?.authorization_url) {
        window.location.href = paymentData.authorization_url;
      } else {
        throw new Error("Failed to get payment URL");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Could not initialize payment. Please try again.",
        variant: "destructive",
      });
      setPayingBookingId(null);
    }
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat("en-NG", { 
      style: "currency", 
      currency: "NGN", 
      minimumFractionDigits: 0 
    }).format(price);

  // Check if cancellation is allowed (72 hours before event)
  const canCancelBooking = (eventDate: string, startTime: string) => {
    const eventDateTime = new Date(`${eventDate}T${startTime}`);
    const now = new Date();
    const hoursUntilEvent = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilEvent >= 72;
  };

  const stats = [
    { label: "Upcoming", value: upcomingBookings.length, icon: Calendar },
    { label: "Pending Payment", value: bookings.filter((b: any) => b.payment_status === "pending" && b.status !== "cancelled").length, icon: Clock },
    { label: "Confirmed", value: bookings.filter((b: any) => b.status === "confirmed").length, icon: CreditCard },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "completed":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    }
  };

  const getPaymentStyle = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "refunded":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "failed":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    }
  };

  const renderBookingRow = (booking: any) => (
    <Link
      key={booking.id}
      to={`/bookings/${booking.id}`}
      className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 p-4 bg-secondary/50 rounded-xl hover:bg-secondary/70 transition-colors cursor-pointer"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{booking.event_name}</p>
        <p className="text-sm text-muted-foreground">
          {new Date(booking.event_date).toLocaleDateString("en-NG", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
          {" · "}
          {booking.start_time?.slice(0, 5)}–{booking.end_time?.slice(0, 5)}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {booking.hall?.name && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              📍 {booking.hall.name}
            </span>
          )}
          {booking.catering_package?.name && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              🍽 {booking.catering_package.name}
            </span>
          )}
          {booking.decoration_package?.name && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              🎀 {booking.decoration_package.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold text-primary">{formatPrice(booking.total_amount)}</p>
          <div className="flex flex-wrap gap-1 justify-end mt-1">
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusStyle(booking.status)}`}>{booking.status}</span>
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${getPaymentStyle(booking.payment_status)}`}>{booking.payment_status}</span>
          </div>
        </div>
        {booking.status === "pending" && booking.payment_status === "pending" && (
          <Button
            variant="gold"
            size="sm"
            onClick={(e) => { e.preventDefault(); handlePayNow(booking); }}
            disabled={payingBookingId === booking.id}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {payingBookingId === booking.id ? "Processing..." : "Pay Now"}
          </Button>
        )}
        {booking.status === "pending" && canCancelBooking(booking.event_date, booking.start_time) && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => e.preventDefault()}
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel your booking for "{booking.event_name}" on {booking.event_date}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => cancelBookingMutation.mutate(booking.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Cancel Booking
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Welcome back!</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-2xl p-6 border border-border">
                <stat.icon className="h-8 w-8 text-primary mb-4" />
                <p className="font-display text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* User Analytics */}
          <UserAnalytics bookings={bookings} />

          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-xl font-semibold">Upcoming Bookings</h2>
              <Button variant="gold" asChild><Link to="/halls"><Plus className="h-4 w-4 mr-2" />New Booking</Link></Button>
            </div>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-secondary/50 rounded-xl">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="space-y-2 text-right">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming bookings. Start planning your event!</p>
                <Button variant="gold" className="mt-4" asChild><Link to="/halls">Browse Venues</Link></Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map(renderBookingRow)}
              </div>
            )}
          </div>

          {pastBookings.length > 0 && (
            <div className="bg-card rounded-2xl p-6 border border-border mt-6">
              <h2 className="font-display text-xl font-semibold mb-6">Past & Cancelled</h2>
              <div className="space-y-4">
                {pastBookings.map(renderBookingRow)}
              </div>
            </div>
          )}

          <MyWaitlist userId={user?.id} />
                        </div>
                      </main>
                      <Footer />
                    </div>
                  );
                };

export default Dashboard;

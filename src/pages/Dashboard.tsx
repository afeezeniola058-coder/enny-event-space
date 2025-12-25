import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, CreditCard, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);

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

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });

  const formatPrice = (price: number) => 
    new Intl.NumberFormat("en-NG", { 
      style: "currency", 
      currency: "NGN", 
      minimumFractionDigits: 0 
    }).format(price);

  const stats = [
    { label: "Total Bookings", value: bookings.length, icon: Calendar },
    { label: "Pending", value: bookings.filter(b => b.status === "pending").length, icon: Clock },
    { label: "Completed", value: bookings.filter(b => b.status === "completed").length, icon: CreditCard },
  ];

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

          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-xl font-semibold">Your Bookings</h2>
              <Button variant="gold" asChild><Link to="/halls"><Plus className="h-4 w-4 mr-2" />New Booking</Link></Button>
            </div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-pulse text-primary">Loading bookings...</div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No bookings yet. Start planning your event!</p>
                <Button variant="gold" className="mt-4" asChild><Link to="/halls">Browse Venues</Link></Button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex justify-between items-center p-4 bg-secondary/50 rounded-xl">
                    <div>
                      <p className="font-medium">{booking.event_name}</p>
                      <p className="text-sm text-muted-foreground">{booking.event_date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{formatPrice(booking.total_amount)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${booking.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{booking.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;

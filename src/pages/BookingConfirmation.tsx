import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  Utensils,
  Palette,
  CalendarDays,
  Users,
  Clock,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import CalendarExportButton from "@/components/booking/CalendarExportButton";

interface BookingSummary {
  id: string;
  event_name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  total_amount: number;
  discount_amount: number;
  status: string;
  payment_status: string;
  notes: string | null;
  dietary_preferences: string[] | null;
  halls: { name: string; price_per_hour: number } | null;
  catering_packages: { name: string; price_per_person: number; pricing_type: string | null; flat_price: number | null } | null;
  decoration_packages: { name: string; price: number } | null;
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(value);

const BookingConfirmation = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const bookingIdParam = searchParams.get("booking");
  const verified = useRef(false);

  const [state, setState] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState<string>("");
  const [booking, setBooking] = useState<BookingSummary | null>(null);

  useEffect(() => {
    if (verified.current) return;
    verified.current = true;

    const loadBooking = async (id: string) => {
      const { data } = await supabase
        .from("bookings")
        .select(
          `id, event_name, event_date, start_time, end_time, guest_count, total_amount, discount_amount, status, payment_status, notes, dietary_preferences,
           halls ( name, price_per_hour ),
           catering_packages ( name, price_per_person, pricing_type, flat_price ),
           decoration_packages ( name, price )`
        )
        .eq("id", id)
        .maybeSingle();

      if (data) setBooking(data as unknown as BookingSummary);
    };

    const run = async () => {
      try {
        if (reference) {
          const { data, error } = await supabase.functions.invoke("paystack-verify", {
            body: { reference },
          });
          if (error) throw error;

          if (data?.success) {
            setState("success");
            if (data.booking_id) await loadBooking(data.booking_id);
            return;
          }

          setState("failed");
          setMessage(data?.message || "We could not confirm this payment.");
          return;
        }

        if (bookingIdParam) {
          await loadBooking(bookingIdParam);
          setState("success");
          return;
        }

        setState("failed");
        setMessage("No payment reference was provided.");
      } catch (err) {
        console.error("Confirmation error:", err);
        setState("failed");
        setMessage("Something went wrong while confirming your payment. If you were charged, please contact support.");
      }
    };

    run();
  }, [reference, bookingIdParam]);

  const cateringLine = () => {
    const c = booking?.catering_packages;
    if (!c) return null;
    return c.pricing_type === "flat"
      ? `Flat rate ${formatPrice(c.flat_price ?? 0)}`
      : `${booking?.guest_count} guests × ${formatPrice(c.price_per_person)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Booking Confirmation | Enny Event"
        description="Your event booking confirmation with a full summary of your venue, catering and decoration selections."
      />
      <Navbar />

      <main className="pt-24 pb-16">
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-3xl">
            {state === "loading" && (
              <Card>
                <CardContent className="py-16 flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="font-body text-muted-foreground">Confirming your payment…</p>
                </CardContent>
              </Card>
            )}

            {state === "failed" && (
              <Card className="border-destructive/30">
                <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
                  <XCircle className="h-12 w-12 text-destructive" />
                  <h1 className="font-display text-2xl font-bold text-foreground">Payment not confirmed</h1>
                  <p className="font-body text-muted-foreground max-w-md">{message}</p>
                  <div className="flex flex-wrap gap-3 justify-center pt-2">
                    <Button asChild variant="outline">
                      <Link to="/dashboard">Go to dashboard</Link>
                    </Button>
                    <Button asChild variant="hero">
                      <Link to="/book">Try again</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {state === "success" && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="text-center space-y-3">
                  <CheckCircle2 className="h-14 w-14 text-primary mx-auto" />
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                    Booking confirmed
                  </h1>
                  <p className="font-body text-muted-foreground">
                    Payment received. A confirmation email is on its way with all the details below.
                  </p>
                </div>

                {booking && (
                  <Card className="border-primary/20">
                    <CardHeader className="bg-gradient-hero rounded-t-lg">
                      <CardTitle className="font-display flex items-center justify-between gap-3 flex-wrap">
                        <span>{booking.event_name}</span>
                        <Badge>{booking.status}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                      <div className="grid sm:grid-cols-3 gap-4 font-body text-sm">
                        <div className="flex items-start gap-2">
                          <CalendarDays className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="text-muted-foreground">Event date</p>
                            <p className="font-medium text-foreground">
                              {format(new Date(booking.event_date + "T00:00:00"), "PPP")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="text-muted-foreground">Time</p>
                            <p className="font-medium text-foreground">
                              {booking.start_time?.slice(0, 5)} – {booking.end_time?.slice(0, 5)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Users className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="text-muted-foreground">Guests</p>
                            <p className="font-medium text-foreground">{booking.guest_count}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Building2 className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Venue</p>
                            <p className="font-medium text-foreground">{booking.halls?.name ?? "Not selected"}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Utensils className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Catering</p>
                            <p className="font-medium text-foreground">
                              {booking.catering_packages?.name ?? "Not added"}
                            </p>
                            {booking.catering_packages && (
                              <p className="text-sm text-muted-foreground">{cateringLine()}</p>
                            )}
                            {booking.dietary_preferences && booking.dietary_preferences.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Dietary: {booking.dietary_preferences.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Palette className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Decorations</p>
                            <p className="font-medium text-foreground">
                              {booking.decoration_packages?.name ?? "Not added"}
                            </p>
                            {booking.decoration_packages && (
                              <p className="text-sm text-muted-foreground">
                                {formatPrice(booking.decoration_packages.price)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {booking.notes && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Notes</p>
                            <p className="font-body text-foreground">{booking.notes}</p>
                          </div>
                        </>
                      )}

                      <Separator />

                      <div className="space-y-2">
                        {booking.discount_amount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Discount applied</span>
                            <span className="text-primary font-medium">−{formatPrice(booking.discount_amount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="font-display text-lg text-foreground">Total paid</span>
                          <span className="font-display text-2xl font-bold text-primary">
                            {formatPrice(booking.total_amount)}
                          </span>
                        </div>
                        <Badge variant="secondary">Payment: {booking.payment_status}</Badge>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <CalendarExportButton
                          booking={{
                            id: booking.id,
                            event_name: booking.event_name,
                            event_date: booking.event_date,
                            start_time: booking.start_time,
                            end_time: booking.end_time,
                            hall_name: booking.halls?.name ?? null,
                            notes: booking.notes,
                          }}
                        />
                        <Button asChild variant="outline">
                          <Link to={`/bookings/${booking.id}`}>View booking details</Link>
                        </Button>
                        <Button asChild variant="hero">
                          <Link to="/dashboard">Go to dashboard</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!booking && (
                  <Card>
                    <CardContent className="py-8 text-center space-y-4">
                      <p className="font-body text-muted-foreground">
                        Your payment was confirmed. Open your dashboard to see the full booking.
                      </p>
                      <Button asChild variant="hero">
                        <Link to="/dashboard">Go to dashboard</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BookingConfirmation;

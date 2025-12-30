import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  UtensilsCrossed, 
  Sparkles, 
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { User } from "@supabase/supabase-js";

const BookingDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isPayingNow, setIsPayingNow] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      if (!id) throw new Error("No booking ID provided");
      
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error("Booking not found");
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: hall } = useQuery({
    queryKey: ["hall", booking?.hall_id],
    queryFn: async () => {
      if (!booking?.hall_id) return null;
      const { data, error } = await supabase
        .from("halls")
        .select("*")
        .eq("id", booking.hall_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!booking?.hall_id,
  });

  const { data: cateringPackage } = useQuery({
    queryKey: ["catering", booking?.catering_package_id],
    queryFn: async () => {
      if (!booking?.catering_package_id) return null;
      const { data, error } = await supabase
        .from("catering_packages")
        .select("*")
        .eq("id", booking.catering_package_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!booking?.catering_package_id,
  });

  const { data: decorationPackage } = useQuery({
    queryKey: ["decoration", booking?.decoration_package_id],
    queryFn: async () => {
      if (!booking?.decoration_package_id) return null;
      const { data, error } = await supabase
        .from("decoration_packages")
        .select("*")
        .eq("id", booking.decoration_package_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!booking?.decoration_package_id,
  });

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  };

  const getPaymentStatusStyle = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  };

  const handlePayNow = async () => {
    if (!booking || !user?.email) {
      toast({
        title: "Error",
        description: "Could not retrieve booking or email. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsPayingNow(true);

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
      setIsPayingNow(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-24">
          <Card className="max-w-lg mx-auto text-center py-12">
            <CardContent>
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Booking Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The booking you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Button asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">{booking.event_name}</h1>
              <p className="text-muted-foreground">Booking ID: {booking.id.slice(0, 8)}...</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className={getStatusStyle(booking.status)}>
                {booking.status}
              </Badge>
              <Badge variant="outline" className={getPaymentStatusStyle(booking.payment_status)}>
                {booking.payment_status === "paid" ? "Paid" : booking.payment_status}
              </Badge>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Event Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-muted-foreground">{formatDate(booking.event_date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-muted-foreground">
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Guest Count</p>
                    <p className="text-muted-foreground">{booking.guest_count} guests</p>
                  </div>
                </div>
                {booking.notes && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Notes</p>
                      <p className="text-muted-foreground">{booking.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">{formatPrice(booking.total_amount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Status</span>
                  <div className="flex items-center gap-2">
                    {booking.payment_status === "paid" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-yellow-500" />
                    )}
                    <span className="capitalize font-medium">
                      {booking.payment_status === "paid" ? "Paid" : booking.payment_status}
                    </span>
                  </div>
                </div>
                {booking.payment_reference && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-mono text-sm">{booking.payment_reference}</span>
                  </div>
                )}
                
                {booking.status === "pending" && booking.payment_status === "pending" && (
                  <Button 
                    variant="gold" 
                    className="w-full mt-4" 
                    onClick={handlePayNow}
                    disabled={isPayingNow}
                  >
                    {isPayingNow ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Hall Details */}
            {hall && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Venue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {hall.image_url && (
                      <img 
                        src={hall.image_url} 
                        alt={hall.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{hall.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{hall.description}</p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Capacity:</span> {hall.capacity} guests
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Price:</span> {formatPrice(hall.price_per_hour)}/hr
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Catering Details */}
            {cateringPackage && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                    Catering Package
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {cateringPackage.image_url && (
                      <img 
                        src={cateringPackage.image_url} 
                        alt={cateringPackage.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{cateringPackage.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{cateringPackage.description}</p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Price:</span> {formatPrice(cateringPackage.price_per_person)}/person
                      </p>
                      {cateringPackage.menu_items && cateringPackage.menu_items.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {cateringPackage.menu_items.slice(0, 4).map((item: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                          {cateringPackage.menu_items.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{cateringPackage.menu_items.length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Decoration Details */}
            {decorationPackage && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Decoration Package
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {decorationPackage.image_url && (
                      <img 
                        src={decorationPackage.image_url} 
                        alt={decorationPackage.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{decorationPackage.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{decorationPackage.description}</p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Style:</span> {decorationPackage.style}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Price:</span> {formatPrice(decorationPackage.price)}
                      </p>
                      {decorationPackage.features && decorationPackage.features.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {decorationPackage.features.map((feature: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Timestamps */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Created: {new Date(booking.created_at).toLocaleString()}</p>
            <p>Last updated: {new Date(booking.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingDetails;

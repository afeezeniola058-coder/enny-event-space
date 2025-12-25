import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Users, Clock, Utensils, Palette, Building2, Sparkles, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useHalls } from "@/hooks/useHalls";
import { useCateringPackages } from "@/hooks/useCateringPackages";
import { useDecorationPackages } from "@/hooks/useDecorationPackages";
import { cn } from "@/lib/utils";

const bookingSchema = z.object({
  eventName: z.string().trim().min(1, "Event name is required").max(100, "Event name too long"),
  eventDate: z.date({ required_error: "Event date is required" }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  guestCount: z.number().min(1, "At least 1 guest required").max(1000, "Maximum 1000 guests"),
  hallId: z.string().min(1, "Please select a venue"),
  cateringPackageId: z.string().optional(),
  decorationPackageId: z.string().optional(),
  notes: z.string().max(500, "Notes too long").optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
];

const Book = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  const { data: halls = [], isLoading: hallsLoading } = useHalls();
  const { data: cateringPackages = [], isLoading: cateringLoading } = useCateringPackages();
  const { data: decorationPackages = [], isLoading: decorationsLoading } = useDecorationPackages();

  const hallQueryParam = searchParams.get("hall") || "";
  // Validate UUID format before using
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hallQueryParam);
  const preselectedHallId = isValidUUID ? hallQueryParam : "";

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      eventName: "",
      startTime: "",
      endTime: "",
      guestCount: 50,
      hallId: preselectedHallId,
      cateringPackageId: "",
      decorationPackageId: "",
      notes: "",
    },
  });

  const selectedHallId = form.watch("hallId");
  const selectedCateringId = form.watch("cateringPackageId");
  const selectedDecorationId = form.watch("decorationPackageId");
  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");
  const guestCount = form.watch("guestCount");

  // Check authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ? { id: session.user.id } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Calculate total
  const calculateTotal = () => {
    let total = 0;

    const selectedHall = halls.find((h) => h.id === selectedHallId);
    if (selectedHall && startTime && endTime) {
      const hours = calculateHours(startTime, endTime);
      total += selectedHall.price_per_hour * hours;
    }

    const selectedCatering = cateringPackages.find((c) => c.id === selectedCateringId);
    if (selectedCatering) {
      total += selectedCatering.price_per_person * (guestCount || 0);
    }

    const selectedDecoration = decorationPackages.find((d) => d.id === selectedDecorationId);
    if (selectedDecoration) {
      total += selectedDecoration.price;
    }

    return total;
  };

  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [startH] = start.split(":").map(Number);
    const [endH] = end.split(":").map(Number);
    return Math.max(0, endH - startH);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const onSubmit = async (data: BookingFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to complete your booking.",
        variant: "destructive",
      });
      navigate("/auth?redirect=/book");
      return;
    }

    setIsSubmitting(true);

    try {
      const totalAmount = calculateTotal();

      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        event_name: data.eventName,
        event_date: format(data.eventDate, "yyyy-MM-dd"),
        start_time: data.startTime,
        end_time: data.endTime,
        guest_count: data.guestCount,
        hall_id: data.hallId,
        catering_package_id: data.cateringPackageId || null,
        decoration_package_id: data.decorationPackageId || null,
        notes: data.notes || null,
        total_amount: totalAmount,
        status: "pending",
        payment_status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Booking submitted!",
        description: "Your booking request has been submitted successfully.",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Booking failed",
        description: "There was an error submitting your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = hallsLoading || cateringLoading || decorationsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        {/* Header */}
        <section className="bg-gradient-hero py-12">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                Book Your
                <span className="text-gradient-gold block">Perfect Event</span>
              </h1>
              <p className="text-muted-foreground font-body text-lg">
                Select your venue, catering, and decorations to create an unforgettable experience.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Booking Form */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Form */}
              <div className="lg:col-span-2">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Event Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-display flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          Event Details
                        </CardTitle>
                        <CardDescription className="font-body">
                          Tell us about your event
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="eventName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Sarah's Wedding Reception" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="eventDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Event Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "PPP") : "Pick a date"}
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => date < new Date()}
                                      initialFocus
                                      className={cn("p-3 pointer-events-auto")}
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="guestCount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Number of Guests</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      className="pl-10"
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Time</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                      <SelectValue placeholder="Select start time" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {timeSlots.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="endTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Time</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                      <SelectValue placeholder="Select end time" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {timeSlots.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Venue Selection */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-display flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          Select Venue
                        </CardTitle>
                        <CardDescription className="font-body">
                          Choose the perfect space for your celebration
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FormField
                          control={form.control}
                          name="hallId"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="grid md:grid-cols-2 gap-4">
                                  {isLoading ? (
                                    <>
                                      <div className="h-32 bg-muted animate-pulse rounded-xl" />
                                      <div className="h-32 bg-muted animate-pulse rounded-xl" />
                                    </>
                                  ) : (
                                    halls.map((hall) => (
                                      <div
                                        key={hall.id}
                                        onClick={() => field.onChange(hall.id)}
                                        className={cn(
                                          "relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all",
                                          field.value === hall.id
                                            ? "border-primary ring-2 ring-primary/20"
                                            : "border-border hover:border-primary/50"
                                        )}
                                      >
                                        <div className="aspect-video relative">
                                          <img
                                            src={hall.image_url || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=400"}
                                            alt={hall.name}
                                            className="w-full h-full object-cover"
                                          />
                                          {field.value === hall.id && (
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                              <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                                                Selected
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        <div className="p-3">
                                          <h4 className="font-semibold text-foreground">{hall.name}</h4>
                                          <p className="text-sm text-muted-foreground">
                                            {formatPrice(hall.price_per_hour)}/hr • Up to {hall.capacity} guests
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* Catering Selection */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-display flex items-center gap-2">
                          <Utensils className="h-5 w-5 text-primary" />
                          Catering Package
                        </CardTitle>
                        <CardDescription className="font-body">
                          Optional: Add delicious food to your event
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FormField
                          control={form.control}
                          name="cateringPackageId"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div
                                    onClick={() => field.onChange("")}
                                    className={cn(
                                      "cursor-pointer rounded-xl border-2 p-4 transition-all",
                                      !field.value
                                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                    )}
                                  >
                                    <h4 className="font-semibold text-foreground">No Catering</h4>
                                    <p className="text-sm text-muted-foreground">I'll arrange my own catering</p>
                                  </div>
                                  {cateringPackages.map((pkg) => (
                                    <div
                                      key={pkg.id}
                                      onClick={() => field.onChange(pkg.id)}
                                      className={cn(
                                        "cursor-pointer rounded-xl overflow-hidden border-2 transition-all",
                                        field.value === pkg.id
                                          ? "border-primary ring-2 ring-primary/20"
                                          : "border-border hover:border-primary/50"
                                      )}
                                    >
                                      <div className="aspect-video relative">
                                        <img
                                          src={pkg.image_url || "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=400"}
                                          alt={pkg.name}
                                          className="w-full h-full object-cover"
                                        />
                                        {field.value === pkg.id && (
                                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                                              Selected
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      <div className="p-3">
                                        <h4 className="font-semibold text-foreground">{pkg.name}</h4>
                                        <p className="text-sm text-muted-foreground">
                                          {formatPrice(pkg.price_per_person)}/person
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* Decoration Selection */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-display flex items-center gap-2">
                          <Palette className="h-5 w-5 text-primary" />
                          Decoration Package
                        </CardTitle>
                        <CardDescription className="font-body">
                          Optional: Add stunning decorations
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FormField
                          control={form.control}
                          name="decorationPackageId"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div
                                    onClick={() => field.onChange("")}
                                    className={cn(
                                      "cursor-pointer rounded-xl border-2 p-4 transition-all",
                                      !field.value
                                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                    )}
                                  >
                                    <h4 className="font-semibold text-foreground">No Decorations</h4>
                                    <p className="text-sm text-muted-foreground">I'll handle decorations myself</p>
                                  </div>
                                  {decorationPackages.map((pkg) => (
                                    <div
                                      key={pkg.id}
                                      onClick={() => field.onChange(pkg.id)}
                                      className={cn(
                                        "cursor-pointer rounded-xl overflow-hidden border-2 transition-all",
                                        field.value === pkg.id
                                          ? "border-primary ring-2 ring-primary/20"
                                          : "border-border hover:border-primary/50"
                                      )}
                                    >
                                      <div className="aspect-video relative">
                                        <img
                                          src={pkg.image_url || "https://images.unsplash.com/photo-1478146896981-b80fe463b330?q=80&w=400"}
                                          alt={pkg.name}
                                          className="w-full h-full object-cover"
                                        />
                                        {field.value === pkg.id && (
                                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                                              Selected
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      <div className="p-3">
                                        <h4 className="font-semibold text-foreground">{pkg.name}</h4>
                                        <p className="text-sm text-muted-foreground">
                                          {formatPrice(pkg.price)} • {pkg.style}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-display">Additional Notes</CardTitle>
                        <CardDescription className="font-body">
                          Any special requests or requirements?
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  placeholder="e.g., Need wheelchair access, dietary restrictions, special setup..."
                                  className="min-h-24"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <Button
                      type="submit"
                      variant="hero"
                      size="xl"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Complete Booking"}
                    </Button>
                  </form>
                </Form>
              </div>

              {/* Summary Sidebar */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="sticky top-28"
                >
                  <Card className="border-primary/20">
                    <CardHeader className="bg-gradient-hero rounded-t-lg">
                      <CardTitle className="font-display">Booking Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {/* Selected Hall */}
                      {selectedHallId && (
                        <div className="pb-4 border-b border-border">
                          <p className="text-sm text-muted-foreground mb-1">Venue</p>
                          <p className="font-medium text-foreground">
                            {halls.find((h) => h.id === selectedHallId)?.name || "Loading..."}
                          </p>
                          {startTime && endTime && (
                            <p className="text-sm text-muted-foreground">
                              {calculateHours(startTime, endTime)} hours × {formatPrice(halls.find((h) => h.id === selectedHallId)?.price_per_hour || 0)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Selected Catering */}
                      {selectedCateringId && (
                        <div className="pb-4 border-b border-border">
                          <p className="text-sm text-muted-foreground mb-1">Catering</p>
                          <p className="font-medium text-foreground">
                            {cateringPackages.find((c) => c.id === selectedCateringId)?.name || "Loading..."}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {guestCount} guests × {formatPrice(cateringPackages.find((c) => c.id === selectedCateringId)?.price_per_person || 0)}
                          </p>
                        </div>
                      )}

                      {/* Selected Decoration */}
                      {selectedDecorationId && (
                        <div className="pb-4 border-b border-border">
                          <p className="text-sm text-muted-foreground mb-1">Decorations</p>
                          <p className="font-medium text-foreground">
                            {decorationPackages.find((d) => d.id === selectedDecorationId)?.name || "Loading..."}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(decorationPackages.find((d) => d.id === selectedDecorationId)?.price || 0)}
                          </p>
                        </div>
                      )}

                      {/* Total */}
                      <div className="pt-2">
                        <div className="flex justify-between items-center">
                          <p className="font-display text-lg text-foreground">Total</p>
                          <p className="font-display text-2xl font-bold text-primary">
                            {formatPrice(calculateTotal())}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Payment will be collected after confirmation
                        </p>
                      </div>

                      {!user && (
                        <div className="bg-muted/50 rounded-lg p-4 mt-4">
                          <p className="text-sm text-muted-foreground">
                            You'll need to sign in to complete your booking.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => navigate("/auth?redirect=/book")}
                          >
                            Sign In
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Book;

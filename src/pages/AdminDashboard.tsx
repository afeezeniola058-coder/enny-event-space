import { useAdminRole } from '@/hooks/useAdminRole';
import { Navigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, CalendarDays, Building2, UtensilsCrossed, Sparkles, Mail, BarChart3, Shield, Star, Bell, Image, Tag, LineChart, Users } from 'lucide-react';
import BookingsManagement from '@/components/admin/BookingsManagement';
import HallsManagement from '@/components/admin/HallsManagement';
import CateringManagement from '@/components/admin/CateringManagement';
import DecorationsManagement from '@/components/admin/DecorationsManagement';
import EmailDeliverabilityGuide from '@/components/admin/EmailDeliverabilityGuide';
import { EmailAnalytics } from '@/components/admin/EmailAnalytics';
import UserRolesManagement from '@/components/admin/UserRolesManagement';
import ReviewsManagement from '@/components/admin/ReviewsManagement';
import RemindersManagement from '@/components/admin/RemindersManagement';
import PastEventsManagement from '@/components/admin/PastEventsManagement';
import PromoCodesManagement from '@/components/admin/PromoCodesManagement';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import WaitlistManagement from '@/components/admin/WaitlistManagement';

const AdminDashboard = () => {
  const { isAdmin, loading: roleLoading } = useAdminRole();

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <Tabs defaultValue="bookings" className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 pb-2 scrollbar-thin">
            <TabsList className="inline-flex w-max gap-1 lg:grid lg:w-full lg:grid-cols-[repeat(13,minmax(0,1fr))]">
              <TabsTrigger value="bookings" className="flex items-center gap-2 whitespace-nowrap">
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Bookings</span>
              </TabsTrigger>
              <TabsTrigger value="halls" className="flex items-center gap-2 whitespace-nowrap">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Halls</span>
              </TabsTrigger>
              <TabsTrigger value="catering" className="flex items-center gap-2 whitespace-nowrap">
                <UtensilsCrossed className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Catering</span>
              </TabsTrigger>
              <TabsTrigger value="decorations" className="flex items-center gap-2 whitespace-nowrap">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Decor</span>
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center gap-2 whitespace-nowrap">
                <Image className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Gallery</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center gap-2 whitespace-nowrap">
                <Star className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Reviews</span>
              </TabsTrigger>
              <TabsTrigger value="reminders" className="flex items-center gap-2 whitespace-nowrap">
                <Bell className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Reminders</span>
              </TabsTrigger>
              <TabsTrigger value="waitlist" className="flex items-center gap-2 whitespace-nowrap">
                <Users className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Waitlist</span>
              </TabsTrigger>
              <TabsTrigger value="promos" className="flex items-center gap-2 whitespace-nowrap">
                <Tag className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Promos</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2 whitespace-nowrap">
                <Shield className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2 whitespace-nowrap">
                <LineChart className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Insights</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 whitespace-nowrap">
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Email Stats</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2 whitespace-nowrap">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Email</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="bookings">
            <BookingsManagement />
          </TabsContent>

          <TabsContent value="halls">
            <HallsManagement />
          </TabsContent>

          <TabsContent value="catering">
            <CateringManagement />
          </TabsContent>

          <TabsContent value="decorations">
            <DecorationsManagement />
          </TabsContent>

          <TabsContent value="gallery">
            <PastEventsManagement />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsManagement />
          </TabsContent>

          <TabsContent value="reminders">
            <RemindersManagement />
          </TabsContent>

          <TabsContent value="promos">
            <PromoCodesManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserRolesManagement />
          </TabsContent>

          <TabsContent value="insights">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="analytics">
            <EmailAnalytics />
          </TabsContent>

          <TabsContent value="email">
            <EmailDeliverabilityGuide />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;

import { useAdminRole } from '@/hooks/useAdminRole';
import { Navigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, CalendarDays, Building2, UtensilsCrossed, Sparkles, Mail, BarChart3, Shield, Star, Bell } from 'lucide-react';
import BookingsManagement from '@/components/admin/BookingsManagement';
import HallsManagement from '@/components/admin/HallsManagement';
import CateringManagement from '@/components/admin/CateringManagement';
import DecorationsManagement from '@/components/admin/DecorationsManagement';
import EmailDeliverabilityGuide from '@/components/admin/EmailDeliverabilityGuide';
import { EmailAnalytics } from '@/components/admin/EmailAnalytics';
import UserRolesManagement from '@/components/admin/UserRolesManagement';
import ReviewsManagement from '@/components/admin/ReviewsManagement';
import RemindersManagement from '@/components/admin/RemindersManagement';

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
          <TabsList className="grid w-full grid-cols-9 lg:w-auto lg:inline-grid">
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="halls" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Halls</span>
            </TabsTrigger>
            <TabsTrigger value="catering" className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              <span className="hidden sm:inline">Catering</span>
            </TabsTrigger>
            <TabsTrigger value="decorations" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Decorations</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Reminders</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email Setup</span>
            </TabsTrigger>
          </TabsList>

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

          <TabsContent value="reviews">
            <ReviewsManagement />
          </TabsContent>

          <TabsContent value="reminders">
            <RemindersManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserRolesManagement />
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

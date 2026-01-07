import { useAdminRole } from '@/hooks/useAdminRole';
import { Navigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, CalendarDays, Building2, UtensilsCrossed, Sparkles, Mail } from 'lucide-react';
import BookingsManagement from '@/components/admin/BookingsManagement';
import HallsManagement from '@/components/admin/HallsManagement';
import CateringManagement from '@/components/admin/CateringManagement';
import DecorationsManagement from '@/components/admin/DecorationsManagement';
import EmailDeliverabilityGuide from '@/components/admin/EmailDeliverabilityGuide';

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
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
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
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
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

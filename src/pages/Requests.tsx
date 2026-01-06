import { useState, useEffect } from "react";
import { Inbox, Send, Loader2, RefreshCw, AlertCircle, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RequestCard } from "@/components/RequestCard";
import { EmptyState } from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  SessionRequest
} from "@/lib/api";

// Explicit status states - NO AMBIGUITY
type PageStatus = 'loading' | 'ready' | 'index-building' | 'error';

export default function Requests() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Data state
  const [incomingRequests, setIncomingRequests] = useState<SessionRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<SessionRequest[]>([]);

  // Explicit status state machine
  const [status, setStatus] = useState<PageStatus>('loading');

  // Fetch requests - called ONLY on mount or manual refresh
  const fetchRequests = async () => {
    if (!user?.id) return;

    setStatus('loading');
    try {
      console.log('🔥 [Requests] Fetching requests for user:', user.id);
      const response = await getRequests(user.id);

      setIncomingRequests(response.data.incoming);
      setOutgoingRequests(response.data.outgoing);
      setStatus('ready');

      console.log('✅ [Requests] Fetched:', {
        incoming: response.data.incoming.length,
        outgoing: response.data.outgoing.length,
      });
    } catch (error: any) {
      console.error('❌ [Requests] Error:', error);

      // Check for INDEX_BUILDING (503) - Firestore composite index not ready
      if (
        error.message?.includes("503") ||
        error.message?.includes("index") ||
        error.message?.includes("INDEX_BUILDING")
      ) {
        console.log('⏳ [Requests] Index building detected, showing info state');
        setStatus('index-building');
      } else {
        setStatus('error');
        toast({
          title: "Error",
          description: "Failed to load requests.",
          variant: "destructive",
        });
      }
    }
  };

  // Fetch ONLY on mount - NO auto-refetch on focus during index building
  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Only add focus listener when status is 'ready' - prevents loops during index building
  useEffect(() => {
    if (status !== 'ready') return;

    const handleFocus = () => {
      console.log('📌 [Requests] Window focused, refetching');
      fetchRequests();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user?.id]);

  // Action handlers
  const handleAccept = async (id: string) => {
    if (!user?.id) return;
    try {
      await acceptRequest(user.id, id);
      await fetchRequests();
      toast({ title: "Request accepted!", description: "Open the request to confirm." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to accept.", variant: "destructive" });
    }
  };

  const handleReject = async (id: string) => {
    if (!user?.id) return;
    try {
      await rejectRequest(user.id, id);
      await fetchRequests();
      toast({ title: "Request declined" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to reject.", variant: "destructive" });
    }
  };

  const handleCancel = async (id: string) => {
    if (!user?.id) return;
    try {
      await cancelRequest(user.id, id);
      await fetchRequests();
      toast({ title: "Request cancelled" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to cancel.", variant: "destructive" });
    }
  };

  // === RENDER BASED ON STATUS ===

  // LOADING STATE
  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading requests...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // INDEX BUILDING STATE - NO AUTO-RETRY
  if (status === 'index-building') {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Requests</h1>
            <p className="text-muted-foreground mt-1">Manage your session requests</p>
          </div>

          <Card className="border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-amber-600 dark:text-amber-400 mb-4" />
              <h2 className="text-xl font-semibold text-amber-800 dark:text-amber-200">
                Requests are initializing
              </h2>
              <p className="text-amber-700 dark:text-amber-300 mt-2 max-w-md">
                This is a one-time setup that takes a few minutes.
                <br />The database is creating indexes for your requests.
              </p>
              <Button
                variant="outline"
                className="mt-6 gap-2 border-amber-400 text-amber-700 hover:bg-amber-100"
                onClick={fetchRequests}
              >
                <RefreshCw className="h-4 w-4" />
                Check again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ERROR STATE
  if (status === 'error') {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Requests</h1>
            <p className="text-muted-foreground mt-1">Manage your session requests</p>
          </div>

          <Card className="border-2 border-red-300 bg-red-50 dark:bg-red-950/30">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400 mb-4" />
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">
                Failed to load requests
              </h2>
              <p className="text-red-700 dark:text-red-300 mt-2">
                Please check your connection and try again.
              </p>
              <Button
                variant="outline"
                className="mt-6 gap-2 border-red-400 text-red-700 hover:bg-red-100"
                onClick={fetchRequests}
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // READY STATE - Normal UI
  const pendingIncoming = incomingRequests.filter(r => r.status === 'pending');
  const pendingOutgoing = outgoingRequests.filter(r => r.status === 'pending');

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Requests</h1>
            <p className="text-muted-foreground mt-1">Manage your session requests</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRequests} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="incoming" className="gap-2">
              <Inbox className="h-4 w-4" />
              Incoming
              {pendingIncoming.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingIncoming.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="gap-2">
              <Send className="h-4 w-4" />
              Outgoing
              {pendingOutgoing.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingOutgoing.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="mt-6">
            {incomingRequests.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No incoming requests"
                description="When someone wants to learn from you, their request will appear here."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {incomingRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    type="incoming"
                    onAccept={() => handleAccept(request.id)}
                    onReject={() => handleReject(request.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="outgoing" className="mt-6">
            {outgoingRequests.length === 0 ? (
              <EmptyState
                icon={Send}
                title="No outgoing requests"
                description="Requests you send to teachers will appear here."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {outgoingRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    type="outgoing"
                    onCancel={() => handleCancel(request.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

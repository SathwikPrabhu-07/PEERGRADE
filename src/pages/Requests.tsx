import { useState } from "react";
import { Inbox, Send } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RequestCard } from "@/components/RequestCard";
import { EmptyState } from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Mock data
const initialIncomingRequests = [
  {
    id: "1",
    user: { name: "Sarah Miller", avatar: "" },
    skill: "Python Programming",
    message: "Hi! I'm looking to improve my Python skills for data science. Would love to learn from you!",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "2",
    user: { name: "James Wilson", avatar: "" },
    skill: "UI/UX Design",
    message: "I'm a developer looking to improve my design skills. Your portfolio looks amazing!",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
];

const initialOutgoingRequests = [
  {
    id: "3",
    user: { name: "Alex Chen", avatar: "" },
    skill: "Machine Learning",
    message: "I'd love to learn ML basics from you. I have a strong Python background.",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function Requests() {
  const [incomingRequests, setIncomingRequests] = useState(initialIncomingRequests);
  const [outgoingRequests, setOutgoingRequests] = useState(initialOutgoingRequests);
  const { toast } = useToast();

  const handleAccept = (id: string) => {
    setIncomingRequests(incomingRequests.filter((r) => r.id !== id));
    toast({
      title: "Request accepted!",
      description: "A new session has been scheduled.",
    });
  };

  const handleReject = (id: string) => {
    setIncomingRequests(incomingRequests.filter((r) => r.id !== id));
    toast({
      title: "Request declined",
      description: "The request has been declined.",
    });
  };

  const handleCancel = (id: string) => {
    setOutgoingRequests(outgoingRequests.filter((r) => r.id !== id));
    toast({
      title: "Request cancelled",
      description: "Your request has been cancelled.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage your session requests
          </p>
        </div>

        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="incoming" className="gap-2">
              <Inbox className="h-4 w-4" />
              Incoming
              {incomingRequests.length > 0 && (
                <Badge className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs gradient-primary text-primary-foreground">
                  {incomingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="gap-2">
              <Send className="h-4 w-4" />
              Outgoing
              {outgoingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {outgoingRequests.length}
                </Badge>
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
              <div className="grid gap-4 max-w-2xl">
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
                description="Your pending session requests will appear here."
              />
            ) : (
              <div className="grid gap-4 max-w-2xl">
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

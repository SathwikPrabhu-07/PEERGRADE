import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, CheckCircle2, Users, User } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
    getRequestDetail,
    getMessages,
    sendMessage as sendMessageApi,
    acceptRequest,
    confirmRequest as confirmRequestApi,
    SessionRequest,
    Message,
} from "@/lib/api";

export default function RequestDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [request, setRequest] = useState<SessionRequest | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [messagesIndexBuilding, setMessagesIndexBuilding] = useState(false);

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState({
        open: false,
        mode: "single" as "single" | "mutual",
        learnerSkill: "",
    });

    // Fetch messages only (for polling)
    const fetchMessages = useCallback(async () => {
        if (!user?.id || !id) return;

        try {
            const messagesRes = await getMessages(user.id, id);
            setMessages(messagesRes.data);
            setMessagesIndexBuilding(false);
        } catch (error: any) {
            // Silently handle errors during polling
            if (error.message?.includes("503") || error.message?.includes("index")) {
                setMessagesIndexBuilding(true);
            }
        }
    }, [user?.id, id]);

    // Fetch all data (request + messages)
    const fetchData = useCallback(async () => {
        if (!user?.id || !id) return;

        try {
            // Fetch request details
            const requestRes = await getRequestDetail(user.id, id);
            setRequest(requestRes.data);
        } catch (error: any) {
            console.error("[RequestDetail] Error fetching request:", error);
            toast({
                title: "Error",
                description: "Failed to load request details.",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        // Fetch messages separately to handle 503 gracefully
        await fetchMessages();

        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, id, fetchMessages]);

    // Initial fetch
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, id]);

    // Poll messages every 10 seconds while page is open
    // Stop polling if index is building or no request loaded
    useEffect(() => {
        if (messagesIndexBuilding || !request) {
            return; // Don't poll during index building or before request loads
        }

        const pollInterval = setInterval(() => {
            console.log('[RequestDetail] Polling messages');
            fetchMessages();
        }, 10000); // 10 seconds

        return () => clearInterval(pollInterval);
    }, [fetchMessages, messagesIndexBuilding, request]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!user?.id || !id || !newMessage.trim()) return;

        setIsSending(true);
        try {
            const response = await sendMessageApi(user.id, id, newMessage.trim());
            setMessages([...messages, response.data]);
            setNewMessage("");
        } catch (error) {
            console.error("[RequestDetail] Error sending message:", error);
            toast({
                title: "Error",
                description: "Failed to send message.",
                variant: "destructive",
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleAccept = async () => {
        if (!user?.id || !id) return;

        try {
            await acceptRequest(user.id, id);
            setRequest({ ...request!, status: "accepted" });
            toast({
                title: "Request accepted!",
                description: "Now confirm the learning mode to create a session.",
            });
        } catch (error) {
            console.error("[RequestDetail] Error accepting:", error);
            toast({
                title: "Error",
                description: "Failed to accept request.",
                variant: "destructive",
            });
        }
    };

    const handleConfirm = async () => {
        if (!user?.id || !id || !request) return;

        try {
            await confirmRequestApi(user.id, id, {
                mode: confirmModal.mode,
                teacherSkill: request.teacherSkill || request.skillName,
                learnerSkill: confirmModal.mode === "mutual" ? confirmModal.learnerSkill : undefined,
            });

            toast({
                title: "Session created!",
                description: confirmModal.mode === "mutual"
                    ? "Mutual learning session created. You'll both teach and learn!"
                    : "Learning session created. Check Sessions to schedule.",
            });

            setConfirmModal({ open: false, mode: "single", learnerSkill: "" });
            navigate("/sessions");
        } catch (error: any) {
            console.error("[RequestDetail] Error confirming:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to confirm request.",
                variant: "destructive",
            });
        }
    };

    const isTeacher = user?.id === request?.toUserId;
    const otherUser = isTeacher
        ? { id: request?.fromUserId, name: request?.fromUserName }
        : { id: request?.toUserId, name: request?.toUserName };

    const initials = otherUser.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "?";

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!request) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Request not found</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/requests")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Request Details</h1>
                        <p className="text-muted-foreground">
                            {isTeacher ? "From" : "To"} {otherUser.name}
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Left: Request Info */}
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-lg">Request Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{otherUser.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {isTeacher ? "Wants to learn from you" : "You want to learn from"}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">Skill</p>
                                <Badge variant="secondary" className="mt-1">
                                    {request.skillName}
                                </Badge>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge
                                    variant={request.status === "accepted" ? "default" : "outline"}
                                    className="mt-1"
                                >
                                    {request.status}
                                </Badge>
                            </div>

                            {request.message && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Initial Message</p>
                                    <p className="text-sm mt-1 bg-muted p-2 rounded">"{request.message}"</p>
                                </div>
                            )}

                            {/* Other user's skills (for mutual learning) */}
                            {request.otherUserSkills && request.otherUserSkills.length > 0 && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {otherUser.name}'s Teaching Skills
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {request.otherUserSkills.map((skill) => (
                                            <Badge key={skill.id} variant="outline" className="text-xs">
                                                {skill.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="pt-4 space-y-2">
                                {isTeacher && request.status === "pending" && (
                                    <Button className="w-full" onClick={handleAccept}>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Accept Request
                                    </Button>
                                )}

                                {request.status === "accepted" && !request.confirmed && (
                                    <Button
                                        className="w-full"
                                        onClick={() => setConfirmModal({ ...confirmModal, open: true })}
                                    >
                                        <Users className="h-4 w-4 mr-2" />
                                        Confirm Learning Mode
                                    </Button>
                                )}

                                {request.confirmed && (
                                    <div className="text-center p-3 bg-success/10 rounded-lg">
                                        <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
                                        <p className="text-sm text-success font-medium">
                                            {request.mode === "mutual" ? "Mutual" : "Single"} Learning Confirmed
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right: Chat */}
                    <Card className="md:col-span-2 flex flex-col h-[500px]">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Messages</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col overflow-hidden">
                            {/* Messages list */}
                            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                                {messagesIndexBuilding ? (
                                    <div className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                                        <p className="text-muted-foreground">Messages are loading...</p>
                                        <p className="text-sm text-muted-foreground">Please refresh in a moment.</p>
                                        <Button variant="outline" size="sm" className="mt-3" onClick={() => fetchData()}>
                                            Refresh
                                        </Button>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">
                                        <p>No messages yet</p>
                                        <p className="text-sm">Start the conversation!</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isOwn = msg.fromUserId === user?.id;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] rounded-lg px-3 py-2 ${isOwn
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted"
                                                        }`}
                                                >
                                                    <p className="text-sm">{msg.text}</p>
                                                    <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message input */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                                    disabled={isSending}
                                />
                                <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Dialog open={confirmModal.open} onOpenChange={(open) => setConfirmModal({ ...confirmModal, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Learning Mode</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <RadioGroup
                            value={confirmModal.mode}
                            onValueChange={(value) => setConfirmModal({ ...confirmModal, mode: value as "single" | "mutual" })}
                        >
                            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                <RadioGroupItem value="single" id="single" className="mt-1" />
                                <div className="flex-1">
                                    <Label htmlFor="single" className="flex items-center gap-2 cursor-pointer">
                                        <User className="h-4 w-4" />
                                        Single Learning
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        One person teaches, one person learns. Only the learner receives an exercise.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                <RadioGroupItem value="mutual" id="mutual" className="mt-1" />
                                <div className="flex-1">
                                    <Label htmlFor="mutual" className="flex items-center gap-2 cursor-pointer">
                                        <Users className="h-4 w-4" />
                                        Mutual Learning (Peer Swap)
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Both teach and learn from each other. Both receive exercises for their learning skills.
                                    </p>
                                </div>
                            </div>
                        </RadioGroup>

                        {confirmModal.mode === "mutual" && request.otherUserSkills && request.otherUserSkills.length > 0 && (
                            <div className="space-y-2">
                                <Label>Select skill {otherUser.name} will teach you</Label>
                                <Select
                                    value={confirmModal.learnerSkill}
                                    onValueChange={(value) => setConfirmModal({ ...confirmModal, learnerSkill: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a skill..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {request.otherUserSkills.map((skill) => (
                                            <SelectItem key={skill.id} value={skill.name}>
                                                {skill.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmModal({ ...confirmModal, open: false })}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={confirmModal.mode === "mutual" && !confirmModal.learnerSkill}
                        >
                            Create Session
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

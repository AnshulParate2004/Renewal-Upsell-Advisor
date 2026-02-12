import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon, UserPlus } from "lucide-react";

const integrations = [
  { name: "Salesforce", status: "connected", lastSync: "5 minutes ago" },
  { name: "Stripe", status: "connected", lastSync: "12 minutes ago" },
  { name: "Twilio", status: "connected", lastSync: "1 hour ago" },
  { name: "HubSpot", status: "not_connected", lastSync: null },
  { name: "Zendesk", status: "not_connected", lastSync: null },
];

const teamMembers = [
  { name: "Sarah Chen", email: "sarah@s007.io", role: "Admin", accounts: 4 },
  { name: "James Wilson", email: "james@s007.io", role: "CSM", accounts: 4 },
  { name: "Maria Lopez", email: "maria@s007.io", role: "CSM", accounts: 4 },
  { name: "Alex Rivera", email: "alex@s007.io", role: "Viewer", accounts: 0 },
];

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const [notifications, setNotifications] = useState({
    highRisk: true, renewals: true, daily: false, failedCalls: true,
    realtime: true, aiInsights: true, sysUpdates: false,
  });

  const toggleNotif = (key: keyof typeof notifications) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Appearance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Theme</Label>
                <Button variant="outline" size="sm" onClick={toggle}>
                  {theme === "dark" ? <><Sun className="h-4 w-4 mr-2" /> Light Mode</> : <><Moon className="h-4 w-4 mr-2" /> Dark Mode</>}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <Label>Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Timezone</Label>
                <Select defaultValue="utc-8">
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc-8">PST (UTC-8)</SelectItem>
                    <SelectItem value="utc-5">EST (UTC-5)</SelectItem>
                    <SelectItem value="utc+0">UTC</SelectItem>
                    <SelectItem value="utc+1">CET (UTC+1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {integrations.map((int) => (
              <Card key={int.name}>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">{int.name}</h3>
                    <Badge variant={int.status === "connected" ? "default" : "outline"}
                      className={int.status === "connected" ? "bg-success text-success-foreground" : ""}>
                      {int.status === "connected" ? "✅ Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  {int.lastSync && <p className="text-xs text-muted-foreground mb-3">Last sync: {int.lastSync}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs">Configure</Button>
                    <Button size="sm" variant={int.status === "connected" ? "ghost" : "default"} className="text-xs">
                      {int.status === "connected" ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg">Email Notifications</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {([["highRisk", "High-risk account alerts"], ["renewals", "Renewal reminders (T-30/60/90)"], ["daily", "Daily digest"], ["failedCalls", "Failed voice calls"]] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm">{label}</Label>
                    <Switch checked={notifications[key]} onCheckedChange={() => toggleNotif(key)} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">In-App Notifications</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {([["realtime", "Real-time alerts"], ["aiInsights", "AI insights"], ["sysUpdates", "System updates"]] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm">{label}</Label>
                    <Switch checked={notifications[key]} onCheckedChange={() => toggleNotif(key)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Team Members</CardTitle>
              <Button size="sm"><UserPlus className="h-4 w-4 mr-1" /> Invite</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Accounts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((m) => (
                    <TableRow key={m.email}>
                      <TableCell className="font-medium text-sm">{m.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.email}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{m.role}</Badge></TableCell>
                      <TableCell className="font-mono text-sm">{m.accounts}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

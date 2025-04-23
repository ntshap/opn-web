"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"

export function SettingsTabs() {
  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully.",
    })
  }

  return (
    <Tabs defaultValue="account" className="space-y-4">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      <TabsContent value="account">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Account Settings</h3>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="john@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" defaultValue="Administrator" disabled />
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email notifications for important updates</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">Receive marketing and promotional emails</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="appearance">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Appearance Settings</h3>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="theme">Theme</Label>
              <Select defaultValue="system">
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="density">Density</Label>
              <Select defaultValue="normal">
                <SelectTrigger>
                  <SelectValue placeholder="Select density" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Security Settings</h3>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  )
}


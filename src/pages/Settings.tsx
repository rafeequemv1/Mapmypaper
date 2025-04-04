
import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BellIcon, EyeIcon, DownloadIcon, GlobeIcon, ZapIcon, LogOutIcon } from "lucide-react";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    email: true,
    updates: false,
    newsletter: false
  });
  const [appearance, setAppearance] = useState({
    compactView: false,
    highContrast: false
  });
  const [accessibility, setAccessibility] = useState({
    reduceMotion: false,
    largerText: false
  });
  
  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      
      toast({
        title: "Notification settings updated",
        description: `You've ${updated[key] ? 'enabled' : 'disabled'} ${key} notifications.`,
      });
      
      return updated;
    });
  };
  
  const handleAppearanceChange = (key: keyof typeof appearance) => {
    setAppearance(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      
      toast({
        title: "Appearance settings updated",
        description: `You've ${updated[key] ? 'enabled' : 'disabled'} ${key}.`,
      });
      
      return updated;
    });
  };
  
  const handleAccessibilityChange = (key: keyof typeof accessibility) => {
    setAccessibility(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      
      toast({
        title: "Accessibility settings updated",
        description: `You've ${updated[key] ? 'enabled' : 'disabled'} ${key}.`,
      });
      
      return updated;
    });
  };
  
  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PageHeader />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Not Signed In</CardTitle>
              <CardDescription>Please sign in to access settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.href = "/auth"} className="w-full">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageHeader showBackButton={true} />
      
      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Manage your account settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-1">
                      <h3 className="font-medium flex items-center gap-2">
                        <GlobeIcon className="h-4 w-4" />
                        Language
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Select your preferred language for the interface
                      </p>
                    </div>
                    <div className="ml-6">
                      <select 
                        className="w-full max-w-xs p-2 rounded-md border border-input bg-background"
                        defaultValue="en"
                        onChange={() => {
                          toast({
                            title: "Language preference updated",
                            description: "Your language preference has been saved.",
                          });
                        }}
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="zh">Chinese</option>
                        <option value="jp">Japanese</option>
                        <option value="ko">Korean</option>
                      </select>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-1">
                      <h3 className="font-medium flex items-center gap-2">
                        <DownloadIcon className="h-4 w-4" />
                        Export Preferences
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Set your default export format for mind maps
                      </p>
                    </div>
                    <div className="ml-6">
                      <select 
                        className="w-full max-w-xs p-2 rounded-md border border-input bg-background"
                        defaultValue="png"
                        onChange={() => {
                          toast({
                            title: "Export preference updated",
                            description: "Your default export format has been updated.",
                          });
                        }}
                      >
                        <option value="png">PNG Image</option>
                        <option value="svg">SVG Vector</option>
                        <option value="pdf">PDF Document</option>
                        <option value="json">JSON Data</option>
                      </select>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="pt-2">
                    <Button 
                      variant="destructive" 
                      onClick={handleLogout}
                      className="flex items-center gap-2"
                    >
                      <LogOutIcon className="h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BellIcon className="h-5 w-5" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>
                    Control when and how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notifications.email}
                      onCheckedChange={() => handleNotificationChange('email')}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="update-notifications">Product Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about new features and improvements
                      </p>
                    </div>
                    <Switch
                      id="update-notifications"
                      checked={notifications.updates}
                      onCheckedChange={() => handleNotificationChange('updates')}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="newsletter">Newsletter</Label>
                      <p className="text-sm text-muted-foreground">
                        Subscribe to our monthly newsletter
                      </p>
                    </div>
                    <Switch
                      id="newsletter"
                      checked={notifications.newsletter}
                      onCheckedChange={() => handleNotificationChange('newsletter')}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <EyeIcon className="h-5 w-5" />
                    Appearance Settings
                  </CardTitle>
                  <CardDescription>
                    Customize how MapMyPaper looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="compact-view">Compact View</Label>
                      <p className="text-sm text-muted-foreground">
                        Use a more compact layout for the interface
                      </p>
                    </div>
                    <Switch
                      id="compact-view"
                      checked={appearance.compactView}
                      onCheckedChange={() => handleAppearanceChange('compactView')}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="high-contrast">High Contrast</Label>
                      <p className="text-sm text-muted-foreground">
                        Increase contrast for better visibility
                      </p>
                    </div>
                    <Switch
                      id="high-contrast"
                      checked={appearance.highContrast}
                      onCheckedChange={() => handleAppearanceChange('highContrast')}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="accessibility">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ZapIcon className="h-5 w-5" />
                    Accessibility Settings
                  </CardTitle>
                  <CardDescription>
                    Make MapMyPaper easier to use for everyone
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reduce-motion">Reduce Motion</Label>
                      <p className="text-sm text-muted-foreground">
                        Minimize animations throughout the interface
                      </p>
                    </div>
                    <Switch
                      id="reduce-motion"
                      checked={accessibility.reduceMotion}
                      onCheckedChange={() => handleAccessibilityChange('reduceMotion')}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="larger-text">Larger Text</Label>
                      <p className="text-sm text-muted-foreground">
                        Increase text size for better readability
                      </p>
                    </div>
                    <Switch
                      id="larger-text"
                      checked={accessibility.largerText}
                      onCheckedChange={() => handleAccessibilityChange('largerText')}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Settings;

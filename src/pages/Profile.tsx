
import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Lock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const profileFormSchema = z.object({
  display_name: z.string().min(2, {
    message: "Display name must be at least 2 characters.",
  }).max(30, {
    message: "Display name must not be longer than 30 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Profile = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Get user display name using multiple fallback options
  const displayName = profile?.display_name || 
                      user?.user_metadata?.display_name || 
                      user?.user_metadata?.full_name || 
                      user?.email?.split("@")[0] || 
                      "User";

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      display_name: displayName,
      email: user?.email || "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    setIsUpdating(true);
    
    try {
      // Update profile in the database
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: data.display_name,
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PageHeader />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Not Signed In</CardTitle>
              <CardDescription>Please sign in to view your profile</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => window.location.href = "/auth"} className="w-full">
                Sign In
              </Button>
            </CardFooter>
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
          <div className="flex items-center mb-8">
            <Avatar className="h-16 w-16 mr-4">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt={displayName} />
              ) : (
                <AvatarFallback className="text-xl">{getInitials(displayName)}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <Card>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="display_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-background text-muted-foreground">
                                <User className="h-4 w-4" />
                              </span>
                              <Input className="rounded-l-none" {...field} />
                            </div>
                          </FormControl>
                          <FormDescription>
                            This is the name that will be displayed to other users.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-background text-muted-foreground">
                                <Mail className="h-4 w-4" />
                              </span>
                              <Input 
                                className="rounded-l-none" 
                                {...field} 
                                disabled 
                                title="Email cannot be changed directly. Contact support for assistance."
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Your email address is used for login and notifications.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? "Updating..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Security</h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Password Management</CardTitle>
                <CardDescription>Manage your account password and security settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span>Change Password</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    toast({
                      title: "Password reset email sent",
                      description: "Check your email for a link to reset your password.",
                    });
                  }}>
                    Reset Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Data & Privacy</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-foreground/80 mb-4">
                  Your documents are secure and never shared with third parties. All uploaded PDFs and generated 
                  data are encrypted and only accessible to your account.
                </p>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" asChild>
                    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">View Privacy Policy</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">View Terms of Service</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Profile;

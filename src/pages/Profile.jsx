import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../components/ui/card';
import { User, Mail, Shield, Save, Loader2, Edit2 } from 'lucide-react';

export default function Profile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                role: user.role || 'developer'
            });
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Name cannot be empty');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ name: formData.name })
                .eq('user_id', user.id);

            if (error) throw error;

            toast.success('Profile updated successfully! Refresh to see changes in header.');
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8">User Profile</h1>

                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Manage your public profile details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    Email Address
                                </label>
                                <div className="p-3 bg-secondary/50 rounded-lg text-sm font-mono text-muted-foreground">
                                    {formData.email}
                                </div>
                                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    Role
                                </label>
                                <div className="p-3 bg-secondary/50 rounded-lg text-sm uppercase font-semibold tracking-wide text-primary w-fit">
                                    {formData.role}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    Display Name
                                </label>
                                {isEditing ? (
                                    <form id="profile-form" onSubmit={handleUpdateProfile}>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter your name"
                                            className="max-w-md"
                                        />
                                    </form>
                                ) : (
                                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-transparent hover:border-border transition-colors">
                                        <span className="font-medium">{formData.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsEditing(true)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-end gap-3 border-t bg-secondary/10 p-6">
                            {isEditing ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({ ...formData, name: user.name || '' });
                                        }}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        form="profile-form"
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        Save Changes
                                    </Button>
                                </>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">
                                    Click the edit icon next to your name to change it
                                </p>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}

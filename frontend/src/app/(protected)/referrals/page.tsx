'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Link2,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Linkedin,
  Twitter,
  Zap,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReferralStats {
  total_referrals: number;
  paid_converted: number;
  scans_earned: number;
  referral_code: string;
}

interface ReferredUser {
  email: string;
  status: string;
  created_at: string;
}

export default function ReferralsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchReferralData();
  }, []);

  async function fetchReferralData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    if (!profile) {
      setLoading(false);
      return;
    }

    const { data: events } = await supabase
      .from('referral_events')
      .select('*')
      .eq('referrer_id', user.id);

    const totalReferrals = events?.filter((e) => e.event_type === 'signup').length || 0;
    const paidConverted = events?.filter((e) => e.event_type === 'purchase').length || 0;
    const scansEarned = events?.reduce((sum, e) => sum + (e.scans_awarded || 0), 0) || 0;

    setStats({
      total_referrals: totalReferrals,
      paid_converted: paidConverted,
      scans_earned: scansEarned,
      referral_code: profile.referral_code,
    });

    const { data: referred } = await supabase
      .from('profiles')
      .select('email, referred_at, created_at')
      .eq('referred_by', profile.referral_code)
      .order('created_at', { ascending: false });

    if (referred) {
      setReferredUsers(
        referred.map((r) => ({
          email: r.email ? r.email.substring(0, 3) + '***' : '***',
          status: r.referred_at ? 'Signed up' : 'Signed up',
          created_at: r.created_at,
        }))
      );
    }

    setLoading(false);
  }

  async function copyLink() {
    if (!stats?.referral_code) return;
    const link = `https://craftlycv.in/r/${stats.referral_code}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  const referralLink = stats?.referral_code
    ? `https://craftlycv.in/r/${stats.referral_code}`
    : '';

  const progress = Math.min((stats?.total_referrals || 0) / 5, 1);
  const scansForBonus = stats?.total_referrals || 0;

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
          <Users className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Referrals</h1>
          <p className="text-muted-foreground">
            Earn bonus scans by referring friends
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-3xl font-bold">{stats?.total_referrals || 0}</p>
              </div>
              <Users className="h-10 w-10 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid Conversions</p>
                <p className="text-3xl font-bold">{stats?.paid_converted || 0}</p>
              </div>
              <Zap className="h-10 w-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scans Earned</p>
                <p className="text-3xl font-bold">{stats?.scans_earned || 0}</p>
              </div>
              <Zap className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Your Referral Link</h2>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="font-mono"
              onClick={(e) => e.currentTarget.select()}
            />
            <Button onClick={copyLink} variant="default">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              asChild
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(
                    "I've been using CraftlyCV to optimize my resume with AI and it fixed my ATS score. You get 1 free extra scan when you sign up: https://craftlycv.in/r/" +
                      stats?.referral_code
                  )}`,
                  '_blank'
                )
              }
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  `https://www.linkedin.com/sharing/share-offsite/?url=https://craftlycv.in/r/${stats?.referral_code}`,
                  '_blank'
                )
              }
            >
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    'I just optimized my resume with @CraftlyCV — get your free ATS score!'
                  )}&url=https://craftlycv.in/r/${stats?.referral_code}`,
                  '_blank'
                )
              }
            >
              <Twitter className="h-4 w-4 mr-2" />
              X / Twitter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Progress to Bonus</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Refer 5 friends for 15 bonus scans ({scansForBonus}/5)
              </span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Referred Users</h2>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : referredUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No referrals yet. Share your link to start earning!
            </p>
          ) : (
            <div className="space-y-3">
              {referredUsers.map((user, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-mono text-sm">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{user.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

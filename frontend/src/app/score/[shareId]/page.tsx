'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Zap } from 'lucide-react';
import { SharingButtons } from '@/components/shared/SharingButtons';

interface ScoreData {
  share_id: string;
  candidate_name: string;
  ats_score: number;
}

export default function ScorePage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScoreData();
  }, [shareId]);

  async function fetchScoreData() {
    try {
      const res = await fetch(`/api/score-card/${shareId}`);
      if (res.ok) {
        const data = await res.json();
        setScoreData(data);
      }
    } catch (error) {
      console.error('Failed to fetch score data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-indigo-500" />
            <span className="text-2xl font-bold">CraftlyCV</span>
          </div>
          <h1 className="text-3xl font-bold">ATS Score Report</h1>
          <p className="text-muted-foreground">
            {scoreData?.candidate_name
              ? `${scoreData.candidate_name}'s Resume Analysis`
              : 'Public Score Card'}
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-video relative bg-[#0e0e0f] flex items-center justify-center">
              <img
                src={`/api/og/score/${shareId}`}
                alt="Score Card"
                className="w-full h-full object-contain"
              />
            </div>
          </CardContent>
        </Card>

        {scoreData && (
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <span className="font-semibold">
              ATS Score: {scoreData.ats_score}/100
            </span>
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          <Button asChild size="lg" className="w-full max-w-md">
            <a href="/">Get your free ATS score</a>
          </Button>

          <SharingButtons shareId={shareId} score={scoreData?.ats_score} />
        </div>
      </div>
    </div>
  );
}

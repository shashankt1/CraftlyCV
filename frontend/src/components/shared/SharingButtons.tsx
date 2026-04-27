'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MessageCircle, Linkedin, Twitter, Download } from 'lucide-react';

interface SharingButtonsProps {
  shareId: string;
  score?: number;
}

export function SharingButtons({ shareId, score }: SharingButtonsProps) {
  const baseUrl = 'https://craftlycv.in';

  async function handleDownload() {
    try {
      const res = await fetch(`/api/og/score/${shareId}`);
      if (!res.ok) throw new Error('Failed to fetch image');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'score-card.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }

  const shareText = score
    ? `I scored ${score}/100 on ATS with CraftlyCV. Get your free score: ${baseUrl}/score/${shareId}`
    : `Check out my resume ATS score on CraftlyCV: ${baseUrl}/score/${shareId}`;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        title="Share on WhatsApp"
        asChild
        className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-100"
      >
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="h-4 w-4" />
        </a>
      </Button>

      <Button
        variant="outline"
        size="icon"
        title="Share on LinkedIn"
        asChild
        className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-100"
      >
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${baseUrl}/score/${shareId}`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Linkedin className="h-4 w-4" />
        </a>
      </Button>

      <Button
        variant="outline"
        size="icon"
        title="Share on X / Twitter"
        asChild
        className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-100"
      >
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I scored ${score}/100 on ATS! Get your free resume analysis:`)}&url=${encodeURIComponent(`${baseUrl}/score/${shareId}`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Twitter className="h-4 w-4" />
        </a>
      </Button>

      <Button
        variant="outline"
        size="icon"
        title="Download Score Card"
        onClick={handleDownload}
        className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-100"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}

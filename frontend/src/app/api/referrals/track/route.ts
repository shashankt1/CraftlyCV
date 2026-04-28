import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ tracked: false });
  }

  const craftlyRef = request.cookies.get('craftly_ref')?.value;

  if (!craftlyRef) {
    return NextResponse.json({ tracked: false });
  }

  const { data: referrer } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', craftlyRef)
    .single();

  if (!referrer) {
    return NextResponse.json({ tracked: false });
  }

  const { data: updatedProfile } = await supabase
    .from('profiles')
    .update({ referred_by: craftlyRef })
    .eq('id', user.id)
    .select()
    .single();

  if (!updatedProfile) {
    return NextResponse.json({ tracked: false });
  }

  await supabase.from('referral_events').insert({
    referrer_id: referrer.id,
    referred_id: user.id,
    event_type: 'signup',
    scans_awarded: 1,
  });

  const { data: referrerProfile } = await supabase
    .from('profiles')
    .select('scans')
    .eq('id', referrer.id)
    .single();

  if (referrerProfile) {
    await supabase
      .from('profiles')
      .update({ scans: (referrerProfile.scans || 0) + 1 })
      .eq('id', referrer.id);
  }

  const response = NextResponse.json({ tracked: true, scansAwarded: 1 });

  response.cookies.set('craftly_ref', '', {
    maxAge: 0,
    path: '/',
  });

  return response;
}

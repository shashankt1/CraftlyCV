"use strict";(()=>{var e={};e.id=6233,e.ids=[6233],e.modules={25166:e=>{e.exports=require("mammoth")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},74193:e=>{e.exports=require("pdf-parse")},85563:(e,t,i)=>{i.r(t),i.d(t,{originalPathname:()=>f,patchFetch:()=>y,requestAsyncStorage:()=>d,routeModule:()=>m,serverHooks:()=>g,staticGenerationAsyncStorage:()=>h});var r={};i.r(r),i.d(r,{POST:()=>u});var s=i(49303),a=i(88716),n=i(60670),o=i(87070),c=i(11258),p=i(65655);async function l(e){let t=Buffer.from(await e.arrayBuffer());if("application/pdf"===e.type){let e=i(74193);return(await e(t)).text}let r=i(25166);return(await r.extractRawText({buffer:t})).value}async function u(e){try{let t=await e.formData(),i=t.get("file"),r=t.get("userId");if(!i||!r)return o.NextResponse.json({error:"Missing file or userId"},{status:400});let s=await (0,p.i)(),{data:a,error:n}=await s.from("profiles").select("scans").eq("id",r).single();if(n||!a)return o.NextResponse.json({error:"User not found"},{status:404});if(a.scans<1)return o.NextResponse.json({error:"Not enough scans"},{status:402});let u=await l(i),m=process.env.GEMINI_API_KEY;if(!m)throw Error("GEMINI_API_KEY not configured");let d=new c.$D(m).getGenerativeModel({model:"gemini-2.5-flash"}),h=`You are the world's toughest and most thorough ATS resume analyzer. Your job is to leave nothing untouched. Analyze every single aspect of this resume with the highest standards used by top companies like Google, Amazon, Microsoft, and McKinsey.

RESUME TEXT:
${u}

Be ruthlessly thorough. Check everything:
- Keyword density and ATS parsing
- Action verbs and impact language  
- Quantifiable achievements (numbers, %, $)
- Format and structure
- Skills alignment
- Grammar and clarity
- Section completeness
- Industry-specific requirements
- Seniority signals
- Recruiter 6-second scan test

Respond ONLY with valid JSON in this exact format:

{
  "score": [integer 0-100, be honest and tough - most resumes score 45-75],
  "detectedField": "[primary career field e.g. Software Engineering, Marketing, Finance]",
  "experienceYears": [estimated years as integer],
  "strengthStatement": "[one sentence validating their background before showing gaps - mention their field and experience]",
  "realWorldContext": "[2-3 sentences explaining what this score means in job market reality - which companies filter them in/out, what recruiters actually see]",
  "summary": "[2 sentence overall assessment]",
  "projectedScore": [score + 18-28 after fixes, max 97],
  "scorePercentile": [what percentile they're in, e.g. 62 means top 38%],
  "keywordMatches": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
  "missingKeywords": ["gap1", "gap2", "gap3", "gap4", "gap5", "gap6", "gap7", "gap8"],
  "strengths": [
    "specific strength 1 with detail",
    "specific strength 2 with detail", 
    "specific strength 3 with detail",
    "specific strength 4 with detail"
  ],
  "improvements": [
    "specific improvement 1",
    "specific improvement 2",
    "specific improvement 3",
    "specific improvement 4",
    "specific improvement 5"
  ],
  "opportunities": [
    {
      "icon": "🎯",
      "title": "Keyword Alignment",
      "whatsHappening": "Your resume and ATS systems are speaking slightly different languages. Specific keywords that trigger shortlisting are absent.",
      "theFix": "[specific fix with exact keywords to add]",
      "impact": [10-15],
      "proOnly": false
    },
    {
      "icon": "📐",
      "title": "Structure Optimization",
      "whatsHappening": "[specific structural issue found in THIS resume]",
      "theFix": "[specific fix]",
      "impact": [8-12],
      "proOnly": false
    },
    {
      "icon": "✨",
      "title": "Impact Language",
      "whatsHappening": "Your experience describes tasks rather than achievements. ATS and recruiters both rank achievement-focused resumes significantly higher.",
      "theFix": "[give 1-2 specific bullet rewrites as examples]",
      "impact": [10-15],
      "proOnly": false
    },
    {
      "icon": "📊",
      "title": "Quantification Gap",
      "whatsHappening": "[specific missing metrics in this resume]",
      "theFix": "[specific examples of how to add numbers]",
      "impact": [8-12],
      "proOnly": true
    },
    {
      "icon": "🔧",
      "title": "Technical Skills Section",
      "whatsHappening": "[specific skills gap or formatting issue]",
      "theFix": "[specific fix]",
      "impact": [5-10],
      "proOnly": true
    }
  ]
}`,g=(await d.generateContent(h)).response.text().replace(/```json|```/g,"").trim(),f=g.match(/\{[\s\S]*\}/);f&&(g=f[0]);let y=JSON.parse(g);return await s.from("profiles").update({scans:a.scans-1}).eq("id",r),await s.from("scan_logs").insert({user_id:r,action_type:"ats_analysis",scans_used:1,created_at:new Date().toISOString()}),o.NextResponse.json(y)}catch(t){let e=t instanceof Error?t.message:"Analysis failed";return o.NextResponse.json({error:e},{status:500})}}let m=new s.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/ai/analyze/route",pathname:"/api/ai/analyze",filename:"route",bundlePath:"app/api/ai/analyze/route"},resolvedPagePath:"C:\\Users\\Shashank tiwari\\OneDrive\\Desktop\\Resume-Builder\\frontend\\src\\app\\api\\ai\\analyze\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:d,staticGenerationAsyncStorage:h,serverHooks:g}=m,f="/api/ai/analyze/route";function y(){return(0,n.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:h})}},65655:(e,t,i)=>{i.d(t,{e:()=>a,i:()=>n});var r=i(97901),s=i(71615);async function a(){let e=await (0,s.cookies)();return(0,r.createServerClient)("https://oprnmnprfdpinkfaempv.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wcm5tbnByZmRwaW5rZmFlbXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTA2ODUsImV4cCI6MjA3ODY4NjY4NX0.SC-R2pSUeEIQhzNCat1zav-lN_JTiaBfCaDvm9JzVGc",{cookies:{getAll:()=>e.getAll(),setAll(t){try{t.forEach(({name:t,value:i,options:r})=>e.set(t,i,r))}catch{}}}})}async function n(){let e=await (0,s.cookies)(),t=process.env.SUPABASE_SERVICE_ROLE_KEY;return(0,r.createServerClient)("https://oprnmnprfdpinkfaempv.supabase.co",t||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wcm5tbnByZmRwaW5rZmFlbXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTA2ODUsImV4cCI6MjA3ODY4NjY4NX0.SC-R2pSUeEIQhzNCat1zav-lN_JTiaBfCaDvm9JzVGc",{cookies:{getAll:()=>e.getAll(),setAll(t){try{t.forEach(({name:t,value:i,options:r})=>e.set(t,i,r))}catch{}}}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var i=e=>t(t.s=e),r=t.X(0,[8948,5972,5091,1258],()=>i(85563));module.exports=r})();
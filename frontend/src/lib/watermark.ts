// src/lib/watermark.ts
// Adds a CraftlyCV diagonal watermark to resume PDFs
// Works with both free and paid plans — paid users get lighter/no watermark

export type WatermarkOptions = {
  plan: 'free' | 'career_launch' | 'niche_pro' | 'concierge'
  text?: string
}

/**
 * Returns SVG watermark markup to inject into resume HTML before PDF export.
 * Free plan  → visible diagonal repeat watermark
 * Paid plans → subtle "Powered by CraftlyCV" footer only
 * Concierge  → no watermark
 */
export function getWatermarkSVG(options: WatermarkOptions): string {
  const { plan, text = 'CraftlyCV' } = options

  // Concierge = completely clean export
  if (plan === 'concierge') return ''

  // Paid plans = footer only, no diagonal
  if (plan === 'career_launch' || plan === 'niche_pro') {
    return `
      <div style="
        position: fixed;
        bottom: 8px;
        right: 12px;
        font-size: 7px;
        color: rgba(99, 102, 241, 0.4);
        font-family: sans-serif;
        letter-spacing: 0.5px;
        pointer-events: none;
        z-index: 9999;
      ">
        Crafted with CraftlyCV
      </div>
    `
  }

  // Free plan = full diagonal repeat watermark
  return `
    <div style="
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    ">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%" height="100%"
        style="position: absolute; top: 0; left: 0;"
      >
        <defs>
          <pattern
            id="watermark-pattern"
            x="0" y="0"
            width="220" height="120"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-45)"
          >
            <text
              x="10" y="60"
              font-family="sans-serif"
              font-size="13"
              font-weight="600"
              letter-spacing="2"
              fill="rgba(99, 102, 241, 0.12)"
              style="user-select: none;"
            >${text}</text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#watermark-pattern)" />
      </svg>

      <!-- Footer branding for free plan -->
      <div style="
        position: fixed;
        bottom: 8px;
        right: 12px;
        font-size: 7px;
        color: rgba(99, 102, 241, 0.5);
        font-family: sans-serif;
        letter-spacing: 0.5px;
      ">
        Free plan · Upgrade at craftlycv.in
      </div>
    </div>
  `
}

/**
 * Injects watermark HTML into the resume HTML string before PDF generation.
 * Call this in your export API route before passing HTML to your PDF library.
 */
export function injectWatermark(resumeHtml: string, options: WatermarkOptions): string {
  const watermark = getWatermarkSVG(options)
  if (!watermark) return resumeHtml

  // Inject just before closing </body> tag
  if (resumeHtml.includes('</body>')) {
    return resumeHtml.replace('</body>', `${watermark}</body>`)
  }

  // Fallback: append at end
  return resumeHtml + watermark
}
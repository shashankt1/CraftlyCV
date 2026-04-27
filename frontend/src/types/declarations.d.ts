declare module 'pdf-parse' {
  interface PDFData {
    numpages: number
    numrender: number
    info: Record<string, any>
    metadata: Record<string, any> | null
    text: string
    version: string
  }
  interface ParseOptions {
    pagerender?: (pageData: { getTextContent: () => Promise<{ items: any[] }> }) => Promise<string>
    max?: number
    version?: string
  }
  function parse(data: Buffer, options?: ParseOptions): Promise<PDFData>
  export = parse
}

declare module 'mammoth' {
  interface Result {
    value: string
    messages: Array<{ type: string; message: string }>
  }
  interface Options {
    arrayBuffer?: ArrayBuffer
    buffer?: Buffer
  }
  function extractRawText(options: Options): Promise<Result>
  export { extractRawText, Result }
}

declare module 'razorpay' {
  class Razorpay {
    constructor(options: { key_id: string; key_secret?: string })
    orders: {
      create(params: {
        amount: number
        currency: string
        receipt?: string
        notes?: Record<string, string>
      }): Promise<{
        id: string
        entity: string
        amount: number
        currency: string
        receipt: string
        status: string
      }>
    }
  }
  export = Razorpay
}

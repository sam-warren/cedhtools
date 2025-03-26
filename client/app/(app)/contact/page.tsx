"use client";


export default function ContactPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center py-16">
      <div className="container max-w-xl mx-auto">
        <div className="rounded-lg border bg-card p-8 shadow-sm text-center">
          <div className="mb-8 space-y-3">
            <h1 className="text-3xl font-bold">Contact Us</h1>
            <p className="text-muted-foreground">
              Have a question or want to get in touch?
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="py-4">
              <a 
                href={process.env.NEXT_PUBLIC_DISCORD_URL || "#"} 
                className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join our Discord
              </a>
            </div>
            
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Or email us directly:</p>
              <a 
                href="mailto:info@cedhtools.com"
                className="text-blue-500 font-medium hover:underline"
              >
                info@cedhtools.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

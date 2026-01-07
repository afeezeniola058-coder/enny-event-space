import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Shield, Mail, ExternalLink, Copy, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const EmailDeliverabilityGuide = () => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const spfRecord = 'v=spf1 include:amazonses.com ~all';
  const dkimSelector = 'resend._domainkey';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle>Email Deliverability Setup</CardTitle>
        </div>
        <CardDescription>
          Configure SPF and DKIM records to improve email delivery rates and prevent emails from landing in spam.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Domain Verification Required</AlertTitle>
          <AlertDescription>
            To send emails from <strong>bookings@ennyvenue.com</strong>, verify your domain at{' '}
            <a 
              href="https://resend.com/domains" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline inline-flex items-center gap-1"
            >
              resend.com/domains <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>

        {/* SPF Record */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            <h3 className="font-semibold">SPF Record</h3>
            <Badge variant="outline">Required</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            SPF (Sender Policy Framework) authorizes Resend to send emails on behalf of your domain.
          </p>
          <div className="bg-muted rounded-lg p-3 flex items-center justify-between gap-2">
            <code className="text-sm break-all">{spfRecord}</code>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => copyToClipboard(spfRecord, 'SPF record')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Type:</strong> TXT</p>
            <p><strong>Host:</strong> @ (or leave blank)</p>
            <p><strong>Value:</strong> {spfRecord}</p>
          </div>
        </div>

        {/* DKIM Record */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <h3 className="font-semibold">DKIM Record</h3>
            <Badge variant="outline">Required</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            DKIM (DomainKeys Identified Mail) adds a digital signature to verify email authenticity.
          </p>
          <div className="bg-muted rounded-lg p-3 space-y-2">
            <p className="text-sm">
              DKIM records are automatically generated when you verify your domain in Resend. 
              You'll receive the specific CNAME records during the verification process.
            </p>
            <div className="flex items-center gap-2">
              <code className="text-sm">{dkimSelector}.yourdomain.com</code>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => copyToClipboard(dkimSelector, 'DKIM selector')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* DMARC (Optional) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-500" />
            <h3 className="font-semibold">DMARC Record</h3>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            DMARC tells receiving servers how to handle emails that fail SPF/DKIM checks.
          </p>
          <div className="bg-muted rounded-lg p-3 flex items-center justify-between gap-2">
            <code className="text-sm break-all">v=DMARC1; p=none; rua=mailto:dmarc@ennyvenue.com</code>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => copyToClipboard('v=DMARC1; p=none; rua=mailto:dmarc@ennyvenue.com', 'DMARC record')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Type:</strong> TXT</p>
            <p><strong>Host:</strong> _dmarc</p>
          </div>
        </div>

        {/* Quick Setup Steps */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Quick Setup Steps</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Go to your DNS provider (e.g., Cloudflare, GoDaddy, Namecheap)</li>
            <li>Add the SPF TXT record to your domain</li>
            <li>
              Verify your domain at{' '}
              <a 
                href="https://resend.com/domains" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                resend.com/domains
              </a>
            </li>
            <li>Add the DKIM CNAME records provided by Resend</li>
            <li>Wait for DNS propagation (usually 24-48 hours)</li>
            <li>Optionally add the DMARC record for enhanced protection</li>
          </ol>
        </div>

        {/* External Resources */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm" asChild>
            <a 
              href="https://resend.com/docs/dashboard/domains/introduction" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
            >
              Resend Domain Docs <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a 
              href="https://mxtoolbox.com/spf.aspx" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
            >
              Check SPF Record <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailDeliverabilityGuide;

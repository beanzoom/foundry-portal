import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  CheckCircle,
  Calendar,
  User,
  Shield,
  Download,
  Eye,
  ScrollText,
  AlertCircle
} from 'lucide-react';
import { ndaService } from '@/services/nda.service';
import { membershipAgreementService } from '@/services/membership-agreement.service';
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';

interface AgreementRecord {
  id: string;
  version: string;
  agreed_text: string;
  typed_name: string;
  agreed_at: string;
  user_agent: string;
}

export function LegalAgreementsSection() {
  const { user } = useAuth();
  const [ndaAgreements, setNdaAgreements] = useState<AgreementRecord[]>([]);
  const [membershipAgreements, setMembershipAgreements] = useState<AgreementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNDAModal, setShowNDAModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [ndaContent, setNdaContent] = useState<string>('');
  const [membershipContent, setMembershipContent] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadAgreements();
    }
  }, [user]);

  const loadAgreements = async () => {
    if (!user) return;

    try {
      const [ndaData, membershipData] = await Promise.all([
        ndaService.getUserAgreements(user.id),
        membershipAgreementService.getUserAgreements(user.id)
      ]);
      
      // Map NDA data to common format
      setNdaAgreements(ndaData.map((item: any) => ({
        id: item.id,
        version: item.nda_version,
        agreed_text: item.agreed_text,
        typed_name: item.typed_name,
        agreed_at: item.agreed_at,
        user_agent: item.user_agent
      })));
      
      // Map Membership data to common format
      setMembershipAgreements(membershipData.map((item: any) => ({
        id: item.id,
        version: item.agreement_version,
        agreed_text: item.agreed_text,
        typed_name: item.typed_name,
        agreed_at: item.agreed_at,
        user_agent: item.user_agent
      })));
    } catch (error) {
      console.error('Error loading agreements:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewNDA = async () => {
    try {
      const response = await fetch('/nda.md');
      const text = await response.text();
      setNdaContent(text);
      setShowNDAModal(true);
    } catch (error) {
      console.error('Error loading NDA:', error);
    }
  };

  const viewMembershipAgreement = async () => {
    try {
      const response = await fetch('/docs/membership-agreement.md');
      const text = await response.text();
      setMembershipContent(text);
      setShowMembershipModal(true);
    } catch (error) {
      console.error('Error loading Membership Agreement:', error);
    }
  };

  const downloadCertificate = (type: 'NDA' | 'Membership', agreement: AgreementRecord) => {
    const certificateHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>${type} Agreement Certificate</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #333;
      position: relative;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 18px;
      color: #666;
    }
    .content {
      margin: 30px 0;
      line-height: 1.8;
    }
    .field {
      margin: 20px 0;
    }
    .label {
      font-weight: bold;
      color: #333;
    }
    .value {
      margin-left: 10px;
      border-bottom: 1px solid #999;
      display: inline-block;
      min-width: 200px;
      padding: 2px 5px;
    }
    .signature-section {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
    }
    .signature-block {
      text-align: center;
      width: 45%;
    }
    .signature-line {
      border-bottom: 1px solid #333;
      margin-bottom: 5px;
      height: 40px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .seal {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 100px;
      height: 100px;
      border: 3px solid #333;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      transform: rotate(-15deg);
    }
  </style>
</head>
<body>
  <div class="seal">EXECUTED</div>
  <div class="header">
    <div class="title">${type === 'NDA' ? 'NON-DISCLOSURE' : 'MEMBERSHIP'} AGREEMENT CERTIFICATE</div>
    <div class="subtitle">FleetDRMS Portal</div>
  </div>

  <div class="content">
    <p>This certifies that the undersigned has read, understood, and agreed to be bound by the terms of the ${type === 'NDA' ? 'Non-Disclosure Agreement' : 'Membership Agreement'} for the FleetDRMS Portal.</p>

    <div class="field">
      <span class="label">Agreement Version:</span>
      <span class="value">${agreement.version}</span>
    </div>

    <div class="field">
      <span class="label">Date of Agreement:</span>
      <span class="value">${new Date(agreement.agreed_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</span>
    </div>

    <div class="field">
      <span class="label">Time of Agreement:</span>
      <span class="value">${new Date(agreement.agreed_at).toLocaleTimeString('en-US')}</span>
    </div>

    <div class="field">
      <span class="label">Agreement ID:</span>
      <span class="value">${agreement.id}</span>
    </div>
  </div>

  <div class="signature-section">
    <div class="signature-block">
      <div class="signature-line"></div>
      <div>${agreement.typed_name}</div>
      <div style="font-size: 12px; color: #666;">${type === 'NDA' ? 'Receiving Party' : 'Member'}</div>
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <div>FleetDRMS, Inc.</div>
      <div style="font-size: 12px; color: #666;">${type === 'NDA' ? 'Disclosing Party' : 'Company'}</div>
    </div>
  </div>

  <div class="footer">
    <p>This electronic record constitutes a legally binding agreement.</p>
    <p>Document generated on ${new Date().toLocaleDateString('en-US')}</p>
  </div>
</body>
</html>`;

    const blob = new Blob([certificateHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_Certificate_${agreement.version}_${new Date(agreement.agreed_at).toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestNDA = ndaAgreements[0];
  const latestMembership = membershipAgreements[0];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Legal Agreements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* NDA Agreement Status */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Non-Disclosure Agreement (NDA)
            </h3>
            {latestNDA ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900">NDA Active</p>
                      <p className="text-sm text-green-700 mt-1">
                        Version {latestNDA.version} accepted
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(latestNDA.agreed_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{latestNDA.typed_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={viewNDA}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadCertificate('NDA', latestNDA)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900">NDA Not Signed</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      You will be prompted to sign the NDA on your next login
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Membership Agreement Status */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ScrollText className="w-4 h-4" />
              Membership Agreement
            </h3>
            {latestMembership ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900">Membership Agreement Active</p>
                      <p className="text-sm text-green-700 mt-1">
                        Version {latestMembership.version} accepted
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(latestMembership.agreed_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{latestMembership.typed_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={viewMembershipAgreement}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadCertificate('Membership', latestMembership)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900">Membership Agreement Not Signed</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      You will be prompted to sign the Membership Agreement after accepting the NDA
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Agreement History */}
          {(ndaAgreements.length > 1 || membershipAgreements.length > 1) && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Agreement History</h4>
              <div className="space-y-2">
                {ndaAgreements.slice(1).map((agreement) => (
                  <div key={agreement.id} className="flex items-center justify-between text-sm text-gray-600 p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>NDA Version {agreement.version}</span>
                    </div>
                    <span>{new Date(agreement.agreed_at).toLocaleDateString()}</span>
                  </div>
                ))}
                {membershipAgreements.slice(1).map((agreement) => (
                  <div key={agreement.id} className="flex items-center justify-between text-sm text-gray-600 p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <ScrollText className="w-4 h-4" />
                      <span>Membership Version {agreement.version}</span>
                    </div>
                    <span>{new Date(agreement.agreed_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NDA View Modal */}
      <Dialog open={showNDAModal} onOpenChange={setShowNDAModal}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Non-Disclosure Agreement
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 p-6">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  hr: () => <hr className="my-8 border-t-2 border-gray-400" />,
                  h2: ({children}) => <h2 className="mt-8 mb-4 text-lg font-bold">{children}</h2>,
                  h3: ({children}) => <h3 className="mt-4 mb-2 font-semibold">{children}</h3>,
                }}
              >
                {ndaContent}
              </ReactMarkdown>
            </div>
          </ScrollArea>
          <div className="p-6 pt-0 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                You agreed to this document on {latestNDA && new Date(latestNDA.agreed_at).toLocaleDateString()}
              </span>
              <Button onClick={() => setShowNDAModal(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Membership Agreement View Modal */}
      <Dialog open={showMembershipModal} onOpenChange={setShowMembershipModal}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="w-5 h-5" />
              Membership Agreement
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 p-6">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  hr: () => <hr className="my-8 border-t-2 border-gray-400" />,
                  h2: ({children}) => <h2 className="mt-8 mb-4 text-lg font-bold">{children}</h2>,
                  h3: ({children}) => <h3 className="mt-4 mb-2 font-semibold">{children}</h3>,
                }}
              >
                {membershipContent}
              </ReactMarkdown>
            </div>
          </ScrollArea>
          <div className="p-6 pt-0 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                You agreed to this document on {latestMembership && new Date(latestMembership.agreed_at).toLocaleDateString()}
              </span>
              <Button onClick={() => setShowMembershipModal(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
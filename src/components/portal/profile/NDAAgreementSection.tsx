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
  Eye
} from 'lucide-react';
import { ndaService } from '@/services/nda.service';
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';

interface NDARecord {
  id: string;
  nda_version: string;
  agreed_text: string;
  typed_name: string;
  agreed_at: string;
  user_agent: string;
}

export function NDAAgreementSection() {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState<NDARecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNDAModal, setShowNDAModal] = useState(false);
  const [ndaContent, setNdaContent] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadAgreements();
    }
  }, [user]);

  const loadAgreements = async () => {
    if (!user) return;

    try {
      const data = await ndaService.getUserAgreements(user.id);
      setAgreements(data);
    } catch (error) {
      console.error('Error loading NDA agreements:', error);
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

  const downloadNDACertificate = (agreement: NDARecord) => {
    // Create a certificate-style HTML document
    const certificateHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>NDA Agreement Certificate</title>
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
    <div class="title">NON-DISCLOSURE AGREEMENT CERTIFICATE</div>
    <div class="subtitle">DSP Foundry Portal</div>
  </div>

  <div class="content">
    <p>This certifies that the undersigned has read, understood, and agreed to be bound by the terms of the Non-Disclosure Agreement for the DSP Foundry Portal.</p>

    <div class="field">
      <span class="label">Agreement Version:</span>
      <span class="value">${agreement.nda_version}</span>
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
      <div style="font-size: 12px; color: #666;">Receiving Party</div>
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <div>DSP Foundry</div>
      <div style="font-size: 12px; color: #666;">Disclosing Party</div>
    </div>
  </div>

  <div class="footer">
    <p>This electronic record constitutes a legally binding agreement.</p>
    <p>Document generated on ${new Date().toLocaleDateString('en-US')}</p>
  </div>
</body>
</html>`;

    // Create a blob and download
    const blob = new Blob([certificateHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NDA_Certificate_${agreement.nda_version}_${new Date(agreement.agreed_at).toISOString().split('T')[0]}.html`;
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

  const latestAgreement = agreements[0];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Legal Agreements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agreements.length > 0 ? (
            <div className="space-y-4">
              {/* Current Agreement Status */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900">NDA Agreement Active</p>
                      <p className="text-sm text-green-700 mt-1">
                        You have agreed to the Non-Disclosure Agreement (Version {latestAgreement.nda_version})
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Signed on {new Date(latestAgreement.agreed_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>as {latestAgreement.typed_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Active
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={viewNDA}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View NDA Document
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadNDACertificate(latestAgreement)}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Certificate
                </Button>
              </div>

              {/* Agreement History */}
              {agreements.length > 1 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3">Agreement History</h4>
                  <div className="space-y-2">
                    {agreements.slice(1).map((agreement) => (
                      <div key={agreement.id} className="flex items-center justify-between text-sm text-gray-600 p-2 hover:bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>Version {agreement.nda_version}</span>
                        </div>
                        <span>
                          {new Date(agreement.agreed_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No NDA agreement found</p>
              <p className="text-sm text-gray-500 mt-1">
                You will be prompted to agree to the NDA on your next login
              </p>
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
              <ReactMarkdown>{ndaContent}</ReactMarkdown>
            </div>
          </ScrollArea>
          <div className="p-6 pt-0 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                You agreed to this document on {latestAgreement && new Date(latestAgreement.agreed_at).toLocaleDateString()}
              </span>
              <Button onClick={() => setShowNDAModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
import { ContactForm } from '@/components/portal/ContactForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PortalContact() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-gray-600">
          We're here to help. Reach out to us with any questions or concerns.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Form - Takes up 2 columns on large screens */}
        <div className="lg:col-span-2">
          <ContactForm />
        </div>

        {/* Contact Information - Takes up 1 column */}
        <div className="space-y-6">
          {/* Response Time */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800">
                We typically respond to inquiries within 24 business hours. For urgent matters, please call our support line.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

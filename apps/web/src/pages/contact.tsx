import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { TrendingUp, Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  inquiryType: string;
  message: string;
}

const ContactPage: React.FC = () => {
  const router = useRouter();
  const { plan, type } = router.query;
  
  const [formData, setFormData] = useState<ContactForm>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    inquiryType: 'general',
    message: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (plan) {
      setFormData(prev => ({
        ...prev,
        inquiryType: 'sales',
        message: `I'm interested in learning more about the ${plan} plan for CapitalCue. Please contact me to discuss pricing and features.`
      }));
    }
    if (type === 'enterprise') {
      setFormData(prev => ({
        ...prev,
        inquiryType: 'enterprise',
        message: 'I\'m interested in enterprise solutions and would like to discuss custom requirements for my organization.'
      }));
    }
  }, [plan, type]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically make an API call to send the contact form
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit contact form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <Head>
          <title>Thank You - CapitalCue</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank you!</h2>
                <p className="text-gray-600 mb-6">
                  We've received your message and will get back to you within 24 hours.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back to Home
                  </Link>
                  <Link
                    href="/pricing"
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Pricing
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Contact Us - CapitalCue</title>
        <meta name="description" content="Get in touch with the CapitalCue team. We're here to help with questions about pricing, features, and enterprise solutions." />
      </Head>

      <div className="bg-white">
        {/* Header */}
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto md:max-w-none md:grid md:grid-cols-2 md:gap-8">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-8">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">CapitalCue</span>
              </Link>
              
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl sm:tracking-tight">
                Get in touch
              </h2>
              <p className="mt-3 text-lg leading-6 text-gray-500">
                We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>

              <div className="mt-9">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Phone className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-3 text-base text-gray-500">
                    <p>+1 (555) 123-4567</p>
                    <p className="text-sm">Mon-Fri 9am to 6pm PST</p>
                  </div>
                </div>
                <div className="mt-6 flex">
                  <div className="flex-shrink-0">
                    <Mail className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-3 text-base text-gray-500">
                    <p>hello@capitalcue.com</p>
                  </div>
                </div>
                <div className="mt-6 flex">
                  <div className="flex-shrink-0">
                    <MapPin className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-3 text-base text-gray-500">
                    <p>San Francisco, CA</p>
                    <p className="text-sm">Remote-first company</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="mt-12 sm:mt-16 md:mt-0">
              <form className="grid grid-cols-1 gap-y-6" onSubmit={handleSubmit}>
                <div className="sm:grid sm:grid-cols-2 sm:gap-x-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        autoComplete="given-name"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="py-3 px-4 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        autoComplete="family-name"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="py-3 px-4 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="py-3 px-4 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:grid sm:grid-cols-2 sm:gap-x-4">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                      Company
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="company"
                        id="company"
                        autoComplete="organization"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="py-3 px-4 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="phone"
                        id="phone"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="py-3 px-4 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="inquiryType" className="block text-sm font-medium text-gray-700">
                    How can we help?
                  </label>
                  <div className="mt-1">
                    <select
                      id="inquiryType"
                      name="inquiryType"
                      value={formData.inquiryType}
                      onChange={handleInputChange}
                      className="py-3 px-4 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                    >
                      <option value="general">General inquiry</option>
                      <option value="sales">Sales & pricing</option>
                      <option value="enterprise">Enterprise solutions</option>
                      <option value="support">Technical support</option>
                      <option value="partnership">Partnership opportunities</option>
                      <option value="press">Press & media</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      className="py-3 px-4 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border border-gray-300 rounded-md"
                      placeholder="Tell us more about your needs..."
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Sending...
                      </div>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50">
          <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">
                  Frequently asked questions
                </h2>
                <p className="mt-4 text-lg text-gray-500">
                  Can't find the answer you're looking for? Reach out to our customer support team.
                </p>
              </div>
              <div className="mt-12 lg:mt-0 lg:col-span-2">
                <dl className="space-y-12">
                  <div>
                    <dt className="text-lg leading-6 font-medium text-gray-900">
                      How quickly can I get started?
                    </dt>
                    <dd className="mt-2 text-base text-gray-500">
                      You can sign up and start analyzing documents within minutes. Our 7-day free trial gives you full access to explore all features.
                    </dd>
                  </div>

                  <div>
                    <dt className="text-lg leading-6 font-medium text-gray-900">
                      Do you offer custom enterprise solutions?
                    </dt>
                    <dd className="mt-2 text-base text-gray-500">
                      Yes, we work with large organizations to create tailored solutions including on-premise deployment, custom integrations, and dedicated support.
                    </dd>
                  </div>

                  <div>
                    <dt className="text-lg leading-6 font-medium text-gray-900">
                      What file formats do you support?
                    </dt>
                    <dd className="mt-2 text-base text-gray-500">
                      We support PDF, Excel (XLSX/XLS), and CSV files. Our AI can extract financial data from quarterly reports, financial statements, and other business documents.
                    </dd>
                  </div>

                  <div>
                    <dt className="text-lg leading-6 font-medium text-gray-900">
                      How secure is my data?
                    </dt>
                    <dd className="mt-2 text-base text-gray-500">
                      We use bank-grade encryption, maintain comprehensive audit logs, and are GDPR compliant. Your data is encrypted at rest and in transit.
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
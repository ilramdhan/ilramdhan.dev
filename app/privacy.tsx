'use client';

import React from 'react';
import { Navbar } from '../components/Navbar';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Navbar />
      <div className="pt-32 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>
            Your privacy is important to us. It is our policy to respect your privacy regarding any information we may collect from you across our website.
          </p>
          
          <h3>1. Information We Collect</h3>
          <p>
            We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
          </p>

          <h3>2. Log Data</h3>
          <p>
            When you visit our website, our servers may automatically log the standard data provided by your web browser. It includes your computer’s Internet Protocol (IP) address, your browser type and version, the pages you visit, the time and date of your visit, the time spent on each page, and other details.
          </p>

          <h3>3. Use of Information</h3>
          <p>
            We may use the information we collect from you to:
          </p>
          <ul>
            <li>Provide and operate our services</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Send you technical notices, updates, security alerts, and support messages</li>
          </ul>

          <h3>4. Third-Party Services</h3>
          <p>
            We do not share any personally identifying information publicly or with third-parties, except when required to by law.
          </p>

          <h3>5. Contact Us</h3>
          <p>
            If you have any questions about this privacy policy, please contact us via the contact form on our website.
          </p>
        </div>
      </div>
    </div>
  );
}
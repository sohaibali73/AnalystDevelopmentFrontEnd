'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#080809',
      color: '#EFEFEF',
      fontFamily: "'Instrument Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&family=Instrument+Sans:wght@400;500;600&display=swap');
        .legal-section h2 {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #FEC00F;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin: 0 0 12px;
        }
        .legal-section p, .legal-section li {
          font-size: 14px;
          line-height: 1.8;
          color: #A0A0A8;
          margin: 0 0 10px;
        }
        .legal-section ul {
          padding-left: 20px;
          margin: 0 0 16px;
        }
        .legal-section li { margin-bottom: 6px; }
      `}</style>

      {/* Top bar */}
      <div style={{
        height: '3px',
        background: 'linear-gradient(90deg, transparent 0%, #FEC00F 40%, rgba(254,192,15,0.3) 70%, transparent 100%)',
      }} />

      {/* Header */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '48px 32px 32px',
      }}>
        <Link href="/settings" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: '#606068',
          textDecoration: 'none',
          fontFamily: "'DM Mono', monospace",
          fontSize: '11px',
          letterSpacing: '0.1em',
          marginBottom: '40px',
          transition: 'color 0.2s ease',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#FEC00F'}
          onMouseLeave={e => e.currentTarget.style.color = '#606068'}
        >
          <ArrowLeft size={14} />
          BACK TO SETTINGS
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'rgba(254,192,15,0.1)',
            border: '1px solid rgba(254,192,15,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Eye size={20} color="#FEC00F" />
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '36px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#EFEFEF',
            margin: 0,
          }}>
            Privacy Policy
          </h1>
        </div>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '10px',
          letterSpacing: '0.12em',
          color: '#606068',
          marginBottom: '48px',
        }}>
          POTOMAC FUND MANAGEMENT, INC. — EFFECTIVE DATE: MARCH 2026 — VERSION RC 2.0
        </p>

        <div style={{
          background: 'rgba(254,192,15,0.05)',
          border: '1px solid rgba(254,192,15,0.2)',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '40px',
        }}>
          <p style={{ fontSize: '13px', color: '#A0A0A8', lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: '#FEC00F' }}>Developer Beta Release Candidate 2 Notice:</strong> This software is currently in a pre-release beta state. Our data practices described in this policy are subject to change prior to the final release. We are committed to transparency about how we collect, use, and protect your information.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

          <div className="legal-section">
            <h2>1. Information We Collect</h2>
            <p>Potomac Fund Management collects certain information in order to provide and improve the Potomac Analyst Platform ("Platform"). The categories of information we may collect include:</p>
            <ul>
              <li><strong style={{ color: '#EFEFEF' }}>Account Information:</strong> Name, email address, and credentials provided at registration</li>
              <li><strong style={{ color: '#EFEFEF' }}>Usage Data:</strong> Feature interactions, pages visited, session duration, and in-platform activity logs</li>
              <li><strong style={{ color: '#EFEFEF' }}>Uploaded Content:</strong> Documents, data files, and other materials you upload to the Knowledge Base or chat interface</li>
              <li><strong style={{ color: '#EFEFEF' }}>Chat & Query Data:</strong> Prompts, messages, and AI conversation history generated within the Platform</li>
              <li><strong style={{ color: '#EFEFEF' }}>Technical Data:</strong> IP address, browser type, operating system, and device identifiers collected automatically</li>
            </ul>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul>
              <li>To authenticate users and manage account access to the Platform</li>
              <li>To provide, maintain, and improve Platform features and functionality</li>
              <li>To process AI queries and return relevant analysis results</li>
              <li>To monitor Platform performance, reliability, and security</li>
              <li>To diagnose technical issues and improve the user experience during the beta phase</li>
              <li>To communicate with you regarding Platform updates, changes to terms, or security notices</li>
              <li>To comply with legal obligations and enforce our Terms of Service</li>
            </ul>
            <p>We do not sell, rent, or trade your personal information to third parties for marketing purposes.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>3. Data Storage & Retention</h2>
            <p>Your data is stored on secure servers operated by or on behalf of Potomac Fund Management. We retain your information for as long as your account is active or as needed to provide Platform services.</p>
            <ul>
              <li>Account data is retained until account deletion is requested</li>
              <li>Uploaded documents and knowledge base files are retained until you explicitly delete them</li>
              <li>Conversation and query history may be retained for up to 90 days for debugging and service improvement purposes</li>
              <li>Usage logs and technical data may be retained for up to 12 months</li>
            </ul>
            <p>Upon account deletion request, we will remove your personal data within 30 days, except where retention is required by law or legitimate business necessity.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>4. Third-Party AI Services</h2>
            <p>The Platform integrates third-party AI models to power its analytical capabilities. Specifically:</p>
            <ul>
              <li><strong style={{ color: '#EFEFEF' }}>Anthropic, PBC (Claude™):</strong> Chat messages and knowledge base content may be transmitted to Anthropic's API for AI processing. Anthropic's own privacy policy governs their handling of such data</li>
              <li><strong style={{ color: '#EFEFEF' }}>Market Data Providers:</strong> Certain features may retrieve publicly available market data from external financial data sources</li>
            </ul>
            <p>We recommend reviewing the privacy policies of these third-party services. We contractually require our AI service providers to maintain appropriate data security standards and not use your data for training their models without consent.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>5. Data Sharing & Disclosure</h2>
            <p>We do not share your personal information except in the following limited circumstances:</p>
            <ul>
              <li><strong style={{ color: '#EFEFEF' }}>Service Providers:</strong> Trusted vendors who assist in operating the Platform (hosting, analytics, security) under confidentiality obligations</li>
              <li><strong style={{ color: '#EFEFEF' }}>AI Processing Partners:</strong> As described in Section 4 above, AI API providers receive query content to generate responses</li>
              <li><strong style={{ color: '#EFEFEF' }}>Legal Requirements:</strong> When required by law, regulation, court order, or government request</li>
              <li><strong style={{ color: '#EFEFEF' }}>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your data may be transferred to the successor entity</li>
              <li><strong style={{ color: '#EFEFEF' }}>Protection of Rights:</strong> To protect the safety, rights, or property of Potomac Fund Management, our users, or the public</li>
            </ul>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>6. Your Rights & Choices</h2>
            <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
            <ul>
              <li><strong style={{ color: '#EFEFEF' }}>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong style={{ color: '#EFEFEF' }}>Correction:</strong> Request correction of inaccurate or incomplete personal data</li>
              <li><strong style={{ color: '#EFEFEF' }}>Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
              <li><strong style={{ color: '#EFEFEF' }}>Portability:</strong> Request a machine-readable export of your data where technically feasible</li>
              <li><strong style={{ color: '#EFEFEF' }}>Restriction:</strong> Request that we restrict processing of your data in certain circumstances</li>
              <li><strong style={{ color: '#EFEFEF' }}>Objection:</strong> Object to certain types of data processing, including profiling</li>
            </ul>
            <p>To exercise any of these rights, please contact us through your account representative or Platform support channels.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>7. Cookies & Tracking Technologies</h2>
            <p>The Platform may use cookies and similar tracking technologies to maintain authentication sessions and improve user experience. We use:</p>
            <ul>
              <li><strong style={{ color: '#EFEFEF' }}>Session Cookies:</strong> Required for authentication and maintaining your logged-in state</li>
              <li><strong style={{ color: '#EFEFEF' }}>Preference Cookies:</strong> To remember your settings and preferences within the Platform</li>
              <li><strong style={{ color: '#EFEFEF' }}>Analytics Tokens:</strong> Anonymous identifiers used for internal performance monitoring</li>
            </ul>
            <p>We do not use third-party advertising cookies. You may configure your browser to reject cookies, though this may affect Platform functionality, including the ability to stay logged in.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>8. Security</h2>
            <p>We implement industry-standard technical and organizational security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. These measures include:</p>
            <ul>
              <li>Encryption of data in transit using TLS/HTTPS protocols</li>
              <li>Access controls limiting data access to authorized personnel only</li>
              <li>Regular security reviews and vulnerability assessments</li>
              <li>Secure credential hashing and storage practices</li>
            </ul>
            <p>However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security. As this is a beta product, additional hardening measures will be applied prior to production release.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>9. Children's Privacy</h2>
            <p>The Platform is intended solely for professional and institutional use by adults. We do not knowingly collect personal information from individuals under the age of 18. If we become aware that we have inadvertently collected information from a minor, we will promptly delete such data and terminate the associated account.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will:</p>
            <ul>
              <li>Post the revised policy within the Platform</li>
              <li>Update the effective date at the top of this document</li>
              <li>Provide in-platform notification for significant changes where practicable</li>
            </ul>
            <p>Your continued use of the Platform after any changes to this Privacy Policy constitutes your acceptance of the updated terms.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>11. Contact</h2>
            <p>If you have questions, concerns, or requests relating to this Privacy Policy or our data practices, please contact Potomac Fund Management, Inc. through the platform's support channels or via your designated account representative.</p>
            <p>For data subject rights requests, please specify the nature of your request and include sufficient information to verify your identity.</p>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          marginTop: '64px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.08em',
            color: '#606068',
            margin: 0,
          }}>
            © 2026 Potomac Fund Management, Inc. — All Rights Reserved
          </p>
          <Link href="/terms" style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: '#EC4899',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}>
            Terms of Service →
          </Link>
        </div>
      </div>
    </div>
  );
}

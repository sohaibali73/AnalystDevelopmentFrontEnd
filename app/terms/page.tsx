'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function TermsPage() {
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
        .legal-section h3 {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #EFEFEF;
          margin: 16px 0 8px;
        }
        .legal-section p, .legal-section li {
          font-size: 14px;
          line-height: 1.8;
          color: #A0A0A8;
          margin: 0 0 10px;
        }
        .legal-section ul, .legal-section ol {
          padding-left: 20px;
          margin: 0 0 16px;
        }
        .legal-section li { margin-bottom: 6px; }
        .legal-section strong { color: #EFEFEF; }
        .legal-section .contact-info {
          background: rgba(254,192,15,0.05);
          border: 1px solid rgba(254,192,15,0.15);
          border-radius: 8px;
          padding: 16px 20px;
          margin-top: 12px;
        }
        .legal-section .contact-info p {
          margin-bottom: 6px;
        }
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
            <Shield size={20} color="#FEC00F" />
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '36px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#EFEFEF',
            margin: 0,
          }}>
            Terms of Service
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
            These Terms of Service ("Terms") govern your access to and use of the Potomac Analyst Platform (the "Platform") provided by Potomac Fund Management, Inc. ("Potomac", "we", "us", or "our"). By registering for, accessing, or using the Platform, you agree to be bound by these Terms. If you do not agree, do not use the Platform.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

          <div className="legal-section">
            <h2>1. Acceptance and Changes</h2>
            <p>By using the Platform you accept these Terms and any additional policies or terms referenced herein (including our Privacy Policy). We may modify these Terms from time to time. We will post revised Terms in the Platform and update the effective date. Material changes will be communicated via in-platform notifications where practicable. Continued use after changes constitutes acceptance.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>2. Eligible Users</h2>
            <p>The Platform is intended for professional and institutional users over the age of 18. By using the Platform you represent that you have the authority to bind the entity on whose behalf you use the Platform and that you are at least 18 years old.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>3. Accounts, Registration, and Security</h2>
            <p>To access certain features you must create an account. You agree to provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You will notify us immediately of any unauthorized use or security breach. We may suspend or terminate accounts that violate these Terms or for security reasons.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>4. Platform Use and License</h2>
            <p>Subject to these Terms and any applicable paid subscription terms, Potomac grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Platform for your internal business purposes. You may not:</p>
            <ol type="a">
              <li>Copy, modify, or create derivative works of the Platform;</li>
              <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code, underlying algorithms, models, or trade secrets of the Platform (including its AI models, prompt-engineering assets, or model weights), except to the extent such prohibitions are expressly prohibited by applicable law. You also may not bypass or attempt to bypass technical protection measures or restrictions embedded in the Platform;</li>
              <li>Use the Platform to develop a competing product;</li>
              <li>Circumvent usage limits or access controls.</li>
            </ol>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>5. Subscriptions, Fees, and Billing</h2>
            <p>Access to certain features may require payment of fees and acceptance of separate subscription terms. All fees are non-refundable except as required by law or as expressly provided in your subscription agreement. You authorize us to charge your payment method for subscription fees and applicable taxes. We may change fees upon notice; continued use after a fee change constitutes acceptance.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>6. User Content and Uploads</h2>
            <p>"User Content" means any data, text, files, code, documents, prompts, and other materials you upload, submit, or generate using the Platform. You retain ownership of your User Content. By submitting User Content you grant Potomac and our service providers a worldwide, non-exclusive, royalty-free license to host, store, reproduce, modify, and process such content solely to provide and improve the Platform and as described in our Privacy Policy.</p>
            <p>You represent and warrant that you have all necessary rights to upload and process User Content and that such content does not violate any third-party rights or applicable laws.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>7. Prohibited Conduct</h2>
            <p>You agree not to use the Platform to:</p>
            <ul>
              <li>Upload, transmit, or store content that is illegal, infringing, defamatory, abusive, obscene, or otherwise objectionable;</li>
              <li>Violate privacy or data protection laws (including uploading third-party personal data without consent or legal basis);</li>
              <li>Attempt to undermine Platform security or violate usage limits;</li>
              <li>Use the Platform for mass unsolicited communications or spam;</li>
              <li>Attempt to access other users' accounts or data.</li>
            </ul>
            <p>We may remove or disable access to User Content that violates these Terms.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>8. AI Processing and Third-Party Services</h2>
            <p>The Platform leverages third-party AI providers and infrastructure to process queries and provide features. Notable subprocessors include Anthropic, PBC (Claude™) for AI processing; Vercel for front-end hosting and CDN; Railway for backend hosting; and Supabase for database and object storage.</p>
            <p>By using AI-enabled features, you consent to the transmission of prompts, messages, and associated metadata to third-party AI processors. We contractually restrict third-party providers from using your content for model training without your explicit consent where feasible. For more details, see our Privacy Policy and available in-Platform opt-out controls.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>9. Data Security and Privacy</h2>
            <p>We implement reasonable administrative, technical, and physical measures to protect User Content. However, no security is absolute. You are responsible for the content you upload and for safeguarding sensitive information. Do not include personal data or confidential third-party data in prompts unless you are authorized to do so.</p>
            <p>Our Privacy Policy explains how we collect, use, retain, and share personal data.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>10. Retention, Export, and Deletion</h2>
            <p>We retain User Content as described in the Privacy Policy. You may export your data using Platform tools or submit requests (e.g., export, deletion) by contacting privacy@potomac.com. We will verify identity before fulfilling data subject requests. Deletion from backups may take additional time consistent with our retention schedules.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>11. Intellectual Property</h2>
            <p>Potomac and its licensors own all right, title, and interest in and to the Platform and its content (excluding your User Content). We retain all rights not expressly granted to you under these Terms.</p>
            <p>You retain ownership of your User Content; however, you grant Potomac the license described in Section 6. If you provide feedback or suggestions, you grant Potomac a perpetual, irrevocable, worldwide, royalty-free license to use such feedback.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>12. Third-Party Links and Services</h2>
            <p>The Platform may contain links to third-party websites, services, or content. We do not control and are not responsible for third-party content, privacy practices, or terms. Your dealings with third parties are solely between you and the third party.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>13. Warranties and Disclaimers</h2>
            <p style={{ textTransform: 'uppercase', fontWeight: 600 }}>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. POTOMAC DISCLAIMS ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. POTOMAC DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>14. Limitation of Liability</h2>
            <p style={{ textTransform: 'uppercase', fontWeight: 600 }}>TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL POTOMAC, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, OR FOR LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR THE PLATFORM, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
            <p style={{ textTransform: 'uppercase', fontWeight: 600 }}>POTOMAC'S AGGREGATE LIABILITY FOR DIRECT DAMAGES ARISING OUT OF OR RELATED TO THESE TERMS SHALL NOT EXCEED THE TOTAL AMOUNTS PAID BY YOU TO POTOMAC IN THE SIX (6) MONTHS PRECEDING THE CLAIM (OR, IF NO PAYMENTS WERE MADE, $500).</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>15. Indemnification</h2>
            <p>You agree to indemnify, defend, and hold harmless Potomac and its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising from or relating to: (a) your violation of these Terms; (b) your User Content; (c) your violation of third-party rights; or (d) your misuse of the Platform.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>16. Termination and Suspension</h2>
            <p>We may suspend or terminate your access to the Platform at any time for violation of these Terms, suspected fraudulent activity, a legal obligation, or for convenience upon notice. Upon termination, your license to use the Platform ends. We may preserve or delete User Content according to our retention policies and applicable law.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>17. Governing Law and Dispute Resolution</h2>
            <p>These Terms are governed by the laws of the state of Maryland, without regard to conflict of law principles. Except where prohibited by law, disputes arising from these Terms will be resolved via binding arbitration in Montgomery County, Maryland, under the rules of the American Arbitration Association, with each party bearing its own costs, except as the arbitrator may award fees.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>18. Export Compliance</h2>
            <p>You agree to comply with applicable export laws and regulations. You will not use the Platform in a manner that violates U.S. export laws or sanctions.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>19. Severability</h2>
            <p>If any provision of these Terms is found to be invalid or unenforceable, that provision will be enforced to the maximum extent permissible and the remaining provisions will remain in full force and effect.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>20. Entire Agreement</h2>
            <p>These Terms, together with any subscription agreement, Privacy Policy, and other documents incorporated by reference, constitute the entire agreement between you and Potomac regarding the Platform and supersede prior agreements.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>21. Contact</h2>
            <p>For questions about these Terms or to report abuse, please contact:</p>
            <div className="contact-info">
              <p><strong>Potomac Fund Management, Inc.</strong></p>
              <p>Email: privacy@potomac.com</p>
              <p>Address: 7373 Wisconsin Ave., Suite 750, Bethesda, MD 20814</p>
              <p>Phone: (301) 901-3466</p>
            </div>
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
          <Link href="/privacy" style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: '#EC4899',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}>
            Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}
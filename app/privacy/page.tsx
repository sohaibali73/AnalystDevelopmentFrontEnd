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
            This Privacy Policy explains how Potomac Fund Management, Inc. ("Potomac", "we", "us", or "our") collects, uses, shares, retains, and protects personal information in connection with the Potomac Analyst Platform (the "Platform"), our websites, and related services. By using the Platform or providing personal information, you agree to the collection and use described in this Policy.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

          <div className="legal-section">
            <h2>1. Introduction</h2>
            <p>This Privacy Policy explains how Potomac Fund Management, Inc. ("Potomac", "we", "us", or "our") collects, uses, shares, retains, and protects personal information in connection with the Potomac Analyst Platform (the "Platform"), our websites, and related services. This Policy applies to information collected through the Platform and related customer support, marketing, and sales interactions.</p>
            <p>If you are using the Platform on behalf of a business or organization, the organization is the controller of personal data and you represent that you are authorized to act on its behalf.</p>
            <p>By using the Platform or providing personal information, you agree to the collection and use described in this Policy. If you do not agree, do not use the Platform.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>2. Scope</h2>
            <p>This Policy covers:</p>
            <ul>
              <li>Information you provide directly (e.g., account registration, billing, support requests, uploaded content);</li>
              <li>Information generated by your use of the Platform (e.g., usage logs, AI prompts and responses, backtest results, conversation history);</li>
              <li>Information collected automatically from your devices and infrastructure (e.g., IP addresses, device fingerprints, cookies);</li>
              <li>Information obtained from third parties (e.g., market data providers and identity verification services).</li>
            </ul>
            <p>It applies to Potomac's collection and processing of personal data of users, administrators, and other individuals whose information is provided to Potomac through the Platform.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>3. Roles and Responsibilities</h2>
            <h3>Controller vs. Processor:</h3>
            <ul>
              <li>When Potomac determines the purposes and means of processing personal data for Platform operations and business purposes, Potomac is the data controller.</li>
              <li>When Potomac processes data on behalf of a customer (for example, where a customer uploads their own employees' or clients' data and instructs Potomac how to process it), Potomac may act as a processor. Specific roles will depend on contractual agreements.</li>
            </ul>
            <h3>Subprocessors:</h3>
            <p>We use third-party subprocessors to provide hosting, storage, AI processing, analytics, and infrastructure. Key subprocessors include Anthropic, PBC (Claude™), Vercel, Railway, and Supabase. We require subprocessors to maintain appropriate security and confidentiality obligations and we maintain a list of subprocessors which we can provide upon request.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>4. Information We Collect</h2>
            <p>Categories of information we collect include:</p>
            <ul>
              <li><strong>Account & Contact Information:</strong> name, business/organization name, email address, phone number, billing address, company role/title.</li>
              <li><strong>Authentication & Access Data:</strong> usernames, hashed passwords, authentication tokens, multi-factor authentication (MFA) metadata, single sign-on identifiers.</li>
              <li><strong>Billing & Payment Data:</strong> billing name and address, payment method details (credit card, invoicing). Note: payment processing may be handled by third-party payment processors; we do not store full payment card data unless explicitly required and securely tokenized.</li>
              <li><strong>User Content & Uploads:</strong> Documents, code (e.g., AFL), spreadsheets, attachments, knowledge base entries, and files you upload to the Platform.</li>
              <li><strong>Conversational & AI Query Data:</strong> prompts, messages, context metadata, user-selected settings (retention windows, opt-outs), and AI-generated outputs required to deliver Platform functionality.</li>
              <li><strong>Usage & Interaction Data:</strong> pages and features accessed, timestamps, session duration, clickstream data, application logs, debugging traces.</li>
              <li><strong>Technical & Device Data:</strong> IP address, browser type and version, operating system, device identifiers, screen resolution, language, time zone, and other device telemetry.</li>
              <li><strong>Market & Third-Party Data:</strong> public or licensed market data that you request or that Platform features retrieve from data vendors.</li>
              <li><strong>Support & Communications:</strong> support requests, chat logs with support staff, feedback, survey responses.</li>
              <li><strong>Cookies & Tracking Technologies:</strong> cookies, local storage identifiers, analytics tokens, and other tracking technologies as described below.</li>
            </ul>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>5. How We Use Information</h2>
            <p>We use collected information for:</p>
            <ul>
              <li>Providing, operating, and maintaining the Platform and customer accounts.</li>
              <li>Authenticating users, enforcing access controls and security policies.</li>
              <li>Processing AI queries and returning analytical results, charts, and model outputs.</li>
              <li>Storing and indexing uploaded documents and enabling search within the knowledge base.</li>
              <li>Monitoring, troubleshooting, and improving Platform performance, reliability, and user experience.</li>
              <li>Detecting and preventing fraud, abuse, and security incidents.</li>
              <li>Billing, invoicing, and collecting fees.</li>
              <li>Communicating with users about updates, feature changes, security notices, and support.</li>
              <li>Legal compliance, regulatory requirements, and to respond to lawful requests from authorities.</li>
              <li>Aggregated, de-identified analytics and product research (which cannot reasonably identify you).</li>
            </ul>
            <p>We rely on the following legal bases for processing personal data (where applicable):</p>
            <ul>
              <li>Performance of a contract (to provide the Platform and related services).</li>
              <li>Legitimate interests (improving the Platform, security, fraud prevention, business operations), balanced against user rights.</li>
              <li>Consent (where we request it, e.g., for marketing communications or specific AI training permissions).</li>
              <li>Legal obligations (to comply with laws, court orders, or regulatory requirements).</li>
            </ul>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>6. AI Processing, Model Training & Opt-Outs</h2>
            <h3>Third-Party AI Processing:</h3>
            <p>The Platform uses third-party AI providers (notably Anthropic, PBC), which process prompts and contextual data to generate outputs. When you use AI-enabled features, prompts and related metadata are transmitted to those providers for processing in accordance with their terms and our contractual protections.</p>
            <h3>Model Training:</h3>
            <p>We do not permit third-party AI providers to use customer content to train their general-purpose models without explicit contractual restrictions or your consent. Where possible, we include contractual prohibitions in our agreements with providers. If any AI provider indicates a need to use data for training, we will notify affected customers and obtain consent where required.</p>
            <h3>User Controls & Opt-Outs:</h3>
            <ul>
              <li>Platform users may opt out of having prompts or conversational data used for product improvement or model training.</li>
              <li>Users may configure retention windows for conversational data (e.g., 7 days, 30 days, 90 days, never), where technically feasible and subject to subscription/feature availability.</li>
              <li>Private-processing modes (transient, non-persisted processing) may be available for certain features; such modes are described in the Platform settings. We will honor user choices and enforce them in our processing flows before data is forwarded to any third-party AI service.</li>
            </ul>
            <h3>Recommendations:</h3>
            <p>Do not include sensitive personal data, client PII, or other confidential third-party data in prompts unless you have authorization and a lawful basis to do so.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>7. Cookies and Tracking</h2>
            <h3>Cookies and Similar Technologies:</h3>
            <p>We use cookies, local storage, web beacons, and similar technologies to operate the Platform, authenticate sessions, remember preferences, and collect analytics.</p>
            <h3>Categories:</h3>
            <ul>
              <li><strong>Strictly Necessary:</strong> required for core functionality and authentication.</li>
              <li><strong>Functional:</strong> store user preferences, UI choices.</li>
              <li><strong>Performance/Analytics:</strong> anonymized metrics for monitoring performance and usage.</li>
            </ul>
            <h3>Third-Party Analytics:</h3>
            <p>We may use analytics service providers to collect and analyze usage metrics. These services operate under our contracts and only with the data necessary for analytics.</p>
            <h3>Managing Cookies:</h3>
            <p>You may control cookie preferences via in-Platform settings (where available) and via your browser. Disabling certain cookies may affect functionality and the ability to maintain sessions.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>8. Data Sharing and Disclosure</h2>
            <p>We do not sell personal data for advertising purposes. We disclose personal data in the following limited circumstances:</p>
            <ul>
              <li><strong>Service Providers & Subprocessors:</strong> We share data with vendors who perform services on our behalf (e.g., hosting, storage, AI processing, analytics, payment processing). Subprocessors are contractually bound to process data only for providing their services and to implement security measures.</li>
              <li><strong>AI Processing Partners:</strong> As noted in Section 6, prompts and query data are transmitted to AI processing partners to generate responses.</li>
              <li><strong>Legal & Safety:</strong> We may disclose information to respond to lawful requests by public authorities, to comply with legal obligations, or to protect the safety, rights, or property of Potomac, users, or the public.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, personal data may be transferred to a successor entity; we will require the successor to honor this Policy.</li>
              <li><strong>Aggregated/De-identified Data:</strong> We may share aggregated insights that do not identify individuals.</li>
            </ul>
            <h3>Subprocessor List:</h3>
            <p>We maintain an up-to-date list of subprocessors and their roles; customers can request the list through privacy@potomac.com.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>9. International Transfers</h2>
            <p>The Platform's infrastructure and subprocessors may be located in multiple countries, including the United States. When transferring personal data across borders, we implement appropriate safeguards (e.g., Standard Contractual Clauses, contractual protections) and comply with applicable legal requirements for international transfers. Customers with specific localization needs should contact privacy@potomac.com.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>10. Data Retention</h2>
            <h3>Retention Principles:</h3>
            <p>We retain personal data only as long as necessary to provide the Platform, comply with legal obligations, resolve disputes, and enforce our agreements.</p>
            <h3>Typical Retention Periods (subject to change; configurable per contract or customer settings):</h3>
            <ul>
              <li>Account & billing records: retained for the life of the account plus a statutory or business-required period (commonly 6–7 years for tax and accounting).</li>
              <li>Uploaded documents and knowledge base files: retained until you delete them; archived copies may persist for legal reasons.</li>
              <li>Conversational & AI query history: default retention up to 90 days for debugging and product improvement; shorter or longer retention windows may be available per account settings.</li>
              <li>Usage logs and technical telemetry: retained up to 12 months unless required longer for security or compliance investigations.</li>
            </ul>
            <h3>Deletion Requests and Exports:</h3>
            <p>Users may request data export or deletion via in-Platform tools or by contacting privacy@potomac.com. We will verify identity and process requests in accordance with applicable law. Complete removal from backups may take additional time (e.g., up to 90 days).</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>11. Security</h2>
            <h3>Measures:</h3>
            <p>We maintain administrative, technical, and physical safeguards to protect personal data, including:</p>
            <ul>
              <li>TLS/HTTPS for data in transit.</li>
              <li>Encryption at rest for stored data (as provided by Supabase or equivalent provider-managed encryption).</li>
              <li>Role-based access controls (RBAC), MFA, and least-privilege access for internal systems.</li>
              <li>Regular security assessments, vulnerability scanning, and penetration testing.</li>
              <li>Secure credential storage, hashing, and parameterized database access.</li>
            </ul>
            <h3>Limitations and Responsibilities:</h3>
            <p>While we implement reasonable protections, no system can be guaranteed 100% secure. You are responsible for safeguarding credentials and ensuring sensitive data shared with the Platform is authorized and handled appropriately.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>12. Incident Response and Breach Notification</h2>
            <h3>Incident Handling:</h3>
            <p>We maintain an incident response plan and will promptly investigate and contain suspected security incidents.</p>
            <h3>Notification:</h3>
            <p>If a security incident materially affecting personal data occurs, we will notify affected users and regulators as required by applicable law, typically after identifying the incident, assessing its scope, and preparing remedial steps.</p>
            <h3>Vendor Obligations:</h3>
            <p>Subprocessors are contractually obligated to notify Potomac of security incidents affecting Potomac data within a defined timeframe (typically within 48 hours) and to cooperate in incident response.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>13. Children's Privacy</h2>
            <p>The Platform is intended for professional and institutional use and is not directed to children. We do not knowingly collect information from individuals under 18. If we learn that we have inadvertently collected data from a minor, we will delete the data and terminate the account.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>14. Your Choices and Rights</h2>
            <h3>Account Preferences:</h3>
            <p>You can review and update account information and preferences via in-Platform settings.</p>
            <h3>Data Subject Rights:</h3>
            <p>Depending on jurisdiction, you may have rights including access, correction, deletion, restriction of processing, objection, portability, and the right to withdraw consent. To exercise rights, contact privacy@potomac.com. We will verify your identity and respond within applicable legal timeframes.</p>
            <h3>Marketing Communications:</h3>
            <p>You may opt out of marketing emails by following the unsubscribe instructions in those emails or by contacting privacy@potomac.com.</p>
            <h3>AI & Data Processing Opt-Outs:</h3>
            <p>You may opt out of having prompts and conversational data used for product improvement or model training via in-Platform controls where available, or by contacting privacy@potomac.com. We will honor these settings when configured and enforce them before forwarding data to third-party providers.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>15. Third-Party Links and Embedded Content</h2>
            <p>The Platform may contain links to third-party websites and services. We do not control third-party privacy practices and encourage you to review their policies. Our policy does not apply to third-party sites or services.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>16. Data Transfers and Processors</h2>
            <h3>Primary subprocessors (examples; contact privacy@potomac.com for the current list and roles):</h3>
            <ul>
              <li><strong>Anthropic, PBC</strong> — AI processing (Claude™): processes prompts and returns AI outputs under contractual restrictions.</li>
              <li><strong>Vercel, Inc.</strong> — Front-end hosting and edge CDN: processes HTTP request metadata, edge logs, and caches static assets.</li>
              <li><strong>Railway</strong> — Backend application hosting and orchestration: may log request metadata and transient payloads during processing.</li>
              <li><strong>Supabase</strong> — Database and object storage: stores user accounts, uploaded files, conversation transcripts (if enabled), and backtest data. Supports region selection and encryption at rest.</li>
              <li><strong>Payment processors, analytics providers, and monitoring vendors</strong> — as required to operate the Platform.</li>
            </ul>
            <h3>Subprocessor Commitments:</h3>
            <p>We require subprocessors to implement technical and organizational measures appropriate to the risk. We execute data processing agreements that limit subprocessors to processing data only per Potomac's instructions and that require confidentiality and security controls.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>17. International, EU, and UK Users</h2>
            <p>If you are located in the EU or UK:</p>
            <ul>
              <li><strong>Legal Basis:</strong> We process personal data under contractual necessity, legitimate interests, consent (where provided), or legal obligations as appropriate.</li>
              <li><strong>Data Transfers:</strong> For transfers out of the EEA/UK, we rely on appropriate safeguards (e.g., Standard Contractual Clauses) and implement additional protections as needed.</li>
              <li><strong>Local Rights:</strong> Where local law grants additional rights (e.g., supervisory authority complaints, lead supervisory authority), you may contact us at privacy@potomac.com for assistance.</li>
            </ul>
            <h3>Data Protection Officer / Representative:</h3>
            <p>If applicable, we will provide a DPO or EU representative contact details upon request.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>18. Retention Specifics for Sensitive Content & Financial Data</h2>
            <p>Sensitive or highly regulated financial data should be treated carefully. Customers are responsible for ensuring they have appropriate legal bases for processing any personal or client financial data through the Platform.</p>
            <p>If specialized retention or localization is required for regulatory compliance (e.g., local data residency requirements), contact privacy@potomac.com to discuss contractual and technical accommodations.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>19. Changes to this Privacy Policy</h2>
            <p>We may update this Policy to reflect changes in our practices, technology, legal requirements, or service offerings. We will post the updated Policy with an updated effective date. For material changes, we will provide notice via in-Platform notifications, email to account contacts, or other reasonable means. Continued use following posted changes constitutes acceptance.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>20. Contact and Requests</h2>
            <p>For privacy inquiries, to request subprocessors list, exercise data subject rights, request data exports, discuss data residency, or report concerns:</p>
            <div className="contact-info">
              <p><strong>Email:</strong> privacy@potomac.com</p>
              <p><strong>Mail:</strong> Potomac Fund Management, Inc., 7373 Wisconsin Ave., Suite 750, Bethesda, MD 20814</p>
              <p><strong>Phone:</strong> (301) 901-3466</p>
            </div>
            <p style={{ marginTop: '12px' }}>For legal requests (e.g., law enforcement requests), please direct them to our legal team at legal@potomac.com (or privacy@potomac.com if no dedicated legal inbox exists).</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>21. Dispute Resolution and Governing Law</h2>
            <p>This Policy is governed by the laws specified in your customer agreement or Terms of Service (see Terms of Service for governing law and dispute resolution provisions). For users without a separate customer agreement, Maryland law governs to the extent permitted. Disputes may be subject to arbitration or the dispute mechanisms described in the Terms.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>22. Additional Notices and Disclosures</h2>
            <h3>California Privacy Rights:</h3>
            <p>If you are a California resident, you may have additional rights under the California Consumer Privacy Act (CCPA) / California Privacy Rights Act (CPRA). To exercise rights, submit requests to privacy@potomac.com. We will verify identity before processing requests. If you are a California resident and have questions about your rights, we can provide details on categories of personal information collected, categories of sources, business or commercial purposes for collection, and categories of third parties with whom information is shared.</p>
            <h3>Law Enforcement & Legal Process:</h3>
            <p>We may disclose data in response to lawful legal process (e.g., subpoenas) or to investigate, prevent, or take action regarding illegal activities or violations of our policies. We will endeavor to notify customers of legal requests affecting their data when legally permitted and consistent with contractual obligations.</p>
            <h3>EU/UK Data Subject Requests:</h3>
            <p>We will respond to EU/UK data subject access requests as required by applicable law. Please include sufficient information to help us locate the requested data (account email, organization name, timeframe).</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>23. How to Request More Information</h2>
            <ul>
              <li><strong>Subprocessors List:</strong> Contact privacy@potomac.com for the current subprocessor list and their roles.</li>
              <li><strong>Data Processing Agreement (DPA):</strong> Customers may request a DPA (including security and transfer clauses) for inclusion in customer contracts.</li>
              <li><strong>Security Documentation:</strong> We can provide summary security materials or SOC/attestation information to customers under NDA or via contractual processes.</li>
            </ul>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>24. Best Practices for Customers</h2>
            <ul>
              <li>Limit sensitive personal data sent to prompts; where necessary, ensure legal basis and contractual protections are in place.</li>
              <li>Use private or ephemeral processing modes for sensitive queries if available.</li>
              <li>Configure retention and opt-out settings in the Platform according to your compliance needs.</li>
              <li>Maintain strong internal access controls and train staff on data handling policies.</li>
            </ul>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>25. Definitions</h2>
            <ul>
              <li><strong>"Personal data"</strong> or <strong>"personal information"</strong> means information that identifies or can be associated with an identifiable person.</li>
              <li><strong>"User Content"</strong> means content you upload, submit, or generate via the Platform.</li>
              <li><strong>"Subprocessors"</strong> means third-party service providers that process data on our behalf.</li>
            </ul>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>26. Acknowledgements</h2>
            <p>By using the Platform, you acknowledge and accept this Privacy Policy and our practices described herein. This Policy is incorporated into and subject to the Terms of Service and any applicable customer agreements.</p>
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
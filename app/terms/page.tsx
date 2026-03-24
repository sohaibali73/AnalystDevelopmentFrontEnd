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
            <strong style={{ color: '#FEC00F' }}>Developer Beta Release Candidate 2 Notice:</strong> This software is currently in a pre-release beta state. Features, functionality, and terms are subject to change prior to the final release. By accessing this platform you acknowledge and accept the beta nature of this software.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

          <div className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using the Potomac Analyst platform ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Platform. These Terms apply to all users of the Platform, including without limitation users who are contributors of content, information, and other materials.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>2. Description of Service</h2>
            <p>The Potomac Analyst Platform is an AI-powered financial analysis tool designed for institutional and professional traders. The Platform provides:</p>
            <ul>
              <li>AI-assisted AFL (AmiBroker Formula Language) code generation</li>
              <li>Conversational AI chat for trading strategy research</li>
              <li>Knowledge base management and document analysis</li>
              <li>Backtest analysis and reverse engineering tools</li>
              <li>Market data retrieval and presentation generation</li>
            </ul>
            <p>The Platform is currently in Developer Beta (Release Candidate 2). Features may be incomplete, unstable, or subject to change without notice.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>3. User Accounts & Access</h2>
            <p>Access to the Platform requires a registered account. You are responsible for:</p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying Potomac Fund Management immediately of any unauthorized use</li>
              <li>Ensuring that your account information remains accurate and up to date</li>
            </ul>
            <p>Accounts are non-transferable. Access is granted solely to the registered individual or authorized entity.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>4. Permitted Use & Restrictions</h2>
            <p>You may use the Platform solely for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
            <ul>
              <li>Use the Platform to generate, distribute, or act upon financial advice without appropriate regulatory authorization</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of the Platform</li>
              <li>Share, resell, or sublicense access to the Platform to third parties</li>
              <li>Use automated scripts, bots, or other means to scrape or harvest data from the Platform</li>
              <li>Upload malicious code, viruses, or other harmful materials</li>
              <li>Violate any applicable local, national, or international laws or regulations</li>
            </ul>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>5. AI-Generated Content Disclaimer</h2>
            <p>The Platform utilizes third-party AI models (including Claude™ by Anthropic, PBC) to generate content. You acknowledge that:</p>
            <ul>
              <li>AI-generated content may be inaccurate, incomplete, or inappropriate for specific financial decisions</li>
              <li>The Platform does not constitute financial, investment, legal, or tax advice</li>
              <li>All trading decisions are made at your own risk and discretion</li>
              <li>Past performance of any AI-generated strategy does not guarantee future results</li>
              <li>You should independently verify all AI-generated analysis before making investment decisions</li>
            </ul>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>6. Intellectual Property</h2>
            <p>All content, features, and functionality of the Platform — including but not limited to text, graphics, logos, software, and source code — are owned by Potomac Fund Management, Inc. and are protected by applicable intellectual property laws.</p>
            <p>You retain ownership of any documents or data you upload to the Platform. By uploading content, you grant Potomac Fund Management a limited, non-exclusive license to process such content solely for the purpose of providing the Platform services.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>7. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law, Potomac Fund Management, Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation loss of profits, data, or goodwill, arising from your use of or inability to use the Platform.</p>
            <p>In no event shall our total liability to you for any claims exceed the amount you paid, if any, for access to the Platform in the twelve (12) months preceding the claim.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>8. Modifications to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the Platform. Your continued use of the Platform following any modifications constitutes your acceptance of the revised Terms. We will provide reasonable notice of material changes where practicable.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>9. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the United States and the State of Delaware, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Delaware.</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          <div className="legal-section">
            <h2>10. Contact</h2>
            <p>If you have questions about these Terms, please contact Potomac Fund Management, Inc. through the platform's support channels or via your account representative.</p>
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

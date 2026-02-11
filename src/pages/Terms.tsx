/**
 * Ziggy Online Debate Platform
 * © 2011-2025 Justus Aryani. All Rights Reserved.
 * Proprietary and Confidential.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4 font-primary">Terms of Service</h1>
          <p className="text-muted-foreground text-lg font-secondary">
            Please read these terms carefully before using our platform
          </p>
        </div>

        <Card className="glass-card">
          <div className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none dark:prose-invert">
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4 font-primary">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed mb-4 font-secondary">
                  By accessing and using the Ziggy Online Debate platform ("Platform"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this Platform.
                </p>
              </section>

              <Separator className="my-8" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4 font-primary">2. Intellectual Property & Ownership</h2>
                <p className="text-muted-foreground leading-relaxed mb-4 font-secondary">
                  The Ziggy Online Debate platform, including but not limited to all source code, software, designs, user interface, graphics, logos, trademarks, architecture, documentation, and all associated intellectual property, is <strong>proprietary software licensed to Galactic Horizons LLC – Series 1 – Ziggy Online Debate, Protected Series</strong>.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4 font-secondary">
                  All rights, title, and interest in and to the Platform and its components are reserved. The Ziggy brand, logo, and related trademarks are the property of Galactic Horizons LLC.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4 font-secondary">
                  <strong>© 2011-{new Date().getFullYear()} Galactic Horizons LLC. All Rights Reserved.</strong>
                </p>
                <p className="text-muted-foreground leading-relaxed font-secondary">
                  Unauthorized copying, reproduction, modification, distribution, transmission, republication, display, or performance of any portion of this Platform or its underlying source code is strictly prohibited and may result in severe civil and criminal penalties.
                </p>
              </section>

              <Separator className="my-8" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4 font-primary">3. Use License</h2>
                <p className="text-muted-foreground leading-relaxed mb-4 font-secondary">
                  Permission is granted to temporarily access and use the Platform for personal, non-commercial transitory viewing and participation in debate tournaments only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc pl-6 mb-6 text-muted-foreground space-y-2 font-secondary">
                  <li>Modify or copy the Platform's materials or source code</li>
                  <li>Use the materials for any commercial purpose or public display</li>
                  <li>Attempt to decompile or reverse engineer any software contained on the Platform</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                  <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed font-secondary">
                  This license shall automatically terminate if you violate any of these restrictions and may be terminated by Ziggy Online Debate at any time.
                </p>
              </section>

              <Separator className="my-8" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4 font-primary">4. User Conduct</h2>
                <p className="text-muted-foreground leading-relaxed mb-4 font-secondary">
                  Users agree to use the Platform only for lawful purposes and in a manner consistent with all applicable local, state, national, and international laws and regulations. Users shall not:
                </p>
                <ul className="list-disc pl-6 mb-6 text-muted-foreground space-y-2 font-secondary">
                  <li>Harass, abuse, or harm another person or group</li>
                  <li>Use the Platform to distribute spam or unsolicited communications</li>
                  <li>Interfere with or disrupt the Platform or servers</li>
                  <li>Attempt to gain unauthorized access to any portion of the Platform</li>
                  <li>Violate the rules of fair competition during debate rounds</li>
                </ul>
              </section>

              <Separator className="my-8" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4 font-primary">5. Disclaimer</h2>
                <p className="text-muted-foreground leading-relaxed font-secondary">
                  The materials on the Platform are provided on an 'as is' basis. Ziggy Online Debate makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </p>
              </section>

              <Separator className="my-8" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4 font-primary">6. Limitations</h2>
                <p className="text-muted-foreground leading-relaxed font-secondary">
                  In no event shall Ziggy Online Debate or Galactic Horizons LLC be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the Platform, even if Ziggy Online Debate or an authorized representative has been notified orally or in writing of the possibility of such damage.
                </p>
              </section>

              <Separator className="my-8" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4 font-primary">7. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed font-secondary">
                  These terms and conditions are governed by and construed in accordance with the laws of the United States of America and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
                </p>
              </section>

              <Separator className="my-8" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4 font-primary">8. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed font-secondary">
                  Ziggy Online Debate reserves the right to revise these terms of service at any time without notice. By using this Platform you are agreeing to be bound by the then current version of these terms of service.
                </p>
              </section>

              <Separator className="my-8" />

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4 font-primary">9. Contact</h2>
                <p className="text-muted-foreground leading-relaxed font-secondary">
                  Any questions about these Terms of Service may be directed to <a href="mailto:legal@ziggyonlinedebate.com" className="text-primary hover:underline">legal@ziggyonlinedebate.com</a>.
                </p>
              </section>

            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
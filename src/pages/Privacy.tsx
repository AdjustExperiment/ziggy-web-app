import React from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg">
            Learn how we collect, use, and protect your information
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg">
          <div className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none dark:prose-invert">
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Introduction</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Ziggy Online Debate is fully owned and operated by "Galactic Horizons LLC – Series 1 – Ziggy Online Debate, Protected Series," a series of Galactic Horizons LLC <em>(www.galactichorizons.com)</em>.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Ziggy Online Debate provides an online platform for people to compete, schedule, and judge debate rounds. Accordingly, we collect information from you when you choose to sign up for our services or purchase our products. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and or service. Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the site or use our services.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We collect information about how and when people visit our website. All of the information we collect is used only for the successful operation of Ziggy Online Debate, and we do not sell your information to anyone, ever. We will also never disclose any such information to any government entity without a lawful court order.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We reserve the right to make changes to this Privacy Policy at any time and for any reason. We will alert you about any changes by updating the "Last Updated" date of this Privacy Policy. Any changes or modifications will be effective immediately upon posting the updated Privacy Policy on the Site, and you waive the right to receive specific notice of each such change or modification.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  You are encouraged to periodically review this Privacy Policy to stay informed of updates. You will be deemed to have been made aware of, will be subject to, and will be deemed to have accepted the changes in any revised Privacy Policy by your continued use of the Site after the date such revised Privacy Policy is posted.
                </p>
              </section>

              <Separator className="my-8" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Personal Data Collection</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  For anyone who uses our services, we collect the following personal information, referred to in this document as "personal data":
                </p>
                <ul className="list-disc pl-6 mb-6 text-muted-foreground space-y-1">
                  <li>Student's full name</li>
                  <li>Student's age</li>
                  <li>Student's email</li>
                  <li>Student's phone number</li>
                  <li>Name of debate partner (if applicable)</li>
                  <li>Parent or judge's full name</li>
                  <li>Parent or judge's email</li>
                  <li>Parent or judge's phone number</li>
                  <li>Student's time zone</li>
                  <li>State of residence</li>
                  <li>Debate club name</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  All of this information is used only for Ziggy purposes, which entails three primary uses:
                </p>
                <ol className="list-decimal pl-6 mb-6 text-muted-foreground space-y-2">
                  <li>contacting and connecting participants (students, parents, and judges) about Ziggy tournament functions, features, and information;</li>
                  <li>advertising about Ziggy (encouraging new sign ups for future semesters); and</li>
                  <li>advertising about services offered by partner organizations (which are always sent out by Ziggy directly, never by partner organizations; partner organizations never get unlimited access to your contact information, and cannot ever access more than what is listed on the tournament web app—i.e., name, email, and phone number).</li>
                </ol>
                <p className="text-muted-foreground leading-relaxed">
                  Tournament results (any information on the ballots not including personal data) are not included in the definition of "personal data" and may be used for promotional, marketing, or any other purpose. Unless consent is otherwise granted, any tournament results shared with any party will be fully anonymized (i.e., the analytics we publish at the end of each semester tournament—that is based on tournament results with personal data removed).
                </p>
              </section>

              <Separator className="my-8" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Where we ourselves directly store your data (as opposed to when stored with third parties)—i.e., through the Ziggy Tournament Platform—we use industry-standard encryption for protection.
                </p>
              </section>

              <Separator className="my-8" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Third Parties</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Although we never give any third party direct access to personal data in the aggregate (meaning that no one besides Ziggy has a full list of everyone's personal information) without your consent, anyone who uses Ziggy (other students, other parents, and judges) is technically able to click on each person's name and view their email address and phone number(s), but that is the only direct personal information they have access to. None of the other personal information is available to Ziggy participants. Enabling communication between participants is a core function of Ziggy Online Debate. Coaches who serve as Ziggy judges have been given permission to contact anyone they judge with information about their coaching services.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We do use third-party services such as Google (for tracking who visits individual web pages how often, for managing email and our website's domain name, and for collection of registration information into Google Sheets), web hosting services, Paypal and Venmo (for receiving and processing payments), and SendGrid (which is the service we use for allowing Ziggy notification emails to be automatically sent). We reserve the right to change any of these service providers in the future, but all of these companies provide their own privacy policies that you can look up if you choose. As stated above, none of the above third parties will ever be given direct and complete access to all of your information (except for Google and our web hosting services, which we store user registration with through Google Drive and which host the tournament web app and all the information contained in it, respectively).
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Users of Ziggy are not authorized to use any of the information available to them for purposes beyond Ziggy. That means you may never use the personal information available to you as a Ziggy user for purposes of solicitation, advertising, or any other purpose beyond contacting people regarding Ziggy tournaments.
                </p>
              </section>

              <Separator className="my-8" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Children Under 13 and COPPA Compliance</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Under federal law (Children's Online Privacy Protection Act), we must take specific additional actions if a Ziggy participant is under 13 years old AND signs themselves up for Ziggy. Accordingly, we do not permit anyone under age 13 to sign themselves up for Ziggy. If a debater under age 13 wants to participate in Ziggy, their parent or legal guardian must sign them up and must indicate such on the registration form.
                </p>
              </section>

              <Separator className="my-8" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Rules</h2>
                <p className="text-muted-foreground leading-relaxed">
                  All users of Ziggy agree that by registering for Ziggy, per the agreement in the registration form, they agree to abide by all <a href="https://ziggyonlinedebate.com/rules" className="text-primary hover:underline">Rules</a> of Ziggy Online Debate. These Rules are subject to change. Agreement to abide by the Rules is binding on all Ziggy users even if the Rules are changed after they register. If a new Rule is created in response to action that Ziggy seeks to restrict, the user will not be penalized for violating a Rule if it was not contrary to the Rules at the time of the action. However, subsequent violations of the new Rule will be penalized per the Rules. It is the responsibility of Ziggy users to stay up-to-date with the current Ziggy Rules, and Ziggy is under no obligation to notify users of new Rule changes.
                </p>
              </section>

              <Separator className="my-8" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Tournament Partners</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If Ziggy partners with a third party to co-host a tournament, such as the Ace Peak x Ziggy 2020 tournament series, or the Ziggy + Lasting Impact 2021 National Championship, this privacy policy will only apply to the extent that it does not forbid the third party from sharing access to the data collected for that tournament by the joint Ziggy+co-host. The co-host will retain full access to information collected through registration for the joint tournament and Ziggy provides no guarantees about the use of such data by any third party. Please verify with any joint host organizations for their specific privacy guarantees.
                </p>
              </section>

              <Separator className="my-8" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Conclusion</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the exclusive right to interpret this Policy. Any questions about this Privacy & Legal Policy may be directed to <a href="mailto:legal@ziggyonlinedebate.com" className="text-primary hover:underline">legal@ziggyonlinedebate.com</a>.
                </p>
              </section>

            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
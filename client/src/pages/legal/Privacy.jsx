// Privacy Policy page
import './Terms.scss';

const Privacy = () => {
  return (
    <div className="legal">
      <div className="legal__container">
        <h1 className="legal__title">Privacy Policy</h1>
        <p className="legal__updated">Last updated: June 2026</p>

        <section className="legal__section">
          <h2>1. Information We Collect</h2>
          <p>When you use Cattle & Crop we collect:</p>
          <ul>
            <li>Account information (name, email address, location)</li>
            <li>Transaction data (orders, payments, listings)</li>
            <li>Usage data (pages visited, features used)</li>
            <li>Farm and product information provided by farmers</li>
            <li>Reviews and ratings you submit</li>
          </ul>
        </section>

        <section className="legal__section">
          <h2>2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and improve the Platform</li>
            <li>Process transactions between farmers and consumers</li>
            <li>Send order confirmations and important updates</li>
            <li>Detect and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="legal__section">
          <h2>3. Payment Information</h2>
          <p>
            We do not store your credit card information. All payment data
            is handled securely by Stripe, our payment processor. Please
            review Stripe's Privacy Policy for information on how they
            handle your payment data.
          </p>
        </section>

        <section className="legal__section">
          <h2>4. Information Sharing</h2>
          <p>
            We do not sell your personal information to third parties.
            We share your information only in these circumstances:
          </p>
          <ul>
            <li>With farmers to fulfill your orders (name and contact info)</li>
            <li>With payment processors to complete transactions</li>
            <li>With email service providers to send notifications</li>
            <li>When required by law or legal process</li>
          </ul>
        </section>

        <section className="legal__section">
          <h2>5. Data Storage</h2>
          <p>
            Your data is stored securely on MongoDB Atlas servers.
            We implement industry standard security measures to protect
            your information from unauthorized access.
          </p>
        </section>

        <section className="legal__section">
          <h2>6. Cookies</h2>
          <p>
            We use browser local storage to keep you logged in between
            sessions. We do not use third party tracking cookies or
            advertising cookies. We do not serve ads on our platform.
          </p>
        </section>

        <section className="legal__section">
          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and associated data</li>
            <li>Opt out of non-essential communications</li>
          </ul>
          <p>
            To exercise these rights contact us at hello@cattleandcrop.com
          </p>
        </section>

        <section className="legal__section">
          <h2>8. Children's Privacy</h2>
          <p>
            Cattle & Crop is not intended for users under the age of 18.
            We do not knowingly collect information from minors.
          </p>
        </section>

        <section className="legal__section">
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will notify
            registered users of significant changes via email.
          </p>
        </section>

        <section className="legal__section">
          <h2>10. Contact</h2>
          <p>
            For privacy related questions contact us at
            hello@cattleandcrop.com
          </p>
        </section>

      </div>
    </div>
  );
};

export default Privacy;
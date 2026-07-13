// Terms of Service page
import './Terms.scss';
import PageMeta from '../../components/common/PageMeta';

const Terms = () => {
  return (
    <div className="legal">
      <PageMeta title="Terms of Service | Cattle & Crop" />
      <div className="legal__container">
        <h1 className="legal__title">Terms of Service</h1>
        <p className="legal__updated">Last updated: June 2026</p>

        <section className="legal__section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Cattle & Crop ("the Platform"), you agree
            to be bound by these Terms of Service. If you do not agree to
            these terms, please do not use the Platform.
          </p>
        </section>

        <section className="legal__section">
          <h2>2. Description of Service</h2>
          <p>
            Cattle & Crop is a direct-to-consumer marketplace that connects
            farmers and ranchers with local buyers. We provide the technology
            platform but are not a party to transactions between farmers and
            consumers.
          </p>
        </section>

        <section className="legal__section">
          <h2>3. User Accounts</h2>
          <p>
            You must create an account to use certain features of the Platform.
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activities that occur under your
            account. You must provide accurate and complete information when
            creating your account.
          </p>
        </section>

        <section className="legal__section">
          <h2>4. Farmer Responsibilities</h2>
          <p>
            Farmers and ranchers using the Platform agree to:
          </p>
          <ul>
            <li>Provide accurate descriptions of all products listed</li>
            <li>Comply with all applicable federal, state, and local food safety laws</li>
            <li>Honor confirmed orders in a timely manner</li>
            <li>Ensure all products meet the quality described in listings</li>
            <li>Comply with USDA regulations for meat processing and sales</li>
          </ul>
        </section>

        <section className="legal__section">
          <h2>5. Consumer Responsibilities</h2>
          <p>
            Consumers using the Platform agree to:
          </p>
          <ul>
            <li>Provide accurate payment and contact information</li>
            <li>Pick up orders at the agreed upon time and location</li>
            <li>Leave honest and accurate reviews based on actual purchases</li>
            <li>Not misuse the review system to harm farmers unfairly</li>
          </ul>
        </section>

        <section className="legal__section">
          <h2>6. Platform Fees</h2>
          <p>
            Cattle & Crop charges a 4% platform fee on all completed
            transactions. This fee is automatically deducted from the
            farmer's payout. Consumers pay the listed price with no
            additional hidden fees.
          </p>
        </section>

        <section className="legal__section">
          <h2>7. Payments</h2>
          <p>
            All payments are processed securely through Stripe. Cattle & Crop
            does not store credit card information. By making a purchase you
            agree to Stripe's Terms of Service. Refunds are handled on a
            case by case basis between the farmer and consumer.
          </p>
        </section>

        <section className="legal__section">
          <h2>8. Prohibited Activities</h2>
          <p>Users may not:</p>
          <ul>
            <li>List products that are illegal or misrepresented</li>
            <li>Engage in fraudulent transactions</li>
            <li>Harass or threaten other users</li>
            <li>Attempt to circumvent the platform fee by transacting off-platform</li>
            <li>Create fake reviews or manipulate ratings</li>
            <li>Use the platform for any unlawful purpose</li>
          </ul>
        </section>

        <section className="legal__section">
          <h2>9. Limitation of Liability</h2>
          <p>
            Cattle & Crop is not liable for the quality, safety, or legality
            of products listed on the platform. We are a technology provider
            connecting buyers and sellers. Any disputes regarding product
            quality must be resolved between the farmer and consumer directly.
            Our liability is limited to the amount of platform fees collected
            on the disputed transaction.
          </p>
        </section>

        <section className="legal__section">
          <h2>10. Intellectual Property</h2>
          <p>
            The Cattle & Crop name, logo, tagline "Skip the store. Know your
            farmer.", and all associated branding are the exclusive property
            of Cattle & Crop. Unauthorized use is strictly prohibited.
            See our Trademark Notice for more information.
          </p>
        </section>

        <section className="legal__section">
          <h2>11. Termination</h2>
          <p>
            We reserve the right to suspend or terminate any account that
            violates these Terms of Service at our sole discretion and without
            prior notice.
          </p>
        </section>

        <section className="legal__section">
          <h2>12. Changes to Terms</h2>
          <p>
            We may update these Terms of Service at any time. Continued use
            of the Platform after changes constitutes acceptance of the
            new terms.
          </p>
        </section>

        <section className="legal__section">
          <h2>13. Contact</h2>
          <p>
            For questions about these Terms of Service please contact us at
            hello@cattleandcrop.com
          </p>
        </section>

      </div>
    </div>
  );
};

export default Terms;
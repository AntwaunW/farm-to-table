// Trademark Notice page
import './Terms.scss';

const Trademark = () => {
  return (
    <div className="legal">
      <div className="legal__container">
        <h1 className="legal__title">Trademark Notice</h1>
        <p className="legal__updated">Last updated: June 2026</p>

        <section className="legal__section">
          <h2>Cattle & Crop Trademarks</h2>
          <p>
            The following are trademarks of Cattle & Crop and may not be
            used without prior written permission:
          </p>
          <ul>
            <li>
              <strong>Cattle & Crop™</strong> — the name and brand
            </li>
            <li>
              <strong>"Skip the store. Know your farmer."™</strong> — 
              our tagline
            </li>
            <li>
              <strong>The Cattle & Crop logo</strong> — all variations
              and iterations
            </li>
          </ul>
        </section>

        <section className="legal__section">
          <h2>Trademark Application</h2>
          <p>
            Cattle & Crop has filed for trademark registration with the
            United States Patent and Trademark Office (USPTO) for the
            Cattle & Crop name and logo. Unauthorized use of our
            trademarks is prohibited under federal law.
          </p>
        </section>

        <section className="legal__section">
          <h2>Permitted Use</h2>
          <p>
            You may reference Cattle & Crop by name for editorial,
            informational, or review purposes only. You may not:
          </p>
          <ul>
            <li>Use our name or logo in a way that implies endorsement</li>
            <li>Create a confusingly similar brand or product name</li>
            <li>Use our trademarks in domain names or social media handles</li>
            <li>Reproduce our logo without written permission</li>
          </ul>
        </section>

        <section className="legal__section">
          <h2>Copyright</h2>
          <p>
            © 2026 Cattle & Crop. All rights reserved. All content on
            this platform including text, graphics, logos, and software
            is the property of Cattle & Crop and is protected by
            United States copyright law.
          </p>
        </section>

        <section className="legal__section">
          <h2>Reporting Infringement</h2>
          <p>
            If you believe someone is infringing on Cattle & Crop's
            intellectual property please contact us immediately at
            legal@cattleandcrop.com
          </p>
        </section>

      </div>
    </div>
  );
};

export default Trademark;
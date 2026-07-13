import { Link } from 'react-router-dom';
import './About.scss';
import PageMeta from '../components/common/PageMeta';

const values = [
  {
    icon: '🌾',
    title: 'Farm Transparency',
    body: 'You deserve to know exactly how your food was raised, what it was fed, and who grew it. No labels. No guessing. Just a direct line to the source.',
  },
  {
    icon: '🤝',
    title: 'Fair to Farmers',
    body: 'Industrial pricing squeezes farmers to the bone. We charge a flat 4% platform fee and nothing more — farmers keep what they earn, every time.',
  },
  {
    icon: '🏡',
    title: 'Rooted in Community',
    body: 'Every purchase on Cattle & Crop stays local. You\'re not feeding a corporation — you\'re feeding your neighbor\'s livelihood and your own community.',
  },
];

const About = () => {
  return (
    <div className="about">
      <PageMeta title="About Us | Cattle & Crop" />

      {/* Hero */}
      <section className="about__hero">
        <div className="about__hero-container">
          <span className="about__hero-tag">Farm-grown. Community-driven.</span>
          <h1 className="about__hero-title">
            Skip the store.<br />Know your farmer.
          </h1>
          <p className="about__hero-subtitle">
            Cattle & Crop is building the bridge between local farms
            and local tables — one direct relationship at a time.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="about__mission">
        <div className="about__container">
          <p className="about__mission-label">Our Mission</p>
          <blockquote className="about__mission-quote">
            "We believe the most powerful thing a family can do is know where
            their food comes from. We exist to make that possible for every
            family — not just those with access to a farmers market."
          </blockquote>
        </div>
      </section>

      {/* Values */}
      <section className="about__values">
        <div className="about__container">
          <h2 className="about__section-title">What We Stand For</h2>
          <div className="about__values-grid">
            {values.map((v) => (
              <div key={v.title} className="about__value-card">
                <span className="about__value-icon">{v.icon}</span>
                <h3 className="about__value-title">{v.title}</h3>
                <p className="about__value-body">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="about__story">
        <div className="about__container about__story-container">
          <div className="about__story-text">
            <h2 className="about__section-title">Why We Built This</h2>
            <p>
              We started Cattle & Crop because we were frustrated with the
              distance between farms and tables. Industrial supply chains meant
              farmers got paid less, and consumers got food that traveled
              hundreds of miles before reaching a plate. We knew there was a
              better way.
            </p>
            <p>
              Built from Texas, for everyone — Cattle & Crop connects families
              directly with the ranchers and growers who raise their food.
              No middlemen. No mystery. Just honest food from people who
              care about what they grow.
            </p>
            <p>
              We're still early — starting in Texas, with more regions on
              the way. Every farm that joins, every family that buys direct,
              and every relationship built through this platform makes the
              food system a little more honest. That's the company we're
              building.
            </p>
          </div>
          <div className="about__story-stat-col">
            <div className="about__stat">
              <span className="about__stat-number">4%</span>
              <span className="about__stat-label">Flat platform fee — that's all we take</span>
            </div>
            <div className="about__stat">
              <span className="about__stat-number">100%</span>
              <span className="about__stat-label">Farm direct — every listing, every time</span>
            </div>
            <div className="about__stat">
              <span className="about__stat-number">Direct</span>
              <span className="about__stat-label">Farm to you — no warehouse, no middleman</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Support */}
      <section className="about__support">
        <div className="about__container">
          <h2 className="about__section-title about__section-title--center">
            Why Support Cattle & Crop?
          </h2>
          <p className="about__support-lead">
            When you buy direct from a local farm or ranch, you're not just
            buying food. You're casting a vote for a food system built on trust.
          </p>
          <ul className="about__support-list">
            <li>You're keeping small farms alive in an era of consolidation</li>
            <li>You're getting food that hasn't sat in a warehouse for two weeks</li>
            <li>You're paying a fair price that actually reaches the farmer</li>
            <li>You're building a relationship with the person who feeds your family</li>
            <li>You're supporting a locally-owned business, not a national corporation</li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="about__cta">
        <div className="about__container about__cta-inner">
          <div>
            <h2 className="about__cta-title">Ready to meet your farmer?</h2>
            <p className="about__cta-subtitle">Browse local farms and buy direct today.</p>
          </div>
          <div className="about__cta-btns">
            <Link to="/browse" className="about__cta-btn about__cta-btn--primary">Browse farms</Link>
            <Link to="/register" className="about__cta-btn about__cta-btn--outline">List your farm</Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;

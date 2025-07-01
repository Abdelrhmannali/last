import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./LandingPage.css";
import {
  FaCog,
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaChartBar,
  FaTasks,
  FaSmile,
  FaRocket,
  FaShieldAlt,
  FaHeadset,
  FaFacebook,
  FaWhatsapp,
  FaTwitter,
  FaLinkedin,
} from "react-icons/fa";

export default function LandingPage() {
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
  };

  const stats = [
    { icon: <FaUsers size={38} />, label: "Employees", value: "500+" },
    { icon: <FaClock size={38} />, label: "Hours Tracked", value: "10,000+" },
    {
      icon: <FaCheckCircle size={38} />,
      label: "Attendance Records",
      value: "50,000+",
    },
    { icon: <FaChartBar size={38} />, label: "Reports Generated", value: "1,000+" },
    { icon: <FaTasks size={38} />, label: "Projects Completed", value: "200+" },
    { icon: <FaSmile size={38} />, label: "User Satisfaction", value: "95%" },
  ];

  const features = [
    {
      icon: <FaClock size={38} />,
      title: "Attendance Tracking",
      description:
        "Effortlessly track employee attendance with real-time updates and detailed reports.",
    },
    {
      icon: <FaChartBar size={38} />,
      title: "Payroll Management",
      description:
        "Streamline payroll processing with automated calculations and deductions.",
    },
    {
      icon: <FaCog size={38} />,
      title: "Settings Customization",
      description:
        "Customize your HR settings to fit your organization's unique needs.",
    },
  ];

  const whyChooseUs = [
    {
      icon: <FaRocket size={38} />,
      title: "Easy to Use",
      description: "Intuitive interface designed for all users, no training required.",
    },
    {
      icon: <FaShieldAlt size={38} />,
      title: "Secure & Reliable",
      description:
        "Your data is protected with top-tier security and reliable performance.",
    },
    {
      icon: <FaHeadset size={38} />,
      title: "24/7 Support",
      description: "Get help anytime with our dedicated support team.",
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Form submitted! (This is a static demo)");
  };

  return (
    <div className="land-page-wrapper">
      {/* Navbar */}
  <nav className="land-nav fixed-top">
  <div className="land-nav-logo">
    <img src="/src/assets/images/logo.png" className="land-nav-logo" />
    
  </div>

  <div className="land-nav-links">
    <a href="#features" className="land-nav-link">Features</a>
    <a href="#impact" className="land-nav-link">Our Impact</a>
    <a href="#about" className="land-nav-link">About</a>
    <a href="#why-choose" className="land-nav-link">Why Choose Us</a>
    <a href="#contact" className="land-nav-link">Contact</a>
  </div>

  <a href="/login" className="land-nav-button">Login</a>
</nav>


      {/* Hero Section with Slider */}
      <section className="land-hero">
        <Slider {...sliderSettings}>
          <div>
            <img
              src="https://images.unsplash.com/photo-1516321310762-479437144403"
              alt="HR Dashboard"
              className="land-slider-img"
            />
          </div>
          <div>
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978"
              alt="Team Collaboration"
              className="land-slider-img"
            />
          </div>
          <div>
            <img
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40"
              alt="Analytics"
              className="land-slider-img"
            />
          </div>
        </Slider>
      </section>

      {/* Features Section */}
      <section id="land-features" className="land-features">
        <h2>Our Features</h2>
        <div className="land-features-container">
          {features.map((feature, index) => (
            <div key={index} className="land-feature-card">
              {feature.icon}
              <h3 className="land-feature-title">{feature.title}</h3>
              <p className="land-feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Impact Section */}
      <section id="land-impact" className="land-impact">
        <h2>Our Impact</h2>
        <div className="land-impact-container">
          {stats.map((stat, index) => (
            <div key={index} className="land-impact-card">
              {stat.icon}
              <p className="land-impact-label">{stat.label}</p>
              <h3 className="land-impact-value">{stat.value}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* About the System Section */}
      <section id="land-about" className="land-about">
        <h2>About Our System</h2>
        <div className="land-about-container">
          <FaCog className="land-about-icon" />
          <p className="land-about-text">
            Our HR System is a comprehensive solution designed to streamline your
            human resource management. From tracking employee attendance and
            managing payroll to customizing settings for your organization, our
            platform offers an intuitive and powerful interface to simplify your
            HR tasks. Built with modern technology, it ensures reliability,
            security, and scalability for businesses of all sizes.
          </p>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="land-why-choose" className="land-why-choose">
        <h2>Why Choose Us</h2>
        <div className="land-why-choose-container">
          {whyChooseUs.map((item, index) => (
            <div key={index} className="land-why-choose-card">
              {item.icon}
              <h3 className="land-why-choose-title">{item.title}</h3>
              <p className="land-why-choose-description">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="land-cta">
        <h2>Join Our HR System Today</h2>
        <p>Streamline your HR processes with our powerful and easy-to-use platform.</p>
      </section>

      {/* Contact Section */}
      <section id="land-contact" className="land-contact">
        <h2>Get In Touch</h2>
        <div className="land-contact-row">
          <form onSubmit={handleSubmit} className="land-contact-form">
            <div className="land-form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="Your Name"
                className="land-form-input"
                required
              />
            </div>
            <div className="land-form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Your Email"
                className="land-form-input"
                required
              />
            </div>
            <div className="land-form-group">
              <label>Message</label>
              <textarea
                placeholder="Your Message"
                className="land-form-input"
                rows="5"
                required
              ></textarea>
            </div>
            <button type="submit" className="land-form-button">
              Send Message
            </button>
          </form>
          <div className="land-contact-map">
            <iframe
              title="Google Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3454.0123456789!2d31.235711315115!3d30.04441998187916!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14583fa60c8b8b8b%3A0x8b8b8b8b8b8b8b8b!2z2YXYsdmD2LIg2KfZhNmF2K3YqSDYp9mE2KfZhNio2KfYqg!5e0!3m2!1sar!2seg!4v1680000000000!5m2!1sar!2seg"
              width="100%"
              height="350"
              style={{ border: 0, borderRadius: "12px" }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Footer */}
     <footer className="land-footer">
  <div className="land-footer-content">
    {/* Logo and Description */}
    <div className="land-footer-column">
      <div className="land-footer-logo">
        <FaCog className="land-footer-icon" />
        <span>HR System</span>
      </div>
      <p className="land-footer-description">
        Streamlining HR for businesses worldwide with innovative, secure, and user-friendly solutions.
      </p>
      {/* Newsletter Subscription */}
      <div className="land-footer-newsletter">
        <h3 className="land-footer-heading">Stay Updated</h3>
        <form onSubmit={handleSubmit} className="land-footer-newsletter-form">
          <input
            type="email"
            placeholder="Enter your email"
            className="land-footer-newsletter-input"
            required
          />
          <button type="submit" className="land-footer-newsletter-button">
            Subscribe
          </button>
        </form>
      </div>
    </div>

    {/* Quick Links */}
    <div className="land-footer-column">
      <h3 className="land-footer-heading">Quick Links</h3>
      <div className="land-footer-links">
        <a href="#land-about" className="land-footer-link">About</a>
        <a href="#land-features" className="land-footer-link">Services</a>
        <a href="#land-contact" className="land-footer-link">Contact</a>
        <a href="#" className="land-footer-link">Privacy Policy</a>
      </div>
    </div>

    {/* Contact and Social */}
    <div className="land-footer-column">
      <h3 className="land-footer-heading">Get in Touch</h3>
      <div className="land-footer-contact">
        <p>Phone: +123-456-7890</p>
        <p>Email: support@hrsystem.com</p>
        <p>Address: 123 Business St, Cairo, Egypt</p>
      </div>
      <div className="land-footer-social">
        <a href="https://facebook.com" className="land-footer-social-link" target="_blank" rel="noopener noreferrer">
          <FaFacebook size={24} />
        </a>
        <a href="https://wa.me/1234567890" className="land-footer-social-link" target="_blank" rel="noopener noreferrer">
          <FaWhatsapp size={24} />
        </a>
        <a href="https://x.com" className="land-footer-social-link" target="_blank" rel="noopener noreferrer">
          <FaTwitter size={24} />
        </a>
        <a href="https://linkedin.com" className="land-footer-social-link" target="_blank" rel="noopener noreferrer">
          <FaLinkedin size={24} />
        </a>
      </div>
    </div>
  </div>
  <p className="land-footer-text">© 2025 HR System. All rights reserved.</p>
</footer>
    </div>
  );
}

import { Link } from "react-router-dom";

export default function Footer() {
  const socialLinks = [
    {
      label: "Facebook",
      href: "https://facebook.com",
      icon: (
        <path d="M13.5 6.75h2.25V3h-2.25c-2.48 0-4.5 2.02-4.5 4.5V9H6v3.75h3v8.25h3.75v-8.25h3l.75-3.75h-3.75V7.5c0-.41.34-.75.75-.75z" />
      )
    },
    {
      label: "Instagram",
      href: "https://instagram.com",
      icon: (
        <>
          <rect x="4.5" y="4.5" width="15" height="15" rx="4" ry="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="16.7" cy="7.3" r="1.1" />
        </>
      )
    },
    {
      label: "TikTok",
      href: "https://tiktok.com",
      icon: (
        <path d="M14.3 4.2c.8 1.4 2.1 2.3 3.7 2.5v2.7c-1.4-.1-2.7-.5-3.8-1.3v5.8a4.8 4.8 0 1 1-4.8-4.8c.3 0 .7 0 1 .1v2.7a2.1 2.1 0 1 0 1.2 2v-9.7h2.7z" />
      )
    },
    {
      label: "YouTube",
      href: "https://youtube.com",
      icon: (
        <>
          <rect x="3.5" y="6.2" width="17" height="11.6" rx="3" ry="3" />
          <path d="M10 9.2l5 2.8-5 2.8z" fill="#171717" />
        </>
      )
    }
  ];

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <h3>LAKMINDA FASHION</h3>
          <p>
            Shop men, women, kids, and unisex collections with custom design support, featured drops, and secure
            checkout.
          </p>
          <div className="footer-social">
            {socialLinks.map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {item.icon}
                </svg>
              </a>
            ))}
          </div>
        </div>
        <div className="footer-links">
          <a href="#">Terms &amp; Conditions</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Exchange Policy</a>
          <a href="#">Delivery Policy</a>
          <a href="#">Order Tracking</a>
          <Link to="/contact">Contact</Link>
        </div>
      </div>
      <p className="copyright">(c) 2026 Lakminda Fashion. All rights reserved.</p>
    </footer>
  );
}

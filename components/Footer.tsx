// components/Footer.tsx
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span className="muted small">
          © {new Date().getFullYear()} Printly. Made in the UAE 🇦🇪
        </span>
        <span className="muted small">Layer by layer, part by part.</span>
      </div>
    </footer>
  );
}

// components/Footer.tsx
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span className="small muted">
          © {new Date().getFullYear()} Printly. Made in the UAE 🇦🇪
        </span>
        <span className="small muted">
          Layer by layer • PLA+ &amp; PETG • Custom soon
        </span>
      </div>
    </footer>
  );
}

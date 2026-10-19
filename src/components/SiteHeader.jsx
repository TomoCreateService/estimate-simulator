import { useEffect, useRef, useState } from "react";
import logo from "../assets/TCSlogo.png";

const sections = [
  "Concept",
  "Story",
  "Service",
  "Works",
  "Process",
  "Price",
  "Contact",
];

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    const onResize = () => {
      if (window.innerWidth > 900) setOpen(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current.focus();
      }
      if (event.key === "Tab") {
        const items = [
          buttonRef.current,
          ...menuRef.current.querySelectorAll("a"),
        ];
        const current = items.indexOf(document.activeElement);
        const next = event.shiftKey
          ? (current - 1 + items.length) % items.length
          : (current + 1) % items.length;
        event.preventDefault();
        items[next].focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const links = () =>
    sections.map((section) => (
      <a
        key={section}
        href={`https://tomo-cs.com/#${section.toLowerCase()}`}
        onClick={() => setOpen(false)}
      >
        {section}
      </a>
    ));
  return (
    <>
      <header className={`p-siteHeader${scrolled ? " is-scrolled" : ""}`}>
        <a className="p-siteHeader__brand" href="https://tomo-cs.com/">
          <img src={logo} alt="Tomo-Create-Service" width="40" height="40" />
          <span className="p-siteHeader__wordmark" aria-hidden="true">
            Tomo-Create-Service
          </span>
        </a>
        <nav
          className="p-siteHeader__nav"
          aria-label="グローバルナビゲーション"
        >
          {links()}
        </nav>
      </header>
      <button
        ref={buttonRef}
        className={`p-hamburger${open ? " is-open" : ""}`}
        type="button"
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((current) => !current)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav
        ref={menuRef}
        id="mobile-nav"
        className={`p-mobileNav${open ? " is-open" : ""}`}
        aria-label="モバイルナビゲーション"
        aria-hidden={!open}
        inert={!open}
      >
        {links()}
      </nav>
    </>
  );
}

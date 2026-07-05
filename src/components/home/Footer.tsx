'use client';

/**
 * Footer — site footer with brand, quick links, roadmap resources, contact.
 */

import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { CONTACT, SOCIAL } from '@/lib/constants';

interface FooterProps {
  scrollToSection: (section: string) => void;
}

export function Footer({ scrollToSection }: FooterProps) {
  return (
    <footer className="v-footer">
      <div className="v-footer-grid">
        <div className="v-footer-brand">
          <a href="/chat" className="nav-logo" style={{ display: 'inline-block', marginBottom: 20 }}>
            <Logo className="nav-logo-img" style={{ height: 40 }} />
          </a>
          <p>
            Pioneering the future of technology through innovation, research, and education.
            Building solutions that transform industries and empower human potential.
          </p>
          <div className="v-footer-socials">
            <a href={SOCIAL.linkedin} target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-linkedin-in"></i>
            </a>
            <a href={SOCIAL.github} target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-github"></i>
            </a>
            <a href={SOCIAL.discord} target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-discord"></i>
            </a>
          </div>
        </div>

        <div className="v-footer-column">
          <h4>Quick Links</h4>
          <ul className="v-footer-links">
            <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></li>
            <li><a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></li>
            <li><a href="#courses" onClick={(e) => { e.preventDefault(); scrollToSection('courses'); }}>Programs</a></li>
            <li><a href="/games">Games</a></li>
            <li><a href="/study">Study</a></li>
            <li><a href="/dashboard">Dashboard</a></li>
          </ul>
        </div>

        <div className="v-footer-column">
          <h4>Roadmap & Practice</h4>
          <ul className="v-footer-links">
            <li><Link href="https://roadmap.sh">Developer Roadmap</Link></li>
            <li><Link href="https://neetcode.io/roadmap">NeetCode Roadmap</Link></li>
            <li><Link href="https://leetcode.com/">LeetCode</Link></li>
            <li><Link href="https://www.hackerrank.com/">HackerRank</Link></li>
            <li><Link href="https://www.codewars.com/">CodeWars</Link></li>
          </ul>
        </div>

        <div className="v-footer-column">
          <h4>Contact</h4>
          <ul className="v-footer-links">
            <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
            <li><a href={`tel:${CONTACT.phone}`}>{CONTACT.phone}</a></li>
          </ul>
        </div>
      </div>

      <div className="v-footer-bottom">
        <p>&copy; {new Date().getFullYear()} X-Foundry. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;

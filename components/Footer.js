'use client';

import Link from 'next/link';
import config from '@/config';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-[#3F3F46]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-extrabold text-white">
                {config.appName}<span className="text-[#DC143C]">.ai</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 mb-2">
              The World's First Integrated Screenwriting Environment (ISE)
            </p>
            <p className="text-xs text-gray-500">
              Write → Produce → Direct
              <br />
              End-to-end from script to video production
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help/quick-start" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Getting Started
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Compare
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help/quick-start" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Getting Started
                </Link>
              </li>
              <li>
                <Link href="/help/writing" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Writing
                </Link>
              </li>
              <li>
                <Link href="/help/production" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Production
                </Link>
              </li>
              <li>
                <Link href="/help/direct" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Direct
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/tos" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-[#3F3F46]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              © {currentYear} {config.appName}. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {/* Social links can be added here later */}
              <p className="text-xs text-gray-500">
                The First Integrated Screenwriting Environment
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

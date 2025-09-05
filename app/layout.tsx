import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Geist } from "next/font/google";
import { VisitorInitializer } from "./VisitorInitializer";

const geist = Geist({ 
  subsets: ['latin'] 
});

export const metadata: Metadata = {
  title: "Olympiad Tutor",
  description: "An agentic math tutor that teaches basic algebra, systems of linear equations, matrices, and vectors, providing step-by-step solutions on a virtual whiteboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.className}`}>
      <head>
        <Script id="mathjax-config">
          {`
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
              },
              svg: {
                fontCache: 'global'
              },
              startup: {
                pageReady: () => {
                  console.log("MathJax is ready");
                  return MathJax.startup.defaultPageReady();
                }
              }
            };
          `}
        </Script>
        <Script
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
          id="MathJax-script"
          async
          strategy="afterInteractive"
        />
      </head>
      <body>
        <VisitorInitializer />
        {children}
      </body>
    </html>
  );
}

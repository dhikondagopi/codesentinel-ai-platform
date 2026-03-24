import { useNavigate } from "react-router-dom";
import { ShieldCheck, Bug, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="bg-black text-white min-h-screen scroll-smooth">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-10 py-5 border-b border-white/10 backdrop-blur sticky top-0 z-50 bg-black/70">
        <h1 className="text-2xl font-bold text-emerald-400">
          CodeSentinel
        </h1>

        <Button onClick={() => navigate("/auth")}>
          Login
        </Button>
      </nav>

      {/* HERO */}
      <section className="text-center py-40 px-6 animate-fade-in">
        <h2 className="text-6xl font-bold mb-6 leading-tight">
          AI Powered <span className="text-emerald-400">Secure Code</span> Monitoring
        </h2>

        <p className="text-gray-400 max-w-2xl mx-auto mb-10 text-lg">
          Automatically detect vulnerabilities, bugs, and performance risks
          in your repositories using intelligent AI scanning engine.
        </p>

        <Button size="lg" className="px-10" onClick={() => navigate("/auth")}>
          Get Started
        </Button>
      </section>

      {/* FEATURES */}
      <section className="py-28 bg-gradient-to-b from-black to-slate-900">
        <h3 className="text-4xl font-bold text-center mb-20">
          Powerful DevSecOps Intelligence
        </h3>

        <div className="grid md:grid-cols-4 gap-8 px-12">

          <Feature
            icon={<ShieldCheck />}
            title="Security Scan"
            desc="Detect vulnerabilities and insecure code patterns."
          />

          <Feature
            icon={<Bug />}
            title="Bug Detection"
            desc="AI finds logical and runtime risks instantly."
          />

          <Feature
            icon={<Brain />}
            title="Code Quality AI"
            desc="Understand maintainability & reliability score."
          />

          <Feature
            icon={<Zap />}
            title="Automated Reports"
            desc="Generate PR reviews & test cases automatically."
          />

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-32 text-center px-6">
        <h3 className="text-4xl font-bold mb-16">
          How CodeSentinel Works
        </h3>

        <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          <Step no="01" text="Import your GitHub repository" />
          <Step no="02" text="Run intelligent AI security scans" />
          <Step no="03" text="View analytics dashboard insights" />
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-emerald-600 text-center">
        <h3 className="text-5xl font-bold mb-8">
          Start Securing Your Code Today
        </h3>

        <Button size="lg" variant="secondary" onClick={() => navigate("/auth")}>
          Create Free Account
        </Button>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-10 text-gray-500 border-t border-white/10">
        © 2026 CodeSentinel AI Platform
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: any) {
  return (
    <div className="p-6 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition hover:scale-105">
      <div className="text-emerald-400 mb-4">{icon}</div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-gray-400 text-sm">{desc}</p>
    </div>
  );
}

function Step({ no, text }: any) {
  return (
    <div className="p-6 border border-white/10 rounded-xl hover:border-emerald-400 transition">
      <div className="text-emerald-400 text-3xl font-bold mb-3">{no}</div>
      <p className="text-gray-400">{text}</p>
    </div>
  );
}
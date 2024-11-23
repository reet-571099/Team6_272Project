import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  MoveRight,
  CheckCircle2,
  Mic2,
  Star,
  Zap,
  Users,
  BarChart2,
  Shield,
  Globe,
  Clock,
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute("href")).scrollIntoView({
          behavior: "smooth",
        });
      });
    });
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-24 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-block mb-4">
              <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-4 py-1 rounded-full">
                New: AI-Powered Voice Recognition 🎉
              </span>
            </div>
            <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Voice into
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                {" "}
                Actionable Tasks
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Stop typing, start talking. AudioJira converts your voice notes
              into perfectly structured Jira tickets in seconds.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate("/auth")}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 flex items-center shadow-lg"
              >
                Start Free Trial <ArrowRight className="ml-2" />
              </button>
              <button className="px-8 py-4 bg-white text-gray-700 rounded-xl text-lg font-semibold border border-gray-200 hover:border-gray-300 transition-all flex items-center">
                Watch Demo <PlayIcon className="ml-2 w-5 h-5" />
              </button>
            </div>
            <div className="mt-8 flex items-center justify-center space-x-4">
              {/* <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white"
                    src={`/avatar-${i}.jpg`}
                    alt="User"
                  />
                ))}
              </div> */}
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">1,000+</span>{" "}
                teams already using AudioJira
              </p>
            </div>
          </div>
          <div className="mt-12 relative max-w-4xl mx-auto px-4">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <img
              src="/assets/dashboard-preview.png"
              alt="Dashboard Preview"
              className="rounded-2xl shadow-2xl mx-auto transform hover:scale-105 transition-transform duration-500 cursor-pointer"
            />
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features that make task management effortless
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="Voice Recognition"
              description="Industry-leading voice recognition with support for multiple languages and accents."
              icon={<Mic2 className="w-8 h-8 text-indigo-600" />}
              gradient="from-indigo-500 to-purple-500"
            />
            <FeatureCard
              title="Smart Integration"
              description="Seamless integration with Jira and other popular project management tools."
              icon={<Zap className="w-8 h-8 text-orange-400" />}
              gradient="from-orange-500 to-pink-500"
            />
            <FeatureCard
              title="Team Collaboration"
              description="Real-time collaboration with team members and instant notifications."
              icon={<Users className="w-8 h-8 text-green-600" />}
              gradient="from-green-500 to-teal-500"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Trusted by teams worldwide
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Our platform delivers measurable results
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <StatCard
              number="75%"
              label="Time Saved"
              description="Average time saved on task creation"
              icon={<Clock className="w-5 h-5 text-indigo-600" />}
            />
            <StatCard
              number="50k+"
              label="Active Users"
              description="Professionals using AudioJira daily"
              icon={<Users className="w-5 h-5 text-purple-600" />}
            />
            <StatCard
              number="99.9%"
              label="Uptime"
              description="Reliable service availability"
              icon={<Shield className="w-5 h-5 text-green-600" />}
            />
            <StatCard
              number="4.9/5"
              label="User Rating"
              description="Based on 1,000+ reviews"
              icon={<Star className="w-5 h-5 text-yellow-600" />}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to streamline your workflow
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <StepCard
              number="1"
              title="Record"
              description="Speak naturally about your task or issue"
              icon={<Mic2 />}
            />
            <StepCard
              number="2"
              title="Process"
              description="AI analyzes and structures your content"
              icon={<Zap />}
            />
            <StepCard
              number="3"
              title="Create"
              description="Ticket is created and assigned automatically"
              icon={<CheckCircle2 />}
            />
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using AudioJira to streamline their
            processes.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="px-8 py-4 bg-white text-indigo-600 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg"
          >
            Start Free Trial - No Credit Card Required
          </button>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">AudioJira</h3>
              <p className="text-gray-400">
                Transforming voice into action with intelligent automation.
              </p>
              <div className="flex space-x-4">
                {/* Add social media icons */}
              </div>
            </div>
            <FooterColumn
              title="Product"
              links={["Features", "Pricing", "Documentation", "API"]}
            />
            <FooterColumn
              title="Company"
              links={["About Us", "Careers", "Blog", "Contact"]}
            />
            <FooterColumn
              title="Legal"
              links={["Privacy", "Terms", "Security", "Cookies"]}
            />
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 AudioJira. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ title, description, icon, gradient }) => (
  <div className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer">
    <div
      className={`mb-6 inline-block p-3 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-10`}
    >
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const StepCard = ({ number, title, description, icon }) => (
  <div className="p-8 bg-white rounded-2xl shadow-lg text-center relative group hover:shadow-xl transition-all cursor-pointer">
    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-gray-800">{description}</p>
  </div>
);

const FooterColumn = ({ title, links }) => (
  <div>
    <h4 className="font-semibold text-lg mb-4">{title}</h4>
    <ul className="space-y-2">
      {links.map((link) => (
        <li
          key={link}
          className="text-gray-400 hover:text-white cursor-pointer"
        >
          {link}
        </li>
      ))}
    </ul>
  </div>
);

const PlayIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
  </svg>
);

const StatCard = ({ number, label, description, icon }) => (
  <div className="p-6 bg-white/50 backdrop-blur-sm rounded-2xl hover:shadow-lg transition-all transform hover:scale-105 relative cursor-pointer">
    <div className="absolute top-6 right-6">{icon}</div>
    <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
      {number}
    </div>
    <div className="text-base font-semibold text-gray-900 mb-1">{label}</div>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

export default LandingPage;

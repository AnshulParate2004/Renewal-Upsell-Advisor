import { Target, BarChart3, RefreshCw, Cpu, Shield, TrendingUp, Zap, CheckCircle, Sparkles, Activity, Bell, DollarSign, Phone, ArrowRight, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: <Target className="w-6 h-6 text-primary" />,
    title: "Churn Prediction",
    description: "AI models flag at-risk accounts 90 days before renewal using usage patterns and engagement signals.",
    badge: "ML-POWERED",
    color: "bg-primary/10",
    borderColor: "border-primary",
    details: [
      "Real-time risk scoring based on usage patterns",
      "Early warning system 90 days before renewal",
      "Automated alerts for high-risk accounts",
      "Sentiment analysis from support tickets and emails"
    ]
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-indigo-500" />,
    title: "Expansion Pipeline",
    description: "Surface upsell opportunities automatically based on product adoption and team growth metrics.",
    badge: "REAL-TIME",
    color: "bg-indigo-50",
    borderColor: "border-indigo-500",
    details: [
      "Automatic upsell opportunity detection",
      "License utilization tracking",
      "Feature adoption analysis",
      "Growth potential identification"
    ]
  },
  {
    icon: <RefreshCw className="w-6 h-6 text-emerald-500" />,
    title: "Auto Outreach",
    description: "Multi-channel campaigns triggered at critical lifecycle moments with personalized messaging.",
    badge: "AUTOMATED",
    color: "bg-emerald-50",
    borderColor: "border-emerald-500",
    details: [
      "Automated email campaigns",
      "Voice bot calls at milestones",
      "Personalized messaging with LLM",
      "Multi-channel engagement tracking"
    ]
  },
  {
    icon: <Cpu className="w-6 h-6 text-amber-500" />,
    title: "Revenue Intelligence",
    description: "Live dashboards showing pipeline health, renewal forecasts, and expansion metrics synced with your CRM.",
    badge: "AI-DRIVEN",
    color: "bg-amber-50",
    borderColor: "border-amber-500",
    details: [
      "Real-time dashboard analytics",
      "Renewal forecasting",
      "Pipeline health monitoring",
      "Revenue trend analysis"
    ]
  },
  {
    icon: <Shield className="w-6 h-6 text-red-500" />,
    title: "Risk Management",
    description: "Comprehensive risk assessment and mitigation strategies for at-risk accounts.",
    badge: "PROACTIVE",
    color: "bg-red-50",
    borderColor: "border-red-500",
    details: [
      "Multi-factor risk scoring",
      "Account health monitoring",
      "Churn probability prediction",
      "Automated intervention triggers"
    ]
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-blue-500" />,
    title: "Renewal Pipeline",
    description: "Track and manage all renewals with automated workflows and intelligent prioritization.",
    badge: "SMART",
    color: "bg-blue-50",
    borderColor: "border-blue-500",
    details: [
      "Renewal date tracking",
      "Automated renewal reminders",
      "Contract status monitoring",
      "Renewal probability scoring"
    ]
  }
];

const capabilities = [
  {
    title: "AI-Powered Insights",
    icon: <Sparkles className="w-5 h-5 text-primary" />,
    items: [
      "Machine learning models for churn prediction",
      "Natural language processing for sentiment analysis",
      "Pattern recognition in usage data",
      "Predictive analytics for revenue forecasting"
    ]
  },
  {
    title: "Automation",
    icon: <Zap className="w-5 h-5 text-primary" />,
    items: [
      "Automated email campaigns",
      "Voice bot calls at milestones",
      "Workflow automation",
      "Scheduled reports and alerts"
    ]
  },
  {
    title: "Integration",
    icon: <Activity className="w-5 h-5 text-primary" />,
    items: [
      "CRM integration (Salesforce, HubSpot)",
      "Billing system sync",
      "Product usage tracking",
      "Support ticket analysis"
    ]
  },
  {
    title: "Analytics",
    icon: <BarChart3 className="w-5 h-5 text-primary" />,
    items: [
      "Real-time dashboards",
      "Custom reports",
      "Trend analysis",
      "Performance metrics"
    ]
  }
];

const useCases = [
  {
    title: "Renewal Management",
    description: "Never miss a renewal with automated tracking and reminders",
    icon: <RefreshCw className="w-6 h-6 text-primary" />,
    benefits: [
      "90-day early warning system",
      "Automated renewal calls",
      "Contract status tracking",
      "Renewal probability scoring"
    ]
  },
  {
    title: "Upsell Detection",
    description: "Identify expansion opportunities automatically",
    icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
    benefits: [
      "Usage pattern analysis",
      "License utilization tracking",
      "Growth opportunity alerts",
      "Automated upsell calls"
    ]
  },
  {
    title: "Churn Prevention",
    description: "Proactively prevent churn with early intervention",
    icon: <Shield className="w-6 h-6 text-red-500" />,
    benefits: [
      "Risk score monitoring",
      "Sentiment analysis",
      "Automated intervention",
      "Success tracking"
    ]
  }
];

export default function Features() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="p-6 pb-0">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 border-2 border-black hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <PageHeader
        title="Features"
        description="Everything you need to maximize revenue and prevent churn"
      />

      <div className="p-6 space-y-12">
        {/* Hero Section */}
        <section>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold mb-4">Powerful Features for Revenue Teams</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                AI-powered tools that help you protect revenue, identify opportunities, and automate customer engagement.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Main Features Grid */}
        <section>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Core Features</h2>
              <p className="text-muted-foreground">Powerful tools to protect and grow your revenue</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-card rounded-xl border-2 ${feature.borderColor} p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group`}
                >
                  <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    {feature.badge}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="bg-muted/30 py-12 rounded-xl">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Use Cases</h2>
              <p className="text-muted-foreground">See how teams use Revenue Navigator</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {useCases.map((useCase, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-card rounded-xl border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    {useCase.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{useCase.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{useCase.description}</p>
                  <ul className="space-y-2">
                    {useCase.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities Section */}
        <section>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Platform Capabilities</h2>
              <p className="text-muted-foreground">Built for modern revenue teams</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {capabilities.map((capability, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-card rounded-xl border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      {capability.icon}
                    </div>
                    <h3 className="text-xl font-bold">{capability.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {capability.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section>
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-black p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
              <p className="text-muted-foreground mb-6">
                Start protecting and growing your revenue today with our 14-day free trial.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button
                  asChild
                  className="border-2 border-black"
                >
                  <Link to="/signin">
                    Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-2 border-black"
                >
                  <Link to="/pricing">View Pricing</Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-2 border-black"
                >
                  <Link to="/demo">
                    <Phone className="w-4 h-4 mr-2" />
                    Try Demo
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

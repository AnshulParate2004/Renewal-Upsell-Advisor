import { useEffect } from "react";
import { CheckCircle, Zap, Crown, Building2, ArrowRight, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    icon: <Zap className="w-6 h-6" />,
    price: "$99",
    period: "per month",
    description: "Perfect for small teams getting started",
    color: "bg-primary/10",
    borderColor: "border-primary",
    features: [
      "Up to 50 accounts",
      "Churn prediction",
      "Basic analytics dashboard",
      "Email automation",
      "Email support",
      "14-day free trial"
    ],
    cta: "Start Free Trial",
    popular: false
  },
  {
    name: "Professional",
    icon: <Crown className="w-6 h-6" />,
    price: "$299",
    period: "per month",
    description: "For growing revenue teams",
    color: "bg-amber-50",
    borderColor: "border-amber-500",
    features: [
      "Up to 500 accounts",
      "Churn prediction & upsell detection",
      "Advanced analytics & reporting",
      "Email + Voice bot automation",
      "Priority support",
      "CRM integration",
      "Custom workflows",
      "14-day free trial"
    ],
    cta: "Start Free Trial",
    popular: true
  },
  {
    name: "Enterprise",
    icon: <Building2 className="w-6 h-6" />,
    price: "Custom",
    period: "pricing",
    description: "For large organizations with complex needs",
    color: "bg-indigo-50",
    borderColor: "border-indigo-500",
    features: [
      "Unlimited accounts",
      "All AI features",
      "Custom ML models",
      "Multi-channel automation",
      "Dedicated support",
      "Advanced integrations",
      "Custom reporting",
      "SLA guarantee",
      "On-premise deployment option"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

const faqs = [
  {
    question: "What happens after my free trial?",
    answer: "After your 14-day free trial, you can choose to continue with any paid plan. No credit card required during the trial period."
  },
  {
    question: "Can I change plans later?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges."
  },
  {
    question: "Do you offer discounts for annual plans?",
    answer: "Yes, we offer a 20% discount for annual subscriptions. Contact our sales team for more information."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, ACH transfers, and wire transfers for Enterprise plans."
  },
  {
    question: "Is there a setup fee?",
    answer: "No setup fees for Starter and Professional plans. Enterprise plans may include implementation services."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, you can cancel your subscription at any time. There are no cancellation fees, and you'll retain access until the end of your billing period."
  }
];

export default function Pricing() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 border-2 border-black hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <PageHeader
          title="Pricing"
          description="Simple, transparent pricing for teams of all sizes"
        />

        <div className="pt-6 space-y-12">
        {/* Pricing Cards */}
        <section>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Choose Your Plan</h2>
              <p className="text-muted-foreground">All plans include a 14-day free trial. No credit card required.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative bg-card rounded-xl border-2 ${plan.borderColor} p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                    plan.popular ? "scale-105 z-10" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold">
                      MOST POPULAR
                    </div>
                  )}
                  
                  <div className={`w-12 h-12 ${plan.color} rounded-xl flex items-center justify-center mb-4`}>
                    {plan.icon}
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">{plan.period}</span>
                  </div>

                  <Link
                    to={plan.name === "Enterprise" ? "/signin" : "/signin"}
                    className={`block w-full text-center py-3 rounded-lg font-semibold mb-6 transition-colors ${
                      plan.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-foreground border-2 border-black hover:bg-muted/80"
                    }`}
                  >
                    {plan.cta}
                  </Link>

                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="bg-muted/50 py-12 rounded-xl">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3">Feature Comparison</h2>
              <p className="text-muted-foreground">Compare plans side by side</p>
            </div>

            <Card className="border-2 border-black overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b-2 border-black">
                    <tr>
                      <th className="text-left p-4 font-bold">Feature</th>
                      <th className="text-center p-4 font-bold">Starter</th>
                      <th className="text-center p-4 font-bold bg-primary/10">Professional</th>
                      <th className="text-center p-4 font-bold">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "Accounts", starter: "50", professional: "500", enterprise: "Unlimited" },
                      { feature: "Churn Prediction", starter: "✓", professional: "✓", enterprise: "✓" },
                      { feature: "Upsell Detection", starter: "—", professional: "✓", enterprise: "✓" },
                      { feature: "Email Automation", starter: "✓", professional: "✓", enterprise: "✓" },
                      { feature: "Voice Bot", starter: "—", professional: "✓", enterprise: "✓" },
                      { feature: "CRM Integration", starter: "—", professional: "✓", enterprise: "✓" },
                      { feature: "Custom Models", starter: "—", professional: "—", enterprise: "✓" },
                      { feature: "Dedicated Support", starter: "—", professional: "—", enterprise: "✓" },
                      { feature: "SLA Guarantee", starter: "—", professional: "—", enterprise: "✓" }
                    ].map((row, idx) => (
                      <tr key={idx} className="border-b border-black/20">
                        <td className="p-4 font-medium">{row.feature}</td>
                        <td className="p-4 text-center">{row.starter}</td>
                        <td className="p-4 text-center bg-primary/5">{row.professional}</td>
                        <td className="p-4 text-center">{row.enterprise}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">Everything you need to know about pricing</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-card rounded-xl border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <h3 className="font-bold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section>
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-xl border-2 border-black p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
              <p className="text-muted-foreground mb-6">
                Start your 14-day free trial today. No credit card required.
              </p>
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}

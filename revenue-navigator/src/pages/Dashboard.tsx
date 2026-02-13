import { useState } from "react";
import { Users, AlertTriangle, TrendingUp, DollarSign, Heart, Smile } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  accounts, voiceCalls, opportunities, formatCurrency,
} from "@/data/mockData";
import { motion } from "framer-motion";
import AnimatedCard from "@/components/ui/AnimatedCard";
import RelationshipTrendChart from "@/components/charts/RelationshipScoreChart";

const totalArr = accounts.reduce((s, a) => s + a.arr, 0);
const churnRiskCount = accounts.filter((a) => a.riskScore >= 70).length;
const renewalRate = Math.round(
  (accounts.filter((a) => a.renewalStage === "renewed" || a.healthScore >= 70).length / accounts.length) * 100
);
const upsellPipeline = opportunities
  .filter((o) => o.type === "upsell" || o.type === "cross_sell")
  .reduce((s, o) => s + o.value, 0);
const avgRelationshipScore = Math.round(accounts.reduce((s, a) => s + a.relationshipScore, 0) / accounts.length);
const avgSentimentScore = (accounts.reduce((s, a) => s + a.sentimentScore, 0) / accounts.length).toFixed(2);

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-end justify-between shrink-0 pb-6 border-b border-gray-200"
      >
        <div>
          <h1 className="text-5xl font-bold text-foreground tracking-tight leading-none">
            Revenue <span className="text-primary">Navigator</span>
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-2">
            Real-Time Performance Intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm italic text-accent">Operational!</div>
          <div className="sticker-outline px-4 py-2 text-sm">
            Q1 2026 ALPHA
          </div>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 shrink-0">
        {[
          { label: 'Total ARR', value: totalArr, displayValue: formatCurrency(totalArr), icon: <DollarSign size={20} />, color: 'text-foreground', iconBg: 'bg-primary' },
          { label: 'Churn Risk', value: churnRiskCount, displayValue: churnRiskCount, icon: <AlertTriangle size={20} />, color: 'text-red-600', iconBg: 'bg-white', isAlert: true },
          { label: 'Renewal Rate', value: renewalRate, displayValue: `${renewalRate}%`, icon: <TrendingUp size={20} />, color: 'text-primary', iconBg: 'bg-white' },
          { label: 'Upsell Pipeline', value: upsellPipeline, displayValue: formatCurrency(upsellPipeline), icon: <Users size={20} />, color: 'text-foreground', iconBg: 'bg-accent' },
          { label: 'Avg Relationship', value: avgRelationshipScore, displayValue: `${avgRelationshipScore}%`, icon: <Heart size={20} />, color: 'text-foreground', iconBg: 'bg-white' },
          { label: 'Avg Sentiment', value: parseFloat(avgSentimentScore), displayValue: avgSentimentScore, icon: <Smile size={20} />, color: 'text-foreground', iconBg: 'bg-white' }
        ].map((metric, idx) => (
          <AnimatedCard
            key={idx}
            delay={idx * 0.05}
            className={`paper-card p-5 flex flex-col justify-between group cursor-default transition-all ${metric.isAlert ? 'bg-red-50 border-red-200' : 'bg-white'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">{metric.label}</p>
              <div className={`p-2 rounded-lg ${metric.iconBg} ${metric.iconBg === 'bg-white' ? 'text-foreground border border-gray-200' : 'text-white'} shadow-sm`}>
                {metric.icon}
              </div>
            </div>
            <div className={`text-3xl font-bold tracking-tight ${metric.color}`}>
              {metric.displayValue}
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Customer Relationship Trend Chart */}
      <div className="flex-1 min-h-0">
        <RelationshipTrendChart />
      </div>
    </div>
  );
}

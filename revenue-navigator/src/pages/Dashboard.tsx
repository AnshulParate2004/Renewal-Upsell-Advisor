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
    <div className="p-4 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between shrink-0"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Revenue Navigator</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">REAL-TIME PERFORMANCE OVERVIEW</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-muted-foreground bg-muted/10 px-2 py-1 rounded border border-border">Q1 2026</span>
        </div>
      </motion.div>

      {/* NB-Style Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 shrink-0">
        {[
          { label: 'Total ARR', value: totalArr, displayValue: formatCurrency(totalArr), icon: <DollarSign size={20} />, color: 'text-black', borderColor: 'border-b-black', iconBg: 'bg-black', isNumber: true },
          { label: 'Churn Risk', value: churnRiskCount, displayValue: churnRiskCount, icon: <AlertTriangle size={20} />, color: 'text-red-600', borderColor: 'border-b-red-600', iconBg: 'bg-red-600', isNumber: true },
          { label: 'Renewal Rate', value: renewalRate, displayValue: `${renewalRate}%`, icon: <TrendingUp size={20} />, color: 'text-emerald-600', borderColor: 'border-b-emerald-600', iconBg: 'bg-emerald-600', isNumber: true, suffix: '%' },
          { label: 'Upsell Pipeline', value: upsellPipeline, displayValue: formatCurrency(upsellPipeline), icon: <Users size={20} />, color: 'text-blue-600', borderColor: 'border-b-blue-600', iconBg: 'bg-blue-600', isNumber: true },
          { label: 'Avg Relationship', value: avgRelationshipScore, displayValue: `${avgRelationshipScore}%`, icon: <Heart size={20} />, color: 'text-purple-600', borderColor: 'border-b-purple-600', iconBg: 'bg-purple-600', isNumber: true, suffix: '%' },
          { label: 'Avg Sentiment', value: parseFloat(avgSentimentScore), displayValue: avgSentimentScore, icon: <Smile size={20} />, color: 'text-pink-600', borderColor: 'border-b-pink-600', iconBg: 'bg-pink-600', isNumber: false }
        ].map((metric, idx) => (
          <AnimatedCard
            key={idx}
            delay={idx * 0.1}
            className={`p-4 bg-white dark:bg-gray-800 border-2 border-black dark:border-white border-b-[6px] ${metric.borderColor} flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]`}
          >
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest">{metric.label}</p>
              <div className={`text-3xl font-mono font-bold mt-1 ${metric.color} dark:text-white`}>
                {metric.displayValue}
              </div>
            </div>
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className={`p-2 border-2 border-black dark:border-white ${metric.iconBg} text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]`}
            >
              {metric.icon}
            </motion.div>
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

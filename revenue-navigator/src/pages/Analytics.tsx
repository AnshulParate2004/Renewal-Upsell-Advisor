import { Download, FileText } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { revenueData, churnData, accounts } from "@/data/mockData";

const riskDistribution = [
  { name: "Low Risk", value: accounts.filter((a) => a.riskScore < 40).length, color: "#10b981" },
  { name: "Medium Risk", value: accounts.filter((a) => a.riskScore >= 40 && a.riskScore < 70).length, color: "#f59e0b" },
  { name: "High Risk", value: accounts.filter((a) => a.riskScore >= 70).length, color: "#ef4444" },
];

export default function Analytics() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <button className="h-8 px-3 bg-white dark:bg-gray-800 text-black dark:text-white border-2 border-black dark:border-white text-xs font-bold uppercase flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[1px] hover:translate-y-[1px]">
            <Download className="h-3 w-3" /> PDF
          </button>
          <button className="h-8 px-3 bg-white dark:bg-gray-800 text-black dark:text-white border-2 border-black dark:border-white text-xs font-bold uppercase flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[1px] hover:translate-y-[1px]">
            <FileText className="h-3 w-3" /> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 border-2 border-black dark:border-white bg-white dark:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
          <div className="p-3 border-b-2 border-black dark:border-white bg-indigo-600">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Revenue Trend</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total ARR ($K)" />
                <Line type="monotone" dataKey="new" stroke="#10b981" strokeWidth={2} name="New ARR" />
                <Line type="monotone" dataKey="expansion" stroke="#8b5cf6" strokeWidth={2} name="Expansion" />
                <Line type="monotone" dataKey="churned" stroke="#ef4444" strokeWidth={2} name="Churned" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Churn Analysis */}
        <div className="border-2 border-black dark:border-white bg-white dark:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
          <div className="p-3 border-b-2 border-black dark:border-white bg-indigo-600">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Churn Analysis</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={churnData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="renewed" stackId="a" fill="#10b981" name="Renewed" />
                <Bar dataKey="atRisk" stackId="a" fill="#f59e0b" name="At Risk" />
                <Bar dataKey="churned" stackId="a" fill="#ef4444" name="Churned" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="border-2 border-black dark:border-white bg-white dark:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
          <div className="p-3 border-b-2 border-black dark:border-white bg-indigo-600">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Risk Distribution</h3>
          </div>
          <div className="p-4 flex justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  strokeWidth={2}
                  stroke="#000"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

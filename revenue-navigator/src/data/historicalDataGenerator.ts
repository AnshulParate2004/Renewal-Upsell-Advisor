import { Account, SentimentHistory, AccountActivity, MetricsHistory } from './mockData';

// ─── Generate Historical Data Helper ───
export const generateHistoricalData = (account: Account) => {
    const history: { sentiment: SentimentHistory[], activities: AccountActivity[], metrics: MetricsHistory[] } = {
        sentiment: [],
        activities: [],
        metrics: []
    };

    // Generate 6 months of historical data
    const monthsBack = 6;
    const today = new Date();

    for (let i = monthsBack; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Generate metrics history with trend
        const trend = account.healthScore >= 70 ? 'improving' : account.healthScore >= 40 ? 'stable' : 'declining';
        const trendFactor = trend === 'improving' ? (monthsBack - i) / monthsBack :
            trend === 'declining' ? i / monthsBack : 0.5;

        const variance = (Math.random() - 0.5) * 10;

        history.metrics.push({
            date: dateStr,
            healthScore: Math.max(0, Math.min(100, account.healthScore + (trendFactor - 0.5) * 30 + variance)),
            riskScore: Math.max(0, Math.min(100, account.riskScore - (trendFactor - 0.5) * 30 + variance)),
            relationshipScore: Math.max(0, Math.min(100, account.relationshipScore + (trendFactor - 0.5) * 25 + variance)),
            churnProbability: Math.max(0, Math.min(1, account.churnProbability - (trendFactor - 0.5) * 0.4 + (variance / 100))),
            utilization: Math.max(0, Math.min(100, account.utilization + (trendFactor - 0.5) * 20 + variance)),
            sentimentScore: Math.max(-1, Math.min(1, account.sentimentScore + (trendFactor - 0.5) * 0.8 + (variance / 50)))
        });

        // Generate sentiment history (2-3 per month)
        const sentimentCount = Math.floor(Math.random() * 2) + 2;
        for (let j = 0; j < sentimentCount; j++) {
            const sentDate = new Date(date);
            sentDate.setDate(sentDate.getDate() + Math.floor(Math.random() * 28));
            const sources: ('email' | 'call' | 'support_ticket' | 'survey')[] = ['email', 'call', 'support_ticket', 'survey'];
            const source = sources[Math.floor(Math.random() * sources.length)];

            history.sentiment.push({
                date: sentDate.toISOString().split('T')[0],
                score: Math.max(-1, Math.min(1, account.sentimentScore + (trendFactor - 0.5) * 0.8 + (Math.random() - 0.5) * 0.4)),
                source,
                summary: source === 'call' ? 'Quarterly business review call' :
                    source === 'email' ? 'Product feedback email' :
                        source === 'support_ticket' ? 'Technical support interaction' :
                            'Customer satisfaction survey'
            });
        }
    }

    // Generate activity timeline
    const activities: { type: AccountActivity['type'], title: string, desc: string, sent?: 'positive' | 'neutral' | 'negative' }[] = [
        { type: 'call', title: 'Quarterly Business Review', desc: 'Discussed Q4 performance and renewal terms', sent: 'positive' },
        { type: 'email', title: 'Product Update Announcement', desc: 'Sent information about new features', sent: 'neutral' },
        { type: 'meeting', title: 'Executive Stakeholder Meeting', desc: 'Met with CTO to discuss strategic alignment', sent: 'positive' },
        { type: 'support_ticket', title: 'Technical Issue Resolved', desc: 'Integration bug fixed within SLA', sent: 'neutral' },
        { type: 'usage_spike', title: 'Usage Increased 40%', desc: 'Significant increase in platform adoption', sent: 'positive' },
        { type: 'usage_drop', title: 'Usage Declined', desc: 'Notable decrease in active users', sent: 'negative' },
        { type: 'contract_change', title: 'Contract Amendment', desc: 'Added 10 additional licenses', sent: 'positive' },
        { type: 'payment', title: 'Payment Received', desc: 'Invoice paid on time', sent: 'positive' }
    ];

    // Add 8-15 activities over 6 months
    const activityCount = Math.floor(Math.random() * 8) + 8;
    for (let i = 0; i < activityCount; i++) {
        const actDate = new Date(today);
        actDate.setDate(actDate.getDate() - Math.floor(Math.random() * 180));
        const activity = activities[Math.floor(Math.random() * activities.length)];

        history.activities.push({
            id: `act-${account.id}-${i}`,
            date: actDate.toISOString().split('T')[0],
            type: activity.type,
            title: activity.title,
            description: activity.desc,
            sentiment: activity.sent
        });
    }

    // Sort by date
    history.sentiment.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    history.activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    history.metrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return history;
};

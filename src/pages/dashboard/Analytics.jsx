import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subDays, startOfWeek } from 'date-fns';

import StatCards from '@/components/analytics/StatCards';
import RevenueAreaChart from '@/components/analytics/RevenueAreaChart';
import VolumeBarChart from '@/components/analytics/VolumeBarChart';
import ServicePieChart from '@/components/analytics/ServicePieChart';
import PaymentDonut from '@/components/analytics/PaymentDonut';
import TopServicesChart from '@/components/analytics/TopServicesChart';
import WeeklyTrafficChart from '@/components/analytics/WeeklyTrafficChart';
import RatingChart from '@/components/analytics/RatingChart';
import MembershipChart from '@/components/analytics/MembershipChart';
import StatusChart from '@/components/analytics/StatusChart';
import ServiceTrendChart from '@/components/analytics/ServiceTrendChart';

const isPaid = (c) => c.payment_status === 'paid' || c.status === 'done';

export default function Analytics() {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const saved = localStorage.getItem('wash_crm_location');
    const loc = saved ? JSON.parse(saved) : null;
    const filter = {};
    if (loc) filter.location_id = loc.id;
    const data = await base44.entities.CheckIn.filter(filter, '-created_date', 500);
    setCheckins(data);
    setLoading(false);
  };

  const m = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const cutoff = subDays(new Date(), 30);

    const todayCheckins = checkins.filter(c => c.check_in_date === today);
    const activeQueue = todayCheckins.filter(c => ['checked_in','waiting','in_progress'].includes(c.status)).length;

    const recent = checkins.filter(c => c.check_in_date && new Date(c.check_in_date) >= cutoff);
    const totalRevenue = recent.filter(isPaid).reduce((s, c) => s + (c.service_price || 0), 0);
    const totalCheckins = recent.length;
    const avgTicket = totalCheckins > 0 ? totalRevenue / totalCheckins : 0;
    const ratings = recent.filter(c => c.rating).map(c => c.rating);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const uniqueCustomers = new Set(recent.map(c => c.customer_phone)).size;

    // Week-over-week trends
    const thisWeekStart = startOfWeek(new Date());
    const lastWeekStart = subDays(thisWeekStart, 7);
    const thisWeek = checkins.filter(c => c.check_in_date && new Date(c.check_in_date) >= thisWeekStart);
    const lastWeek = checkins.filter(c => c.check_in_date && new Date(c.check_in_date) >= lastWeekStart && new Date(c.check_in_date) < thisWeekStart);
    const thisWeekRev = thisWeek.filter(isPaid).reduce((s, c) => s + (c.service_price || 0), 0);
    const lastWeekRev = lastWeek.filter(isPaid).reduce((s, c) => s + (c.service_price || 0), 0);
    const revTrend = lastWeekRev > 0 ? ((thisWeekRev - lastWeekRev) / lastWeekRev) * 100 : 0;
    const checkinTrend = lastWeek.length > 0 ? ((thisWeek.length - lastWeek.length) / lastWeek.length) * 100 : 0;
    const thisWeekCust = new Set(thisWeek.map(c => c.customer_phone)).size;
    const lastWeekCust = new Set(lastWeek.map(c => c.customer_phone)).size;
    const custTrend = lastWeekCust > 0 ? ((thisWeekCust - lastWeekCust) / lastWeekCust) * 100 : 0;

    const stats = {
      totalRevenue, totalCheckins, avgTicket, avgRating, totalRatings: ratings.length,
      activeQueue, uniqueCustomers,
      trends: { revenue: revTrend, checkins: checkinTrend, customers: custTrend }
    };

    // Daily data (30 days)
    const dailyData = Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayCheckins = checkins.filter(c => c.check_in_date === dateStr);
      return {
        date: format(d, 'MMM dd'),
        revenue: dayCheckins.filter(isPaid).reduce((s, c) => s + (c.service_price || 0), 0),
        checkins: dayCheckins.length
      };
    });

    // Service distribution (pie)
    const svcMap = {};
    checkins.forEach(c => {
      if (!c.service_name) return;
      svcMap[c.service_name] = (svcMap[c.service_name] || 0) + 1;
    });
    const serviceData = Object.entries(svcMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

    // Payment methods (donut)
    const payMap = {};
    checkins.forEach(c => {
      const method = c.payment_method === 'online' ? 'Online' : 'In-Person';
      payMap[method] = (payMap[method] || 0) + 1;
    });
    const paymentData = Object.entries(payMap).map(([name, value]) => ({ name, value }));

    // Top services by revenue (horizontal bar)
    const revBySvc = {};
    checkins.forEach(c => {
      if (!c.service_name) return;
      revBySvc[c.service_name] = (revBySvc[c.service_name] || 0) + (isPaid(c) ? (c.service_price || 0) : 0);
    });
    const topServicesData = Object.entries(revBySvc).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

    // Weekly traffic (radar)
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const dayMap = [0,0,0,0,0,0,0];
    recent.forEach(c => {
      if (!c.check_in_date) return;
      dayMap[new Date(c.check_in_date).getDay()]++;
    });
    const weeklyData = dayNames.map((day, i) => ({ day, count: dayMap[i] }));

    // Rating distribution (bar)
    const ratingBuckets = { '1★': 0, '2★': 0, '3★': 0, '4★': 0, '5★': 0 };
    recent.forEach(c => {
      if (!c.rating) return;
      const key = `${c.rating}★`;
      if (ratingBuckets[key] !== undefined) ratingBuckets[key]++;
    });
    const ratingData = Object.entries(ratingBuckets).map(([rating, count]) => ({ rating, count }));

    // Membership vs walk-in (grouped bar)
    const memberC = recent.filter(c => c.membership_used);
    const walkinC = recent.filter(c => !c.membership_used);
    const memberRev = memberC.filter(isPaid).reduce((s, c) => s + (c.service_price || 0), 0);
    const walkinRev = walkinC.filter(isPaid).reduce((s, c) => s + (c.service_price || 0), 0);
    const membershipData = [
      { name: 'Member', revenue: memberRev, count: memberC.length },
      { name: 'Walk-in', revenue: walkinRev, count: walkinC.length }
    ];

    // Status pipeline (donut)
    const statusLabels = { checked_in: 'Checked In', waiting: 'Waiting', in_progress: 'In Progress', ready: 'Ready', done: 'Done', cancelled: 'Cancelled' };
    const statusMap = {};
    checkins.forEach(c => {
      const s = c.status || 'unknown';
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    const statusData = Object.entries(statusMap).map(([key, value]) => ({ name: statusLabels[key] || key, value }));

    // Service popularity month-over-month (last 6 months)
    const monthLabels = [];
    const monthKeys = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      monthKeys.push(d.toISOString().split('T')[0].slice(0, 7));
      monthLabels.push(format(d, 'MMM'));
    }
    const trendSvcNames = topServicesData.slice(0, 5).map(s => s.name);
    const serviceTrendData = monthKeys.map((mk, i) => {
      const row = { month: monthLabels[i] };
      trendSvcNames.forEach(name => { row[name] = 0; });
      recent.forEach(c => {
        if (!c.service_name || !c.check_in_date) return;
        const ck = c.check_in_date.slice(0, 7);
        if (ck === mk && trendSvcNames.includes(c.service_name)) row[c.service_name]++;
      });
      return row;
    });

    return { stats, dailyData, serviceData, paymentData, topServicesData, weeklyData, ratingData, membershipData, statusData, serviceTrendData, trendSvcNames };
  }, [checkins]);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Business performance overview — last 30 days</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <StatCards stats={m.stats} />

          <div className="grid lg:grid-cols-2 gap-5 mb-5">
            <RevenueAreaChart data={m.dailyData} loading={false} />
            <VolumeBarChart data={m.dailyData} loading={false} />
          </div>

          <div className="grid lg:grid-cols-3 gap-5 mb-5">
            <ServicePieChart data={m.serviceData} loading={false} />
            <PaymentDonut data={m.paymentData} loading={false} />
            <StatusChart data={m.statusData} loading={false} />
          </div>

          <div className="grid lg:grid-cols-2 gap-5 mb-5">
            <TopServicesChart data={m.topServicesData} loading={false} />
            <WeeklyTrafficChart data={m.weeklyData} loading={false} />
          </div>

          <div className="grid lg:grid-cols-2 gap-5 mb-5">
            <RatingChart data={m.ratingData} loading={false} />
            <MembershipChart data={m.membershipData} loading={false} />
          </div>

          <ServiceTrendChart data={m.serviceTrendData} services={m.trendSvcNames} loading={false} />
        </>
      )}
    </div>
  );
}
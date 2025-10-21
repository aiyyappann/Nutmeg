import { useState, useEffect } from "react";
import { useAppContext } from "../App";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, Title, Tooltip, Legend, PointElement, Filler } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Users, CheckCircle, Headphones, IndianRupee } from "lucide-react";
import ActivityTimeline from '../components/ActivityTimeline';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
  const { dataProvider } = useAppContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dataProvider.getStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dataProvider]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: stats?.monthlyCustomers ? Object.keys(stats.monthlyCustomers) : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Customers',
        data: stats?.monthlyCustomers ? Object.values(stats.monthlyCustomers) : [12, 19, 15, 25, 22, 30],
        backgroundColor: 'rgba(70, 123, 244, 0.5)',
        borderColor: 'rgb(70, 123, 244)',
        borderWidth: 1,
      },
    ],
  };

  const lineChartData = {
    labels: stats?.monthlyRevenue ? Object.keys(stats.monthlyRevenue) : ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Revenue (₹)',
        data: stats?.monthlyRevenue ? Object.values(stats.monthlyRevenue) : [12000, 19000, 15000, 25000],
        fill: false,
        borderColor: 'rgb(70, 123, 244)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Dashboard Overview</h1>
        <button className="btn btn-primary">
          Generate Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card kpi-card">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-subtitle mb-2 text-muted">Total Customers</h6>
                  <div className="kpi-value">{stats?.totalCustomers || 0}</div>
                </div>
                <div className="align-self-center">
                  <Users size={32} className="text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card kpi-card">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-subtitle mb-2 text-muted">Active Customers</h6>
                  <div className="kpi-value">{stats?.activeCustomers || 0}</div>
                </div>
                <div className="align-self-center">
                  <CheckCircle size={32} className="text-success" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card kpi-card">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-subtitle mb-2 text-muted">Open Tickets</h6>
                  <div className="kpi-value">{stats?.openTickets || 0}</div>
                </div>
                <div className="align-self-center">
                  <Headphones size={32} className="text-warning" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card kpi-card">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-subtitle mb-2 text-muted">Total Revenue</h6>
                  <div className="kpi-value">₹{stats?.totalRevenue?.toLocaleString() || '0'}</div>
                </div>
                <div className="align-self-center">
                  <IndianRupee size={32} className="text-success" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Monthly Customer Growth</h5>
            </div>
            <div className="card-body">
              <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} height={200} />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Weekly Revenue Trend</h5>
            </div>
            <div className="card-body">
              <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} height={200} />
            </div>
          </div>
        </div>
      </div>


      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Recent Activity</h5>
        </div>
        <div className="card-body">
  {/* Inject dynamic timeline instead of static markup */}
          <ActivityTimeline autoRefresh={false} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./style.module.css";

const QueryRunner = () => {
  const [instances, setInstances] = useState([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState("");
  const [instanceDetails, setInstanceDetails] = useState({
    name: "",
    instanceUrl: "",
    username: "",
    password: "",
    description: ""
  });
  const [sqlQuery, setSqlQuery] = useState("");
  const [result, setResult] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🧱 Fetch all saved instances
  useEffect(() => {
    const fetchInstances = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in first.");
        return;
      }
      try {
        const res = await axios.get("https://sqlrunner-ude4.onrender.com/api/instances", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInstances(res.data.instances || []);
      } catch (err) {
        console.error(err);
        setError("Error fetching instances.");
      }
    };
    fetchInstances();
  }, []);

  // 🧩 When user selects an instance, fetch its details
  const handleInstanceSelect = async (e) => {
    const instanceId = e.target.value;
    setSelectedInstanceId(instanceId);

    if (!instanceId) {
      setInstanceDetails({
        name: "",
        instanceUrl: "",
        username: "",
        password: "",
        description: ""
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`https://sqlrunner-ude4.onrender.com/api/instances/${instanceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { name, instanceUrl, username, password, description } = res.data.instance;
      setInstanceDetails({ name, instanceUrl, username, password, description });
      console.log("🔍 Selected Instance:", { name, instanceUrl, username, password });
    } catch (err) {
      console.error("Error fetching instance details:", err);
      setError("Failed to fetch instance details.");
    }
  };

  // ▶ Run SQL query
  const handleRun = async () => {
    if (!selectedInstanceId || !sqlQuery.trim()) {
      setError("Please select an instance and enter SQL query.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult([]);

    try {
      const token = localStorage.getItem("token");
      const encodedSqlQuery = btoa(sqlQuery);

      const res = await axios.post(
        "https://sqlrunner-ude4.onrender.com/api/instances/sqlrunner/run",
        {
          instanceId: selectedInstanceId,
          encodedQuery: encodedSqlQuery,
          instanceDetails,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ Extract nested ROW array safely
      const rows = res.data?.result?.ROWSET?.ROW;
      const formattedRows = Array.isArray(rows) ? rows : rows ? [rows] : [];

      // ✅ Clean up "null" values
      const cleanRows = formattedRows.map(row => {
        const cleanRow = {};
        for (const [key, value] of Object.entries(row)) {
          cleanRow[key] = (value === "null" || value == null) ? "" : value;
        }
        return cleanRow;
      });

      setResult(cleanRows);
    } catch (err) {
      console.error(err);
      setError("Error executing SQL query.");
    } finally {
      setLoading(false);
    }
  };

  // 🔗 Navigation
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };
  const handleHome = () => window.location.href = "/";
  const handleInstances = () => window.location.href = "/instances";

  return (
    <div className={styles.container}>
      {/* 🧭 Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>🧠 SQL Runner</div>
        <div className={styles.navItems}>
          <button className={styles.nav_btn} onClick={handleHome}>Dashboard</button>
          <button className={styles.nav_btn} onClick={handleInstances}>Instances</button>
          <button className={styles.nav_btn}>SQL Runner</button>
          <button className={styles.logout_btn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Header
      <header className={styles.header}>
        <h2>Run SQL Queries on Fusion Instances</h2>
        <p className={styles.subtitle}>
          Select an instance, write your SQL query, and view results instantly.
        </p>
      </header> */}

      {/* SQL Section */}
      <section className={styles.sqlSection}>
        <div className={styles.sqlControls}>
          <label>Select Instance:</label>
          <select value={selectedInstanceId} onChange={handleInstanceSelect}>
            <option value="">-- Choose Instance --</option>
            {instances.map((inst) => (
              <option key={inst._id} value={inst._id}>{inst.name}</option>
            ))}
          </select>
        </div>

        {/* Display Selected Instance Info */}
        {/* {instanceDetails.name && (
          <div className={styles.instanceDetails}>
            <p><strong>Name:</strong> {instanceDetails.name}</p>
            <p><strong>URL:</strong> {instanceDetails.instanceUrl}</p>
            <p><strong>Username:</strong> {instanceDetails.username}</p>
            <p><strong>Password:</strong> {instanceDetails.password}</p>
            <p><strong>Description:</strong> {instanceDetails.description}</p>
          </div>
        )} */}

        <textarea
          className={styles.sqlTextarea}
          placeholder="Write your SQL query here..."
          value={sqlQuery}
          onChange={(e) => setSqlQuery(e.target.value)}
        />

        <button className={styles.primary_btn} onClick={handleRun} disabled={loading}>
          {loading ? "Running..." : "▶ Run SQL"}
        </button>

        {error && <p className={styles.error}>{error}</p>}
      </section>

      {/* Results Section */}
      {Array.isArray(result) && result.length > 0 && (
        <section className={styles.resultsSection}>
          <h3>📊 Query Results</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.resultsTable}>
              <thead>
                <tr>
                  {Object.keys(result[0]).map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default QueryRunner;

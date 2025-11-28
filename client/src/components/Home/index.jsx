import styles from "./style.module.css";
import { useState, useEffect } from "react";
import axios from "axios";

const Home = () => {
  const [username, setUsername] = useState(null);
  const [error, setError] = useState(null);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No token found. Please log in.");
        return;
      }

      try {
        const res = await axios.get("https://sqlrunner-ude4.onrender.com/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsername(res.data.username);
      } catch (err) {
        console.error("Error fetching user data", err);
        setError("Failed to fetch user data.");
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";  
  };
  const handleInstaces = () => {
    // localStorage.removeItem("token");
    window.location.href = "/instances";  
  };
    const handleSQLRunner = () => {
    // localStorage.removeItem("token");
    window.location.href = "/SQLRunner";  
  };


  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>🧠 SQL Runner</div>
        <div className={styles.navItems}>
          <button className={styles.nav_btn}>Dashboard</button>
          <button className={styles.nav_btn} onClick={handleInstaces}>Instances</button>
          <button className={styles.nav_btn}>Queries</button>
          <button className={styles.logout_btn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className={styles.header}>
        {error ? (
          <p className={styles.error}>{error}</p>
        ) : (
          <h2>
            Welcome back, <span className={styles.username}>{username || "..."}</span>
          </h2>
        )}
        <p className={styles.subtitle}>
          Execute your SQL scripts securely, visualize results, and manage instances — all in one place.
        </p>
      </header>

      {/* Dashboard Cards (placeholder for future features) */}
      <section className={styles.dashboard}>
        <div className={styles.card}>
          <h3>🧾 Run SQL</h3>
          <p>Open the SQL editor and execute your queries instantly.</p>
          <button className={styles.primary_btn} onClick={handleSQLRunner}>Open Editor</button>
        </div>

        <div className={styles.card}>
          <h3>💾 Manage Instances</h3>
          <p>View and manage your connected database instances.</p>
          <button className={styles.primary_btn}  onClick={handleInstaces}>View Instances</button>
        </div>

        <div className={styles.card}>
          <h3>📊 Query History</h3>
          <p>Access previously executed queries and analytics.</p>
          <button className={styles.primary_btn}>In progress</button>
        </div>
      </section>
    </div>
  );
};

export default Home;

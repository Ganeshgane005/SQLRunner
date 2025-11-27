import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./style.module.css";

const InstancesPage = () => {
  const [instances, setInstances] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newInstance, setNewInstance] = useState({
    name: "",
    instanceUrl: "",  // <-- matches backend schema
    username: "",
    password: "",
    description: "",
  });

  // Fetch user instances
  useEffect(() => {
    const fetchInstances = async () => {
      const token = localStorage.getItem("token");
      if (!token) return setError("Please log in first.");

      try {
        const response = await axios.get("http://localhost:8080/api/instances", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInstances(response.data.instances || []);
      } catch (err) {
        console.error(err);
        setError("Error fetching instances.");
      }
    };

    fetchInstances();
  }, []);

  // Navbar actions
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleHome = () => {
    window.location.href = "/";
  };

  // Add instance popup
  const handleAddInstance = () => setShowAddPopup(true);

  // Save new instance
  const handleSaveInstance = async () => {
    const token = localStorage.getItem("token");
    if (!newInstance.name || !newInstance.instanceUrl)
      return setError("Please fill in all required fields.");

    try {
      const response = await axios.post(
        "http://localhost:8080/api/instances",
        newInstance,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInstances((prev) => [...prev, response.data.instance]);
      setShowAddPopup(false);
      setNewInstance({ name: "", instanceUrl: "", username: "", password: "", description: "" });
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to add instance.");
    }
  };

  // Delete instance
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Are you sure you want to delete this instance?")) return;

    try {
      await axios.delete(`http://localhost:8080/api/instances/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInstances((prev) => prev.filter((i) => i._id !== id));
      setShowPopup(false);
    } catch (err) {
      console.error(err);
      setError("Failed to delete instance.");
    }
  };

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>🧠 SQL Runner</div>
        <div className={styles.navItems}>
          <button className={styles.nav_btn} onClick={handleHome}>Dashboard</button>
          <button className={styles.nav_btn}>Instances</button>
          <button className={styles.nav_btn}>Queries</button>
          <button className={styles.logout_btn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Header */}
      <header className={styles.header}>
        <h2>Manage Your Database Instances</h2>
        <p className={styles.subtitle}>
          View, connect, and manage all your SQL environments in one place.
        </p>
      </header>

      {/* Add button */}
      <div className={styles.headerActions}>
        <button className={styles.primary_btn} onClick={handleAddInstance}>
          + Add Instance
        </button>
      </div>

      {/* Error */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Instances Grid */}
      <section className={styles.grid}>
        {instances.length > 0 ? (
          instances.map((instance) => (
            <div
              key={instance._id}
              className={styles.card}
              onClick={() => {
                setSelectedInstance(instance);
                setShowPopup(true);
              }}
            >
              <h3>🗄️ {instance.name}</h3>
              <p>{instance.instanceUrl}</p>
            </div>
          ))
        ) : (
          <p className={styles.noInstances}>No instances found.</p>
        )}
      </section>

      {/* Instance Details Popup */}
      {showPopup && selectedInstance && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupBox}>
            <h2>{selectedInstance.name}</h2>
            <div className={styles.popupDetails}>
              <p><strong>URL:</strong> {selectedInstance.instanceUrl}</p>
              <p><strong>Username:</strong> {selectedInstance.username}</p>
              <p><strong>Password:</strong> {selectedInstance.password}</p>
              <p><strong>Description:</strong> {selectedInstance.description}</p>
            </div>
            <div className={styles.popupActions}>
              <button
                className={styles.delete_btn}
                onClick={() => handleDelete(selectedInstance._id)}
              >
                Delete
              </button>
              <button
                className={styles.close_btn}
                onClick={() => setShowPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Instance Popup */}
      {showAddPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupBox}>
            <h2>Add New Instance</h2>
            <input
              type="text"
              placeholder="Instance Name"
              value={newInstance.name}
              onChange={(e) => setNewInstance({ ...newInstance, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Instance URL"
              value={newInstance.instanceUrl}
              onChange={(e) => setNewInstance({ ...newInstance, instanceUrl: e.target.value })}
            />
            <input
              type="text"
              placeholder="Username"
              value={newInstance.username}
              onChange={(e) => setNewInstance({ ...newInstance, username: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              value={newInstance.password}
              onChange={(e) => setNewInstance({ ...newInstance, password: e.target.value })}
            />
            <input
              type="text"
              placeholder="Description"
              value={newInstance.description}
              onChange={(e) => setNewInstance({ ...newInstance, description: e.target.value })}
            />
            {error && (
            <div className={styles.errorMessage}>
               <p>{error}</p>
            </div>
             )}
            <div className={styles.popupActions}>
              <button className={styles.primary_btn} onClick={handleSaveInstance}>Save</button>
              <button className={styles.close_btn} onClick={() => setShowAddPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstancesPage;

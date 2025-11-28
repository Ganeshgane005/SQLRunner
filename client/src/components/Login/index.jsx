import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import styles from "./styles.module.css";

const Login = () => {
  const [data, setData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = ({ currentTarget: input }) => {
    setData({ ...data, [input.name]: input.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = "https://sqlrunner-ude4.onrender.com/api/auth";
      const { data: res } = await axios.post(url, data);
      localStorage.setItem("token", res.data);
      window.location = "/";
    } catch (error) {
      if (error.response && error.response.status >= 400) {
        setError(error.response.data.message);
      }
    }
  };

  return (
    <div className={styles.auth_container}>
      <div className={styles.auth_card}>
        <div className={styles.auth_left}>
          <h1 className={styles.logo}>🧠 SQL Runner</h1>
          <p className={styles.tagline}>Run SQL. Get Results. Instantly.</p>
        </div>

        <div className={styles.auth_right}>
          <form className={styles.form_container} onSubmit={handleSubmit}>
            <h2>Login to Your Account</h2>

            <input
              type="email"
              placeholder="Email"
              name="email"
              onChange={handleChange}
              value={data.email}
              required
              className={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
              onChange={handleChange}
              value={data.password}
              required
              className={styles.input}
            />

            {error && <div className={styles.error_msg}>{error}</div>}

            <button type="submit" className={styles.primary_btn}>
              Sign In
            </button>

            <p className={styles.switch_text}>
              New user?{" "}
              <Link to="/signup" className={styles.link}>
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

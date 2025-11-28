import styles from "./styles.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

const Signup = () => {
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false); // To track if the form is valid
  const [isSendingOtp, setIsSendingOtp] = useState(false); // To disable "Send OTP" button while sending OTP
  const navigate = useNavigate();

  // Password validation function
  const validatePassword = (password) => {
    const symbolRegex = /[!@#$%^&*(),.?":{}|<>]/; // Regex for symbols
    const minLength = 6;

    if (password.length < minLength) {
      return `Password must be at least ${minLength} characters long.`;
    }

    if (!symbolRegex.test(password)) {
      return "Password must contain at least one symbol (e.g., !, @, #, etc.).";
    }

    return ""; // No error
  };

  const handleChange = ({ currentTarget: input }) => {
    // If the input is password, validate it
    if (input.name === "password") {
      const passwordError = validatePassword(input.value);
      setError(passwordError); // Set error if validation fails
    }

    setData({ ...data, [input.name]: input.value });
  };

  const handleOtpChange = (e) => setOtp(e.target.value);

  const handleSendOtp = async () => {
    setIsSendingOtp(true); // Disable button during OTP sending
    try {
      await axios.post("https://sqlrunner-ude4.onrender.com/api/users/send-otp", {
        email: data.email,
      });
      setOtpSent(true);
    } catch (error) {
      if (error.response) setError(error.response.data.message);
    } finally {
      setIsSendingOtp(false); // Re-enable the button after sending OTP
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("https://sqlrunner-ude4.onrender.com/api/users/verify-otp", {
        email: data.email,
        otp,
      });
      await axios.post("https://sqlrunner-ude4.onrender.com/api/users", data);
      navigate("/login");
    } catch (error) {
      if (error.response) setError(error.response.data.message);
    }
  };

  // UseEffect to validate form fields and enable/disable buttons
  useEffect(() => {
    const isValidPassword = !error && data.password.length > 0; // Check if password is valid
    const isValidForm =
      data.firstName &&
      data.lastName &&
      data.email &&
      isValidPassword; // Check if all required fields are filled

    setIsFormValid(isValidForm); // Set form validity status
  }, [data, error]);

  return (
    <div className={styles.auth_container}>
      <div className={styles.auth_card}>
        <div className={styles.auth_left}>
          <h1 className={styles.logo}>🧠 SQL Runner</h1>
          <p className={styles.tagline}>Secure. Simple. Smart SQL.</p>
        </div>

        <div className={styles.auth_right}>
          <form className={styles.form_container} onSubmit={handleSubmit}>
            <h2>Create Account</h2>

            <input
              type="text"
              placeholder="First Name"
              name="firstName"
              onChange={handleChange}
              value={data.firstName}
              required
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Last Name"
              name="lastName"
              onChange={handleChange}
              value={data.lastName}
              required
              className={styles.input}
            />
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

            {otpSent ? (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={handleOtpChange}
                  required
                  className={styles.input}
                />
                <button
                  type="submit"
                  className={styles.primary_btn}
                  disabled={otp.length === 0} // Disable if OTP is empty
                >
                  Verify & Sign Up
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.primary_btn}
                onClick={handleSendOtp}
                disabled={!isFormValid || isSendingOtp} // Disable Send OTP button if form is invalid or OTP is being sent
              >
                {isSendingOtp ? "Sending..." : "Send OTP"}
              </button>
            )}

            <p className={styles.switch_text}>
              Already have an account?{" "}
              <Link to="/login" className={styles.link}>
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;

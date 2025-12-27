import { Link } from "react-router-dom";
import {Button } from "react-bootstrap"
import { ThemeProvider } from "./context/ThemeContext";

export default function Success() {
  return (
    <div className="w-100 vh-100 d-flex flex-column justify-content-center align-items-center text-center text-green-700">
      <div className="mb-5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100"
          height="100"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          color="green"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M16 12l-4 4-2-2" />
        </svg>
      </div>

      <h1 className="text-3xl font-semibold mb-4 " style={{ color: "green" }}>
        Your order was successfully placed!
      </h1>

      <Link to="/" className="px-6 py-3 text-lg rounded-xl transition-all">
        <Button variant="success">Go To Home</Button>
      </Link>
    </div>
  );
}

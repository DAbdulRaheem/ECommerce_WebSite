import { Link } from "react-router-dom";
import {Button } from "react-bootstrap"
import { ThemeProvider } from "./context/ThemeContext";

export default function Unknown() {
  return (
    <div className="w-100 vh-100 d-flex flex-column justify-content-center  align-items-center  text-center">
      {/* <img
        src="https://rukminim1.flixcart.com/www/800/800/promos/16/05/2019/d438a32e-765a-4d8b-b4a6-520b560971e8.png?q=90"
        alt="Unknown Page"
        className="w-[300px] h-auto mb-6 opacity-95"
        borderRadius="100px"
      /> */}

    <img
        src="https://rukminim1.flixcart.com/www/800/800/promos/16/05/2019/d438a32e-765a-4d8b-b4a6-520b560971e8.png?q=90"
        alt="Unknown Page"
        className="w-[300px] h-auto mb-6 opacity-95"
        style={{
          borderRadius: "20px"    
        }}
      />

      <h1 className="text-3xl font-semibold text-gray-700 mb-4">
        Oops! Page Not Found
      </h1>

      <Link
        to="/"
        className="px-6 py-3 bg-blue-600 text-white text-lg rounded-xl hover:bg-blue-700 transition-all"
      >
      <Button variant="primary">Go To Home</Button>
      </Link>
    </div>
  );
}

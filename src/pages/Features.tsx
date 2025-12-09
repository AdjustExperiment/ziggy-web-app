import { Navigate } from "react-router-dom";

// Features page content has been merged into Home page
// Redirect to home for any existing links
const Features = () => {
  return <Navigate to="/" replace />;
};

export default Features;

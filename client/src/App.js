import { Route, Routes, Navigate } from "react-router-dom";
import Home from "./components/Home";
import Signup from "./components/Signup";
import Login from "./components/Login";
import InstancesPage from "./components/InstancesPage";
import QueryRunner from "./components/QueryRunner";


function App() {
	const user = localStorage.getItem("token");

	return (
		<Routes>
			{user && <Route path="/" exact element={<Home />} />}
			<Route path="/signup" exact element={<Signup />} />
			<Route path="/login" exact element={<Login />} />
			<Route path="/" element={<Navigate replace to="/login" />} />
			<Route path="/instances" element={<InstancesPage/>} />
			<Route path="/SQLRunner" element={<QueryRunner />} />
		</Routes>
	);
}

export default App;
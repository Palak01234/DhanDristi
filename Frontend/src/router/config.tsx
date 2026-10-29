import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Splash from "../pages/splash/page";
import Onboarding from "../pages/onboarding/page";
import Login from "../pages/auth/login/page";
import Signup from "../pages/auth/signup/page";
import AuthChoice from "../pages/auth/choice/page";
import CurrencyPreference from "../pages/preferences/currency/page";
import DenominationPreference from "../pages/preferences/denomination/page";
import Home from "../pages/home/page";
import Scanner from "../pages/scanner/page";
import Result from "../pages/scan/result/page";
import CounterfeitCheck from "../pages/scan/counterfeit/page";
import Convert from "../pages/convert/page";
import History from "../pages/history/page";
import Settings from "../pages/settings/page";
import Profile from "../pages/profile/page";
import Help from "../pages/help/page";
import Admin from "../pages/admin/page";
import DenominationDetail from "../pages/denomination/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Splash />,
  },
  {
    path: "/onboarding",
    element: <Onboarding />,
  },
  {
    path: "/account",
    element: <AuthChoice />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/preferences/currency",
    element: <CurrencyPreference />,
  },
  {
    path: "/preferences/denomination",
    element: <DenominationPreference />,
  },
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: "/scan",
    element: <Scanner />,
  },
  {
    path: "/scan/result",
    element: <Result />,
  },
  {
    path: "/scan/counterfeit",
    element: <CounterfeitCheck />,
  },
  {
    path: "/convert",
    element: <Convert />,
  },
  {
    path: "/history",
    element: <History />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    path: "/help",
    element: <Help />,
  },
  {
    path: "/admin",
    element: <Admin />,
  },
  {
    path: "/denomination/:currency/:denomination",
    element: <DenominationDetail />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
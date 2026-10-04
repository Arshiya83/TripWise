import { Outlet, ScrollRestoration } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/**
 * MainLayout — wraps every page with the global Navbar and Footer.
 * <Outlet /> renders the active child route.
 */
function MainLayout() {
  return (
    <>
      <Navbar />
      <main id="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </>
  );
}

export default MainLayout;

import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function MainLayout() {
  const location = useLocation();
  const isAuthRoute = ['/', '/login', '/register'].includes(location.pathname);

  return (
    <>
      {!isAuthRoute && <Navbar />}
      <main id="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
      {!isAuthRoute && <Footer />}
      <ScrollRestoration />
    </>
  );
}

export default MainLayout;

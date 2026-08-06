import CookieBanner from '../../components/Cookies/CookieBanner';
import Footer from '../../components/Footer/Footer';
import SmartHeader from '../../components/Header/SmartHeader';
import WhatsAppFab from '../../components/ui/WhatsAppFab';

/** Chrome de la web pública. El panel de administración vive fuera del grupo. */
export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmartHeader />
      {children}
      <Footer />
      <WhatsAppFab />
      <CookieBanner />
    </>
  );
}

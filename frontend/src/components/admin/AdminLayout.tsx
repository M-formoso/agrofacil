import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

export function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <AdminSidebar />
      <div className="flex-1 min-w-0 min-h-screen flex flex-col">
        <AdminTopbar />
        <main className="flex-1 flex flex-col p-3 sm:p-4 lg:p-8 pb-safe">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex-1 flex flex-col min-h-0"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

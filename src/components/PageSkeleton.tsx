import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

type Variant = 'menu' | 'dashboard' | 'exam' | 'library';

const shimmer = {
  initial: { opacity: 0.5 },
  animate: { opacity: 1, transition: { duration: 0.8, repeat: Infinity, repeatType: 'reverse' as const } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const Header = () => (
  <motion.div variants={fadeUp} className="sticky top-0 z-50 border-b border-border/20 bg-background/90 px-4 h-14 sm:h-16 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <Skeleton className="h-5 w-32 rounded" />
    </div>
    <Skeleton className="h-8 w-8 rounded-full" />
  </motion.div>
);

const MenuSkeleton = () => (
  <motion.div initial="initial" animate="animate" variants={stagger} className="min-h-screen bg-background flex flex-col">
    <Header />
    <div className="flex-1 container py-6 sm:py-10 px-4">
      <motion.div variants={fadeUp} className="text-center mb-8 sm:mb-12 space-y-3">
        <Skeleton className="h-3 w-24 mx-auto rounded" />
        <Skeleton className="h-8 w-64 mx-auto rounded" />
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-5xl mx-auto">
        <motion.div variants={fadeUp} className="col-span-1 sm:col-span-2 rounded-2xl border border-border/20 p-6 sm:p-8 space-y-4">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-3 w-full rounded" />
        </motion.div>
        {[0, 1].map(i => (
          <motion.div key={i} variants={fadeUp} className="rounded-2xl border border-border/20 p-5 sm:p-6 space-y-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-full rounded" />
          </motion.div>
        ))}
        <motion.div variants={fadeUp} className="col-span-1 sm:col-span-2 lg:col-span-4 rounded-2xl border border-border/20 p-4 sm:p-5 flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
          </div>
        </motion.div>
      </div>
    </div>
  </motion.div>
);

const DashboardSkeleton = () => (
  <motion.div initial="initial" animate="animate" variants={stagger} className="min-h-screen bg-background flex flex-col">
    <Header />
    <div className="flex-1 container py-6 px-4">
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} className="rounded-2xl border border-border/20 p-6 space-y-5">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
        </motion.div>
        <motion.div variants={fadeUp} className="rounded-2xl border border-border/20 p-6 space-y-4">
          <Skeleton className="h-5 w-32 rounded" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full rounded" style={{ width: `${85 - i * 8}%` }} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </motion.div>
);

const ExamSkeleton = () => (
  <motion.div initial="initial" animate="animate" variants={stagger} className="min-h-screen bg-background flex flex-col">
    <Header />
    <div className="flex-1 container py-6 px-4">
      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        <motion.div variants={fadeUp} className="rounded-2xl border border-border/20 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </motion.div>
        <motion.div variants={fadeUp} className="rounded-2xl border border-border/20 p-6 flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-3">
            <Skeleton className="h-12 w-12 mx-auto rounded-xl" />
            <Skeleton className="h-4 w-40 mx-auto rounded" />
          </div>
        </motion.div>
      </div>
    </div>
  </motion.div>
);

const LibrarySkeleton = () => (
  <motion.div initial="initial" animate="animate" variants={stagger} className="min-h-screen bg-background">
    <Header />
    <div className="container mx-auto px-4 py-8">
      <motion.div variants={fadeUp} className="max-w-6xl mx-auto rounded-2xl border border-border/20 p-6 space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-3 w-28 rounded" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <motion.div key={i} variants={fadeUp} className="flex items-center justify-between rounded-lg border border-border/20 p-3">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-48 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  </motion.div>
);

const skeletonMap: Record<Variant, React.FC> = {
  menu: MenuSkeleton,
  dashboard: DashboardSkeleton,
  exam: ExamSkeleton,
  library: LibrarySkeleton,
};

const PageSkeleton = ({ variant }: { variant: Variant }) => {
  const Component = skeletonMap[variant];
  return <Component />;
};

export default PageSkeleton;

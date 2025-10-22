import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface FeatureShowcaseProps {
  featureId: string;
}

export function FeatureShowcase({ featureId }: FeatureShowcaseProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="p-8">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Interactive Demo</h3>
          <p className="text-gray-600">Feature showcase for {featureId}</p>
        </div>
      </Card>
    </motion.div>
  );
}
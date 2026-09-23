import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SummaryCardProps {
  total: number;
  pending: number;
  completed: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  total,
  pending,
  completed,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{total}</Text>
        <Text style={styles.statLabel}>Total Tasks</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, styles.pendingColor]}>{pending}</Text>
        <Text style={styles.statLabel}>Pending</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, styles.completedColor]}>
          {completed}
        </Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginVertical: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },
  pendingColor: {
    color: '#EA580C',
  },
  completedColor: {
    color: '#16A34A',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: '#E2E8F0',
  },
});

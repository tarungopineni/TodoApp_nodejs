import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PriorityBadgeProps {
  priority: number;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const getPriorityInfo = (level: number) => {
    switch (level) {
      case 5:
      case 4:
        return { label: `Priority ${level} (High)`, bg: '#FEE2E2', color: '#DC2626' };
      case 3:
        return { label: `Priority ${level} (Med)`, bg: '#FEF3C7', color: '#D97706' };
      case 2:
      case 1:
      default:
        return { label: `Priority ${level} (Low)`, bg: '#E0E7FF', color: '#4338CA' };
    }
  };

  const info = getPriorityInfo(priority);

  return (
    <View style={[styles.badge, { backgroundColor: info.bg }]}>
      <Text style={[styles.text, { color: info.color }]}>{info.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  complete: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ complete }) => {
  return (
    <View
      style={[
        styles.badge,
        complete ? styles.completedBg : styles.pendingBg,
      ]}>
      <Text
        style={[
          styles.text,
          complete ? styles.completedText : styles.pendingText,
        ]}>
        {complete ? '✓ Completed' : '• Pending'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  completedBg: {
    backgroundColor: '#DCFCE7',
  },
  pendingBg: {
    backgroundColor: '#FFF7ED',
  },
  completedText: {
    color: '#15803D',
  },
  pendingText: {
    color: '#C2410C',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
